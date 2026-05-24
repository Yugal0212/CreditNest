'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { shopOwnerAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Search, Package, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function TopBarSearch() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ customers: any[], products: any[] }>({ customers: [], products: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ customers: [], products: [] });
      setIsSearching(false);
      return;
    }

    if (user?.role?.toLowerCase() !== 'shop_owner') return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          shopOwnerAPI.getCustomers({ search: query, limit: 5 }),
          shopOwnerAPI.getProducts({ search: query, limit: 5 })
        ]);
        
        const customersData = custRes.data?.data?.customers || custRes.data?.customers || custRes.data?.data || custRes.data || [];
        const productsData  = prodRes.data?.data?.products  || prodRes.data?.products  || prodRes.data?.data  || prodRes.data  || [];

        setResults({
          customers: Array.isArray(customersData) ? customersData : [],
          products:  Array.isArray(productsData)  ? productsData  : []
        });
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, user?.role]);

  const handleCustomerClick = (c: any) => {
    setIsOpen(false);
    setQuery('');
    // Redirect to customers page with search query
    router.push(`/dashboard/shop_owner/customers?search=${encodeURIComponent(c.name || query)}`);
  };

  const handleProductClick = (p: any) => {
    setIsOpen(false);
    setQuery('');
    // Redirect to products page with search query
    router.push(`/dashboard/shop_owner/products?search=${encodeURIComponent(p.name || query)}`);
  };

  const handleViewAll = (type: 'customers' | 'products') => {
    setIsOpen(false);
    setQuery('');
    router.push(`/dashboard/shop_owner/${type}?search=${encodeURIComponent(query)}`);
  };

  const hasResults = results.customers.length > 0 || results.products.length > 0;

  return (
    <div ref={containerRef} className="hidden sm:flex relative items-center">
      {/* Search Input */}
      <div style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
        height: '38px',
        minWidth: '220px',
        width: '340px',
        borderRadius: '10px',
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e8eef6'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 12px',
        transition: 'all 0.2s ease',
      }}>
        <Search size={14} color={isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8'} strokeWidth={2} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={(e) => {
            if (query) setIsOpen(true);
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.borderColor = '#6366f1';
              parent.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }
          }}
          onBlur={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e8eef6';
              parent.style.boxShadow = 'none';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setIsOpen(false); setQuery(''); }
          }}
          placeholder="Search customers, products..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            color: isDark ? '#F8FAFC' : '#1e293b',
            width: '100%',
          }}
        />
        {isSearching ? (
          <Loader2 size={13} className="animate-spin" color="#6366f1" />
        ) : !query ? (
          <span style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
            padding: '2px 6px', borderRadius: '4px',
            fontSize: '10px', color: isDark ? '#94A3B8' : '#64748b',
            fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap',
          }}>⌘K</span>
        ) : null}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: '360px',
              background: isDark ? '#131e30' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e8eef6'}`,
              borderRadius: '14px',
              boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              zIndex: 50,
            }}
          >
            {!isSearching && !hasResults ? (
              <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                <Search size={28} color={isDark ? '#334155' : '#CBD5E1'} strokeWidth={1.5} style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: '13px', color: isDark ? '#475569' : '#94A3B8', margin: 0 }}>
                  No results for <strong>"{query}"</strong>
                </p>
              </div>
            ) : (
              <div style={{ padding: '8px' }}>

                {/* Customers */}
                {results.customers.length > 0 && (
                  <div style={{ marginBottom: results.products.length > 0 ? '8px' : 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px 4px',
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: isDark ? '#475569' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Customers
                      </span>
                      <button
                        onClick={() => handleViewAll('customers')}
                        style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        View all →
                      </button>
                    </div>
                    {results.customers.map((c: any) => (
                      <button
                        key={c._id || c.id}
                        onClick={() => handleCustomerClick(c)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 10px', borderRadius: '8px', width: '100%',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          textAlign: 'left', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Users size={14} color="#6366f1" strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#F1F5F9' : '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                          <p style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8', margin: 0 }}>{c.phone || c.email || 'Customer'}</p>
                        </div>
                        <ChevronRight size={13} color={isDark ? '#334155' : '#CBD5E1'} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Divider */}
                {results.customers.length > 0 && results.products.length > 0 && (
                  <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', margin: '4px 0' }} />
                )}

                {/* Products */}
                {results.products.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px 4px',
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: isDark ? '#475569' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Products
                      </span>
                      <button
                        onClick={() => handleViewAll('products')}
                        style={{ fontSize: '10px', color: '#10b981', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        View all →
                      </button>
                    </div>
                    {results.products.map((p: any) => (
                      <button
                        key={p._id || p.id}
                        onClick={() => handleProductClick(p)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 10px', borderRadius: '8px', width: '100%',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          textAlign: 'left', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={14} color="#10b981" strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#F1F5F9' : '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                          <p style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8', margin: 0 }}>₹{p.price ?? p.sellingPrice ?? '—'}</p>
                        </div>
                        <ChevronRight size={13} color={isDark ? '#334155' : '#CBD5E1'} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
