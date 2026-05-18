'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Search, IndianRupee, TrendingDown, TrendingUp, CheckCircle2,
  Calendar, CreditCard, Clock, Filter, Store, Users,
  ChevronDown, Download, BarChart2,
} from 'lucide-react';

import { useState } from 'react';

type TxType = 'all' | 'credit' | 'payment';

type Transaction = {
  id: number;
  date: string;
  time: string;
  customer: string;
  customerAvatar: string;
  shop: string;
  shopOwner: string;
  items: string;
  amount: number;
  type: 'credit' | 'payment';
  balance: number;
};

const allTransactions: Transaction[] = [
  { id: 1,  date: 'Mar 03, 2026', time: '10:30 AM', customer: 'Ramesh Kumar',  customerAvatar: 'RK', shop: 'Sharma Kirana',      shopOwner: 'Raj Sharma',  items: 'Basmati Rice 5kg, Toor Dal 2kg',    amount: 850,  type: 'credit',  balance: 2450 },
  { id: 2,  date: 'Mar 03, 2026', time: '09:15 AM', customer: 'Priya Sharma',  customerAvatar: 'PS', shop: 'Sharma Kirana',      shopOwner: 'Raj Sharma',  items: 'Payment received',                   amount: 1200, type: 'payment', balance: 0    },
  { id: 3,  date: 'Mar 03, 2026', time: '08:00 AM', customer: 'Kavita Singh',  customerAvatar: 'KS', shop: 'Gupta Ration',       shopOwner: 'Arun Gupta',  items: 'Payment received',                   amount: 320,  type: 'payment', balance: 0    },
  { id: 4,  date: 'Mar 02, 2026', time: '05:45 PM', customer: 'Sunita Devi',   customerAvatar: 'SD', shop: 'Patel General Store',shopOwner: 'Priya Patel', items: 'Sugar 1kg, Salt 1kg',                amount: 67,   type: 'credit',  balance: 400  },
  { id: 5,  date: 'Mar 02, 2026', time: '03:20 PM', customer: 'Mohan Verma',   customerAvatar: 'MV', shop: 'Sharma Kirana',      shopOwner: 'Raj Sharma',  items: 'Mustard Oil 1L, Turmeric 100g',      amount: 200,  type: 'credit',  balance: 3750 },
  { id: 6,  date: 'Mar 02, 2026', time: '01:00 PM', customer: 'Arun Singh',    customerAvatar: 'AS', shop: 'Gupta Ration',       shopOwner: 'Arun Gupta',  items: 'Payment received',                   amount: 500,  type: 'payment', balance: 3200 },
  { id: 7,  date: 'Mar 01, 2026', time: '06:30 PM', customer: 'Kavita Singh',  customerAvatar: 'KS', shop: 'Gupta Ration',       shopOwner: 'Arun Gupta',  items: 'Wheat Flour 10kg',                   amount: 380,  type: 'credit',  balance: 380  },
  { id: 8,  date: 'Mar 01, 2026', time: '04:10 PM', customer: 'Ramesh Kumar',  customerAvatar: 'RK', shop: 'Sharma Kirana',      shopOwner: 'Raj Sharma',  items: 'Onions 2kg, Tomatoes 1kg',           amount: 91,   type: 'credit',  balance: 1600 },
  { id: 9,  date: 'Mar 01, 2026', time: '02:30 PM', customer: 'Sunita Devi',   customerAvatar: 'SD', shop: 'Patel General Store',shopOwner: 'Priya Patel', items: 'Sunflower Oil 1L',                   amount: 140,  type: 'credit',  balance: 540  },
  { id: 10, date: 'Mar 01, 2026', time: '11:00 AM', customer: 'Mohan Verma',   customerAvatar: 'MV', shop: 'Sharma Kirana',      shopOwner: 'Raj Sharma',  items: 'Payment received',                   amount: 300,  type: 'payment', balance: 3550 },
  { id: 11, date: 'Feb 28, 2026', time: '07:00 PM', customer: 'Arun Singh',    customerAvatar: 'AS', shop: 'Gupta Ration',       shopOwner: 'Arun Gupta',  items: 'Basmati Rice 5kg, Sugar 1kg',        amount: 365,  type: 'credit',  balance: 3700 },
  { id: 12, date: 'Feb 28, 2026', time: '05:30 PM', customer: 'Priya Sharma',  customerAvatar: 'PS', shop: 'Sharma Kirana',      shopOwner: 'Raj Sharma',  items: 'Sunflower Oil 1L, Gram Dal 1kg',     amount: 230,  type: 'credit',  balance: 1200 },
  { id: 13, date: 'Feb 28, 2026', time: '03:00 PM', customer: 'Kavita Singh',  customerAvatar: 'KS', shop: 'Gupta Ration',       shopOwner: 'Arun Gupta',  items: 'Payment received',                   amount: 380,  type: 'payment', balance: 0    },
  { id: 14, date: 'Feb 27, 2026', time: '09:45 AM', customer: 'Ramesh Kumar',  customerAvatar: 'RK', shop: 'Sharma Kirana',      shopOwner: 'Raj Sharma',  items: 'Salt 2kg, Chilli Powder 200g',       amount: 99,   type: 'credit',  balance: 1509 },
  { id: 15, date: 'Feb 27, 2026', time: '08:00 AM', customer: 'Sunita Devi',   customerAvatar: 'SD', shop: 'Patel General Store',shopOwner: 'Priya Patel', items: 'Payment received',                   amount: 200,  type: 'payment', balance: 400  },
];

