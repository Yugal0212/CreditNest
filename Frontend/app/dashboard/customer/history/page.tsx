'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  IndianRupee, TrendingDown, TrendingUp, CheckCircle2,
  Calendar, CreditCard, Clock, AlertCircle, Filter, Loader2, Package,
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { customerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type TxType = 'all' | 'credit' | 'payment';

type Order = {
  id: string;
  date: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number; subtotal: number }>;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  notes?: string;
};

type Payment = {
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  receiptNumber?: string;
  notes?: string;
};

export default function CustomerHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TxType>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, paymentsRes] = await Promise.all([
        customerAPI.getOrders({ limit: 50 }),
        customerAPI.getPayments({ limit: 50 }),
      ]);
      setOrders((ordersRes.data.orders || []).filter((o: Order) => !o.notes?.startsWith('[REQUEST]')));
      setPayments(paymentsRes.data.payments || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to load history', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const totalCredit = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = totalCredit - totalPaid;

  // Combine and sort
  const combined = [
    ...orders.map(o => ({ ...o, _type: 'credit' as const, _date: new Date(o.date), _amount: o.totalAmount })),
    ...payments.map(p => ({ ...p, _type: 'payment' as const, _date: new Date(p.date), _amount: p.amount })),
  ].sort((a, b) => b._date.getTime() - a._date.getTime());

  const filtered = typeFilter === 'all' ? combined : combined.filter(item => item._type === typeFilter);

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = formatDate(item._date.toISOString());
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div
           
           
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">My Credit History</h1>
              <p className="text-muted-foreground mt-1">All your credit & payment records</p>
            </div>
            {outstanding > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-500">
                <AlertCircle className="w-4 h-4" /> ₹{outstanding.toLocaleString()} outstanding
              </div>
            )}
          </div>

          {/* Summary Cards */}
          {!isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              {[
                { label: 'Total Udhar Taken', value: `₹${totalCredit.toLocaleString()}`, icon: CreditCard, gradient: 'from-red-500 to-teal-600', delay: 0 },
                { label: 'Amount Paid', value: `₹${totalPaid.toLocaleString()}`, icon: TrendingUp, gradient: 'from-teal-500 to-teal-600', delay: 0.07 },
                { label: 'Balance Due', value: `₹${outstanding.toLocaleString()}`, icon: IndianRupee, gradient: 'from-teal-500 to-teal-600', delay: 0.14 },
              ].map((s, i) => (
                <div
                  key={i}
                 
                 
                 
                  className={`glass-card p-3 sm:p-5 flex flex-col gap-2 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}
                >
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <s.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-black text-foreground leading-none">{s.value}</p>
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50 w-fit">
            {(['all', 'credit', 'payment'] as TxType[]).map(t => (
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

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary dark:text-indigo-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="font-bold text-foreground">No records found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {typeFilter !== 'all' ? 'Try switching to "All" to see everything' : 'No transactions yet. Visit the products page to request items.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, items], gi) => (
                <div
                  key={date}
                 
                 
                 
                >
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{date}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div
                        key={item.id}
                       
                       
                       
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${item._type === 'credit'
                          ? 'border-red-500/15 bg-red-500/5 hover:border-red-500/25'
                          : 'border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors hover:border-indigo-500/20 dark:border-indigo-400/20'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item._type === 'credit' ? 'bg-red-500/10' : 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors'}`}>
                          {item._type === 'credit'
                            ? <TrendingDown className="w-5 h-5 text-red-500" />
                            : <CheckCircle2 className="w-5 h-5 text-primary dark:text-indigo-400" />
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          {item._type === 'credit' && 'items' in item ? (
                            <p className="font-bold text-foreground text-sm sm:text-base whitespace-normal break-words leading-tight mb-1">
                              {(item as Order).items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                            </p>
                          ) : (
                            <p className="font-bold text-foreground text-sm sm:text-base mb-1">Payment received</p>
                          )}
                          <p className="text-xs font-bold text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded">ID: {String(item.id).slice(-6).toUpperCase()}</span>
                            <Clock className="w-3 h-3" />{formatTime(item._date.toISOString())}
                            {item._type === 'payment' && 'paymentMethod' in item && (
                              <span className="ml-1 capitalize">· {(item as Payment).paymentMethod.replace('_', ' ')}</span>
                            )}
                          </p>
                        </div>

                        {'balance' in item && item._type === 'credit' && (
                          <div className="hidden sm:block text-right flex-shrink-0">
                            <p className="text-[10px] text-muted-foreground">Balance after</p>
                            <p className="text-xs font-bold text-foreground">₹{(item as Order).balance.toLocaleString()}</p>
                          </div>
                        )}

                        <div className="text-right flex-shrink-0">
                          <p className={`text-base sm:text-lg font-black ${item._type === 'credit' ? 'text-red-500' : 'text-primary dark:text-primary dark:text-indigo-400'}`}>
                            {item._type === 'credit' ? '+' : '-'}₹{item._amount.toLocaleString()}
                          </p>
                          <p className={`text-xs font-bold ${item._type === 'credit' ? 'text-red-400' : 'text-primary dark:text-indigo-400'}`}>
                            {item._type === 'credit' ? 'Udhar Taken' : 'Paid'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

