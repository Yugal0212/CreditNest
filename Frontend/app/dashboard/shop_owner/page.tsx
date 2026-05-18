'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
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
  const isDark = theme === 'dark';

  /* ── Theme tokens ─────────────────────────────────────────── */
  const T = {
    card:        isDark ? '#1E293B' : '#FFFFFF',
    cardBorder:  isDark ? '#334155' : '#E2E8F0',
    cardShadow:  isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    text:        isDark ? '#F1F5F9' : '#0F172A',
    textSub:     isDark ? '#94A3B8' : '#64748B',
    textMuted:   isDark ? '#64748B' : '#94A3B8',
    divider:     isDark ? '#334155' : '#F1F5F9',
    innerBg:     isDark ? '#0F172A' : '#F8FAFC',
    innerBorder: isDark ? '#1E293B' : '#E2E8F0',
  };

  const card: React.CSSProperties = {
    background: T.card,
    border: `1px solid ${T.cardBorder}`,
    borderRadius: '12px',
    boxShadow: T.cardShadow,
  };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [requestId: string]: string[] }>({});
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      console.log('Fetching pending requests...');
      const res = await shopOwnerAPI.getOrderRequests({ limit: 5 }, { timeout: 15000 });
      console.log('Pending requests response:', res.data);
      console.log('Orders:', res.data.orders);
      console.log('Orders count:', res.data.orders?.length || 0);
      setRequests(res.data.orders || []);
      const initialSelections: { [key: string]: string[] } = {};
      (res.data.orders || []).forEach((req: any) => {
        initialSelections[req.id] = req.items.map((item: any, idx: number) => `${req.id}-${idx}`);
      });
      setSelectedItems(initialSelections);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      const errorCode = error?.code;
      const serverMessage = error?.response?.data?.message;
      if (error?.response) console.error('Error response:', error.response);
      let description = serverMessage || 'Failed to load pending requests';
      if (!serverMessage && (errorCode === 'ERR_NETWORK' || errorCode === 'ECONNABORTED')) {
        description = 'Cannot reach server. Please check backend connection and try again.';
      }
      toast({ title: 'Error', description, variant: 'destructive' });
    } finally {
      setRequestsLoading(false);
    }
  };

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
      toast({ title: 'No items selected', description: 'Please select at least one product to approve', variant: 'destructive' });
      return;
    }
    const request = requests.find(r => r.id === id);
    if (!request) return;
    const selectedIndices = selected.map(itemId => { const parts = itemId.split('-'); return parseInt(parts[parts.length - 1]); });
    const selectedProducts = request.items.filter((_: any, idx: number) => selectedIndices.includes(idx));
    const isPartialApproval = selectedProducts.length < request.items.length;
    console.log('=== APPROVING ORDER ===', { id, selectedProducts: selectedProducts.length, total: request.items.length, selectedIndices, isPartialApproval });
    setProcessingRequestId(id);
    try {
      const response = await shopOwnerAPI.approveOrder(id, selectedIndices);
      console.log('Approve response:', response.data);
      const approvalType = selectedProducts.length === request.items.length ? 'All products' : `${selectedProducts.length} product(s)`;
      toast({ title: '✅ Approved', description: `${approvalType} approved. Credit added to customer account.` });
      await Promise.all([fetchRequests(), fetchDashboardStats()]);
    } catch (err: any) {
      console.error('Error approving order:', err);
      let errorMsg = 'Failed to approve request';
      if (err.response?.data?.message) errorMsg = err.response.data.message;
      if (err.response?.data?.debug) { console.error('Debug info:', err.response.data.debug); errorMsg += ` (${err.response.data.debug})`; }
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally { setProcessingRequestId(null); }
  };

  const handleReject = async (id: string) => {
    if (processingRequestId) return;
    console.log('=== REJECTING ORDER ===', id);
    setProcessingRequestId(id);
    try {
      const response = await shopOwnerAPI.rejectOrder(id);
      console.log('Reject response:', response.data);
      toast({ title: '❌ Rejected', description: 'Order request has been rejected' });
      await fetchRequests();
    } catch (err: any) {
      console.error('Error rejecting order:', err);
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to reject request', variant: 'destructive' });
    } finally { setProcessingRequestId(null); }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await shopOwnerAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to load dashboard', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const statsConfig = stats ? [
    { title: 'Credit Outstanding', value: `₹${(stats.totalCreditOutstanding || 0).toLocaleString()}`, sub: `${stats.totalCustomers || 0} total customers`, icon: IndianRupee, accent: '#CB4335', accentBg: isDark ? 'rgba(203, 67, 53, 0.15)' : '#FADBD8' },
    { title: 'Active Customers',   value: (stats.activeCustomers || 0).toString(),                      sub: `${stats.overdueCustomers || 0} overdue`,       icon: Users,        accent: isDark ? '#818cf8' : '#1A5276', accentBg: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB' },
    { title: 'Pending Payments',   value: `₹${(stats.pendingPayments || 0).toLocaleString()}`,          sub: stats.pendingPayments > 0 ? 'Needs attention' : 'All cleared', icon: Bell, accent: '#D4A017', accentBg: isDark ? 'rgba(212, 160, 23, 0.15)' : '#FEF9ED' },
    { title: 'This Month Sales',   value: `₹${(stats.thisMonthSales || 0).toLocaleString()}`,           sub: 'Current month revenue', icon: TrendingUp, accent: '#1E8449', accentBg: isDark ? 'rgba(30, 132, 73, 0.15)' : '#EDFAF3' },
  ] : [];

  const quickLinks = [
    { label: 'Customers',    sub: 'View and manage all customers',  icon: Users,       href: '/dashboard/shop_owner/customers' },
    { label: 'Products',     sub: 'Add or update your inventory',   icon: Package,     href: '/dashboard/shop_owner/products'  },
    { label: 'Orders',       sub: 'Track and fulfill orders',       icon: ShoppingBag, href: '/dashboard/shop_owner/orders'    },
  ];

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="SHOP_OWNER">
        <DashboardLayout>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', border: `3px solid ${isDark ? 'rgba(129, 140, 248, 0.1)' : '#EAF2FB'}`, borderTopColor: isDark ? '#818cf8' : '#1A5276', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: T.textSub, fontSize: '13px' }}>Loading dashboard…</p>
            </div>
          </div>
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
                Shop Dashboard
              </h1>
              <p style={{ color: T.textSub, marginTop: '6px', fontSize: '14px' }}>
                Welcome back, <strong style={{ color: T.text, fontWeight: 700 }}>{user?.name ?? 'Owner'}</strong> — your shop is live.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: isDark ? 'rgba(30, 132, 73, 0.15)' : '#EDFAF3', border: `1px solid ${isDark ? 'rgba(30, 132, 73, 0.3)' : '#BEE5C8'}`, borderRadius: '10px' }}>
              <Store size={14} color={isDark ? '#81c784' : '#1E8449'} strokeWidth={2.5} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#81c784' : '#1E8449' }}>Shop is Open</span>
            </div>
          </div>

          {/* ── KPI Stats ─────────────────────────────────────── */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#8A9BB0', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '12px' }}>Key Metrics</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
              {statsConfig.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={i}
                    style={{
                ...card,
                border: 'none',
                padding: '20px',
                borderLeft: `4px solid ${s.accent}`,
                borderTop: `1px solid ${T.cardBorder}`,
                borderRight: `1px solid ${T.cardBorder}`,
                borderBottom: `1px solid ${T.cardBorder}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'box-shadow 0.2s, transform 0.2s'
              }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(26,82,118,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow as string; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={s.accent} strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: T.textSub, background: T.innerBg, border: `1px solid ${T.innerBorder}`, padding: '3px 8px', borderRadius: '999px' }}>
                        {s.sub}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: isDark ? s.accent : '#1A5276', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>{s.value}</p>
                      <p style={{ fontSize: '13px', color: T.textSub, fontWeight: 500, marginTop: '4px' }}>{s.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Quick Links ───────────────────────────────────── */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#8A9BB0', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '12px' }}>Quick Access</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {quickLinks.map((link, i) => {
                const Icon = link.icon;
                return (
                  <Link key={i} href={link.href} style={{ textDecoration: 'none' }}>
                    <div
                      style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(26,82,118,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = isDark ? '#475569' : '#C5D9EC'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow as string; (e.currentTarget as HTMLElement).style.borderColor = T.cardBorder; }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={isDark ? '#818cf8' : '#1A5276'} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: 0, lineHeight: 1 }}>{link.label}</p>
                        <p style={{ fontSize: '12px', color: T.textSub, marginTop: '3px' }}>{link.sub}</p>
                      </div>
                      <ChevronRight size={15} color={T.textMuted} strokeWidth={2} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Pending Requests ──────────────────────────────── */}
          <div style={card}>
            {/* Card header */}
            <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: isDark ? 'rgba(212, 160, 23, 0.15)' : '#FEF9ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={14} color={isDark ? '#fbbf24' : '#D4A017'} strokeWidth={2} />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276', margin: 0 }}>Pending Requests</h2>
                {requests.length > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 700, background: isDark ? 'rgba(212, 160, 23, 0.15)' : '#FEF9ED', color: isDark ? '#fbbf24' : '#9A7D0A', border: `1px solid ${isDark ? 'rgba(212, 160, 23, 0.3)' : '#E8D4A0'}`, padding: '2px 8px', borderRadius: '999px' }}>
                    {requests.length} pending
                  </span>
                )}
              </div>
              <button
                onClick={fetchRequests}
                disabled={requestsLoading}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${T.innerBorder}`, background: T.innerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: requestsLoading ? 0.5 : 1 }}
                title="Refresh"
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
              ) : requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <CheckCircle2 size={40} color="#C2B9AD" strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: '#6B7280', fontWeight: 600, fontSize: '14px' }}>No pending requests</p>
                  <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Customer credit requests will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {requests.map((req) => {
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
                              {' '} • {req.items.length} item{req.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#818cf8' : '#1A5276', margin: 0 }}>₹{req.totalAmount.toLocaleString()}</p>
                            <p style={{ fontSize: '10px', color: T.textMuted, marginTop: '2px' }}>Total request</p>
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
                              {allSelected ? 'Deselect All' : 'Select All Products'}
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
                                {allSelected ? 'Total Amount' : 'Request Total'}
                              </p>
                              <p style={{ fontSize: '18px', fontWeight: 800, color: allSelected ? (isDark ? '#818cf8' : '#1A5276') : T.textMuted, margin: 0, textDecoration: allSelected ? 'none' : 'line-through', textDecorationColor: '#CB4335' }}>
                                ₹{req.totalAmount.toLocaleString()}
                              </p>
                            </div>
                            {!allSelected && currentSelections.length > 0 && (
                              <div>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Selected</p>
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
                                <><CheckCircle2 size={13} />{allSelected ? 'Approve All' : someSelected ? `Approve (${currentSelections.length})` : 'Approve'}</>
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
                              {processingRequestId === req.id ? <Loader2 size={13} className="animate-spin" /> : <><X size={13} />Reject</>}
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
