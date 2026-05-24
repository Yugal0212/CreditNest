'use client';

import { useState, useEffect } from 'react';
import { Zap, X, Share, Plus, Smartphone } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const dismissed = localStorage.getItem('scms-pwa-dismissed');
    const dismissedAt = dismissed ? parseInt(dismissed) : 0;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - dismissedAt < sevenDays) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      setShowIOS(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem('scms-pwa-dismissed', Date.now().toString());
    setShowAndroid(false);
    setShowIOS(false);
  };

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    setDeferredPrompt(null);
  };

  if (!showAndroid && !showIOS) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-[#E5E7EB] rounded-t-[20px] px-5 pt-5 pb-8 shadow-[0_-6px_40px_rgba(13,34,53,0.14)]">
      {/* LOGO ROW */}
      <div className="flex items-center gap-3 mb-4">
        <img 
          src="/CreditNest.png" 
          alt="CreditNest Logo" 
          className="w-12 h-12 object-contain"
        />
        <div className="text-left">
          <p className="text-[#0D2235] font-black text-[14px]">CreditNest</p>
          <p className="text-[#6B7280] text-[12px]">Free · Works Offline</p>
        </div>
        <button 
          className="ml-auto w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center text-[#9CA3AF]"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ANDROID BANNER */}
      {showAndroid && (
        <>
          <p className="text-[13px] text-[#6B7280] leading-relaxed mb-5 text-left">
            Install this app on your device for quick access and offline use.
          </p>
          <button 
            className="w-full h-[50px] bg-[#D4A017] text-white font-bold text-[14px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#C09214] transition-colors"
            onClick={installApp}
          >
            <Smartphone className="h-4 w-4" />
            <span>Add to Home Screen</span>
          </button>
          <button 
            className="w-full text-center mt-3 text-[12px] text-[#9CA3AF] font-semibold"
            onClick={dismiss}
          >
            Not now
          </button>
        </>
      )}

      {/* IOS BANNER */}
      {showIOS && (
        <>
          <div className="flex items-start gap-4 mb-5 border border-[#E5E7EB] rounded-xl p-4 bg-[#FAFAFA]">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-9 h-9 bg-[#EAF2FB] rounded-full flex items-center justify-center">
                <Share className="h-4 w-4 text-[#1A5276]" />
              </div>
              <span className="text-[11px] text-[#6B7280] font-semibold text-center">Tap Share</span>
            </div>
            
            <span className="text-[#D1D5DB] text-lg self-center">›</span>
            
            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-9 h-9 bg-[#EAF2FB] rounded-full flex items-center justify-center">
                <Plus className="h-4 w-4 text-[#1A5276]" />
              </div>
              <span className="text-[11px] text-[#6B7280] font-semibold text-center">Add to Home Screen</span>
            </div>
            
            <span className="text-[#D1D5DB] text-lg self-center">›</span>
            
            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <img 
                src="/CreditNest.png" 
                alt="CreditNest Logo" 
                className="w-9 h-9 object-contain"
              />
              <span className="text-[11px] text-[#6B7280] font-semibold text-center">Open CreditNest</span>
            </div>
          </div>
          
          <button 
            className="w-full h-[48px] bg-[#0D2235] text-white font-bold text-[14px] rounded-xl hover:bg-[#0A1B29] transition-colors"
            onClick={dismiss}
          >
            Got it, thanks!
          </button>
        </>
      )}
    </div>
  );
}
