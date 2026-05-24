'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'ADMIN' | 'SHOP_OWNER' | 'CUSTOMER';

export interface User {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  shopId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  shopOwnerLogin: (identifier: string) => Promise<{ requiresOTP: boolean }>;
  shopOwnerPasswordLogin: (identifier: string, password: string) => Promise<void>;
  shopOwnerVerifyOTP: (identifier: string, otp: string) => Promise<void>;
  shopOwnerRegisterComplete: (token: string, user: User) => void;
  customerLogin: (identifier: string) => Promise<{ requiresOTP: boolean }>;
  customerVerifyOTP: (identifier: string, otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getApiErrorMessage = (error: any, fallback: string) => {
    return error?.response?.data?.message || fallback;
  };

  const getStoredUserSafely = (storedUser: string | null): User | null => {
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  };

  const checkAuth = async () => {
    const token = getAuthToken();
    const storedUser = localStorage.getItem('user');

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Verify token is still valid and prefer canonical user from backend.
      const response = await authAPI.verifyToken();
      if (response.data.success) {
        const verifiedUser = response.data.user as User | undefined;
        const fallbackUser = getStoredUserSafely(storedUser);
        const resolvedUser = verifiedUser ?? fallbackUser;

        if (resolvedUser) {
          setUser(resolvedUser);
          localStorage.setItem('user', JSON.stringify(resolvedUser));
        } else {
          removeAuthToken();
          setUser(null);
        }
      } else {
        // Token invalid, clear auth
        removeAuthToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);

      // If backend is temporarily unavailable (network/5xx/DB outage), don't force logout.
      // Keep the stored user so the UI doesn't "flash" to login on refresh.
      const status = (error as any)?.response?.status as number | undefined;

      const isTransient =
        status === undefined ||
        status === 503 ||
        (typeof status === 'number' && status >= 500);

      const fallbackUser = getStoredUserSafely(storedUser);
      if (isTransient && fallbackUser) {
        setUser(fallbackUser);
      } else {
        // 401/403 etc: real auth failure -> clear
        removeAuthToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Admin login
  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      if (role === 'ADMIN') {
        const response = await authAPI.adminLogin(email, password);
        const { token, user: userData } = response.data;

        // Store token and user
        setAuthToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userData.name}!`,
        });
      } else {
        throw new Error('Use shopOwnerLogin or customerLogin for non-admin roles');
      }
    } catch (error: any) {
      const message = getApiErrorMessage(error, 'Login failed');
      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Shop Owner Login (Step 1: Send OTP)
  const shopOwnerLogin = async (identifier: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.shopOwnerLogin(identifier);
      toast({
        title: 'OTP Sent',
        description: response.data.message || 'Please check your email/phone for OTP',
      });
      return { requiresOTP: true };
    } catch (error: any) {
      const message = getApiErrorMessage(error, 'Failed to send OTP');
      const hint = error.response?.data?.hint;
      
      // Special handling for account not found
      if (error.response?.status === 404) {
        toast({
          title: 'Account Not Found',
          description: hint || 'Please complete your registration first. Click "Sign up" to create an account.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Shop Owner Password Login
  const shopOwnerPasswordLogin = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.shopOwnerPasswordLogin(identifier, password);
      const { token, user: userData } = response.data;

      // Store token and user
      setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error: any) {
      const message = getApiErrorMessage(error, 'Invalid credentials');
      const hint = error.response?.data?.hint;
      
      // Special handling for account not found
      if (error.response?.status === 404) {
        toast({
          title: 'Account Not Found',
          description: hint || 'Please complete your registration first. Click "Sign up" to create an account.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: message,
          variant: 'destructive',
        });
      }
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Shop Owner Login (Step 2: Verify OTP)
  const shopOwnerVerifyOTP = async (identifier: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.shopOwnerVerifyLoginOTP(identifier, otp);
      const { token, user: userData } = response.data;

      // Store token and user
      setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error: any) {
      const message = getApiErrorMessage(error, 'Invalid OTP');
      toast({
        title: 'Verification Failed',
        description: message,
        variant: 'destructive',
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Shop Owner Registration Complete (Called after OTP verification)
  const shopOwnerRegisterComplete = (token: string, userData: User) => {
    // Store token and user
    setAuthToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    toast({
      title: 'Registration Successful',
      description: `Welcome to CreditNest, ${userData.name}!`,
    });
  };

  // Customer Login (Step 1: Send OTP)
  const customerLogin = async (identifier: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.customerLogin(identifier);
      toast({
        title: 'OTP Sent',
        description: response.data.message || 'Please check your email/phone for OTP',
      });
      return { requiresOTP: true };
    } catch (error: any) {
      const apiMessage = error.response?.data?.message;
      const message = getApiErrorMessage(error, apiMessage || 'Failed to send OTP');
      const isNotFound = error.response?.status === 404;
      toast({
        title: isNotFound ? 'Account Not Found' : 'Error',
        description: message,
        variant: 'destructive',
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Customer Login (Step 2: Verify OTP)
  const customerVerifyOTP = async (identifier: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.customerVerifyOTP(identifier, otp);
      const { token, user: userData } = response.data;

      // Store token and user
      setAuthToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error: any) {
      const message = getApiErrorMessage(error, 'Invalid OTP');
      toast({
        title: 'Verification Failed',
        description: message,
        variant: 'destructive',
      });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      removeAuthToken();
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        shopOwnerLogin,
        shopOwnerPasswordLogin,
        shopOwnerVerifyOTP,
        shopOwnerRegisterComplete,
        customerLogin,
        customerVerifyOTP,
        logout,
        isAuthenticated: !!user,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
