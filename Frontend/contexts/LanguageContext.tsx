'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export type Language = 'en' | 'hi' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoaded: boolean;
  isChanging: boolean;
  isPageTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  // Load and apply the saved language on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language;
      const initial = saved && ['en', 'hi', 'gu'].includes(saved) ? saved : (i18n.language as Language) || 'en';
      
      // Update local storage and DOM synchronously on mount
      localStorage.setItem('language', initial);
      document.documentElement.setAttribute('data-lang', initial);
      
      setIsChanging(true);
      setCurrentLang(initial);
      i18n.changeLanguage(initial).finally(() => {
        setIsLoaded(true);
        setIsChanging(false);
      });
    }
  }, [i18n]);

  useEffect(() => {
    const handleChanged = (lng: string) => {
      const normalized = (lng?.split('-')[0] || 'en') as Language;
      if (['en', 'hi', 'gu'].includes(normalized)) {
        setCurrentLang(normalized);
        setIsLoaded(true);
      }
    };

    i18n.on('languageChanged', handleChanged);
    return () => {
      i18n.off('languageChanged', handleChanged);
    };
  }, [i18n]);

  const changeLanguage = async (targetLang: Language) => {
    if (targetLang === currentLang) return;

    setIsChanging(true);
    
    // Synchronously write to localStorage and set DOM attributes first
    // so any component useEffect triggers reading from localStorage get the correct header immediately.
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', targetLang);
      document.documentElement.setAttribute('data-lang', targetLang);
      window.dispatchEvent(new CustomEvent('language:changed', { detail: { language: targetLang } }));
    }

    setCurrentLang(targetLang);
    await i18n.changeLanguage(targetLang);

    setIsChanging(false);
  };

  return (
    <LanguageContext.Provider
      value={{
        language: currentLang,
        setLanguage: changeLanguage,
        isLoaded,
        isChanging,
        isPageTranslating: false
      }}
    >
      <div id="main-content-wrapper" className="opacity-100">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
