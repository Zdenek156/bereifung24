import Script from 'next/script'

/**
 * Schema.org Structured Data for SEO
 * Implements LocalBusiness, AggregateRating, and Service schemas
 */
export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // Organization/LocalBusiness Schema
      {
        '@type': 'Organization',
        '@id': 'https://bereifung24.de/#organization',
        name: 'Bereifung24',
        url: 'https://bereifung24.de',
        logo: {
          '@type': 'ImageObject',
          url: 'https://bereifung24.de/logo.png',
          width: 512,
          height: 512
        },
        description: 'Deutschlands erste digitale Plattform für Reifenservice. Transparente Festpreise, geprüfte Werkstätten, Online-Buchung.',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'DE'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5.0',
          bestRating: '5',
          worstRating: '1',
          ratingCount: '100'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'info@bereifung24.de',
          availableLanguage: ['de']
        }
      },
      
      // Website Schema
      {
        '@type': 'WebSite',
        '@id': 'https://bereifung24.de/#website',
        url: 'https://bereifung24.de',
        name: 'Bereifung24',
        publisher: {
          '@id': 'https://bereifung24.de/#organization'
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://bereifung24.de/?service={service}&postalCode={postal_code}',
          'query-input': [
            'required name=service',
            'required name=postal_code'
          ]
        }
      },

      // Service: Räderwechsel
      {
        '@type': 'Service',
        '@id': 'https://bereifung24.de/#service-wheel-change',
        serviceType: 'Räderwechsel',
        provider: {
          '@id': 'https://bereifung24.de/#organization'
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland'
        },
        description: 'Professioneller Räderwechsel von Sommer- auf Winterreifen oder umgekehrt. Inklusive Auswuchten und Montage.',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice: '19.90',
          highPrice: '89.90',
          offerCount: '100'
        }
      },

      // Service: Reifenwechsel
      {
        '@type': 'Service',
        '@id': 'https://bereifung24.de/#service-tire-change',
        serviceType: 'Reifenwechsel',
        provider: {
          '@id': 'https://bereifung24.de/#organization'
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland'
        },
        description: 'Reifen professionell von der Felge ab- und wieder aufziehen. Mit Auswuchten und Montage.',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice: '39.90',
          highPrice: '149.90',
          offerCount: '100'
        }
      },

      // Service: Reifenreparatur
      {
        '@type': 'Service',
        '@id': 'https://bereifung24.de/#service-tire-repair',
        serviceType: 'Reifenreparatur',
        provider: {
          '@id': 'https://bereifung24.de/#organization'
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland'
        },
        description: 'Professionelle Reifenreparatur mit Vulkanisierung bei kleinen Schäden und Pannenhilfe.'
      },

      // Service: Achsvermessung
      {
        '@type': 'Service',
        '@id': 'https://bereifung24.de/#service-alignment',
        serviceType: 'Achsvermessung',
        provider: {
          '@id': 'https://bereifung24.de/#organization'
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland'
        },
        description: '3D-Achsvermessung und -einstellung für optimalen Geradeauslauf und gleichmäßigen Reifenverschleiß.'
      },

      // Service: Klimaservice
      {
        '@type': 'Service',
        '@id': 'https://bereifung24.de/#service-climate',
        serviceType: 'Klimaservice',
        provider: {
          '@id': 'https://bereifung24.de/#organization'
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland'
        },
        description: 'Klimaanlagen-Wartung, Desinfektion und Befüllung für optimale Kühlleistung.'
      },

      // Service: Motorradreifen
      {
        '@type': 'Service',
        '@id': 'https://bereifung24.de/#service-motorcycle',
        serviceType: 'Motorradreifen-Service',
        provider: {
          '@id': 'https://bereifung24.de/#organization'
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland'
        },
        description: 'Spezialisierte Montage für Motorrad-Vorder- und Hinterreifen.'
      }
    ]
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      strategy="beforeInteractive"
    />
  )
}
