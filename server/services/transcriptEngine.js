import { v4 as uuidv4 } from 'uuid';
import { YoutubeTranscript } from 'youtube-transcript';
import { translateTranscriptItems } from './translationEngine.js';
import { createSkribbyBot, isSkribbyConfigured, getSkribbyBotTranscript } from './skribbyService.js';

/**
 * Transcript Engine
 * Handles real YouTube transcript extraction, oEmbed metadata retrieval,
 * and Skribby meeting bot integration for Google Meet, Microsoft Teams, and Zoom.
 */

export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Handle youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Handle youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Handle youtube.com/shorts/ID or embed/ID or live/ID
  const pathMatch = trimmed.match(/youtube\.com\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1];

  return null;
}

export function detectPlatformAndValidate(url, explicitSource = null, explicitPlatform = null) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Please enter a valid link.' };
  }

  const trimmed = url.trim();
  const normalizedSource = (explicitSource || '').toLowerCase().replace(/[-_]/g, '');
  const normalizedPlatform = (explicitPlatform || '').toLowerCase().replace(/[-_]/g, '');

  // 1. Explicit YouTube Source Requested
  if (normalizedSource === 'youtube') {
    const ytVideoId = extractYouTubeVideoId(trimmed);
    if (!ytVideoId) {
      return {
        valid: false,
        error: 'Invalid YouTube URL. Please provide a valid YouTube video link (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)'
      };
    }
    return {
      valid: true,
      platform: 'YouTube',
      type: 'youtube',
      url: trimmed,
      videoId: ytVideoId
    };
  }

  // 2. Explicit Live Meeting Source Requested (Google Meet, Teams, Zoom)
  if (normalizedSource === 'livemeeting' || normalizedSource === 'meeting') {
    // Check for Google Meet
    if (normalizedPlatform === 'googlemeet' || /meet\.google\.com/i.test(trimmed)) {
      if (!/meet\.google\.com\/[a-z0-9-]+/i.test(trimmed)) {
        return {
          valid: false,
          error: 'Invalid Google Meet URL. Please provide a valid Google Meet link (e.g., https://meet.google.com/abc-defg-hij).'
        };
      }
      return {
        valid: true,
        platform: 'Google Meet',
        type: 'live_meeting',
        url: trimmed
      };
    }

    // Check for Microsoft Teams
    if (normalizedPlatform === 'microsoftteams' || normalizedPlatform === 'teams' || /teams\.(?:microsoft|live)\.com/i.test(trimmed)) {
      if (!/teams\.microsoft\.com\/[a-z0-9-_/]+/i.test(trimmed) && !/teams\.live\.com/i.test(trimmed)) {
        return {
          valid: false,
          error: 'Invalid Microsoft Teams URL. Please provide a valid Microsoft Teams meeting link.'
        };
      }
      return {
        valid: true,
        platform: 'Microsoft Teams',
        type: 'live_meeting',
        url: trimmed
      };
    }

    // Check for Zoom
    if (normalizedPlatform === 'zoom' || /zoom\.(?:us|gov)/i.test(trimmed)) {
      if (!/zoom\.us\/(?:j|my|w)\/[a-z0-9?=_&+-]+/i.test(trimmed) && !/zoomgov\.com/i.test(trimmed)) {
        return {
          valid: false,
          error: 'Invalid Zoom URL. Please provide a valid Zoom meeting link.'
        };
      }
      return {
        valid: true,
        platform: 'Zoom',
        type: 'live_meeting',
        url: trimmed
      };
    }

    return {
      valid: false,
      error: `Unsupported live meeting URL format. Please provide a valid Google Meet, Microsoft Teams, or Zoom link.`
    };
  }

  // 3. Fallback Auto-Detection (when no explicit source was passed)
  const ytVideoId = extractYouTubeVideoId(trimmed);
  if (ytVideoId) {
    return {
      valid: true,
      platform: 'YouTube',
      type: 'youtube',
      url: trimmed,
      videoId: ytVideoId
    };
  }

  if (/meet\.google\.com\/[a-z0-9-]+/i.test(trimmed)) {
    return {
      valid: true,
      platform: 'Google Meet',
      type: 'live_meeting',
      url: trimmed
    };
  }

  if (/teams\.microsoft\.com\/[a-z0-9-_/]+/i.test(trimmed) || /teams\.live\.com/i.test(trimmed)) {
    return {
      valid: true,
      platform: 'Microsoft Teams',
      type: 'live_meeting',
      url: trimmed
    };
  }

  if (/zoom\.us\/(?:j|my|w)\/[a-z0-9?=_&+-]+/i.test(trimmed) || /zoomgov\.com/i.test(trimmed)) {
    return {
      valid: true,
      platform: 'Zoom',
      type: 'live_meeting',
      url: trimmed
    };
  }

  return {
    valid: false,
    error: 'Unsupported URL format. Please provide a valid YouTube URL or a Google Meet, Teams, or Zoom link.'
  };
}

