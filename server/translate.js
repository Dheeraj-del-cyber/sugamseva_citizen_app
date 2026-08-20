const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Curated list of major Indian languages (ISO 639-1 codes understood by
// Google Cloud Translation API). Extend this list any time — no code
// changes needed elsewhere, everything downstream reads from here.
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
];

const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const cacheFilePath = path.resolve(dataDir, 'translations_cache.json');

// Cache shape: { [targetLang]: { [sha1(sourceText)]: translatedText } }
let cache = {};

const loadCache = () => {
  try {
    if (fs.existsSync(cacheFilePath)) {
      cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    } else {
      cache = {};
      persistCache();
    }
  } catch (err) {
    console.error('[Translate] Failed to load cache, starting fresh:', err.message);
    cache = {};
  }
};

let saveTimer = null;
const persistCache = () => {
  // Debounce writes since batches can trigger many cache updates at once.
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const tempPath = `${cacheFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(cache, null, 2), 'utf8');
      fs.renameSync(tempPath, cacheFilePath);
    } catch (err) {
      console.error('[Translate] Failed to persist cache:', err.message);
    }
  }, 300);
};

loadCache();

const hashText = (text) => crypto.createHash('sha1').update(text, 'utf8').digest('hex');

/**
 * Calls the Google Cloud Translation API (v2, REST) for a batch of strings.
 * Requires GOOGLE_TRANSLATE_API_KEY to be set in the environment.
 */
const callGoogleTranslate = async (texts, targetLang) => {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GOOGLE_TRANSLATE_API_KEY is not set. Add it to server/.env to enable live translation.'
    );
  }

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        target: targetLang,
        source: 'en',
        format: 'text',
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Google Translate API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.data.translations.map((t) => t.translatedText);
};

/**
 * Translate a batch of source strings into targetLang, using the on-disk
 * cache wherever possible and only calling the API for cache misses.
 * Returns an array of translated strings, same order/length as `texts`.
 */
const translateBatch = async (texts, targetLang) => {
  if (targetLang === 'en') {
    return texts;
  }
  if (!SUPPORTED_LANGUAGES.some((l) => l.code === targetLang)) {
    throw new Error(`Unsupported target language: ${targetLang}`);
  }

  if (!cache[targetLang]) cache[targetLang] = {};
  const langCache = cache[targetLang];

  const results = new Array(texts.length);
  const missIndexes = [];
  const missTexts = [];

  texts.forEach((text, i) => {
    const key = hashText(text);
    if (langCache[key] !== undefined) {
      results[i] = langCache[key];
    } else {
      missIndexes.push(i);
      missTexts.push(text);
    }
  });

  if (missTexts.length > 0) {
    // Google's API accepts large batches, but keep chunks modest to stay
    // well under request size/URL limits.
    const CHUNK_SIZE = 100;
    for (let start = 0; start < missTexts.length; start += CHUNK_SIZE) {
      const chunk = missTexts.slice(start, start + CHUNK_SIZE);
      const translatedChunk = await callGoogleTranslate(chunk, targetLang);
      translatedChunk.forEach((translated, j) => {
        const globalIdx = missIndexes[start + j];
        results[globalIdx] = translated;
        langCache[hashText(texts[globalIdx])] = translated;
      });
    }
    persistCache();
  }

  return results;
};

module.exports = {
  SUPPORTED_LANGUAGES,
  translateBatch,
};