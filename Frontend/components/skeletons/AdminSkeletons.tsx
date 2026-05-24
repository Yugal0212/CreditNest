import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminAnalyticsSkeleton = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64 premium-shimmer rounded-xl" />
        <Skeleton className="h-4 w-96 premium-shimmer rounded-lg" />
      </div>
      <Skeleton className="h-10 w-[240px] premium-shimmer rounded-xl" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col gap-4">
          <Skeleton className="h-4 w-24 premium-shimmer rounded-md" />
          <Skeleton className="h-10 w-16 premium-shimmer rounded-lg" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card bg-card p-6 rounded-xl border border-border h-[400px]">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-10 w-10 premium-shimmer rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 premium-shimmer rounded-md" />
            <Skeleton className="h-3 w-32 premium-shimmer rounded-md" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32 premium-shimmer rounded-md" />
                <Skeleton className="h-4 w-16 premium-shimmer rounded-md" />
              </div>
              <Skeleton className="h-2 w-full premium-shimmer rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card bg-card p-6 rounded-xl border border-border h-[400px] flex items-center justify-center flex-col gap-6">
        <Skeleton className="h-24 w-24 premium-shimmer rounded-full" />
        <Skeleton className="h-8 w-64 premium-shimmer rounded-xl" />
        <Skeleton className="h-4 w-80 premium-shimmer rounded-lg" />
      </div>
    </div>
  </div>
);

export const AdminLogsSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 premium-shimmer rounded-xl" />
        <Skeleton className="h-4 w-72 premium-shimmer rounded-lg" />
      </div>
    </div>

    <div className="glass-card bg-card border border-border shadow-sm rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20">
        <Skeleton className="h-6 w-32 premium-shimmer rounded-md" />
        <Skeleton className="h-10 w-full sm:w-[300px] premium-shimmer rounded-xl" />
      </div>
      <div className="divide-y divide-border/40">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div className="flex gap-4 items-start w-full">
              <Skeleton className="h-10 w-10 premium-shimmer rounded-xl shrink-0" />
              <div className="space-y-2 w-full max-w-md">
                <Skeleton className="h-5 w-48 premium-shimmer rounded-md" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-20 premium-shimmer rounded-full" />
                  <Skeleton className="h-4 w-32 premium-shimmer rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 ml-14 sm:ml-0">
              <Skeleton className="h-6 w-24 premium-shimmer rounded-lg" />
              <Skeleton className="h-4 w-20 premium-shimmer rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AdminSystemSkeleton = () => (
  <div className="space-y-8 animate-in fade-in duration-500 p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="space-y-2">
        <Skeleton className="h-10 w-72 premium-shimmer rounded-xl" />
        <Skeleton className="h-4 w-96 premium-shimmer rounded-lg" />
      </div>
      <Skeleton className="h-10 w-[200px] premium-shimmer rounded-xl" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <Skeleton className="h-6 w-48 premium-shimmer rounded-md bg-white/10" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-6">
                <Skeleton className="h-4 w-24 premium-shimmer rounded-md bg-white/10" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16 premium-shimmer rounded-lg bg-white/10" />
                  <Skeleton className="h-2 w-full premium-shimmer rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <Skeleton className="h-6 w-64 premium-shimmer rounded-md bg-white/10" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <Skeleton className="h-3 w-20 premium-shimmer rounded-md bg-white/10" />
                <Skeleton className="h-8 w-16 premium-shimmer rounded-lg bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-6 shadow-xl h-[220px] space-y-6">
          <Skeleton className="h-5 w-24 premium-shimmer rounded-full bg-white/10" />
          <Skeleton className="h-6 w-64 premium-shimmer rounded-md bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full premium-shimmer rounded-md bg-white/10" />
            <Skeleton className="h-3 w-3/4 premium-shimmer rounded-md bg-white/10" />
          </div>
        </div>

        <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <Skeleton className="h-6 w-48 premium-shimmer rounded-md bg-white/10 mb-6" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full premium-shimmer rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
