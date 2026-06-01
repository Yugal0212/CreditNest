'use client';

import { SWRConfig } from 'swr';
import React from 'react';
import { toast } from '@/hooks/use-toast';

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig
      value={{
        // Global defaults to match React Query behavior
        revalidateOnFocus: false,        // prevents refetch on every tab switch
        revalidateIfStale: false,        // prevents refetch on mount if data exists and is fresh
        revalidateOnReconnect: true,     // always refresh after network loss
        dedupingInterval: 300_000,       // 5m dedup window — acts as staleTime
        focusThrottleInterval: 300_000,  // throttles focus revalidation
        keepPreviousData: true,          // prevents layout shift on pagination
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        onError: (error) => {
          if (error.status !== 401 && error.status !== 403 && error.status !== 404) {
            console.error('SWR Fetch Error:', error);
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
