'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Plus, Package, Trash2, Loader2, ShoppingBag, CheckSquare, Square,
  Minus, X, Pencil, Upload, ShoppingCart, CheckCircle2, Trash, Sparkles, FileText, Play, Info
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import Image from 'next/image';

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

type ScannedProduct = {
  productName: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  mrp: number;
  quantity: number;
  discount: number;
  brand: string;
  gst: string;
  sku: string;
};

export default function ShopOwnerProducts() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  
  // Scanning States
  const [showScanModal, setShowScanModal] = useState(false);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState('');
  const [extractedProducts, setExtractedProducts] = useState<ScannedProduct[]>([]);
  const [isSavingScan, setIsSavingScan] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Use SWR for Categories
  const { data: categoriesRes } = useSWR(
    ['shopOwnerCategories', language],
    () => shopOwnerAPI.getCategories().then((res: any) => res.data.categories || []),
    { fallbackData: [] }
  );
  const categoriesList = categoriesRes || [];

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Use SWR for Products
  const { data: productsData, isLoading, mutate: mutateProducts } = useSWR(
    ['shopOwnerProducts', page, categoryFilter, debouncedSearch, language],
    async () => {
      // If we have a debounced search, we fetch 100 items (or use a dedicated search endpoint)
      if (debouncedSearch) {
        const res = await shopOwnerAPI.getProducts({ page: 1, limit: 100, category: categoryFilter || undefined });
        const filtered = res.data.products?.filter((p: Product) =>
          p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        ) || [];
        return { products: filtered, totalPages: 1 };
      } else {
        const res = await shopOwnerAPI.getProducts({ page, limit: 20, category: categoryFilter || undefined });
        return {
          products: res.data.products || [],
          totalPages: res.data.pagination?.totalPages || 1
        };
      }
    },
    { fallbackData: { products: [], totalPages: 1 } }
  );

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;

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
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setUploadProgress(1); // Start progress bar
    try {
      const data = new FormData();
      data.append('productName', formData.name);
      data.append('category', formData.category);
      data.append('unit', formData.unit);
      data.append('pricePerUnit', formData.pricePerUnit);
      data.append('stockStatus', formData.stockStatus);
      if (formData.description) data.append('description', formData.description);
      if (photoFile) data.append('photo', photoFile);

      const onProgress = (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      };

      if (isEditing && selectedProduct) {
        await shopOwnerAPI.updateProduct(selectedProduct.id, data, onProgress);
        toast({ title: 'Success', description: 'Product updated' });
      } else {
        await shopOwnerAPI.addProduct(data, onProgress);
        toast({ title: 'Success', description: 'Product added' });
      }
      setShowAddModal(false);
      mutateProducts(); // Instantly revalidate using SWR
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0); // Reset progress bar
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
        toast({
          title: 'Invalid File Type',
          description: 'Only JPG, JPEG, PNG, and WEBP formats are allowed.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size exceeds the 5MB limit.',
          variant: 'destructive',
        });
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Load cart from localStorage on mount - shop owner specific

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
      mutateProducts();
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

  // Scanning Handlers
  const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMime.includes(file.type.toLowerCase())) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload only JPG, JPEG, PNG, or WEBP invoice images.',
          variant: 'destructive',
        });
        return;
      }

      setBillFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBillPreview(reader.result as string);
      reader.readAsDataURL(file);
      
      // Reset scan states
      setRawOcrText('');
      setExtractedProducts([]);
    }
  };

  const handleStartScan = async () => {
    if (!billFile) return;

    setIsScanning(true);
    setScanProgress(10);
    
    // Simulate progression steps for visual delight
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append('bill', billFile);

      const response = await shopOwnerAPI.scanBill(formData);
      
      clearInterval(interval);
      setScanProgress(100);
      
      toast({
        title: 'Scan Completed',
        description: 'Product details parsed successfully from bill!',
      });

      setRawOcrText(response.data.rawText || '');
      setExtractedProducts(response.data.products || []);
    } catch (err: any) {
      clearInterval(interval);
      toast({
        title: 'Scan Failed',
        description: err.response?.data?.message || 'Failed to scan and parse bill image.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleEditScanField = (index: number, field: keyof ScannedProduct, value: any) => {
    const updated = [...extractedProducts];
    if (field === 'pricePerUnit' || field === 'mrp' || field === 'quantity' || field === 'discount') {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setExtractedProducts(updated);
  };

  const handleDeleteScanProduct = (index: number) => {
    const updated = [...extractedProducts];
    updated.splice(index, 1);
    setExtractedProducts(updated);
    toast({ description: 'Item removed from scanned preview list.' });
  };

  const handleAddScanManualProduct = () => {
    const newProduct: ScannedProduct = {
      productName: 'New Extracted Product',
      category: categoriesList[0]?.name || 'Grains',
      unit: 'Packet',
      pricePerUnit: 100,
      mrp: 110,
      quantity: 1,
      discount: 10,
      brand: 'Generic',
      gst: '18%',
      sku: `SKU-${Date.now().toString().substring(8)}`
    };
    setExtractedProducts([...extractedProducts, newProduct]);
  };

  const handleSaveScanToDatabase = async () => {
    if (extractedProducts.length === 0) return;

    setIsSavingScan(true);
    try {
      await shopOwnerAPI.saveScannedProducts({ products: extractedProducts });
      toast({
        title: 'Products Created',
        description: `Successfully added ${extractedProducts.length} products to database catalog!`,
      });
      // Reset
      setBillFile(null);
      setBillPreview(null);
      setExtractedProducts([]);
      setRawOcrText('');
      setShowScanModal(false);
      
      // Auto-refresh main product catalog display!
      mutateProducts();
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.response?.data?.message || 'Failed to save scanned products to database.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingScan(false);
    }
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
              <h1 className="text-3xl font-black text-foreground tracking-tight">{t('sidebar.items.products')}</h1>
              <p className="text-muted-foreground mt-1 text-sm">{t('seller_dashboard.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setShowScanModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-sm shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-indigo-700 dark:text-indigo-400" /> {t('seller_dashboard.scan_bill')}
              </button>
              <button 
                onClick={openAddModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-indigo-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all"
              >
                <Plus className="w-4 h-4" /> {t('seller_dashboard.add_product')}
              </button>
            </div>
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
                  placeholder={t('seller_dashboard.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" 
                />
              </div>
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50"
              >
                <option value="">{t('seller_dashboard.all_categories')}</option>
                <option value="Grains">Grains</option>
                <option value="Pulses">Pulses</option>
                <option value="Oils">Oils</option>
                <option value="Spices">Spices</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Sweeteners">Sweeteners</option>
                {categoriesList.map((cat: any) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="glass-card p-2.5 flex flex-col gap-2">
                  <Skeleton className="w-full aspect-square rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between items-center mt-1">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-3 w-16 mx-auto mt-1" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground font-medium">{t('seller_dashboard.no_products_found')}</p>
              <button 
                onClick={openAddModal} 
                className="mt-4 mx-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors transition"
              >
                <Plus className="w-4 h-4" /> {t('seller_dashboard.add_first_product')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
              
                {products.map((product: Product, i: number) => {
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
                          <Image src={product.photoUrl} alt={product.name} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover" />
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
                          {product.stockStatus === 'AVAILABLE' ? t('seller_dashboard.available') : product.stockStatus === 'LOW_STOCK' ? t('seller_dashboard.low_stock') : t('seller_dashboard.out_of_stock')}
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
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center overflow-hidden border-2 border-background shadow-lg">
                        {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <Package className="w-10 h-10 text-white" />}
                      </div>
                      <label className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-teal-700 shadow-md">
                        <Upload className="w-4 h-4" />
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
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
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-1 block">Product Name *</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border bg-card text-card-foreground border border-border shadow-sm text-sm focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-muted-foreground mb-1 block">Category *</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border bg-card text-card-foreground border border-border shadow-sm text-sm focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50">
                        {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                        {categoriesList.filter((cat: any) => !Object.keys(categoryColors).includes(cat.name)).map((cat: any) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
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

        {/* Scan Bill Modal */}
        <AnimatePresence>
          {showScanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6" onClick={() => setShowScanModal(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col justify-between p-6" 
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                  <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 text-primary">
                      <Sparkles className="w-6 h-6 animate-pulse" /> Bill Scan Catalog Entry
                    </h2>
                    <p className="text-xs text-muted-foreground">Upload billing receipts or invoices to extract and dynamically register products.</p>
                  </div>
                  <button onClick={() => setShowScanModal(false)} className="p-2 rounded-xl bg-muted/50 hover:bg-muted border border-border text-muted-foreground transition-all"><X className="w-4 h-4" /></button>
                </div>

                {/* Modal Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Left Column: Upload & OCR */}
                  <div className="bg-background/50 border border-border rounded-2xl p-5 space-y-5 lg:col-span-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-primary" />
                      Invoice Image
                    </h3>

                    {/* Drag-and-drop Image Panel */}
                    <div className="relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted transition-colors cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScanFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      {billPreview ? (
                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-white/10">
                          <img src={billPreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 space-y-2">
                          <div className="p-3 bg-indigo-500/10 rounded-full text-primary inline-flex">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-foreground font-bold">Click or drag bill image to upload</p>
                          <p className="text-[10px] text-muted-foreground">Accepts PNG, JPG, JPEG, WEBP up to 5MB</p>
                        </div>
                      )}
                    </div>

                    {/* Scan Action Button */}
                    {billFile && (
                      <button
                        onClick={handleStartScan}
                        disabled={isScanning}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Scanning OCR ({scanProgress}%)
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Start OCR Scanning
                          </>
                        )}
                      </button>
                    )}

                    {/* Progress Bar */}
                    {isScanning && (
                      <div className="space-y-1.5">
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${scanProgress}%` }}
                            className="bg-indigo-500 h-full"
                          />
                        </div>
                        <p className="text-[10px] text-primary animate-pulse text-center">
                          Intelligently extracting text lines and parsing items...
                        </p>
                      </div>
                    )}

                    {/* Raw Text Box */}
                    {rawOcrText && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Parsed Raw Text Log
                        </label>
                        <pre className="text-[9px] font-mono p-3 bg-muted border border-border rounded-lg text-foreground overflow-x-auto max-h-32 overflow-y-auto">
                          {rawOcrText}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Parsed Items editable Grid */}
                  <div className="bg-background/50 border border-border rounded-2xl p-5 lg:col-span-2 flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <ShoppingBag className="w-4.5 h-4.5 text-primary" />
                          Parsed Products Preview
                        </h3>
                        {extractedProducts.length > 0 && (
                          <button
                            onClick={handleAddScanManualProduct}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-lg text-[10px] font-bold transition-all text-primary"
                          >
                            <Plus className="w-3 h-3" />
                            Add Item
                          </button>
                        )}
                      </div>

                      {extractedProducts.length === 0 ? (
                        <div className="py-16 text-center space-y-3 text-muted-foreground max-w-sm mx-auto">
                          <div className="inline-flex p-3.5 bg-muted border border-border rounded-full">
                            <FileText className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                          <h4 className="text-sm font-bold text-foreground">No products parsed yet</h4>
                          <p className="text-xs text-muted-foreground">
                            Upload a billing receipt or invoice image on the left, then click OCR scan to automatically extract items.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-border rounded-xl max-h-[45vh] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-muted border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
                                <th className="p-2.5">Product Name</th>
                                <th className="p-2.5 w-28">Category</th>
                                <th className="p-2.5 w-16">Unit</th>
                                <th className="p-2.5 w-20">Price (₹)</th>
                                <th className="p-2.5 w-20">MRP (₹)</th>
                                <th className="p-2.5 w-16">GST</th>
                                <th className="p-2.5 w-10 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {extractedProducts.map((prod, idx) => (
                                <tr key={idx} className="border-b border-border hover:bg-muted/50 text-foreground">
                                  {/* Name */}
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={prod.productName}
                                      onChange={(e) => handleEditScanField(idx, 'productName', e.target.value)}
                                      className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-background text-foreground"
                                    />
                                  </td>
                                  
                                  {/* Category Dynamic dropdown select! */}
                                  <td className="p-2">
                                    <select
                                      value={prod.category}
                                      onChange={(e) => handleEditScanField(idx, 'category', e.target.value)}
                                      className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-background text-primary font-bold"
                                    >
                                      {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                                      {categoriesList.filter((cat: any) => !Object.keys(categoryColors).includes(cat.name)).map((cat: any) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                      ))}
                                    </select>
                                  </td>

                                  {/* Unit */}
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={prod.unit}
                                      onChange={(e) => handleEditScanField(idx, 'unit', e.target.value)}
                                      className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-background text-center text-foreground"
                                    />
                                  </td>

                                  {/* Price */}
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={prod.pricePerUnit}
                                      onChange={(e) => handleEditScanField(idx, 'pricePerUnit', e.target.value)}
                                      className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-background text-foreground"
                                    />
                                  </td>

                                  {/* MRP */}
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={prod.mrp}
                                      onChange={(e) => handleEditScanField(idx, 'mrp', e.target.value)}
                                      className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-background text-foreground"
                                    />
                                  </td>

                                  {/* GST */}
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={prod.gst}
                                      onChange={(e) => handleEditScanField(idx, 'gst', e.target.value)}
                                      className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-background text-center text-foreground"
                                    />
                                  </td>

                                  {/* Action delete */}
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleDeleteScanProduct(idx)}
                                      className="p-1 text-muted-foreground hover:text-red-500 hover:bg-muted rounded transition-all"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Modal Save Footer */}
                    {extractedProducts.length > 0 && (
                      <div className="border-t border-border pt-4 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-1.5 text-muted-foreground text-[10px]">
                          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span>
                            Parsed items will automatically be uploaded and matched to dynamic inventory.
                          </span>
                        </div>

                        <button
                          onClick={handleSaveScanToDatabase}
                          disabled={isSavingScan}
                          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                          {isSavingScan ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Saving Catalog...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Save & Import Products
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        

      </DashboardLayout>
    </ProtectedRoute>
  );
}

