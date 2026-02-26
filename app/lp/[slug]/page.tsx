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
          className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
          style={{
            backgroundImage: landingPage.heroImage
              ? `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.45)), url(https://www.bereifung24.de${landingPage.heroImage})`
              : `linear-gradient(160deg, ${primaryColor} 0%, ${accentColor} 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h1 className="mb-4 text-3xl font-bold leading-tight text-white sm:text-5xl">{displayHeadline}</h1>
              <p className="mb-6 max-w-2xl text-base text-white/90 sm:text-lg">{displaySubline}</p>
              <p className="mb-8 text-sm text-white/85">
                📍 {landingPage.workshop.user.street || ''} {landingPage.workshop.user.zipCode || ''}{' '}
                {landingPage.workshop.user.city || ''}
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-white/90">
                <span className="rounded-full bg-white/20 px-3 py-1">Online buchen</span>
                <span className="rounded-full bg-white/20 px-3 py-1">Werkstattgebundene Angebote</span>
                <span className="rounded-full bg-white/20 px-3 py-1">Sofort verfügbar</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-xl">
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
            <span>✓ Direkte Buchung ohne Umkreissuche</span>
            <span>•</span>
            <span>✓ Buchung nur bei {landingPage.workshop.companyName}</span>
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
