'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import {
  Zap, ShieldCheck, TrendingUp, Users, Sun, Moon, Store, User,
  Mail, Lock, ChevronRight, Eye, EyeOff, Phone, AlertCircle,
  Loader2, ArrowRight, BadgeCheck, Globe,
} from 'lucide-react';
import { normalizePhoneNumber, isPhoneNumber } from '@/lib/phoneValidation';
import { Button } from '@/components/ui/button';
import { AuthHero } from '@/components/AuthHero';
import { useTranslation } from 'react-i18next';

/* ── static data (translated) ── */
const roles: { value: UserRole; labelKey: string; icon: React.ElementType; descKey: string }[] = [
  { value: 'SHOP_OWNER', labelKey: 'roles.SHOP_OWNER', icon: Store, descKey: 'roles.shop_owner_desc' },
  { value: 'CUSTOMER',   labelKey: 'roles.CUSTOMER',   icon: User,  descKey: 'roles.customer_desc' },
];

const trustItems = [
  { icon: ShieldCheck, labelKey: 'trust.otp_verified' },
  { icon: BadgeCheck,  labelKey: 'trust.rbi_compliant' },
  { icon: Globe,       labelKey: 'trust.tls' },
];

/* ─────────────────────────────────────── */
export default function LoginPage() {
  const { t } = useTranslation();
  /* ── ALL STATE & LOGIC UNCHANGED ── */
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('CUSTOMER');
  const [loginMethod, setLoginMethod]   = useState<'otp' | 'password'>('password');
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');

  const [isForgotOpen, setIsForgotOpen]           = useState(false);
  const [forgotStep, setForgotStep]               = useState<1 | 2>(1);
  const [forgotIdentifier, setForgotIdentifier]   = useState('');
  const [forgotOtp, setForgotOtp]                 = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [isForgotLoading, setIsForgotLoading]     = useState(false);

  const [secretTapCount, setSecretTapCount]       = useState(0);

  const {
    shopOwnerLogin, shopOwnerPasswordLogin,
    customerLogin, user, isLoading: authLoading,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!authLoading && user) {
      router.push(
        user.role === 'ADMIN'        ? '/dashboard/admin'
        : user.role === 'SHOP_OWNER' ? '/dashboard/shop_owner'
        : '/dashboard/customer'
      );
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (selectedRole === 'CUSTOMER') {
      setLoginMethod('otp');
    }
  }, [selectedRole]);

  useEffect(() => {
    if (secretTapCount >= 5) {
      router.push('/admin/login');
    }
    const timer = setTimeout(() => setSecretTapCount(0), 2000);
    return () => clearTimeout(timer);
  }, [secretTapCount, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      const norm = isPhoneNumber(identifier)
        ? normalizePhoneNumber(identifier)
        : identifier.toLowerCase().trim();

      if (selectedRole === 'SHOP_OWNER') {
        if (loginMethod === 'password') {
          if (!norm || !password) throw new Error('Please fill in all fields');
          await shopOwnerPasswordLogin(norm, password);
          router.push('/dashboard/shop_owner');
        } else {
          if (!norm) throw new Error('Please enter your phone or email');
          await shopOwnerLogin(norm);
          sessionStorage.setItem('pendingLogin', JSON.stringify({ identifier: norm, role: 'shop_owner' }));
          router.push('/verify-otp');
        }
      } else {
        if (!norm) throw new Error('Please enter your phone or email');
        await customerLogin(norm);
        sessionStorage.setItem('pendingLogin', JSON.stringify({ identifier: norm, role: 'customer' }));
        router.push('/verify-otp');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault(); setIsForgotLoading(true);
    try {
      await authAPI.requestPasswordReset(forgotIdentifier);
      toast({ title: 'OTP Sent', description: 'Check your phone/email for the reset OTP.' });
      setForgotStep(2);
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to send OTP.', variant: 'destructive' });
    } finally { setIsForgotLoading(false); }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault(); setIsForgotLoading(true);
    try {
      await authAPI.resetPassword({ identifier: forgotIdentifier, otp: forgotOtp, newPassword: forgotNewPassword });
      toast({ title: 'Password Reset', description: 'You can now sign in with your new password.' });
      setIsForgotOpen(false); setForgotStep(1);
      setForgotIdentifier(''); setForgotOtp(''); setForgotNewPassword('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to reset password.', variant: 'destructive' });
    } finally { setIsForgotLoading(false); }
  };

  const isLikelyPhone = identifier ? /^\+?[\d\s-]*$/.test(identifier) : true;
  const showPrefix    = isLikelyPhone && identifier.trim() !== '' && !identifier.startsWith('+');

  /* ─────── RENDER ─────── */
  return (
    <div className="auth-page min-h-screen bg-[#0D2235] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-full lg:grid-cols-[1.15fr_0.85fr]">

        {/* ══════════════ LEFT — HERO ══════════════ */}
        <div className="hidden lg:block lg:h-full lg:overflow-hidden">
          <AuthHero />
        </div>

        {/* ══════════════ RIGHT — FORM PANEL ══════════════ */}
        <section className="relative flex min-h-screen lg:min-h-0 lg:h-full lg:overflow-y-auto flex-col bg-white dark:bg-slate-900 transition-colors duration-300">

          {/* Top rainbow accent bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#1A5276] via-[#D4A017] to-[#1A5276] shrink-0" />

          {/* Nav */}
          <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-8 py-4 shrink-0">
            <div 
              onClick={() => setSecretTapCount(prev => prev + 1)}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <img 
                src="/CreditNest.png" 
                alt="CreditNest Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-[13px] font-black tracking-wide text-slate-900 dark:text-slate-100">CreditNest</span>
            </div>
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

          {/* Form body */}
          <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-12 lg:px-14 xl:px-16">
            <div className="mx-auto w-full max-w-[400px]">

              {/* Heading */}
              <div className="mb-8">
                <p className="mb-2 text-[10.5px] font-black uppercase tracking-[0.32em] text-[#D4A017]">
                  {t('login.portal_subtitle')}
                </p>
                <h2 className="text-[1.70rem] font-black leading-[1.1] tracking-[-0.022em] text-[#0D2235] dark:text-slate-100">
                  {t('login.title_part1')}<br />{t('login.title_part2')}
                </h2>
                <p className="mt-2 text-[13px] text-[#A3A3A3] dark:text-slate-400">
                  {t('login.subtitle')}
                </p>
              </div>

              {/* ── Role selector: segmented pill ── */}
              <div className="mb-7">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#C9BEB5]">{t('login.i_am_a')}</p>
                <div className="flex gap-0 rounded-[13px] border border-[#EDE8E0] dark:border-slate-800 bg-[#F9F6F2] dark:bg-slate-950 p-[5px]">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const active = selectedRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[9px] px-1.5 py-2.5 text-center transition-all duration-200 ${
                          active
                            ? 'bg-[#0D2235] dark:bg-slate-800 shadow-[0_2px_12px_rgba(13,34,53,0.25)]'
                            : 'hover:bg-white/70 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        {/* Gold top indicator */}
                        {active && (
                          <span className="absolute -top-px left-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-[#D4A017]" />
                        )}
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                          active ? 'bg-[#D4A017]/15' : 'bg-[#EDE8E0] dark:bg-slate-800'
                        }`}>
                          <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#D4A017]' : 'text-[#9CA3AF] dark:text-slate-400'}`} />
                        </div>
                        <span className={`text-[12px] font-bold leading-none ${active ? 'text-white' : 'text-[#6B7280] dark:text-slate-300'}`}>
                          {t(r.labelKey)}
                        </span>
                        <span className={`text-[10px] leading-none ${active ? 'text-white/45' : 'text-[#C9BEB5] dark:text-slate-500'}`}>
                          {t(r.descKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#F0EBE3] dark:bg-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C9BEB5] dark:text-slate-500">{t('login.credentials')}</span>
                <span className="h-px flex-1 bg-[#F0EBE3] dark:bg-slate-800" />
              </div>

              {selectedRole === 'SHOP_OWNER' && (
                <div className="mb-5">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#C9BEB5]">{t('login.login_method')}</p>
                  <div className="flex gap-2 rounded-[12px] border border-[#EDE8E0] dark:border-slate-800 bg-[#F9F6F2] dark:bg-slate-950 p-[5px]">
                    {(['password', 'otp'] as const).map((method) => {
                      const active = loginMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setLoginMethod(method)}
                          className={`flex-1 rounded-[9px] px-3 py-2 text-[12px] font-bold transition-all ${
                            active
                              ? 'bg-[#0D2235] text-white shadow-[0_2px_12px_rgba(13,34,53,0.25)]'
                              : 'text-[#6B7280] dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/50'
                          }`}
                        >
                          {method === 'password' ? t('login.password') : t('login.otp')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Customer notice */}
                {selectedRole === 'CUSTOMER' && (
                  <div className="flex items-start gap-3 rounded-xl border border-[#BFDBFE] dark:border-blue-900/30 bg-[#EFF6FF] dark:bg-blue-950/20 px-4 py-3.5">
                    <AlertCircle className="mt-px h-4 w-4 shrink-0 text-[#2563EB] dark:text-blue-400" />
                    <p className="text-[12px] leading-relaxed text-[#1D4ED8] dark:text-blue-300">
                      {t('login.customer_notice')}
                    </p>
                  </div>
                )}

                {/* Identifier */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="identifier" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">
                      {t('login.phone_or_email')}
                    </Label>
                  </div>
                  <div className="group relative">
                    <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-full items-center pl-3.5 gap-1.5">
                      {isLikelyPhone
                        ? <Phone className="h-[15px] w-[15px] text-[#9CA3AF] group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200 transition" />
                        : <Mail  className="h-[15px] w-[15px] text-[#9CA3AF] group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200 transition" />}
                      {showPrefix && (
                        <span className="border-r border-[#E5E7EB] dark:border-slate-800 pr-2.5 text-[12.5px] font-black text-[#0D2235] dark:text-slate-200">+91</span>
                      )}
                    </div>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="98765 43210 or user@email.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isLoading}
                      className={`h-[50px] rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 ${
                        showPrefix ? 'pl-[88px]' : 'pl-10'
                      } text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] dark:placeholder:text-slate-600 transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6`}
                    />
                  </div>
                </div>

                {/* Password */}
                {(selectedRole === 'SHOP_OWNER' && loginMethod === 'password') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('login.password')}</Label>
                      <button
                        type="button"
                        onClick={() => setIsForgotOpen(true)}
                        className="text-[11px] font-bold text-[#1A5276] dark:text-indigo-400 transition hover:text-[#D4A017] dark:hover:text-indigo-300"
                      >
                        {t('login.forgot_password')}
                      </button>
                    </div>
                    <div className="group relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[15px] w-[15px] -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200 transition" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('login.password_placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-[50px] rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 pr-12 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] dark:placeholder:text-slate-600 transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#9CA3AF] transition hover:text-[#0D2235] dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* OTP info */}
                {((selectedRole === 'SHOP_OWNER' && loginMethod === 'otp') || selectedRole === 'CUSTOMER') && (
                  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 px-4 py-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FB] dark:bg-slate-800">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#1A5276] dark:text-indigo-400" />
                    </div>
                    <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                      {t('login.otp_notice')}
                    </p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 rounded-xl border border-[#FCA5A5]/50 dark:border-red-950 bg-[#FEF2F2] dark:bg-red-950/20 px-4 py-3.5">
                      <AlertCircle className="mt-px h-4 w-4 shrink-0 text-[#DC2626] dark:text-red-400" />
                      <p className="text-[12px] text-[#DC2626] dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-2 flex h-[52px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#D4A017] text-[14px] font-bold text-white shadow-[0_4px_22px_rgba(212,160,23,0.36)] transition-all duration-200 hover:bg-[#C09214] hover:shadow-[0_6px_28px_rgba(212,160,23,0.44)] active:scale-[0.987] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {/* Shine sweep animation */}
                  <span className="pointer-events-none absolute inset-0 translate-x-[-115%] skew-x-[-18deg] bg-white/14 transition-transform duration-500 group-hover:translate-x-[115%]" />
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{selectedRole === 'ADMIN' ? t('common.authenticating') : t('common.processing')}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedRole === 'SHOP_OWNER' && loginMethod === 'password'
                          ? t('login.btn_secure_signin')
                          : t('login.btn_send_otp')}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-7 space-y-4">
                <p className="text-center text-[12.5px] text-[#A3A3A3] dark:text-slate-400">
                  {selectedRole === 'SHOP_OWNER' ? (
                    <>
                      {t('login.not_registered_yet', 'Not registered?')}{' '}
                      <Link href="/register" className="font-bold text-[#1A5276] dark:text-indigo-400 hover:text-[#D4A017] dark:hover:text-indigo-300 transition-colors">
                        {t('login.create_shop_account', 'Create a shop owner account →')}
                      </Link>
                    </>
                  ) : (
                    t('login.footer_customer')
                  )}
                </p>

                {/* Trust row */}
                <div className="flex items-center justify-center gap-4 border-t border-[#F3EEE8] dark:border-slate-800 pt-4">
                  {trustItems.map(({ icon: Icon, labelKey }, i) => (
                    <React.Fragment key={labelKey}>
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-[#1E8449] dark:text-emerald-400" />
                        <span className="text-[11px] font-semibold text-[#B0ABA5] dark:text-slate-500">{t(labelKey)}</span>
                      </div>
                      {i < trustItems.length - 1 && <span className="h-3 w-px bg-[#E5E7EB] dark:bg-slate-800" />}
                    </React.Fragment>
                  ))}
                </div>

                <p className="text-center text-[10.5px] text-[#D1D5DB] dark:text-slate-600">
                  {t('login.copyright', { year: new Date().getFullYear() })}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ══════════════ FORGOT PASSWORD DIALOG ══════════════ */}
      <Dialog open={isForgotOpen} onOpenChange={(open) => {
        setIsForgotOpen(open);
        if (!open) {
          setForgotStep(1); setForgotIdentifier('');
          setForgotOtp(''); setForgotNewPassword('');
        }
      }}>
        <DialogContent className="overflow-hidden rounded-2xl border-[#EDE8E0] dark:border-slate-800 bg-white dark:bg-slate-900 p-0 sm:max-w-[400px]">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#1A5276] via-[#D4A017] to-[#1A5276]" />
          <div className="p-6">
            <DialogHeader>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#0D2235] dark:bg-slate-800">
                <Lock className="h-5 w-5 text-[#D4A017]" />
              </div>
              <DialogTitle className="text-[17px] font-black text-[#0D2235] dark:text-slate-100">{t('forgot.title')}</DialogTitle>
              <DialogDescription className="text-[12.5px] text-[#9CA3AF] dark:text-slate-400">
                {forgotStep === 1
                  ? t('forgot.desc_step1')
                  : t('forgot.desc_step2')}
              </DialogDescription>
            </DialogHeader>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('forgot.label_identifier')}</Label>
                  <Input
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder={t('forgot.placeholder_identifier')}
                    required
                    className="h-[46px] rounded-xl border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 text-[13px] text-slate-900 dark:text-slate-100 focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                  />
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)} className="rounded-xl border-[#E5E7EB] dark:border-slate-800 text-[13px] text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">{t('common.cancel')}</Button>
                  <Button type="submit" disabled={isForgotLoading} className="rounded-xl bg-[#0D2235] dark:bg-slate-800 text-[13px] text-white hover:bg-[#1A5276] dark:hover:bg-slate-700">
                    {isForgotLoading ? t('forgot.btn_sending') : t('forgot.btn_send')}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={handleForgotReset} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('forgot.label_otp')}</Label>
                  <Input
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder={t('forgot.placeholder_otp')}
                    maxLength={6}
                    required
                    className="h-[50px] rounded-xl border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 text-center text-[22px] font-black tracking-[0.55em] text-slate-900 dark:text-slate-100 focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold text-[#374151] dark:text-slate-300">{t('forgot.label_new_pass')}</Label>
                  <Input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder={t('forgot.placeholder_new_pass')}
                    required
                    className="h-[46px] rounded-xl border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 text-[13px] text-slate-900 dark:text-slate-100 focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                  />
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setForgotStep(1)} className="rounded-xl border-[#E5E7EB] dark:border-slate-800 text-[13px] text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">{t('common.back')}</Button>
                  <Button type="submit" disabled={isForgotLoading} className="rounded-xl bg-[#0D2235] dark:bg-slate-800 text-[13px] text-white hover:bg-[#1A5276] dark:hover:bg-slate-700">
                    {isForgotLoading ? t('forgot.btn_resetting') : t('forgot.btn_reset')}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}