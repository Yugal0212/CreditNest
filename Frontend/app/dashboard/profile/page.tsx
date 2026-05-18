'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bell, Globe, Moon, Sun, Lock, LogOut, ChevronRight, Shield, Smartphone, User, CheckCircle2, Copy, MapPin, Mail, Phone, CalendarDays, Edit3, Loader2 } from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProfilePage() {
  const { user, isAuthenticated, logout, checkAuth } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Open Edit Profile modal with current data
  const handleOpenEditProfile = () => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authAPI.updateProfile(editForm);
      toast({ title: 'Success', description: 'Profile updated successfully!', variant: 'default' });
      await checkAuth(); // Refresh user context data
      setIsEditProfileOpen(false);
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.response?.data?.message || 'Error updating profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match!', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      await authAPI.changePassword({ 
        currentPassword: passwordForm.currentPassword, 
        newPassword: passwordForm.newPassword 
      });
      toast({ title: 'Success', description: 'Password changed successfully!', variant: 'default' });
      setIsChangePasswordOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({ title: 'Change Failed', description: error.response?.data?.message || 'Error changing password', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated || !user) return null;

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  ] as const;

  const notificationItems = [
    { title: 'Push Notifications', description: 'Order & payment alerts', defaultOn: true },
    { title: 'Order Updates', description: 'Status change notifications', defaultOn: true },
    { title: 'Security Alerts', description: 'Login and security events', defaultOn: true },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Copied to clipboard.' });
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'System Administrator',
    SHOP_OWNER: 'Verified Shop Owner',
    CUSTOMER: 'Valued Customer'
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Dynamic Profile Header Card */}
        <div 
          
          
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-2xl shadow-indigo-500/30 dark:shadow-indigo-400/30"
        >
          {/* Glassmorphic overlays */}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-[50px] rounded-full" />
          <div className="absolute top-1/2 -left-12 w-32 h-32 bg-indigo-300/20 blur-[30px] rounded-full" />
          
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-4xl sm:text-5xl font-black shadow-inner border border-white/30 text-white shrink-0">
                {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-3 -right-3 bg-primary rounded-full p-1.5 border-[3px] border-white/20 shadow-xl" title="Verified Account">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex justify-between items-start">
                <div className="inline-block px-3 py-1 mb-3 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest">
                  {roleLabels[user.role] || user.role.replace('_', ' ')}
                </div>
                <button 
                  onClick={handleOpenEditProfile}
                  className="bg-white/10 hover:bg-white/20 transition-colors p-2 rounded-full border border-white/20"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4 text-white" />
                </button>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black mb-1 truncate">{user.name}</h1>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mt-4 text-sm font-medium text-white/90">
                {user.email && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <Mail className="w-4 h-4 text-indigo-200" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                    <Phone className="w-4 h-4 text-indigo-200" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Account Metrics Bar */}
          <div className="relative bg-black/20 backdrop-blur-md border-t border-white/10 flex items-center justify-between p-4 px-6 md:px-8">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">Account ID</span>
              <span className="font-mono text-sm font-bold bg-white/10 px-2 py-0.5 rounded text-indigo-100">{user.id.slice(0,8).toUpperCase()}</span>
              <button onClick={() => handleCopy(user.id)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><Copy className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-bold font-mono">ACTIVE NOW</span>
            </div>
          </div>
        </div>

        {/* Main Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Language Settings */}
          <div
           
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 dark:shadow-indigo-400/20">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-foreground text-base">Language</h2>
                <p className="text-xs font-bold text-muted-foreground">Select your region</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {languages.map(({ code, name, flag }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                    language === code
                      ? 'border-primary bg-indigo-500/5 dark:bg-indigo-400/10 shadow-md shadow-indigo-500/10 dark:shadow-indigo-400/10'
                      : 'border-border hover:border-indigo-500/40 dark:border-indigo-400/40 bg-background'
                  }`}
                >
                  <span className="text-2xl drop-shadow-sm">{flag}</span>
                  <span className={`text-xs font-black tracking-wide ${language === code ? 'text-primary dark:text-indigo-400' : 'text-foreground'}`}>
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div
           
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 dark:shadow-indigo-400/20">
                {isDark ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="font-black text-foreground text-base">Appearance</h2>
                <p className="text-xs font-bold text-muted-foreground">Customize UI themes</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-background border-2 border-border hover:border-indigo-500/40 dark:border-indigo-400/40 transition-all group shadow-sm hover:shadow mt-1"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'bg-slate-800' : 'bg-indigo-500/10 dark:bg-indigo-400/10'}`}>
                  {isDark ? <Moon className="w-5 h-5 text-slate-200 drop-shadow" /> : <Sun className="w-5 h-5 text-primary dark:text-indigo-400 drop-shadow" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-foreground tracking-tight">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                  <p className="text-[11px] font-bold text-muted-foreground">Currently Active</p>
                </div>
              </div>
              <div className={`relative w-14 h-7 rounded-full transition-colors flex items-center px-1 shadow-inner ${isDark ? 'bg-primary' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all ${isDark ? 'ml-7' : 'ml-0'}`} />
              </div>
            </button>
          </div>

        </div>

        {/* Configurations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Notifications */}
          <div
           
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary dark:text-indigo-400" />
              </div>
              <h2 className="font-black text-foreground text-sm">Notifications</h2>
            </div>
            <div className="space-y-3">
              {notificationItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div>
                    <p className="text-[13px] font-black text-foreground group-hover:text-primary dark:text-indigo-400 transition-colors">{item.title}</p>
                    <p className="text-[11px] font-bold text-muted-foreground">{item.description}</p>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full shadow-inner ${item.defaultOn ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all flex items-center justify-center ${item.defaultOn ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Security */}
          <div
           
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all shadow-lg flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="font-black text-foreground text-sm">Security Hub</h2>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { icon: Lock, label: 'Change Password', onClick: () => setIsChangePasswordOpen(true), hideFor: 'CUSTOMER' },
                { icon: Smartphone, label: 'Two-Factor Auth' },
                { icon: User, label: 'Account Data' },
              ].filter(item => item.hideFor !== user.role).map(({ icon: Icon, label, onClick }, i) => (
                <button key={i} onClick={onClick} className="w-full flex items-center justify-between p-2.5 rounded-xl bg-background hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-border hover:border-indigo-500/20 dark:border-indigo-400/20 transition-all group">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary dark:text-indigo-400 transition-colors" />
                    <span className="text-xs font-black text-foreground tracking-wide group-hover:text-primary dark:text-indigo-400">{label}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Power Controls */}
        <div
         
          className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-center border-t border-border"
        >
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-10 py-3.5 rounded-xl border hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-500 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            <span className="tracking-wide text-base">Sign Out</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center pb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Smart Credit Management System</p>
          <p className="text-[9px] font-bold text-muted-foreground/30 mt-1">v.1.2.0-build.82</p>
        </div>

      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={editForm.email} 
                onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                type="tel"
                value={editForm.phone} 
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Ensure your account is using a long, strong password to stay secure.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input 
                type="password"
                value={passwordForm.currentPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password"
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input 
                type="password"
                value={passwordForm.confirmPassword} 
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                required 
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

