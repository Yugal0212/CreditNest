/**
 * Google Translate Widget Integration (FREE)
 * Highly optimized for production speed, reliability, and zero-flicker routing.
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
  if (typeof window === 'undefined') return;

  // If already fully loaded and initialized, we are good
  if (window.google?.translate?.TranslateElement) {
    if (window.googleTranslateElementInit) {
      try {
        window.googleTranslateElementInit();
      } catch (err) {
        console.error('Error during Google Translate callback execution:', err);
      }
    }
    return;
  }

  // Inject callback if it doesn't exist
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = function () {
      if (!window.google?.translate?.TranslateElement) return;

      const container = document.getElementById('google_translate_element');
      if (!container) {
        // Retry shortly
        setTimeout(() => {
          if (window.googleTranslateElementInit) {
            window.googleTranslateElementInit();
          }
        }, 150);
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
        console.error('Error initializing Google Translate TranslateElement:', error);
      }
    };
  }

  // Fallback load script if not already present
  if (!document.getElementById('google-translate-script')) {
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      // Direct retry using alternative domain in case of network issues
      console.warn('Primary translate script load failed, attempting fallback...');
      const fallbackScript = document.createElement('script');
      fallbackScript.id = 'google-translate-script-fallback';
      fallbackScript.src = 'https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit';
      fallbackScript.async = true;
      fallbackScript.defer = true;
      document.head.appendChild(fallbackScript);
    };
    document.head.appendChild(script);
  }
}

/**
 * Change language using Google Translate (optimized with instant cookie setting and retry loops)
 */
export function changeLanguage(targetLang: Language): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // Immediately set translation cookies to maximize load speed and persistence
    const expectedCookie = `googtrans=/en/${targetLang}`;
    document.cookie = `googtrans=${expectedCookie}; path=/;`;
    document.cookie = `googtrans=${expectedCookie}; path=/; domain=${window.location.hostname};`;
    const hostParts = window.location.hostname.split('.');
    if (hostParts.length > 2) {
      const mainDomain = hostParts.slice(-2).join('.');
      document.cookie = `googtrans=${expectedCookie}; path=/; domain=.${mainDomain};`;
    }

    // If English, remove data-lang and cookies immediately to prevent delayed translation
    if (targetLang === 'en') {
      document.documentElement.removeAttribute('data-lang');
      document.documentElement.classList.remove('translated-ltr', 'translated-rtl');
      document.body.classList.remove('translated-ltr', 'translated-rtl');
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      if (hostParts.length > 2) {
        const mainDomain = hostParts.slice(-2).join('.');
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + mainDomain;
      }
    } else {
      document.documentElement.setAttribute('data-lang', targetLang);
    }

    const attemptChange = (retries = 0, maxRetries = 10) => {
      const googleTranslateCombo = document.querySelector(
        '.goog-te-combo'
      ) as HTMLSelectElement;

      if (!googleTranslateCombo) {
        if (retries < maxRetries) {
          setTimeout(() => attemptChange(retries + 1, maxRetries), 150);
        } else {
          console.warn('Google Translate combo selector not found after max retries.');
          resolve(false);
        }
        return;
      }

      // Check if value is already targetLang
      if (googleTranslateCombo.value === targetLang) {
        resolve(true);
        return;
      }

      try {
        // Select value
        googleTranslateCombo.value = targetLang;

        // Dispatch events to trigger translator observer
        googleTranslateCombo.dispatchEvent(new Event('change', { bubbles: true }));
        googleTranslateCombo.dispatchEvent(new Event('input', { bubbles: true }));
        googleTranslateCombo.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        // Double verify after dynamic execution
        setTimeout(() => {
          const currentLang = getCurrentLanguage();
          if (currentLang === targetLang) {
            resolve(true);
          } else if (retries < maxRetries) {
            attemptChange(retries + 1, maxRetries);
          } else {
            console.warn(`Translation change failed verification for: ${targetLang}`);
            resolve(false);
          }
        }, 150);
      } catch (err) {
        console.error('Error changing combo box value:', err);
        resolve(false);
      }
    };

    attemptChange();
  });
}

/**
 * Get current active language from Google Translate (highly accurate multi-path check)
 */
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // Path 1: Check standard cookie (fastest and most persistent)
  const cookies = document.cookie.split(';');
  const googleTranslateCookie = cookies.find((cookie) =>
    cookie.trim().startsWith('googtrans=')
  );

  if (googleTranslateCookie) {
    const value = googleTranslateCookie.split('=')[1];
    if (value && value !== '' && value !== '/en/en' && value !== '/auto/en') {
      const parts = value.split('/');
      const targetLang = parts[parts.length - 1]; // Get last segment
      if (targetLang === 'hi') return 'hi';
      if (targetLang === 'gu') return 'gu';
    }
  }

  // Path 2: Check the combo box value
  const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
  if (combo && combo.value) {
    const val = combo.value.trim();
    if (val === 'hi') return 'hi';
    if (val === 'gu') return 'gu';
    if (val === 'en') return 'en';
  }

  // Path 3: Check html/body custom attributes
  const htmlLangAttr = document.documentElement.getAttribute('data-lang') as Language;
  if (htmlLangAttr && ['en', 'hi', 'gu'].includes(htmlLangAttr)) {
    return htmlLangAttr;
  }

  const savedLocal = localStorage.getItem('language') as Language;
  if (savedLocal && ['en', 'hi', 'gu'].includes(savedLocal)) {
    return savedLocal;
  }

  return 'en';
}

/**
 * Clean up Google Translate cookies and states completely
 */
export function cleanupTranslation(): void {
  if (typeof window === 'undefined') return;
  document.documentElement.removeAttribute('data-lang');
  document.documentElement.classList.remove('translated-ltr', 'translated-rtl');
  document.body.classList.remove('translated-ltr', 'translated-rtl');
  
  const domains = [window.location.hostname];
  const hostParts = window.location.hostname.split('.');
  if (hostParts.length > 2) {
    domains.push('.' + hostParts.slice(-2).join('.'));
  }

  domains.forEach((dom) => {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${dom};`;
  });
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  localStorage.setItem('language', 'en');
}

/**
 * Check if Google Translate is loaded
 */
export function isGoogleTranslateLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.google?.translate?.TranslateElement;
}
