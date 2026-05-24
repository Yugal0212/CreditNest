'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import {
  Menu, X, Sun, Moon, Zap, TrendingUp, Users, ShieldCheck,
  ChevronRight, BookOpen, Lock, BarChart3, CreditCard, Globe,
  Smartphone, Store, Plus, Star, Twitter, Instagram, Linkedin,
  Mail, Phone, ArrowRight, BadgeCheck, Sparkles
} from 'lucide-react'

const heroFloatingIcons = [
  { icon: Zap,         delay: 0,   x: '5%',  y: '15%' },
  { icon: TrendingUp,  delay: 0.2, x: '85%', y: '25%' },
  { icon: Users,       delay: 0.4, x: '10%', y: '75%' },
  { icon: ShieldCheck, delay: 0.6, x: '80%', y: '80%' },
]

const languages = [
  { code: 'en', label: 'EN', full: 'English',  flag: '🇺🇸' },
  { code: 'hi', label: 'हि', full: 'हिंदी',    flag: '🇮🇳' },
  { code: 'gu', label: 'ગુ', full: 'ગુજરાતી', flag: '🇮🇳' },
]

const socials = [
  { icon: Twitter,   href: '#', label: 'Twitter'  },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin,  href: '#', label: 'LinkedIn'  },
]

const chartBarHeights = ['h-[40%]', 'h-[70%]', 'h-[45%]', 'h-[90%]', 'h-[65%]', 'h-[80%]', 'h-[50%]']

