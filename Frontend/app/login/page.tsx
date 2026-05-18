'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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

/* ── static data (unchanged) ── */
const roles: { value: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'ADMIN',      label: 'Admin',      icon: Zap,   desc: 'System control' },
  { value: 'SHOP_OWNER', label: 'Shop Owner', icon: Store, desc: 'Store dashboard' },
  { value: 'CUSTOMER',   label: 'Customer',   icon: User,  desc: 'Credit overview' },
];

const trustItems = [
  { icon: ShieldCheck, label: 'OTP Verified' },
  { icon: BadgeCheck,  label: 'RBI Compliant' },
  { icon: Globe,       label: '256-bit TLS' },
];

const stats = [
  { value: '5,000+', label: 'Active Stores' },
  { value: '₹200M+', label: 'Credit Tracked' },
  { value: '99.9%',  label: 'Uptime SLA' },
];

/* ─────────────────────────────────────── */
export default function LoginPage() {
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

  const {
    login, shopOwnerLogin, shopOwnerPasswordLogin,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      const norm = isPhoneNumber(identifier)
        ? normalizePhoneNumber(identifier)
        : identifier.toLowerCase().trim();

      if (selectedRole === 'ADMIN') {
        if (!identifier || !password) throw new Error('Please fill in all fields');
        await login(identifier, password, selectedRole);
        router.push('/dashboard/admin');
      } else if (selectedRole === 'SHOP_OWNER') {
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

  const isLikelyPhone = identifier ? /^\+?[\d\s-]*$/.test(identifier) : selectedRole !== 'ADMIN';
  const showPrefix    = isLikelyPhone && identifier.trim() !== '' && !identifier.startsWith('+');

  /* ─────── RENDER ─────── */
  return (
    <div className="auth-page min-h-screen bg-[#0D2235]">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">

        {/* ══════════════ LEFT — HERO ══════════════ */}
        <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">

          {/* Deep navy base */}
          <div className="absolute inset-0 bg-[#0D2235]" />

          {/* Dot-grid texture — signature detail */}
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: 'radial-gradient(circle, #5DADE2 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Atmospheric orbs */}
          <div className="absolute -bottom-48 -right-24 h-[580px] w-[580px] rounded-full bg-[#D4A017]/10 blur-[100px]" />
          <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#2E86C1]/12 blur-[80px]" />

          {/* Diagonal accent line */}
          <div
            className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4A017]/25 to-transparent"
            style={{ top: '62%', transform: 'rotate(-15deg) scaleX(1.5)' }}
          />

          {/* ── TOP: Logo + Headline ── */}
          <div className="relative z-10 flex flex-col px-14 pt-14 xl:px-20">

            {/* Logo row */}
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

            {/* Eyebrow */}
            <p className="mb-4 text-[10.5px] font-black uppercase tracking-[0.30em] text-[#D4A017]">
              Trusted by 5,000+ businesses across India
            </p>

            {/* Main headline */}
            <h1 className="text-[3.1rem] font-black leading-[1.05] tracking-[-0.025em] text-white xl:text-[3.6rem]">
              Credit management<br />
              <span className="text-[#D4A017]">built for</span>{' '}
              <span className="relative inline-block">
                Bharat.
                <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#D4A017]/35" />
              </span>
            </h1>

            <p className="mt-5 max-w-[340px] text-[14px] leading-[1.80] text-white/50">
              One secure platform for admins, shop owners, and customers — track dues, verify logins, and keep every rupee accounted for.
            </p>

            {/* Feature checklist */}
            <div className="mt-9 space-y-3">
              {[
                'OTP-verified logins for every role',
                'Real-time credit & payment tracking',
                'Multilingual support across India',
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

          {/* ── BOTTOM: Stats + Trust badges ── */}
          <div className="relative z-10 px-14 pb-14 xl:px-20">

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04]">
              {stats.map(({ value, label }) => (
                <div key={label} className="px-5 py-5">
                  <p className="text-[1.6rem] font-black leading-none text-white">{value}</p>
                  <p className="mt-1.5 text-[10.5px] font-bold uppercase tracking-widest text-white/35">{label}</p>
                </div>
              ))}
            </div>

            {/* Trust badges */}
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

        {/* ══════════════ RIGHT — FORM PANEL ══════════════ */}
        <section className="relative flex min-h-screen flex-col bg-white dark:bg-slate-900 transition-colors duration-300">

          {/* Top rainbow accent bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#1A5276] via-[#D4A017] to-[#1A5276]" />

          {/* Nav */}
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

          {/* Form body */}
          <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-12 lg:px-14 xl:px-16">
            <div className="mx-auto w-full max-w-[400px]">

              {/* Heading */}
              <div className="mb-8">
                <p className="mb-2 text-[10.5px] font-black uppercase tracking-[0.32em] text-[#D4A017]">
                  Secure Access Portal
                </p>
                <h2 className="text-[1.70rem] font-black leading-[1.1] tracking-[-0.022em] text-[#0D2235] dark:text-slate-100">
                  Sign in to<br />Smart Credit
                </h2>
                <p className="mt-2 text-[13px] text-[#A3A3A3] dark:text-slate-400">
                  Select your role and continue securely.
                </p>
              </div>

              {/* ── Role selector: segmented pill ── */}
              <div className="mb-7">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#C9BEB5]">I am a</p>
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
                          {r.label}
                        </span>
                        <span className={`text-[10px] leading-none ${active ? 'text-white/45' : 'text-[#C9BEB5] dark:text-slate-500'}`}>
                          {r.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#F0EBE3] dark:bg-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C9BEB5] dark:text-slate-500">Credentials</span>
                <span className="h-px flex-1 bg-[#F0EBE3] dark:bg-slate-800" />
              </div>

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Customer notice */}
                {selectedRole === 'CUSTOMER' && (
                  <div className="flex items-start gap-3 rounded-xl border border-[#BFDBFE] dark:border-blue-900/30 bg-[#EFF6FF] dark:bg-blue-950/20 px-4 py-3.5">
                    <AlertCircle className="mt-px h-4 w-4 shrink-0 text-[#2563EB] dark:text-blue-400" />
                    <p className="text-[12px] leading-relaxed text-[#1D4ED8] dark:text-blue-300">
                      Customer accounts are created by shop owners. Contact your shop owner to activate your account.
                    </p>
                  </div>
                )}

                {/* Identifier */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="identifier" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">
                      {selectedRole === 'ADMIN' ? 'Email Address' : 'Phone or Email'}
                    </Label>
                    {selectedRole === 'SHOP_OWNER' && (
                      <button
                        type="button"
                        onClick={() => setLoginMethod(loginMethod === 'otp' ? 'password' : 'otp')}
                        className="text-[11px] font-bold text-[#1A5276] dark:text-indigo-400 transition hover:text-[#D4A017] dark:hover:text-indigo-300"
                      >
                        {loginMethod === 'otp' ? 'Use password →' : 'Use OTP →'}
                      </button>
                    )}
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
                      placeholder={selectedRole === 'ADMIN' ? 'admin@scms.com' : '98765 43210 or user@email.com'}
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
                {(selectedRole === 'ADMIN' || (selectedRole === 'SHOP_OWNER' && loginMethod === 'password')) && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Password</Label>
                      <button
                        type="button"
                        onClick={() => setIsForgotOpen(true)}
                        className="text-[11px] font-bold text-[#1A5276] dark:text-indigo-400 transition hover:text-[#D4A017] dark:hover:text-indigo-300"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="group relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[15px] w-[15px] -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200 transition" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
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
                      A secure 6-digit OTP will be sent to verify your identity.
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
                    {error.toLowerCase().includes('account not found') && selectedRole === 'SHOP_OWNER' && (
                      <Link
                        href="/register"
                        className="block rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 px-4 py-3 text-center text-[13px] font-bold text-[#1A5276] dark:text-indigo-400 transition hover:bg-[#F5F0E8] dark:hover:bg-slate-900"
                      >
                        Create shop owner account →
                      </Link>
                    )}
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
                      <span>{selectedRole === 'ADMIN' ? 'Authenticating…' : 'Processing…'}</span>
                    </>
                  ) : (
                    <>
                      <span>{selectedRole === 'ADMIN' ? 'Sign In to Dashboard' : 'Continue Securely'}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-7 space-y-4">
                <p className="text-center text-[12.5px] text-[#A3A3A3] dark:text-slate-400">
                  New shop owner?{' '}
                  <Link href="/register" className="font-bold text-[#0D2235] dark:text-slate-200 transition hover:text-[#D4A017] dark:hover:text-indigo-400">
                    Create an account
                  </Link>
                </p>

                {/* Trust row */}
                <div className="flex items-center justify-center gap-4 border-t border-[#F3EEE8] dark:border-slate-800 pt-4">
                  {trustItems.map(({ icon: Icon, label }, i) => (
                    <React.Fragment key={label}>
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-[#1E8449] dark:text-emerald-400" />
                        <span className="text-[11px] font-semibold text-[#B0ABA5] dark:text-slate-500">{label}</span>
                      </div>
                      {i < trustItems.length - 1 && <span className="h-3 w-px bg-[#E5E7EB] dark:bg-slate-800" />}
                    </React.Fragment>
                  ))}
                </div>

                <p className="text-center text-[10.5px] text-[#D1D5DB] dark:text-slate-600">
                  © {new Date().getFullYear()} Smart Credit Management System
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
              <DialogTitle className="text-[17px] font-black text-[#0D2235] dark:text-slate-100">Reset Password</DialogTitle>
              <DialogDescription className="text-[12.5px] text-[#9CA3AF] dark:text-slate-400">
                {forgotStep === 1
                  ? 'Enter your registered email or phone to receive a reset OTP.'
                  : 'Enter the OTP and set your new password.'}
              </DialogDescription>
            </DialogHeader>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold text-[#374151] dark:text-slate-300">Email or Phone Number</Label>
                  <Input
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="+919327117231 or admin@scms.com"
                    required
                    className="h-[46px] rounded-xl border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 text-[13px] text-slate-900 dark:text-slate-100 focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                  />
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)} className="rounded-xl border-[#E5E7EB] dark:border-slate-800 text-[13px] text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
                  <Button type="submit" disabled={isForgotLoading} className="rounded-xl bg-[#0D2235] dark:bg-slate-800 text-[13px] text-white hover:bg-[#1A5276] dark:hover:bg-slate-700">
                    {isForgotLoading ? 'Sending…' : 'Send OTP'}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <form onSubmit={handleForgotReset} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold text-[#374151] dark:text-slate-300">6-digit OTP</Label>
                  <Input
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="• • • • • •"
                    maxLength={6}
                    required
                    className="h-[50px] rounded-xl border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 text-center text-[22px] font-black tracking-[0.55em] text-slate-900 dark:text-slate-100 focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-bold text-[#374151] dark:text-slate-300">New Password</Label>
                  <Input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-[46px] rounded-xl border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 text-[13px] text-slate-900 dark:text-slate-100 focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                  />
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setForgotStep(1)} className="rounded-xl border-[#E5E7EB] dark:border-slate-800 text-[13px] text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">← Back</Button>
                  <Button type="submit" disabled={isForgotLoading} className="rounded-xl bg-[#0D2235] dark:bg-slate-800 text-[13px] text-white hover:bg-[#1A5276] dark:hover:bg-slate-700">
                    {isForgotLoading ? 'Resetting…' : 'Reset Password'}
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