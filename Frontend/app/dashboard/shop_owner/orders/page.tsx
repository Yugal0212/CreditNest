'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Package, CheckCircle2, X, Loader2, Clock, Phone, IndianRupee,
  ShoppingBag, RefreshCw, Bell, ChevronRight, CheckSquare, Square,
} from 'lucide-react';

import { useState } from 'react';
import useSWR from 'swr';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

type OrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type OrderRequest = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  status: string;
  date: string;
  notes?: string;
  items: OrderItem[];
};

const gradients = [
  'from-teal-500 to-teal-600',
  'from-teal-500 to-teal-600',
  'from-teal-500 to-teal-600',
  'from-teal-500 to-teal-600',
  'from-teal-500 to-teal-600',
];

export default function ShopOwnerOrders() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});

  // SWR: auto-polls every 30s, revalidates on tab focus, dedupes for 20s
  const {
    data: swrData,
    isLoading,
    mutate,
  } = useSWR(
    ['orderRequests', language],
    async () => {
      const res = await shopOwnerAPI.getOrderRequests({ limit: 100 });
      const allOrders: OrderRequest[] = res.data.orders || [];
      // Initialise selections when data first loads
      setSelectedItems((prev) => {
        const next: Record<string, string[]> = { ...prev };
        allOrders.forEach((order) => {
          if (!next[order.id]) {
            next[order.id] = order.items.map((_, idx) => `${order.id}:${idx}`);
          }
        });
        return next;
      });
      return allOrders;
    },
    {
      refreshInterval: 30_000,        // auto-poll every 30s for new orders
      revalidateOnFocus: true,         // refetch when user returns to the tab
      dedupingInterval: 20_000,        // prevent double-fires within 20s
      keepPreviousData: true,
    }
  );

  const orders: OrderRequest[] = swrData || [];

  const toggleItemSelection = (orderId: string, itemKey: string) => {
    setSelectedItems((prev) => {
      const current = prev[orderId] || [];
      if (current.includes(itemKey)) {
        return { ...prev, [orderId]: current.filter((key) => key !== itemKey) };
      }
      return { ...prev, [orderId]: [...current, itemKey] };
    });
  };

  const toggleAllItems = (orderId: string, itemKeys: string[]) => {
    setSelectedItems((prev) => {
      const current = prev[orderId] || [];
      if (current.length === itemKeys.length) {
        return { ...prev, [orderId]: [] };
      }
      return { ...prev, [orderId]: itemKeys };
    });
  };

  const getSelectedIndices = (orderId: string) => {
    return (selectedItems[orderId] || [])
      .map((itemKey) => {
        const separatorIndex = itemKey.lastIndexOf(':');
        return separatorIndex === -1 ? NaN : Number(itemKey.substring(separatorIndex + 1));
      })
      .filter((index) => Number.isInteger(index));
  };

  const handleApprove = async (order: OrderRequest) => {
    const selectedIndices = getSelectedIndices(order.id);
    if (selectedIndices.length === 0) {
      toast({ title: t('orders_page.no_items_selected_title', 'No items selected'), description: t('orders_page.no_items_selected_desc', 'Select at least one item to approve'), variant: 'destructive' });
      return;
    }

    const approvedAmount = order.items
      .filter((_, idx) => selectedIndices.includes(idx))
      .reduce((sum, item) => sum + item.subtotal, 0);

    setActionLoading(order.id);
    try {
      await shopOwnerAPI.approveOrder(order.id, selectedIndices);
      toast({
        title: `✅ ${t('orders_page.approved_title', 'Approved!')}`,
        description: t('orders_page.approved_desc', '₹{{amount}} credit added to {{name}}\'s account', { amount: approvedAmount.toLocaleString(), name: order.customerName }),
      });
      // Optimistic: remove approved order from list immediately
      mutate((prev) => prev?.filter((o) => o.id !== order.id), false);
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.response?.data?.message || t('orders_page.error_approve', 'Failed to approve order'), variant: 'destructive' });
      mutate(); // revert on error
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string, customerName: string) => {
    if (!confirm(t('orders_page.reject_confirm_msg', 'Reject order request from {{name}}?', { name: customerName }))) return;
    setActionLoading(orderId);
    try {
      await shopOwnerAPI.rejectOrder(orderId);
      toast({
        title: t('orders_page.rejected_title', 'Rejected'),
        description: t('orders_page.rejected_desc', 'Order request from {{name}} was rejected', { name: customerName }),
      });
      // Optimistic: remove rejected order from list immediately
      mutate((prev) => prev?.filter((o) => o.id !== orderId), false);
    } catch (error: any) {
      toast({ title: t('common.error', 'Error'), description: error.response?.data?.message || t('orders_page.error_reject', 'Failed to reject order'), variant: 'destructive' });
      mutate(); // revert on error
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return t('common.minutes_ago', '{{count}}m ago', { count: diffMins });
    if (diffHours < 24) return t('common.hours_ago', '{{count}}h ago', { count: diffHours });
    if (diffDays === 1) return t('common.yesterday', 'Yesterday');
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2 sm:gap-3 flex-wrap">
                <span>{t('orders_page.title')}</span>
                {orders.length > 0 && (
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center animate-pulse">
                    {orders.length}
                  </span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">{t('orders_page.subtitle')}</p>
            </div>
            <button
              onClick={() => mutate()}
              className="w-10 h-10 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors flex-shrink-0"
              title={t('common.refresh', 'Refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Info Banner */}
          <div 
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-3 sm:p-4 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors border-indigo-500/20 dark:border-indigo-400/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-foreground mb-1">{t('orders_page.how_it_works_title')}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  {t('orders_page.how_it_works_desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-indigo-400" />
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all text-center py-12 sm:py-20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary dark:text-indigo-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-foreground mb-2">{t('orders_page.all_clear')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">{t('orders_page.no_pending')}</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              
                {orders.map((order, i) => (
                  <div
                    key={order.id}
                   
                   
                   
                   
                    className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all hover:border-indigo-500/20 dark:border-indigo-400/20 transition-all p-3 sm:p-6"
                  >
                    {/* Main row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white text-base sm:text-lg font-black shadow-lg flex-shrink-0`}>
                        {order.customerName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm sm:text-base font-bold text-foreground">{order.customerName}</p>
                          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-400/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('orders_page.pending_approval')}
                          </span>
                        </div>
                        {order.customerPhone && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />{order.customerPhone}
                          </p>
                        )}
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          {order.items.length} {order.items.length === 1 ? t('common.item', 'item') : t('common.items', 'items')} • {formatDate(order.date)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="text-left sm:text-right flex-shrink-0">
                          <p className="text-lg sm:text-xl font-black text-red-600">₹{order.totalAmount.toFixed(2)}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            {t('common.selected', 'Selected')}: {getSelectedIndices(order.id).length}/{order.items.length}
                          </p>
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="text-[10px] sm:text-xs text-primary dark:text-indigo-400 hover:text-teal-700 font-semibold transition-colors mt-0.5 flex items-center gap-1"
                          >
                            {expandedOrder === order.id ? t('common.hide_details', 'Hide Details') : t('common.view_details', 'View Details')}
                            <ChevronRight className={`w-3 h-3 transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`} />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(order)}
                            disabled={actionLoading === order.id || getSelectedIndices(order.id).length === 0}
                            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-[10px] sm:text-sm hover:opacity-90 transition-all disabled:opacity-50"
                            title={t('orders_page.approve_btn')}
                          >
                            {actionLoading === order.id ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                            <span className="hidden sm:inline">{t('orders_page.approve_btn')}</span>
                            <span className="sm:hidden">✓</span>
                          </button>
                          <button
                            onClick={() => handleReject(order.id, order.customerName)}
                            disabled={actionLoading === order.id}
                            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-bold text-[10px] sm:text-sm hover:bg-red-500/20 transition-all disabled:opacity-50"
                            title={t('orders_page.reject_btn')}
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{t('orders_page.reject_btn')}</span>
                            <span className="sm:hidden">✗</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Items */}
                    
                      {expandedOrder === order.id && (
                        <div
                         
                         
                         
                          className="overflow-hidden"
                        >
                          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 space-y-2">
                            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">{t('orders_page.requested_items')}</p>
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={() => toggleAllItems(order.id, order.items.map((_, idx) => `${order.id}:${idx}`))}
                                className="text-[10px] sm:text-xs font-bold text-primary dark:text-indigo-400 hover:text-teal-700 flex items-center gap-1"
                              >
                                {(selectedItems[order.id] || []).length === order.items.length ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                {(selectedItems[order.id] || []).length === order.items.length ? t('orders_page.deselect_all') : t('orders_page.select_all')}
                              </button>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {t('orders_page.approve_amount')}: ₹{order.items
                                  .filter((_, idx) => (selectedItems[order.id] || []).includes(`${order.id}:${idx}`))
                                  .reduce((sum, item) => sum + item.subtotal, 0)
                                  .toFixed(2)}
                              </span>
                            </div>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-card text-card-foreground border border-border shadow-sm">
                                <button
                                  onClick={() => toggleItemSelection(order.id, `${order.id}:${idx}`)}
                                  className="text-primary dark:text-indigo-400 hover:text-teal-700"
                                  title={t('common.selected', 'Selected')}
                                >
                                  {(selectedItems[order.id] || []).includes(`${order.id}:${idx}`) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </button>
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors flex items-center justify-center flex-shrink-0">
                                  <Package className="w-3 h-3 sm:w-4 sm:h-4 text-primary dark:text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">{item.productName}</p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t('common.qty', 'Qty')}: {item.quantity} × ₹{item.unitPrice.toFixed(2)}</p>
                                </div>
                                <p className="font-black text-foreground text-xs sm:text-sm flex-shrink-0">₹{item.subtotal.toFixed(2)}</p>
                              </div>
                            ))}
                            {order.notes && (
                              <div className="p-2 sm:p-3 rounded-lg bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors border border-indigo-500/20 dark:border-indigo-400/20 mt-2">
                                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold mb-1">{t('orders_page.customer_note')}</p>
                                <p className="text-xs sm:text-sm text-foreground">{order.notes}</p>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2">
                              <span className="text-xs sm:text-sm text-muted-foreground font-semibold">{t('common.total_amount', 'Total Amount')}</span>
                              <span className="text-base sm:text-lg font-black text-red-600">₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    
                  </div>
                ))}
              
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

