'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, User, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { shopOwnerAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AddCustomer() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    workplace: '',
    photo: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-format phone number - remove non-digits and limit to 10 digits
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      const formatted = digitsOnly.slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
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
      setFormErrors({});
      const errors: Record<string, string> = {};

      if (!formData.name.trim()) errors.name = 'Name is required';
      
      const phoneStr = formData.phone.trim();
      const emailStr = formData.email.trim();

      if (!phoneStr && !emailStr) {
        errors.phone = 'Either phone or email is required';
        errors.email = 'Either phone or email is required';
      } else {
        if (phoneStr && phoneStr.length !== 10) {
          errors.phone = 'Phone number must be exactly 10 digits';
        }
        if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
          errors.email = 'Please enter a valid email address';
        }
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append('name', formData.name);
      if (formData.phone.trim()) data.append('phone', formData.phone);
      if (formData.email.trim()) data.append('email', formData.email);
      if (formData.address) data.append('address', formData.address);
      if (formData.workplace) data.append('workplace', formData.workplace);
      if (formData.photo) data.append('photo', formData.photo);

      setUploadProgress(1); // Start progress bar

      const response = await shopOwnerAPI.addCustomer(data, (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      toast({
        title: 'Success',
        description: 'Customer added successfully',
      });

      router.push('/dashboard/shop_owner/customers');
    } catch (error: any) {
      console.error('Add customer error:', error);
      
      // Handle express-validator validation errors array from backend
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const apiErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.path || err.param) {
            apiErrors[err.path || err.param] = err.msg;
          }
        });
        setFormErrors(apiErrors);
        toast({
          title: 'Validation Error',
          description: 'Please check the form for errors.',
          variant: 'destructive',
        });
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to add customer';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
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
          <h1 className="text-2xl md:text-3xl font-black text-foreground">Add New Customer</h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium">Add a new customer to your shop</p>
        </div>
      </div>

      <div
       
       
       
        className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all max-w-2xl p-4 md:p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-white" />
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
            <p className="text-sm text-muted-foreground">Click to upload customer photo</p>

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

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 font-bold text-foreground">
              <User className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter customer name"
              required
              className={`bg-card text-card-foreground shadow-sm ${formErrors.name ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
            />
            {formErrors.name && <p className="text-sm text-red-500 font-medium">{formErrors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 font-bold text-foreground">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
              className={`bg-card text-card-foreground shadow-sm ${formErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {formData.phone.length}/10 digits • Auto-formatted
              </p>
              {formErrors.phone && <p className="text-sm text-red-500 font-medium">{formErrors.phone}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 font-bold text-foreground">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              className={`bg-card text-card-foreground shadow-sm ${formErrors.email ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
            />
            {formErrors.email && <p className="text-sm text-red-500 font-medium">{formErrors.email}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2 font-bold text-foreground">
              <MapPin className="w-4 h-4" />
              Address
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address (optional)"
              rows={3}
              className="bg-card text-card-foreground border border-border shadow-sm"
            />
          </div>

          {/* Workplace */}
          <div className="space-y-2">
            <Label htmlFor="workplace" className="flex items-center gap-2 font-bold text-foreground">
              <Briefcase className="w-4 h-4" />
              Workplace
            </Label>
            <Input
              id="workplace"
              name="workplace"
              value={formData.workplace}
              onChange={handleInputChange}
              placeholder="Enter workplace (optional)"
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
              {loading ? 'Adding...' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

