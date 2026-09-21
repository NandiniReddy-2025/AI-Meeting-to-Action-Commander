/**
 * Translation Engine
 * Automatically detects the spoken/caption language of a transcript and translates full utterances
 * into natural English while preserving timestamps, speaker labels, and meaning.
 */

const LANGUAGE_MAP = {
  'ar': 'Arabic',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'nl': 'Dutch',
  'pt': 'Portuguese',
  'it': 'Italian',
  'ru': 'Russian',
  'zh': 'Chinese',
  'zh-cn': 'Chinese (Simplified)',
  'zh-tw': 'Chinese (Traditional)',
  'zh-hans': 'Chinese (Simplified)',
  'zh-hant': 'Chinese (Traditional)',
  'ja': 'Japanese',
  'ko': 'Korean',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'pl': 'Polish',
  'sv': 'Swedish',
  'da': 'Danish',
  'fi': 'Finnish',
  'el': 'Greek',
  'he': 'Hebrew',
  'id': 'Indonesian',
  'th': 'Thai',
  'uk': 'Ukrainian',
  'cs': 'Czech',
  'ro': 'Romanian',
  'hu': 'Hungarian',
  'bn': 'Bengali',
  'fa': 'Persian',
  'ur': 'Urdu',
  'en': 'English'
};

export function normalizeLangName(code = '') {
  if (!code) return 'Foreign Language';
  const clean = code.toLowerCase().trim();
  if (LANGUAGE_MAP[clean]) return LANGUAGE_MAP[clean];
  const base = clean.split('-')[0];
  if (LANGUAGE_MAP[base]) return LANGUAGE_MAP[base];
  return code.charAt(0).toUpperCase() + code.slice(1);
}

/**
 * Detect language from script characteristics or language codes
 */
export function detectLanguage(sampleText = '', rawLangCode = '') {
  if (rawLangCode) {
    const code = rawLangCode.split('-')[0].toLowerCase();
    if (code === 'en') {
      return { isEnglish: true, code: 'en', name: 'English' };
    }
    if (LANGUAGE_MAP[code]) {
      return { isEnglish: false, code, name: LANGUAGE_MAP[code] };
    }
  }

  // Detect script characteristics
  if (/[\u0600-\u06FF]/.test(sampleText)) {
    return { isEnglish: false, code: 'ar', name: 'Arabic' };
  }
  if (/[\u3040-\u30FF]/.test(sampleText)) {
    return { isEnglish: false, code: 'ja', name: 'Japanese' };
  }
  if (/[\u4E00-\u9FFF]/.test(sampleText)) {
    return { isEnglish: false, code: 'zh', name: 'Chinese' };
  }
  if (/[\uAC00-\uD7AF]/.test(sampleText)) {
    return { isEnglish: false, code: 'ko', name: 'Korean' };
  }
  if (/[\u0900-\u097F]/.test(sampleText)) {
    return { isEnglish: false, code: 'hi', name: 'Hindi' };
  }
  if (/[\u0400-\u04FF]/.test(sampleText)) {
    return { isEnglish: false, code: 'ru', name: 'Russian' };
  }
  if (/[\u0E00-\u0E7F]/.test(sampleText)) {
    return { isEnglish: false, code: 'th', name: 'Thai' };
  }
  if (/[\u0590-\u05FF]/.test(sampleText)) {
    return { isEnglish: false, code: 'he', name: 'Hebrew' };
  }
  if (/[\u0370-\u03FF]/.test(sampleText)) {
    return { isEnglish: false, code: 'el', name: 'Greek' };
  }

  // Default assumption
  return { isEnglish: true, code: 'en', name: 'English' };
}

/**
 * Check if text contains foreign non-Latin scripts (Chinese, Japanese, Arabic, Cyrillic, etc.)
 */
export function containsForeignScript(text = '') {
  return /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0600-\u06FF\u0900-\u097F\u0400-\u04FF\u0E00-\u0E7F\u0590-\u05FF\u0370-\u03FF]/.test(text);
}

/**
 * Translate a single text utterance to English using robust multi-tier fallback
 */