/**
 * Fetch real YouTube video metadata (Title, Author) via public oEmbed API
 */
export async function fetchYouTubeMetadata(videoId, fullUrl) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || 'YouTube Video Session',
        author: data.author_name || 'Presenter',
        thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      };
    }
  } catch (err) {
    console.warn('oEmbed fetch error, fallback to videoId:', err.message);
  }

  return {
    title: `YouTube Video (${videoId})`,
    author: 'YouTube Presenter',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  };
}

/**
 * Format milliseconds/seconds into MM:SS or HH:MM:SS
 */
function formatTime(seconds) {
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Fetch and structure genuine YouTube transcript into cohesive timeline chunks
 */
export async function fetchRealYouTubeTranscript(videoId, metadata) {
  try {
    // 1. Fetch raw caption items
    const rawItems = await YoutubeTranscript.fetchTranscript(videoId);
    if (!rawItems || rawItems.length === 0) {
      throw new Error('No public captions or subtitles were returned for this YouTube video.');
    }

    // 2. Group continuous short caption snippets into cohesive 15-30 second conversational blocks
    const groupedTranscript = [];
    let currentChunk = {
      startTime: 0,
      textParts: [],
      speaker: metadata.author || 'Speaker'
    };

    const maxDurationPerChunk = 25000; // 25 seconds in ms
    let chunkStartOffset = rawItems[0]?.offset || 0;

    rawItems.forEach((item, index) => {
      // Decode HTML entities
      const cleanText = item.text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/[\n\r]+/g, ' ')
        .trim();

      if (!cleanText) return;

      const offsetMs = item.offset;
      const durationMs = item.duration;

      // Check if speaker tag is present like "[Rahul]:" or "Host:"
      let detectedSpeaker = metadata.author || 'Speaker';
      let textWithoutSpeaker = cleanText;
      const speakerMatch = cleanText.match(/^\[?([A-Za-z\s]+)\]?:\s*(.+)$/);
      if (speakerMatch) {
        detectedSpeaker = speakerMatch[1].trim();
        textWithoutSpeaker = speakerMatch[2].trim();
      }

      // Check if we should flush the current chunk
      const timeSinceChunkStart = offsetMs - chunkStartOffset;
      const endsWithSentence = /[.?!]$/.test(cleanText);

      if (timeSinceChunkStart > maxDurationPerChunk || (timeSinceChunkStart > 12000 && endsWithSentence) || index === rawItems.length - 1) {
        currentChunk.textParts.push(textWithoutSpeaker);
        const combinedText = currentChunk.textParts.join(' ').trim();
        
        if (combinedText) {
          groupedTranscript.push({
            time: formatTime(chunkStartOffset / 1000),
            speaker: currentChunk.speaker,
            text: combinedText
          });
        }

        // Reset for next chunk
        chunkStartOffset = offsetMs;
        currentChunk = {
          startTime: offsetMs,
          textParts: [],
          speaker: detectedSpeaker
        };
      } else {
        currentChunk.textParts.push(textWithoutSpeaker);
      }
    });

    // Ensure at least 1 item
    if (groupedTranscript.length === 0 && rawItems.length > 0) {
      groupedTranscript.push({
        time: '00:00',
        speaker: metadata.author || 'Speaker',
        text: rawItems.map(i => i.text).join(' ')
      });
    }

    const lastItem = rawItems[rawItems.length - 1];
    const totalSeconds = (lastItem.offset + lastItem.duration) / 1000;
    const durationStr = `${Math.ceil(totalSeconds / 60)} min`;

    const participants = Array.from(new Set([metadata.author, ...groupedTranscript.map(g => g.speaker)])).filter(Boolean);

    // 3. Automatic Language Detection & English Translation
    const translationResult = await translateTranscriptItems(groupedTranscript, process.env.GEMINI_API_KEY);

    const isTranslated = translationResult.wasTranslated;
    const isFailed = translationResult.translationStatus === 'failed';
    const finalEnglishTranscript = translationResult.englishTranscript || (isFailed ? null : groupedTranscript);
    const finalOriginalTranscript = translationResult.originalTranscript || groupedTranscript;
    const originalLanguage = translationResult.originalLanguage || 'English';

    return {
      title: metadata.title,
      sourceType: 'YouTube',
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      duration: durationStr,
      participants: participants.length > 0 ? participants : [metadata.author || 'YouTube Presenter'],
      originalLanguage: originalLanguage,
      originalTranscript: finalOriginalTranscript,
      englishTranscript: finalEnglishTranscript,
      transcript: finalEnglishTranscript || finalOriginalTranscript,
      displayLanguage: 'English',
      languageInfo: {
        originalLanguage: originalLanguage,
        displayLanguage: 'English',
        isTranslated: isTranslated,
        translationStatus: translationResult.translationStatus || (isTranslated ? 'success' : 'native_english'),
        translationNote: isTranslated 
          ? 'Automatically translated by AI' 
          : (isFailed ? 'English translation unavailable' : 'Original Language (English)')
      }
    };

  } catch (err) {
    console.error(`Error fetching YouTube transcript for ${videoId}:`, err);
    if (err.message.includes('Could not find transcript') || err.message.includes('disabled') || err.message.includes('No public captions')) {
      throw new Error(`This YouTube video does not have public English captions or subtitles enabled by the creator. Please try a video with closed captions (CC) enabled.`);
    }
    throw new Error(`Failed to extract YouTube transcript: ${err.message}`);
  }
}

