import 'dotenv/config';

/**
 * Skribby Meeting Bot Service
 * Integrates real-time meeting capture and transcription for Google Meet,
 * Microsoft Teams, and Zoom using the Skribby API (https://platform.skribby.io).
 */

const SKRIBBY_BASE_URL = 'https://platform.skribby.io/api/v1';
const DEFAULT_TRANSCRIPTION_MODEL = 'groq/whisper-large-v3-turbo';

/**
 * Map ActionCommander platform names to Skribby service identifiers
 * - Google Meet -> 'gmeet'
 * - Microsoft Teams -> 'teams'
 * - Zoom -> 'zoom'
 */
export function mapPlatformToSkribbyService(platform = '') {
  const p = (platform || '').toLowerCase().replace(/[-_\s]/g, '');
  if (p.includes('google') || p.includes('meet') || p === 'gmeet') {
    return 'gmeet';
  }
  if (p.includes('team') || p === 'msteams' || p === 'teams') {
    return 'teams';
  }
  if (p.includes('zoom')) {
    return 'zoom';
  }
  return 'gmeet';
}

/**
 * Check if Skribby is configured with a valid API key in environment
 */
export function isSkribbyConfigured() {
  const key = process.env.SKRIBBY_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

/**
 * Get Skribby API authorization headers
 */
function getSkribbyHeaders() {
  const apiKey = process.env.SKRIBBY_API_KEY ? process.env.SKRIBBY_API_KEY.trim() : '';
  if (!apiKey) {
    throw new Error('SKRIBBY_API_KEY is not configured in .env file.');
  }

  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * Create and dispatch a Skribby bot to join a live meeting
 * @param {object} params
 * @param {string} params.meetingUrl - The Google Meet, Teams, or Zoom URL
 * @param {string} params.platform - 'Google Meet' | 'Microsoft Teams' | 'Zoom' | 'gmeet' | 'teams' | 'zoom'
 * @param {string} [params.botName] - Optional custom bot name
 * @param {string} [params.transcriptionModel] - Supported model (e.g. 'groq/whisper-large-v3-turbo')
 */
export async function createSkribbyBot({ 
  meetingUrl, 
  platform = 'Google Meet', 
  botName = 'ActionCommander AI',
  transcriptionModel = DEFAULT_TRANSCRIPTION_MODEL
}) {
  if (!isSkribbyConfigured()) {
    throw new Error(
      `Live meeting transcription for ${platform} is not configured.\n` +
      `SKRIBBY_API_KEY is missing in your .env file.\n` +
      `Please configure your SKRIBBY_API_KEY in .env to connect live meeting bots.`
    );
  }

  const service = mapPlatformToSkribbyService(platform);

  const payload = {
    meeting_url: meetingUrl,
    service: service,
    bot_name: botName,
    transcription_model: transcriptionModel || DEFAULT_TRANSCRIPTION_MODEL
  };

  // Optional webhook_url only if explicitly provided in environment
  if (process.env.WEBHOOK_BASE_URL && process.env.WEBHOOK_BASE_URL.trim()) {
    payload.webhook_url = `${process.env.WEBHOOK_BASE_URL.trim().replace(/\/$/, '')}/api/webhooks/skribby`;
  }

  try {
    const response = await fetch(`${SKRIBBY_BASE_URL}/bot`, {
      method: 'POST',
      headers: getSkribbyHeaders(),
      body: JSON.stringify(payload)
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = responseData.error || responseData.detail || responseData.message || JSON.stringify(responseData);
      throw new Error(`Skribby API error (${response.status}): ${errorMsg}`);
    }

    return {
      success: true,
      botId: responseData.id || responseData.bot_id,
      botName: responseData.bot_name || botName,
      service: responseData.service || service,
      status: responseData.status || responseData.state || 'joining',
      meetingUrl: responseData.meeting_url || meetingUrl,
      transcriptionModel: responseData.transcription_model || transcriptionModel,
      raw: responseData
    };
  } catch (err) {
    if (err.message.includes('Skribby API error') || err.message.includes('SKRIBBY_API_KEY')) {
      throw err;
    }
    throw new Error(`Failed to connect to Skribby: ${err.message}`);
  }
}

/**
 * Fetch bot object from Skribby
 * @param {string} botId - The Skribby bot ID
 */
export async function getSkribbyBot(botId) {
  if (!isSkribbyConfigured()) {
    throw new Error('SKRIBBY_API_KEY is not configured in .env file.');
  }

  const response = await fetch(`${SKRIBBY_BASE_URL}/bot/${botId}`, {
    method: 'GET',
    headers: getSkribbyHeaders()
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.detail || data.message || `HTTP ${response.status}`;
    throw new Error(`Skribby API error (${response.status}): ${errorMsg}`);
  }

  return data;
}

/**
 * Get status of an active Skribby bot
 * @param {string} botId - The Skribby bot ID
 */
export async function getSkribbyBotStatus(botId) {
  const data = await getSkribbyBot(botId);

  return {
    botId: data.id || data.bot_id || botId,
    status: data.status || data.state || 'unknown',
    service: data.service,
    meetingUrl: data.meeting_url,
    transcriptionModel: data.transcription_model,
    raw: data
  };
}

/**
 * Retrieve transcript from Skribby for a bot session.
 * In Skribby API, GET /bot/{id} returns the complete bot object including transcript once finished.
 * @param {string} botId - The Skribby bot ID
 */
export async function getSkribbyBotTranscript(botId) {
  const botData = await getSkribbyBot(botId);

  // 1. Check if transcript is included directly in the bot object
  let transcriptRaw = botData.transcript || botData.utterances || botData.segments || botData.results;

  // 2. Fallback check for dedicated sub-endpoint if transcript is not in main bot object
  if (!transcriptRaw && botData.status === 'finished') {
    try {
      const subRes = await fetch(`${SKRIBBY_BASE_URL}/bot/${botId}/transcript`, {
        method: 'GET',
        headers: getSkribbyHeaders()
      });
      if (subRes.ok) {
        const subData = await subRes.json().catch(() => null);
        if (subData) {
          transcriptRaw = subData;
        }
      }
    } catch (e) {
      console.warn('Fallback /bot/:id/transcript request failed:', e.message);
    }
  }

  const formattedTranscript = formatSkribbyTranscript(transcriptRaw || botData);

  return {
    botId: botData.id || botData.bot_id || botId,
    status: botData.status || botData.state || 'unknown',
    service: botData.service,
    meetingUrl: botData.meeting_url,
    transcriptionModel: botData.transcription_model,
    transcript: formattedTranscript,
    raw: botData
  };
}

/**
 * Format Skribby transcript payload into ActionCommander timeline transcript format:
 * [{ time: 'MM:SS', speaker: 'Name', text: 'Utterance' }]
 * @param {Array|object|string} skribbyData - Raw transcript response from Skribby
 */
export function formatSkribbyTranscript(skribbyData) {
  if (!skribbyData) return [];

  // If skribbyData is a raw text transcript string
  if (typeof skribbyData === 'string') {
    const lines = skribbyData.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.map((line, idx) => {
      const match = line.match(/^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*)?(?:([^:]+):\s*)?(.*)$/);
      const timeStr = match && match[1] ? match[1] : `00:${String(idx * 5).padStart(2, '0')}`;
      const speakerStr = match && match[2] ? match[2].trim() : 'Speaker';
      const textStr = match && match[3] ? match[3].trim() : line;
      return {
        time: timeStr,
        speaker: speakerStr,
        text: textStr,
        start: idx * 5,
        end: (idx + 1) * 5,
        speaker_name: speakerStr,
        rawSpeaker: speakerStr
      };
    });
  }

  // If transcript is nested in an object
  const items = Array.isArray(skribbyData) 
    ? skribbyData 
    : (skribbyData.transcript || skribbyData.utterances || skribbyData.segments || skribbyData.results || skribbyData.dialogue || skribbyData.items || []);

  if (!Array.isArray(items) || items.length === 0) {
    if (typeof skribbyData.text === 'string' && skribbyData.text.trim()) {
      return formatSkribbyTranscript(skribbyData.text);
    }
    return [];
  }

  const formattedItems = [];

  items.forEach((entry, idx) => {
    if (typeof entry === 'string') {
      formattedItems.push({
        time: `00:${String(idx * 5).padStart(2, '0')}`,
        speaker: 'Speaker',
        text: entry.trim(),
        start: idx * 5,
        end: (idx + 1) * 5,
        speaker_name: 'Speaker',
        rawSpeaker: 'Speaker'
      });
      return;
    }

    // Determine speaker display name
    let speakerDisplayName = 'Speaker';
    if (entry.speaker_name && typeof entry.speaker_name === 'string' && entry.speaker_name.trim()) {
      speakerDisplayName = entry.speaker_name.trim();
    } else if (entry.user && typeof entry.user === 'string' && entry.user.trim()) {
      speakerDisplayName = entry.user.trim();
    } else if (entry.name && typeof entry.name === 'string' && entry.name.trim()) {
      speakerDisplayName = entry.name.trim();
    } else if (entry.author && typeof entry.author === 'string' && entry.author.trim()) {
      speakerDisplayName = entry.author.trim();
    } else if (entry.speaker !== undefined && entry.speaker !== null) {
      speakerDisplayName = typeof entry.speaker === 'number' 
        ? `Speaker ${entry.speaker + 1}` 
        : String(entry.speaker).trim();
    }

    // Extract utterance text - prioritize entry.transcript, then entry.text, entry.content, entry.message, entry.words
    let text = '';
    if (typeof entry.transcript === 'string') {
      text = entry.transcript;
    } else if (typeof entry.text === 'string') {
      text = entry.text;
    } else if (typeof entry.content === 'string') {
      text = entry.content;
    } else if (typeof entry.message === 'string') {
      text = entry.message;
    } else if (Array.isArray(entry.words)) {
      text = entry.words.map(w => (typeof w === 'string' ? w : (w.text || w.word || w.transcript || ''))).join(' ');
    }

    text = text.trim();
    if (!text) return;

    // Parse start timestamp (priority: entry.start, entry.start_time, entry.start_timestamp, entry.timestamp)
    let startSec = 0;
    if (typeof entry.start === 'number') {
      startSec = entry.start > 36000 ? entry.start / 1000 : entry.start;
    } else if (typeof entry.start_time === 'number') {
      startSec = entry.start_time > 36000 ? entry.start_time / 1000 : entry.start_time;
    } else if (typeof entry.start_timestamp === 'number') {
      startSec = entry.start_timestamp > 500 ? entry.start_timestamp / 1000 : entry.start_timestamp;
    } else if (typeof entry.timestamp === 'number') {
      startSec = entry.timestamp > 500 ? entry.timestamp / 1000 : entry.timestamp;
    } else if (typeof entry.time === 'string' && entry.time.includes(':')) {
      const parts = entry.time.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        startSec = parts[0] * 60 + parts[1];
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        startSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }

    // Parse end timestamp
    let endSec = startSec + 5;
    if (typeof entry.end === 'number') {
      endSec = entry.end > 36000 ? entry.end / 1000 : entry.end;
    } else if (typeof entry.end_time === 'number') {
      endSec = entry.end_time > 36000 ? entry.end_time / 1000 : entry.end_time;
    }

    const totalSecs = Math.max(0, Math.floor(startSec));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    formattedItems.push({
      time: timeStr,
      speaker: speakerDisplayName,
      text: text,
      start: typeof entry.start === 'number' ? entry.start : startSec,
      end: typeof entry.end === 'number' ? entry.end : endSec,
      speaker_name: entry.speaker_name || speakerDisplayName,
      speaker: entry.speaker !== undefined ? entry.speaker : speakerDisplayName,
      rawSpeaker: entry.speaker !== undefined ? entry.speaker : speakerDisplayName
    });
  });

  return formattedItems;
}
