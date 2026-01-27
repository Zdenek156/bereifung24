import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Force dynamic rendering to always show latest data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const landingPage = await prisma.workshopLandingPage.findUnique({
    where: { slug: params.slug },
    include: {
      workshop: {
        include: {
          user: true
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
          user: true
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
        {/* Hero Section */}
        <section 
          className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[600px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: landingPage.heroImage 
              ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://www.bereifung24.de${landingPage.heroImage})`
              : `linear-gradient(135deg, ${primaryColor}15 0%, ${accentColor}15 100%)`
          }}
        >
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center">
              {/* Workshop Logo */}
              {landingPage.showLogo && landingPage.workshop.logoUrl && (
                <div className="mb-8 flex justify-center">
                  <img 
                    src={landingPage.workshop.logoUrl} 
                    alt={`${landingPage.workshop.companyName} Logo`}
                    className="h-24 w-auto object-contain drop-shadow-lg"
                  />
                </div>
              )}
              
              <h1 
                className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 ${
                  landingPage.heroImage ? 'text-white drop-shadow-2xl' : 'text-gray-900'
                }`}
              >
                {landingPage.heroHeadline || `Willkommen bei ${landingPage.workshop.companyName}`}
              </h1>
              
              {landingPage.heroSubline && (
                <p 
                  className={`text-xl mb-8 max-w-3xl mx-auto text-center ${
                    landingPage.heroImage ? 'text-white/95 drop-shadow-lg' : 'text-gray-600'
                  }`}
                >
                  {landingPage.heroSubline}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard/customer/create-request"
                  className="inline-block px-8 py-4 text-white rounded-lg text-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)` }}
                >
                  Jetzt Anfrage stellen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        {landingPage.aboutTitle && landingPage.aboutText && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                {landingPage.aboutTitle}
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700 text-center">
                {landingPage.aboutText.split('\n').map((paragraph, idx) => (
                  paragraph.trim() && <p key={idx} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Unsere Leistungen
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: '🚗', title: 'Reifenwechsel', desc: 'Professionelle Reifenmontage & Einlagerung' },
                { icon: '🔧', title: 'Inspektionen', desc: 'Regelmäßige Wartung nach Herstellervorgaben' },
                { icon: '⚡', title: 'Reparaturen', desc: 'Schnelle Diagnose und fachgerechte Reparatur' },
                { icon: '🛠️', title: 'Bremsenservice', desc: 'Bremsscheiben, Beläge und Bremsflüssigkeit' },
                { icon: '🔋', title: 'Klimaservice', desc: 'Klimaanlagen-Wartung und -Reparatur' },
                { icon: '💡', title: 'Elektrik', desc: 'Fehlerdiagnose und elektrische Reparaturen' }
              ].map((service, idx) => (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Kontakt & Anfahrt
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Kontaktdaten</h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🏢</span>
                      <div>
                        <div className="font-semibold">{landingPage.workshop.companyName}</div>
                        <div>{landingPage.workshop.user.street}</div>
                        <div>{landingPage.workshop.user.zipCode} {landingPage.workshop.user.city}</div>
                      </div>
                    </div>
                    
                    {landingPage.workshop.website && (
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🌐</span>
                        <a 
                          href={landingPage.workshop.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {landingPage.workshop.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {landingPage.showOpeningHours && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Öffnungszeiten</h3>
                    <div className="space-y-2 text-gray-700">
                      <div className="flex justify-between">
                        <span>Montag - Freitag:</span>
                        <span className="font-semibold">08:00 - 18:00 Uhr</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Samstag:</span>
                        <span className="font-semibold">09:00 - 13:00 Uhr</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sonntag:</span>
                        <span className="font-semibold">Geschlossen</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map */}
              {landingPage.showMap && (
                <div className="h-96 bg-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyCCSIGljCWlIs7-1cgD05zfLwbvSNlb9Lk&q=${encodeURIComponent(
                      `${landingPage.workshop.user.street}, ${landingPage.workshop.user.zipCode} ${landingPage.workshop.user.city}`
                    )}`}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="py-16 px-4 sm:px-6 lg:px-8 text-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`
          }}
        >
          <div className="max-w-4xl mx-auto text-white">
            <h2 className="text-3xl font-bold mb-6">
              Bereit für Ihre Anfrage?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Stellen Sie jetzt unverbindlich eine Anfrage und erhalten Sie schnell ein individuelles Angebot.
            </p>
            <Link
              href="/dashboard/customer/create-request"
              className="inline-block px-10 py-4 bg-white text-gray-900 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              Jetzt Anfrage stellen →
            </Link>
          </div>
        </section>

        {/* Footer */}
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
            
            {/* Disclaimer */}
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
