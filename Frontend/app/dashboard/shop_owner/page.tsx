'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardLayoutSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  IndianRupee, Users, Package, TrendingUp, ArrowUpRight, CreditCard,
  AlertCircle, Clock, CheckCircle2, ShoppingBag, Bell, ChevronRight, Zap, Loader2, RefreshCw, X,
  CheckSquare, Square, ChevronDown, Store,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

/* ── Interfaces ─────────────────────────────────────────────── */
interface DashboardStats {
  totalCreditOutstanding: number;
  activeCustomers: number;
  totalCustomers: number;
  overdueCustomers: number;
  thisMonthSales: number;
  pendingPayments: number;
}

export default function ShopOwnerDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  /* ── Theme tokens ─────────────────────────────────────────── */
  const T = {
    card:        isDark ? '#0f172a' : '#FFFFFF',
    cardBorder:  isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6',
    cardShadow:  isDark ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.04)',
    text:        isDark ? '#F1F5F9' : '#0f172a',
    textSub:     isDark ? '#64748B' : '#64748b',
    textMuted:   isDark ? '#475569' : '#94a3b8',
    divider:     isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
    innerBg:     isDark ? '#0b1222' : '#f8fafc',
    innerBorder: isDark ? 'rgba(255,255,255,0.06)' : '#e8eef6',
  };

  const card: React.CSSProperties = {
    background: T.card,
    border: `1px solid ${T.cardBorder}`,
    borderRadius: '12px',
    boxShadow: T.cardShadow,
  };

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [requestId: string]: string[] }>({});
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, mutate: mutateStats } = useSWR(
    ['shopOwnerDashboardStats', language],
    () => shopOwnerAPI.getDashboardStats().then((res: any) => res.data.stats),
    { 
      revalidateOnFocus: true,
      dedupingInterval: 60000 
    }
  );

  const { data: requests, isLoading: requestsLoading, mutate: mutateRequests } = useSWR(
    ['shopOwnerPendingRequests', language],
    async () => {
      const res = await shopOwnerAPI.getOrderRequests({ limit: 5 }, { timeout: 15000 });
      const orders = res.data.orders || [];
      const initialSelections: { [key: string]: string[] } = {};
      orders.forEach((req: any) => {
        initialSelections[req.id] = req.items.map((item: any, idx: number) => `${req.id}-${idx}`);
      });
      setSelectedItems(initialSelections);
      return orders;
    },
    { revalidateOnFocus: true }
  );

  const isLoading = statsLoading || requestsLoading;

  const toggleItemSelection = (requestId: string, itemId: string) => {
    setSelectedItems(prev => {
      const current = prev[requestId] || [];
      if (current.includes(itemId)) return { ...prev, [requestId]: current.filter(id => id !== itemId) };
      else return { ...prev, [requestId]: [...current, itemId] };
    });
  };

  const toggleAllItems = (requestId: string, allItemIds: string[]) => {
    setSelectedItems(prev => {
      const current = prev[requestId] || [];
      if (current.length === allItemIds.length) return { ...prev, [requestId]: [] };
      else return { ...prev, [requestId]: allItemIds };
    });
  };

  const handleApprove = async (id: string) => {
    if (processingRequestId) return;
    const selected = selectedItems[id] || [];
    if (selected.length === 0) {
      toast({ title: t('seller_dashboard.title_no_items', 'No items selected'), description: t('seller_dashboard.desc_no_items', 'Please select at least one product to approve'), variant: 'destructive' });
      return;
    }
    const request = requests?.find((r: any) => r.id === id);
    if (!request) return;
    const selectedIndices = selected.map(itemId => { const parts = itemId.split('-'); return parseInt(parts[parts.length - 1]); });
    const selectedProducts = request.items.filter((_: any, idx: number) => selectedIndices.includes(idx));
    const isPartialApproval = selectedProducts.length < request.items.length;
    console.log('=== APPROVING ORDER ===', { id, selectedProducts: selectedProducts.length, total: request.items.length, selectedIndices, isPartialApproval });
    setProcessingRequestId(id);
    try {
      const response = await shopOwnerAPI.approveOrder(id, selectedIndices);
      console.log('Approve response:', response.data);
      const approvalType = selectedProducts.length === request.items.length ? t('seller_dashboard.all_products', 'All products') : t('seller_dashboard.product_count', '{{count}} product(s)', { count: selectedProducts.length });
      toast({ title: `✅ ${t('seller_dashboard.approved', 'Approved')}`, description: t('seller_dashboard.approved_desc', '{{type}} approved. Credit added to customer account.', { type: approvalType }) });
      await Promise.all([mutateRequests(), mutateStats()]);
    } catch (err: any) {
      console.error('Error approving order:', err);
      let errorMsg = t('seller_dashboard.err_approve', 'Failed to approve request');
      if (err.response?.data?.message) errorMsg = err.response.data.message;
      if (err.response?.data?.debug) { console.error('Debug info:', err.response.data.debug); errorMsg += ` (${err.response.data.debug})`; }
      toast({ title: t('common.error', 'Error'), description: errorMsg, variant: 'destructive' });
    } finally { setProcessingRequestId(null); }
  };

  const handleReject = async (id: string) => {
    if (processingRequestId) return;
    console.log('=== REJECTING ORDER ===', id);
    setProcessingRequestId(id);
    try {
      const response = await shopOwnerAPI.rejectOrder(id);
      console.log('Reject response:', response.data);
      toast({ title: `❌ ${t('seller_dashboard.rejected', 'Rejected')}`, description: t('seller_dashboard.rejected_desc', 'Order request has been rejected') });
      await mutateRequests();
    } catch (err: any) {
      console.error('Error rejecting order:', err);
      toast({ title: t('common.error', 'Error'), description: err.response?.data?.message || t('seller_dashboard.err_reject', 'Failed to reject request'), variant: 'destructive' });
    } finally { setProcessingRequestId(null); }
  };

  const statsConfig = stats ? [
    { title: t('seller_dashboard.outstanding_dues'), value: `₹${(stats.totalCreditOutstanding || 0).toLocaleString()}`, sub: `${stats.totalCustomers || 0} ${t('admin_dashboard.customers').toLowerCase()}`, icon: IndianRupee, accent: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
    { title: t('seller_dashboard.active_customers'),   value: (stats.activeCustomers || 0).toString(),                      sub: t('seller_dashboard.overdue_count', '{{count}} overdue', { count: stats.overdueCustomers || 0 }),       icon: Users,        accent: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    { title: t('seller_dashboard.pending_orders'),   value: `₹${(stats.pendingPayments || 0).toLocaleString()}`,          sub: stats.pendingPayments > 0 ? t('common.loading') : t('common.success'), icon: Bell, accent: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { title: t('admin_dashboard.this_month'),   value: `₹${(stats.thisMonthSales || 0).toLocaleString()}`,           sub: t('admin_dashboard.this_month'), icon: TrendingUp, accent: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  ] : [];

  const quickLinks = [
    { label: t('sidebar.items.customers'),    sub: t('admin_dashboard.manage_users_sub'),  icon: Users,       href: '/dashboard/shop_owner/customers', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { label: t('sidebar.items.products'),     sub: t('seller_dashboard.subtitle'),   icon: Package,     href: '/dashboard/shop_owner/products', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
    { label: t('sidebar.items.orders'),       sub: t('seller_dashboard.recent_orders'),       icon: ShoppingBag, href: '/dashboard/shop_owner/orders', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)'    },
  ];

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="SHOP_OWNER">
        <DashboardLayout>
          <DashboardLayoutSkeleton />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* ── Page Header ───────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: isDark ? '#818cf8' : '#1A5276', letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
                {t('seller_dashboard.title')}
              </h1>
              <p style={{ color: T.textSub, marginTop: '6px', fontSize: '14px' }}>
                {t('seller_dashboard.welcome')} <strong style={{ color: T.text, fontWeight: 700 }}>{user?.name ?? 'Owner'}</strong> {t('seller_dashboard.shop_live', '— your shop is live.')}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#FFFFFF', border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'}`, borderRadius: '10px', boxShadow: isDark ? 'none' : '0 2px 4px rgba(16,185,129,0.1)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              <Store size={14} color="#10B981" strokeWidth={2.5} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#10B981' }}>{t('seller_dashboard.shop_open', 'Shop is Open')}</span>
            </div>
          </div>

          {/* ── KPI Stats ─────────────────────────────────────── */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#8A9BB0', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '12px' }}>{t('admin_dashboard.key_metrics')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              {statsConfig.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={i}
                    style={{
                ...card,
                border: `1.5px solid ${T.cardBorder}`,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'box-shadow 0.2s, transform 0.2s',
                borderRadius: '14px',
                position: 'relative',
                overflow: 'hidden',
                background: T.card,
              }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = T.cardShadow as string; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                  >
                    {/* Top Gradient Stripe */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: s.gradient }} />
                    {/* Corner Glow */}
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: s.accent, opacity: isDark ? 0.1 : 0.05, filter: 'blur(20px)', borderRadius: '50%' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                      {/* Icon Badge Top Left */}
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDark ? `rgba(${parseInt(s.accent.slice(1,3),16)},${parseInt(s.accent.slice(3,5),16)},${parseInt(s.accent.slice(5,7),16)},0.15)` : `rgba(${parseInt(s.accent.slice(1,3),16)},${parseInt(s.accent.slice(3,5),16)},${parseInt(s.accent.slice(5,7),16)},0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={s.accent} strokeWidth={2.5} />
                      </div>
                      {/* Status Chip Top Right */}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: s.accent, background: isDark ? `rgba(${parseInt(s.accent.slice(1,3),16)},${parseInt(s.accent.slice(3,5),16)},${parseInt(s.accent.slice(5,7),16)},0.15)` : `rgba(${parseInt(s.accent.slice(1,3),16)},${parseInt(s.accent.slice(3,5),16)},${parseInt(s.accent.slice(5,7),16)},0.08)`, padding: '4px 10px', borderRadius: '999px' }}>
                        {s.sub}
                      </span>
                    </div>
                    <div style={{ marginTop: '8px', position: 'relative', zIndex: 1 }}>
                      <p style={{ fontSize: '28px', fontWeight: 700, color: T.text, letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>{s.value}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginTop: '6px' }}>{s.title}</p>
                    </div>

                    {/* Thin Progress Bar at Bottom */}
                    <div style={{ width: '100%', height: '3px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden', marginTop: 'auto' }}>
                      <div style={{ width: `${Math.max(10, 40 + ((i * 23) % 50))}%`, height: '100%', background: s.accent }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Quick Links ───────────────────────────────────── */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#8A9BB0', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '12px' }}>{t('admin_dashboard.quick_actions')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {quickLinks.map((link, i) => {
                const Icon = link.icon;
                return (
                  <Link key={i} href={link.href} style={{ textDecoration: 'none' }}>
                    <div
                      style={{ ...card, padding: '20px', borderRadius: '14px', border: `1.5px solid ${T.cardBorder}`, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s', background: T.card }}
                      onMouseEnter={e => { 
                        (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 10px 40px rgba(0,0,0,0.08)'; 
                        (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; 
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                        const arrowBtn = e.currentTarget.querySelector('.arrow-btn') as HTMLElement;
                        if(arrowBtn) { arrowBtn.style.background = '#6366f1'; arrowBtn.style.color = '#ffffff'; arrowBtn.style.borderColor = '#6366f1'; }
                      }}
                      onMouseLeave={e => { 
                        (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow as string; 
                        (e.currentTarget as HTMLElement).style.borderColor = T.cardBorder; 
                        (e.currentTarget as HTMLElement).style.transform = 'none';
                        const arrowBtn = e.currentTarget.querySelector('.arrow-btn') as HTMLElement;
                        if(arrowBtn) { arrowBtn.style.background = 'transparent'; arrowBtn.style.color = T.textMuted; arrowBtn.style.borderColor = T.cardBorder; }
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: link.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <Icon size={24} color="#ffffff" strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: T.text, margin: 0, lineHeight: 1 }}>{link.label}</p>
                        <p style={{ fontSize: '13px', color: T.textSub, marginTop: '5px' }}>{link.sub}</p>
                      </div>
                      <div className="arrow-btn" style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1.5px solid ${T.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: T.textMuted, transition: 'all 0.2s' }}>
                        <ArrowUpRight size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Pending Requests ──────────────────────────────── */}
          <div style={{ ...card, borderRadius: '14px', border: `1.5px solid ${T.cardBorder}`, overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: isDark ? 'rgba(212, 160, 23, 0.15)' : '#FEF9ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={14} color={isDark ? '#fbbf24' : '#D4A017'} strokeWidth={2} />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276', margin: 0 }}>{t('seller_dashboard.pending_requests', 'Pending Requests')}</h2>
                {requests && requests.length > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 700, background: isDark ? 'rgba(212, 160, 23, 0.15)' : '#FEF9ED', color: isDark ? '#fbbf24' : '#9A7D0A', border: `1px solid ${isDark ? 'rgba(212, 160, 23, 0.3)' : '#E8D4A0'}`, padding: '2px 8px', borderRadius: '999px' }}>
                    {t('seller_dashboard.pending_count', '{{count}} pending', { count: requests.length })}
                  </span>
                )}
              </div>
              <button
                onClick={() => mutateRequests()}
                disabled={requestsLoading}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${T.innerBorder}`, background: T.innerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: requestsLoading ? 0.5 : 1 }}
                title={t('seller_dashboard.refresh', 'Refresh')}
              >
                <RefreshCw size={13} color={T.textSub} className={requestsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 22px' }}>
              {requestsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                  <div style={{ width: '28px', height: '28px', border: '3px solid #EAF2FB', borderTopColor: '#1A5276', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : !requests || requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: `2px dashed ${T.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <CheckCircle2 size={36} color="#CBD5E1" strokeWidth={1.5} />
                  </div>
                  <p style={{ color: T.text, fontWeight: 700, fontSize: '16px' }}>{t('seller_dashboard.no_pending_requests', 'No pending requests')}</p>
                  <p style={{ color: T.textSub, fontSize: '14px', marginTop: '6px' }}>{t('seller_dashboard.pending_requests_subtitle', 'Customer credit requests will appear here.')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {requests.map((req: any) => {
                    const allItemIds = req.items.map((_: any, idx: number) => `${req.id}-${idx}`);
                    const currentSelections = selectedItems[req.id] || [];
                    const allSelected = currentSelections.length === allItemIds.length && allItemIds.length > 0;
                    const someSelected = currentSelections.length > 0 && currentSelections.length < allItemIds.length;
                    const selectedTotal = req.items.reduce((sum: number, item: any, idx: number) => currentSelections.includes(`${req.id}-${idx}`) ? sum + item.subtotal : sum, 0);
                    const isExpanded = expandedRequest === req.id;

                    return (
                      <div key={req.id} style={{ border: `1px solid ${T.innerBorder}`, borderRadius: '12px', overflow: 'hidden', background: T.card }}>
                        {/* Request header row */}
                        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: T.innerBg, cursor: 'pointer' }} onClick={() => setExpandedRequest(isExpanded ? null : req.id)}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={16} color={isDark ? '#818cf8' : '#1A5276'} strokeWidth={2} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: 0, lineHeight: 1 }}>{req.customerName}</p>
                            <p style={{ fontSize: '11px', color: T.textSub, marginTop: '3px' }}>
                              {new Date(req.date).toLocaleDateString('en-IN')} • {new Date(req.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              {' '} • {req.items.length === 1 ? t('seller_dashboard.items_count', '{{count}} item', { count: 1 }) : t('seller_dashboard.items_count_plural', '{{count}} items', { count: req.items.length })}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#818cf8' : '#1A5276', margin: 0 }}>₹{req.totalAmount.toLocaleString()}</p>
                            <p style={{ fontSize: '10px', color: T.textMuted, marginTop: '2px' }}>{t('seller_dashboard.total_request', 'Total request')}</p>
                          </div>
                          <ChevronDown size={16} color={T.textSub} strokeWidth={2} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                        </div>

                        {/* Expandable items */}
                        {isExpanded && (
                          <div style={{ padding: '12px 16px 0', borderTop: `1px solid ${T.divider}` }}>
                            {/* Select all toggle */}
                            <button
                              onClick={() => toggleAllItems(req.id, allItemIds)}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 0 10px', background: 'none', border: 'none', fontSize: '12px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276', cursor: 'pointer' }}
                            >
                              {allSelected ? <CheckSquare size={14} color={isDark ? '#818cf8' : '#1A5276'} /> : <Square size={14} color={T.textSub} />}
                              {allSelected ? t('seller_dashboard.deselect_all', 'Deselect All') : t('seller_dashboard.select_all', 'Select All Products')}
                            </button>

                            {/* Product rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                              {req.items.map((item: any, idx: number) => {
                                const itemId = `${req.id}-${idx}`;
                                const isSelected = currentSelections.includes(itemId);
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => toggleItemSelection(req.id, itemId)}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '10px',
                                      padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                                      border: `1px solid ${isSelected ? (isDark ? '#475569' : '#C5D9EC') : T.innerBorder}`,
                                      background: isSelected ? (isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB') : T.innerBg,
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    <div style={{ flexShrink: 0 }}>
                                      {isSelected ? <CheckSquare size={15} color={isDark ? '#818cf8' : '#1A5276'} /> : <Square size={15} color={T.textSub} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</p>
                                      <p style={{ fontSize: '11px', color: T.textSub, marginTop: '1px' }}>Qty: {item.quantity} × ₹{item.unitPrice}</p>
                                    </div>
                                    <p style={{ fontSize: '14px', fontWeight: 800, color: isDark ? '#818cf8' : '#1A5276', flexShrink: 0 }}>₹{item.subtotal.toLocaleString()}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Footer: amount + action buttons */}
                        <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div>
                              <p style={{ fontSize: '10px', fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                                {allSelected ? t('seller_dashboard.total_amount', 'Total Amount') : t('seller_dashboard.request_total', 'Request Total')}
                              </p>
                              <p style={{ fontSize: '18px', fontWeight: 800, color: allSelected ? (isDark ? '#818cf8' : '#1A5276') : T.textMuted, margin: 0, textDecoration: allSelected ? 'none' : 'line-through', textDecorationColor: '#CB4335' }}>
                                ₹{req.totalAmount.toLocaleString()}
                              </p>
                            </div>
                            {!allSelected && currentSelections.length > 0 && (
                              <div>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{t('seller_dashboard.selected', 'Selected')}</p>
                                <p style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#818cf8' : '#1A5276', margin: 0 }}>₹{selectedTotal.toLocaleString()}</p>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={processingRequestId !== null || currentSelections.length === 0}
                              style={{
                                padding: '9px 16px', borderRadius: '9px', border: 'none',
                                background: isDark ? '#818cf8' : '#1A5276', color: '#FFFFFF',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px',
                                opacity: (processingRequestId !== null || currentSelections.length === 0) ? 0.5 : 1,
                                transition: 'background 0.15s',
                              }}
                            >
                              {processingRequestId === req.id ? (
                                <><Loader2 size={13} className="animate-spin" /> Processing…</>
                              ) : (
                                <><CheckCircle2 size={13} />{allSelected ? t('seller_dashboard.approve_all', 'Approve All') : someSelected ? t('seller_dashboard.approve_count', 'Approve ({{count}})', { count: currentSelections.length }) : t('seller_dashboard.approve', 'Approve')}</>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={processingRequestId !== null}
                              style={{
                                padding: '9px 14px', borderRadius: '9px',
                                border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#F5C6C2'}`,
                                background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FADBD8',
                                color: '#CB4335', fontSize: '12px', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                                opacity: processingRequestId !== null ? 0.5 : 1,
                                transition: 'background 0.15s',
                              }}
                            >
                              {processingRequestId === req.id ? <Loader2 size={13} className="animate-spin" /> : <><X size={13} />{t('seller_dashboard.reject', 'Reject')}</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
