'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Package, Tag, IndianRupee, Layers } from 'lucide-react';
import { shopOwnerAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddProduct() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    unit: '',
    pricePerUnit: '',
    stockStatus: 'AVAILABLE',
    description: '',
    photo: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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

      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.productName || !formData.category || !formData.unit || !formData.pricePerUnit) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (parseFloat(formData.pricePerUnit) <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Price must be greater than 0',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append('productName', formData.productName);
      data.append('category', formData.category);
      data.append('unit', formData.unit);
      data.append('pricePerUnit', formData.pricePerUnit);
      data.append('stockStatus', formData.stockStatus);
      if (formData.description) data.append('description', formData.description);
      if (formData.photo) data.append('photo', formData.photo);

      setUploadProgress(1); // Start progress bar

      const response = await shopOwnerAPI.addProduct(data, (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      toast({
        title: 'Success',
        description: 'Product added successfully',
      });

      router.push('/dashboard/shop_owner/products');
    } catch (error: any) {
      console.error('Add product error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add product';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadProgress(0); // Reset progress bar
    }
  };

  return (
    <div className="p-4 md:p-6 pb-32 md:pb-6 space-y-4 md:space-y-6 max-w-3xl mx-auto">
      <div
       
       
        className="flex items-center gap-3 md:gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">Add New Product</h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium">Add a new product to your inventory</p>
        </div>
      </div>

      <div
       
       
       
        className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all max-w-2xl p-4 md:p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-16 h-16 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">Click to upload product photo</p>

            {uploadProgress > 0 && (
              <div className="w-full max-w-xs space-y-1">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Uploading image...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName" className="flex items-center gap-2 font-bold text-foreground">
              <Package className="w-4 h-4" />
              Product Name *
            </Label>
            <Input
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
              className="bg-card text-card-foreground border border-border shadow-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2 font-bold text-foreground">
              <Tag className="w-4 h-4" />
              Category *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger className="bg-card text-card-foreground border border-border shadow-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GROCERIES">Groceries</SelectItem>
                <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                <SelectItem value="CLOTHING">Clothing</SelectItem>
                <SelectItem value="HARDWARE">Hardware</SelectItem>
                <SelectItem value="STATIONARY">Stationary</SelectItem>
                <SelectItem value="FOOD">Food</SelectItem>
                <SelectItem value="BEVERAGES">Beverages</SelectItem>
                <SelectItem value="HOUSEHOLD">Household</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit and Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div className="space-y-2">
              <Label htmlFor="unit" className="flex items-center gap-2 font-bold text-foreground">
                <Layers className="w-4 h-4" />
                Unit *
              </Label>
              <Input
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                placeholder="kg, piece, liter"
                required
                className="bg-card text-card-foreground border border-border shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerUnit" className="flex items-center gap-2 font-bold text-foreground">
                <IndianRupee className="w-4 h-4" />
                Price per Unit *
              </Label>
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerUnit}
                onChange={handleInputChange}
                placeholder="0.00"
                required
                className="bg-card text-card-foreground border border-border shadow-sm"
              />
            </div>
          </div>

          {/* Stock Status */}
          <div className="space-y-2">
            <Label htmlFor="stockStatus" className="flex items-center gap-2 font-bold text-foreground">
              <Package className="w-4 h-4" />
              Stock Status *
            </Label>
            <Select
              value={formData.stockStatus}
              onValueChange={(value) => handleSelectChange('stockStatus', value)}
            >
              <SelectTrigger className="bg-card text-card-foreground border border-border shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-bold text-foreground">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product description (optional)"
              rows={3}
              className="bg-card text-card-foreground border border-border shadow-sm"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 font-bold"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 font-bold bg-gradient-to-r from-primary to-indigo-500 hover:from-teal-700 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

