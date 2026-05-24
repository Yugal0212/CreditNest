'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TopBarSearch } from '@/components/TopBarSearch';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings, LogOut, User, Sun, Moon, Zap, Bell, Package, X, RefreshCw,
  ChevronRight, ChevronDown, LayoutGrid, Store, Users, FileText, BarChart2, Shield, FolderOpen, ShoppingBag, History
} from 'lucide-react';

/* ── Route → breadcrumb label map ──────────────────────────── */
const segmentLabels: Record<string, string> = {
  dashboard:  'Dashboard',
  admin:      'Admin',
  shop_owner: 'Shop Owner',
  customer:   'Customer',
  shops:      'Shops',
  users:      'Users',
  analytics:  'Analytics',
  logs:       'System Logs',
  customers:  'Customers',
  products:   'Products',
  orders:     'Orders',
  history:    'History',
  profile:    'Profile',
  cart:       'Cart',
};

function buildBreadcrumbs(pathname: string, t: any) {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((seg, i) => {
    let icon = LayoutGrid;
    if (seg === 'shops' || seg === 'shop_owner') icon = Store;
    else if (seg === 'users' || seg === 'customers') icon = Users;
    else if (seg === 'analytics') icon = BarChart2;
    else if (seg === 'logs') icon = FileText;
    else if (seg === 'system') icon = Shield;
    else if (seg === 'categories') icon = FolderOpen;
    else if (seg === 'orders') icon = ShoppingBag;
    else if (seg === 'history') icon = History;
    else if (seg === 'profile') icon = User;
    else if (seg === 'products') icon = Package;
    
    return {
      label: t("sidebar.items." + seg.toLowerCase(), segmentLabels[seg] ?? seg.replace(/_/g, ' ')),
      href: '/' + parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1,
      Icon: icon,
    };
  });
}

/* ── Role → status pill ─────────────────────────────────────── */
const rolePill: Record<string, { label: string; dot: string }> = {
  ADMIN:      { label: 'Administrator', dot: '#D4A017' },
  SHOP_OWNER: { label: 'Shop Owner',    dot: '#1E8449' },
  CUSTOMER:   { label: 'Customer',      dot: '#2E86C1' },
};

