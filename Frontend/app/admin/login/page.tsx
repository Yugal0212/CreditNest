'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, User, Sun, Moon, AlertCircle } from 'lucide-react';
import { AuthHero } from '@/components/AuthHero';
import { useTranslation } from 'react-i18next';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!username || !password) {
        throw new Error(t('common.required', 'Please fill in all fields'));
      }
      await login(username, password, 'ADMIN');
      router.push('/dashboard/admin');
    } catch (err: any) {
      setError(err?.message || t('common.error', 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#0D2235] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-full lg:grid-cols-[1.15fr_0.85fr]">

        {/* ══════════════ LEFT — HERO ══════════════ */}
        <div className="hidden lg:block lg:h-full lg:overflow-hidden">
          <AuthHero title="Restricted Console" subtitle="Admins." />
        </div>

        {/* ══════════════ RIGHT — FORM PANEL ══════════════ */}
        <section className="relative flex min-h-screen lg:min-h-0 lg:h-full lg:overflow-y-auto flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
          <div className="h-[3px] w-full bg-gradient-to-r from-[#1A5276] via-[#D4A017] to-[#1A5276] shrink-0" />

          {/* Nav */}
          <header className="flex items-center justify-between border-b border-[#F3EEE8] dark:border-slate-800 px-8 py-4 shrink-0">
            <Link href="/login" className="flex items-center gap-2">
              <img 
                src="/CreditNest.png" 
                alt="CreditNest Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-[13px] font-black tracking-wide text-[#0D2235] dark:text-slate-100">CreditNest</span>
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
              <div className="mb-6">
                <p className="mb-2 text-[10.5px] font-black uppercase tracking-[0.32em] text-[#D4A017]">
                  {t('admin_login.restricted_gateway', 'Restricted Gateway')}
                </p>
                <h2 className="text-[1.70rem] font-black leading-[1.1] tracking-[-0.022em] text-[#0D2235] dark:text-slate-100">
                  {t('admin_login.title', 'Admin Sign In')}
                </h2>
                <p className="mt-2 text-[13px] text-[#A3A3A3] dark:text-slate-400">
                  {t('admin_login.subtitle', 'Only authorized personnel are permitted access.')}
                </p>
              </div>

              <div className="mb-6 rounded-2xl border border-[#F5D28A] bg-[#FFFAEE] dark:bg-amber-950/20 dark:border-amber-900/30 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-[#8A5A00] dark:text-amber-400">
                {t('admin_login.restricted_access', 'Restricted Access')}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">
                    {t('admin_login.username', 'Username')}
                  </Label>
                  <div className="group relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[15px] w-[15px] -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200 transition" />
                    <Input
                      id="username"
                      type="text"
                      placeholder={t('admin_login.username_placeholder', 'admin@creditnest.com')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="h-[48px] rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] dark:placeholder:text-slate-600 transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[12px] font-bold text-[#374151] dark:text-slate-300">
                    {t('admin_login.password', 'Password')}
                  </Label>
                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[15px] w-[15px] -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#0D2235] dark:group-focus-within:text-slate-200 transition" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('admin_login.password_placeholder', 'Enter your password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-[48px] rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 pl-10 text-[13.5px] font-medium text-[#111827] dark:text-slate-100 placeholder:text-[#D1D5DB] dark:placeholder:text-slate-600 transition-all focus-visible:border-[#0D2235] dark:focus-visible:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-4 focus-visible:ring-[#0D2235]/6"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-950 px-4 py-3 text-[12px] text-[#6B7280] dark:text-slate-400">
                  {t('admin_login.security_warning', 'After password, a 2FA code from your authenticator app will be required.')}
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-[#FCA5A5]/50 dark:border-red-950 bg-[#FEF2F2] dark:bg-red-950/20 px-4 py-3.5">
                    <AlertCircle className="mt-px h-4 w-4 shrink-0 text-[#DC2626] dark:text-red-400" />
                    <p className="text-[12px] text-[#DC2626] dark:text-red-300">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-2 flex h-[50px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#D4A017] text-[14px] font-bold text-white shadow-[0_4px_22px_rgba(212,160,23,0.36)] transition-all duration-200 hover:bg-[#C09214] hover:shadow-[0_6px_28px_rgba(212,160,23,0.44)] active:scale-[0.987] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="pointer-events-none absolute inset-0 translate-x-[-115%] skew-x-[-18deg] bg-white/14 transition-transform duration-500 group-hover:translate-x-[115%]" />
                  {isLoading ? t('admin_login.signing_in', 'Signing in...') : t('admin_login.submit', 'Sign in as admin')}
                </button>
              </form>

              <div className="mt-6 text-center text-[11px] text-[#A3A3A3] dark:text-slate-500">
                {t('admin_login.logging_notice', 'All access is logged. Authorised personnel only.')}
              </div>
            </div>
          </div>
        </section>
      </div>

      <Link href="/login" className="sr-only">{t('auth.back_to_login', '← Back to login')}</Link>
    </div>
  );
}
