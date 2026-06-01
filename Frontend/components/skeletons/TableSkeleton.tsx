import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/contexts/ThemeContext';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        background: isDark ? '#0f172a' : '#FFFFFF',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6'}`,
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Table Header */}
      <div 
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6'}` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`th-${i}`} className="h-4 w-full max-w-[120px] rounded-md" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="flex flex-col">
        {Array.from({ length: rows }).map((_, r) => (
          <div 
            key={`tr-${r}`}
            className="flex items-center gap-4 px-6 py-5"
            style={{ 
              borderBottom: r === rows - 1 ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}`
            }}
          >
            {/* First column usually has an avatar/icon + text */}
            <div className="flex items-center gap-3 w-full">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="space-y-2 w-full max-w-[150px]">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-[60%]" />
              </div>
            </div>

            {/* Remaining columns */}
            {Array.from({ length: columns - 1 }).map((_, c) => {
              // Deterministic pseudo-random width to prevent CLS and Hydration Mismatches
              const width = 40 + ((r * 7 + c * 13) % 40);
              return (
                <div key={`td-${r}-${c}`} className="w-full">
                  <Skeleton className="h-4" style={{ width: `${width}%` }} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
