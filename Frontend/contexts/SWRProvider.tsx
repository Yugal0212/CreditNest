'use client';

import { SWRConfig } from 'swr';
import React from 'react';
import { toast } from '@/hooks/use-toast';

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000, // deduplicate identical requests within 5 seconds
        errorRetryCount: 3,
        onError: (error) => {
          if (error.status !== 401 && error.status !== 403 && error.status !== 404) {
             console.error("SWR Fetch Error:", error);
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
