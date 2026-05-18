'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';
import { Store, Search, Users, MapPin, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Shop {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  totalCustomers: number;
  totalProducts: number;
  totalTransactions: number;
  creditOutstanding: number;
  registrationDate: string;
}

const statusBadge: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  ACTIVE:    { bg: '#D4EFDF', color: '#1E8449', icon: CheckCircle, label: 'Active'    },
  PENDING:   { bg: '#FEF9ED', color: '#9A7D0A', icon: Clock,       label: 'Pending'   },
  SUSPENDED: { bg: '#FADBD8', color: '#CB4335', icon: XCircle,     label: 'Suspended' },
};

export default function AdminShopsPage() {
  const { theme } = useTheme();
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

  const S = {
    card: {
      background: T.card,
      border: `1px solid ${T.cardBorder}`,
      borderRadius: '12px',
      boxShadow: T.cardShadow,
    } as React.CSSProperties,
  };

  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');

  useEffect(() => { fetchShops(); }, [statusFilter]);

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getShops({ page: 1, limit: 100, status: statusFilter === 'ALL' ? undefined : statusFilter });
      setShops(response.data.shops);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to load shops', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateShopStatus = async (shopId: string, newStatus: string) => {
    try {
      await adminAPI.updateShopStatus(shopId, newStatus, 'Admin intervention');
      toast({ title: 'Success', description: `Shop status updated to ${newStatus}` });
      fetchShops();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update shop status', variant: 'destructive' });
    }
  };

  const filtered = shops.filter(
    (s) =>
      s.shopName.toLowerCase().includes(search.toLowerCase()) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(search.toLowerCase())) ||
      s.phone.toLowerCase().includes(search.toLowerCase())
  );

  const filterLabels: Array<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'> = ['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'];

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Page header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Store size={18} color={isDark ? '#818cf8' : '#1A5276'} strokeWidth={2} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: isDark ? '#818cf8' : '#1A5276', letterSpacing: '-0.03em', margin: 0 }}>
                Shop Directory
              </h1>
            </div>
            <p style={{ color: T.textSub, fontSize: '14px', marginLeft: '46px' }}>
              Manage registered shops, verify accounts and monitor outstanding credit.
            </p>
          </div>

          {/* Filters card */}
          <div style={{ ...S.card, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} color="#8A9BB0" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by shop name, owner name, or phone…"
                style={{
                  width: '100%', padding: '10px 14px 10px 38px',
                  border: `1px solid ${T.innerBorder}`, borderRadius: '10px',
                  background: T.innerBg, color: T.text,
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Status filters */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {filterLabels.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    border: '1px solid',
                    background: statusFilter === status ? (isDark ? '#818cf8' : '#1A5276') : T.innerBg,
                    borderColor: statusFilter === status ? (isDark ? '#818cf8' : '#1A5276') : T.innerBorder,
                    color: statusFilter === status ? (isDark ? '#0f172a' : '#FFFFFF') : T.textSub,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {status}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#8A9BB0', alignSelf: 'center', fontWeight: 600 }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid #EAF2FB', borderTopColor: '#1A5276', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: '#6B7280', fontSize: '13px' }}>Loading shops…</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...S.card, padding: '48px 24px', textAlign: 'center' }}>
              <Store size={40} color="#C2B9AD" strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#6B7280', fontWeight: 600, fontSize: '14px' }}>No shops found</p>
              <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filtered.map((shop) => {
                const badge = statusBadge[shop.status] ?? statusBadge.PENDING;
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={shop.id}
                    style={{
                      ...S.card,
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(26,82,118,0.11)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = S.card.boxShadow as string;
                      (e.currentTarget as HTMLElement).style.transform = 'none';
                    }}
                  >
                    {/* Shop name + status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: T.text, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }}>
                          {shop.shopName}
                        </h3>
                        <p style={{ fontSize: '12px', color: T.textSub, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={11} color={T.textMuted} />
                          {shop.city || 'City'}, {shop.state || 'State'}
                        </p>
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', background: badge.bg, color: badge.color, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        <BadgeIcon size={11} strokeWidth={2.5} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Info grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'Owner',       value: shop.ownerName || '—'     },
                        { label: 'Outstanding', value: `₹${shop.creditOutstanding || 0}`, valueColor: shop.creditOutstanding > 0 ? '#CB4335' : '#1E8449' },
                        { label: 'Customers',   value: `${shop.totalCustomers || 0} customers` },
                        { label: 'Joined',      value: new Date(shop.registrationDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: T.innerBg, borderRadius: '8px', border: `1px solid ${T.innerBorder}` }}>
                          <p style={{ fontSize: '10px', fontWeight: 700, color: T.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{item.label}</p>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: item.valueColor ?? T.text, marginTop: '3px' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: `1px solid ${T.divider}` }}>
                      {shop.status === 'PENDING' && (
                        <button
                          onClick={() => updateShopStatus(shop.id, 'ACTIVE')}
                          style={{ flex: 1, padding: '9px', borderRadius: '8px', background: '#D4EFDF', color: '#1E8449', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#BEE5C8'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#D4EFDF'}
                        >
                          <CheckCircle size={13} strokeWidth={2.5} /> Approve
                        </button>
                      )}
                      {shop.status === 'ACTIVE' && (
                        <button
                          onClick={() => updateShopStatus(shop.id, 'SUSPENDED')}
                          style={{ flex: 1, padding: '9px', borderRadius: '8px', background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FADBD8', color: '#CB4335', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(239, 68, 68, 0.25)' : '#F5C6C2'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : '#FADBD8'}
                        >
                          <XCircle size={13} strokeWidth={2.5} /> Suspend
                        </button>
                      )}
                      {shop.status === 'SUSPENDED' && (
                        <button
                          onClick={() => updateShopStatus(shop.id, 'ACTIVE')}
                          style={{ flex: 1, padding: '9px', borderRadius: '8px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', color: isDark ? '#818cf8' : '#1A5276', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(129, 140, 248, 0.3)' : '#C5D9EC'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB'}
                        >
                          <CheckCircle size={13} strokeWidth={2.5} /> Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
