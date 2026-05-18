/**
 * Hook to interface with Google Translate Widget
 */

import { useEffect, useCallback, useState } from 'react';
import {
  initializeGoogleTranslate,
  changeLanguage as changeGoogleLanguage,
  getCurrentLanguage,
  type Language,
} from '@/lib/googleTranslateWidget';

export function useGoogleTranslate(initialLanguage: Language = 'en') {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);
  const [isChanging, setIsChanging] = useState(false);

  /**
   * Initialize Google Translate on mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize Google Translate widget
    initializeGoogleTranslate();

    // Check if already loaded
    const checkLoaded = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        setIsLoaded(true);
        clearInterval(checkLoaded);
        
        // Set current language from cookie or localStorage
        const activeLang = getCurrentLanguage();
        setCurrentLanguage(activeLang);
      }
    }, 100);

    // Cleanup after 10 seconds (increased timeout)
    const timeout = setTimeout(() => {
      clearInterval(checkLoaded);
      setIsLoaded(true);
    }, 10000);

    return () => {
      clearInterval(checkLoaded);
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Poll for language changes (to detect when translation completes or user changes manually)
   */
  useEffect(() => {
    if (!isLoaded) return;

    const pollLanguage = setInterval(() => {
      const detectedLang = getCurrentLanguage();
      if (detectedLang !== currentLanguage) {
        console.log('Language changed detected:', currentLanguage, '->', detectedLang);
        setCurrentLanguage(detectedLang);
        // Sync with localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', detectedLang);
        }
      }
    }, 500); // Check more frequently (every 500ms)

    return () => clearInterval(pollLanguage);
  }, [isLoaded, currentLanguage]);

  /**
   * Change language with improved reliability
   */
  const changeLanguage = useCallback(async (targetLang: Language) => {
    if (isChanging || currentLanguage === targetLang) return;

    setIsChanging(true);
    
    try {
      // Change the language
      const success = await changeGoogleLanguage(targetLang);
      
      if (success) {
        setCurrentLanguage(targetLang);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', targetLang);
        }
      } else {
        console.warn(`Language change to ${targetLang} may have failed`);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      // Reset changing state after a delay
      setTimeout(() => setIsChanging(false), 1000);
    }
  }, [currentLanguage, isChanging]);

  /**
   * Get saved language from localStorage and apply it
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return;
    
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['en', 'hi', 'gu'].includes(savedLang) && savedLang !== currentLanguage) {
      // Wait for Google Translate to be ready, then apply saved language
      const applyLanguage = () => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          changeLanguage(savedLang);
        } else {
          setTimeout(applyLanguage, 500);
        }
      };
      
      setTimeout(applyLanguage, 1000);
    }
  }, [isLoaded]);

  return {
    isLoaded,
    currentLanguage,
    changeLanguage,
    isChanging,
  };
}
