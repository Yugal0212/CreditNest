'use client';

import React from 'react';
import { TopBar }     from './TopBar';
import { Sidebar }    from './Sidebar';
import { BottomNavBar } from './BottomNavBar';
import { useTheme }   from '@/contexts/ThemeContext';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  /*
   * Background tokens:
   *  Light → #F1F5F9  (slate-100 — clean neutral behind white cards/sidebar)
   *  Dark  → #0F172A  (slate-900)
   *
   * Sidebar is always white (light) or #1B1F2E (dark) — set inside Sidebar itself.
   * Content area uses slate-100 so white cards and white sidebar both "pop" on it.
   */
  const contentBg = isDark ? '#080c14' : '#f0f4f8';

  return (
    <div
      className="admin-theme"
      style={{
        display:    'flex',
        minHeight:  '100vh',
        background: contentBg,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {/* Fixed 240px sidebar */}
      <Sidebar />

      {/* Right column — TopBar + content */}
      <div
        className="md:ml-[240px]"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}
      >
        {/* Fixed TopBar — 72px tall */}
        <TopBar />

        {/* Page content */}
        <main
          className="flex-1 pt-[60px] pb-[48px] px-3 sm:px-4 md:px-6 overflow-x-hidden w-full max-w-[100vw]"
          style={{
            background: contentBg,
          }}
        >
          <div className="max-w-[1280px] mx-auto pt-6">
            {children}
          </div>
          <div className="md:hidden" style={{ height: 'calc(5.5rem + env(safe-area-inset-bottom))' }} />
        </main>
      </div>

      <BottomNavBar />
    </div>
  );
};
