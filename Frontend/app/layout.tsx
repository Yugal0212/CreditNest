import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import './globals.css'
import '@/styles/google-translate.css'
import { link } from 'fs'

import PwaManager from '@/components/pwa/PwaManager';
import OfflineIndicator  from '@/components/OfflineIndicator';
import { SWRProvider } from '@/contexts/SWRProvider';

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CreditNest - Kirana & Canteen Credit Management System',
  description: 'Modern credit management system for Indian Kirana stores & canteens',
  keywords: ['CreditNest', 'Credit Management', 'Kirana', 'Shop', 'India', 'Canteen'],
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
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CreditNest" />
        <link rel="icon" href="/CreditNest.png" type="image/png" />
        <link rel="apple-touch-icon" href="/CreditNest.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/icons/icon-96x96.png" />
        
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
