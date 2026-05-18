'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import {
  Zap, ShieldCheck, TrendingUp, Store,
  Sun, Moon, Mail, Lock, User, ChevronRight, Eye, EyeOff, ShoppingBag,
  Phone, MapPin, AlertCircle, Loader2, BadgeCheck, Globe,
} from 'lucide-react';

const benefits = [
  { icon: ShieldCheck, text: 'OTP-verified onboarding', color: 'text-[#D4A017]' },
  { icon: TrendingUp, text: 'Daily dues tracking', color: 'text-[#D4A017]' },
  { icon: Store, text: 'Built for shop owners', color: 'text-[#D4A017]' },
];

const floatingIcons = [
  { icon: Zap, size: 'h-9 w-9', position: 'left-[9%] top-[16%]' },
  { icon: Store, size: 'h-8 w-8', position: 'left-[80%] top-[14%]' },
  { icon: ShieldCheck, size: 'h-8 w-8', position: 'left-[11%] top-[76%]' },
  { icon: TrendingUp, size: 'h-7 w-7', position: 'left-[79%] top-[79%]' },
];

const trustItems = [
  { icon: ShieldCheck, label: 'OTP Verified' },
  { icon: BadgeCheck, label: 'RBI Compliant' },
  { icon: Globe, label: '256-bit TLS' },
];

const stats = [
  { value: '5,000+', label: 'Active Stores' },
  { value: '₹200M+', label: 'Credit Tracked' },
  { value: '99.9%', label: 'Uptime SLA' },
];

