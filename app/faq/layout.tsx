import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Häufige Fragen (FAQ) - Bereifung24',
  description: 'Antworten auf häufig gestellte Fragen zu Bereifung24. Buchung, Bezahlung, Reifenservice und mehr.',
  alternates: { canonical: 'https://bereifung24.de/faq' }
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
