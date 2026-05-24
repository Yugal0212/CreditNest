import React from 'react';
import { DashboardLayoutSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function ShopOwnerLoading() {
  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <DashboardLayoutSkeleton />
    </div>
  );
}
