'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  FileText, Upload, Sparkles, Loader2, Play, Edit3, Trash, CheckCircle2,
  AlertTriangle, RefreshCw, Plus, ShoppingBag, Info
} from 'lucide-react';

import { useState } from 'react';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

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

export default function ShopOwnerBillScan() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState('');
  const [extractedProducts, setExtractedProducts] = useState<ScannedProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMime.includes(file.type.toLowerCase())) {
        toast({
          title: t('bill_scan.invalid_file_title', 'Invalid File Type'),
          description: t('bill_scan.invalid_file_desc', 'Please upload only JPG, JPEG, PNG, or WEBP invoice images.'),
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
        title: t('bill_scan.scan_completed_title', 'Scan Completed'),
        description: t('bill_scan.scan_completed_desc', 'Product details parsed successfully from bill!'),
      });

      setRawOcrText(response.data.rawText || '');
      setExtractedProducts(response.data.products || []);
    } catch (err: any) {
      clearInterval(interval);
      toast({
        title: t('bill_scan.scan_failed_title', 'Scan Failed'),
        description: err.response?.data?.message || t('bill_scan.scan_failed_desc', 'Failed to scan and parse bill image.'),
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleEditField = (index: number, field: keyof ScannedProduct, value: any) => {
    const updated = [...extractedProducts];
    if (field === 'pricePerUnit' || field === 'mrp' || field === 'quantity' || field === 'discount') {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setExtractedProducts(updated);
  };

  const handleDeleteProduct = (index: number) => {
    const updated = [...extractedProducts];
    updated.splice(index, 1);
    setExtractedProducts(updated);
    toast({ description: t('bill_scan.item_removed', 'Item removed from scanned preview list.') });
  };

  const handleAddManualProduct = () => {
    const newProduct: ScannedProduct = {
      productName: t('bill_scan.new_product_placeholder', 'New Extracted Product'),
      category: t('bill_scan.default_category', 'Grocery'),
      unit: t('bill_scan.default_unit', 'Packet'),
      pricePerUnit: 100,
      mrp: 110,
      quantity: 1,
      discount: 10,
      brand: t('bill_scan.default_brand', 'Generic'),
      gst: '18%',
      sku: `SKU-${Date.now().toString().substring(8)}`
    };
    setExtractedProducts([...extractedProducts, newProduct]);
  };

  const handleSaveToDatabase = async () => {
    if (extractedProducts.length === 0) return;

    setIsSaving(true);
    try {
      await shopOwnerAPI.saveScannedProducts({ products: extractedProducts });
      toast({
        title: t('bill_scan.save_success_title', 'Products Created'),
        description: t('bill_scan.save_success_desc', 'Successfully added {{count}} products to database catalog!', { count: extractedProducts.length }),
      });
      // Reset
      setBillFile(null);
      setBillPreview(null);
      setExtractedProducts([]);
      setRawOcrText('');
    } catch (err: any) {
      toast({
        title: t('bill_scan.save_failed_title', 'Save Failed'),
        description: err.response?.data?.message || t('bill_scan.save_failed_desc', 'Failed to save scanned products to database.'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              {t('bill_scan.title', 'Bill Scan Product Entry')}
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              {t('bill_scan.subtitle', 'Upload retail invoices or wholesale bills to scan, extract, preview, and save products to database automatically.')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Block: Invoice Upload & OCR */}
            <div className={`border rounded-2xl p-5 space-y-5 lg:col-span-1 shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {t('bill_scan.upload_invoice', 'Upload Invoice')}
              </h3>

              {/* Upload Input */}
              <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100/50 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {billPreview ? (
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                    <img src={billPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400 inline-flex">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-slate-700 dark:text-white font-semibold">{t('bill_scan.drag_drop', 'Drag & drop or click to upload bill')}</p>
                    <p className="text-xs text-slate-400 dark:text-white/40">{t('categories_page.supported_formats')}</p>
                  </div>
                )}
              </div>

              {/* Start Scan Button */}
              {billFile && (
                <button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('bill_scan.scanning_bill', 'Scanning Bill')} ({scanProgress}%)
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      {t('bill_scan.start_scan', 'Start OCR Scanning')}
                    </>
                  )}
                </button>
              )}

              {/* OCR Scan Status Bars */}
              {isScanning && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${scanProgress}%` }}
                      className="bg-indigo-500 h-full"
                    />
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-300 animate-pulse text-center">
                    {t('bill_scan.parsing_notice', 'Intelligently parsing lines, extraction and category matching...')}
                  </p>
                </div>
              )}

              {/* Scanned raw Text snippet */}
              {rawOcrText && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60 block">
                    {t('bill_scan.raw_text_label', 'Scanned Raw Text Segment')}
                  </label>
                  <pre className="text-[10px] font-mono p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-lg text-slate-800 dark:text-white/80 overflow-x-auto max-h-40 overflow-y-auto">
                    {rawOcrText}
                  </pre>
                </div>
              )}
            </div>

            {/* Right Block: Scanned Products Preview Table */}
            <div className={`border rounded-2xl p-5 lg:col-span-2 flex flex-col justify-between min-h-[500px] shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    {t('bill_scan.products_preview', 'Extracted Products Preview')}
                  </h3>
                  {extractedProducts.length > 0 && (
                    <button
                      onClick={handleAddManualProduct}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold transition-all text-indigo-600 dark:text-indigo-400 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('add_credit_page.add_product')}
                    </button>
                  )}
                </div>

                {extractedProducts.length === 0 ? (
                  <div className="py-20 text-center space-y-4 text-slate-400 dark:text-white/40 max-w-md mx-auto">
                    <div className="inline-flex p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-300 dark:text-white/20">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-md font-bold text-slate-800 dark:text-white">{t('bill_scan.no_products_scanned', 'No products scanned yet')}</h4>
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      {t('bill_scan.no_products_desc', 'Upload an invoice or Kirana bill on the left panel and click "Start OCR Scanning" to auto-populate the database listings.')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-white/5 rounded-xl">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 text-xs uppercase tracking-wider font-bold">
                          <th className="p-3">{t('product.name', 'Product Name')}</th>
                          <th className="p-3 w-32">{t('sidebar.items.categories', 'Category')}</th>
                          <th className="p-3 w-20">{t('product.unit', 'Unit')}</th>
                          <th className="p-3 w-24">{t('product.price', 'Price')} (₹)</th>
                          <th className="p-3 w-24">{t('product.mrp', 'MRP')} (₹)</th>
                          <th className="p-3 w-20">{t('product.gst', 'GST')}</th>
                          <th className="p-3 w-12 text-center">{t('product.action', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {extractedProducts.map((prod, idx) => (
                            <motion.tr
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-white/90"
                            >
                              {/* Product Name */}
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={prod.productName}
                                  onChange={(e) => handleEditField(idx, 'productName', e.target.value)}
                                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-800 transition-colors"
                                />
                              </td>
                              
                              {/* Suggested Category */}
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={prod.category}
                                  onChange={(e) => handleEditField(idx, 'category', e.target.value)}
                                  placeholder="Category"
                                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-800 transition-colors font-bold"
                                />
                              </td>

                              {/* Unit */}
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={prod.unit}
                                  onChange={(e) => handleEditField(idx, 'unit', e.target.value)}
                                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-800 transition-colors text-center"
                                />
                              </td>

                              {/* Price per unit */}
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={prod.pricePerUnit}
                                  onChange={(e) => handleEditField(idx, 'pricePerUnit', e.target.value)}
                                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-800 transition-colors"
                                />
                              </td>

                              {/* MRP */}
                              <td className="p-3">
                                <input
                                  type="number"
                                  value={prod.mrp}
                                  onChange={(e) => handleEditField(idx, 'mrp', e.target.value)}
                                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-800 transition-colors"
                                />
                              </td>

                              {/* GST */}
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={prod.gst}
                                  onChange={(e) => handleEditField(idx, 'gst', e.target.value)}
                                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-50 dark:focus:bg-zinc-800 transition-colors text-center"
                                />
                              </td>

                              {/* Delete Row */}
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteProduct(idx)}
                                  className="p-1.5 text-slate-400 dark:text-white/60 hover:text-red-650 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-all cursor-pointer"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer Save Row */}
              {extractedProducts.length > 0 && (
                <div className="border-t border-slate-200 dark:border-white/10 pt-5 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-2 text-slate-500 dark:text-white/60 text-xs">
                    <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>
                      {t('bill_scan.categories_notice', 'Extracted categories will automatically be created in the Categories database if they are not already listed.')}
                    </span>
                  </div>

                  <button
                    onClick={handleSaveToDatabase}
                    disabled={isSaving}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 self-end sm:self-auto active:scale-95 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('bill_scan.saving_products', 'Saving Products...')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {t('bill_scan.save_btn', 'Save Scanned Products')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
