'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/contexts/ThemeContext';

export function DashboardCardsSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            background: isDark ? '#0f172a' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6'}`,
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Header: Title and Icon */}
          <div className="flex justify-between items-start">
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-[60%]" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
          </div>
          
          {/* Content: Value and Subtitle */}
          <div className="space-y-3 mt-2">
            <Skeleton className="h-8 w-[80%]" />
            <Skeleton className="h-3 w-[40%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardCardsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="w-full h-[400px] rounded-2xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="w-full h-[400px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
