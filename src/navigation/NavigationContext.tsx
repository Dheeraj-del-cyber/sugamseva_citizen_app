import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppLanguage, Scheme } from '../types';
import { translations, TranslationKey } from '../translations/translations';

export type ScreenName = 
  | 'Home' 
  | 'Discover' 
  | 'Details' 
  | 'Application' 
  | 'Track' 
  | 'Profile'
  | 'DigiLocker';

interface ScreenState {
  name: ScreenName;
  params?: any;
}

export type TabName = 'Home' | 'Schemes' | 'AI' | 'Track' | 'Profile';

interface NavigationContextType {
  activeLanguage: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  currentTab: TabName;
  setTab: (tab: TabName) => void;
  screenStack: ScreenState[];
  pushScreen: (name: ScreenName, params?: any) => void;
  popScreen: () => void;
  currentScreen: ScreenState;
  t: (key: TranslationKey, categoryKey?: string) => string;
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
  const [currentTab, setTabState] = useState<TabName>('Home');
  const [screenStack, setScreenStack] = useState<ScreenState[]>([{ name: 'Home' }]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Voice Assistant Visibility
  const [voiceAssistantVisible, setVoiceAssistantVisible] = useState(false);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
  };

  const setTab = (tab: TabName) => {
    if (tab === 'AI') {
      setVoiceAssistantVisible(true);
      return;
    }
    setTabState(tab);
    // When changing tabs, clear stack and set root screen for that tab
    const rootScreenMap: Record<TabName, ScreenName> = {
      Home: 'Home',
      Schemes: 'Discover',
      AI: 'Home', // Fallback
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

  const currentScreen = screenStack[screenStack.length - 1] || { name: 'Home' };

  // Translation helper
  const t = (key: TranslationKey): string => {
    const translationSet = translations[activeLanguage];
    const text = translationSet[key];
    if (typeof text === 'string') {
      return text;
    }
    return translations['en'][key] as string || String(key);
  };

  const tCategory = (categoryName: string): string => {
    const translationSet = translations[activeLanguage];
    const catMap = translationSet.categories as Record<string, string>;
    const defaultCatMap = translations.en.categories as Record<string, string>;
    return catMap[categoryName] || defaultCatMap[categoryName] || categoryName;
  };

  return (
    <NavigationContext.Provider
      value={{
        activeLanguage,
        setLanguage,
        currentTab,
        setTab,
        screenStack,
        pushScreen,
        popScreen,
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
