// Shared factory for service+city SEO pages
// Each service route directory imports from here to avoid code duplication

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServiceBySlug, getServiceCityBySlug, getAllServiceCitySlugs, getServiceCityFaqs } from '@/lib/seo/service-city-pages'
import ServiceCityPageComponent from '@/app/components/ServiceCityPage'

interface PageProps {
  params: { city: string }
}

export function createServiceCityPage(serviceSlug: string) {
  const service = getServiceBySlug(serviceSlug)
  if (!service) throw new Error(`Service "${serviceSlug}" not found`)

  function generateStaticParams() {
    return getAllServiceCitySlugs().map(city => ({ city }))
  }

  async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const city = getServiceCityBySlug(params.city)
    if (!city) return { title: 'Seite nicht gefunden' }

    const title = `${service.name} ${city.cityName} | Bereifung24 – Online buchen zum Festpreis`
    const description = `${service.name} in ${city.cityName}: ${service.description} Jetzt Werkstatt vergleichen, Termin buchen & Festpreis sichern. ✓ Geprüfte Werkstätten ✓ Online-Buchung`

    return {
      title,
      description,
      keywords: `${service.name.toLowerCase()} ${city.cityName.toLowerCase()}, ${service.slug} ${city.citySlug}, reifen ${city.cityName.toLowerCase()}, werkstatt ${city.cityName.toLowerCase()}, reifenservice ${city.cityName.toLowerCase()}`,
      alternates: {
        canonical: `https://www.bereifung24.de/${service.slug}/${city.citySlug}`,
      },
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://www.bereifung24.de/${service.slug}/${city.citySlug}`,
        siteName: 'Bereifung24',
        locale: 'de_DE',
        images: [{ url: 'https://www.bereifung24.de/og-image.jpg', width: 1200, height: 630, alt: `${service.name} in ${city.cityName}` }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      robots: { index: true, follow: true },
    }
  }

  function Page({ params }: PageProps) {
    const city = getServiceCityBySlug(params.city)
    if (!city) notFound()

    const faqs = getServiceCityFaqs(service, city)

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${service.name} in ${city.cityName}`,
        description: `${service.description} In ${city.cityName} und Umgebung.`,
        provider: {
          '@type': 'Organization',
          name: 'Bereifung24',
          url: 'https://www.bereifung24.de',
        },
        areaServed: {
          '@type': 'City',
          name: city.cityName,
          containedInPlace: { '@type': 'State', name: 'Baden-Württemberg' },
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          description: service.priceRange,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://www.bereifung24.de' },
          { '@type': 'ListItem', position: 2, name: service.name, item: `https://www.bereifung24.de/services/${service.slug}` },
          { '@type': 'ListItem', position: 3, name: city.cityName, item: `https://www.bereifung24.de/${service.slug}/${city.citySlug}` },
        ],
      },
    ]

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ServiceCityPageComponent service={service} city={city} />
      </>
    )
  }

  return { generateStaticParams, generateMetadata, Page }
}
