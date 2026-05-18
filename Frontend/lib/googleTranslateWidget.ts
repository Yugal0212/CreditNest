/**
 * Google Translate Widget Integration (FREE)
 * Uses Google's free translation widget instead of paid API
 * No API key required!
 */

export type Language = 'en' | 'hi' | 'gu';

declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: new (
          config: {
            pageLanguage: string;
            includedLanguages?: string;
            layout?: number;
            autoDisplay?: boolean;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

/**
 * Initialize Google Translate Widget
 */
export function initializeGoogleTranslate(): void {
  // Check if already initialized
  if (window.googleTranslateElementInit) {
    return;
  }

  // Create initialization function
  window.googleTranslateElementInit = function () {
    if (!window.google?.translate?.TranslateElement) {
      return;
    }

    // Check if container exists before initializing
    const container = document.getElementById('google_translate_element');
    if (!container) {
      console.warn('Google Translate container not found, retrying...');
      setTimeout(() => {
        if (window.googleTranslateElementInit) {
          window.googleTranslateElementInit();
        }
      }, 500);
      return;
    }

    try {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,hi,gu',
          layout: 0, // Simple layout
          autoDisplay: false,
        },
        'google_translate_element'
      );
    } catch (error) {
      console.error('Error initializing Google Translate:', error);
    }
  };

  // Load Google Translate script if not already loaded
  if (!document.getElementById('google-translate-script')) {
    let attemptedFallback = false;

    const loadScript = (src: string, isFallback: boolean) => {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = src;
      script.async = true;
      script.onerror = () => {
        if (!isFallback && !attemptedFallback) {
          attemptedFallback = true;
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          loadScript(
            'https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit',
            true
          );
          return;
        }

        console.error('Failed to load Google Translate script');
      };

      try {
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error appending Google Translate script:', error);
      }
    };

    loadScript(
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit',
      false
    );
  }
}

/**
 * Change language using Google Translate (with improved reliability)
 */
export function changeLanguage(targetLang: Language): Promise<boolean> {
  return new Promise((resolve) => {
    const attemptChange = (retries = 0, maxRetries = 5) => {
      const googleTranslateCombo = document.querySelector(
        '.goog-te-combo'
      ) as HTMLSelectElement;

      if (!googleTranslateCombo && retries < maxRetries) {
        // Widget not ready yet, retry
        setTimeout(() => attemptChange(retries + 1, maxRetries), 300);
        return;
      }

      if (!googleTranslateCombo) {
        console.warn('Google Translate widget not found');
        resolve(false);
        return;
      }

      // Set the value
      googleTranslateCombo.value = targetLang;

      // Trigger change event with multiple methods for better compatibility
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      googleTranslateCombo.dispatchEvent(changeEvent);

      // Also try with input event as fallback
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      googleTranslateCombo.dispatchEvent(inputEvent);

      // Force click event (some browsers need this)
      googleTranslateCombo.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Wait a bit for translation to start, then verify
      setTimeout(() => {
        const currentLang = getCurrentLanguage();
        if (currentLang === targetLang) {
          resolve(true);
        } else {
          // If language didn't change, try one more time
          if (retries < maxRetries) {
            attemptChange(retries + 1, maxRetries);
          } else {
            console.warn(`Failed to switch to ${targetLang}`);
            resolve(false);
          }
        }
      }, 500);
    };

    attemptChange();
  });
}

/**
 * Get current active language from Google Translate (improved detection)
 */
export function getCurrentLanguage(): Language {
  // Method 1: Check the combo box value (most reliable)
  const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
  if (combo && combo.value) {
    const val = combo.value.trim();
    // Empty string or 'en' means English
    if (!val || val === '' || val === 'en') {
      return 'en';
    }
    if (val === 'hi') return 'hi';
    if (val === 'gu') return 'gu';
  }

  // Method 2: Check cookie that Google Translate sets
  const cookies = document.cookie.split(';');
  const googleTranslateCookie = cookies.find((cookie) =>
    cookie.trim().startsWith('googtrans=')
  );

  if (googleTranslateCookie) {
    const value = googleTranslateCookie.split('=')[1];
    if (!value || value === '' || value === '/en/en' || value === '/auto/en') {
      return 'en';
    }
    // Cookie format: /en/hi (from/to) or /auto/hi
    const parts = value.split('/');
    const targetLang = parts[parts.length - 1]; // Get last part
    
    if (targetLang === 'hi') return 'hi';
    if (targetLang === 'gu') return 'gu';
  }

  // Method 3: Check if body has translation classes
  const bodyClasses = document.body.className;
  if (bodyClasses.includes('translated-ltr')) {
    // Page is translated, check which language
    if (bodyClasses.includes('hi') || document.documentElement.lang === 'hi') return 'hi';
    if (bodyClasses.includes('gu') || document.documentElement.lang === 'gu') return 'gu';
  }

  // Method 4: Check html lang attribute
  const htmlLang = document.documentElement.getAttribute('lang');
  if (htmlLang === 'hi') return 'hi';
  if (htmlLang === 'gu') return 'gu';

  // Default to English if no translation is active
  return 'en';
}

/**
 * Clean up Google Translate artifacts when changing language
 */
export function cleanupTranslation(): void {
  // Remove Google Translate cookies
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
}

/**
 * Check if Google Translate is loaded
 */
export function isGoogleTranslateLoaded(): boolean {
  return !!window.google?.translate?.TranslateElement;
}
