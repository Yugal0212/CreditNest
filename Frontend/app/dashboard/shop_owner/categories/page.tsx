'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Search, Plus, Package, Trash2, Loader2, FolderOpen, CheckSquare, Square,
  X, Pencil, Upload, CheckCircle2, ChevronRight, Sparkles, FileText, Play, Info, ShoppingBag, Trash
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import useSWR from 'swr';

type Category = {
  id: number;
  name: string;
  photoUrl: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
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

const categoryColors: Record<string, string> = {
  Grocery: 'from-teal-500 to-teal-600',
  Dairy: 'from-blue-500 to-blue-600',
  Snacks: 'from-amber-500 to-amber-600',
  Household: 'from-purple-500 to-purple-600',
  Beverages: 'from-red-500 to-red-600',
  General: 'from-slate-400 to-slate-600',
};

export default function ShopOwnerCategories() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Scanning States
  const [showScanModal, setShowScanModal] = useState(false);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState('');
  const [extractedProducts, setExtractedProducts] = useState<ScannedProduct[]>([]);
  const [isSavingScan, setIsSavingScan] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', isActive: true });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Use SWR for Categories
  const { data: categoriesData, isLoading, mutate: fetchCategories } = useSWR(
    ['shopOwnerCategoriesPage', debouncedSearch, language],
    async () => {
      const response = await shopOwnerAPI.getCategories({ search: debouncedSearch || undefined });
      const cats = response.data.categories || [];
      setCategoriesList(cats);
      return cats;
    },
    { fallbackData: [], keepPreviousData: true }
  );

  const categories: Category[] = categoriesData || [];

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedCategory(null);
    setFormData({ name: '', isActive: true });
    setPhotoFile(null);
    setImagePreview(null);
    setShowAddModal(true);
  };

  const openEditModal = (c: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setSelectedCategory(c);
    setFormData({ name: c.name, isActive: c.isActive });
    setImagePreview(c.photoUrl);
    setPhotoFile(null);
    setShowAddModal(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(5);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('isActive', String(formData.isActive));
      if (photoFile) {
        data.append('photo', photoFile);
      }

      const onProgress = (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      };

      if (isEditing && selectedCategory) {
        await shopOwnerAPI.updateCategory(selectedCategory.id.toString(), data, onProgress);
        toast({ title: 'Success', description: 'Category updated successfully' });
      } else {
        await shopOwnerAPI.addCategory(data, onProgress);
        toast({ title: 'Success', description: 'Category added successfully' });
      }
      setShowAddModal(false);
      fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteCategory = async (categoryId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      await shopOwnerAPI.deleteCategory(categoryId.toString());
      toast({ title: 'Success', description: 'Category deleted successfully' });
      fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
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
      category: categoriesList[0]?.name || 'Grocery',
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
      
      // Auto-refresh categories counters since new products got added to categories!
      fetchCategories();
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

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <FolderOpen className="w-8 h-8 text-indigo-655 dark:text-indigo-400" />
                {t('categories_page.title')}
              </h1>
              <p className="text-slate-500 dark:text-white/60 text-sm mt-1">
                {t('categories_page.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowScanModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold transition-all shadow-sm active:scale-95 self-start md:self-auto cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t('categories_page.scan_bill')}
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 self-start md:self-auto cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                {t('categories_page.add_category')}
              </button>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/40" />
              <input
                type="text"
                placeholder={t('categories_page.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              />
            </div>
            <div className="text-slate-500 dark:text-white/60 text-xs font-bold uppercase tracking-wider">
              {t('categories_page.total_categories')}: <span className="text-slate-800 dark:text-white font-mono text-sm">{categories.length}</span>
            </div>
          </div>

          {/* Categories Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 animate-pulse">
                  <div className="w-full aspect-square bg-slate-100 dark:bg-white/10 rounded-xl" />
                  <div className="h-5 bg-slate-100 dark:bg-white/10 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 dark:bg-white/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('categories_page.empty_title')}</h3>
              <p className="text-slate-500 dark:text-white/60 text-sm">
                {t('categories_page.empty_subtitle')}
              </p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {t('categories_page.create_category')}
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  layout
                  className={`relative group bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border ${
                    cat.isActive ? 'border-slate-200 dark:border-white/10' : 'border-red-500/20 opacity-70'
                  } rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 flex flex-col`}
                >
                  {/* Category Image */}
                  <div className={`relative w-full aspect-video overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                    <img
                      src={cat.photoUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div 
                      className="absolute inset-0" 
                      style={{ backgroundImage: isDark ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' : 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)' }}
                    />
                    
                    {/* Status Badge */}
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm ${
                        cat.isActive
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                          : 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
                      }`}
                    >
                      {cat.isActive ? t('categories_page.status_active') : t('categories_page.status_inactive')}
                    </span>
                  </div>

                  {/* Body */}
                  <div className={`p-4 flex-1 flex flex-col justify-between ${isDark ? 'bg-transparent' : 'bg-white'}`}>
                    <div>
                      <h3 className={`font-extrabold text-lg line-clamp-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{cat.name}</h3>
                      <div className="flex items-center gap-1.5 mt-2 text-slate-500 dark:text-white/60 text-xs">
                        <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>{t('categories_page.products_count', { count: cat.productCount })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/5 pt-3 mt-4">
                      <button
                        onClick={(e) => openEditModal(cat, e)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        title={t('categories_page.edit_tooltip')}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-2 bg-slate-50 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/10 border border-slate-200 dark:border-white/10 hover:border-red-500/20 rounded-lg text-slate-700 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                        title={t('categories_page.delete_tooltip')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Add/Edit Modal */}
          <AnimatePresence>
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddModal(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 p-6 space-y-6 text-slate-900 dark:text-white"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      {isEditing ? <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                      {isEditing ? t('categories_page.edit_title') : t('categories_page.add_title')}
                    </h3>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">
                        {t('categories_page.name_label')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('categories_page.name_placeholder')}
                        className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                      />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60 block">
                        {t('categories_page.banner_label')}
                      </label>
                      <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100/50 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {imagePreview ? (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Upload className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 space-y-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-650 dark:text-indigo-400 inline-flex">
                              <Upload className="w-5 h-5" />
                            </div>
                            <p className="text-xs text-slate-700 dark:text-white font-semibold">{t('categories_page.click_drag')}</p>
                            <p className="text-[10px] text-slate-450 dark:text-white/40">{t('categories_page.supported_formats')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Checkbox */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className="text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
                      >
                        {formData.isActive ? (
                          <CheckSquare className="w-6 h-6" />
                        ) : (
                          <Square className="w-6 h-6 text-slate-300 dark:text-white/40" />
                        )}
                      </button>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{t('categories_page.active_status')}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60">{t('categories_page.active_notice')}</p>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white/80 font-bold transition-all text-sm cursor-pointer"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {uploadProgress > 0 ? `${t('common.processing')} (${uploadProgress}%)` : t('common.processing')}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {isEditing ? t('categories_page.update_btn') : t('categories_page.save_btn')}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        {/* Scan Bill Modal */}
        <AnimatePresence>
          {showScanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6 text-slate-900 dark:text-white" onClick={() => setShowScanModal(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card bg-white dark:bg-zinc-950 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col justify-between p-6" 
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                  <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="w-6 h-6 animate-pulse" /> {t('categories_page.scan_title', 'Bill Scan Catalog Entry')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-white/60">{t('categories_page.scan_subtitle', 'Upload billing receipts or invoices to extract and dynamically register products.')}</p>
                  </div>
                  <button onClick={() => setShowScanModal(false)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 transition-all cursor-pointer"><X className="w-4 h-4" /></button>
                </div>

                {/* Modal Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Left Column: Upload & OCR */}
                  <div className="bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-5 lg:col-span-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white/80 flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                      {t('categories_page.invoice_image', 'Invoice Image')}
                    </h3>

                    {/* Drag-and-drop Image Panel */}
                    <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScanFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      {billPreview ? (
                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                          <img src={billPreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 space-y-2">
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400 inline-flex">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-slate-700 dark:text-white font-bold">{t('categories_page.click_drag_bill', 'Click or drag bill image to upload')}</p>
                          <p className="text-[10px] text-slate-400 dark:text-white/40">{t('categories_page.ocr_formats', 'Accepts PNG, JPG, JPEG, WEBP up to 5MB')}</p>
                        </div>
                      )}
                    </div>

                    {/* Scan Action Button */}
                    {billFile && (
                      <button
                        onClick={handleStartScan}
                        disabled={isScanning}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('categories_page.scanning_ocr', 'Scanning OCR')} ({scanProgress}%)
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            {t('categories_page.start_ocr', 'Start OCR Scanning')}
                          </>
                        )}
                      </button>
                    )}

                    {/* Progress Bar */}
                    {isScanning && (
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                             initial={{ width: '0%' }}
                             animate={{ width: `${scanProgress}%` }}
                             className="bg-indigo-500 h-full"
                          />
                        </div>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-300 animate-pulse text-center">
                          {t('categories_page.ocr_progress', 'Intelligently extracting text lines and parsing items...')}
                        </p>
                      </div>
                    )}

                    {/* Raw Text Box */}
                    {rawOcrText && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 block">
                          {t('categories_page.raw_text_log', 'Parsed Raw Text Log')}
                        </label>
                        <pre className="text-[9px] font-mono p-3 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/5 rounded-lg text-slate-800 dark:text-white/70 overflow-x-auto max-h-32 overflow-y-auto">
                          {rawOcrText}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Parsed Items editable Grid */}
                  <div className="bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 lg:col-span-2 flex flex-col justify-between min-h-[350px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white/80 flex items-center gap-2">
                          <ShoppingBag className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                          {t('categories_page.parsed_preview', 'Parsed Products Preview')}
                        </h3>
                        {extractedProducts.length > 0 && (
                          <button
                            onClick={handleAddScanManualProduct}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold transition-all text-indigo-600 dark:text-indigo-400 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            {t('categories_page.add_item', 'Add Item')}
                          </button>
                        )}
                      </div>

                      {extractedProducts.length === 0 ? (
                        <div className="py-16 text-center space-y-3 text-slate-400 dark:text-white/40 max-w-sm mx-auto">
                          <div className="inline-flex p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-350 dark:text-white/20">
                            <FileText className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('categories_page.no_products_parsed', 'No products parsed yet')}</h4>
                          <p className="text-xs text-slate-500 dark:text-white/50">
                            {t('categories_page.no_products_parsed_sub', 'Upload a billing receipt or invoice image on the left, then click OCR scan to automatically extract items.')}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 dark:border-white/5 rounded-xl max-h-[45vh] overflow-y-auto shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-55 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/55 text-[10px] uppercase tracking-wider font-bold">
                                <th className="p-2.5">{t('categories_page.table_product_name', 'Product Name')}</th>
                                <th className="p-2.5 w-28">{t('categories_page.table_category', 'Category')}</th>
                                <th className="p-2.5 w-16">{t('categories_page.table_unit', 'Unit')}</th>
                                <th className="p-2.5 w-20">{t('categories_page.table_price', 'Price')} (₹)</th>
                                <th className="p-2.5 w-20">{t('categories_page.table_mrp', 'MRP')} (₹)</th>
                                <th className="p-2.5 w-16">{t('categories_page.table_gst', 'GST')}</th>
                                <th className="p-2.5 w-10 text-center">{t('categories_page.table_action', 'Action')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {extractedProducts.map((prod, idx) => (
                                <tr key={idx} className="border-b border-slate-250 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-white/90">
                                  {/* Name */}
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={prod.productName}
                                      onChange={(e) => handleEditScanField(idx, 'productName', e.target.value)}
                                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-900 text-slate-900 dark:text-white"
                                    />
                                  </td>
                                  
                                  {/* Category Dynamic dropdown select! */}
                                  <td className="p-2">
                                    <select
                                      value={prod.category}
                                      onChange={(e) => handleEditScanField(idx, 'category', e.target.value)}
                                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-900 text-indigo-600 dark:text-indigo-300 font-bold"
                                    >
                                      {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
                                      {categoriesList.filter(cat => !Object.keys(categoryColors).includes(cat.name)).map(cat => (
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
                                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-900 text-center text-slate-900 dark:text-white"
                                    />
                                  </td>

                                  {/* Price */}
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={prod.pricePerUnit}
                                      onChange={(e) => handleEditScanField(idx, 'pricePerUnit', e.target.value)}
                                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-900 text-slate-900 dark:text-white"
                                    />
                                  </td>

                                  {/* MRP */}
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={prod.mrp}
                                      onChange={(e) => handleEditScanField(idx, 'mrp', e.target.value)}
                                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-900 text-slate-900 dark:text-white"
                                    />
                                  </td>

                                  {/* GST */}
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={prod.gst}
                                      onChange={(e) => handleEditScanField(idx, 'gst', e.target.value)}
                                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-900 text-center text-slate-900 dark:text-white"
                                    />
                                  </td>

                                  {/* Action delete */}
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleDeleteScanProduct(idx)}
                                      className="p-1 text-slate-400 dark:text-white/50 hover:text-red-650 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded transition-all cursor-pointer"
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
                      <div className="border-t border-slate-200 dark:border-white/10 pt-4 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-1.5 text-slate-500 dark:text-white/50 text-[10px]">
                          <Info className="w-3.5 h-3.5 text-indigo-650 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                          <span>
                            {t('categories_page.scan_footer_notice', 'Parsed items will automatically be uploaded and matched to dynamic inventory.')}
                          </span>
                        </div>

                        <button
                          onClick={handleSaveScanToDatabase}
                          disabled={isSavingScan}
                          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
                        >
                          {isSavingScan ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              {t('categories_page.saving_catalog', 'Saving Catalog...')}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t('categories_page.save_import', 'Save & Import Products')}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


