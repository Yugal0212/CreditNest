'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OFFLINE_BAR_HEIGHT = 0; // Removing static height offset for a floating toast

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsOnline(navigator.onLine);

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(false);
    };
    
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="fixed top-4 left-0 right-0 z-[10000] flex justify-center pointer-events-none px-4">
      <AnimatePresence mode="wait">
        {!isOnline && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-rose-500 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-3 border border-rose-600/50 backdrop-blur-md"
          >
            <div className="bg-white/20 p-1.5 rounded-full">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-sm font-semibold tracking-wide">You are currently offline</span>
          </motion.div>
        )}

        {isOnline && showOnlineToast && (
          <motion.div
            key="online"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-emerald-500 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-3 border border-emerald-600/50 backdrop-blur-md"
          >
            <div className="bg-white/20 p-1.5 rounded-full">
              <Wifi className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-wide">Connection restored</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
