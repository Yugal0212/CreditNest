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

import PWAInstallBanner  from '@/components/PWAInstallBanner';
import OfflineIndicator  from '@/components/OfflineIndicator';

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SCMS - Smart Credit Management System',
  description: 'Modern smart credit management system for Indian Kirana stores & canteens',
  keywords: ['SCMS', 'Credit Management', 'Kirana', 'Shop', 'India'],
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#1A5276',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Smart Credit',
    startupImage: '/icons/icon-512x512.png',
  },
  other: {
    'msapplication-TileColor':  '#0D2235',
    'msapplication-TileImage':  '/icons/icon-144x144.png',
    'mobile-web-app-capable':   'yes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SCMS" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/icons/icon-96x96.png" />
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground transition-colors duration-300">
        <OfflineIndicator />
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <LanguageProvider>
                {children}
                <Analytics />
              </LanguageProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
        <PWAInstallBanner />
      </body>
    </html>
  )
}
