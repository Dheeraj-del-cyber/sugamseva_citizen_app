const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Curated list of major Indian languages (ISO 639-1 codes). Bhashini uses
// the same ISO-639 codes as Google did, so this list didn't need to change.
// Extend any time — no code changes needed elsewhere, everything downstream
// reads from here.
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

// ---------------------------------------------------------------------------
// Bhashini (MeitY / ULCA) integration
//
// Bhashini is a two-step flow, unlike Google's single REST call:
//   1. "Pipeline config" call to the ULCA auth server, authenticated with
//      your userID + ulcaApiKey. Tells Bhashini which task (translation) and
//      language pair you want. Returns a serviceId (which model to use) plus
//      a callbackUrl + short-lived Authorization token for step 2.
//   2. "Pipeline compute" call — the actual translation request — sent to
//      that callbackUrl with that token.
//
// Get userID / ulcaApiKey by signing up at https://bhashini.gov.in, then
// Profile -> "Generate API Key". Put them in server/.env as
// BHASHINI_USER_ID and BHASHINI_ULCA_API_KEY. No billing account needed.
// ---------------------------------------------------------------------------

const ULCA_CONFIG_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';

// Public MeitY pipeline ID that bundles ASR + translation + TTS across the
// common Indic languages. It's the one referenced throughout Bhashini's own
// sample code/docs and works with any registered userID/ulcaApiKey — you
// don't need to create your own pipeline on the ULCA portal to use it.
const DEFAULT_PIPELINE_ID = '64392f96daac500b55c543cd';

// Per-language-pair pipeline config cache (serviceId + callback auth). This
// is stable, so we only re-fetch it when missing/expired, not per request.
const pipelineConfigCache = {}; // key: `${sourceLang}:${targetLang}` -> { serviceId, callbackUrl, authName, authValue, fetchedAt }
const PIPELINE_CONFIG_TTL_MS = 60 * 60 * 1000; // 1 hour

const fetchPipelineConfig = async (sourceLang, targetLang) => {
  const userID = process.env.BHASHINI_USER_ID;
  const ulcaApiKey = process.env.BHASHINI_ULCA_API_KEY;
  if (!userID || !ulcaApiKey) {
    throw new Error(
      'BHASHINI_USER_ID / BHASHINI_ULCA_API_KEY are not set. Add them to server/.env to enable live translation.'
    );
  }

  const response = await fetch(ULCA_CONFIG_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      userID,
      ulcaApiKey,
    },
    body: JSON.stringify({
      pipelineTasks: [
        {
          taskType: 'translation',
          config: {
            language: {
              sourceLanguage: sourceLang,
              targetLanguage: targetLang,
            },
          },
        },
      ],
      pipelineRequestConfig: {
        pipelineId: DEFAULT_PIPELINE_ID,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Bhashini pipeline config error (${response.status}): ${errBody}`);
  }

  const data = await response.json();

  const translationConfig = data.pipelineResponseConfig?.find((c) => c.taskType === 'translation')
    ?.config?.[0];
  const inferenceEndpoint = data.pipelineInferenceAPIEndPoint;

  if (!translationConfig?.serviceId || !inferenceEndpoint?.callbackUrl) {
    throw new Error(
      `Bhashini pipeline config response missing translation service for ${sourceLang}->${targetLang}. ` +
        `Response: ${JSON.stringify(data)}`
    );
  }

  const config = {
    serviceId: translationConfig.serviceId,
    callbackUrl: inferenceEndpoint.callbackUrl,
    authName: inferenceEndpoint.inferenceApiKey?.name || 'Authorization',
    authValue: inferenceEndpoint.inferenceApiKey?.value,
    fetchedAt: Date.now(),
  };

  pipelineConfigCache[`${sourceLang}:${targetLang}`] = config;
  return config;
};

const getPipelineConfig = async (sourceLang, targetLang) => {
  const key = `${sourceLang}:${targetLang}`;
  const cached = pipelineConfigCache[key];
  if (cached && Date.now() - cached.fetchedAt < PIPELINE_CONFIG_TTL_MS) {
    return cached;
  }
  return fetchPipelineConfig(sourceLang, targetLang);
};

/**
 * Calls the Bhashini pipeline compute API for a batch of strings.
 */
const callBhashiniTranslate = async (texts, targetLang, sourceLang = 'en') => {
  const doCompute = async (config) => {
    const response = await fetch(config.callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [config.authName]: config.authValue,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
              },
              serviceId: config.serviceId,
            },
          },
        ],
        inputData: {
          input: texts.map((source) => ({ source })),
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      const err = new Error(`Bhashini compute error (${response.status}): ${errBody}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const output = data.pipelineResponse?.[0]?.output;
    if (!Array.isArray(output)) {
      throw new Error(`Bhashini compute response missing output. Response: ${JSON.stringify(data)}`);
    }
    return output.map((o) => o.target);
  };

  let config = await getPipelineConfig(sourceLang, targetLang);
  try {
    return await doCompute(config);
  } catch (err) {
    // Auth token may have expired — refetch the pipeline config once and retry.
    if (err.status === 401 || err.status === 403) {
      config = await fetchPipelineConfig(sourceLang, targetLang);
      return doCompute(config);
    }
    throw err;
  }
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
    // Keep chunks modest — Bhashini's models run per-request on shared
    // inference servers, so smaller batches are more reliable than one huge
    // payload.
    const CHUNK_SIZE = 40;
    for (let start = 0; start < missTexts.length; start += CHUNK_SIZE) {
      const chunk = missTexts.slice(start, start + CHUNK_SIZE);
      const translatedChunk = await callBhashiniTranslate(chunk, targetLang);
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