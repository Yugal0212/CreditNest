'use client';

import { useState, useEffect } from 'react';
import { DownloadCloud, Smartphone, Bell, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global types for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export default function PwaManager() {
  // Update State
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Push Notification State
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* ==============================
       1. SERVICE WORKER UPDATES
       ============================== */
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setUpdateAvailable(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    /* ==============================
       2. APP INSTALL PROMPT
       ============================== */
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Only show if user hasn't explicitly dismissed it recently
      const hasDismissed = localStorage.getItem('scms-install-dismissed');
      if (!hasDismissed) {
        // Delay showing it so it doesn't interrupt immediate app usage
        setTimeout(() => setShowInstallPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    /* ==============================
       3. PUSH NOTIFICATIONS
       ============================== */
    const checkNotificationStatus = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const hasDismissedPush = localStorage.getItem('scms-push-dismissed');
        if (Notification.permission === 'default' && !hasDismissedPush) {
          // Ask after 15 seconds of usage
          setTimeout(() => setShowPushPrompt(true), 15000);
        }
      }
    };
    
    checkNotificationStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handlers
  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setUpdateAvailable(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const dismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('scms-install-dismissed', 'true');
  };

  const handlePushRequest = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // In a real app, you would fetch FCM token here and save to backend
      console.log('Push notifications enabled!');
    }
    setShowPushPrompt(false);
  };

  const dismissPush = () => {
    setShowPushPrompt(false);
    localStorage.setItem('scms-push-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-3 sm:w-96 pointer-events-none">
      
      <AnimatePresence>
        {/* UPDATE PROMPT */}
        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-card border border-border shadow-2xl rounded-2xl p-4 glass-card pointer-events-auto"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <DownloadCloud className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">Update Available</h3>
                <p className="text-sm text-muted-foreground mt-0.5">A new version of CreditNest is ready.</p>
                <div className="flex items-center gap-2 mt-3">
                  <button 
                    onClick={handleUpdate}
                    className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Refresh & Update
                  </button>
                  <button 
                    onClick={() => setUpdateAvailable(false)}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* INSTALL PROMPT */}
        {showInstallPrompt && !updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-card border border-border shadow-2xl rounded-2xl p-4 glass-card pointer-events-auto"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">Install App</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Install CreditNest for offline access and native performance.</p>
                <div className="flex items-center gap-2 mt-3">
                  <button 
                    onClick={handleInstall}
                    className="flex-1 bg-emerald-500 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Install Now
                  </button>
                  <button 
                    onClick={dismissInstall}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PUSH PROMPT */}
        {showPushPrompt && !showInstallPrompt && !updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-card border border-border shadow-2xl rounded-2xl p-4 glass-card pointer-events-auto"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">Stay Updated</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Enable notifications for payment alerts and system updates.</p>
                <div className="flex items-center gap-2 mt-3">
                  <button 
                    onClick={handlePushRequest}
                    className="flex-1 bg-indigo-500 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Enable
                  </button>
                  <button 
                    onClick={dismissPush}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
