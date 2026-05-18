'use client';

import { WifiOff, Zap, RefreshCw, LayoutDashboard, LogIn } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0D2235] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Dot-grid texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15" 
        style={{
          backgroundImage: 'radial-gradient(circle, #5DADE2 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />
      
      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
        
        {/* TOP — Logo */}
        <div className="flex row items-center gap-2.5 mb-2">
          <div className="w-10 h-10 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-xl flex items-center justify-center">
            <Zap className="h-5 w-5 text-[#D4A017]" />
          </div>
          <span className="text-white font-black text-base tracking-widest">SCMS</span>
        </div>

        {/* MAIN ICON */}
        <div className="w-20 h-20 bg-[#1A5276]/40 rounded-full flex items-center justify-center border border-[#1A5276]">
          <div className="w-14 h-14 bg-[#1A5276] rounded-full flex items-center justify-center">
            <WifiOff className="h-7 w-7 text-[#D4A017]" />
          </div>
        </div>

        {/* HEADING + SUBTEXT */}
        <div className="space-y-2">
          <h1 className="text-white text-2xl font-black tracking-tight">You're offline</h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-[260px] mx-auto">
            Check your internet connection. Your recently visited pages are still available below.
          </p>
        </div>

        {/* RETRY BUTTON */}
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-[#D4A017] text-white font-bold text-sm px-8 py-3.5 rounded-xl w-full max-w-[220px] justify-center hover:bg-[#C09214] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>

        {/* CACHED PAGES SECTION */}
        <div className="w-full mt-2">
          <p className="text-[10.5px] font-black uppercase tracking-[.25em] text-white/30 mb-3">
            Available offline
          </p>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Card 1 — Dashboard */}
            <a 
              href="/dashboard" 
              className="bg-[#1A5276]/20 border border-[#1A5276]/40 rounded-xl p-4 flex flex-col items-center gap-2 text-white/70 hover:bg-[#1A5276]/30 transition"
            >
              <LayoutDashboard className="h-5 w-5 text-[#D4A017]" />
              <span className="text-xs font-semibold">Dashboard</span>
            </a>
            
            {/* Card 2 — Login */}
            <a 
              href="/login" 
              className="bg-[#1A5276]/20 border border-[#1A5276]/40 rounded-xl p-4 flex flex-col items-center gap-2 text-white/70 hover:bg-[#1A5276]/30 transition"
            >
              <LogIn className="h-5 w-5 text-[#D4A017]" />
              <span className="text-xs font-semibold">Login</span>
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-white/20 text-[11px] mt-4">
          Smart Credit SCMS · Offline Mode
        </p>
      </div>
    </div>
  );
}
