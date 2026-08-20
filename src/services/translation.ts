import { api } from './api';
import { translations } from '../translations/translations';
import { LanguageOption } from '../types';

// -----------------------------------------------------------------------------
// Fallback list only used if the backend /api/languages call fails (e.g. app
// opened offline before ever reaching the server). Mirrors
// server/translate.js's SUPPORTED_LANGUAGES so the language picker still
// shows all 13 languages even without a network round trip.
// -----------------------------------------------------------------------------
export const FALLBACK_LANGUAGES: LanguageOption[] = [
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

export const getAvailableLanguages = async (): Promise<LanguageOption[]> => {
  try {
    const res = await api.getLanguages();
    if (res.success && Array.isArray(res.languages) && res.languages.length > 0) {
      return res.languages;
    }
  } catch (e) {
    console.warn('[translation] Could not load /api/languages, using fallback list:', e);
  }
  return FALLBACK_LANGUAGES;
};

// -----------------------------------------------------------------------------
// Flatten the English UI dictionary (including the nested "categories" object)
// into a flat key -> text map, e.g. { "categories.Agriculture": "Agriculture" }.
// This is the single source of truth for every static UI string in the app -
// nothing here should ever be hardcoded per-language.
// -----------------------------------------------------------------------------
const flatten = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
  const out: Record<string, string> = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const flatKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      Object.assign(out, flatten(value, flatKey));
    } else {
      out[flatKey] = String(value);
    }
  });
  return out;
};

export const EN_DICT: Record<string, string> = flatten(translations.en);
const EN_KEYS = Object.keys(EN_DICT);
const EN_VALUES = EN_KEYS.map((k) => EN_DICT[k]);

// -----------------------------------------------------------------------------
// Simple persistence helpers. Falls back to a no-op on native where
// window.localStorage doesn't exist - the in-memory cache below still works
// fine for the lifetime of the app session, matching how src/services/api.ts
// already guards its own localStorage usage.
// -----------------------------------------------------------------------------
const hasWebStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const readPersisted = (storageKey: string): Record<string, string> | null => {
  if (!hasWebStorage()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writePersisted = (storageKey: string, dict: Record<string, string>) => {
  if (!hasWebStorage()) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(dict));
  } catch {
    // Storage full/unavailable - safe to ignore, it's only a perf cache.
  }
};

const uiDictStorageKey = (lang: string) => `sugamseva_ui_dict_${lang}`;
const dynamicStorageKey = (lang: string) => `sugamseva_dyn_dict_${lang}`;

// In-memory cache of the full UI dictionary per language: { [lang]: { [key]: translatedText } }
const uiDictCache: Record<string, Record<string, string>> = { en: EN_DICT };

/**
 * Returns the full flattened UI dictionary for `lang`, translating every
 * English string in one batched call the first time a language is used
 * (then serving from memory / localStorage on every call after that).
 */
export const getUiDictionary = async (lang: string): Promise<Record<string, string>> => {
  if (lang === 'en') return EN_DICT;
  if (uiDictCache[lang]) return uiDictCache[lang];

  const persisted = readPersisted(uiDictStorageKey(lang));
  if (persisted) {
    uiDictCache[lang] = persisted;
    return persisted;
  }

  try {
    const res = await api.translateBatch(EN_VALUES, lang);
    const translatedValues = res.translations;
    const dict: Record<string, string> = {};
    EN_KEYS.forEach((key, i) => {
      dict[key] = translatedValues[i] || EN_DICT[key];
    });
    uiDictCache[lang] = dict;
    writePersisted(uiDictStorageKey(lang), dict);
    return dict;
  } catch (e) {
    console.warn(`[translation] Failed to translate UI text to "${lang}", falling back to English:`, e);
    // Fail-safe: don't cache a failure permanently, just fall back to English for this call.
    return EN_DICT;
  }
};

// -----------------------------------------------------------------------------
// Generic translator for DYNAMIC content that isn't part of the fixed UI
// dictionary - scheme names/descriptions/benefits/eligibility/documents,
// citizen documents, application statuses, AI assistant responses, etc.
// Every unique source string is translated once per language and cached
// (memory + localStorage), so repeated strings across schemes/documents
// ("Aadhaar Card" appears in many places) only cost one API call ever.
// -----------------------------------------------------------------------------
const dynamicCache: Record<string, Record<string, string>> = {};

const getDynamicCache = (lang: string): Record<string, string> => {
  if (!dynamicCache[lang]) {
    dynamicCache[lang] = readPersisted(dynamicStorageKey(lang)) || {};
  }
  return dynamicCache[lang];
};

/**
 * Translates an arbitrary list of strings into `lang`, preserving order and
 * length. Falsy entries pass through untouched. On failure, original text is
 * returned so the app degrades to English rather than breaking.
 */
export const translateTexts = async (texts: string[], lang: string): Promise<string[]> => {
  if (!lang || lang === 'en' || texts.length === 0) return texts;

  const cache = getDynamicCache(lang);
  const missing = Array.from(new Set(texts.filter((txt) => txt && cache[txt] === undefined)));

  if (missing.length > 0) {
    try {
      const res = await api.translateBatch(missing, lang);
      missing.forEach((original, i) => {
        cache[original] = res.translations[i] || original;
      });
      writePersisted(dynamicStorageKey(lang), cache);
    } catch (e) {
      console.warn(`[translation] Dynamic translation to "${lang}" failed, using English text:`, e);
      // Don't persist failures - just use the source text for this render.
      missing.forEach((original) => {
        if (cache[original] === undefined) cache[original] = original;
      });
    }
  }

  return texts.map((txt) => (txt ? cache[txt] ?? txt : txt));
};

/** Convenience wrapper for translating a single dynamic string. */
export const translateText = async (text: string, lang: string): Promise<string> => {
  const [result] = await translateTexts([text], lang);
  return result;
};