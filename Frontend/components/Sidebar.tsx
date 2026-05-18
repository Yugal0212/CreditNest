'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutGrid, Package, Users, History,
  ShoppingBag, User, BarChart2, FileText,
  Store, Zap, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        { href: '/dashboard/admin/logs',      icon: FileText,  label: 'System Logs' },
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
        { href: '/dashboard/shop_owner/customers', icon: Users,       label: 'Customers' },
        { href: '/dashboard/shop_owner/products',  icon: Package,     label: 'Products'  },
        { href: '/dashboard/shop_owner/orders',    icon: ShoppingBag, label: 'Orders'    },
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
        { href: '/dashboard/profile', icon: User, label: 'Profile' },
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
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const pathname  = usePathname();
  const isDark    = theme === 'dark';

  if (!isAuthenticated || !user) return null;

  const roleKey = user.role.toLowerCase() as 'admin' | 'shop_owner' | 'customer';
  const groups  = NAV[roleKey] || [];

  /* ── Design tokens matching AdminMart style ── */
  const D = {
    /* Sidebar shell */
    bg:           isDark ? '#1B1F2E' : '#FFFFFF',
    border:       isDark ? '#252B3B' : '#E2E8F0',

    /* Brand strip */
    brandBg:      isDark ? '#141824' : '#FFFFFF',
    brandBorder:  isDark ? '#252B3B' : '#E2E8F0',
    logoMark:     isDark ? '#1E3A5F' : '#EFF6FF',
    logoIcon:     '#D4A017',
    brandName:    isDark ? '#F1F5F9' : '#0F172A',
    brandSub:     isDark ? '#4A5568' : '#94A3B8',

    /* Section labels */
    sectionLabel: isDark ? '#4A5568' : '#94A3B8',

    /* Nav items — inactive */
    itemBg:         'transparent',
    itemText:       isDark ? '#CBD5E1' : '#374151',
    itemIcon:       isDark ? '#64748B' : '#6B7280',

    /* Nav items — active (navy blue pill) */
    activeBg:       isDark ? '#154360' : '#1A5276',   // navy blue pill
    activeText:     '#FFFFFF',
    activeIcon:     '#FFFFFF',

    /* Hover */
    hoverBg:      isDark ? '#252B3B' : '#F1F5F9',

    /* User card */
    userCardBg:   isDark ? '#141824' : '#F8FAFC',
    userCardBorder:isDark ? '#252B3B' : '#E2E8F0',
    userName:     isDark ? '#F1F5F9' : '#0F172A',
    userRole:     isDark ? '#64748B' : '#6B7280',
  };

  const roleLabel =
    roleKey === 'admin'      ? 'Administrator' :
    roleKey === 'shop_owner' ? 'Shop Owner'    : 'Customer';

  return (
    <aside
      className="hidden md:flex flex-col"
      style={{
        position:  'fixed',
        top: 0, left: 0,
        width:     '240px',
        height:    '100vh',
        zIndex:    40,
        background: D.bg,
        borderRight: `1px solid ${D.border}`,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >

      {/* ══ BRAND STRIP (60px — aligns with TopBar) ══════════ */}
      <div style={{
        height:       '64px',
        background:   D.brandBg,
        borderBottom: `1px solid ${D.brandBorder}`,
        display:      'flex',
        alignItems:   'center',
        gap:          '11px',
        padding:      '0 20px',
        flexShrink:   0,
      }}>
        {/* Logo mark */}
        <div style={{
          width: '34px', height: '34px',
          borderRadius: '8px',
          background: D.logoMark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={18} color={D.logoIcon} strokeWidth={2.5} />
        </div>

        {/* Brand name */}
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: D.brandName, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>
            Smart Credit
          </p>
          <p style={{ fontSize: '11px', color: D.brandSub, lineHeight: 1, marginTop: '3px' }}>
            Management System
          </p>
        </div>
      </div>

      {/* ══ NAV (scrollable) ══════════════════════════════════ */}
      <nav
        style={{
          flex:       1,
          overflowY:  'auto',
          padding:    '8px 12px',
          scrollbarWidth: 'none',
        }}
      >
        {groups.map((group, gi) => (
          <div key={group.section} style={{ marginTop: gi === 0 ? '4px' : '22px' }}>

            {/* ── Section label ── */}
            <p style={{
              fontSize:      '10.5px',
              fontWeight:    700,
              color:         D.sectionLabel,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              padding:       '0 8px',
              margin:        '0 0 6px 0',
            }}>
              {group.section}
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
                >
                  <Link
                    href={href}
                    style={{
                      display:         'flex',
                      alignItems:      'center',
                      gap:             '11px',
                      padding:         '9px 12px',
                      borderRadius:    '8px',
                      margin:          '2px 0',
                      textDecoration:  'none',
                      background:      active ? D.activeBg : D.itemBg,
                      transition:      'background 0.15s',
                      cursor:          'pointer',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = D.hoverBg;
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {/* Icon */}
                    <Icon
                      size={17}
                      strokeWidth={active ? 2.5 : 1.8}
                      style={{ color: active ? D.activeIcon : D.itemIcon, flexShrink: 0 }}
                    />

                    {/* Label */}
                    <span style={{
                      fontSize:   '14px',
                      fontWeight: active ? 600 : 400,
                      color:      active ? D.activeText : D.itemText,
                      flex:        1,
                      lineHeight: 1,
                      letterSpacing: '-0.01em',
                    }}>
                      {label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ══ USER CARD (AdminMart style) ══════════════════════ */}
      <div style={{
        borderTop:  `1px solid ${D.userCardBorder}`,
        padding:    '12px',
        flexShrink: 0,
        background: D.userCardBg,
      }}>
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '11px',
          padding:       '10px 12px',
          borderRadius:  '10px',
          background:    isDark ? '#1E2536' : '#FFFFFF',
          border:        `1px solid ${D.userCardBorder}`,
        }}>
          {/* Avatar */}
          <div style={{
            width:          '36px',
            height:         '36px',
            borderRadius:   '50%',
            background:     'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '13px',
            fontWeight:     700,
            color:          '#FFFFFF',
            flexShrink:     0,
          }}>
            {getInitials(user?.name || 'U')}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize:      '13.5px',
              fontWeight:    700,
              color:         D.userName,
              margin:        0,
              lineHeight:    1,
              overflow:      'hidden',
              textOverflow:  'ellipsis',
              whiteSpace:    'nowrap',
            }}>
              {user?.name || 'User'}
            </p>
            <p style={{
              fontSize:      '11.5px',
              color:         D.userRole,
              marginTop:     '3px',
              lineHeight:    1,
              textTransform: 'capitalize',
            }}>
              {roleLabel}
            </p>
          </div>

          {/* Online dot */}
          <div style={{
            width:        '8px',
            height:       '8px',
            borderRadius: '50%',
            background:   '#10B981',
            flexShrink:   0,
            boxShadow:    '0 0 0 2px rgba(16,185,129,0.2)',
          }} />
        </div>
      </div>

    </aside>
  );
};
