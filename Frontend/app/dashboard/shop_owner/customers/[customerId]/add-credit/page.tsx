'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Search, Package, CheckSquare, Square, Minus, Plus, IndianRupee,
  ShoppingBag, Loader2, X, ChevronLeft, CheckCircle2, Trash2,
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

type Product = {
  id: string; name: string; unit: string; pricePerUnit: number;
  category?: string; stockStatus: string;
};
type CartItem = {
  productId: string; quantity: number; unitPrice: number; name: string; unit: string;
};
type CustomerInfo = {
  id: string; name: string; phone: string; creditBalance: number;
};

const categoryColors: Record<string, string> = {
  Grains: 'from-teal-500 to-teal-600',
  Pulses: 'from-teal-500 to-teal-600',
  Sweeteners: 'from-teal-500 to-teal-600',
  Oils: 'from-teal-500 to-teal-600',
  Spices: 'from-red-500 to-teal-600',
  Vegetables: 'from-teal-500 to-teal-600',
  General: 'from-slate-400 to-slate-600',
};

export default function AddCreditPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          shopOwnerAPI.getCustomerHistory(customerId, {}),
          shopOwnerAPI.getProducts({ limit: 500 }),
        ]);
        setCustomer(custRes.data.customer);
        setProducts((prodRes.data.products || []).filter((p: Product) => p.stockStatus === 'AVAILABLE'));
      } catch (e: any) {
        toast({ title: 'Error', description: e.response?.data?.message || 'Failed to load', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  const toggleProduct = (p: Product) => {
    setCart(prev => {
      const exists = prev.find(c => c.productId === p.id);
      if (exists) return prev.filter(c => c.productId !== p.id);
      return [...prev, { productId: p.id, quantity: 1, unitPrice: p.pricePerUnit, name: p.name, unit: p.unit }];
    });
  };

  const updateQty = (productId: string, delta: number) =>
    setCart(prev => prev.map(c => c.productId !== productId ? c : { ...c, quantity: Math.max(1, c.quantity + delta) }));

  const removeFromCart = (productId: string) =>
    setCart(prev => prev.filter(c => c.productId !== productId));

  const cartTotal = cart.reduce((s, c) => s + c.quantity * c.unitPrice, 0);

  const handleSubmit = async () => {
    if (!customer || cart.length === 0) return;
    setSubmitting(true);
    try {
      await shopOwnerAPI.recordCreditSale({
        customerId: customer.id,
        items: cart.map(c => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
        totalAmount: cartTotal,
        notes: notes || undefined,
      });
      toast({
        title: `✅ ${t('add_credit_page.success_title', 'Credit Added!')}`,
        description: t('add_credit_page.success_added', '₹{{amount}} added to {{name}}', { amount: cartTotal.toLocaleString(), name: customer.name }),
      });
      router.push(`/dashboard/shop_owner/customers/${customer.id}/history?refresh=${Date.now()}`);
    } catch (e: any) {
      toast({ title: t('common.error', 'Error'), description: e.response?.data?.message || t('common.failed', 'Failed'), variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  // All categories derived from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  const filteredProducts = products.filter(p => {
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = selectedCategory === 'All' || (p.category || 'General') === selectedCategory;
    return matchSearch && matchCat;
  });

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="SHOP_OWNER">
        <DashboardLayout>
          <div className="flex items-center justify-center h-[calc(100vh-120px)]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary dark:text-indigo-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">{t('add_credit_page.loading_products', 'Loading products...')}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        {/* Page-level header */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {t('add_credit_page.back')}
          </button>
          {customer && (
            <>
              <span className="text-muted-foreground">/</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white text-xs font-black">
                  {customer.name[0]}
                </div>
                <span className="font-bold text-foreground text-sm">{customer.name}</span>
                <span className="text-muted-foreground text-sm">—</span>
                <span className="font-bold text-primary dark:text-indigo-400 text-sm">{t('add_credit_page.add_credit')}</span>
              </div>
            </>
          )}
        </div>

        {/* Fixed top bar: Search + Add Product + Categories */}
        {step === 'pick' && (
          <div className="flex flex-col gap-2.5 mb-3 bg-background/95 backdrop-blur-sm sticky top-0 z-10 pb-3 border-b border-border/30">
            {/* Search bar with Add Product button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder={t('add_credit_page.search_placeholder')}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50 shadow-sm"
                />
                {productSearch && (
                  <button onClick={() => setProductSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => router.push('/dashboard/shop_owner/products')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-sm shadow-md hover:from-indigo-600 hover:to-teal-700 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                {t('add_credit_page.add_product')}
              </button>
            </div>
            {/* Category chips */}
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${selectedCategory === cat
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Split layout: products left, cart right */}
        <div className="flex gap-3" style={{ height: step === 'pick' ? 'calc(100vh - 250px)' : 'calc(100vh - 160px)' }}>
          {/* ── LEFT: Product selection ── */}
          <div className="flex-1 min-w-0">
            {step === 'pick' ? (
              /* Scrollable product grid - hidden scrollbar */
              <div className="h-full overflow-y-auto scrollbar-hide">
                <style jsx>{`
                  .scrollbar-hide::-webkit-scrollbar { display: none; }
                  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Package className="w-12 h-12 text-muted-foreground/20 mb-2" />
                    <p className="text-muted-foreground text-sm font-medium">{t('add_credit_page.no_products')}</p>
                    {productSearch && (
                      <button onClick={() => setProductSearch('')} className="mt-2 text-xs text-primary dark:text-indigo-400 font-bold hover:underline">
                        {t('add_credit_page.clear_search')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-4">
                    {filteredProducts.map((p, idx) => {
                      const inCart = cart.find(c => c.productId === p.id);
                      const gradient = categoryColors[p.category || 'General'];
                      return (
                        <div
                          key={p.id}
                         
                         
                         
                          onClick={() => toggleProduct(p)}
                          className={`relative p-2 rounded-lg border cursor-pointer transition-all select-none ${inCart
                            ? 'border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors shadow-md ring-1 ring-indigo-500/20 dark:ring-indigo-400/20'
                            : 'border-border/50 bg-card text-card-foreground border border-border shadow-sm hover:border-indigo-500/20 dark:border-indigo-400/20 hover:shadow-sm'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`absolute top-1.5 right-1.5 ${inCart ? 'text-primary dark:text-indigo-400' : 'text-muted-foreground/20'}`}>
                            {inCart ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          </div>

                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-1.5 shadow-sm`}>
                            <Package className="w-4 h-4 text-white" />
                          </div>

                          <p className="font-bold text-foreground text-[11px] leading-tight line-clamp-2 pr-4">{p.name}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{p.unit}</p>
                          <p className="font-black text-primary dark:text-indigo-400 text-xs mt-1">₹{p.pricePerUnit}</p>

                          {/* Qty controls */}
                          {inCart && (
                            <div className="flex items-center gap-0.5 mt-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => updateQty(p.id, -1)}
                                className="w-5 h-5 rounded-md bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="flex-1 text-center font-black text-xs text-foreground">{inCart.quantity}</span>
                              <button
                                onClick={() => updateQty(p.id, 1)}
                                className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Confirm step — show selected items summary on left - hidden scrollbar */
              <div className="h-full overflow-y-auto scrollbar-hide">
                <style jsx>{`
                  .scrollbar-hide::-webkit-scrollbar { display: none; }
                  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                <div className="space-y-2 pb-4">
                  <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary dark:text-indigo-400" />
                    {t('add_credit_page.review_order')}
                  </h2>
                  {cart.map((item, i) => (
                    <div
                      key={item.productId}
                     
                     
                     
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-card text-card-foreground border border-border shadow-sm border border-border/50 hover:border-indigo-500/20 dark:border-indigo-400/20 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${categoryColors[products.find(p => p.id === item.productId)?.category || 'General']} flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.unit} × {item.quantity} @ ₹{item.unitPrice}</p>
                      </div>
                      <p className="font-black text-foreground text-sm flex-shrink-0">₹{(item.unitPrice * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}

                  {/* Notes */}
                  <div className="mt-4 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">{t('add_credit_page.notes_label')}</label>
                    <input
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder={t('add_credit_page.notes_placeholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Fixed Cart ── */}
          <div className="w-[260px] xl:w-[300px] flex-shrink-0">
            <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all h-full flex flex-col sticky top-0 p-3 rounded-xl border border-border/50 shadow-lg bg-background/95 backdrop-blur-sm">
              {/* Cart header */}
              <div className="flex items-center justify-between mb-2.5 flex-shrink-0">
                <h3 className="font-black text-foreground text-sm flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary dark:text-indigo-400" />
                  {t('add_credit_page.cart')}
                  {cart.length > 0 && (
                    <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-black">
                      {cart.length}
                    </span>
                  )}
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-red-500 font-bold hover:text-red-600 flex items-center gap-0.5"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> {t('common.clear', 'Clear')}
                  </button>
                )}
              </div>

              {/* Customer badge */}
              {customer && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors border border-indigo-500/20 dark:border-indigo-400/20 mb-2.5 flex-shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                    {customer.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">{customer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t('customer_detail_page.balance_short', 'Bal')}: ₹{customer.creditBalance.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Cart items - hidden scrollbar */}
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                <style jsx>{`
                  .scrollbar-hide::-webkit-scrollbar { display: none; }
                  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground/20 mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">{t('add_credit_page.cart_empty')}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{t('add_credit_page.click_to_add')}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    
                      {cart.map(item => (
                        <div
                          key={item.productId}
                         
                         
                         
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-card text-card-foreground border border-border shadow-sm border border-border/40"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-[10px] truncate">{item.name}</p>
                            <p className="text-[9px] text-muted-foreground">₹{item.unitPrice} / {item.unit}</p>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => updateQty(item.productId, -1)}
                              className="w-4 h-4 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                            >
                              <Minus className="w-2 h-2" />
                            </button>
                            <span className="w-4 text-center font-black text-[10px]">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.productId, 1)}
                              className="w-4 h-4 rounded bg-primary text-white flex items-center justify-center hover:bg-primary transition-colors"
                            >
                              <Plus className="w-2 h-2" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="w-4 h-4 ml-0.5 rounded bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>
                        </div>
                      ))}
                    
                  </div>
                )}
              </div>

              {/* Cart footer */}
              <div className="mt-2.5 pt-2.5 border-t border-border/40 flex-shrink-0 space-y-2">
                {cart.length > 0 && (
                  <div className="space-y-1">
                    {/* Line items subtotal */}
                    {cart.map(item => (
                      <div key={item.productId} className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground truncate pr-1.5">{item.name} ×{item.quantity}</span>
                        <span className="font-bold text-foreground flex-shrink-0">₹{(item.unitPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-xs font-bold text-muted-foreground">{t('customer_detail_page.total_credit')}</span>
                      <span className="text-base font-black text-red-500">₹{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {step === 'pick' ? (
                  <button
                    onClick={() => { if (cart.length > 0) setStep('confirm'); }}
                    disabled={cart.length === 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 hover:from-indigo-600 hover:to-teal-700"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {t('add_credit_page.review_btn')} ({cart.length})
                  </button>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setStep('pick')}
                      className="w-full py-2 rounded-xl border border-border text-foreground font-bold hover:bg-muted transition-colors text-xs"
                    >
                      {t('add_credit_page.back_to_products')}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20 flex items-center justify-center gap-1.5 disabled:opacity-50 hover:from-indigo-600 hover:to-teal-700 transition-all"
                    >
                      {submitting
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><IndianRupee className="w-3.5 h-3.5" /> {t('add_credit_page.confirm_credit')}</>
                      }
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
