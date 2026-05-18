'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Search, Plus, Package, Trash2, Loader2, ShoppingBag, CheckSquare, Square,
  Minus, X, Pencil, Upload, ShoppingCart, CheckCircle2, Trash
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type CartItem = { productId: string; quantity: number; unitPrice: number; name: string; unit: string };

type Product = {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  photoUrl: string;
  category?: string;
  stockStatus: 'AVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  description?: string;
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

export default function ShopOwnerProducts() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Cart state (saved to localStorage) - shop owner specific
  const [cart, setCart] = useState<CartItem[]>([]);
  const getCartKey = () => `shopOwnerCart_${user?.id || 'guest'}`;

  // Add/Edit Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'General', unit: 'kg', pricePerUnit: '', stockStatus: 'AVAILABLE', description: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setFormData({ name: '', category: 'General', unit: 'kg', pricePerUnit: '', stockStatus: 'AVAILABLE', description: '' });
    setPhotoFile(null); setImagePreview(null);
    setShowAddModal(true);
  };

  const openEditModal = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setSelectedProduct(p);
    setFormData({ name: p.name, category: p.category || 'General', unit: p.unit, pricePerUnit: p.pricePerUnit.toString(), stockStatus: p.stockStatus, description: p.description || '' });
    setImagePreview(p.photoUrl);
    setPhotoFile(null);
    setShowAddModal(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('productName', formData.name);
      data.append('category', formData.category);
      data.append('unit', formData.unit);
      data.append('pricePerUnit', formData.pricePerUnit);
      data.append('stockStatus', formData.stockStatus);
      if (formData.description) data.append('description', formData.description);
      if (photoFile) data.append('photo', photoFile);

      if (isEditing && selectedProduct) {
        await shopOwnerAPI.updateProduct(selectedProduct.id, data);
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await shopOwnerAPI.addProduct(data);
        toast({ title: 'Success', description: 'Product added' });
      }
      setShowAddModal(false);
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter]);

  // Load cart from localStorage on mount - shop owner specific
  useEffect(() => {
    if (!user?.id) return;
    
    // Clear old generic cart key if it exists
    const oldCart = localStorage.getItem('shopOwnerCart');
    if (oldCart) {
      localStorage.removeItem('shopOwnerCart');
      console.log('Cleared old generic cart data');
    }
    
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        console.log('Loaded cart for user:', user.id, parsedCart);
      } catch (e) {
        console.error('Failed to parse cart:', e);
        localStorage.removeItem(cartKey);
      }
    }
  }, [user?.id]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await shopOwnerAPI.getProducts({ page, limit: 20, category: categoryFilter || undefined });
      setProducts(response.data.products || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to load products', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) {
        handleSearch();
      } else {
        fetchProducts();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSearch = async () => {
    if (!search.trim()) { fetchProducts(); return; }
    try {
      setIsLoading(true);
      const response = await shopOwnerAPI.getProducts({ page: 1, limit: 100, category: categoryFilter || undefined });
      const filtered = response.data.products?.filter((p: Product) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      ) || [];
      setProducts(filtered);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Search failed', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-400/20';
      case 'LOW_STOCK': return 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-400/20';
      case 'OUT_OF_STOCK': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleDelete = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await shopOwnerAPI.deleteProduct(productId);
      toast({ title: 'Success', description: 'Product deleted' });
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete' });
    }
  };

  const toggleProduct = (product: Product) => {
    if (product.stockStatus !== 'AVAILABLE') return;
    setCart(prev => {
      const exists = prev.find(c => c.productId === product.id);
      const newCart = exists 
        ? prev.filter(c => c.productId !== product.id)
        : [...prev, { productId: product.id, quantity: 1, unitPrice: product.pricePerUnit, name: product.name, unit: product.unit }];
      localStorage.setItem(getCartKey(), JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(getCartKey());
    toast({ title: 'Cart Cleared', description: 'All items removed from cart' });
  };

  const updateQty = (productId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCart(prev => {
      const newCart = prev.map(c => {
        if (c.productId !== productId) return c;
        const nq = Math.max(1, c.quantity + delta);
        return { ...c, quantity: nq };
      });
      localStorage.setItem(getCartKey(), JSON.stringify(newCart));
      return newCart;
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.quantity * c.unitPrice), 0);
  const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-5 pb-24">

          {/* Header */}
          <div 
            
           
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Products</h1>
              <p className="text-muted-foreground mt-1 text-sm">Manage your inventory and product catalog</p>
            </div>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-teal-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {/* Search & Filters */}
          <div 
            
            
            
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search products by name..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" 
                />
              </div>
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50"
              >
                <option value="">All Categories</option>
                <option value="Grains">Grains</option>
                <option value="Pulses">Pulses</option>
                <option value="Oils">Oils</option>
                <option value="Spices">Spices</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Sweeteners">Sweeteners</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-indigo-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground font-medium">No products found</p>
              <button 
                onClick={openAddModal} 
                className="mt-4 mx-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors transition"
              >
                <Plus className="w-4 h-4" /> Add First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
              
                {products.map((product, i) => {
                  const gradient = categoryColors[product.category || 'General'];
                  const isAvailable = product.stockStatus === 'AVAILABLE';
                  const inCart = cart.find(c => c.productId === product.id);
                  const isSelected = !!inCart;

                  return (
                    <div 
                      key={product.id} 
                      
                     
                      
                     
                      onClick={() => isAvailable && toggleProduct(product)}
                      className={`glass-card transition-all group relative p-2.5 ${
                        !isAvailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected ? 'border-indigo-500/20 dark:border-indigo-400/20 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20 ring-1 ring-indigo-500/20 dark:ring-indigo-400/20' : 'hover:border-indigo-500/20 dark:border-indigo-400/20 hover:shadow-md'
                      }`}
                    >
                      {/* Selection indicator */}
                      {isAvailable && (
                        <div className={`absolute top-2 right-2 z-10 transition-all ${isSelected ? 'text-primary dark:text-indigo-400 scale-110' : 'text-muted-foreground/20 group-hover:text-muted-foreground/50'}`}>
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                      )}

                      {/* Edit/Delete buttons */}
                      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button 
                          onClick={e => openEditModal(product, e)} 
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-white hover:bg-primary transition-all shadow-lg"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={e => handleDelete(product.id, e)} 
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-red-500/90 text-white hover:bg-red-600 transition-all shadow-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Product Image */}
                      <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${gradient} mb-2 flex items-center justify-center overflow-hidden shadow-md relative`}>
                        {product.photoUrl && product.photoUrl.startsWith('http') ? (
                          <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-white/60" />
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors flex items-center justify-center backdrop-blur-[2px]">
                            <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-1.5">
                        <h3 className="text-sm md:text-base font-black text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground">{product.unit}</span>
                          <span className="text-sm md:text-base font-black text-primary dark:text-indigo-400">₹{product.pricePerUnit}</span>
                        </div>

                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${getStatusColor(product.stockStatus)} block text-center truncate`}>
                          {product.stockStatus.replace('_', ' ')}
                        </span>

                        {/* Quantity controls when in cart */}
                        {isSelected && isAvailable && (
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-border" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={e => updateQty(product.id, -1, e)} 
                              className="w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="flex-1 text-center font-black text-sm">{inCart!.quantity}</span>
                            <button 
                              onClick={e => updateQty(product.id, 1, e)} 
                              className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center hover:bg-primary transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button 
                  key={p} 
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    page === p ? 'bg-primary text-white shadow-lg' : 'bg-card text-card-foreground border border-border shadow-sm text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Floating Cart Button - Only show when products selected */}
        
          {cart.length > 0 && (
            <div
             
             
             
              onClick={() => router.push('/dashboard/shop_owner/cart')}
              className="fixed bottom-24 left-3 right-3 md:bottom-6 md:left-auto md:right-6 z-40 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-primary to-indigo-500 text-white font-black shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-400/20 hover:shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] sm:text-xs opacity-90">View Cart</span>
                  <span className="text-base sm:text-lg leading-none font-black">
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <div className="text-xs sm:text-sm opacity-90">Total</div>
                  <div className="text-lg sm:text-2xl font-black">₹{cartTotal.toFixed(2)}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); clearCart(); }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-colors group"
                  title="Clear cart"
                >
                  <Trash className="w-4 h-4 sm:w-5 sm:h-5 opacity-70 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          )}
        

        {/* Add/Edit Product Modal */}
        
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowAddModal(false)}>
              <div className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-black">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                    <p className="text-sm text-muted-foreground">{isEditing ? 'Update item details' : 'Add inventory'}</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl bg-muted"><X className="w-4 h-4" /></button>
                </div>

                <form onSubmit={handleSubmitProduct} className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center overflow-hidden border-2 border-background shadow-lg">
                        {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <Package className="w-10 h-10 text-white" />}
                      </div>
                      <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-teal-700 shadow-md">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-1 block">Product Name *</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border bg-card text-card-foreground border border-border shadow-sm text-sm focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-1 block">Category *</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border bg-card text-card-foreground border border-border shadow-sm text-sm focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50">
                        {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-1 block">Unit (eg. kg, pcs) *</label>
                      <input required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border bg-card text-card-foreground border border-border shadow-sm text-sm focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-1 block">Price Per Unit (₹) *</label>
                      <input required type="number" step="0.01" value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border bg-card text-card-foreground border border-border shadow-sm text-sm focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-bold text-muted-foreground mb-1 block">Stock Status *</label>
                      <select required value={formData.stockStatus} onChange={e => setFormData({...formData, stockStatus: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border bg-card text-card-foreground border border-border shadow-sm text-sm focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50">
                        <option value="AVAILABLE">Available</option>
                        <option value="LOW_STOCK">Low Stock</option>
                        <option value="OUT_OF_STOCK">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-sm flex justify-center items-center shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? 'Update Product' : 'Save Product')}
                  </button>
                </form>
              </div>
            </div>
          )}
        

      </DashboardLayout>
    </ProtectedRoute>
  );
}

