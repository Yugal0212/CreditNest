'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ShieldCheck, Sun, Moon, ChevronRight, ArrowLeft, Clock,
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [pendingData, setPendingData] = useState<any>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (!pendingData) {
        throw new Error('No pending verification data');
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
    } finally {
      setIsLoading(false);
    }
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
      
      setTimeLeft(600); // Reset timer
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!pendingData) return null;

  return (
    <div className="auth-page h-screen w-screen overflow-hidden flex bg-background">

      {/* ── LEFT PANEL — Animated Brand ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center overflow-hidden">
        {/* Static base gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 dark:from-teal-950 dark:via-teal-950 dark:to-teal-950" />

        {/* Animated shimmer overlay */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 55%), radial-gradient(circle at 25% 75%, rgba(20,184,166,0.22) 0%, transparent 50%)'
          }}
        />

        {/* Blobs */}
        <motion.div animate={{ x:[0,-70,0], y:[0,50,0], scale:[1,1.18,1] }} transition={{ duration:22, repeat:Infinity, ease:'linear' }}
          className="absolute -top-20 right-0 w-[380px] h-[380px] rounded-full bg-white/10 dark:bg-teal-500/15 blur-[80px]" />
        <motion.div animate={{ x:[0,60,0], y:[0,-50,0], scale:[1,1.1,1] }} transition={{ duration:18, repeat:Infinity, ease:'linear' }}
          className="absolute bottom-0 -left-16 w-[320px] h-[320px] rounded-full bg-teal-400/20 dark:bg-teal-500/15 blur-[70px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          {/* Logo */}
          <motion.div initial={{ scale:0, rotate:20 }} animate={{ scale:1, rotate:0 }}
            transition={{ type:'spring', stiffness:200, damping:18 }}
            className="w-20 h-20 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl mb-6">
            <ShieldCheck className="w-10 h-10 text-white" />
          </motion.div>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <p className="text-white/70 text-sm font-semibold tracking-widest uppercase mb-2">Secure Verification</p>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
              Almost <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-300">There!</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              We've sent a 6-digit OTP to verify your identity. This keeps your account safe.
            </p>
          </motion.div>

          {/* Security features */}
          <div className="mt-8 space-y-2.5 w-full max-w-xs">
            {[
              { icon: ShieldCheck, text: 'Bank-grade encryption' },
              { icon: Clock, text: 'OTP expires in 10 minutes' },
              { icon: Zap, text: 'Instant verification' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-sm">
                <Icon className="w-4 h-4 shrink-0 text-teal-300" />
                <span className="text-white/85 text-sm font-medium">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — OTP Form ── */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Top controls bar */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back</span>
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
              <h2 className="text-2xl font-black text-foreground mb-1">Verify OTP</h2>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to your registered email or phone.
                {pendingData?.identifier ? (
                  <span className="text-muted-foreground"> ({pendingData.identifier})</span>
                ) : null}
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
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-border/70 bg-muted/40 dark:bg-muted/20 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none disabled:opacity-50"
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className={`font-semibold ${timeLeft < 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {formatTime(timeLeft)}
                </span>
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
                    Verifying...
                  </>
                ) : (
                  <><span>Verify & Continue</span><ChevronRight className="w-4 h-4" /></>
                )}
              </motion.button>

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading || timeLeft > 540} // Allow resend after 1 minute
                    className="text-teal-600 dark:text-teal-400 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resend OTP
                  </button>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

