import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Werkstatt suchen - Bereifung24',
  description: 'Finde Reifenwerkstätten in deiner Nähe. Preise vergleichen und direkt online buchen.',
  alternates: { canonical: 'https://bereifung24.de/suche' }
}

export default function SucheLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
