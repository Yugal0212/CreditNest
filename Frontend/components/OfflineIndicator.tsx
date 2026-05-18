'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OFFLINE_BAR_HEIGHT = 40;

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsOnline(navigator.onLine);

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnline(false);
    };
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnline(true);
      setTimeout(() => setShowOnline(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOnline && !showOnline) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 text-white text-[12px] font-semibold"
      style={{ 
        height: `${OFFLINE_BAR_HEIGHT}px`,
        backgroundColor: isOnline ? '#1E8449' : '#CB4335'
      }}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-white" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 text-white animate-pulse" />
          <span>No internet connection — some features may not work</span>
        </>
      )}
    </div>
  );
}