export default function Page() {
  const { t, i18n } = useTranslation()
  const { user, isLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDark = theme === 'dark'

  // PWA installation state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already in standalone (installed) mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    try {
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        toast({
          title: t('pwa_install.title', 'Install CreditNest App'),
          description: t('pwa_install.toast_installed', 'CreditNest app is successfully installed!'),
        })
      } else {
        toast({
          title: t('pwa_install.title', 'Install CreditNest App'),
          description: t('pwa_install.toast_failed', 'Failed to install app. Please try manually from the browser settings.'),
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Error during PWA installation:', err)
    }
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const activeLang = i18n.language || 'en'
  const handleLang = (code: string) => { i18n.changeLanguage(code) }

  const navLinks = [
    { label: t('nav.features', 'Features'), href: '#features' },
    { label: t('nav.how_it_works', 'How it Works'), href: '#how-it-works' },
    { label: t('nav.testimonials', 'Testimonials'), href: '#testimonials' },
  ]

  const featureItems = [
    { icon: BookOpen,   title: t('landing.feature_items.ledger.title', 'Credit Ledger System'),  description: t('landing.feature_items.ledger.desc', 'Maintain complete transaction history for each customer with full audit trail.') },
    { icon: Lock,       title: t('landing.feature_items.otp.title', 'OTP Secure Login'),       description: t('landing.feature_items.otp.desc', 'Bank-level security with one-time password verification at every login.') },
    { icon: BarChart3,  title: t('landing.feature_items.reports.title', 'Monthly Reports'),        description: t('landing.feature_items.reports.desc', 'Visual analytics and detailed reports of your entire credit business.') },
    { icon: CreditCard, title: t('landing.feature_items.tracking.title', 'Payment Tracking'),       description: t('landing.feature_items.tracking.desc', 'Real-time payment updates and pending dues tracking at a glance.') },
    { icon: Globe,      title: t('landing.feature_items.multi_lang.title', 'Multi-language Support'), description: t('landing.feature_items.multi_lang.desc', 'English, Hindi, Gujarati — interact in the language most comfortable to you.') },
    { icon: Smartphone, title: t('landing.feature_items.pwa.title', 'Install as Mobile App'),  description: t('landing.feature_items.pwa.desc', 'Progressive Web App that installs on any device and works offline too.') },
  ]

  const steps = [
    { icon: Store,      title: t('landing.steps.register.title', 'Register Shop'),    description: t('landing.steps.register.desc', 'Create your shop account in under 60 seconds with zero paperwork.') },
    { icon: Users,      title: t('landing.steps.add_cust.title', 'Add Customers'),    description: t('landing.steps.add_cust.desc', 'Add your regular credit customers to the system instantly.') },
    { icon: Plus,       title: t('landing.steps.add_credit.title', 'Add Daily Credit'), description: t('landing.steps.add_credit.desc', 'Record credit transactions as they happen, in real time.') },
    { icon: TrendingUp, title: t('landing.steps.collect.title', 'Collect Payment'),  description: t('landing.steps.collect.desc', 'Track pending dues and collect payments with smart reminders.') },
    { icon: BarChart3,  title: t('landing.steps.reports.title', 'View Reports'),     description: t('landing.steps.reports.desc', 'Get powerful insights into your credit business, monthly.') },
  ]

  const testimonials = [
    { name: t('landing.testimonials.t1.name', 'Ramesh Patel'),  role: t('landing.testimonials.t1.role', 'Kirana Shop Owner, Ahmedabad'), avatar: 'RP', rating: 5, comment: t('landing.testimonials.t1.comment', 'CreditNest has made managing my credit customers so much easier. I no longer need to maintain a paper register!') },
    { name: t('landing.testimonials.t2.name', 'Sunita Sharma'), role: t('landing.testimonials.t2.role', 'Canteen Owner, Jaipur'),        avatar: 'SS', rating: 5, comment: t('landing.testimonials.t2.comment', 'The multilingual support is fantastic. I prefer using it in Hindi and it works perfectly. My dues collection improved by 40%!') },
    { name: t('landing.testimonials.t3.name', 'Mohan Verma'),   role: t('landing.testimonials.t3.role', 'Grocery Store, Delhi'),         avatar: 'MV', rating: 5, comment: t('landing.testimonials.t3.comment', 'Monthly reports help me understand my business better. I know exactly who owes me money and how much.') },
  ]

  const trustBadges = [
    { icon: ShieldCheck, label: t('trust.otp_verified', 'OTP Verified')  },
    { icon: BadgeCheck,  label: t('trust.rbi_compliant', 'RBI Compliant') },
    { icon: Globe,       label: t('trust.tls', '256-bit TLS')   },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isLoading && user) {
      const route = user.role === 'ADMIN' ? '/dashboard/admin'
        : user.role === 'SHOP_OWNER'      ? '/dashboard/shop_owner'
        : '/dashboard/customer'
      router.replace(route)
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/CreditNest.png" 
            alt="CreditNest Logo" 
            className="w-12 h-12 object-contain animate-pulse"
          />
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // While redirecting an authenticated user, avoid rendering landing page content.
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-background/90 backdrop-blur-md border-b border-border shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <img 
                src="/CreditNest.png" 
                alt="CreditNest Logo" 
                className="w-9 h-9 object-contain"
              />
              <div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  CreditNest
                </span>
              </div>
            </Link>

            {/* Desktop nav — pill capsule */}
            <nav className="hidden md:flex items-center bg-card/80 backdrop-blur-sm border border-border rounded-full px-1.5 py-1.5 gap-0.5">
              {navLinks.map((link, i) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`relative px-5 py-2 text-[13px] font-bold tracking-wide transition-all rounded-full ${
                    i === 0
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
              <div>
                <LanguageSwitcher />
              </div>

              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} className="absolute">
                      <Sun className="w-4 h-4 text-yellow-500" />
                    </motion.span>
                  ) : (
                    <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} className="absolute">
                      <Moon className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <Link href="/login" className="hidden md:block text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-xl hover:bg-accent">
                {t('nav.login', 'Login')}
              </Link>

              <Link href="/register" className="hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold px-5 py-2.5 text-[13px] shadow-lg shadow-primary/20 transition-all duration-200"
                >
                  <span className="pointer-events-none absolute inset-0 translate-x-[-115%] skew-x-[-18deg] bg-white/15 transition-transform duration-500 group-hover:translate-x-[115%]" />
                  {t('nav.get_started', 'Get Started')}
                </motion.button>
              </Link>

              <button
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-card hover:bg-accent border border-border text-muted-foreground transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="md:hidden overflow-hidden bg-background border-t border-border"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-xl text-[13px] font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                    {link.label}
                  </a>
                ))}
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <button className="w-full px-4 py-2.5 rounded-xl text-[13px] font-bold border border-border bg-card text-foreground hover:bg-accent transition-all">{t('nav.login', 'Login')}</button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold py-2.5 text-[13px] transition-all shadow-sm">{t('nav.get_started', 'Get Started')}</button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main>

        {/* ═══════════════ HERO ═══════════════ */}
        <section id="hero">
          <section
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[68px]"
            style={{ background: isDark ? 'radial-gradient(circle at top, #0f172a 0%, #020617 100%)' : 'radial-gradient(circle at top, #f8fafc 0%, #e2e8f0 100%)' }}
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-50" style={{
              backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }} />

            {/* Blob accents */}
            <div className="absolute top-[-100px] right-[-60px] w-[650px] h-[650px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 68%)' }} />
            <div className="absolute bottom-[-80px] left-[-80px] w-[500px] h-[500px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)' }} />

            {/* Floating icon ghosts */}
            {heroFloatingIcons.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div key={idx} animate={{ y: [0, -18, 0] }} transition={{ duration: 4.5, repeat: Infinity, delay: item.delay }}
                  className="absolute opacity-20 text-muted-foreground" style={{ left: item.x, top: item.y, zIndex: 1 }}>
                  <Icon className="w-16 h-16 md:w-20 md:h-20" />
                </motion.div>
              )
            })}

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Left — copy */}
                <motion.div 
                  className="flex flex-col items-start"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Eyebrow */}
                  <motion.div
                    variants={itemVariants}
                    className="mb-7 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-card border border-border shadow-sm"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-[0.26em] text-primary">{t('hero.badge', 'Trusted by 5,000+ businesses across India')}</span>
                  </motion.div>

                  {/* Headline */}
                  <motion.h1
                    variants={itemVariants}
                    className="text-[3rem] md:text-[3.6rem] lg:text-[4rem] font-black mb-6 tracking-[-0.030em] leading-[1.04] text-foreground"
                  >
                    {t('landing.ultimate_nest', 'The Ultimate Nest')}<br />
                    {t('landing.for_your', 'For Your')}{' '}
                    <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                      {t('landing.credit', 'Credit.')}
                      <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 320 12" fill="none">
                        <path d="M2 9 Q80 2 160 9 Q240 16 318 9" stroke="url(#gradient)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--primary)" />
                            <stop offset="100%" stopColor="var(--secondary)" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </span>
                  </motion.h1>

                  {/* Body */}
                  <motion.p
                    variants={itemVariants}
                    className="text-[16px] text-muted-foreground mb-9 max-w-lg leading-[1.82] font-medium"
                  >
                    {t('landing.hero_body', 'Track customer dues, send smart reminders, and manage your ledger like a pro. Built exclusively for modern Indian businesses.')}
                  </motion.p>

                  {/* CTAs */}
                  <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row gap-3 mb-10 w-full sm:w-auto"
                  >
                    <Link href="/register">
                      <button className="group relative w-full sm:w-auto overflow-hidden inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold px-8 py-4 text-[14px] shadow-lg shadow-primary/20 transition-all duration-200 tracking-wide">
                        <span className="pointer-events-none absolute inset-0 translate-x-[-115%] skew-x-[-18deg] bg-white/15 transition-transform duration-500 group-hover:translate-x-[115%]" />
                        {t('nav.start_free', 'Start for Free')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </Link>
                    <Link href="/login">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-[14px] bg-card border border-border text-foreground hover:bg-accent transition-all tracking-wide shadow-sm"
                      >
                        {t('landing.login_dashboard', 'Login to Dashboard')}
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </Link>
                  </motion.div>

                  {/* Trust badges */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-4 flex-wrap"
                  >
                    {trustBadges.map(({ icon: Icon, label }, i) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11.5px] font-bold text-muted-foreground">{label}</span>
                        {i < trustBadges.length - 1 && <span className="ml-4 h-3 w-px bg-border" />}
                      </div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Right — dashboard card */}
                <motion.div
                  initial={{ opacity: 0, y: 48, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.85, delay: 0.4 }}
                  className="relative w-full"
                >
                  {/* Card glow */}
                  <div className="absolute inset-6 rounded-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }} />

                  <div className="relative rounded-2xl border border-border shadow-2xl overflow-hidden bg-card">
                    {/* Browser chrome */}
                    <div className="bg-accent/50 border-b border-border px-5 py-3.5 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FC5F57]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FDBC2C]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#34C749]" />
                      <div className="mx-auto px-5 py-1.5 rounded-lg bg-card border border-border text-[11px] font-mono text-muted-foreground w-1/2 text-center">
                        creditnest.app/dashboard
                      </div>
                    </div>

                    {/* Dashboard body */}
                    <div className="p-5 bg-card/50">
                      {/* Stat row */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: t('admin_dashboard.total_credit', 'Total Credit'), val: '₹1,24,500', color: 'text-primary', bg: 'bg-primary/5' },
                          { label: t('landing.collected', 'Collected'),    val: '₹98,200',   color: 'text-green-500', bg: 'bg-green-500/5' },
                          { label: t('landing.pending', 'Pending'),      val: '₹26,300',   color: 'text-yellow-500', bg: 'bg-yellow-500/5' },
                        ].map((s) => (
                          <div key={s.label} className={`${s.bg} rounded-xl border border-border p-3.5 shadow-sm`}>
                            <p className="text-[9.5px] font-black uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                            <p className={`text-[15px] font-black ${s.color} leading-none`}>{s.val}</p>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Sidebar */}
                        <div className="flex flex-col gap-2">
                          <div className="h-8 rounded-lg bg-primary/20" />
                          <div className="h-7 rounded-lg bg-accent" />
                          <div className="h-7 rounded-lg bg-accent" />
                          <div className="h-7 rounded-lg bg-accent" />
                          <div className="h-7 rounded-lg bg-accent" />
                        </div>

                        {/* Chart */}
                        <div className="col-span-2">
                          <div className="bg-card rounded-xl border border-border p-3 shadow-sm">
                            <p className="text-[9.5px] font-black uppercase tracking-wider text-muted-foreground mb-3">{t('landing.monthly_collection', 'Monthly Collection')}</p>
                            <div className="h-[116px] flex items-end gap-1.5">
                              {chartBarHeights.map((barClass, i) => (
                                <div key={i} className={`w-full rounded-t-md ${barClass} bg-primary/60`}
                                  style={{ opacity: i === 3 ? 1 : 0.60 }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <motion.div
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, delay: 1 }}
                    className="absolute -bottom-5 -left-5 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground">{t('landing.stats_badge_value', '↑ 40% collection')}</p>
                      <p className="text-[9.5px] text-muted-foreground font-medium">{t('admin_dashboard.this_month', 'this month')}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3.6, repeat: Infinity, delay: 0.5 }}
                    className="absolute -top-5 -right-5 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground">{t('trust.otp_verified', 'OTP Verified')}</p>
                      <p className="text-[9.5px] text-muted-foreground font-medium">{t('landing.bank_grade_security', 'bank-grade security')}</p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Wave divider */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
              <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
                <path d="M0 56L0 28Q360 0 720 28Q1080 56 1440 28L1440 56Z" fill="var(--background)" />
              </svg>
            </div>
          </section>
        </section>

        {/* ═══════════════ STATS STRIP ═══════════════ */}
        <section className="bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { value: '5,000+',  label: t('hero.stats.active_stores', 'Active Stores'),    sub: t('landing.stats_active_stores_sub', 'across India'),          icon: Store      },
                { value: '₹200M+', label: t('hero.stats.credit_tracked', 'Credit Tracked'),   sub: t('landing.stats_credit_tracked_sub', 'monthly volume'),         icon: CreditCard },
                { value: '99.9%',  label: t('hero.stats.uptime', 'Uptime SLA'),        sub: t('landing.stats_uptime_sub', 'guaranteed reliability'), icon: ShieldCheck },
              ].map(({ value, label, sub, icon: Icon }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-5 p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[2.2rem] font-black leading-none text-foreground tracking-tight">{value}</p>
                    <p className="text-[14px] font-bold text-foreground mt-0.5">{label}</p>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ FEATURES ═══════════════ */}
        <section id="features" className="py-28 px-4 sm:px-6 lg:px-8 bg-accent/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm mb-5"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10.5px] font-black uppercase tracking-[0.26em] text-primary">{t('landing.platform_features', 'Platform Features')}</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-[2.4rem] md:text-[3rem] font-black mb-4 text-foreground tracking-[-0.022em] leading-tight"
              >
                {t('landing.why_choose', 'Why Choose')}{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">CreditNest?</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-[15px] text-muted-foreground max-w-lg mx-auto leading-[1.80]"
              >
                {t('landing.features_body', 'Everything you need to manage your credit customers, all in one place.')}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featureItems.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div key={index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -5 }}
                    className="group bg-card border border-border rounded-[16px] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-default p-7"
                  >
                    <div className="inline-flex w-[52px] h-[52px] rounded-[13px] items-center justify-center mb-5 bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-[15px] font-black mb-2.5 text-foreground tracking-tight">{feature.title}</h3>
                    <p className="text-muted-foreground text-[13px] grow leading-[1.78]">{feature.description}</p>
                    <div className="mt-5 pt-4 border-t border-border flex items-center gap-1.5 text-[12px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('landing.learn_more', 'Learn more')} <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
          <div className="absolute inset-0 pointer-events-none opacity-50" style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border mb-5">
                <span className="text-[10.5px] font-black uppercase tracking-[0.26em] text-primary">{t('landing.simple_process', 'Simple Process')}</span>
              </div>
              <h2 className="text-[2.4rem] md:text-[3rem] font-black text-foreground mb-4 tracking-[-0.022em]">
                {t('landing.how_it', 'How It')}{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t('landing.works', 'Works')}</span>
              </h2>
              <p className="text-[15px] text-muted-foreground max-w-md mx-auto leading-[1.80]">{t('landing.how_it_works_body', 'Simple 5-step process to get started with CreditNest today')}</p>
            </motion.div>

            <div className="relative">
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

              <div className="space-y-14 md:space-y-16">
                {steps.map((step, i) => {
                  const Icon = step.icon
                  const isEven = i % 2 === 0
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.55 }}
                      className={`flex items-center gap-8 md:gap-0 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      <div className={`flex-1 ${isEven ? 'md:text-right md:pr-16' : 'md:text-left md:pl-16'}`}>
                        <div className="bg-card border border-border rounded-[16px] shadow-sm inline-block text-left md:text-inherit max-w-sm md:max-w-full p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-[10px] font-black tracking-[0.26em] text-primary uppercase">{t('landing.step', 'Step')} {i + 1}</span>
                          </div>
                          <h3 className="text-[16px] font-black text-foreground mb-1.5 tracking-tight">{step.title}</h3>
                          <p className="text-muted-foreground text-[13px] leading-[1.78]">{step.description}</p>
                        </div>
                      </div>

                      <div className="flex justify-center md:flex-none md:w-24 relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.12, rotate: 6 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          className="w-[72px] h-[72px] rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 relative"
                        >
                          <Icon className="w-8 h-8 text-white" />
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-black text-white">{i + 1}</div>
                        </motion.div>
                      </div>

                      <div className="hidden md:flex flex-1" />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ TESTIMONIALS ═══════════════ */}
        <section id="testimonials" className="py-28 px-4 sm:px-6 lg:px-8 bg-accent/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)' }} />

          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm mb-5">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-[10.5px] font-black uppercase tracking-[0.26em] text-primary">{t('landing.customer_stories', 'Customer Stories')}</span>
              </div>
              <h2 className="text-[2.4rem] md:text-[3rem] font-black mb-4 text-foreground tracking-[-0.022em]">
                {t('landing.loved_by', 'Loved by')}{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t('landing.shop_owners', '500+ Shop Owners')}</span>
              </h2>
              <p className="text-muted-foreground text-[15px] max-w-md mx-auto leading-[1.80]">{t('landing.testimonials_body', 'Real stories from real shop owners across India')}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  whileHover={{ y: -6 }}
                  className="bg-card border border-border rounded-[16px] shadow-sm flex flex-col gap-4 p-7 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <div className="text-[44px] leading-none font-black text-muted-foreground/20 -mt-2 -mb-4">&ldquo;</div>
                  <p className="text-foreground text-[13.5px] leading-[1.82] grow">{t.comment}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-black text-[12px] shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-black text-[13px] text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ CTA BANNER ═══════════════ */}
        <section className="bg-card relative overflow-hidden border-y border-border">
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }} />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border mb-7">
                <span className="text-[10.5px] font-black uppercase tracking-[0.26em] text-primary">{t('landing.get_started_today', 'Get Started Today')}</span>
              </div>
              <h2 className="text-[2.2rem] md:text-[2.9rem] font-black text-foreground mb-5 tracking-[-0.022em] leading-tight">
                {t('landing.ready_to_modernize_line1', 'Ready to modernize')}<br />{t('landing.ready_to_modernize_line2', 'your credit management?')}
              </h2>
              <p className="text-muted-foreground text-[15px] mb-10 max-w-lg mx-auto leading-[1.80]">
                {t('landing.join_thousands', 'Join thousands of shop owners who manage smarter with CreditNest. Free to start.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <button className="group relative overflow-hidden inline-flex items-center gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-4 rounded-xl text-[14px] shadow-lg shadow-primary/20 transition-all duration-200 tracking-wide">
                    <span className="pointer-events-none absolute inset-0 translate-x-[-115%] skew-x-[-18deg] bg-white/15 transition-transform duration-500 group-hover:translate-x-[115%]" />
                    {t('nav.start_free', 'Start for Free')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
                <Link href="/login">
                  <button className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-[14px] bg-card border border-border text-foreground hover:bg-accent transition-all tracking-wide shadow-sm">
                    {t('landing.login_dashboard', 'Login to Dashboard')}
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative bg-[#020617] text-white overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/CreditNest.png" 
                  alt="CreditNest Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  CreditNest
                </span>
              </div>
              <p className="text-[13px] text-slate-400 leading-[1.80] mb-5 max-w-xs">
                {t('footer.brand_tagline', 'Making credit management simple, fast, and modern for Indian businesses.')}
              </p>
              <div className="space-y-2.5 mb-6">
                {[{ icon: Mail, text: 'support@creditnest.app' }, { icon: Phone, text: '+91 98765 43210' }].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-[12px] text-slate-400">
                    <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center">
                      <Icon className="w-3 h-3 text-primary" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {socials.map(({ icon: Icon, href, label }) => (
                  <motion.a key={label} href={href} aria-label={label} whileHover={{ scale: 1.1, y: -2 }}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all border border-white/10 text-slate-400">
                    <Icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
              <h4 className="font-black mb-6 text-white text-[10.5px] uppercase tracking-[0.30em]">{t('footer.quick_links', 'Quick Links')}</h4>
              <ul className="space-y-3.5">
                {[{ label: t('footer.about_us', 'About Us'), href: '#' }, { label: t('footer.privacy_policy', 'Privacy Policy'), href: '#' }, { label: t('footer.contact_us', 'Contact Us'), href: '#' }, { label: t('footer.terms_conditions', 'Terms & Conditions'), href: '#' }].map((link) => (
                  <li key={link.label}>
                    <motion.a href={link.href} whileHover={{ x: 4 }} className="text-[13px] text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Product */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14 }}>
              <h4 className="font-black mb-6 text-white text-[10.5px] uppercase tracking-[0.30em]">{t('footer.product', 'Product')}</h4>
              <ul className="space-y-3.5">
                {[{ label: t('nav.features', 'Features'), href: '#features' }, { label: t('nav.how_it_works', 'How it Works'), href: '#how-it-works' }, { label: t('nav.testimonials', 'Testimonials'), href: '#testimonials' }, { label: t('footer.pricing', 'Pricing'), href: '#' }].map((link) => (
                  <li key={link.label}>
                    <motion.a href={link.href} whileHover={{ x: 4 }} className="text-[13px] text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Language + CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <h4 className="font-black mb-6 text-white text-[10.5px] uppercase tracking-[0.30em] flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-primary" />{t('footer.language', 'Language')}
              </h4>
              <div className="flex flex-wrap gap-2 mb-8">
                {languages.map((lang) => (
                  <motion.button key={lang.code} onClick={() => handleLang(lang.code)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title={lang.full}
                    className={`px-3 py-2 rounded-[9px] text-[11px] font-bold transition-all border ${
                      activeLang === lang.code
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang.flag} {lang.label}
                  </motion.button>
                ))}
              </div>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="w-full group relative overflow-hidden px-5 py-3 rounded-xl text-[13px] font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 tracking-wide"
                >
                  <span className="pointer-events-none absolute inset-0 translate-x-[-115%] skew-x-[-18deg] bg-white/15 transition-transform duration-500 group-hover:translate-x-[115%]" />
                  {t('footer.start_free_today', 'Start Free Today')}
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <p className="text-[12px] text-slate-500">{t('footer.copyright', '© 2026 CreditNest. All rights reserved.')}</p>
            <p className="text-[11px] text-slate-600 font-medium">{t('footer.made_with_love', 'Made with love for Indian businesses 🇮🇳')}</p>
          </motion.div>
        </div>
      </footer>

      {/* Premium Glassmorphic PWA Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] sm:w-auto rounded-full border border-slate-200/80 dark:border-white/10 p-2.5 shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/90 text-slate-900 dark:text-white"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 text-white shrink-0 shadow-lg shadow-indigo-500/20">
                <Smartphone className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-bold text-[14px] tracking-tight leading-none text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                  {t('pwa_install.title', 'Install CreditNest App')}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="py-1.5 px-4 rounded-full font-bold text-[12px] text-white bg-gradient-to-r from-indigo-500 to-teal-500 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-indigo-500/10 cursor-pointer whitespace-nowrap"
                >
                  {t('pwa_install.btn_install', 'Install')}
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 dark:text-slate-500 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}