export async function translateTextToEnglish(text, geminiApiKey = null, sourceLang = 'auto') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { translatedText: text, detectedLangCode: 'en', detectedLangName: 'English', success: true };
  }

  const trimmed = text.trim();
  const hasForeignScript = containsForeignScript(trimmed);

  // ----------------------------------------------------
  // TIER 1: Google Neural Client-5 Translation Endpoint
  // ----------------------------------------------------
  try {
    const gUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(sourceLang || 'auto')}&tl=en&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(gUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json[0]) {
        const trans = Array.isArray(json[0]) ? json[0][0] : json[0];
        const detected = Array.isArray(json[0]) ? json[0][1] : 'auto';
        
        if (trans && typeof trans === 'string' && trans.trim()) {
          const transTrimmed = trans.trim();
          if (!hasForeignScript || !containsForeignScript(transTrimmed)) {
            return {
              translatedText: transTrimmed,
              detectedLangCode: detected,
              detectedLangName: normalizeLangName(detected),
              success: true
            };
          }
        }
      }
    }
  } catch (err) {
    // Silent fallback
  }

  // ----------------------------------------------------
  // TIER 2: MyMemory Translation API
  // ----------------------------------------------------
  try {
    const pair = (sourceLang && sourceLang !== 'auto') ? `${sourceLang}|en` : 'autodetect|en';
    const mUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${pair}`;
    const res = await fetch(mUrl);

    if (res.ok) {
      const json = await res.json();
      if (json.responseData && json.responseData.translatedText && !json.responseData.translatedText.startsWith('MYMEMORY WARNING')) {
        const trans = json.responseData.translatedText.trim();
        if (!hasForeignScript || !containsForeignScript(trans)) {
          const detectedFromMatch = json.matches?.[0]?.source || 'auto';
          return {
            translatedText: trans,
            detectedLangCode: detectedFromMatch,
            detectedLangName: normalizeLangName(detectedFromMatch),
            success: true
          };
        }
      }
    }
  } catch (err) {
    // Silent fallback
  }

  // ----------------------------------------------------
  // TIER 3: Gemini LLM Fallback (if key is configured)
  // ----------------------------------------------------
  if (geminiApiKey) {
    try {
      const prompt = `Translate the following text accurately and naturally into English. Preserve the meaning, tone, and context. Do not add explanations, conversational filler, or quotes. Return ONLY the English translation.\n\nText:\n${trimmed}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (res.ok) {
        const data = await res.json();
        const geminiTranslation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (geminiTranslation && (!hasForeignScript || !containsForeignScript(geminiTranslation))) {
          return {
            translatedText: geminiTranslation,
            detectedLangCode: 'auto',
            detectedLangName: 'Original Language',
            success: true
          };
        }
      }
    } catch (err) {
      // Fallback
    }
  }

  // If translation failed for foreign script, return success: false
  if (hasForeignScript) {
    return {
      translatedText: trimmed,
      detectedLangCode: 'unknown',
      detectedLangName: detectLanguage(trimmed).name,
      success: false
    };
  }

  return {
    translatedText: trimmed,
    detectedLangCode: 'en',
    detectedLangName: 'English',
    success: true
  };
}

/**
 * Translate a batch of text lines in a single high-efficiency network call
 */
