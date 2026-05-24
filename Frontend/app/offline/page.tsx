'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfflineFallback() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="mx-auto w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <WifiOff className="w-12 h-12 text-rose-500" />
        </div>
        
        <h1 className="text-3xl font-black text-foreground tracking-tight">
          You're Offline
        </h1>
        
        <p className="text-muted-foreground text-lg">
          It looks like you've lost your internet connection. This page isn't cached yet, so we can't show it right now.
        </p>

        <div className="pt-8">
          <button 
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
        
        <p className="text-sm text-muted-foreground pt-4">
          Don't worry, your background data and unsynced changes will automatically sync when you reconnect!
        </p>
      </motion.div>
    </div>
  );
}
