'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutGrid, Package, Users, History, ShoppingBag, User, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const getNavItems = () => ({
  admin: [
    { href: '/dashboard/admin',           icon: LayoutGrid,  label: 'Home'     },
    { href: '/dashboard/admin/shops',     icon: Package,     label: 'Shops'    },
    { href: '/dashboard/admin/users',     icon: Users,       label: 'Users'    },
    { href: '/dashboard/admin/analytics', icon: BarChart2,   label: 'Analytics'},
    { href: '/dashboard/profile',         icon: User,        label: 'Profile'  },
  ],
  shop_owner: [
    { href: '/dashboard/shop_owner',           icon: LayoutGrid,  label: 'Home'      },
    { href: '/dashboard/shop_owner/customers', icon: Users,       label: 'Customers' },
    { href: '/dashboard/shop_owner/products',  icon: Package,     label: 'Products'  },
    { href: '/dashboard/shop_owner/orders',    icon: ShoppingBag, label: 'Orders'    },
    { href: '/dashboard/profile',              icon: User,        label: 'Profile'   },
  ],
  customer: [
    { href: '/dashboard/customer',          icon: LayoutGrid, label: 'Home'    },
    { href: '/dashboard/customer/products', icon: Package,    label: 'Products'},
    { href: '/dashboard/customer/history',  icon: History,    label: 'History' },
    { href: '/dashboard/profile',           icon: User,       label: 'Profile' },
  ],
});

export const BottomNavBar = () => {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated || !user) return null;

  const roleKey = user.role.toLowerCase() as 'admin' | 'shop_owner' | 'customer';
  const items   = getNavItems()[roleKey] || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
      <div
        className="pointer-events-auto mx-3 mb-3 overflow-hidden"
        style={{
          borderRadius: '16px',
          background: '#111827',
          border: '1px solid #1F2937',
          boxShadow: '0 -1px 0 rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.35)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Gold accent top line */}
        <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent 5%, #D4A017 35%, #1A5276 65%, transparent 95%)', opacity: 0.7 }} />

        {/* Nav items */}
        <nav className="flex items-stretch justify-around px-1 pt-1 pb-1.5">
          {items.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              (![ '/dashboard/admin', '/dashboard/shop_owner', '/dashboard/customer' ].includes(href) &&
               pathname.startsWith(href + '/'));

            return (
              <Link key={href} href={href} className="flex-1 min-w-0">
                <motion.div
                  whileTap={{ scale: 0.84 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="relative flex flex-col items-center gap-0.5 py-2 px-1"
                >
                  {/* Active pill */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="bottom-nav-active"
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute inset-x-1 inset-y-0.5 rounded-2xl"
                        style={{ background: '#1F2937' }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon */}
                  <motion.div
                    animate={isActive ? { y: -1 } : { y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="relative z-10 mt-0.5"
                  >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      color={isActive ? '#F9FAFB' : '#6B7280'}
                      className="transition-all duration-200"
                    />
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    animate={{ opacity: isActive ? 1 : 0.55 }}
                    className="relative z-10 leading-none"
                    style={{
                      fontSize: '9.5px',
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? '#F9FAFB' : '#6B7280',
                      letterSpacing: '0.02em',
                      marginBottom: '2px',
                    }}
                  >
                    {label}
                  </motion.span>

                  {/* Active dot */}
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-dot"
                      style={{
                        position: 'absolute', bottom: '4px',
                        width: '4px', height: '4px', borderRadius: '50%',
                        background: '#D4A017',
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
