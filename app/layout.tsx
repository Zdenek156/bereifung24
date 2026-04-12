import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import SessionWrapper from './components/SessionWrapper'
import CookieBanner from '@/components/CookieBanner'
import { Suspense } from 'react'
import Analytics from './components/Analytics'
import StructuredData from './components/StructuredData'

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: 'Bereifung24 - Reifenservice zum Festpreis online buchen',
  description: 'Deutschlands erste digitale Plattform für Reifenservice. Werkstätten mit Festpreisen vergleichen, Termin wählen und direkt online buchen. ⭐ 5.0 Sterne Durchschnittsbewertung.',
  keywords: 'Reifenwechsel, Räderwechsel, Werkstatt buchen, Reifenservice, Festpreis, Online-Buchung, Achsvermessung, Klimaservice',
  authors: [{ name: 'Bereifung24' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://bereifung24.de',
    siteName: 'Bereifung24',
    title: 'Bereifung24 - Reifenservice zum Festpreis online buchen',
    description: 'Vergleiche geprüfte Werkstätten in deiner Nähe und buche direkt online. Transparente Festpreise, schneller Termin, sichere Bezahlung.',
    images: [{
      url: 'https://bereifung24.de/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Bereifung24 - Deine Plattform für Reifenservice'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bereifung24 - Reifenservice zum Festpreis',
    description: 'Werkstätten vergleichen und direkt online buchen. Transparent, schnell und sicher.',
    images: ['https://bereifung24.de/og-image.jpg']
  },
  alternates: {
    canonical: 'https://bereifung24.de'
  },
  other: {
    'google': 'notranslate'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" translate="no">
      <head>
        {/* Bing Webmaster Tools Verification - Required for ChatGPT/Bing Search visibility */}
        <meta name="msvalidate.01" content="BING_VERIFICATION_CODE_HERE" />
        {/* Resource Hints for Performance */}
        <link rel="preload" href="/bereifung24-hero-bg.webp" as="image" type="image/webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      </head>
      <body className={`${plusJakartaSans.className} notranslate`}>
        <StructuredData />
        <SessionWrapper>
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
          {children}
          <CookieBanner />
        </SessionWrapper>
      </body>
    </html>
  )
}
