'use client';

// This page shows the full transaction history for a specific customer.
// It reuses the same data as the customer profile page but focused on history with all filters.

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  ChevronLeft, TrendingDown, TrendingUp, CheckCircle2, CreditCard,
  Loader2, FileText, FileSpreadsheet, Calendar, ChevronDown,
  Clock, Package, Filter, X, Search, IndianRupee, RefreshCw, Download
} from 'lucide-react';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type TxItem = { productName: string; quantity: number; unitPrice: number; subtotal: number };
type Tx = { id: string; date: string; totalAmount: number; paidAmount: number; balance: number; status: string; items: TxItem[] };
type Pay = { id: string; date: string; amount: number; paymentMethod: string; notes?: string };

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtGroup = (d: string) => {
  const dt = new Date(d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (dt.toDateString() === today.toDateString()) return 'Today';
  if (dt.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });
};

export default function CustomerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  const searchParams = useSearchParams();
  const refreshKey = searchParams.get('refresh');

  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [payments, setPayments] = useState<Pay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'payment'>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await shopOwnerAPI.getCustomerHistory(customerId, {});
      setCustomer(res.data.customer);
      setTransactions(res.data.transactions || []);
      setPayments(res.data.payments || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { setIsLoading(false); }
  }, [customerId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory, refreshKey]);

  useEffect(() => {
    const handleFocusRefresh = () => {
      fetchHistory();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        fetchHistory();
      }
    };

    window.addEventListener('focus', handleFocusRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      window.removeEventListener('focus', handleFocusRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [fetchHistory]);

  const combined = useMemo(() => [
    ...transactions.map(t => ({ ...t, _type: 'credit' as const, _date: new Date(t.date) })),
    ...payments.map(p => ({ ...p, _type: 'payment' as const, _date: new Date(p.date) })),
  ], [transactions, payments]);

  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const q = searchQuery.toLowerCase().trim();

    return combined.filter(item => {
      if (typeFilter !== 'all' && item._type !== typeFilter) return false;

      switch (datePreset) {
        case 'today': if (item._date < today) return false; break;
        case 'week': { const d = new Date(today); d.setDate(d.getDate()-7); if (item._date < d) return false; break; }
        case 'month': { const d = new Date(today); d.setMonth(d.getMonth()-1); if (item._date < d) return false; break; }
        case 'year': { const d = new Date(today); d.setFullYear(d.getFullYear()-1); if (item._date < d) return false; break; }
        case 'custom': {
          if (customStart && item._date < new Date(customStart)) return false;
          if (customEnd) { const e = new Date(customEnd); e.setHours(23,59,59,999); if (item._date > e) return false; }
          break;
        }
      }

      if (q) {
        const match = item._type === 'credit'
          ? (item as Tx).items.map(i => i.productName).join(' ').toLowerCase().includes(q)
          : (((item as Pay).notes || '') + (item as Pay).paymentMethod).toLowerCase().includes(q);
        if (!item.id.toLowerCase().includes(q) && !match) return false;
      }

      return true;
    }).sort((a, b) => sortDir === 'desc' ? b._date.getTime() - a._date.getTime() : a._date.getTime() - b._date.getTime());
  }, [combined, typeFilter, datePreset, customStart, customEnd, searchQuery, sortDir]);

  const dateGroups = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach(i => { const k = fmtGroup(i.date); if (!g[k]) g[k] = []; g[k].push(i); });
    return Object.entries(g);
  }, [filtered]);

  const totalCredit = filtered.filter(i => i._type === 'credit').reduce((s, t) => s + ((t as Tx).totalAmount || 0), 0);
  const totalPaid = filtered.filter(i => i._type === 'payment').reduce((s, p) => s + ((p as Pay).amount || 0), 0);

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const xlsx = await import('xlsx');
      const rows = filtered.map(item => ({
        Date: fmtDate(item.date), Time: fmtTime(item.date),
        Type: item._type === 'credit' ? 'Credit Given' : 'Payment Received',
        Details: item._type === 'credit' ? (item as Tx).items.map(i => `${i.productName} x${i.quantity}`).join(', ') : `${(item as Pay).paymentMethod} ${(item as Pay).notes || ''}`,
        'Amount (Rs.)': item._type === 'credit' ? (item as Tx).totalAmount : (item as Pay).amount,
        Status: item._type === 'credit' ? (item as Tx).status : 'PAID',
      }));
      const ws = xlsx.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wpx: 90 }, { wpx: 65 }, { wpx: 120 }, { wpx: 200 }, { wpx: 100 }, { wpx: 80 }];
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'History');
      xlsx.writeFile(wb, `${customer?.name}_history.xlsx`);
      toast({ title: '✅ Excel Downloaded!' });
    } catch { toast({ title: 'Export Failed', variant: 'destructive' }); }
    finally { setIsExporting(false); }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF() as any;

      // ── Header ──
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFillColor(124, 58, 237);
      doc.rect(140, 0, 70, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${customer?.name || 'Customer'} - Transaction History`, 14, 14);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Phone: ${customer?.phone || 'N/A'}  |  Status: ${customer?.status || 'N/A'}`, 14, 22);
      doc.text(`Credit: Rs.${totalCredit.toLocaleString()}  |  Paid: Rs.${totalPaid.toLocaleString()}  |  Balance: Rs.${(customer?.creditBalance || (totalCredit - totalPaid)).toLocaleString()}`, 14, 28);
      doc.text(`Generated: ${fmtDate(new Date().toISOString())} ${fmtTime(new Date().toISOString())}  |  Records: ${filtered.length}`, 14, 34);

      // ── Table ──
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: 46,
        head: [['Date', 'Time', 'Type', 'Details', 'Amount (Rs.)', 'Status']],
        body: filtered.map(i => {
          const isCr = i._type === 'credit';
          const amt = isCr ? (i as Tx).totalAmount : (i as Pay).amount;
          return [
            fmtDate(i.date),
            fmtTime(i.date),
            isCr ? 'Credit Given' : 'Payment Received',
            isCr 
              ? (i as Tx).items.slice(0, 3).map(it => `${it.productName} x${it.quantity}`).join(', ')
              : `${(i as Pay).paymentMethod?.replace('_', ' ')}${(i as Pay).notes ? ' - ' + (i as Pay).notes : ''}`.trim(),
            `${isCr ? '+' : '-'}Rs.${amt.toLocaleString()}`,
            isCr ? (i as Tx).status : 'PAID',
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontSize: 7.5, textColor: [255, 255, 255], fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 249, 255] },
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' },
          5: { halign: 'center' },
        },
        margin: { left: 12, right: 12 },
        didParseCell: (data: any) => {
          if (data.column.index === 4 && data.section === 'body') {
            const text = data.cell.text?.[0] || '';
            if (text.startsWith('+')) data.cell.styles.textColor = [220, 38, 38];
            else if (text.startsWith('-')) data.cell.styles.textColor = [22, 163, 74];
          }
          if (data.column.index === 5 && data.section === 'body') {
            const text = data.cell.text?.[0] || '';
            if (text === 'PAID') data.cell.styles.textColor = [22, 163, 74];
            else if (text === 'PARTIAL') data.cell.styles.textColor = [217, 119, 6];
            else if (text === 'PENDING') data.cell.styles.textColor = [220, 38, 38];
          }
        },
      });

      // ── Summary ──
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      const sy = finalY > 255 ? 20 : finalY + 8;
      if (finalY > 255) doc.addPage();
      
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(12, sy, 186, 24, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(`Total Credit Given: Rs.${totalCredit.toLocaleString()}`, 18, sy + 7);
      doc.text(`Total Payments: Rs.${totalPaid.toLocaleString()}`, 18, sy + 13);
      doc.text(`Balance Outstanding: Rs.${(customer?.creditBalance || (totalCredit - totalPaid)).toLocaleString()}`, 18, sy + 19);
      doc.text(`Total Records: ${filtered.length}`, 120, sy + 7);

      doc.save(`${customer?.name || 'Customer'}_history.pdf`);
      toast({ title: '✅ PDF Downloaded!' });
    } catch { toast({ title: 'Export Failed', variant: 'destructive' }); }
    finally { setIsExporting(false); }
  };

  if (isLoading) return (
    <ProtectedRoute requiredRole="SHOP_OWNER"><DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary dark:text-indigo-400" />
      </div>
    </DashboardLayout></ProtectedRoute>
  );

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Back */}
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> {customer?.name || 'Customer'}
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary dark:text-indigo-400" />
                Full History
                {customer && <span className="text-muted-foreground font-semibold text-lg">— {customer.name}</span>}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">{filtered.length} records · Credit ₹{totalCredit.toLocaleString()} · Paid ₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchHistory} disabled={isLoading}
                className="p-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm hover:bg-muted">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={exportExcel} disabled={isExporting || filtered.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button onClick={exportPDF} disabled={isExporting || filtered.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products, notes, ref..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <select value={datePreset} onChange={e => setDatePreset(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">7 Days</option>
                <option value="month">30 Days</option>
                <option value="year">1 Year</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {datePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none" />
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none" />
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 items-center">
              {(['all', 'credit', 'payment'] as const).map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${typeFilter === t
                    ? t === 'credit' ? 'bg-red-500 text-white border-red-500' : t === 'payment' ? 'bg-primary text-white border-primary' : 'bg-primary text-white border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'}`}>
                  {t === 'credit' ? '↑ Credit' : t === 'payment' ? '↓ Payment' : 'All'}
                </button>
              ))}
              <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold border border-border text-muted-foreground hover:bg-muted transition-all">
                {sortDir === 'desc' ? 'Newest ↓' : 'Oldest ↑'}
              </button>
            </div>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No records found</p>
            </div>
          ) : (
            <div className="space-y-5 pb-6">
              {dateGroups.map(([dateLabel, items]) => {
                const dayCredit = items.filter(i => i._type === 'credit').reduce((s, t) => s + ((t as Tx).totalAmount || 0), 0);
                const dayPay = items.filter(i => i._type === 'payment').reduce((s, p) => s + ((p as Pay).amount || 0), 0);
                return (
                  <div key={dateLabel}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px bg-border/60" />
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/50">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-black text-muted-foreground">{dateLabel}</span>
                        {dayCredit > 0 && <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1 rounded">+₹{dayCredit.toLocaleString()}</span>}
                        {dayPay > 0 && <span className="text-[9px] font-black text-primary dark:text-indigo-400 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors px-1 rounded">-₹{dayPay.toLocaleString()}</span>}
                      </div>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                    <div className="space-y-2">
                      {items.map((item, i) => {
                        const isCr = item._type === 'credit';
                        const tx = isCr ? item as Tx : null;
                        const pay = !isCr ? item as Pay : null;
                        const amt = isCr ? tx!.totalAmount : pay!.amount;
                        return (
                          <div key={item.id}
                            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-3 sm:p-4 cursor-pointer hover:border-indigo-500/20 dark:border-indigo-400/20 transition-all"
                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0 ${isCr ? 'from-red-500 to-teal-600' : 'from-teal-500 to-teal-600'}`}>
                                {isCr ? <TrendingDown className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground text-sm">{isCr ? 'Credit Given' : 'Payment Received'}</p>
                                {isCr && tx!.items.length > 0 && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {tx!.items.slice(0, 2).map(it => `${it.productName} ×${it.quantity}`).join(', ')}
                                    {tx!.items.length > 2 && ` +${tx!.items.length - 2}`}
                                  </p>
                                )}
                                {!isCr && (
                                  <p className="text-xs text-muted-foreground">{pay!.paymentMethod?.replace('_', ' ')}{pay!.notes ? ` · ${pay!.notes}` : ''}</p>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  <span className="font-mono bg-muted px-1 rounded text-[9px]">{String(item.id).slice(-8).toUpperCase()}</span>
                                  <span className="ml-1">{fmtTime(item.date)}</span>
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={`font-black ${isCr ? 'text-red-500' : 'text-primary dark:text-indigo-400'}`}>{isCr ? '+' : '-'}₹{amt.toLocaleString()}</p>
                              </div>
                              <div>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                            </div>
                            
                              {expandedId === item.id && isCr && tx!.items.length > 0 && (
                                <div
                                  className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                                  {tx!.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between text-xs p-2 rounded-lg bg-card text-card-foreground border border-border shadow-sm">
                                      <span>{it.productName} × {it.quantity}</span>
                                      <span className="font-bold">₹{it.subtotal.toLocaleString()}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between text-xs font-black pt-1 border-t border-border/30">
                                    <span>Total</span><span className="text-red-500">₹{tx!.totalAmount.toLocaleString()}</span>
                                  </div>
                                </div>
                              )}
                            
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filtered.length > 5 && (
                <div className="flex gap-3 justify-center pt-4 border-t border-border/40">
                  <button onClick={exportExcel} disabled={isExporting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-teal-700 text-white font-bold text-sm">
                    <Download className="w-4 h-4" /> Export Excel
                  </button>
                  <button onClick={exportPDF} disabled={isExporting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
