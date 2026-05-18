'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Search, Package, Plus, Minus, CheckSquare, Square, Send,
  CheckCircle2, ShoppingBag, X, ChevronLeft, Loader2, RefreshCw,
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { customerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Product = {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  category: string;
  stockStatus: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  description?: string;
};

type CartItem = { productId: string; quantity: number; name: string; unit: string; price: number };

const categoryColors: Record<string, string> = {
  Grains: 'from-teal-500 to-teal-600',
  Pulses: 'from-teal-500 to-teal-600',
  Sweeteners: 'from-teal-500 to-teal-600',
  Oils: 'from-teal-500 to-teal-600',
  Spices: 'from-red-500 to-teal-600',
  Vegetables: 'from-teal-500 to-teal-600',
  General: 'from-slate-400 to-slate-600',
};

export default function CustomerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await customerAPI.getProducts();
      setProducts(res.data.products || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const getCartItem = (id: string) => cart.find(c => c.productId === id);

  const toggleItem = (p: Product) => {
    if (p.stockStatus !== 'AVAILABLE') return;
    setCart(prev => {
      const exists = prev.find(c => c.productId === p.id);
      if (exists) return prev.filter(c => c.productId !== p.id);
      return [...prev, { productId: p.id, quantity: 1, name: p.name, unit: p.unit, price: p.pricePerUnit }];
    });
  };

  const adjustQty = (productId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCart(prev => prev.map(c => {
      if (c.productId !== productId) return c;
      const nq = c.quantity + delta;
      if (nq <= 0) return c; // Keep minimum 1 via toggleItem
      return { ...c, quantity: nq };
    }));
  };

  const removeItem = (productId: string) => setCart(prev => prev.filter(c => c.productId !== productId));

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSendRequest = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart first',
        variant: 'destructive',
      });
      return;
    }

    // Check authentication
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      console.error('No auth token found');
      toast({
        title: '❌ Not Authenticated',
        description: 'Please log in again',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      console.error('No user data found');
      toast({
        title: '❌ Authentication Error',
        description: 'User data not loaded. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Sending request with cart:', cart);
    console.log('User:', user);
    
    setSending(true);
    try {
      const requestData = {
        items: cart.map(c => ({ 
          productId: c.productId, 
          quantity: c.quantity 
        })),
        notes: 'Customer order request',
      };
      
      console.log('Request payload:', requestData);
      
      const response = await customerAPI.requestOrder(requestData);
      
      console.log('Request sent successfully:', response.data);
      
      toast({
        title: '✅ Request Sent!',
        description: `Your request for ${cart.length} items has been sent to the shop owner`,
      });
      
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setCart([]);
        setShowCart(false);
      }, 4000);
    } catch (error: any) {
      console.error('Error sending request:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Could not send request. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.message || 'Access denied. Please contact support.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: '❌ Request Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div
           
           
            className="flex items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Shop Products</h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Tick items you want and send a request</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchProducts} className="w-9 h-9 rounded-xl border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              {cart.length > 0 && !showCart && (
                <button
                 
                 
                  onClick={() => setShowCart(true)}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20"
                >
                  <ShoppingBag className="w-4 h-4" />
                  My Request
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                    {cart.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          {!showCart && (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50 transition"
              />
            </div>
          )}

          
            {!showCart ? (
              <div key="grid">
                {/* Info Banner */}
                <div className="p-4 rounded-2xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors border border-indigo-500/20 dark:border-indigo-400/20 flex items-center gap-3 mb-4">
                  <Package className="w-5 h-5 text-primary dark:text-indigo-400 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">Tick the products</span> you need and set quantities, then press{' '}
                    <span className="font-bold text-primary dark:text-primary dark:text-indigo-400">Send Request</span> to notify the shop owner. Items will be added to your credit after approval.
                  </p>
                </div>

                {/* Products */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary dark:text-indigo-400" /></div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No products available from your shop yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((p, i) => {
                      const cartItem = getCartItem(p.id);
                      const selected = !!cartItem;
                      const unavailable = p.stockStatus !== 'AVAILABLE';
                      return (
                        <div
                          key={p.id}
                         
                         
                         
                          className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${unavailable
                            ? 'opacity-50 cursor-not-allowed border-border/30 bg-muted/20'
                            : selected
                              ? 'border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20'
                              : 'border-border/50 bg-card text-card-foreground border border-border shadow-sm dark:bg-white/5 hover:border-indigo-500/20 dark:border-indigo-400/20 hover:shadow-md'
                          }`}
                          onClick={() => toggleItem(p)}
                        >
                          {/* Checkbox */}
                          <div className={`absolute top-3 right-3 transition-colors ${selected ? 'text-primary dark:text-indigo-400' : 'text-muted-foreground/40'}`}>
                            {selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </div>

                          {/* Out of stock */}
                          {unavailable && (
                            <span className="absolute top-3 left-3 text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                              {p.stockStatus.replace('_', ' ')}
                            </span>
                          )}

                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${categoryColors[p.category || 'General']} flex items-center justify-center mb-3 shadow-md`}>
                            <Package className="w-6 h-6 text-white" />
                          </div>

                          <p className="font-black text-foreground leading-tight">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.unit} · {p.category}</p>
                          <p className="text-lg font-black text-primary dark:text-primary dark:text-indigo-400 mt-2">₹{p.pricePerUnit}</p>

                          {/* Qty controls */}
                          {selected && !unavailable && (
                            <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={e => { if (cartItem!.quantity <= 1) { removeItem(p.id); } else adjustQty(p.id, -1, e); }}
                                className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="flex-1 text-center font-black text-foreground text-lg">{cartItem!.quantity}</span>
                              <button
                                onClick={e => adjustQty(p.id, 1, e)}
                                className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Floating send button */}
                
                  {cart.length > 0 && (
                    <div
                     
                     
                     
                      className="fixed bottom-24 md:bottom-8 left-3 right-3 md:left-auto md:right-8 md:w-auto z-40 flex justify-center"
                    >
                      <button
                        onClick={() => setShowCart(true)}
                        className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-500 text-white font-black shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-400/20 hover:shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Review Request ({cart.length} items · ₹{total.toLocaleString()})
                      </button>
                    </div>
                  )}
                
              </div>
            ) : (
              /* Cart / Review Page */
              <div
                key="cart"
               
               
               
                className="space-y-6"
              >
                {!sent ? (
                  <>
                    <button
                      onClick={() => setShowCart(false)}
                      className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Products
                    </button>

                    <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all">
                      <h2 className="text-xl font-black text-foreground mb-5">Review Your Request</h2>
                      <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                        {cart.map(item => (
                          <div key={item.productId} className="flex items-center gap-4 p-3 rounded-xl bg-card text-card-foreground border border-border shadow-sm dark:bg-white/5">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryColors['General']} flex items-center justify-center flex-shrink-0`}>
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.unit} × {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-foreground">₹{(item.price * item.quantity).toLocaleString()}</p>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border/50 pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">Estimated Total</span>
                          <span className="text-2xl font-black text-primary dark:text-primary dark:text-indigo-400">₹{total.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors border border-indigo-500/20 dark:border-indigo-400/20 rounded-xl p-3">
                          💡 <span className="font-bold text-primary dark:text-primary dark:text-indigo-400">Note:</span> This amount will be added to your credit account only after the shop owner approves your request.
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Send Request button clicked');
                            handleSendRequest();
                          }}
                          disabled={sending || cart.length === 0}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-black text-base shadow-xl shadow-indigo-500/20 dark:shadow-indigo-400/20 hover:shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {sending ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Send Request to Shop Owner
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                   
                   
                    className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center py-16 gap-4"
                  >
                    <div
                     
                     
                      className="w-20 h-20 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-10 h-10 text-primary dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground">Request Sent! 🎉</h2>
                    <p className="text-muted-foreground max-w-sm">
                      Your order request has been sent to your shop owner. Items will be added to your credit once approved.
                    </p>
                    <p className="text-sm text-primary dark:text-primary dark:text-indigo-400 font-bold">Estimated Total: ₹{total.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

