'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';
import { useAuth } from './AuthContext';
import { shopOwnerAPI } from '@/lib/api';

interface Notification {
  id: string;
  type: 'order_request' | 'payment' | 'system';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user || user.role !== 'SHOP_OWNER') return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const res = await shopOwnerAPI.getOrderRequests({ limit: 10 }, { timeout: 8000 });
      const orders = res.data.orders || [];

      const orderNotifications: Notification[] = orders.map((order: any) => ({
        id: order.id,
        type: 'order_request' as const,
        title: 'New Order Request',
        message: `${order.customerName} requested ₹${order.totalAmount.toLocaleString()} credit`,
        date: new Date(order.date),
        read: false,
        data: order
      }));

      setNotifications(orderNotifications);
    } catch (error: any) {
      const err = error as AxiosError;
      const silentCodes = ['ERR_NETWORK', 'ECONNREFUSED', 'ECONNABORTED'];
      if (!silentCodes.includes(err.code || '')) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'SHOP_OWNER') {
      setNotifications([]);
      return;
    }

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications, isAuthenticated, user]);

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
