'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Search, ShoppingCart, Users, X, Minus, Plus, CheckCircle2, Loader2, 
  IndianRupee, UserCircle2, ArrowLeft, Package
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type CartItem = { productId: string; quantity: number; unitPrice: number; name: string; unit: string };

export default function ShopOwnerCart() {
  const router = useRouter();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingSale, setSubmittingSale] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const getCartKey = () => `shopOwnerCart_${user?.id || 'guest'}`;

  useEffect(() => {
    // Load cart from localStorage - shop owner specific
    if (!user?.id) return;
    
    // Clear old generic cart key if it exists
    const oldCart = localStorage.getItem('shopOwnerCart');
    if (oldCart) {
      localStorage.removeItem('shopOwnerCart');
      console.log('Cleared old generic cart data from cart page');
    }
    
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        console.log('Loaded cart in cart page:', parsedCart);
      } catch (e) {
        console.error('Failed to parse cart:', e);
        localStorage.removeItem(cartKey);
      }
    }
    
    fetchCustomers();
  }, [user?.id]);

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await shopOwnerAPI.getCustomers({ page: 1, limit: 100 });
      setCustomers(res.data.customers || []);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load customers', variant: 'destructive' });
    } finally { 
      setCustomersLoading(false); 
    }
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(c => c.productId !== productId);
    setCart(newCart);
    localStorage.setItem(getCartKey(), JSON.stringify(newCart));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const newCart = cart.map(c => 
      c.productId === productId ? { ...c, quantity: Math.max(1, quantity) } : c
    );
    setCart(newCart);
    localStorage.setItem(getCartKey(), JSON.stringify(newCart));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.quantity * c.unitPrice), 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleSubmitCredit = async () => {
    if (!selectedCustomer || cart.length === 0) return;
    setSubmittingSale(true);
    try {
      await shopOwnerAPI.recordCreditSale({
        customerId: selectedCustomer,
        items: cart.map(c => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
        totalAmount: cartTotal,
        notes: notes || undefined,
      });
      toast({ 
        title: '✅ Credit Added!', 
        description: `₹${cartTotal.toFixed(2)} udhar created successfully` 
      });
      
      // Clear cart
      setCart([]);
      setNotes('');
      const targetCustomerId = selectedCustomer;
      setSelectedCustomer('');
      localStorage.removeItem(getCartKey());
      
      // Redirect to selected customer's history so the new credit is visible immediately
      setTimeout(() => router.push(`/dashboard/shop_owner/customers/${targetCustomerId}/history?refresh=${Date.now()}`), 1200);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Failed to record credit sale', 
        variant: 'destructive' 
      });
    } finally {
      setSubmittingSale(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    !customerSearch || 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone?.includes(customerSearch)
  );
  
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomer);

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
          
          {/* Header */}
          <div
           
           
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/shop_owner/products')}
                className="w-10 h-10 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Credit Cart</h1>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} • ₹{cartTotal.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-primary dark:text-indigo-400" />
            </div>
          </div>

          {cart.length === 0 ? (
            /* Empty Cart State */
            <div
             
             
              className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center py-12 sm:py-16 gap-3 sm:gap-4"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted/50 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">Cart is Empty</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-sm px-4">
                Add products from the products page to create a credit sale
              </p>
              <button
                onClick={() => router.push('/dashboard/shop_owner/products')}
                className="mt-2 sm:mt-4 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* LEFT: Cart Items */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-3 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-black text-foreground mb-3 sm:mb-4">Selected Items</h2>
                  <div className="space-y-2 sm:space-y-3">
                    
                      {cart.map(item => (
                        <div
                          key={item.productId}
                         
                         
                         
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-card text-card-foreground border border-border shadow-sm border border-border/60 hover:border-indigo-500/20 dark:border-indigo-400/20 transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm sm:text-base font-bold text-foreground truncate">{item.name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                ₹{item.unitPrice.toFixed(2)} per {item.unit}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-background text-foreground transition-colors"
                              >
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <span className="text-base sm:text-lg font-black w-8 sm:w-12 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary transition-colors"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                              <p className="text-base sm:text-xl font-black text-primary dark:text-indigo-400 min-w-[70px] sm:min-w-[80px] text-right">
                                ₹{(item.unitPrice * item.quantity).toFixed(2)}
                              </p>
                              <button 
                                onClick={() => removeFromCart(item.productId)} 
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                  </div>
                </div>
              </div>

              {/* RIGHT: Customer Selection & Submit */}
              <div className="space-y-3 sm:space-y-4">
                
                {/* Customer Selector Card */}
                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-3 sm:p-6">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary dark:text-indigo-400" />
                    <h2 className="text-base sm:text-lg font-black text-foreground">Select Customer</h2>
                  </div>

                  {customersLoading ? (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground p-3 border rounded-xl bg-card text-card-foreground border border-border shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading customers...
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          placeholder="Search customer..."
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50"
                        />
                      </div>
                      
                      <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2 rounded-xl border border-border bg-background/30 p-2">
                        {filteredCustomers.length === 0 ? (
                          <p className="text-center text-xs sm:text-sm text-muted-foreground py-4">No customers found</p>
                        ) : filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCustomer(selectedCustomer === c.id ? '' : c.id)}
                            className={`w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-left transition-all ${
                              selectedCustomer === c.id 
                                ? 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors border border-indigo-500/20 dark:border-indigo-400/20' 
                                : 'hover:bg-muted/60'
                            }`}
                          >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white text-xs sm:text-sm font-black flex-shrink-0">
                              {c.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-foreground truncate">{c.name}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Balance: ₹{c.creditBalance?.toFixed(2)}</p>
                            </div>
                            {selectedCustomer === c.id && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary dark:text-indigo-400 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>

                      {selectedCustomerObj && (
                        <div className="mt-3 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors border border-indigo-500/20 dark:border-indigo-400/20">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white text-xs sm:text-sm font-black">
                            {selectedCustomerObj.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-foreground truncate">{selectedCustomerObj.name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Outstanding: ₹{selectedCustomerObj.creditBalance?.toFixed(2)}</p>
                          </div>
                          <button onClick={() => setSelectedCustomer('')} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Notes Card */}
                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-3 sm:p-6">
                  <label className="text-xs sm:text-sm font-bold text-muted-foreground mb-2 block">Notes (optional)</label>
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Monthly purchase..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50"
                  />
                </div>

                {/* Total & Submit Card */}
                <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all space-y-3 sm:space-y-4 p-4 sm:p-6">
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-xs sm:text-sm text-muted-foreground font-semibold">Total Credit</span>
                    <span className="text-xl sm:text-2xl font-black text-red-500">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  
                  {!selectedCustomer && (
                    <p className="text-[10px] sm:text-xs text-primary dark:text-indigo-400 font-semibold flex items-center gap-1.5 sm:gap-2">
                      <UserCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Please select a customer above
                    </p>
                  )}
                  
                  <button
                    onClick={handleSubmitCredit}
                    disabled={!selectedCustomer || submittingSale}
                    className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-500/20 dark:shadow-indigo-400/20 flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all active:scale-98"
                  >
                    {submittingSale ? (
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    ) : (
                      <>
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Add to Credit</span>
                        {selectedCustomerObj && <span className="hidden sm:inline text-teal-200 text-xs sm:text-sm">→ {selectedCustomerObj.name}</span>}
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

