import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import NewHomePage, { type FixedWorkshopContext } from '@/app/page'
import LandingPageHeaderActions from '@/components/LandingPageHeaderActions'

// Force dynamic rendering to always show latest data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    slug: string
  }
}

interface LandingServiceItem {
  title: string
  description?: string
  icon?: string
}

function parseOpeningHours(openingHoursRaw?: string | null): Array<{ day: string; time: string }> {
  if (!openingHoursRaw) {
    return []
  }

  const normalizeTime = (value: unknown): string => {
    if (!value) return 'Geschlossen'

    if (typeof value === 'string') {
      return value.trim() || 'Geschlossen'
    }

    if (typeof value === 'object') {
      const entry = value as Record<string, unknown>
      const isClosed = entry.closed === true || entry.working === false
      if (isClosed) {
        return 'Geschlossen'
      }

      const from = typeof entry.from === 'string' ? entry.from : ''
      const to = typeof entry.to === 'string' ? entry.to : ''
      const open = typeof entry.open === 'string' ? entry.open : ''
      const close = typeof entry.close === 'string' ? entry.close : ''

      if (from && to) {
        return `${from} - ${to}`
      }

      if (open && close) {
        return `${open} - ${close}`
      }
    }

    return 'Geschlossen'
  }

  try {
    const parsed = JSON.parse(openingHoursRaw) as Record<string, unknown>
    const dayMap: Array<{ key: string; label: string }> = [
      { key: 'monday', label: 'Montag' },
      { key: 'tuesday', label: 'Dienstag' },
      { key: 'wednesday', label: 'Mittwoch' },
      { key: 'thursday', label: 'Donnerstag' },
      { key: 'friday', label: 'Freitag' },
      { key: 'saturday', label: 'Samstag' },
      { key: 'sunday', label: 'Sonntag' },
    ]

    return dayMap.map(({ key, label }) => ({ day: label, time: normalizeTime(parsed[key]) }))
  } catch {
    return []
  }
}

function parseCustomServices(customServicesRaw: unknown): LandingServiceItem[] {
  if (!Array.isArray(customServicesRaw)) {
    return []
  }

  return customServicesRaw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const service = entry as Record<string, unknown>
      const title =
        (typeof service.title === 'string' && service.title) ||
        (typeof service.name === 'string' && service.name) ||
        ''

      if (!title) {
        return null
      }

      return {
        title,
        description:
          (typeof service.description === 'string' && service.description) ||
          (typeof service.desc === 'string' && service.desc) ||
          undefined,
        icon: typeof service.icon === 'string' ? service.icon : undefined,
      }
    })
    .filter((service): service is LandingServiceItem => service !== null)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const landingPage = await prisma.workshopLandingPage.findUnique({
    where: { slug: params.slug },
    include: {
      workshop: {
        include: {
          user: true,
          workshopServices: {
            where: { isActive: true },
            select: {
              serviceType: true,
              allowsDirectBooking: true,
            },
          },
        }
      }
    }
  })

  if (!landingPage || !landingPage.isActive) {
    return {
      title: 'Seite nicht gefunden',
      robots: 'noindex,nofollow'
    }
  }

  return {
    title: landingPage.metaTitle || `${landingPage.workshop.companyName} - Autowerkstatt`,
    description: landingPage.metaDescription || `${landingPage.workshop.companyName} - Professioneller Reifenservice und KFZ-Reparaturen`,
    keywords: landingPage.keywords || 'Autowerkstatt, Reifenwechsel, KFZ-Service',
    openGraph: {
      title: landingPage.metaTitle || landingPage.workshop.companyName,
      description: landingPage.metaDescription || '',
      type: 'website',
      locale: 'de_DE',
    },
    robots: landingPage.isActive ? 'index,follow' : 'noindex,nofollow',
    alternates: {
      canonical: `https://bereifung24.de/${params.slug}`
    }
  }
}

