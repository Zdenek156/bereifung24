import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

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
          className="relative py-20 px-4 sm:px-6 lg:px-8"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}15 0%, ${accentColor}15 100%)`
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                {landingPage.heroHeadline || `Willkommen bei ${landingPage.workshop.companyName}`}
              </h1>
              
              {landingPage.heroSubline && (
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
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
                <a
                  href={`tel:${landingPage.workshop.user.phone}`}
                  className="inline-block px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  📞 {landingPage.workshop.user.phone}
                </a>
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
              <div className="prose prose-lg max-w-none text-gray-700">
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
                    
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📞</span>
                      <a href={`tel:${landingPage.workshop.user.phone}`} className="hover:underline">
                        {landingPage.workshop.user.phone}
                      </a>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">✉️</span>
                      <a href={`mailto:${landingPage.workshop.user.email}`} className="hover:underline">
                        {landingPage.workshop.user.email}
                      </a>
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
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sde!2sde!4v1234567890!5m2!1sde!2sde&q=${encodeURIComponent(
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
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} {landingPage.workshop.companyName}. Alle Rechte vorbehalten.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Powered by <Link href="/" className="text-gray-300 hover:text-white">Bereifung24</Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
