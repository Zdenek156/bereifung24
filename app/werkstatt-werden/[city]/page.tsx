import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCityBySlug, getAllCitySlugs } from '@/lib/seo/german-cities'
import WerkstattWerdenCityPage from './CityPage'

interface PageProps {
  params: {
    city: string
  }
}

export async function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.city)

  if (!city) {
    return { title: 'Seite nicht gefunden' }
  }

  return {
    title: city.metaTitle,
    description: city.metaDescription,
    keywords: `werkstatt registrieren ${city.name}, kfz werkstatt ${city.name}, reifenservice ${city.name}, werkstatt kunden gewinnen ${city.name}, online terminbuchung werkstatt ${city.name}, werkstatt plattform ${city.name}`,
    alternates: {
      canonical: `https://www.bereifung24.de/werkstatt-werden/${city.slug}`
    },
    openGraph: {
      title: city.metaTitle,
      description: city.metaDescription,
      type: 'website',
      url: `https://www.bereifung24.de/werkstatt-werden/${city.slug}`,
      siteName: 'Bereifung24',
      locale: 'de_DE',
      images: [{
        url: 'https://www.bereifung24.de/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `Bereifung24 Werkstatt-Partner in ${city.name}`
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: city.metaTitle,
      description: city.metaDescription,
    },
    robots: { index: true, follow: true }
  }
}

export default function Page({ params }: PageProps) {
  const city = getCityBySlug(params.city)

  if (!city) {
    notFound()
  }

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: city.h1,
    description: city.metaDescription,
    url: `https://www.bereifung24.de/werkstatt-werden/${city.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Bereifung24',
      url: 'https://www.bereifung24.de',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.bereifung24.de/og-image.jpg'
      }
    },
    mainEntity: {
      '@type': 'Service',
      name: `Werkstatt-Plattform für ${city.name}`,
      description: `Digitale Reifenservice-Plattform für KFZ-Werkstätten in ${city.name}. Online-Buchungssystem, eigene Landingpage, automatische Reifenbestellung.`,
      provider: {
        '@type': 'Organization',
        name: 'Bereifung24'
      },
      areaServed: {
        '@type': 'City',
        name: city.name,
        containedInPlace: {
          '@type': 'State',
          name: city.state || 'Deutschland'
        }
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Kostenlose Registrierung, keine Grundgebühr'
      }
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://www.bereifung24.de' },
        { '@type': 'ListItem', position: 2, name: 'Für Werkstätten', item: 'https://www.bereifung24.de/werkstatt' },
        { '@type': 'ListItem', position: 3, name: city.name, item: `https://www.bereifung24.de/werkstatt-werden/${city.slug}` }
      ]
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WerkstattWerdenCityPage city={city} />
    </>
  )
}