/**
 * Ingest Link Pipeline (Zero-upload, autonomous link extraction)
 */
export async function generateTranscriptForLink(sourceInfo) {
  const { platform, url, videoId, type } = sourceInfo;

  // 1. Genuine YouTube Pipeline ONLY
  if (type === 'youtube' || (platform === 'YouTube' && videoId)) {
    const metadata = await fetchYouTubeMetadata(videoId, url);
    return await fetchRealYouTubeTranscript(videoId, metadata);
  }

  // 2. Live Meeting Pipeline (Google Meet / Teams / Zoom via Skribby)
  if (type === 'live_meeting' || platform === 'Google Meet' || platform === 'Microsoft Teams' || platform === 'Zoom') {
    // Check if Skribby is configured
    if (!isSkribbyConfigured()) {
      throw new Error(
        `Live meeting transcription for ${platform} is not configured.\n` +
        `SKRIBBY_API_KEY is missing in your .env file.\n` +
        `Please configure your SKRIBBY_API_KEY in .env or test with a public YouTube video link for immediate zero-setup live transcription.`
      );
    }

    // Call real Skribby bot creation
    const botResult = await createSkribbyBot({ meetingUrl: url, platform });

    return {
      success: true,
      botDispatched: true,
      isLiveBot: true,
      botId: botResult.botId,
      botName: botResult.botName,
      status: botResult.status || 'joining',
      service: botResult.service,
      platform: platform,
      sourceType: platform,
      sourceUrl: url,
      message: `Skribby bot dispatched successfully (Bot ID: ${botResult.botId}). Status: ${botResult.status}.`
    };
  }

  throw new Error(`Unsupported meeting type: ${type || platform}`);
}
