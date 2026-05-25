'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutGrid, Package, Users, History, ShoppingBag, User, BarChart2, FileText, MoreHorizontal, FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const getNavConfig = () => ({
  admin: {
    primary: [
      { id: 'home', href: '/dashboard/admin', icon: <LayoutGrid size={22} />, label: 'Home' },
      { id: 'shops', href: '/dashboard/admin/shops', icon: <Package size={22} />, label: 'Shops' },
      { id: 'users', href: '/dashboard/admin/users', icon: <Users size={22} />, label: 'Users' },
      { id: 'analytics', href: '/dashboard/admin/analytics', icon: <BarChart2 size={22} />, label: 'Analytics' },
    ],
    more: [
      { id: 'logs', href: '/dashboard/admin/logs', icon: <FileText size={20} />, label: 'System Logs', desc: 'View admin action logs', color: '#6366F1' },
      { id: 'profile', href: '/dashboard/profile', icon: <User size={20} />, label: 'Profile', desc: 'Manage your admin account', color: '#10B981' },
    ]
  },
  shop_owner: {
    primary: [
      { id: 'home', href: '/dashboard/shop_owner', icon: <LayoutGrid size={22} />, label: 'Home' },
      { id: 'customers', href: '/dashboard/shop_owner/customers', icon: <Users size={22} />, label: 'Customers' },
      { id: 'products', href: '/dashboard/shop_owner/products', icon: <Package size={22} />, label: 'Products' },
      { id: 'orders', href: '/dashboard/shop_owner/orders', icon: <ShoppingBag size={22} />, label: 'Orders' },
    ],
    more: [
      { id: 'categories', href: '/dashboard/shop_owner/categories', icon: <FolderOpen size={20} />, label: 'Categories', desc: 'Manage your product categories', color: '#3B82F6' },
      { id: 'profile', href: '/dashboard/profile', icon: <User size={20} />, label: 'Profile', desc: 'Shop owner settings', color: '#10B981' },
    ]
  },
  customer: {
    primary: [
      { id: 'home', href: '/dashboard/customer', icon: <LayoutGrid size={22} />, label: 'Home' },
      { id: 'products', href: '/dashboard/customer/products', icon: <Package size={22} />, label: 'Products' },
      { id: 'history', href: '/dashboard/customer/history', icon: <History size={22} />, label: 'History' },
      { id: 'profile', href: '/dashboard/profile', icon: <User size={22} />, label: 'Profile' },
    ],
    more: []
  },
});

export const BottomNavBar = () => {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  // Close drawer when path changes
  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  if (!isAuthenticated || !user) return null;

  const roleKey = user.role.toLowerCase() as 'admin' | 'shop_owner' | 'customer';
  const config = getNavConfig()[roleKey];
  if (!config) return null;

  const { primary, more } = config;

  const checkIsActive = (href: string) => {
    if (href === '/dashboard/admin' || href === '/dashboard/shop_owner' || href === '/dashboard/customer') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isMoreActive = showMore || more.some(m => checkIsActive(m.href));

  return (
    <>
      <style>{`
        .sf-nav-tab {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
          cursor: pointer; padding: 10px 0 6px; position: relative;
          -webkit-tap-highlight-color: transparent; transition: transform .15s;
        }
        .sf-nav-tab:active { transform: scale(.92); }
        .sf-nav-icon-wrap {
          position: relative; width: 28px; height: 28px; display: flex;
          align-items: center; justify-content: center; transition: transform .2s cubic-bezier(.34,1.56,.64,1);
        }
        .sf-nav-tab.active .sf-nav-icon-wrap { transform: scale(1.15) translateY(-2px); }
        .sf-nav-pill {
          position: absolute; top: -9px; left: 50%; transform: translateX(-50%);
          width: 52px; height: 28px; background: rgba(99,102,241,.15); border-radius: 10px;
          opacity: 0; transition: opacity .2s;
        }
        .sf-nav-tab.active .sf-nav-pill { opacity: 1; }
        .sf-nav-lbl {
          font-size: 10px; font-weight: 500; letter-spacing: .2px; color: #6B7280; transition: color .15s;
        }
        .sf-nav-tab.active .sf-nav-lbl { color: #6366F1; font-weight: 700; }
        
        .sf-drawer-item {
          display: flex; align-items: center; gap: 14px; padding: 14px 20px;
          cursor: pointer; transition: background .12s;
        }
        .sf-drawer-item:active { background: rgba(255,255,255,.04); }
        
        @keyframes slideUpDrawer { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* More Drawer Overlay */}
      {showMore && more.length > 0 && (
        <>
          <div 
            onClick={() => setShowMore(false)} 
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,.52)', backdropFilter: 'blur(5px)', animation: 'fadeInOverlay .18s ease' }} 
          />
          <div 
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
            style={{ 
              background: '#1C2B40', borderRadius: '24px 24px 0 0', 
              paddingBottom: '96px', // Leave space for nav bar below it
              animation: 'slideUpDrawer .25s cubic-bezier(.34,1.56,.64,1) forwards',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{ width: 40, height: 4, background: '#374151', borderRadius: 2, margin: '14px auto 18px' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.8px', padding: '0 20px 10px' }}>
              More Pages
            </div>
            {more.map((item) => (
              <Link key={item.id} href={item.href} onClick={() => setShowMore(false)}>
                <div className="sf-drawer-item">
                  <div style={{ width: 46, height: 46, borderRadius: 15, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ color: item.color }}>{item.icon}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#E5E7EB' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{item.desc}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Bottom Nav Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-start px-1 pt-1 pb-safe-bottom"
        style={{ 
          background: '#0F172A', 
          borderTop: '1px solid rgba(255,255,255,.06)',
          height: 'calc(68px + env(safe-area-inset-bottom))'
        }}
      >
        {primary.map((item) => {
          const isActive = checkIsActive(item.href) && !showMore;
          return (
            <Link key={item.id} href={item.href} className="flex-1" onClick={() => setShowMore(false)}>
              <div className={`sf-nav-tab${isActive ? ' active' : ''}`}>
                <div className="sf-nav-pill" />
                <div className="sf-nav-icon-wrap" style={{ color: isActive ? '#6366F1' : '#6B7280' }}>
                  {item.icon}
                </div>
                <div className="sf-nav-lbl">{item.label}</div>
              </div>
            </Link>
          );
        })}

        {/* More Tab */}
        {more.length > 0 && (
          <div className={`sf-nav-tab${isMoreActive ? ' active' : ''}`} onClick={() => setShowMore(!showMore)}>
            <div className="sf-nav-pill" />
            <div className="sf-nav-icon-wrap" style={{ color: isMoreActive ? '#6366F1' : '#6B7280' }}>
              <MoreHorizontal size={22} />
            </div>
            <div className="sf-nav-lbl">More</div>
          </div>
        )}

        {/* Home indicator for aesthetics */}
        <div style={{ width: 134, height: 5, background: 'rgba(255,255,255,.13)', borderRadius: 3, position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)' }} />
      </div>
    </>
  );
};
