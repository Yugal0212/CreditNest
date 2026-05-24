'use client';

import React from 'react';
import { ShieldCheck, BadgeCheck, Globe, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthHeroProps {
  title?: string;
  subtitle?: string;
}

export const AuthHero: React.FC<AuthHeroProps> = () => {
  const { t } = useTranslation();

  const stats = [
    { value: '5,000+', labelKey: 'hero.stats.active_stores' },
    { value: '₹200M+', labelKey: 'hero.stats.credit_tracked' },
    { value: '99.9%',  labelKey: 'hero.stats.uptime' },
  ];

  const trustItems = [
    { icon: ShieldCheck, labelKey: 'trust.otp_verified' },
    { icon: BadgeCheck,  labelKey: 'trust.rbi_compliant' },
    { icon: Globe,       labelKey: 'trust.tls' },
  ];

  const benefits = [
    'hero.features.otp',
    'hero.features.realtime',
    'hero.features.multilingual',
  ];

  return (
    <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:h-full lg:w-full">
      {/* Deep navy base background */}
      <div className="absolute inset-0 bg-[#0D2235]" />

      {/* Signature Dot-grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(circle, #5DADE2 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Radiant atmospheric orbs */}
      <div className="absolute -bottom-48 -right-24 h-[580px] w-[580px] rounded-full bg-[#D4A017]/10 blur-[100px] pointer-events-none" />
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#2E86C1]/12 blur-[80px] pointer-events-none" />

      {/* Gold diagonal accent stripe */}
      <div
        className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4A017]/25 to-transparent pointer-events-none"
        style={{ top: '62%', transform: 'rotate(-15deg) scaleX(1.5)' }}
      />

      {/* TOP BRAND CONTENT */}
      <div className="relative z-10 flex flex-col px-12 pt-14 xl:px-16">
        
        {/* Logo and Subtitle */}
        <div className="mb-10 flex items-center gap-3.5">
          <img 
            src="/CreditNest.png" 
            alt="CreditNest Logo" 
            className="h-12 w-12 object-contain"
          />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/35">CreditNest</p>
            <p className="mt-0.5 text-[15px] font-black leading-none tracking-wide text-white">Kirana Credit Hub</p>
          </div>
        </div>

        {/* Eyebrow */}
        <p className="mb-4 text-[10.5px] font-black uppercase tracking-[0.30em] text-[#D4A017]">
          {t('hero.badge')}
        </p>

        {/* Main Header */}
        <h1 className="text-[3.1rem] font-black leading-[1.05] tracking-[-0.025em] text-white xl:text-[3.6rem]">
          {t('hero.headline_part1')}<br />
          <span className="text-[#D4A017]">{t('hero.headline_highlight')}</span>{' '}
          <span className="relative inline-block">
            {t('hero.headline_part2')}
            <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#D4A017]/35" />
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-5 max-w-[340px] text-[14px] leading-[1.80] text-white/50">
          {t('hero.desc')}
        </p>

        {/* Benefits checklists */}
        <div className="mt-9 space-y-3">
          {benefits.map((key, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/15">
                <ChevronRight className="h-3 w-3 text-[#D4A017]" />
              </div>
              <span className="text-[13px] font-medium text-white/60">{t(key)}</span>
            </div>
          ))}
        </div>

      </div>

      {/* BOTTOM TRUST & METRICS */}
      <div className="relative z-10 px-12 pb-12 xl:px-16">
        
        {/* Metric widgets */}
        <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04]">
          {stats.map(({ value, labelKey }) => (
            <div key={labelKey} className="px-5 py-5">
              <p className="text-[1.6rem] font-black leading-none text-white">{value}</p>
              <p className="mt-1.5 text-[10.5px] font-bold uppercase tracking-widest text-white/35">{t(labelKey)}</p>
            </div>
          ))}
        </div>

        {/* Security / Compliance Badging */}
        <div className="flex items-center gap-5">
          {trustItems.map(({ icon: Icon, labelKey }, i) => (
            <React.Fragment key={labelKey}>
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-[#D4A017]" />
                <span className="text-[11px] font-semibold text-white/40">{t(labelKey)}</span>
              </div>
              {i < trustItems.length - 1 && <span className="h-3 w-px bg-white/12" />}
            </React.Fragment>
          ))}
        </div>

      </div>
    </section>
  );
};