export default async function WorkshopLandingPage({ params }: PageProps) {
  console.log('Looking for slug:', params.slug)
  
  const landingPage = await prisma.workshopLandingPage.findUnique({
    where: { slug: params.slug },
    include: {
      workshop: {
        include: {
          user: true,
          workshopServices: {
            where: { isActive: true },
            select: {
              serviceType: true,
              allowsDirectBooking: true,
              basePrice: true,
              basePrice4: true,
              durationMinutes: true,
              durationMinutes4: true,
              servicePackages: {
                where: { isActive: true },
                select: {
                  price: true,
                },
              },
            },
          },
        }
      }
    }
  })

  console.log('Found landing page:', landingPage ? `Yes (active: ${landingPage.isActive})` : 'No')
  console.log('Hero Image:', landingPage?.heroImage || 'Not set')
  console.log('Show Logo:', landingPage?.showLogo)
  console.log('Workshop Logo:', landingPage?.workshop?.logoUrl || 'Not set')

  if (!landingPage || !landingPage.isActive) {
    console.log('Landing page not found or not active, showing 404')
    notFound()
  }

  // Increment view count
  await prisma.workshopLandingPage.update({
    where: { id: landingPage.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date()
    }
  })

  // Fetch workshop reviews if needed
  const workshopReviews = landingPage.showReviews
    ? await prisma.review.findMany({
        where: { workshopId: landingPage.workshopId, rating: { gte: 4 } },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { customer: { include: { user: { select: { firstName: true, lastName: true } } } } }
      })
    : []

  const primaryColor = landingPage.primaryColor || '#7C3AED'
  const accentColor = landingPage.accentColor || '#EC4899'
  const displayHeadline = landingPage.heroHeadline || `Willkommen bei ${landingPage.workshop.companyName}`
  const displaySubline =
    landingPage.heroSubline ||
    `${landingPage.workshop.companyName} – Ihr zuverlässiger Partner für Reifenservice.`
  const workshopServiceList = Array.isArray(landingPage.workshop.workshopServices)
    ? landingPage.workshop.workshopServices
    : []
  const activeServiceTypes = workshopServiceList.map((service) => service.serviceType)
  const allowedServiceTypes = activeServiceTypes

  // Template-based visual config
  const template = landingPage.template || 'modern'
  const tmpl = {
    modern: {
      heroClass: 'py-14 sm:py-20',
      sectionBg: 'bg-gray-50',
      cardRound: 'rounded-2xl',
      shadow: 'shadow-xl',
      headingStyle: 'font-bold',
    },
    classic: {
      heroClass: 'py-12 sm:py-16',
      sectionBg: 'bg-white border-b border-gray-200',
      cardRound: 'rounded-lg',
      shadow: 'shadow-md border border-gray-200',
      headingStyle: 'font-semibold tracking-wide',
    },
    minimal: {
      heroClass: 'py-10 sm:py-14',
      sectionBg: 'bg-white',
      cardRound: 'rounded',
      shadow: 'shadow-sm border border-gray-100',
      headingStyle: 'font-medium',
    },
    professional: {
      heroClass: 'py-16 sm:py-24',
      sectionBg: 'bg-gray-100',
      cardRound: 'rounded-xl',
      shadow: 'shadow-lg',
      headingStyle: 'font-bold uppercase tracking-widest text-sm',
    },
  }[template] ?? {
    heroClass: 'py-14 sm:py-20',
    sectionBg: 'bg-gray-50',
    cardRound: 'rounded-2xl',
    shadow: 'shadow-xl',
    headingStyle: 'font-bold',
  }

  // Hero background based on template
  const heroBackground: React.CSSProperties = landingPage.heroImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,${template === 'classic' ? '0.6' : template === 'professional' ? '0.65' : '0.55'}), rgba(0,0,0,0.45)), url(https://www.bereifung24.de${landingPage.heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : template === 'classic'
    ? { background: primaryColor }
    : template === 'minimal'
    ? { background: `linear-gradient(160deg, ${primaryColor}22 0%, ${primaryColor}44 100%)` }
    : template === 'professional'
    ? { background: `linear-gradient(160deg, #1f2937 0%, #374151 100%)` }
    : { backgroundImage: `linear-gradient(160deg, ${primaryColor} 0%, ${accentColor} 100%)` }

  // Opening hours
  const openingHoursList = parseOpeningHours(landingPage.workshop.user?.openingHours)

  const heroTextColor = template === 'minimal' ? 'text-gray-900' : 'text-white'
  const heroSubTextColor = template === 'minimal' ? 'text-gray-600' : 'text-white/90'
  const heroDimTextColor = template === 'minimal' ? 'text-gray-500' : 'text-white/85'
  const heroBadgeBg = template === 'minimal' ? `bg-gray-100 text-gray-700` : 'bg-white/20 text-white/90'

  // Map embed URL
  const workshopLat = landingPage.workshop.latitude
  const workshopLon = landingPage.workshop.longitude
  const workshopAddress = [
    landingPage.workshop.user?.street,
    landingPage.workshop.user?.zipCode,
    landingPage.workshop.user?.city,
  ].filter(Boolean).join(', ')
  const mapEmbedUrl = workshopLat && workshopLon
    ? `https://maps.google.com/maps?q=${workshopLat},${workshopLon}&z=15&output=embed`
    : workshopAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(workshopAddress)}&z=15&output=embed`
    : null
  const initialFixedWorkshopContext: FixedWorkshopContext | null =
    landingPage.workshop.latitude != null && landingPage.workshop.longitude != null
      ? {
          landingPageSlug: landingPage.slug,
          workshopId: landingPage.workshop.id,
          workshopName: landingPage.workshop.companyName,
          latitude: Number(landingPage.workshop.latitude),
          longitude: Number(landingPage.workshop.longitude),
        }
      : null

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: landingPage.workshop.companyName,
            description: landingPage.metaDescription,
            address: {
              '@type': 'PostalAddress',
              streetAddress: landingPage.workshop.user.street || '',
              postalCode: landingPage.workshop.user.zipCode || '',
              addressLocality: landingPage.workshop.user.city || '',
              addressCountry: 'DE'
            },
            telephone: landingPage.workshop.user.phone || '',
            email: landingPage.workshop.user.email,
            ...(landingPage.workshop.website && { url: landingPage.workshop.website }),
          })
        }}
      />

      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {landingPage.showLogo && landingPage.workshop.logoUrl ? (
                <img
                  src={landingPage.workshop.logoUrl}
                  alt={`${landingPage.workshop.companyName} Logo`}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {landingPage.workshop.companyName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{landingPage.workshop.companyName}</p>
                <p className="text-xs text-gray-500">{landingPage.workshop.user.city || 'Deutschland'}</p>
              </div>
            </div>

            <LandingPageHeaderActions />
          </div>
        </header>

        <section
          className={`relative overflow-hidden px-4 ${tmpl.heroClass} sm:px-6 lg:px-8`}
          style={heroBackground}
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className={`mb-4 text-3xl font-bold leading-tight sm:text-5xl ${heroTextColor}`}>{displayHeadline}</h1>
              <p className={`mb-6 max-w-2xl text-base sm:text-lg ${heroSubTextColor}`}>{displaySubline}</p>
              <p className={`mb-8 text-sm ${heroDimTextColor}`}>
                📍 {landingPage.workshop.user.street || ''} {landingPage.workshop.user.zipCode || ''}{' '}
                {landingPage.workshop.user.city || ''}
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className={`rounded-full px-3 py-1 ${heroBadgeBg}`}>🔍 Online Reifen finden</span>
                <span className={`rounded-full px-3 py-1 ${heroBadgeBg}`}>📅 Online Termin buchen</span>
                <span className={`rounded-full px-3 py-1 ${heroBadgeBg}`}>💳 Online bezahlen</span>
              </div>
            </div>

            <div className={`bg-white p-6 ${tmpl.cardRound} ${tmpl.shadow}`}>
              <p className="text-lg font-bold text-gray-900">Termin buchen</p>
              <p className="mb-4 mt-1 text-sm text-gray-600">Direkt bei {landingPage.workshop.companyName}</p>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• Service &amp; passenden Reifen direkt auswählen</p>
                <p>• Termin online in Sekunden erstellen</p>
                <p>• Sichere Online-Bezahlung direkt abschließen</p>
              </div>
              <a
                href="#direkt-buchen"
                className="mt-5 block rounded-lg px-4 py-3 text-center text-sm font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
              >
                {landingPage.ctaText || 'Jetzt buchen'}
              </a>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            <span>✓ Geprüfte Werkstatt</span>
            <span>•</span>
            <span>✓ Sichere Bezahlung</span>
            <span>•</span>
            <span>✓ 24/7 Buchung</span>
          </div>
        </section>

        <section id="direkt-buchen" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 text-center">
              Direkt bei {landingPage.workshop.companyName} buchen
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Die komplette Buchung läuft direkt hier auf der Landingpage.
            </p>
            <NewHomePage
              initialFixedWorkshopContext={initialFixedWorkshopContext}
              hideHeroHeader
              allowedServiceTypes={allowedServiceTypes}
              serviceCards={workshopServiceList.map((service) => {
                const packagePrices = service.servicePackages
                  .map((pkg) => pkg.price)
                  .filter((price) => typeof price === 'number' && price > 0)
                const minPackagePrice = packagePrices.length > 0 ? Math.min(...packagePrices) : null

                return {
                  serviceType: service.serviceType,
                  basePrice: minPackagePrice ?? service.basePrice,
                  basePrice4: service.basePrice4,
                  durationMinutes: service.durationMinutes,
                  durationMinutes4: service.durationMinutes4,
                }
              })}
            />
          </div>
        </section>

        {/* Über Uns Section */}
        {landingPage.aboutText && (
          <section className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 ${tmpl.sectionBg}`}>
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
                Über uns
              </h2>
              <div className={`bg-white ${tmpl.cardRound} ${tmpl.shadow} p-6 sm:p-8`}>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                  {landingPage.aboutText}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Opening Hours + Reviews above footer */}
        {(landingPage.showOpeningHours || landingPage.showReviews) && (
          <section className={`py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100`}>
            <div className="max-w-7xl mx-auto">
              <div className={`grid gap-8 ${landingPage.showOpeningHours && landingPage.showReviews ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Opening Hours */}
                {landingPage.showOpeningHours && openingHoursList.length > 0 && (
                  <div className={`bg-gray-50 ${tmpl.cardRound} p-6`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      🕐 Öffnungszeiten
                    </h3>
                    <div className="space-y-2">
                      {openingHoursList.map(({ day, time }) => {
                        const isClosed = time === 'Geschlossen'
                        const today = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][new Date().getDay()]
                        const isToday = day === today
                        return (
                          <div key={day} className={`flex justify-between items-center py-1.5 px-3 rounded-lg ${isToday ? 'bg-white border border-gray-200 font-semibold' : ''}`}>
                            <span className={`text-sm ${isClosed ? 'text-gray-400' : 'text-gray-700'} ${isToday ? 'font-semibold text-gray-900' : ''}`}>
                              {day}{isToday && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: primaryColor + '22', color: primaryColor }}>Heute</span>}
                            </span>
                            <span className={`text-sm ${isClosed ? 'text-gray-400 italic' : 'text-gray-800 font-medium'}`}>
                              {time}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {landingPage.showReviews && workshopReviews.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      ⭐ Kundenbewertungen
                    </h3>
                    <div className="space-y-3">
                      {workshopReviews.map((review) => (
                        <div key={review.id} className={`bg-gray-50 ${tmpl.cardRound} p-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 text-sm">
                              {review.customer.user?.firstName || 'Kunde'} {review.customer.user?.lastName ? review.customer.user.lastName[0] + '.' : ''}
                            </span>
                            <span className="text-yellow-400 text-sm">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{review.comment}</p>
                          )}
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(review.createdAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Map Section */}
        {landingPage.showMap && mapEmbedUrl && (
          <section className={`px-4 sm:px-6 lg:px-8 pb-12 bg-white`}>
            <div className="max-w-7xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📍 Standort
              </h3>
              <div className={`overflow-hidden ${tmpl.cardRound} border border-gray-200`} style={{ height: '360px' }}>
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Standort ${landingPage.workshop.companyName}`}
                />
              </div>
              {workshopAddress && (
                <p className="mt-3 text-sm text-gray-500 text-center">
                  📍 {workshopAddress}
                </p>
              )}
            </div>
          </section>
        )}

        <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-gray-400">
                © {new Date().getFullYear()} {landingPage.workshop.companyName}. Alle Rechte vorbehalten.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Powered by <Link href="/" className="text-gray-300 hover:text-white">Bereifung24</Link>
              </p>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <p className="text-gray-500 text-xs text-center max-w-4xl mx-auto">
                <strong className="text-gray-400">Haftungsausschluss:</strong> Die auf dieser Landing Page dargestellten Inhalte, Angebote und Informationen werden von {landingPage.workshop.companyName} eigenverantwortlich bereitgestellt. Bereifung24 übernimmt keine Haftung für die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Informationen. Für alle Inhalte ist ausschließlich der jeweilige Werkstattbetreiber verantwortlich.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
