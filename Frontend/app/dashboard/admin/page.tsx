'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Users, TrendingUp, ArrowUpRight, CreditCard, Activity,
  Store, Shield, BarChart2, ArrowRight, CheckCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DashboardStats {
  totalShops: number;
  activeShops: number;
  pendingShops: number;
  totalCustomers: number;
  totalCreditOutstanding: number;
  monthlyRevenue: number;
  totalCreditIssued: number;
  totalPaymentsCollected: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchDashboardStats(); }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to load dashboard', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Theme tokens ─────────────────────────────────────────── */
  const T = {
    card:       isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#E2E8F0',
    cardShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    text:       isDark ? '#F1F5F9' : '#0F172A',
    textSub:    isDark ? '#94A3B8' : '#64748B',
    textMuted:  isDark ? '#64748B' : '#94A3B8',
    divider:    isDark ? '#1E293B' : '#F1F5F9',
    innerBg:    isDark ? '#0F172A' : '#F8FAFC',
    innerBorder:isDark ? '#1E293B' : '#E2E8F0',
  };

  const cardStyle: React.CSSProperties = {
    background: T.card,
    border: `1px solid ${T.cardBorder}`,
    borderRadius: '12px',
    boxShadow: T.cardShadow,
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <DashboardLayout>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#1A5276', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ color: T.textSub, fontSize: '13px' }}>Loading dashboard…</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!stats) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <DashboardLayout>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <p style={{ color: T.textSub }}>No data available</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const kpiCards = [
    { title: 'Total Users',   value: (stats.totalShops + stats.totalCustomers).toString(), sub: `${stats.activeShops} active shops`, icon: Users,      accent: '#3B82F6', accentBg: isDark ? '#1E3A5F' : '#EFF6FF', badge: `${stats.activeShops} active` },
    { title: 'Shop Owners',   value: stats.totalShops.toString(),                          sub: `${stats.activeShops} active`,       icon: Store,      accent: '#10B981', accentBg: isDark ? '#14352A' : '#F0FDF4', badge: `${stats.activeShops} active` },
    { title: 'Customers',     value: stats.totalCustomers.toString(),                      sub: 'Registered',                        icon: CreditCard, accent: '#8B5CF6', accentBg: isDark ? '#2D1B5E' : '#F5F3FF', badge: 'Registered' },
    { title: 'Total Credit',  value: `₹${(stats.totalCreditOutstanding / 100000).toFixed(2)}L`, sub: `₹${(stats.monthlyRevenue/1000).toFixed(1)}K this month`, icon: TrendingUp, accent: '#F59E0B', accentBg: isDark ? '#3D2A00' : '#FFFBEB', badge: `₹${(stats.monthlyRevenue/1000).toFixed(1)}K/mo` },
  ];

  const platformMetrics = [
    { label: 'Platform Uptime',  value: '99.9%',                                            icon: Activity,  color: '#10B981', bg: isDark ? '#14352A' : '#F0FDF4' },
    { label: 'Active Shops',     value: stats.activeShops.toString(),                        icon: Store,     color: '#3B82F6', bg: isDark ? '#1E3A5F' : '#EFF6FF' },
    { label: 'Pending Shops',    value: stats.pendingShops.toString(),                       icon: Shield,    color: '#F59E0B', bg: isDark ? '#3D2A00' : '#FFFBEB' },
    { label: 'Platform Revenue', value: `₹${(stats.monthlyRevenue / 1000).toFixed(2)}K`,    icon: BarChart2, color: '#8B5CF6', bg: isDark ? '#2D1B5E' : '#F5F3FF' },
  ];

  const quickActions = [
    { label: 'Manage Users',   sub: 'View and control all system users',   icon: Users,    href: '/dashboard/admin/users'     },
    { label: 'Manage Shops',   sub: 'Approve, suspend or review shops',    icon: Store,    href: '/dashboard/admin/shops'     },
    { label: 'View Analytics', sub: 'Platform performance & insights',     icon: BarChart2,href: '/dashboard/admin/analytics' },
  ];

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Page Header ─────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: T.text, letterSpacing: '-0.025em', lineHeight: 1.2, margin: 0 }}>
                Admin Dashboard
              </h1>
              <p style={{ color: T.textSub, marginTop: '4px', fontSize: '13.5px' }}>
                Welcome back, <strong style={{ color: T.text, fontWeight: 600 }}>{user?.name ?? 'Admin'}</strong> — here&apos;s your platform at a glance.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: isDark ? '#14352A' : '#F0FDF4', border: `1px solid ${isDark ? '#166534' : '#BBF7D0'}`, borderRadius: '8px' }}>
              <CheckCircle size={13} color="#10B981" strokeWidth={2.5} />
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#10B981' }}>All systems operational</span>
            </div>
          </div>

          {/* ── KPI Cards ────────────────────────────────────── */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Key Metrics</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
              {kpiCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    style={{
                      ...cardStyle,
                      padding: '18px 18px 16px',
                      borderLeft: `3px solid ${card.accent}`,
                      transition: 'box-shadow 0.15s, transform 0.15s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.10)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = T.cardShadow; }}
                  >
                    {/* Icon + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: card.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={17} color={card.accent} strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: card.accent, background: card.accentBg, padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ArrowUpRight size={10} strokeWidth={2.5} />{card.badge}
                      </span>
                    </div>
                    {/* Value */}
                    <p style={{ fontSize: '26px', fontWeight: 800, color: T.text, letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
                      {card.value}
                    </p>
                    <p style={{ fontSize: '12.5px', color: T.textSub, fontWeight: 500, marginTop: '4px' }}>
                      {card.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Two-column: Platform Stats + Quick Actions ──── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">

            {/* Platform Statistics */}
            <div style={cardStyle}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 18px', borderBottom: `1px solid ${T.divider}` }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: isDark ? '#1E3A5F' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={13} color="#3B82F6" strokeWidth={2} />
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: T.text }}>Platform Statistics</span>
              </div>

              {/* 4-metric grid */}
              <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {platformMetrics.map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '14px 16px',
                        background: T.innerBg,
                        border: `1px solid ${T.innerBorder}`,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = m.bg}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.innerBg}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} color={m.color} strokeWidth={2} />
                      </div>
                      <div>
                        <p style={{ fontSize: '18px', fontWeight: 800, color: T.text, letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>{m.value}</p>
                        <p style={{ fontSize: '11px', fontWeight: 500, color: T.textSub, marginTop: '3px', lineHeight: 1 }}>{m.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 18px', borderBottom: `1px solid ${T.divider}` }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: isDark ? '#14352A' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={13} color="#10B981" strokeWidth={2} />
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: T.text }}>Quick Actions</span>
              </div>

              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {quickActions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <Link key={i} href={action.href} style={{ textDecoration: 'none' }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '11px 12px', borderRadius: '8px',
                          transition: 'background 0.15s', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.innerBg}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isDark ? '#1E3A5F' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={14} color="#3B82F6" strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: T.text, margin: 0, lineHeight: 1 }}>{action.label}</p>
                          <p style={{ fontSize: '11.5px', color: T.textSub, marginTop: '2px', lineHeight: 1 }}>{action.sub}</p>
                        </div>
                        <ArrowRight size={13} color={T.textMuted} strokeWidth={2} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
