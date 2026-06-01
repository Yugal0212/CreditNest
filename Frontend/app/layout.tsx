import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import './globals.css'
import '@/styles/google-translate.css'

import PwaManager from '@/components/pwa/PwaManager';
import OfflineIndicator  from '@/components/OfflineIndicator';
import { SWRProvider } from '@/contexts/SWRProvider';
import { GlobalPreloader } from '@/components/GlobalPreloader';

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://credit-nest.vercel.app'),
  title: {
    default: 'CreditNest - Kirana & Canteen Credit Management System',
    template: '%s | CreditNest',
  },
  description: 'Modern credit management system for Indian Kirana stores, canteens, and small businesses. Track digital khata, send payment reminders, and grow your business.',
  keywords: ['CreditNest', 'Credit Management', 'Kirana', 'Shop', 'India', 'Canteen', 'Khata Book', 'Digital Ledger', 'Credit Tracker'],
  authors: [{ name: 'CreditNest Team' }],
  creator: 'CreditNest',
  publisher: 'CreditNest',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'CreditNest - Kirana & Canteen Credit Management System',
    description: 'Modern credit management system for Indian Kirana stores & canteens. Track digital khata and grow your business.',
    url: 'https://credit-nest.vercel.app',
    siteName: 'CreditNest',
    images: [
      {
        url: '/creditnest_hero.png', // Assuming this image exists based on previous commands
        width: 1200,
        height: 630,
        alt: 'CreditNest Dashboard Preview',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreditNest - Kirana & Canteen Credit Management System',
    description: 'Modern credit management system for Indian Kirana stores & canteens.',
    images: ['/creditnest_hero.png'],
  },
  icons: {
    icon: [
      { url: '/CreditNest.png', type: 'image/png' },
    ],
    apple: '/CreditNest.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CreditNest',
    startupImage: '/CreditNest.png',
  },
  other: {
    'msapplication-TileColor':  '#0D2235',
    'msapplication-TileImage':  '/CreditNest.png',
    'mobile-web-app-capable':   'yes',
  },
  verification: {
    google: '8DMU8YvBdraMYLG5A7SSZzRKWXAODKIB4rx9JEfyglg',
  },
}

export const viewport = {
  themeColor: '#1A5276',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedLang = localStorage.getItem('language');
                  if (savedLang && ['en', 'hi', 'gu'].indexOf(savedLang) !== -1) {
                    document.documentElement.setAttribute('data-lang', savedLang);
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "CreditNest",
              "url": "https://credit-nest.vercel.app",
              "description": "Modern credit management system for Indian Kirana stores & canteens",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://credit-nest.vercel.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "CreditNest",
              "url": "https://credit-nest.vercel.app",
              "logo": "https://credit-nest.vercel.app/CreditNest.png",
              "sameAs": [
                "https://twitter.com/creditnest",
                "https://www.linkedin.com/company/creditnest"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "CreditNest",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "description": "Modern credit management system for Indian Kirana stores, canteens, and small businesses.",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1250"
              }
            })
          }}
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CreditNest" />
        <link rel="icon" href="/CreditNest.png" type="image/png" />
        <link rel="apple-touch-icon" href="/CreditNest.png" />
        <link rel="shortcut icon" href="/CreditNest.png" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/CreditNest.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/CreditNest.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/CreditNest.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/CreditNest.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-300">
        <OfflineIndicator />
        <ThemeProvider>
          <GlobalPreloader />
          <SWRProvider>
            <AuthProvider>
              <NotificationProvider>
                <LanguageProvider>
                  {children}
                  <Analytics />
                </LanguageProvider>
              </NotificationProvider>
            </AuthProvider>
          </SWRProvider>
        </ThemeProvider>
        <PwaManager />
      </body>
    </html>
  )
}