const shops = ['All Shops', 'Sharma Kirana', 'Patel General Store', 'Gupta Ration'];

const gradients: Record<string, string> = {
  RK: 'from-teal-500 to-teal-600',
  PS: 'from-teal-500 to-teal-600',
  SD: 'from-teal-500 to-teal-600',
  MV: 'from-teal-500 to-teal-600',
  AS: 'from-teal-500 to-teal-600',
  KP: 'from-teal-500 to-teal-600',
  KS: 'from-teal-500 to-teal-600',
};

export default function AdminHistory() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TxType>('all');
  const [shopFilter, setShopFilter] = useState('All Shops');
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  const filtered = allTransactions.filter((t) => {
    const matchType   = typeFilter === 'all' || t.type === typeFilter;
    const matchShop   = shopFilter === 'All Shops' || t.shop === shopFilter;
    const matchSearch =
      t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.shop.toLowerCase().includes(search.toLowerCase()) ||
      t.items.toLowerCase().includes(search.toLowerCase());
    return matchType && matchShop && matchSearch;
  });

  const totalCredit  = filtered.filter(t => t.type === 'credit').reduce((s, t)  => s + t.amount, 0);
  const totalPayment = filtered.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
  const outstanding  = totalCredit - totalPayment;

  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t);
    return acc;
  }, {});

  const uniqueShops = [...new Set(filtered.map(t => t.shop))].length;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div
           
           
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Platform History</h1>
              <p className="text-muted-foreground mt-1">All credit & payment transactions across all shops</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Credit',    value: `₹${totalCredit.toLocaleString()}`,   icon: TrendingDown,  gradient: 'from-red-500 to-teal-600',      delay: 0    },
              { label: 'Total Payments',  value: `₹${totalPayment.toLocaleString()}`,  icon: TrendingUp,    gradient: 'from-teal-500 to-teal-600',   delay: 0.06 },
              { label: 'Outstanding',     value: `₹${outstanding.toLocaleString()}`,   icon: IndianRupee,   gradient: 'from-teal-500 to-teal-600',   delay: 0.12 },
              { label: 'Active Shops',    value: uniqueShops.toString(),               icon: Store,         gradient: 'from-teal-500 to-teal-600',  delay: 0.18 },
            ].map((s, i) => (
              <div
                key={i}
               
               
               
                className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Per-shop breakdown */}
          <div
           
           
           
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all"
          >
            <h2 className="font-black text-foreground mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary dark:text-indigo-400" /> Shop Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {shops.slice(1).map((shop, i) => {
                const shopTxs    = allTransactions.filter(t => t.shop === shop);
                const shopCredit = shopTxs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
                const shopPaid   = shopTxs.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
                const pctPaid    = shopCredit > 0 ? Math.round((shopPaid / shopCredit) * 100) : 0;
                const colors = ['from-teal-500 to-teal-600', 'from-teal-500 to-teal-600', 'from-teal-500 to-teal-600'];
                return (
                  <div key={shop} className="p-4 rounded-2xl border border-border/50 bg-card text-card-foreground border border-border shadow-sm dark:bg-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colors[i]} flex items-center justify-center`}>
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-bold text-foreground text-sm">{shop}</p>
                    </div>
                    <div className="space-y-1.5 text-xs mb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit given</span>
                        <span className="font-bold text-red-500">₹{shopCredit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Collected</span>
                        <span className="font-bold text-primary dark:text-primary dark:text-indigo-400">₹{shopPaid.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                       
                       
                       
                        className={`h-full rounded-full bg-gradient-to-r ${colors[i]}`}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{pctPaid}% collected</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div
           
           
           
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, shop or items..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50 transition"
                />
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50">
                {(['all', 'credit', 'payment'] as TxType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`relative px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${typeFilter === t ? 'text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {typeFilter === t && (
                      <span
                        className={`absolute inset-0 rounded-lg ${t === 'credit' ? 'bg-red-500' : t === 'payment' ? 'bg-primary' : 'bg-gradient-to-r from-primary to-indigo-500'}`}
                      />
                    )}
                    <span className="relative">{t}</span>
                  </button>
                ))}
              </div>

              {/* Shop dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowShopDropdown(!showShopDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors min-w-[180px] justify-between"
                >
                  <Store className="w-4 h-4" />
                  <span className="flex-1 text-left truncate">{shopFilter}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showShopDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                  {showShopDropdown && (
                    <div
                     
                     
                     
                     
                      className="absolute right-0 top-full mt-2 w-52 glass border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden py-1 z-50"
                    >
                      {shops.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setShopFilter(s); setShowShopDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm font-medium transition-colors ${shopFilter === s ? 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-primary dark:text-indigo-400' : 'text-foreground hover:bg-muted/60'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Showing <span className="font-bold text-foreground">{filtered.length}</span> transactions
            </p>
          </div>

          {/* Date-grouped transactions */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, txs], gi) => (
              <div
                key={date}
               
               
               
              >
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{date}</span>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground font-semibold">
                    {txs.filter(t => t.type === 'credit').length}↑ credit · {txs.filter(t => t.type === 'payment').length}↓ payment
                  </span>
                </div>

                <div className="space-y-2">
                  {txs.map((t, i) => (
                    <div
                      key={t.id}
                     
                     
                     
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-md ${
                        t.type === 'credit'
                          ? 'border-red-500/15 bg-red-500/5 hover:border-red-500/25'
                          : 'border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors hover:border-indigo-500/20 dark:border-indigo-400/20'
                      }`}
                    >
                      {/* Customer avatar */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[t.customerAvatar] ?? 'from-slate-400 to-slate-600'} flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-md`}>
                        {t.customerAvatar}
                      </div>

                      {/* Type icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'credit' ? 'bg-red-500/10' : 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors'}`}>
                        {t.type === 'credit'
                          ? <CreditCard className="w-4 h-4 text-red-500" />
                          : <CheckCircle2 className="w-4 h-4 text-primary dark:text-indigo-400" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground text-sm">{t.customer}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-primary dark:text-indigo-400">
                            {t.shop}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{t.items}</p>
                      </div>

                      {/* Time */}
                      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Clock className="w-3 h-3" />{t.time}
                      </div>

                      {/* Balance */}
                      <div className="hidden lg:block text-right flex-shrink-0">
                        <p className="text-[10px] text-muted-foreground">Balance after</p>
                        <p className="text-xs font-bold text-foreground">₹{t.balance.toLocaleString()}</p>
                      </div>

                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-black ${t.type === 'credit' ? 'text-red-500' : 'text-primary dark:text-primary dark:text-indigo-400'}`}>
                          {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                        </p>
                        <p className={`text-[10px] font-bold capitalize ${t.type === 'credit' ? 'text-red-400' : 'text-primary dark:text-indigo-400'}`}>
                          {t.type === 'credit' ? 'Credit' : 'Payment'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div
               
               
                className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all text-center py-16"
              >
                <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-bold text-foreground">No transactions found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

