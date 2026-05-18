/**
 * @deprecated This file is DEPRECATED and NOT USED
 * 
 * The project now uses FREE Google Translate Widget (hooks/useGoogleTranslate.ts)
 * instead of manual DOM scanning with paid API.
 * 
 * This file is kept for reference only.
 * 
 * NEW IMPLEMENTATION: See hooks/useGoogleTranslate.ts
 * 
 * ================================================================
 * OLD IMPLEMENTATION BELOW - NO LONGER ACTIVE
 * ================================================================
 * Auto-translate hook
 * Automatically translates all visible text content on the page
 */

import { useEffect, useRef, useCallback } from 'react';
import { googleTranslateService, type SupportedLanguage } from '@/lib/googleTranslate';

interface TranslationNode {
  element: Node;
  originalText: string;
  nodeType: 'text' | 'placeholder' | 'aria-label' | 'title' | 'alt';
}

const SKIP_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT'];
const SKIP_ATTRIBUTES = ['data-no-translate', 'translate="no"'];
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'];

export function useAutoTranslate(language: SupportedLanguage, enabled: boolean = true) {
  const originalTextsRef = useRef<Map<Node, string>>(new Map());
  const isTranslatingRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);

  /**
   * Check if element should be skipped
   */
  const shouldSkipElement = useCallback((element: Element): boolean => {
    if (SKIP_TAGS.includes(element.tagName)) {
      return true;
    }

    for (const attr of SKIP_ATTRIBUTES) {
      if (element.hasAttribute(attr.split('=')[0])) {
        return true;
      }
    }

    return false;
  }, []);

  /**
   * Extract translatable text nodes from DOM
   */
  const extractTextNodes = useCallback((root: HTMLElement): TranslationNode[] => {
    const nodes: TranslationNode[] = [];

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (shouldSkipElement(element)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let currentNode: Node | null = walker.nextNode();

    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        const text = currentNode.textContent?.trim();
        if (text && text.length > 0) {
          // Store original text if not stored yet
          if (!originalTextsRef.current.has(currentNode)) {
            originalTextsRef.current.set(currentNode, text);
          }
          
          nodes.push({
            element: currentNode,
            originalText: originalTextsRef.current.get(currentNode)!,
            nodeType: 'text',
          });
        }
      }
      currentNode = walker.nextNode();
    }

    // Extract translatable attributes from elements
    const elements = root.querySelectorAll('[placeholder], [aria-label], [title], [alt]');
    elements.forEach((element) => {
      if (shouldSkipElement(element)) return;

      TRANSLATABLE_ATTRIBUTES.forEach((attr) => {
        const value = element.getAttribute(attr);
        if (value && value.trim()) {
          const key = `${attr}:${element.tagName}:${value}`;
          const mockNode = { __attr: attr, __element: element } as any;
          
          if (!originalTextsRef.current.has(mockNode)) {
            originalTextsRef.current.set(mockNode, value);
          }

          nodes.push({
            element: mockNode,
            originalText: originalTextsRef.current.get(mockNode)!,
            nodeType: attr as any,
          });
        }
      });
    });

    return nodes;
  }, [shouldSkipElement]);

  /**
   * Translate all text nodes
   */
  const translatePage = useCallback(async (targetLang: SupportedLanguage) => {
    if (isTranslatingRef.current) return;
    isTranslatingRef.current = true;

    try {
      const body = document.body;
      if (!body) return;

      // If English, restore original texts
      if (targetLang === 'en') {
        originalTextsRef.current.forEach((originalText, node) => {
          if ((node as any).__element) {
            // It's an attribute node
            const attrNode = node as any;
            attrNode.__element.setAttribute(attrNode.__attr, originalText);
          } else if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = originalText;
          }
        });
        isTranslatingRef.current = false;
        return;
      }

      // Extract all translatable nodes
      const nodes = extractTextNodes(body);

      if (nodes.length === 0) {
        isTranslatingRef.current = false;
        return;
      }

      // Batch translate
      const textsToTranslate = nodes.map((n) => n.originalText);
      const translatedTexts = await googleTranslateService.translateBatch(
        textsToTranslate,
        targetLang
      );

      // Apply translations
      nodes.forEach((node, index) => {
        const translatedText = translatedTexts[index];
        
        if ((node.element as any).__element) {
          // It's an attribute node
          const attrNode = node.element as any;
          attrNode.__element.setAttribute(attrNode.__attr, translatedText);
        } else if (node.element.nodeType === Node.TEXT_NODE) {
          node.element.textContent = translatedText;
        }
      });
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      isTranslatingRef.current = false;
    }
  }, [extractTextNodes]);

  /**
   * Observe DOM changes and translate new content
   */
  const observeDOMChanges = useCallback((targetLang: SupportedLanguage) => {
    // Disconnect existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new MutationObserver((mutations) => {
      let hasTextChanges = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          hasTextChanges = true;
          break;
        }
        if (mutation.type === 'characterData') {
          hasTextChanges = true;
          break;
        }
      }

      if (hasTextChanges) {
        // Debounce translation
        setTimeout(() => {
          translatePage(targetLang);
        }, 100);
      }
    });

    // Start observing
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }, [translatePage]);

  /**
   * Effect to trigger translation when language changes
   */
  useEffect(() => {
    if (!enabled) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      translatePage(language);
      observeDOMChanges(language);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [language, enabled, translatePage, observeDOMChanges]);

  return {
    translatePage,
    isTranslating: isTranslatingRef.current,
  };
}
