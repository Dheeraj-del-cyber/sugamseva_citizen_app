import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage, LanguageOption } from '../types';
import { translations, TranslationKey } from '../translations/translations';
import { api } from '../services/api';

export type ScreenName = 
  | 'Home' 
  | 'Discover' 
  | 'Details' 
  | 'Application' 
  | 'Track' 
  | 'Profile'
  | 'DigiLocker'
  | 'Auth';

interface ScreenState {
  name: ScreenName;
  params?: any;
}

export type TabName = 'Home' | 'Schemes' | 'AI' | 'Track' | 'Profile';

// Fallback list used if the backend's /api/languages can't be reached (e.g.
// offline dev). Keeps the language picker usable; actual translation of
// any language not pre-baked below still requires the API to be reachable.
const FALLBACK_LANGUAGES: LanguageOption[] = [
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

// Languages we already ship hand-crafted (higher quality, zero-latency,
// works offline) translations for. Anything else is translated live via
// the backend's /api/translate (Google Cloud Translation API) and cached.
const STATIC_LANGUAGES = Object.keys(translations) as AppLanguage[];

// Flatten translations.en (including the nested `categories` object) into
// a single {key: englishText} map, once, at module load. This is the
// source list of strings we ask the API to translate for any dynamic
// (non-pre-baked) language.
const flattenEnglish = (): { keys: string[]; texts: string[] } => {
  const keys: string[] = [];
  const texts: string[] = [];
  Object.entries(translations.en).forEach(([k, v]) => {
    if (typeof v === 'string') {
      keys.push(k);
      texts.push(v);
    } else if (v && typeof v === 'object') {
      Object.entries(v as Record<string, string>).forEach(([ck, cv]) => {
        keys.push(`categories.${ck}`);
        texts.push(cv);
      });
    }
  });
  return { keys, texts };
};
const { keys: BASE_KEYS, texts: BASE_TEXTS } = flattenEnglish();

interface NavigationContextType {
  activeLanguage: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  languages: LanguageOption[];
  translationsLoading: boolean;
  currentTab: TabName;
  setTab: (tab: TabName) => void;
  screenStack: ScreenState[];
  pushScreen: (name: ScreenName, params?: any) => void;
  popScreen: () => void;
  resetNavigation: (screenName?: ScreenName) => void;
  currentScreen: ScreenState;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  tCategory: (categoryName: string) => string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  voiceAssistantVisible: boolean;
  setVoiceAssistantVisible: (visible: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [activeLanguage, setLanguageState] = useState<AppLanguage>('en');
  const [languages, setLanguages] = useState<LanguageOption[]>(FALLBACK_LANGUAGES);
  const [currentTab, setTabState] = useState<TabName>('Home');
  const [screenStack, setScreenStack] = useState<ScreenState[]>([{ name: 'Home' }]);

  // Cache of API-translated strings, keyed by language code, then by the
  // same flattened key used in translations.en (e.g. "greeting",
  // "categories.Agriculture"). Populated lazily the first time a language
  // is selected; reused afterward for the lifetime of the app session.
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, Record<string, string>>>({});
  const [translationsLoading, setTranslationsLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Voice Assistant Visibility
  const [voiceAssistantVisible, setVoiceAssistantVisible] = useState(false);

  // Load the full list of supported languages from the backend once.
  useEffect(() => {
    api.getLanguages()
      .then((res) => {
        if (res.success && res.languages?.length) {
          setLanguages(res.languages);
        }
      })
      .catch(() => {
        // Backend unreachable - keep the fallback list so the picker still works.
      });
  }, []);

  const ensureLanguageTranslated = async (lang: AppLanguage) => {
    if (lang === 'en' || STATIC_LANGUAGES.includes(lang) || dynamicTranslations[lang]) {
      return; // already have it, no API call needed
    }
    setTranslationsLoading(true);
    try {
      const { translations: translatedTexts } = await api.translateBatch(BASE_TEXTS, lang);
      const map: Record<string, string> = {};
      BASE_KEYS.forEach((key, i) => {
        map[key] = translatedTexts[i];
      });
      setDynamicTranslations((prev) => ({ ...prev, [lang]: map }));
    } catch (error: any) {
      console.warn(`[Translation] Could not translate to "${lang}", falling back to English:`, error.message);
      // Cache an empty map so t() falls back to English instead of retrying every render.
      setDynamicTranslations((prev) => ({ ...prev, [lang]: {} }));
    } finally {
      setTranslationsLoading(false);
    }
  };

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    ensureLanguageTranslated(lang);
  };

  const setTab = (tab: TabName) => {
    if (tab === 'AI') {
      setVoiceAssistantVisible(true);
      return;
    }
    setTabState(tab);
    const rootScreenMap: Record<TabName, ScreenName> = {
      Home: 'Home',
      Schemes: 'Discover',
      AI: 'Home',
      Track: 'Track',
      Profile: 'Profile'
    };
    setScreenStack([{ name: rootScreenMap[tab] }]);
  };

  const pushScreen = (name: ScreenName, params?: any) => {
    setScreenStack((prev) => [...prev, { name, params }]);
  };

  const popScreen = () => {
    setScreenStack((prev) => {
      if (prev.length <= 1) return prev;
      const newStack = [...prev];
      newStack.pop();
      return newStack;
    });
  };

  const resetNavigation = (screenName: ScreenName = 'Home') => {
    setTabState(screenName === 'Profile' ? 'Profile' : screenName === 'Track' ? 'Track' : screenName === 'Discover' ? 'Schemes' : 'Home');
    setScreenStack([{ name: screenName }]);
  };

  const currentScreen = screenStack[screenStack.length - 1] || { name: 'Home' };

  // Translation helper with parameter interpolation.
  // Resolution order: hand-crafted static translation (en/kn/hi) -> live
  // API-translated cache for the active language -> English fallback.
  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    let text: string | undefined;

    if (STATIC_LANGUAGES.includes(activeLanguage)) {
      const translationSet = translations[activeLanguage as keyof typeof translations];
      const val = (translationSet as any)[key];
      if (typeof val === 'string') text = val;
    } else {
      text = dynamicTranslations[activeLanguage]?.[key as string];
    }

    if (typeof text !== 'string') {
      text = (translations.en[key] as string) || String(key);
    }

    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = (text as string).replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
    }

    return text as string;
  };

  const tCategory = (categoryName: string): string => {
    const defaultCatMap = translations.en.categories as Record<string, string>;

    if (STATIC_LANGUAGES.includes(activeLanguage)) {
      const translationSet = translations[activeLanguage as keyof typeof translations];
      const catMap = translationSet.categories as Record<string, string>;
      return catMap[categoryName] || defaultCatMap[categoryName] || categoryName;
    }

    const dynamicVal = dynamicTranslations[activeLanguage]?.[`categories.${categoryName}`];
    return dynamicVal || defaultCatMap[categoryName] || categoryName;
  };

  return (
    <NavigationContext.Provider
      value={{
        activeLanguage,
        setLanguage,
        languages,
        translationsLoading,
        currentTab,
        setTab,
        screenStack,
        pushScreen,
        popScreen,
        resetNavigation,
        currentScreen,
        t,
        tCategory,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        voiceAssistantVisible,
        setVoiceAssistantVisible
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useAppNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within a NavigationProvider');
  }
  return context;
};