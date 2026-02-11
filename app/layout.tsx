import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionWrapper from './components/SessionWrapper'
import CookieBanner from '@/components/CookieBanner'
import Analytics from './components/Analytics'
import StructuredData from './components/StructuredData'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bereifung24 - Reifenservice zum Festpreis online buchen',
  description: 'Deutschlands erste digitale Plattform für Reifenservice. Werkstätten mit Festpreisen vergleichen, Termin wählen und direkt online buchen. ⭐ 5.0 Sterne Durchschnittsbewertung.',
  keywords: 'Reifenwechsel, Räderwechsel, Werkstatt buchen, Reifenservice, Festpreis, Online-Buchung, Achsvermessung, Klimaservice',
  authors: [{ name: 'Bereifung24' }],
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
      <body className={`${inter.className} notranslate`}>
        <StructuredData />
        <SessionWrapper>
          <Analytics />
          {children}
          <CookieBanner />
        </SessionWrapper>
      </body>
    </html>
  )
}
