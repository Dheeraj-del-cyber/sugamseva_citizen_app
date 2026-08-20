import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppLanguage, LanguageOption } from '../types';
import { TranslationKey } from '../translations/translations';
import { EN_DICT, getUiDictionary, getAvailableLanguages, FALLBACK_LANGUAGES } from '../services/translation';

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

const LANGUAGE_STORAGE_KEY = 'sugamseva_active_language';

const loadSavedLanguage = (): AppLanguage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  }
  return null;
};

const persistLanguage = (lang: AppLanguage) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }
};

interface NavigationContextType {
  activeLanguage: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  availableLanguages: LanguageOption[];
  isTranslating: boolean;
  currentTab: TabName;
  setTab: (tab: TabName) => void;
  screenStack: ScreenState[];
  pushScreen: (name: ScreenName, params?: any) => void;
  popScreen: () => void;
  resetNavigation: (screenName?: ScreenName) => void;
  currentScreen: ScreenState;
  t: (key: TranslationKey | string, params?: Record<string, string>) => string;
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
  const [activeLanguage, setLanguageState] = useState<AppLanguage>(() => loadSavedLanguage() || 'en');
  const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>(FALLBACK_LANGUAGES);
  // The live dictionary of translated UI text for activeLanguage. Starts as
  // English and is swapped out once the batch translation for a language
  // resolves - this way the UI never blocks, it just updates in place.
  const [uiDict, setUiDict] = useState<Record<string, string>>(EN_DICT);
  const [isTranslating, setIsTranslating] = useState(false);

  const [currentTab, setTabState] = useState<TabName>('Home');
  const [screenStack, setScreenStack] = useState<ScreenState[]>([{ name: 'Home' }]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Voice Assistant Visibility
  const [voiceAssistantVisible, setVoiceAssistantVisible] = useState(false);

  // Load the full list of translatable languages from the backend once, so
  // the language picker always reflects every language the server supports
  // (currently 13) without needing a client-side hardcoded list.
  useEffect(() => {
    getAvailableLanguages().then(setAvailableLanguages);
  }, []);

  // Whenever the active language changes, (re)load its full UI dictionary.
  // English resolves instantly since it IS the source dictionary; every
  // other language is translated in one batched call the first time it's
  // used and served from cache after that.
  useEffect(() => {
    let cancelled = false;
    if (activeLanguage === 'en') {
      setUiDict(EN_DICT);
      setIsTranslating(false);
      return;
    }
    setIsTranslating(true);
    getUiDictionary(activeLanguage).then((dict) => {
      if (!cancelled) {
        setUiDict(dict);
        setIsTranslating(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeLanguage]);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    persistLanguage(lang);
  }, []);

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

  // Translation helper with parameter interpolation. Reads from the live,
  // dynamically-translated dictionary for the active language, falling back
  // to English (and finally the raw key) if a string is momentarily missing.
  const t = (key: TranslationKey | string, params?: Record<string, string>): string => {
    let text = uiDict[key as string] ?? EN_DICT[key as string] ?? String(key);

    if (params) {
      Object.keys(params).forEach(paramKey => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
    }

    return text;
  };

  // Category names come from the fixed SchemeCategory enum, so they live in
  // the same dynamically-translated dictionary under "categories.<Name>".
  const tCategory = (categoryName: string): string => {
    const flatKey = `categories.${categoryName}`;
    if (EN_DICT[flatKey] === undefined) return categoryName; // unknown category, nothing to translate
    return uiDict[flatKey] ?? EN_DICT[flatKey];
  };

  return (
    <NavigationContext.Provider
      value={{
        activeLanguage,
        setLanguage,
        availableLanguages,
        isTranslating,
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