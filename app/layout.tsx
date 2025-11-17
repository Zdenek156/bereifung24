import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bereifung24 - Reifen finden, Werkstatt buchen',
  description: 'Die moderne Plattform für Reifenkauf und Montage. Anfrage stellen, Angebote vergleichen, Termin buchen.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
