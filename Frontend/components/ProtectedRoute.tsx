'use client';

import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Wait for component to mount (hydration)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check authentication after hydration
  useEffect(() => {
    if (!isMounted || isLoading) return;

    if (!user || user.role !== requiredRole) {
      router.push('/login');
    }
  }, [isMounted, isLoading, user, requiredRole, router]);

  // Show nothing while hydrating or checking auth (GlobalPreloader handles initial load)
  if (!isMounted || isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  // Don't render if not authenticated
  if (!user || user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
};
