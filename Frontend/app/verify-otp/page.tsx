'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Zap, ShieldCheck, Sun, Moon, ChevronRight, ArrowLeft, Clock,
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { AuthHero } from '@/components/AuthHero';

export default function VerifyOTPPage() {
  const { t } = useTranslation();
  const RESEND_SECONDS = 60;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);
  const [pendingData, setPendingData] = useState<any>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastSubmittedRef = useRef('');

  const { shopOwnerVerifyOTP, customerVerifyOTP, shopOwnerRegisterComplete } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Get pending data from sessionStorage
    const stored = sessionStorage.getItem('pendingRegistration') || sessionStorage.getItem('pendingLogin');
    if (stored) {
      setPendingData(JSON.parse(stored));
    } else {
      // No pending data, redirect to login
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    const otpString = otp.join('');
    const isComplete = otp.every((digit) => digit !== '');
    if (otpString.length === 6 && isComplete && !isLoading) {
      if (lastSubmittedRef.current !== otpString) {
        lastSubmittedRef.current = otpString;
        submitOtp(otpString);
      }
    }
  }, [otp, isLoading]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const submitOtp = async (otpString: string) => {
    if (otpString.length !== 6) {
      setError(t('validation.enter_complete_otp', 'Please enter complete OTP'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (!pendingData) {
        throw new Error(t('validation.no_pending_data', 'No pending verification data'));
      }

      if (pendingData.role === 'shop_owner' && pendingData.registrationData) {
        // Shop owner registration OTP
        const response = await authAPI.shopOwnerVerifyOTP({
          identifier: pendingData.identifier,
          otp: otpString,
          registrationData: pendingData.registrationData,
        });

        const { token, user } = response.data;
        
        // Update AuthContext with registration completion
        shopOwnerRegisterComplete(token, user);

        sessionStorage.removeItem('pendingRegistration');
        router.push('/dashboard/shop_owner');
      } else if (pendingData.role === 'shop_owner') {
        // Shop owner login OTP
        await shopOwnerVerifyOTP(pendingData.identifier, otpString);
        sessionStorage.removeItem('pendingLogin');
        router.push('/dashboard/shop_owner');
      } else if (pendingData.role === 'customer') {
        // Customer login OTP
        await customerVerifyOTP(pendingData.identifier, otpString);
        sessionStorage.removeItem('pendingLogin');
        router.push('/dashboard/customer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      lastSubmittedRef.current = '';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitOtp(otp.join(''));
  };

  const handleResendOTP = async () => {
    if (!pendingData) return;

    setIsLoading(true);
    try {
      if (pendingData.role === 'shop_owner' && pendingData.registrationData) {
        // Resend registration OTP
        await authAPI.shopOwnerRegister(pendingData.registrationData);
      } else if (pendingData.role === 'shop_owner') {
        // Resend login OTP
        await authAPI.shopOwnerLogin(pendingData.identifier);
      } else if (pendingData.role === 'customer') {
        // Resend customer login OTP
        await authAPI.customerLogin(pendingData.identifier);
      }
      
      setTimeLeft(RESEND_SECONDS); // Reset timer
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setError('');
      toast({ title: 'OTP Sent', description: 'A new OTP has been sent to your registered email/phone' });
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.response?.data?.message || 'Failed to resend OTP',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    return `00:${seconds.toString().padStart(2, '0')}`;
  };

  const maskIdentifier = (identifier: string) => {
    if (!identifier) return '';
    if (identifier.includes('@')) {
      const [name, domain] = identifier.split('@');
      const prefix = name ? name[0] : '';
      return `${prefix}••••@${domain}`;
    }
    const digits = identifier.replace(/\D/g, '');
    if (digits.length <= 4) return `••••${digits}`;
    return `••••••${digits.slice(-4)}`;
  };

  if (!pendingData) return null;

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

          {/* Top controls bar */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-[#F3EEE8] dark:border-slate-800">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('forgot.back', 'Back')}</span>
            </button>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <motion.button onClick={toggleTheme} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors relative">
              <AnimatePresence mode="wait" initial={false}>
                {isDark
                  ? <motion.span key="sun"  initial={{ rotate:-90, opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:90, opacity:0 }} transition={{ duration:0.2 }} className="absolute"><Sun  className="w-4 h-4 text-teal-400" /></motion.span>
                  : <motion.span key="moon" initial={{ rotate:90,  opacity:0 }} animate={{ rotate:0, opacity:1 }} exit={{ rotate:-90,opacity:0 }} transition={{ duration:0.2 }} className="absolute"><Moon className="w-4 h-4 text-slate-500" /></motion.span>
                }
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-6">
          <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.6, ease:'easeOut' }}
            className="w-full max-w-md">

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground mb-1">{t('forgot.verify_otp', 'Verify OTP')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('auth.otp_sent_to', 'OTP sent to')}{' '}{maskIdentifier(pendingData?.identifier || '')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    autoFocus={index === 0}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border/70 bg-muted/40 dark:bg-muted/20 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none disabled:opacity-50"
                  />
                ))}
              </div>

              <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-center text-[12.5px] font-semibold text-amber-800 dark:text-amber-200">
                {t('auth.attempts_lock_notice', '3 wrong attempts will lock your account for 10 minutes.')}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                    className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium text-center">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button type="submit" disabled={isLoading || otp.join('').length !== 6}
                whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-600 via-teal-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {t('auth.verifying', 'Verifying...')}
                  </>
                ) : (
                  <><span>{t('auth.verify_continue', 'Verify & Continue')}</span><ChevronRight className="w-4 h-4" /></>
                )}
              </motion.button>

              {/* Resend OTP */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-muted-foreground">{t('auth.resend_otp_in', 'Resend OTP in')}{' '}{formatTime(timeLeft)}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-teal-600 dark:text-teal-400 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('auth.resend_otp', 'Resend OTP')}
                  </button>
                )}
              </div>

              <div className="text-center">
                <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                  {t('auth.back_to_login', '← Back to login')}
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  </div>
);
}