async function translateBatchChunk(lines, geminiApiKey = null) {
  if (!lines || lines.length === 0) return { lines: [], detectedLangName: 'English', success: true };
  
  // Clean individual lines of internal newlines
  const sanitizedLines = lines.map(l => (l || '').replace(/\r?\n+/g, ' ').trim());
  const combinedText = sanitizedLines.join('\n');

  try {
    const gUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=en&q=${encodeURIComponent(combinedText)}`;
    const res = await fetch(gUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json[0]) {
        const translatedCombined = Array.isArray(json[0]) ? json[0][0] : json[0];
        const detectedCode = Array.isArray(json[0]) ? json[0][1] : 'auto';
        const detectedLangName = normalizeLangName(detectedCode);

        if (translatedCombined && typeof translatedCombined === 'string') {
          const splitLines = translatedCombined.split('\n');
          // If the line count matches exactly
          if (splitLines.length === sanitizedLines.length) {
            return {
              lines: splitLines.map(s => s.trim()),
              detectedLangName,
              success: true
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Batch translation chunk error:', err.message);
  }

  // Fallback to item-by-item translation for this chunk
  const fallbackResults = [];
  let detectedLang = 'Original Language';
  let hasFailed = false;

  for (const line of sanitizedLines) {
    const res = await translateTextToEnglish(line, geminiApiKey);
    if (res.detectedLangName && res.detectedLangName !== 'English' && res.detectedLangName !== 'Original Language') {
      detectedLang = res.detectedLangName;
    }
    if (!res.success) {
      hasFailed = true;
    }
    fallbackResults.push(res.translatedText || line);
  }

  return {
    lines: fallbackResults,
    detectedLangName: detectedLang,
    success: !hasFailed
  };
}

/**
 * Translate an array of timeline transcript objects to English
 * Preserves exact timestamps (`time`) and speaker labels (`speaker`)
 * 
 * Returns structured dual-language payloads:
 * - englishTranscript: Array of { time, speaker, text } in genuine English
 * - originalTranscript: Array of { time, speaker, text } in original language
 * - originalLanguage: Name of detected original language
 * - wasTranslated: boolean
 * - translationStatus: 'success' | 'failed' | 'native_english'
 */
export async function translateTranscriptItems(transcriptItems, geminiApiKey = null) {
  if (!Array.isArray(transcriptItems) || transcriptItems.length === 0) {
    return {
      englishTranscript: [],
      originalTranscript: [],
      originalLanguage: 'English',
      detectedLangName: 'English',
      wasTranslated: false,
      translationStatus: 'native_english'
    };
  }

  // Preserve pristine original transcript
  const originalTranscript = transcriptItems.map(item => ({
    time: item.time,
    speaker: item.speaker,
    text: item.text
  }));

  // Sample the transcript to detect language
  const sampleText = transcriptItems.slice(0, 10).map(t => t.text).join(' ');
  const hasForeign = containsForeignScript(sampleText);
  const initialDetection = detectLanguage(sampleText);

  // If already native English and no foreign script
  if (!hasForeign && initialDetection.isEnglish) {
    const check = await translateTextToEnglish(transcriptItems[0].text, geminiApiKey);
    if (check.detectedLangCode && check.detectedLangCode.startsWith('en')) {
      return {
        englishTranscript: originalTranscript,
        originalTranscript: originalTranscript,
        originalLanguage: 'English',
        detectedLangName: 'English',
        wasTranslated: false,
        translationStatus: 'native_english'
      };
    }
  }

  let finalDetectedLang = initialDetection.name !== 'English' ? initialDetection.name : 'Foreign Language';
  const englishTranscript = [];
  let totalChunkFailures = 0;

  // Process in chunks of 15 items per batch
  const chunkSize = 15;
  for (let i = 0; i < transcriptItems.length; i += chunkSize) {
    const chunkItems = transcriptItems.slice(i, i + chunkSize);
    const chunkTexts = chunkItems.map(it => it.text);

    const chunkResult = await translateBatchChunk(chunkTexts, geminiApiKey);

    if (chunkResult.detectedLangName && chunkResult.detectedLangName !== 'English' && chunkResult.detectedLangName !== 'Original Language') {
      finalDetectedLang = chunkResult.detectedLangName;
    }
    if (!chunkResult.success) {
      totalChunkFailures++;
    }

    for (let j = 0; j < chunkItems.length; j++) {
      englishTranscript.push({
        time: chunkItems[j].time,
        speaker: chunkItems[j].speaker,
        text: chunkResult.lines[j] || chunkItems[j].text
      });
    }
  }

  // If all or majority failed translation and text is still foreign
  const totalChunks = Math.ceil(transcriptItems.length / chunkSize);
  if (hasForeign && totalChunkFailures >= totalChunks) {
    console.error(`Translation failed across all chunks`);
    return {
      englishTranscript: null,
      originalTranscript: originalTranscript,
      originalLanguage: finalDetectedLang,
      detectedLangName: finalDetectedLang,
      wasTranslated: false,
      translationStatus: 'failed',
      errorMessage: 'English translation unavailable'
    };
  }

  return {
    englishTranscript,
    originalTranscript,
    originalLanguage: finalDetectedLang,
    detectedLangName: finalDetectedLang,
    wasTranslated: true,
    translationStatus: 'success'
  };
}
