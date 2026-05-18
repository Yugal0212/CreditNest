'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useGoogleTranslate } from '@/hooks/useGoogleTranslate';

export type Language = 'en' | 'hi' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoaded: boolean;
  isChanging: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentLanguage, changeLanguage, isLoaded, isChanging } = useGoogleTranslate();

  // Initialize Google Translate element container
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let createdElement = false;

    // Create hidden container for Google Translate widget if it doesn't exist
    if (!document.getElementById('google_translate_element')) {
      const container = document.createElement('div');
      container.id = 'google_translate_element';
      container.style.display = 'none';
      document.body.appendChild(container);
      createdElement = true;
    }

    // Cleanup function
    return () => {
      // Only remove if we created it and it still exists
      if (createdElement) {
        const element = document.getElementById('google_translate_element');
        if (element && element.parentNode) {
          try {
            element.parentNode.removeChild(element);
          } catch (error) {
            // Silently ignore if element was already removed
            console.debug('Google Translate element already removed');
          }
        }
      }
    };
  }, []);

  return (
    <LanguageContext.Provider 
      value={{ 
        language: currentLanguage, 
        setLanguage: changeLanguage,
        isLoaded,
        isChanging 
      }}
    >
      {children}
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
