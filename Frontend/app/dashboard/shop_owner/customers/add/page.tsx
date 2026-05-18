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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      // Validate phone number
      if (formData.phone.length !== 10) {
        toast({
          title: 'Validation Error',
          description: 'Phone number must be exactly 10 digits',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      if (formData.email) data.append('email', formData.email);
      if (formData.address) data.append('address', formData.address);
      if (formData.workplace) data.append('workplace', formData.workplace);
      if (formData.photo) data.append('photo', formData.photo);

      console.log('Adding customer:', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || 'not provided',
      });

      const response = await shopOwnerAPI.addCustomer(data);
      
      console.log('Customer added successfully:', response.data);

      toast({
        title: 'Success',
        description: 'Customer added successfully',
      });

      router.push('/dashboard/shop_owner/customers');
    } catch (error: any) {
      console.error('Add customer error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Failed to add customer';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-3xl mx-auto">
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
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">Click to upload customer photo</p>
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
              className="bg-card text-card-foreground border border-border shadow-sm"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 font-bold text-foreground">
              <Phone className="w-4 h-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter 10-digit phone number"
              required
              minLength={10}
              maxLength={10}
              className="bg-card text-card-foreground border border-border shadow-sm"
            />
            <p className="text-xs text-muted-foreground">
              {formData.phone.length}/10 digits • Auto-formatted
            </p>
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
              placeholder="Enter email address (optional)"
              className="bg-card text-card-foreground border border-border shadow-sm"
            />
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