export default function RegisterPage() {
  const [shopName, setShopName]       = useState('');
  const [ownerName, setOwnerName]     = useState('');
  const [address, setAddress]         = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpMethod, setOtpMethod]     = useState<'email' | 'sms'>('sms');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

  const { user, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme }        = useTheme();
  const router                        = useRouter();
  const isDark                        = theme === 'dark';

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const dashboardRoute = user.role === 'ADMIN' 
        ? '/dashboard/admin'
        : user.role === 'SHOP_OWNER'
          ? '/dashboard/shop_owner'
          : '/dashboard/customer'
      router.push(dashboardRoute)
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (!shopName || !ownerName || !address || !phone || !email || !password) {
        throw new Error('Please fill in all fields');
      }
      
      // Call shop owner registration API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/shop-owner/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          ownerName,
          address,
          phone,
          email,
          password,
          otpMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store registration data and redirect to OTP verification
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        identifier: data.identifier,
        otpMethod: data.otpMethod,
        registrationData: data.registrationData,
        role: 'shop_owner'
      }));

      router.push('/verify-otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#0D2235]">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[#0D2235]" />
          <div className="absolute inset-0 opacity-[0.16] bg-[radial-gradient(circle,#5DADE2_1px,transparent_1px)] bg-size-[28px_28px]" />
          <div className="absolute -bottom-48 -right-24 h-145 w-145 rounded-full bg-[#D4A017]/10 blur-[100px]" />
          <div className="absolute -left-32 -top-32 h-105 w-105 rounded-full bg-[#2E86C1]/12 blur-[80px]" />
          <div className="absolute left-0 top-[62%] h-px w-full rotate-[-15deg] scale-x-150 bg-linear-to-r from-transparent via-[#D4A017]/25 to-transparent" />

          {floatingIcons.map((fi, i) => {
            const Icon = fi.icon;
            return (
              <div key={i} className={`absolute text-white/20 ${fi.position}`}>
                <Icon className={fi.size} />
              </div>
            );
          })}

          <div className="relative z-10 flex flex-col px-14 pt-14 xl:px-20">
            <div className="mb-10 flex items-center gap-3.5">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#D4A017]/35 bg-[#D4A017]/10">
                <Zap className="h-6 w-6 text-[#D4A017]" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0D2235] bg-[#1E8449]" />
              </div>
              <div>
                <p className="text-[10.5px] font-black uppercase tracking-[0.38em] text-white/35">Smart Credit</p>
                <p className="mt-0.5 text-[15px] font-black leading-none tracking-wide text-white">Management System</p>
              </div>
            </div>

            <p className="mb-4 text-[10.5px] font-black uppercase tracking-[0.30em] text-[#D4A017]">
              Trusted by 5,000+ businesses across India
            </p>

            <h1 className="text-[3.1rem] font-black leading-[1.05] tracking-[-0.025em] text-white xl:text-[3.6rem]">
              Launch your shop<br />
              <span className="text-[#D4A017]">credit system</span>{' '}
              <span className="relative inline-block">
                today.
                <span className="absolute -bottom-1 left-0 h-0.75 w-full rounded-full bg-[#D4A017]/35" />
              </span>
            </h1>

            <p className="mt-5 max-w-85 text-[14px] leading-[1.80] text-white/50">
              Create your shop owner account and start onboarding customers, tracking dues, and collections with full visibility.
            </p>

            <div className="mt-9 space-y-3">
              {[
                'Setup in less than 2 minutes',
                'Daily credit entries with insights',
                'Secure OTP verification flow',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/15">
                    <ChevronRight className="h-3 w-3 text-[#D4A017]" />
                  </div>
                  <span className="text-[13px] font-medium text-white/60">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 px-14 pb-14 xl:px-20">
            <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/4">
              {stats.map(({ value, label }) => (
                <div key={label} className="px-5 py-5">
                  <p className="text-[1.6rem] font-black leading-none text-white">{value}</p>
                  <p className="mt-1.5 text-[10.5px] font-bold uppercase tracking-widest text-white/35">{label}</p>
                </div>
              ))}
            </div>

            <div className="mb-6 space-y-2.5">
              {benefits.map(({ icon: Icon, text, color }, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/8 px-4 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D4A017]/20">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <span className="text-[13px] font-semibold text-white/90">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-5">
              {trustItems.map(({ icon: Icon, label }, i) => (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-[#D4A017]" />
                    <span className="text-[11px] font-semibold text-white/40">{label}</span>
                  </div>
                  {i < trustItems.length - 1 && <span className="h-3 w-px bg-white/12" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
          <div className="h-0.75 w-full bg-linear-to-r from-[#1A5276] via-[#D4A017] to-[#1A5276]" />

          <header className="flex items-center justify-between border-b border-[#F3EEE8] dark:border-slate-800 px-8 py-4">
            <Link href="/" className="flex items-center gap-2 lg:invisible">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D2235]">
                <Zap className="h-4 w-4 text-[#D4A017]" />
              </span>
              <span className="text-[13px] font-black tracking-wide text-[#0D2235]">SCMS</span>
            </Link>

            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EDE8E0] dark:border-slate-800 text-[#9CA3AF] transition hover:border-[#1A5276]/30 dark:hover:border-slate-700 hover:bg-[#F5F0E8] dark:hover:bg-slate-800 hover:text-[#1A5276] dark:hover:text-indigo-400"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-12 lg:px-14 xl:px-16">
            <div className="mx-auto w-full max-w-105">
              <div className="mb-8">
                <div>
                  <p className="mb-2 text-[10.5px] font-black uppercase tracking-[0.32em] text-[#D4A017]">Secure Onboarding</p>
                  <h2 className="text-[1.7rem] font-black leading-[1.1] tracking-[-0.022em] text-[#0D2235] dark:text-slate-100">Create your<br />shop owner account</h2>
                  <p className="mt-2 text-[13px] text-[#A3A3A3] dark:text-slate-400">Complete details below to receive OTP verification.</p>
                </div>

                <Link href="/login" className="mt-3 inline-flex rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 px-4 py-2 text-[12px] font-bold text-[#1A5276] dark:text-indigo-400 transition hover:bg-[#F5F0E8] dark:hover:bg-slate-900">
                  Already have account? Sign in →
                </Link>
              </div>

              <div className="mb-6 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 px-4 py-3 text-[12px] text-[#6B7280] dark:text-slate-400">
                Customer accounts are created by shop owners after purchase onboarding.
              </div>

              <form onSubmit={handleSubmit} className="space-y-4.5">
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Shop Name</Label>
                  <div className="group relative">
                    <ShoppingBag className="pointer-events-none absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9CA3AF] transition group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200" />
                    <Input
                      id="shopName"
                      type="text"
                      placeholder="Sunrise Provision Store"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      disabled={isLoading}
                      className="h-12.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Owner Name</Label>
                    <div className="group relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9CA3AF] transition group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200" />
                      <Input
                        id="ownerName"
                        type="text"
                        placeholder="Ravi Sharma"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        disabled={isLoading}
                        className="h-12.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Phone Number</Label>
                    <div className="group relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9CA3AF] transition group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                        className="h-12.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Shop Address</Label>
                  <div className="group relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9CA3AF] transition group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="123 Main Road, City"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={isLoading}
                      className="h-12.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Email Address</Label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9CA3AF] transition group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="owner@shop.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Password</Label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9CA3AF] transition group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12.5 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 pr-11 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#9CA3AF] transition hover:text-[#0D2235] dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Receive OTP Via</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpMethod('sms')}
                      className={`rounded-xl border px-3 py-2.5 text-[12px] font-bold transition ${
                        otpMethod === 'sms'
                          ? 'border-[#0D2235] dark:border-slate-800 bg-[#0D2235] dark:bg-slate-800 text-white shadow-[0_2px_12px_rgba(13,34,53,0.22)]'
                          : 'border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 text-[#6B7280] dark:text-slate-400 hover:border-[#1A5276]/40'
                      }`}
                    >
                      SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpMethod('email')}
                      className={`rounded-xl border px-3 py-2.5 text-[12px] font-bold transition ${
                        otpMethod === 'email'
                          ? 'border-[#0D2235] dark:border-slate-800 bg-[#0D2235] dark:bg-slate-800 text-white shadow-[0_2px_12px_rgba(13,34,53,0.22)]'
                          : 'border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 text-[#6B7280] dark:text-slate-400 hover:border-[#1A5276]/40'
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-[#FCA5A5]/50 bg-[#FEF2F2] px-4 py-3.5">
                    <AlertCircle className="mt-px h-4 w-4 shrink-0 text-[#DC2626]" />
                    <p className="text-[12px] text-[#DC2626]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-1 flex h-13 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#D4A017] text-[14px] font-bold text-white shadow-[0_4px_22px_rgba(212,160,23,0.36)] transition-all duration-200 hover:bg-[#C09214] hover:shadow-[0_6px_28px_rgba(212,160,23,0.44)] active:scale-[0.987] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="pointer-events-none absolute inset-0 translate-x-[-115%] skew-x-[-18deg] bg-white/14 transition-transform duration-500 group-hover:translate-x-[115%]" />
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <span>Create account and continue</span>
                      <ChevronRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-[12px] text-[#A3A3A3] dark:text-slate-400">
                By creating an account, you agree to our Terms and Privacy Policy.
              </p>

              <p className="mt-4 text-center text-[12.5px] text-[#A3A3A3] dark:text-slate-400 sm:hidden">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-[#0D2235] dark:text-slate-200 transition hover:text-[#D4A017] dark:hover:text-indigo-400">
                  Sign in
                </Link>
              </p>

              <div className="mt-5 flex items-center justify-center gap-4 border-t border-[#F3EEE8] dark:border-slate-800 pt-4">
                {trustItems.map(({ icon: Icon, label }, i) => (
                  <React.Fragment key={label}>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-[#1E8449]" />
                      <span className="text-[11px] font-semibold text-[#B0ABA5]">{label}</span>
                    </div>
                    {i < trustItems.length - 1 && <span className="h-3 w-px bg-[#E5E7EB]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

