'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  IndianRupee, Package, CheckCircle2, Clock, TrendingDown,
  AlertCircle, ChevronRight, CreditCard, Store,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { customerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface DashboardData {
  creditBalance: number;
  totalPurchases: number;
  totalPaid: number;
  lastPurchaseDate: string | null;
  status: string;
  shop: {
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    email: string;
  };
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

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

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchDashboard(); fetchHistory(); }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await customerAPI.getOrders({ limit: 5 });
      setRecentHistory(res.data.orders || []);
    } catch {} finally { setHistoryLoading(false); }
  };

  const fetchDashboard = async () => {
    try {
      const response = await customerAPI.getDashboard();
      setDashboardData(response.data.dashboard);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to load dashboard', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No purchases yet';
    const date = new Date(dateString);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="CUSTOMER">
        <DashboardLayout>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', border: `3px solid ${isDark ? 'rgba(129, 140, 248, 0.1)' : '#EAF2FB'}`, borderTopColor: isDark ? '#818cf8' : '#1A5276', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: T.textSub, fontSize: '13px' }}>Loading your account…</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!dashboardData) {
    return (
      <ProtectedRoute requiredRole="CUSTOMER">
        <DashboardLayout>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <p style={{ color: T.textSub }}>No data available</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const { creditBalance, totalPurchases, totalPaid, lastPurchaseDate, status, shop } = dashboardData;

  const kpiCards = [
    { title: t('customer_dashboard.total_transactions'), value: `₹${(totalPurchases || 0).toLocaleString()}`,  icon: CreditCard,     accent: isDark ? '#818cf8' : '#1A5276', accentBg: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', sub: t('admin_dashboard.registered') },
    { title: t('customer_dashboard.last_payment'),        value: `₹${(totalPaid || 0).toLocaleString()}`,        icon: CheckCircle2,   accent: isDark ? '#34d399' : '#1E8449', accentBg: isDark ? 'rgba(52, 211, 153, 0.15)' : '#EDFAF3', sub: t('common.success') },
    { title: t('customer_dashboard.my_outstanding'),    value: `₹${(creditBalance || 0).toLocaleString()}`,    icon: IndianRupee,    accent: creditBalance > 0 ? '#f87171' : (isDark ? '#34d399' : '#1E8449'), accentBg: creditBalance > 0 ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FADBD8') : (isDark ? 'rgba(52, 211, 153, 0.15)' : '#EDFAF3'), sub: t('customer_dashboard.my_outstanding') },
  ];

  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* ── Page Header ─────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: isDark ? '#818cf8' : '#1A5276', letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
                {t('customer_dashboard.title')}
              </h1>
              <p style={{ color: T.textSub, marginTop: '6px', fontSize: '14px' }}>
                {t('customer_dashboard.welcome')} <strong style={{ color: T.text, fontWeight: 700 }}>{user?.name ?? 'Customer'}</strong> — {t('customer_dashboard.subtitle')}
              </p>
            </div>
            {creditBalance > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FADBD8', border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#F5C6C2'}`, borderRadius: '10px' }}>
                <AlertCircle size={14} color="#f87171" strokeWidth={2.5} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f87171' }}>₹{(creditBalance || 0).toLocaleString()} due</span>
              </div>
            )}
          </div>

          {/* ── KPI Cards ───────────────────────────────────── */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: T.textSub, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '12px' }}>{t('admin_dashboard.key_metrics')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {kpiCards.map((k, i) => {
                const Icon = k.icon;
                return (
                  <div
                    key={i}
                    style={{ ...card, padding: '20px', borderLeft: `4px solid ${k.accent}`, display: 'flex', flexDirection: 'column', gap: '14px', transition: 'box-shadow 0.2s, transform 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(26,82,118,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow as string; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: k.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={k.accent} strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: T.textSub, background: T.innerBg, border: `1px solid ${T.innerBorder}`, padding: '3px 8px', borderRadius: '999px' }}>
                        {k.sub}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: k.accent, letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>{k.value}</p>
                      <p style={{ fontSize: '13px', color: T.textSub, fontWeight: 500, marginTop: '4px' }}>{k.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Outstanding Alert ──────────────────────────── */}
          {creditBalance > 0 && (
            <div style={{ padding: '16px 20px', background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF3F2', border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#F5C6C2'}`, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FADBD8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={18} color="#f87171" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: 0 }}>Outstanding Payment Due</p>
                  <p style={{ fontSize: '12px', color: T.textSub, marginTop: '2px' }}>Please clear your pending balance to {shop.name}</p>
                </div>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#f87171', flexShrink: 0 }}>₹{(creditBalance || 0).toLocaleString()}</p>
            </div>
          )}

          {/* ── Shop Info + Recent Activity ─────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            {/* Shop Card */}
            <div style={card}>
              <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={14} color={isDark ? '#818cf8' : '#1A5276'} strokeWidth={2} />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276', margin: 0 }}>{t('roles.SHOP_OWNER')}</h2>
              </div>

              <div style={{ padding: '20px 22px' }}>
                {/* Shop identity */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: isDark ? 'linear-gradient(135deg, #1E1B4B, #312E81)' : 'linear-gradient(135deg, #1A5276, #2E86C1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(26,82,118,0.20)' }}>
                    <Package size={26} color="#FFFFFF" strokeWidth={2} />
                  </div>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>{shop.name}</p>
                    <p style={{ fontSize: '12px', color: T.textSub, marginTop: '3px' }}>{shop.address}</p>
                    <p style={{ fontSize: '12px', color: T.textMuted, marginTop: '1px' }}>Owner: {shop.ownerName}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Phone',         value: shop.phone    },
                    { label: 'Email',         value: shop.email    },
                    { label: 'Account Status',value: status.toLowerCase(), valueColor: status === 'ACTIVE' ? '#1E8449' : '#CB4335' },
                    { label: 'Last Purchase', value: formatDate(lastPurchaseDate) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: T.innerBg, borderRadius: '8px', border: `1px solid ${T.innerBorder}` }}>
                      <span style={{ fontSize: '12px', color: T.textSub, fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: row.valueColor ?? T.text, textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '150px', whiteSpace: 'nowrap', textTransform: row.label === 'Account Status' ? 'capitalize' : 'none' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Browse Products CTA */}
                <Link href="/dashboard/customer/products" style={{ textDecoration: 'none' }}>
                  <div
                    style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '10px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', border: `1px solid ${isDark ? 'rgba(129, 140, 248, 0.3)' : '#C5D9EC'}`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(129, 140, 248, 0.3)' : '#C5D9EC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB'}
                  >
                    <Package size={15} color={isDark ? '#818cf8' : '#1A5276'} strokeWidth={2} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276' }}>{t('sidebar.items.products')}</span>
                    <ChevronRight size={14} color={T.textSub} strokeWidth={2} />
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div style={card}>
              <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={14} color={isDark ? '#818cf8' : '#1A5276'} strokeWidth={2} />
                  </div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276', margin: 0 }}>{t('customer_dashboard.recent_purchases')}</h2>
                </div>
                <Link href="/dashboard/customer/history" style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {t('customer_dashboard.view_history')} <ChevronRight size={13} color={isDark ? '#818cf8' : '#1A5276'} />
                </Link>
              </div>

              <div style={{ padding: '16px 22px' }}>
                {historyLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
                    <div style={{ width: '28px', height: '28px', border: '3px solid #EAF2FB', borderTopColor: '#1A5276', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : recentHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0', border: `2px dashed ${T.innerBorder}`, borderRadius: '10px' }}>
                    <p style={{ fontSize: '13px', color: T.textSub, fontWeight: 600 }}>No recent activity</p>
                    <p style={{ fontSize: '12px', color: T.textMuted, marginTop: '4px' }}>Your credit history will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recentHistory.map((item) => {
                      const isRequest = item.notes?.startsWith('[REQUEST]');
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: T.innerBg, borderRadius: '10px', border: `1px solid ${T.innerBorder}` }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: isRequest ? (isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FADBD8'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isRequest ? <Clock size={16} color={isDark ? '#818cf8' : '#1A5276'} strokeWidth={2} /> : <TrendingDown size={16} color="#CB4335" strokeWidth={2} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.items?.map((i: any) => `${i.productName} ×${i.quantity}`).join(', ') || 'Credit Purchase'}
                            </p>
                            <p style={{ fontSize: '11px', color: T.textSub, marginTop: '2px' }}>
                              {new Date(item.date).toLocaleDateString()} • {isRequest ? 'Pending Request' : 'Credit Taken'}
                            </p>
                          </div>
                          <p style={{ fontSize: '14px', fontWeight: 800, color: isRequest ? (isDark ? '#818cf8' : '#1A5276') : '#CB4335', flexShrink: 0 }}>
                            +₹{item.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
