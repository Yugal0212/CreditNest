'use client';

import React from 'react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Languages, Loader2, Sparkles, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  dropDirection?: 'up' | 'down';
}

export function LanguageSwitcher({ dropDirection = 'down' }: LanguageSwitcherProps) {
  const { language, setLanguage, isLoaded, isChanging } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en' as Language, label: 'English', flag: '🇬🇧', nativeName: 'English', gradient: 'from-teal-500 to-teal-600' },
    { code: 'hi' as Language, label: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी', gradient: 'from-teal-500 to-teal-600' },
    { code: 'gu' as Language, label: 'Gujarati', flag: '🇮🇳', nativeName: 'ગુજરાતી', gradient: 'from-teal-500 to-teal-600' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleLanguageChange = async (langCode: Language) => {
    if (isChanging || langCode === language) return; // Prevent double-click and same language
    
    await setLanguage(langCode);
    setIsOpen(false);
  };

  const isButtonDisabled = isChanging;

  return (
    <div ref={dropdownRef} className="relative z-50">
      <motion.button
        onClick={() => !isButtonDisabled && setIsOpen((prev) => !prev)}
        whileHover={{ scale: isButtonDisabled ? 1 : 1.05 }}
        whileTap={{ scale: isButtonDisabled ? 1 : 0.95 }}
        className={`w-[34px] h-[34px] rounded-full border-none flex items-center justify-center transition-all duration-200 bg-slate-100 dark:bg-slate-800 ${!isButtonDisabled ? 'hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
        aria-label="Change language"
        disabled={isButtonDisabled}
      >
        {/* Icon */}
        {!isLoaded || isChanging ? (
          <Loader2 size={16} strokeWidth={2} className="animate-spin text-slate-500" />
        ) : (
          <Globe size={16} strokeWidth={2} className="text-slate-500 dark:text-slate-400 group-hover:rotate-12 transition-transform" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className={`absolute right-0 ${dropDirection === 'up' ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'} w-48 sm:w-56 bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl`}
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Select Language</span>
              </div>
            </div>

            {/* Language options */}
            <div className="py-1">
              {languages.map((lang, idx) => {
                const isActive = language === lang.code;
                const isOptionDisabled = isChanging;
                
                return (
                  <motion.button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={isOptionDisabled}
                    whileHover={{ scale: isOptionDisabled ? 1 : 1.02, x: isOptionDisabled ? 0 : 4 }}
                    whileTap={{ scale: isOptionDisabled ? 1 : 0.98 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 disabled:cursor-not-allowed group relative overflow-hidden
                      ${isActive
                        ? 'bg-gradient-to-r ' + lang.gradient + ' text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      } ${isOptionDisabled ? 'opacity-60' : ''}`}
                  >
                    {/* Gradient overlay on hover */}
                    {!isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 0.1 }}
                        className={`absolute inset-0 bg-gradient-to-r ${lang.gradient}`}
                      />
                    )}
                    
                    {/* Flag */}
                    <span className="text-2xl leading-none relative z-10">{lang.flag}</span>
                    
                    {/* Text */}
                    <div className="flex-1 relative z-10">
                      <div className={`text-sm font-bold ${isActive ? 'text-white' : ''}`}>
                        {lang.label}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground dark:text-muted-foreground'}`}>
                        {lang.nativeName}
                      </div>
                    </div>
                    
                    {/* Checkmark */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="relative z-10"
                      >
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            {/* Footer hint */}
            <div className="border-t border-border px-4 py-2 bg-muted">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground dark:text-muted-foreground">
                {isChanging ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <p className="leading-tight font-medium">Translating page...</p>
                  </>
                ) : (
                  <>
                    <Languages className="w-3 h-3" />
                    <p className="leading-tight font-medium">Multi-Language Engine</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

