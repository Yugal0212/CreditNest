/**
 * @deprecated This component is DEPRECATED (but still works)
 * 
 * For the new FREE Google Translate Widget, use standard notranslate class:
 * 
 * <div className="notranslate">Content</div>
 * or
 * <span translate="no">Content</span>
 * 
 * This component is kept for backwards compatibility.
 * 
 * ================================================================
 * NoTranslate Component
 * Wrapper component to mark content that should not be translated
 * 
 * Usage:
 * <NoTranslate>
 *   <div>This content will not be translated</div>
 * </NoTranslate>
 * 
 * Or inline:
 * <NoTranslate as="span">SMART_CREDIT</NoTranslate>
 */

import React from 'react';

interface NoTranslateProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export function NoTranslate({ children, as: Component = 'div', className }: NoTranslateProps) {
  return (
    <Component data-no-translate="true" className={className}>
      {children}
    </Component>
  );
}

/**
 * Hook to programmatically mark an element as non-translatable
 */
export function useNoTranslate<T extends HTMLElement = HTMLElement>() {
  const ref = React.useRef<T>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute('data-no-translate', 'true');
    }
  }, []);
  
  return ref;
}
