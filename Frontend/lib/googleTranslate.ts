/**
 * @deprecated This file is DEPRECATED and NOT USED
 * 
 * The project now uses FREE Google Translate Widget (lib/googleTranslateWidget.ts)
 * instead of the paid Google Cloud Translation API.
 * 
 * This file is kept for reference only.
 * 
 * NEW IMPLEMENTATION: See lib/googleTranslateWidget.ts
 * 
 * ================================================================
 * OLD IMPLEMENTATION BELOW - NO LONGER ACTIVE
 * ================================================================
 * Google Translate API Service
 * Handles automatic translation of text using Google Translate API
 */

export type SupportedLanguage = 'en' | 'hi' | 'gu';

interface TranslationCache {
  [key: string]: string;
}

class GoogleTranslateService {
  private apiKey: string;
  private cache: Map<string, TranslationCache>;
  private apiEndpoint = 'https://translation.googleapis.com/language/translate/v2';
  
  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || '';
    this.cache = new Map();
    
    // Load cache from localStorage if available
    if (typeof window !== 'undefined') {
      this.loadCacheFromStorage();
    }
  }

  /**
   * Generate cache key for a text-language pair
   */
  private getCacheKey(text: string, targetLang: SupportedLanguage): string {
    return `${targetLang}:${text}`;
  }

  /**
   * Load cached translations from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('translation_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as TranslationCache);
        });
      }
    } catch (error) {
      console.error('Failed to load translation cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheObj: { [key: string]: TranslationCache } = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem('translation_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Failed to save translation cache:', error);
    }
  }

  /**
   * Get cached translation if available
   */
  private getCachedTranslation(text: string, targetLang: SupportedLanguage): string | null {
    const cacheKey = this.getCacheKey(text, targetLang);
    const langCache = this.cache.get(targetLang);
    return langCache?.[text] || null;
  }

  /**
   * Store translation in cache
   */
  private setCachedTranslation(text: string, targetLang: SupportedLanguage, translation: string): void {
    if (!this.cache.has(targetLang)) {
      this.cache.set(targetLang, {});
    }
    const langCache = this.cache.get(targetLang)!;
    langCache[text] = translation;
    
    // Save to localStorage (debounced in real implementation)
    this.saveCacheToStorage();
  }

  /**
   * Translate text using Google Translate API
   */
  async translateText(text: string, targetLang: SupportedLanguage): Promise<string> {
    // If target language is English, return original text
    if (targetLang === 'en') {
      return text;
    }

    // Trim whitespace
    const trimmedText = text.trim();
    if (!trimmedText) {
      return text;
    }

    // Check cache first
    const cached = this.getCachedTranslation(trimmedText, targetLang);
    if (cached) {
      return cached;
    }

    // If no API key, return original text
    if (!this.apiKey) {
      console.warn('Google Translate API key not found. Using original text.');
      return text;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: trimmedText,
          target: targetLang,
          format: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;

      // Cache the translation
      this.setCachedTranslation(trimmedText, targetLang, translatedText);

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(texts: string[], targetLang: SupportedLanguage): Promise<string[]> {
    // If target language is English, return original texts
    if (targetLang === 'en') {
      return texts;
    }

    // Filter out cached translations and empty strings
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];
    const results: string[] = new Array(texts.length);

    texts.forEach((text, index) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        results[index] = text;
        return;
      }

      const cached = this.getCachedTranslation(trimmedText, targetLang);
      if (cached) {
        results[index] = cached;
      } else {
        uncachedTexts.push(trimmedText);
        uncachedIndices.push(index);
      }
    });

    // If all are cached, return immediately
    if (uncachedTexts.length === 0) {
      return results;
    }

    // If no API key, return original texts
    if (!this.apiKey) {
      console.warn('Google Translate API key not found. Using original texts.');
      uncachedIndices.forEach((index, i) => {
        results[index] = texts[index];
      });
      return results;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: uncachedTexts,
          target: targetLang,
          format: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translations = data.data.translations;

      // Cache and assign translations
      translations.forEach((translation: any, i: number) => {
        const originalText = uncachedTexts[i];
        const translatedText = translation.translatedText;
        this.setCachedTranslation(originalText, targetLang, translatedText);
        results[uncachedIndices[i]] = translatedText;
      });

      return results;
    } catch (error) {
      console.error('Batch translation error:', error);
      // Return original texts on error
      uncachedIndices.forEach((index, i) => {
        results[index] = texts[index];
      });
      return results;
    }
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('translation_cache');
    }
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    let size = 0;
    this.cache.forEach((langCache) => {
      size += Object.keys(langCache).length;
    });
    return size;
  }
}

// Export singleton instance
export const googleTranslateService = new GoogleTranslateService();
