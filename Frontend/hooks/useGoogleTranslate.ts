/**
 * Hook to interface with Google Translate Widget
 * High-performance state hooks synchronized with pre-rendered settings.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import {
  initializeGoogleTranslate,
  changeLanguage as changeGoogleLanguage,
  getCurrentLanguage,
  type Language,
  isGoogleTranslateLoaded,
} from '@/lib/googleTranslateWidget';

export function useGoogleTranslate(initialLanguage: Language = 'en') {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);
  const [isChanging, setIsChanging] = useState(false);
  const isLoadedRef = useRef(false);

  /**
   * Initialize Google Translate on mount and poll for ready status
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Trigger optimized initialization
    initializeGoogleTranslate();

    // Check if the select element is ready in the DOM
    const checkLoaded = () => {
      const combo = document.querySelector('.goog-te-combo');
      const loaded = !!combo && isGoogleTranslateLoaded();
      if (loaded) {
        setIsLoaded(true);
        isLoadedRef.current = true;
        const activeLang = getCurrentLanguage();
        setCurrentLanguage(activeLang);
        return true;
      }
      return false;
    };

    if (checkLoaded()) return;

    const interval = setInterval(() => {
      if (checkLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout fallback (force loaded state)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsLoaded(true);
      isLoadedRef.current = true;
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Monitor external or cookie-based language updates
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncLanguage = () => {
      const detectedLang = getCurrentLanguage();
      if (detectedLang !== currentLanguage) {
        setCurrentLanguage(detectedLang);
        localStorage.setItem('language', detectedLang);
      }
    };

    // Run sync immediately
    syncLanguage();

    // Listen to visibility or focus changes to resync translation cookies
    window.addEventListener('focus', syncLanguage);
    const interval = setInterval(syncLanguage, 800);

    return () => {
      window.removeEventListener('focus', syncLanguage);
      clearInterval(interval);
    };
  }, [currentLanguage]);

  /**
   * Change language with optimized instant cookie placement and robust error fallbacks
   */
  const changeLanguage = useCallback(async (targetLang: Language) => {
    if (isChanging || currentLanguage === targetLang) return;

    setIsChanging(true);
    setCurrentLanguage(targetLang); // Optimistic UI update

    try {
      // Sync with localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', targetLang);
      }

      // Execute widget language change
      const success = await changeGoogleLanguage(targetLang);
      
      if (success) {
        setCurrentLanguage(targetLang);
      } else {
        console.warn(`Translation switcher reported issue for language: ${targetLang}`);
      }
    } catch (error) {
      console.error('Error in useGoogleTranslate when switching language:', error);
    } finally {
      // Small debounce to complete transition animations smoothly
      setTimeout(() => {
        setIsChanging(false);
      }, 500);
    }
  }, [currentLanguage, isChanging]);

  return {
    isLoaded,
    currentLanguage,
    changeLanguage,
    isChanging,
  };
}
