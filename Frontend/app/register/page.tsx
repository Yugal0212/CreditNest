'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Zap, ShieldCheck, TrendingUp, Store,
  Sun, Moon, Mail, Lock, User, ChevronRight, Eye, EyeOff, ShoppingBag,
  Phone, MapPin, AlertCircle, Loader2, BadgeCheck, Globe,
} from 'lucide-react';
import { AuthHero } from '@/components/AuthHero';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [shopName, setShopName]       = useState('');
  const [ownerName, setOwnerName]     = useState('');
  const [address, setAddress]         = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

  const { user, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme }        = useTheme();
  const router                        = useRouter();
  const isDark                        = theme === 'dark';

  const trustItems = [
    { icon: ShieldCheck, label: t('trust.otp_verified', 'OTP Verified') },
    { icon: BadgeCheck, label: t('trust.rbi_compliant', 'RBI Compliant') },
    { icon: Globe, label: t('trust.tls', '256-bit TLS') },
  ];

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/shop-owner/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          ownerName,
          address,
          phone,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errorMsgs = data.errors.map((e: any) => e.message).join('. ');
          throw new Error(errorMsgs || data.message || 'Registration failed');
        }
        throw new Error(data.message || 'Registration failed');
      }

      // Store registration data and redirect to OTP verification
      sessionStorage.setItem('pendingRegistration', JSON.stringify({
        identifier: data.identifier,
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
    <div className="auth-page min-h-screen bg-[#0D2235] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-full lg:grid-cols-[1.15fr_0.85fr]">

        {/* ══════════════ LEFT — HERO ══════════════ */}
        <div className="hidden lg:block lg:h-full lg:overflow-hidden">
          <AuthHero />
        </div>

        {/* ══════════════ RIGHT — FORM PANEL ══════════════ */}
        <section className="relative flex min-h-screen lg:min-h-0 lg:h-full lg:overflow-y-auto flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#1A5276] via-[#D4A017] to-[#1A5276] shrink-0" />

          <header className="flex items-center justify-between border-b border-[#F3EEE8] dark:border-slate-800 px-8 py-4">
            <Link href="/" className="flex items-center gap-2 lg:invisible">
              <img 
                src="/CreditNest.png" 
                alt="CreditNest Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-[13px] font-black tracking-wide text-[#0D2235]">CreditNest</span>
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
                  <p className="mb-2 text-[10.5px] font-black uppercase tracking-[0.32em] text-[#D4A017]">{t('auth.secure_onboarding', 'Secure Onboarding')}</p>
                  <h2 className="text-[1.7rem] font-black leading-[1.1] tracking-[-0.022em] text-[#0D2235] dark:text-slate-100"><span>{t('auth.create_your', 'Create your')}</span><br /><span>{t('auth.shop_owner_account', 'shop owner account')}</span></h2>
                  <p className="mt-2 text-[13px] text-[#A3A3A3] dark:text-slate-400"><span>{t('auth.complete_details_otp', 'Complete details below to receive OTP verification.')}</span></p>
                </div>

                <Link href="/login" className="mt-3 inline-flex rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 px-4 py-2 text-[12px] font-bold text-[#1A5276] dark:text-indigo-400 transition hover:bg-[#F5F0E8] dark:hover:bg-slate-900">
                  {t('auth.already_have_account_signin', 'Already have account? Sign in →')}
                </Link>
              </div>

              <div className="mb-6 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 px-4 py-3 text-[12px] text-[#6B7280] dark:text-slate-400">
                {t('auth.customer_accounts_created', 'Customer accounts are created by shop owners after purchase onboarding.')}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4.5">
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('auth.shop_name', 'Shop Name')}</Label>
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
                    <Label htmlFor="ownerName" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('auth.owner_name', 'Owner Name')}</Label>
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
                    <Label htmlFor="phone" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('auth.phone_number', 'Phone Number')}</Label>
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
                  <Label htmlFor="address" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('auth.shop_address', 'Shop Address')}</Label>
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
                  <Label htmlFor="email" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('auth.email_address', 'Email Address')}</Label>
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
                  <Label htmlFor="password" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('auth.password', 'Password')}</Label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9CA3AF] transition group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.pwd_placeholder', 'At least 6 characters')}
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

                <div className="flex items-start gap-3 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 px-4 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FB] dark:bg-slate-800">
                    <Mail className="h-3.5 w-3.5 text-[#1A5276] dark:text-indigo-400" />
                  </div>
                  <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                    {t('auth.otp_message', "We'll send a 6-digit OTP to your registered email and phone.")}
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-[#FCA5A5]/50 bg-[#FEF2F2] px-4 py-3.5">
                    <AlertCircle className="mt-px h-4 w-4 shrink-0 text-[#DC2626]" />
                    <p className="text-[12px] text-[#DC2626]"><span>{error}</span></p>
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
                      {t('auth.sending_otp', 'Sending OTP...')}
                    </>
                  ) : (
                    <>
                      <span>{t('auth.create_account_continue', 'Create account and continue')}</span>
                      <ChevronRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-[12px] text-[#A3A3A3] dark:text-slate-400">
                {t('auth.terms_privacy', 'By creating an account, you agree to our Terms and Privacy Policy.')}
              </p>

              <p className="mt-4 text-center text-[12.5px] text-[#A3A3A3] dark:text-slate-400 sm:hidden">
                {t('auth.already_have_account', 'Already have an account?')}{' '}
                <Link href="/login" className="font-bold text-[#0D2235] dark:text-slate-200 transition hover:text-[#D4A017] dark:hover:text-indigo-400">
                  {t('auth.sign_in', 'Sign in')}
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
