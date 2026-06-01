'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutGrid, Package, Users, History,
  ShoppingBag, User, BarChart2, FileText,
  Store, Shield, FolderOpen, Settings, MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { shopOwnerAPI } from '@/lib/api';

/* ─────────────────── NAV STRUCTURE ─────────────────────────── */
type NavItem  = { href: string; icon: React.ElementType; label: string };
type NavGroup = { section: string; items: NavItem[] };

const NAV: Record<string, NavGroup[]> = {
  admin: [
    {
      section: 'HOME',
      items: [
        { href: '/dashboard/admin', icon: LayoutGrid, label: 'Dashboard' },
      ],
    },
    {
      section: 'MANAGEMENT',
      items: [
        { href: '/dashboard/admin/shops', icon: Store,     label: 'Shops'       },
        { href: '/dashboard/admin/users', icon: Users,     label: 'Users'       },
      ],
    },
    {
      section: 'INSIGHTS',
      items: [
        { href: '/dashboard/admin/analytics', icon: BarChart2, label: 'Analytics'   },
        { href: '/dashboard/admin/logs',      icon: FileText,  label: 'Activity Logs' },
        { href: '/dashboard/admin/system',    icon: Shield,    label: 'Diagnostics' },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { href: '/dashboard/profile', icon: User, label: 'Profile' },
      ],
    },
  ],
  shop_owner: [
    {
      section: 'HOME',
      items: [
        { href: '/dashboard/shop_owner', icon: LayoutGrid, label: 'Dashboard' },
      ],
    },
    {
      section: 'OPERATIONS',
      items: [
        { href: '/dashboard/shop_owner/customers',  icon: Users,       label: 'Customers'  },
        { href: '/dashboard/shop_owner/products',   icon: Package,     label: 'Products'   },
        { href: '/dashboard/shop_owner/categories', icon: FolderOpen,  label: 'Categories' },
        { href: '/dashboard/shop_owner/orders',     icon: ShoppingBag, label: 'Orders'     },
      ],
    },
    {
      section: 'RECORDS',
      items: [
        { href: '/dashboard/shop_owner/history', icon: History, label: 'History' },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { href: '/dashboard/profile',  icon: User,     label: 'Profile'  },
        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ],
  customer: [
    {
      section: 'HOME',
      items: [
        { href: '/dashboard/customer', icon: LayoutGrid, label: 'Dashboard' },
      ],
    },
    {
      section: 'CREDIT',
      items: [
        { href: '/dashboard/customer/products', icon: Package, label: 'Products' },
        { href: '/dashboard/customer/history',  icon: History, label: 'History'  },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        { href: '/dashboard/profile', icon: User, label: 'Profile' },
      ],
    },
  ],
};

const ROOT_HREFS = ['/dashboard/admin', '/dashboard/shop_owner', '/dashboard/customer'];

function isActive(href: string, pathname: string) {
  if (href === pathname) return true;
  if (ROOT_HREFS.includes(href)) return false;
  return pathname.startsWith(href + '/');
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ─────────────────── COMPONENT ─────────────────────────────── */
export const Sidebar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const pathname  = usePathname();
  const isDark    = theme === 'dark';

  if (!isAuthenticated || !user) return null;

  const roleKey = user.role.toLowerCase() as 'admin' | 'shop_owner' | 'customer';
  const groups  = NAV[roleKey] || [];

  const [customerCount, setCustomerCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (roleKey === 'shop_owner') {
      shopOwnerAPI.getDashboardStats()
        .then(res => setCustomerCount(res.data?.stats?.totalCustomers ?? res.data?.totalCustomers ?? 0))
        .catch(err => console.error('Failed to fetch sidebar stats', err));
    }
  }, [roleKey]);

  /* ── Spec-exact Design Tokens ── */
  const sidebarBg = isDark ? '#06090f' : '#0b1629';
  const borderColor = 'rgba(255,255,255,0.06)';

  const roleLabel =
    roleKey === 'admin'      ? t('roles.ADMIN', 'Administrator') :
    roleKey === 'shop_owner' ? t('roles.SHOP_OWNER', 'Shop Owner') : t('roles.CUSTOMER', 'Customer');

  return (
    <aside
      className="hidden md:flex flex-col"
      style={{
        position:  'fixed',
        top: 0, left: 0,
        width:     '240px',
        height:    '100vh',
        zIndex:    40,
        background: sidebarBg,
        borderRight: `1px solid ${borderColor}`,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: 'antialiased',
        fontSize: '13px',
        fontWeight: 500,
      }}
    >
      {/* ══ LOGO AREA ══════════════════════════════════════════ */}
      <div style={{
        height:       '64px',
        borderBottom: `1px solid ${borderColor}`,
        display:      'flex',
        alignItems:   'center',
        gap:          '11px',
        padding:      '0 18px',
        flexShrink:   0,
      }}>
        {/* Logo image */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '12px',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <img
            src="/CreditNest.png"
            alt="CreditNest Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.2)' }}
          />
        </div>

        {/* Brand name + slogan */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: '"Outfit", "SF Pro Display", -apple-system, sans-serif' }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              Credit
            </span>
            <span style={{ 
              fontSize: '22px', 
              fontWeight: 900, 
              letterSpacing: '-0.04em', 
              lineHeight: 1,
              background: 'linear-gradient(to right, #818cf8, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Nest
            </span>
          </div>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', lineHeight: 1, marginTop: '5px', fontWeight: 500, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
            Smart credit · Built for India
          </p>
        </div>
      </div>

      {/* ══ NAV (scrollable) ══════════════════════════════════ */}
      <div
        style={{
          flex:           1,
          overflowY:      'auto',
          padding:        '8px 10px',
          scrollbarWidth: 'none',
        }}
      >
        {groups.map((group, gi) => (
          <div key={group.section} style={{ marginTop: gi === 0 ? '4px' : '0px' }}>

            {/* ── Section label ── */}
            <p style={{
              fontSize:      '9px',
              fontWeight:    700,
              color:         'rgba(255,255,255,0.22)',
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              padding:       '14px 6px 5px',
              margin:        0,
            }}>
              {t(`sidebar.sections.${group.section.toLowerCase()}`, group.section)}
            </p>

            {/* ── Nav items ── */}
            {group.items.map(({ href, icon: Icon, label }, ii) => {
              const active = isActive(href, pathname);
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (gi * 4 + ii) * 0.018, duration: 0.18 }}
                  style={{ position: 'relative', marginBottom: '2px' }}
                >
                  {/* Active left bar */}
                  {active && (
                    <div style={{
                      position:     'absolute',
                      left:         0,
                      top:          '20%',
                      height:       '60%',
                      width:        '3px',
                      background:   '#6366f1',
                      borderRadius: '0 3px 3px 0',
                      zIndex:       1,
                    }} />
                  )}
                  <Link
                    href={href}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      gap:            '10px',
                      padding:        '9px 10px',
                      borderRadius:   '8px',
                      textDecoration: 'none',
                      background:     active ? 'rgba(99,102,241,0.18)' : 'transparent',
                      transition:     'all 0.15s',
                      cursor:         'pointer',
                      color:          active ? '#a5b4fc' : 'rgba(255,255,255,0.42)',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.78)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.42)';
                      }
                    }}
                  >
                    {/* Icon container — 20px wide, centered */}
                    <div style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon
                        size={17}
                        strokeWidth={active ? 2.5 : 2}
                      />
                    </div>

                    {/* Label */}
                    <span style={{
                      fontSize:      '13px',
                      fontWeight:    active ? 600 : 500,
                      flex:          1,
                      lineHeight:    1,
                      letterSpacing: '-0.01em',
                    }}>
                      {t(`sidebar.items.${label.toLowerCase().replace(/\s+/g, '_')}`, label)}
                    </span>

                    {/* Badge for Customers */}
                    {label === 'Customers' && customerCount !== null && customerCount > 0 && (
                      <span style={{
                        fontSize:   '10px',
                        fontWeight: 600,
                        color:      '#f87171',
                        background: 'rgba(239,68,68,0.18)',
                        border:     '1px solid rgba(239,68,68,0.25)',
                        padding:    '2px 6px',
                        borderRadius: '99px',
                        lineHeight: 1,
                      }}>
                        {customerCount}
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ══ UPGRADE CARD ══════════════════════════════════════ */}
      <div style={{ padding: '10px 10px 0' }}>
        <div style={{
          background:   'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(14,165,233,0.15))',
          border:       '1px solid rgba(99,102,241,0.25)',
          borderRadius: '10px',
          padding:      '12px 14px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#a5b4fc', margin: '0 0 2px' }}>⚡ Upgrade to Pro</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.4 }}>Unlock advanced analytics & priority support</p>
          <button style={{
            marginTop:    '10px',
            width:        '100%',
            padding:      '6px 0',
            borderRadius: '7px',
            background:   'rgba(99,102,241,0.25)',
            border:       '1px solid rgba(99,102,241,0.4)',
            color:        '#a5b4fc',
            fontSize:     '11px',
            fontWeight:   600,
            cursor:       'pointer',
            transition:   'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
          >
            Upgrade Now
          </button>
        </div>
      </div>

      {/* ══ USER ROW FOOTER ════════════════════════════════════ */}
      <div style={{
        borderTop:  `1px solid ${borderColor}`,
        padding:    '12px 10px',
        flexShrink: 0,
      }}>
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '10px',
          padding:       '8px 10px',
          borderRadius:  '10px',
          background:    'transparent',
          cursor:        'pointer',
          transition:    'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Avatar with gradient + online dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width:          '34px',
              height:         '34px',
              borderRadius:   '50%',
              background:     'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '13px',
              fontWeight:     700,
              color:          '#FFFFFF',
            }}>
              {getInitials(user?.name || 'U')}
            </div>
            {/* Online dot: 9×9px, #22c55e */}
            <div style={{
              position:     'absolute',
              bottom:       '-1px',
              right:        '-1px',
              width:        '9px',
              height:       '9px',
              borderRadius: '50%',
              background:   '#22c55e',
              border:       `2px solid ${sidebarBg}`,
            }} />
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', lineHeight: 1, textTransform: 'capitalize' }}>
              {roleLabel}
            </p>
          </div>

          <MoreVertical size={15} color="rgba(255,255,255,0.3)" />
        </div>
      </div>

    </aside>
  );
};
