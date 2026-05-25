'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export function GlobalPreloader() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Only show the preloader if running as a standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone || 
                         document.referrer.includes('android-app://');
    
    if (!isStandalone) {
      setIsLoading(false);
      return;
    }

    // Artificial slight delay to ensure smooth CSS loading and hydration
    // In production this might be tied to actual app readiness or router events
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="global-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? '#020617' : '#F8FAFC',
          }}
        >
          {/* Logo container with gentle float/pulse */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            <div style={{ position: 'relative' }}>
              {/* Soft glow behind logo */}
              <div 
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(16,185,129,0.4))',
                  filter: 'blur(30px)',
                  borderRadius: '50%',
                  opacity: isDark ? 0.6 : 0.3,
                  animation: 'premium-shimmer 3s infinite alternate ease-in-out',
                }}
              />
              
              <img
                src="/CreditNest.png"
                alt="CreditNest Logo"
                style={{
                  width: '72px',
                  height: '72px',
                  objectFit: 'contain',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
            >
              <h1 style={{
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #6366f1, #10b981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                CreditNest
              </h1>
              
              {/* Premium minimal loading bar */}
              <div style={{
                width: '120px',
                height: '3px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '12px',
                position: 'relative'
              }}>
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    width: '40%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
