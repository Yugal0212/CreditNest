'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Search, Plus, Eye, Phone, IndianRupee, X, UserCircle2,
  Pencil, Trash2, Loader2, CheckCircle2,
  CreditCard, Upload, User, Mail, MapPin, Briefcase, AlertCircle
} from 'lucide-react';

import useSWR from 'swr';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

type Customer = {
  id: string; name: string; phone: string; email: string; avatar: string;
  address?: string; workplace?: string; totalCredit: number; totalPaid: number;
  creditBalance: number; status: 'ACTIVE' | 'OVERDUE' | 'CLEARED'; joinDate: string; lastPurchase?: string;
};

const statusColors = {
  ACTIVE: 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-400/20',
  OVERDUE: 'bg-red-500/10 text-red-500 border-red-500/20',
  CLEARED: 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-400/20',
} as const;

const gradients = ['from-teal-500 to-teal-600','from-teal-500 to-teal-600','from-teal-500 to-teal-600','from-teal-500 to-teal-600','from-teal-500 to-teal-600','from-teal-500 to-teal-600'];

export default function ShopOwnerCustomers() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation();
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', workplace: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // SWR Fetching
  const { data: swrData, mutate, isLoading: isSwrLoading } = useSWR(
    ['customers', page, statusFilter, debouncedSearch, language],
    async ([_, p, status, s]) => {
      const r = await shopOwnerAPI.getCustomers({ page: p, limit: 20, status: status || undefined, search: s?.trim() || undefined });
      return r.data;
    },
    { keepPreviousData: true }
  );

  const customers: Customer[] = swrData?.customers || [];
  const totalPages = swrData?.totalPages || 1;
  const isLoading = !swrData && isSwrLoading;

  const fetchCustomers = () => mutate();

  const openAddCredit = (customer: Customer) => {
    router.push(`/dashboard/shop_owner/customers/${customer.id}/add-credit`);
  };



  const handleRecordPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    setSubmittingPayment(true);
    
    // Optimistic Update
    const amount = parseFloat(paymentAmount);
    mutate(
      { ...swrData, customers: (swrData?.customers || []).map((c: Customer) => c.id === selectedCustomer.id ? { ...c, creditBalance: Math.max(0, c.creditBalance - amount) } : c) },
      false
    );

    try {
      await shopOwnerAPI.recordPayment({ customerId: selectedCustomer.id, amount, paymentMethod, notes: paymentNotes || undefined });
      toast({ title: '✅ Payment Recorded!', description: `₹${amount.toLocaleString()} from ${selectedCustomer.name}` });
      setShowPaymentModal(false); setPaymentAmount(''); setPaymentNotes('');
      mutate();
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed', variant: 'destructive' });
      mutate(); // Revert
    } finally { setSubmittingPayment(false); }
  };

  const handleDelete = async (customerId: string) => {
    // Optimistic Update
    mutate(
      { ...swrData, customers: (swrData?.customers || []).filter((c: Customer) => c.id !== customerId) },
      false
    );

    try {
      await shopOwnerAPI.deleteCustomer(customerId);
      toast({ title: 'Deleted', description: 'Customer deleted successfully' });
      setDeleteConfirmId(null);
      mutate();
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to delete', variant: 'destructive' });
      mutate(); // Revert
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ name: '', phone: '', email: '', address: '', workplace: '' });
    setPhotoFile(null); setAvatarPreview(null);
    setShowAddModal(true);
  };

  const openEditModal = (c: Customer) => {
    setIsEditing(true);
    setSelectedCustomer(c);
    setFormData({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', workplace: c.workplace || '' });
    setAvatarPreview(c.avatar); setPhotoFile(null);
    setShowAddModal(true);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCustomer(true);
    setUploadProgress(1); // Start progress bar
    try {
      const data = new FormData();
      data.append('name', formData.name); data.append('phone', formData.phone);
      data.append('email', formData.email);
      if (formData.address) data.append('address', formData.address);
      if (formData.workplace) data.append('workplace', formData.workplace);
      if (photoFile) data.append('photo', photoFile);

      const onProgress = (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      };

      if (isEditing && selectedCustomer) {
        // Optimistic Update
        mutate(
          { ...swrData, customers: (swrData?.customers || []).map((c: Customer) => c.id === selectedCustomer.id ? { ...c, ...formData } : c) },
          false
        );
        await shopOwnerAPI.updateCustomer(selectedCustomer.id, data, onProgress);
        toast({ title: 'Success', description: 'Customer updated' });
      } else {
        // Optimistic Update
        const tempId = Math.random().toString(36).substr(2, 9);
        const tempCustomer = { id: tempId, name: formData.name, phone: formData.phone, email: formData.email, address: formData.address, workplace: formData.workplace, status: 'ACTIVE', creditBalance: 0, totalCredit: 0, totalPaid: 0, joinDate: new Date().toISOString(), avatar: avatarPreview || '' };
        mutate(
          { ...swrData, customers: [tempCustomer, ...(swrData?.customers || [])] },
          false
        );
        await shopOwnerAPI.addCustomer(data, onProgress);
        toast({ title: 'Success', description: 'Customer added' });
      }
      setShowAddModal(false);
      mutate();

    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally { 
      setIsSubmittingCustomer(false); 
      setUploadProgress(0); // Reset progress bar
    }
  };

  const fmtDate = (d?: string) => {
    if (!d) return 'Never';
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };



  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{t('customers_page.title')}</h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{t('customers_page.subtitle')}</p>
            </div>
            <button onClick={openAddModal}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-teal-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all">
              <Plus className="w-4 h-4" /> {t('customers_page.add_customer')}
            </button>
          </div>

          {/* Search & Filters */}
          <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('customers_page.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50">
                <option value="">{t('customers_page.all_status')}</option>
                <option value="ACTIVE">{t('customers_page.status_active')}</option>
                <option value="OVERDUE">{t('customers_page.status_overdue')}</option>
                <option value="CLEARED">{t('customers_page.status_cleared')}</option>
              </select>
            </div>
          </div>

          {/* Customer List */}
          {isLoading ? (
            <div className="pt-2">
              <TableSkeleton columns={4} rows={5} />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-20">
              <UserCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground font-medium">{t('customers_page.no_customers')}</p>
              <button onClick={openAddModal} className="mt-4 mx-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors transition">
                <Plus className="w-4 h-4" /> {t('customers_page.add_first_customer')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer, i) => (
                <div key={customer.id}
                 
                  className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all hover:border-indigo-500/20 dark:border-indigo-400/20 transition-all group p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white text-base font-black shadow-lg flex-shrink-0 overflow-hidden relative`}>
                      {customer.avatar ? (
                        <Image src={customer.avatar} alt={customer.name} fill className="object-cover" sizes="48px" unoptimized />
                      ) : (
                        customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-base sm:text-lg text-foreground">{customer.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border capitalize ${statusColors[customer.status]}`}>
                          {customer.status === 'ACTIVE' ? t('customers_page.status_active') : customer.status === 'OVERDUE' ? t('customers_page.status_overdue') : t('customers_page.status_cleared')}
                        </span>
                        {customer.status === 'OVERDUE' && (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />{customer.phone}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-0.5">{t('history.last_label', 'Last')}: {fmtDate(customer.lastPurchase)}</p>
                    </div>

                    {/* Balance */}
                    <div className="flex-shrink-0 text-right mr-1 hidden sm:block">
                      <p className={`text-base font-black ${customer.creditBalance > 0 ? 'text-red-500' : 'text-primary dark:text-indigo-400'}`}>
                        ₹{customer.creditBalance.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t('customers_page.balance')}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap mt-3 sm:mt-0">
                      {/* View History */}
                      <button
                        onClick={() => router.push(`/dashboard/shop_owner/customers/${customer.id}`)}
                        title={t('customer_detail_page.view_details_tooltip', 'View Customer Details')}
                        className="w-8 h-8 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 flex items-center justify-center transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Add Credit */}
                      <button
                        onClick={() => openAddCredit(customer)}
                        title={t('add_credit_page.add_credit')}
                        className="w-8 h-8 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 flex items-center justify-center transition-colors"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                      </button>

                      {/* Record Payment - only if has balance */}
                      {customer.creditBalance > 0 && (
                        <button
                          onClick={() => { setSelectedCustomer(customer); setShowPaymentModal(true); }}
                          title={t('customers_page.record_payment')}
                          className="w-8 h-8 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 flex items-center justify-center transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(customer)}
                        title={t('categories_page.edit_tooltip')}
                        className="w-8 h-8 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 flex items-center justify-center transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(customer.id)}
                        title={t('categories_page.delete_tooltip')}
                        className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile balance row */}
                  <div className="sm:hidden mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                    <p className="text-sm font-bold text-muted-foreground">{t('customers_page.outstanding_balance')}</p>
                    <p className={`text-base font-black ${customer.creditBalance > 0 ? 'text-red-500' : 'text-primary dark:text-indigo-400'}`}>
                      ₹{customer.creditBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${page === p ? 'bg-primary text-white' : 'bg-card text-card-foreground border border-border shadow-sm text-muted-foreground hover:bg-muted'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        
          {deleteConfirmId && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              onClick={() => setDeleteConfirmId(null)}>
              <div
                className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">{t('customers_page.delete_title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('customers_page.delete_subtitle')}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  {t('customers_page.delete_warning', { name: customers.find(c => c.id === deleteConfirmId)?.name })}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-bold hover:bg-muted transition-colors">
                    {t('common.cancel')}
                  </button>
                  <button onClick={() => handleDelete(deleteConfirmId!)}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">
                    {t('common.delete', 'Delete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        



        {/* Payment Modal */}
          {showPaymentModal && selectedCustomer && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              onClick={() => setShowPaymentModal(false)}>
              <div
                className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all w-full max-w-md"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-black text-foreground">{t('customers_page.record_payment')}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{t('customer_detail_page.from_label', 'From')}: {selectedCustomer.name}</p>
                  </div>
                  <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors border border-indigo-500/20 dark:border-indigo-400/20 mb-5">
                  <p className="text-xs text-muted-foreground">{t('customers_page.outstanding_balance')}</p>
                  <p className="text-2xl font-black text-primary dark:text-indigo-400">₹{selectedCustomer.creditBalance.toLocaleString()}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-1.5 block">{t('customer_detail_page.amount_label', 'Amount')} *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                      <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                        max={selectedCustomer.creditBalance} placeholder="0"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-1.5 block">{t('customer_detail_page.payment_method_label', 'Payment Method')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'] as const).map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)}
                          className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${paymentMethod === m ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-indigo-500/20 dark:border-indigo-400/20'}`}>
                          {m.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-muted-foreground mb-1.5 block">{t('customers_page.notes_optional')}</label>
                    <input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Notes..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                  </div>
                  <button onClick={handleRecordPayment} disabled={!paymentAmount || submittingPayment}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-black shadow-xl shadow-indigo-500/20 dark:shadow-indigo-400/20 flex items-center justify-center gap-2 disabled:opacity-50">
                    {submittingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> {t('customers_page.confirm_payment')}</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        
 
        {/* Add/Edit Customer Modal */}
        
          {showAddModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              onClick={() => setShowAddModal(false)}>
              <div
               
                className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-foreground">{isEditing ? t('categories_page.edit_tooltip') : t('customers_page.add_customer')}</h2>
                    <p className="text-sm text-muted-foreground">{isEditing ? t('customer_detail_page.update_details_sub', 'Update customer details') : t('customer_detail_page.add_customer_sub', 'Add a new customer to your shop')}</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
 
                <form onSubmit={handleCustomerSubmit} className="space-y-4">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center border-4 border-background shadow-xl relative">
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        {avatarPreview ? <Image src={avatarPreview} alt="Preview" fill className="object-cover" sizes="80px" unoptimized /> : <User className="w-8 h-8 text-white" />}
                      </div>
                      <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer hover:bg-teal-700 shadow-lg">
                        <Upload className="w-3.5 h-3.5" />
                        <input 
                          type="file" 
                          accept="image/jpeg,image/jpg,image/png,image/webp" 
                          onChange={e => { 
                            const f = e.target.files?.[0]; 
                            if (f) {
                              const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                              if (!allowedMimeTypes.includes(f.type.toLowerCase())) {
                                toast({
                                  title: 'Invalid File Type',
                                  description: 'Only JPG, JPEG, PNG, and WEBP formats are allowed.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              if (f.size > 5 * 1024 * 1024) {
                                toast({
                                  title: 'File Too Large',
                                  description: 'File size exceeds the 5MB limit.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              setPhotoFile(f); 
                              const r = new FileReader(); 
                              r.onloadend = () => setAvatarPreview(r.result as string); 
                              r.readAsDataURL(f); 
                            }
                          }} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                    {uploadProgress > 0 && (
                      <div className="w-full max-w-[200px] space-y-1 mt-2">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300 ease-out" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><User className="w-3 h-3" /> {t('auth.owner_name')} *</label>
                      <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Customer name"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" /> {t('auth.phone_number')} *</label>
                      <input 
                        required 
                        minLength={10}
                        maxLength={10} 
                        value={formData.phone} 
                        onChange={e => {
                          // Remove non-digits and limit to 10 digits
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, phone: digitsOnly });
                        }} 
                        placeholder="10-digit number"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" /> {t('auth.email_address')} *</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email address"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> {t('customer_detail_page.workplace_label', 'Workplace')}</label>
                      <input value={formData.workplace} onChange={e => setFormData({ ...formData, workplace: e.target.value })} placeholder="Workplace"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {t('auth.shop_address')}</label>
                      <textarea rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Address"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50 resize-none" />
                    </div>
                  </div>
 
                  <button type="submit" disabled={isSubmittingCustomer}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold shadow-xl shadow-indigo-500/20 dark:shadow-indigo-400/20 flex justify-center items-center gap-2 disabled:opacity-50">
                    {isSubmittingCustomer ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? t('customer_detail_page.update_customer_btn', 'Update Customer') : t('customers_page.add_customer'))}
                  </button>
                </form>
              </div>
            </div>
          )}
        

      </DashboardLayout>
    </ProtectedRoute>
  );
}

