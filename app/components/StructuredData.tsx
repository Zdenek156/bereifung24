import Script from 'next/script'

/**
 * Schema.org Structured Data for SEO
 * Implements LocalBusiness, AggregateRating, and Service schemas
 */
export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // Organization + AutoRepair Platform Schema
      {
        '@type': ['Organization', 'AutoRepair'],
        '@id': 'https://bereifung24.de/#organization',
        name: 'Bereifung24',
        alternateName: 'Bereifung24.de',
        legalName: 'Bereifung24',
        url: 'https://bereifung24.de',
        logo: {
          '@type': 'ImageObject',
          url: 'https://bereifung24.de/logos/B24_Logo.png',
          width: 512,
          height: 512
        },
        image: 'https://bereifung24.de/logos/B24_Logo.png',
        description: 'Deutschlands erste digitale Plattform für Reifenservice. Transparente Festpreise, geprüfte Werkstätten, Online-Buchung. Bereifung24 vermittelt zwischen Endkunden und Kfz-Werkstätten für Räderwechsel, Reifenwechsel, Achsvermessung, Klimaservice und mehr.',
        slogan: 'Reifenservice zum Festpreis – transparent, digital, geprüft.',
        foundingDate: '2022',
        foundingLocation: {
          '@type': 'Place',
          name: 'Markgröningen, Baden-Württemberg, Deutschland'
        },
        founder: {
          '@type': 'Person',
          name: 'Zdenek Kyzlink',
          jobTitle: 'Gründer & Geschäftsführer'
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Jahnstraße 2',
          addressLocality: 'Markgröningen',
          postalCode: '71706',
          addressRegion: 'Baden-Württemberg',
          addressCountry: 'DE'
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 48.9069,
          longitude: 9.0858
        },
        areaServed: {
          '@type': 'Country',
          name: 'Deutschland'
        },
        knowsLanguage: 'de',
        telephone: '+4971479679990',
        email: 'info@bereifung24.de',
        taxID: 'DE354910030',
        vatID: 'DE354910030',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            telephone: '+4971479679990',
            email: 'info@bereifung24.de',
            availableLanguage: ['de']
          },
          {
            '@type': 'ContactPoint',
            contactType: 'technical support',
            email: 'support@bereifung24.de',
            availableLanguage: ['de']
          }
        ],
        numberOfEmployees: {
          '@type': 'QuantitativeValue',
          minValue: 2,
          maxValue: 10
        },
        knowsAbout: [
          'Reifenservice',
          'Räderwechsel',
          'Reifenwechsel',
          'Achsvermessung',
          'Klimaservice',
          'Motorradreifen',
          'Reifenreparatur',
          'Online-Werkstattbuchung',
          'Kfz-Werkstatt-Vermittlung'
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Reifenservice-Angebote',
          itemListElement: [
            {
              '@type': 'OfferCatalog',
              name: 'Räderwechsel',
              description: 'Sommer-/Winterreifen wechseln zum Festpreis'
            },
            {
              '@type': 'OfferCatalog',
              name: 'Reifenwechsel',
              description: 'Reifen von der Felge ab- und aufziehen'
            },
            {
              '@type': 'OfferCatalog',
              name: 'Achsvermessung',
              description: '3D-Achsvermessung und Einstellung'
            },
            {
              '@type': 'OfferCatalog',
              name: 'Klimaservice',
              description: 'Klimaanlagen-Wartung und Befüllung'
            }
          ]
        },
        sameAs: [
          'https://www.facebook.com/people/Bereifung24/61552512005883/',
          'https://www.instagram.com/bereifung24/',
          'https://www.linkedin.com/company/bereifung24'
        ]
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
