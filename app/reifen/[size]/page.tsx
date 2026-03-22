import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllTireSizeSlugs, getTireSizeBySlug } from '@/lib/seo/tire-sizes'
import TireSizePage from './TireSizePage'

interface PageProps {
  params: {
    size: string
  }
}

export async function generateStaticParams() {
  return getAllTireSizeSlugs().map((size) => ({ size }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tire = getTireSizeBySlug(params.size)

  if (!tire) {
    return { title: 'Seite nicht gefunden' }
  }

  return {
    title: tire.metaTitle,
    description: tire.metaDescription,
    keywords: `${tire.displayName} reifen, ${tire.displayName} reifen kaufen, ${tire.displayName} sommerreifen, ${tire.displayName} winterreifen, ${tire.displayName} ganzjahresreifen, ${tire.displayName} reifen mit montage, ${tire.commonVehicles.slice(0, 3).join(' reifen, ')} reifen`,
    alternates: {
      canonical: `https://www.bereifung24.de/reifen/${tire.slug}`,
    },
    openGraph: {
      title: tire.metaTitle,
      description: tire.metaDescription,
      type: 'website',
      url: `https://www.bereifung24.de/reifen/${tire.slug}`,
      siteName: 'Bereifung24',
      locale: 'de_DE',
      images: [{
        url: 'https://www.bereifung24.de/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `${tire.displayName} Reifen bei Bereifung24`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: tire.metaTitle,
      description: tire.metaDescription,
    },
    robots: { index: true, follow: true },
  }
}

export default function Page({ params }: PageProps) {
  const tire = getTireSizeBySlug(params.size)

  if (!tire) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: tire.h1,
    description: tire.metaDescription,
    url: `https://www.bereifung24.de/reifen/${tire.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Bereifung24',
      url: 'https://www.bereifung24.de',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.bereifung24.de/og-image.jpg',
      },
    },
    mainEntity: {
      '@type': 'Product',
      name: `${tire.displayName} Reifen`,
      description: `${tire.displayName} Reifen für ${tire.commonVehicles.slice(0, 3).join(', ')} und weitere Fahrzeuge. Online kaufen mit Montage-Service.`,
      category: 'Autoreifen',
      brand: {
        '@type': 'Brand',
        name: 'Verschiedene Marken',
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        offerCount: '50+',
      },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://www.bereifung24.de' },
        { '@type': 'ListItem', position: 2, name: 'Reifen', item: 'https://www.bereifung24.de/reifen' },
        { '@type': 'ListItem', position: 3, name: tire.displayName, item: `https://www.bereifung24.de/reifen/${tire.slug}` },
      ],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TireSizePage tire={tire} />
    </>
  )
}
