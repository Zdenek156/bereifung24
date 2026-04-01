import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Werkstatt registrieren | Bereifung24 - Mehr Kunden, weniger Aufwand',
  description: 'Registriere deine KFZ-Werkstatt kostenlos auf Bereifung24. Online-Buchungssystem, eigene Landingpage, automatische Reifenbestellung. Keine Grundgebühr, keine Vertragslaufzeit. Jetzt in 5 Minuten starten.',
  keywords: 'werkstatt registrieren, kfz werkstatt online buchungssystem, werkstatt kunden gewinnen, online terminbuchung werkstatt, reifenservice plattform, werkstatt digitalisieren, werkstatt auslastung steigern, werkstatt plattform beitreten',
  alternates: {
    canonical: 'https://bereifung24.de/werkstatt'
  },
  openGraph: {
    title: 'Werkstatt registrieren | Bereifung24 - Mehr Kunden, weniger Aufwand',
    description: 'Deutschlands erste digitale Reifenservice-Plattform für Werkstätten. Online-Buchungssystem, eigene Landingpage, automatische Reifenlieferung. Kostenlos starten.',
    type: 'website',
    url: 'https://bereifung24.de/werkstatt',
    siteName: 'Bereifung24',
    locale: 'de_DE',
    images: [{
      url: 'https://bereifung24.de/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Bereifung24 - Die Plattform für Werkstätten'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Werkstatt registrieren | Bereifung24',
    description: 'Kostenlos registrieren, Online-Buchungen empfangen, Auslastung steigern. Keine Grundgebühr.',
    images: ['https://bereifung24.de/og-image.jpg']
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function WerkstattLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Werkstatt registrieren | Bereifung24',
    description: 'Registriere deine KFZ-Werkstatt kostenlos auf Bereifung24. Online-Buchungssystem, eigene Landingpage, automatische Reifenbestellung.',
    url: 'https://bereifung24.de/werkstatt',
    publisher: {
      '@type': 'Organization',
      name: 'Bereifung24',
      url: 'https://bereifung24.de',
      logo: { '@type': 'ImageObject', url: 'https://bereifung24.de/og-image.jpg' }
    },
    mainEntity: {
      '@type': 'Service',
      name: 'Bereifung24 Werkstatt-Plattform',
      description: 'Digitale Reifenservice-Plattform für KFZ-Werkstätten. Online-Buchungssystem, eigene Landingpage, automatische Reifenbestellung. Keine Grundgebühr.',
      provider: { '@type': 'Organization', name: 'Bereifung24' },
      areaServed: { '@type': 'Country', name: 'Deutschland' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Kostenlose Registrierung, keine Grundgebühr, faire Provision bei Erfolg'
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
