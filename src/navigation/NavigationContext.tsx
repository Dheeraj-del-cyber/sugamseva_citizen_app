import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppLanguage } from '../types';
import { translations, TranslationKey } from '../translations/translations';

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

interface NavigationContextType {
  activeLanguage: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
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

  // Translation helper with parameter interpolation
  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    const translationSet = translations[activeLanguage];
    let text = translationSet[key];
    if (typeof text !== 'string') {
      text = (translations['en'][key] as string) || String(key);
    }

    if (params && typeof text === 'string') {
      Object.keys(params).forEach(paramKey => {
        text = (text as string).replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
      });
    }

    return text as string;
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
