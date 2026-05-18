'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  ChevronLeft, Phone, Mail, MapPin, Briefcase, IndianRupee, CreditCard,
  TrendingDown, TrendingUp, CheckCircle2, Loader2, Package, X,
  FileText, FileSpreadsheet, Calendar, ChevronDown, ChevronUp,
  Pencil, Trash2, History, User, AlertCircle, Clock, RefreshCw,
} from 'lucide-react';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type CustomerInfo = {
  id: string; name: string; phone: string; email?: string; address?: string; workplace?: string;
  creditBalance: number; totalCredit: number; totalPaid: number; status: string; joinDate?: string; avatar?: string;
};
type TxItem = { productName: string; quantity: number; unitPrice: number; subtotal: number };
type Tx = { id: string; date: string; totalAmount: number; paidAmount: number; balance: number; status: string; items: TxItem[] };
type Pay = { id: string; date: string; amount: number; paymentMethod: string; receiptNumber: string; notes?: string };

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  OVERDUE: 'bg-red-500/10 text-red-500 border-red-500/20',
  CLEARED: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
};
const CREDIT_STATUS: Record<string, string> = {
  PAID: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  PARTIAL: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  PENDING: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtRelative = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return fmtDate(d);
};

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [payments, setPayments] = useState<Pay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'credit' | 'payment'>('overview');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Delete confirm
  const [showDelete, setShowDelete] = useState(false);
  const [deletingCust, setDeletingCust] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await shopOwnerAPI.getCustomerHistory(customerId, {});
      setCustomer(res.data.customer);
      setTransactions(res.data.transactions || []);
      setPayments(res.data.payments || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to load', variant: 'destructive' });
    } finally { setIsLoading(false); }
  }, [customerId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const handleFocusRefresh = () => {
      fetchAll();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        fetchAll();
      }
    };

    window.addEventListener('focus', handleFocusRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      window.removeEventListener('focus', handleFocusRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [fetchAll]);

  const handleRecordPayment = async () => {
    if (!payAmount || !customer) return;
    setSubmittingPay(true);
    try {
      await shopOwnerAPI.recordPayment({ customerId: customer.id, amount: parseFloat(payAmount), paymentMethod: payMethod, notes: payNotes || undefined });
      toast({ title: '✅ Payment Recorded!', description: `₹${parseFloat(payAmount).toLocaleString()} received from ${customer.name}` });
      setShowPayModal(false); setPayAmount(''); setPayNotes('');
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { setSubmittingPay(false); }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    setDeletingCust(true);
    try {
      await shopOwnerAPI.deleteCustomer(customer.id);
      toast({ title: 'Deleted', description: `${customer.name} has been deleted` });
      router.replace('/dashboard/shop_owner/customers');
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to delete', variant: 'destructive' });
      setDeletingCust(false);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF() as any;
      const combined = [
        ...transactions.map(t => ({ _type: 'credit', date: t.date, amount: t.totalAmount, detail: t.items.map(i => `${i.productName} x${i.quantity}`).join(', '), status: t.status })),
        ...payments.map(p => ({ _type: 'payment', date: p.date, amount: p.amount, detail: `${p.paymentMethod?.replace('_', ' ')}${p.notes ? ' - ' + p.notes : ''}`.trim(), status: 'PAID' })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Header
      doc.setFillColor(20, 184, 166);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFillColor(14, 116, 144);
      doc.rect(140, 0, 70, 40, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text(`Customer Report: ${customer?.name || 'N/A'}`, 14, 14);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Phone: ${customer?.phone || 'N/A'}  |  Status: ${customer?.status || 'N/A'}`, 14, 22);
      doc.text(`Outstanding: Rs.${customer?.creditBalance?.toLocaleString() || '0'}  |  Total Credit: Rs.${customer?.totalCredit?.toLocaleString() || '0'}`, 14, 28);
      doc.text(`Generated: ${fmtDate(new Date().toISOString())} ${fmtTime(new Date().toISOString())}  |  Records: ${combined.length}`, 14, 34);
      doc.setTextColor(0,0,0);

      autoTable(doc, {
        startY: 46,
        head: [['Date', 'Time', 'Type', 'Details', 'Amount (Rs.)', 'Status']],
        body: combined.map(i => [
          fmtDate(i.date), fmtTime(i.date),
          i._type === 'credit' ? 'Credit Given' : 'Payment Received',
          i.detail,
          `${i._type === 'credit' ? '+' : '-'}Rs.${i.amount.toLocaleString()}`,
          i.status
        ]),
        theme: 'striped',
        headStyles: { fillColor: [20, 184, 166], fontSize: 7.5, textColor: [255, 255, 255], fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, cellPadding: 2 },
        alternateRowStyles: { fillColor: [235, 248, 248] },
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' }, 5: { halign: 'center' } },
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

      // Summary
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      const sy = finalY > 255 ? 20 : finalY + 8;
      if (finalY > 255) doc.addPage();
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(12, sy, 186, 24, 3, 3, 'F');
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50);
      doc.text(`Total Credit: Rs.${customer?.totalCredit?.toLocaleString() || '0'}`, 18, sy + 7);
      doc.text(`Total Paid: Rs.${customer?.totalPaid?.toLocaleString() || '0'}`, 18, sy + 13);
      doc.text(`Balance: Rs.${customer?.creditBalance?.toLocaleString() || '0'}`, 18, sy + 19);
      doc.text(`Records: ${combined.length}`, 120, sy + 7);

      doc.save(`${customer?.name || 'Customer'}_report.pdf`);
      toast({ title: '✅ PDF Downloaded!' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    finally { setIsExporting(false); }
  };

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const xlsx = await import('xlsx');
      const combined = [
        ...transactions.map(t => ({ Date: fmtDate(t.date), Time: fmtTime(t.date), Type: 'Credit Given', Details: t.items.map(i => `${i.productName} x${i.quantity}`).join(', '), 'Amount (Rs.)': t.totalAmount, Status: t.status })),
        ...payments.map(p => ({ Date: fmtDate(p.date), Time: fmtTime(p.date), Type: 'Payment Received', Details: p.paymentMethod, 'Amount (Rs.)': p.amount, Status: 'PAID' })),
      ].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
      const ws = xlsx.utils.json_to_sheet(combined);
      ws['!cols'] = [{ wpx: 90 }, { wpx: 65 }, { wpx: 120 }, { wpx: 200 }, { wpx: 100 }, { wpx: 80 }];
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'History');
      xlsx.writeFile(wb, `${customer?.name}_report.xlsx`);
      toast({ title: '✅ Excel Downloaded!' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    finally { setIsExporting(false); }
  };

  if (isLoading) return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );

  const totalTxCredit = transactions.reduce((s, t) => s + t.totalAmount, 0);
  const totalTxPaid = payments.reduce((s, p) => s + p.amount, 0);
  const initials = customer?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Back */}
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Customers
          </button>

          {/* ── Customer Profile Card ── */}
          {customer && (
            <div className="glass-card overflow-hidden">
              {/* Top gradient banner */}
              <div className="h-20 bg-gradient-to-br from-teal-500 via-teal-600 to-teal-600 relative">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }} />
              </div>

              <div className="px-4 sm:px-6 pb-5 -mt-8 relative">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div className="flex items-end gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-xl border-4 border-background flex-shrink-0">
                      {initials}
                    </div>
                    <div className="pb-1">
                      <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{customer.name}</h1>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />{customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" />{customer.email}
                          </span>
                        )}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[customer.status] || ''}`}>
                          {customer.status?.toLowerCase()}
                        </span>
                        {customer.status === 'OVERDUE' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => router.push(`/dashboard/shop_owner/customers/${customerId}/add-credit`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all"
                    >
                      <IndianRupee className="w-3.5 h-3.5" /> Add Credit
                    </button>
                    {customer.creditBalance > 0 && (
                      <button onClick={() => setShowPayModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Record Payment
                      </button>
                    )}
                    <button onClick={() => router.push(`/dashboard/shop_owner/customers/${customerId}/history`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/15 text-teal-600 text-xs font-bold border border-teal-500/20 transition-all">
                      <History className="w-3.5 h-3.5" /> Full History
                    </button>
                    <button onClick={() => setShowDelete(true)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/15 transition-all"
                      title="Delete customer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Extra info */}
                {(customer.address || customer.workplace) && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/40">
                    {customer.address && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />{customer.address}
                      </span>
                    )}
                    {customer.workplace && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3" />{customer.workplace}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Stats Cards ── */}
          {customer && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Total Credit', value: `₹${customer.totalCredit?.toLocaleString()}`, color: 'text-red-500', bg: 'from-red-500 to-teal-600', icon: TrendingDown, sub: `${transactions.length} transactions` },
                { label: 'Total Paid', value: `₹${customer.totalPaid?.toLocaleString()}`, color: 'text-teal-600', bg: 'from-teal-500 to-teal-600', icon: TrendingUp, sub: `${payments.length} payments` },
                { label: 'Outstanding', value: `₹${customer.creditBalance?.toLocaleString()}`, color: customer.creditBalance > 0 ? 'text-teal-600' : 'text-teal-600', bg: customer.creditBalance > 0 ? 'from-teal-500 to-teal-600' : 'from-teal-500 to-teal-600', icon: IndianRupee, sub: customer.creditBalance > 0 ? 'Needs payment' : 'Fully clear' },
              ].map((s, i) => (
                <div key={i}
                  className="glass-card p-3 sm:p-4">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center shadow-md mb-2`}>
                    <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className={`text-base sm:text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">{s.label}</p>
                  <p className="text-[9px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Tabs & Export ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-1.5">
              {(['overview', 'credit', 'payment'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all ${activeTab === t ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25' : 'bg-background/50 border border-border text-muted-foreground hover:bg-muted'}`}>
                  {t === 'overview' ? '📊 Overview' : t === 'credit' ? '↑ Credits' : '↓ Payments'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={fetchAll} disabled={isLoading} title="Refresh"
                className="p-2 rounded-xl border border-border bg-background/50 hover:bg-muted transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={exportExcel} disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button onClick={exportPDF} disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-500/20">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Mini progress bar */}
              {customer && customer.totalCredit > 0 && (
                <div className="glass-card p-4">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-muted-foreground">Repayment Progress</span>
                    <span className="text-teal-600">{((customer.totalPaid / customer.totalCredit) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                     
                     
                     
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1.5 text-muted-foreground">
                    <span>Paid: ₹{customer.totalPaid?.toLocaleString()}</span>
                    <span>Remaining: ₹{customer.creditBalance?.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="glass-card p-4">
                <h3 className="font-black text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-500" /> Recent Activity
                </h3>
                {[...transactions.map(t => ({ ...t, _type: 'credit' as const })),
                  ...payments.map(p => ({ ...p, _type: 'payment' as const }))].
                  sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5).map((item, i) => (
                    <div key={item.id} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-border/30' : ''}`}>
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${item._type === 'credit' ? 'from-red-500 to-teal-600' : 'from-teal-500 to-teal-600'}`}>
                        {item._type === 'credit' ? <TrendingDown className="w-3.5 h-3.5 text-white" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">{item._type === 'credit' ? 'Credit Given' : 'Payment Received'}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtRelative(item.date)}</p>
                      </div>
                      <p className={`text-sm font-black flex-shrink-0 ${item._type === 'credit' ? 'text-red-500' : 'text-teal-600'}`}>
                        {item._type === 'credit' ? '+' : '-'}₹{(item._type === 'credit' ? (item as any).totalAmount : (item as any).amount).toLocaleString()}
                      </p>
                    </div>
                  ))}
                {transactions.length === 0 && payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No activity yet</div>
                )}
              </div>
            </div>
          )}

          {/* ── Credit Tab ── */}
          {activeTab === 'credit' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No credit transactions</p>
                </div>
              ) : transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => (
                <div key={tx.id}
                  className="glass-card p-3 sm:p-4 cursor-pointer hover:border-red-500/20 transition-all"
                  onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground text-sm">Credit Sale</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${CREDIT_STATUS[tx.status] || ''}`}>{tx.status}</span>
                      </div>
                      {tx.items.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {tx.items.slice(0, 2).map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                          {tx.items.length > 2 && ` +${tx.items.length - 2} more`}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />{fmtDate(tx.date)}
                        <span>·</span><Clock className="w-2.5 h-2.5" />{fmtTime(tx.date)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-red-500 text-base">+₹{tx.totalAmount.toLocaleString()}</p>
                      {tx.balance > 0 && <p className="text-[10px] text-muted-foreground">Bal: ₹{tx.balance.toLocaleString()}</p>}
                    </div>
                    <div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                  
                    {expandedId === tx.id && (
                      <div
                        className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                        {tx.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs p-2 rounded-lg bg-background/50">
                            <span className="text-foreground font-medium">{it.productName} × {it.quantity}</span>
                            <span className="font-bold text-foreground">₹{it.subtotal.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-black pt-1 border-t border-border/30">
                          <span>Total</span>
                          <span className="text-red-500">₹{tx.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  
                </div>
              ))}
            </div>
          )}

          {/* ── Payment Tab ── */}
          {activeTab === 'payment' && (
            <div className="space-y-2">
              {payments.length === 0 ? (
                <div className="text-center py-16">
                  <CreditCard className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No payments recorded</p>
                </div>
              ) : payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((pay, i) => (
                <div key={pay.id}
                  className="glass-card p-3 sm:p-4 hover:border-teal-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground text-sm">Payment Received</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                          {pay.paymentMethod?.replace('_', ' ')}
                        </span>
                      </div>
                      {pay.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{pay.notes}</p>}
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />{fmtDate(pay.date)}
                        <span>·</span><Clock className="w-2.5 h-2.5" />{fmtTime(pay.date)}
                      </p>
                    </div>
                    <p className="font-black text-teal-600 text-base flex-shrink-0">-₹{pay.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── Record Payment Modal ── */}
        
          {showPayModal && customer && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              onClick={() => setShowPayModal(false)}>
              <div
                className="glass-card w-full max-w-md"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-black text-foreground">Record Payment</h2>
                    <p className="text-sm text-muted-foreground">From: <strong>{customer.name}</strong></p>
                  </div>
                  <button onClick={() => setShowPayModal(false)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 mb-5">
                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-black text-teal-600">₹{customer.creditBalance.toLocaleString()}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                      <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                        max={customer.creditBalance} placeholder="0"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-border bg-background/50 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['CASH','UPI','CARD','BANK_TRANSFER'] as const).map(m => (
                        <button key={m} onClick={() => setPayMethod(m)}
                          className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${payMethod === m ? 'bg-teal-500 text-white border-teal-500' : 'border-border text-muted-foreground hover:border-teal-500/30'}`}>
                          {m.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-1.5 block">Notes (optional)</label>
                    <input value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Notes..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                  </div>
                  <button onClick={handleRecordPayment} disabled={!payAmount || submittingPay}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-black shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
                    {submittingPay ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Confirm Payment</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        

        {/* ── Delete Confirm Modal ── */}
        
          {showDelete && customer && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              onClick={() => setShowDelete(false)}>
              <div
                className="glass-card w-full max-w-sm"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">Delete Customer?</h2>
                    <p className="text-sm text-muted-foreground">This cannot be undone</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  All data for <strong className="text-foreground">{customer.name}</strong> will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDelete(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border font-bold hover:bg-muted">Cancel</button>
                  <button onClick={handleDeleteCustomer} disabled={deletingCust}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    {deletingCust ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        

      </DashboardLayout>
    </ProtectedRoute>
  );
}
