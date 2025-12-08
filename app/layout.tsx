import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionWrapper from './components/SessionWrapper'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bereifung24 - Reifen finden, Werkstatt buchen',
  description: 'Die moderne Plattform für Reifenkauf und Montage. Anfrage stellen, Angebote vergleichen, Termin buchen.',
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
        <SessionWrapper>
          {children}
          <CookieBanner />
        </SessionWrapper>
      </body>
    </html>
  )
}