export const TopBar = () => {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications, unreadCount, isLoading, refreshNotifications, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const crumbs = buildBreadcrumbs(pathname, t);
  const roleInfo = (({
    ADMIN:      { label: t('roles.ADMIN', 'Administrator'), dot: '#D4A017' },
    SHOP_OWNER: { label: t('roles.SHOP_OWNER', 'Shop Owner'),    dot: '#1E8449' },
    CUSTOMER:   { label: t('roles.CUSTOMER', 'Customer'),      dot: '#2E86C1' },
  } as Record<string, { label: string; dot: string }>)[user?.role ?? '']) ?? { label: user?.role ?? '', dot: '#6B7280' };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const handleLogout = () => { logout(); router.push('/login'); };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.type === 'order_request' && user?.role === 'SHOP_OWNER') {
      router.push('/dashboard/shop_owner');
      setTimeout(() => {
        document.getElementById('pending-requests')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  /*
   * TopBar join rules:
   * - Light: white bg, border-bottom #E2E8F0 matches content card borders
   * - Dark:  dark slate bg, border-bottom matches sidebar border
   * - NO box-shadow — the 1px border IS the separator, nothing else
   * - Height must be exactly 60px to align with sidebar brand strip
   */
  const topBarBg     = isDark ? '#0d1526' : '#FFFFFF';
  const topBarBorder = isDark ? '#161d2e' : '#e8eef6';
  const iconBtnStyle: React.CSSProperties = {
    width: '38px', height: '38px', borderRadius: '10px',
    background: 'transparent',
    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative',
    transition: 'all 0.2s',
    flexShrink: 0,
  };

  return (
    <div
      className="fixed top-0 right-0 left-0 md:left-[240px] z-40"
      style={{
        background: topBarBg,
        borderBottom: `1px solid ${topBarBorder}`,
      }}
    >
      <div className="flex h-[60px] items-center justify-between px-4 sm:px-6 gap-2 sm:gap-3">

        {/* ── LEFT: Mobile logo / Desktop breadcrumb ──────────── */}
        {/* Mobile logo — real logo image */}
        <Link
          href={isAuthenticated ? `/dashboard/${user?.role?.toLowerCase()}` : '/'}
          className="flex items-center gap-2 md:hidden shrink-0"
          style={{ textDecoration: 'none' }}
        >
          <img
            src="/CreditNest.png"
            alt="CreditNest"
            style={{ width: '30px', height: '30px', objectFit: 'contain', flexShrink: 0 }}
          />
          <span style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#F8FAFC' : '#1e293b', letterSpacing: '-0.02em', lineHeight: 1 }}>
            CreditNest
          </span>
        </Link>

        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 min-w-0 flex-1" aria-label="Breadcrumb">
          {crumbs.map((crumb, i) => {
            const Icon = crumb.Icon;
            return (
            <React.Fragment key={crumb.href}>
              {i > 0 && (
                <ChevronRight size={14} color={isDark ? '#475569' : '#94A3B8'} strokeWidth={2.5} className="shrink-0 mx-1" />
              )}
              {crumb.isLast ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={14} color={isDark ? '#6366f1' : '#4f46e5'} strokeWidth={2.5} />
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: isDark ? '#F1F5F9' : '#0F172A',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px',
                    }}
                  >
                    {crumb.label}
                  </span>
                </div>
              ) : (
                <Link
                  href={crumb.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isDark ? '#64748B' : '#64748B',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = isDark ? '#F1F5F9' : '#0F172A')}
                  onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#64748B' : '#64748B')}
                >
                  <Icon size={13} strokeWidth={2.5} />
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
            );
          })}
        </div>

        {/* ── RIGHT CONTROLS ──────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Functional Search Bar */}
          <TopBarSearch />

          {/* Language Switcher — visible on all screens */}
          <LanguageSwitcher />


          {/* Notification Bell — visible on all screens */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="Notifications"
                  style={iconBtnStyle}
                  onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.14)' : '#cbd5e1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6'; }}
                >
                  <Bell size={15} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{
                        position: 'absolute', top: '7px', right: '7px',
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#ef4444',
                        border: `2px solid ${isDark ? '#0d1526' : '#FFFFFF'}`,
                      }}
                    />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm p-0" style={{ borderRadius: '14px', border: `1px solid ${isDark ? '#334155' : '#E8E0D4'}`, background: isDark ? '#1E293B' : '#FFFFFF', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(26,82,118,0.12)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#F0EBE0'}`, background: isDark ? '#1E293B' : '#FFFFFF' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276' }}>{t('notifications.title', 'Notifications')}</h3>
                    {unreadCount > 0 && <p style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#6B7280' }}>{t('notifications.unread', '{{count}} unread', { count: unreadCount })}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); refreshNotifications(); }}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: 'transparent' }}
                      title="Refresh"
                    >
                      <RefreshCw size={13} color={isDark ? '#94A3B8' : '#6B7280'} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                        style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276', padding: '3px 8px', borderRadius: '6px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', border: 'none', cursor: 'pointer' }}
                      >
                        {t('notifications.mark_all_read', 'Mark all read')}
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <ScrollArea className="h-72 sm:h-96" style={{ background: isDark ? '#1E293B' : '#FFFFFF' }}>
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <Bell size={36} color={isDark ? '#475569' : '#C2B9AD'} strokeWidth={1.5} />
                      <p style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#94A3B8' : '#6B7280', marginTop: '12px' }}>{t('notifications.empty_title', 'No notifications')}</p>
                      <p style={{ fontSize: '11px', color: isDark ? '#64748B' : '#9CA3AF', marginTop: '4px' }}>{t('notifications.empty_desc', "You're all caught up!")}</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="cursor-pointer"
                          style={{
                            padding: '12px 16px',
                            borderBottom: `1px solid ${isDark ? '#334155' : '#F5F0E8'}`,
                            background: !n.read ? (isDark ? '#1E293B' : '#F8F4EE') : (isDark ? '#0F172A' : '#FFFFFF'),
                            transition: 'background 0.15s',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {n.type === 'order_request' ? <Package size={15} color={isDark ? '#818cf8' : '#1A5276'} /> : <Bell size={15} color={isDark ? '#818cf8' : '#1A5276'} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#1C2833' }}>{n.title}</p>
                                {!n.read && (
                                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#D4A017', flexShrink: 0, marginTop: '4px' }} />
                                )}
                              </div>
                              <p style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#6B7280', marginTop: '2px' }} className="line-clamp-2">{n.message}</p>
                              <p style={{ fontSize: '10px', color: isDark ? '#64748B' : '#9CA3AF', marginTop: '4px' }}>
                                {new Date(n.date).toLocaleDateString('en-IN')} • {new Date(n.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                              className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
                              title="Dismiss"
                            >
                              <X size={12} color={isDark ? '#64748B' : '#9CA3AF'} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && user?.role === 'SHOP_OWNER' && (
                  <div style={{ background: isDark ? '#1E293B' : '#FFFFFF' }}>
                    <DropdownMenuSeparator style={{ background: isDark ? '#334155' : '#F0EBE0' }} />
                    <div className="px-3 py-2">
                      <Link href="/dashboard/shop_owner" style={{ display: 'block', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: isDark ? '#818cf8' : '#1A5276', padding: '6px', textDecoration: 'none' }}>
                        {t('notifications.view_all', 'View all requests →')}
                      </Link>
                    </div>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme Toggle — all screens */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={iconBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.14)' : '#cbd5e1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6'; }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span key="sun" initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.18 }} style={{ position: 'absolute', display: 'flex' }}>
                  <Sun size={15} color="#94A3B8" strokeWidth={2} />
                </motion.span>
              ) : (
                <motion.span key="moon" initial={{ rotate: 90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: -90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.18 }} style={{ position: 'absolute', display: 'flex' }}>
                  <Moon size={15} color="#64748B" strokeWidth={2} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Divider — desktop only */}
          <div className="hidden sm:flex" style={{ width: '1px', height: '20px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6', margin: '0 2px' }} />

          {/* User Menu */}
          {isAuthenticated && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  title="Profile Menu"
                  className="flex items-center gap-2 transition-all"
                  style={{
                    padding: '4px 8px 4px 4px',
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6'}`,
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    height: '38px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.14)' : '#cbd5e1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e8eef6'; }}
                >
                  {/* Avatar */}
                  <Avatar className="h-7 w-7" style={{ borderRadius: '7px' }}>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#FFFFFF', fontSize: '10px', fontWeight: 700,
                        borderRadius: '7px',
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + role — desktop only */}
                  <div className="hidden sm:block text-left">
                    <p style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#F1F5F9' : '#1e293b', lineHeight: 1, whiteSpace: 'nowrap' }}>
                      {user.name}
                    </p>
                    <p style={{ fontSize: '10px', color: isDark ? '#64748B' : '#94a3b8', fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap', marginTop: '3px' }}>
                      {roleInfo.label}
                    </p>
                  </div>
                  <ChevronDown size={13} color={isDark ? '#64748B' : '#94a3b8'} strokeWidth={2.5} className="hidden sm:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} style={{ width: '240px', borderRadius: '14px', border: `1px solid ${isDark ? '#334155' : '#E8E0D4'}`, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(26,82,118,0.12)', padding: 0, overflow: 'hidden', background: isDark ? '#1E293B' : '#FFFFFF' }}>
                {/* Profile summary header */}
                <div style={{ padding: '16px', background: isDark ? 'linear-gradient(135deg, #0F172A, #1E293B)' : 'linear-gradient(135deg, #0D2B3E, #1A5276)' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDark ? 'linear-gradient(135deg, #312E81, #4338CA)' : 'linear-gradient(135deg, #1A5276, #2E86C1)', border: `2px solid ${isDark ? 'rgba(129,140,248,0.45)' : 'rgba(212,160,23,0.45)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1 }}>{user.name}</p>
                      <p style={{ fontSize: '11px', color: isDark ? '#94A3B8' : 'rgba(174,214,241,0.80)', marginTop: '3px', lineHeight: 1 }} className="truncate">{user.email}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: roleInfo.dot }} />
                        <span style={{ fontSize: '10px', color: roleInfo.dot, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{roleInfo.label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px', background: isDark ? '#1E293B' : '#FFFFFF' }}>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2.5 hover:!bg-[#F5F0E8] dark:hover:!bg-slate-800 transition-colors"
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: isDark ? 'rgba(129, 140, 248, 0.15)' : '#EAF2FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={13} color={isDark ? '#818cf8' : '#1A5276'} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#F1F5F9' : '#1C2833' }}>{t('sidebar.items.profile', 'My Profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <div style={{ height: '1px', background: isDark ? '#334155' : '#F0EBE0', margin: '0 6px' }} />

                <div style={{ padding: '6px', background: isDark ? '#1E293B' : '#FFFFFF' }}>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2.5 hover:!bg-[#FEF0EE] dark:hover:!bg-red-950/30 transition-colors"
                    style={{ outline: 'none', border: 'none' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FADBD8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LogOut size={13} color="#CB4335" />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#CB4335' }}>{t('common.sign_out', 'Sign Out')}</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};
