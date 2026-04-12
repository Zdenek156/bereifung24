import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Über uns - Bereifung24 | Deutschlands digitale Reifenservice-Plattform',
  description: 'Erfahren Sie mehr über Bereifung24 – Deutschlands erste digitale Plattform für Reifenservice. Gegründet 2022 von Zdenek Kyzlink in Markgröningen. Transparente Festpreise, geprüfte Werkstätten.',
  keywords: 'Bereifung24, Über uns, Reifenservice Plattform, Gründer, Zdenek Kyzlink, Markgröningen, digitale Werkstattbuchung',
  alternates: { canonical: 'https://bereifung24.de/ueber-uns' },
  openGraph: {
    title: 'Über uns - Bereifung24',
    description: 'Deutschlands erste digitale Plattform für Reifenservice. Gegründet 2024 in Markgröningen.',
    url: 'https://bereifung24.de/ueber-uns',
    siteName: 'Bereifung24',
    locale: 'de_DE',
    type: 'website',
    images: [{
      url: 'https://bereifung24.de/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Bereifung24 - Über uns'
    }]
  }
}

export default function UeberUnsPage() {
  const aboutPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': 'https://bereifung24.de/ueber-uns',
    name: 'Über Bereifung24',
    description: 'Informationen über Bereifung24 – Deutschlands erste digitale Plattform für Reifenservice.',
    url: 'https://bereifung24.de/ueber-uns',
    mainEntity: {
      '@id': 'https://bereifung24.de/#organization'
    },
    isPartOf: {
      '@id': 'https://bereifung24.de/#website'
    }
  }

  return (
    <>
      <Script
        id="about-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
        strategy="beforeInteractive"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <Link
              href="/"
              className="text-blue-200 hover:text-white mb-6 flex items-center inline-flex transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück zur Startseite
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Über Bereifung24
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl">
              Deutschlands erste digitale Plattform für Reifenservice – transparent, fair und digital.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Mission */}
          <section className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Unsere Mission</h2>
            </div>
            <div className="text-lg text-gray-700 space-y-4">
              <p>
                <strong>Reifenservice soll einfach sein.</strong> Keine undurchsichtigen Preise, kein langes 
                Telefonieren, keine Überraschungen an der Kasse. Bereifung24 wurde gegründet, um den 
                Reifenservice in Deutschland zu digitalisieren und für alle transparent zu machen.
              </p>
              <p>
                Auf unserer Plattform finden Autofahrer geprüfte Werkstätten in ihrer Nähe, vergleichen 
                transparente Festpreise und buchen ihren Termin in wenigen Klicks online. Werkstätten 
                profitieren von neuen Kunden ohne Werbekosten und einer einfachen digitalen Terminverwaltung.
              </p>
            </div>
          </section>

          {/* Gründergeschichte */}
          <section className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Die Gründergeschichte</h2>
            </div>
            <div className="text-lg text-gray-700 space-y-4">
              <p>
                Bereifung24 wurde <strong>2022</strong> von <strong>Zdenek Kyzlink</strong> in Markgröningen 
                (Baden-Württemberg) gegründet. Die Idee entstand aus einer persönlichen Erfahrung: 
                Beim Reifenwechsel war es nahezu unmöglich, schnell und transparent Preise zu vergleichen 
                oder einen Termin online zu buchen.
              </p>
              <p>
                „Warum kann man Flüge, Hotels und Restaurants online buchen – aber keinen Reifenwechsel? 
                Das wollte ich ändern", so Gründer Zdenek Kyzlink.
              </p>
              <p>
                Was als Idee begann, ist heute eine wachsende Plattform mit Werkstätten in ganz Deutschland. 
                Bereifung24 verbindet Autofahrer mit lokalen Kfz-Werkstätten und bietet einen Service, 
                der digital, transparent und fair ist.
              </p>
            </div>
          </section>

          {/* Was uns auszeichnet */}
          <section className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Was uns auszeichnet</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Transparente Festpreise</h3>
                <p className="text-gray-600">
                  Keine versteckten Kosten. Der Preis, den Sie sehen, ist der Preis, den Sie zahlen.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Geprüfte Werkstätten</h3>
                <p className="text-gray-600">
                  Alle Partner-Werkstätten werden von uns geprüft und durch echte Kundenbewertungen bewertet.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">100% Digital</h3>
                <p className="text-gray-600">
                  Online vergleichen, buchen und bezahlen – auf dem Desktop, Tablet oder Smartphone.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sichere Bezahlung</h3>
                <p className="text-gray-600">
                  Zahlung über Stripe mit allen gängigen Methoden: Kreditkarte, PayPal, SEPA-Lastschrift.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">🇩🇪</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Made in Germany</h3>
                <p className="text-gray-600">
                  Entwickelt und betrieben in Deutschland. Hosting auf deutschen Servern, DSGVO-konform.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">⭐</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Echte Bewertungen</h3>
                <p className="text-gray-600">
                  Nur verifizierte Kunden können Bewertungen abgeben – nach einer echten Buchung.
                </p>
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Unsere Services</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-semibold text-gray-900">Räderwechsel</p>
                  <p className="text-sm text-gray-600">Sommer-/Winterreifen wechseln</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">🛞</span>
                <div>
                  <p className="font-semibold text-gray-900">Reifenwechsel</p>
                  <p className="text-sm text-gray-600">Reifen ab- und aufziehen</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">📐</span>
                <div>
                  <p className="font-semibold text-gray-900">Achsvermessung</p>
                  <p className="text-sm text-gray-600">3D-Achsvermessung und Einstellung</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">❄️</span>
                <div>
                  <p className="font-semibold text-gray-900">Klimaservice</p>
                  <p className="text-sm text-gray-600">Klimaanlagen-Wartung und Befüllung</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">🏍️</span>
                <div>
                  <p className="font-semibold text-gray-900">Motorradreifen</p>
                  <p className="text-sm text-gray-600">Spezialmontage für Motorräder</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">🔧</span>
                <div>
                  <p className="font-semibold text-gray-900">Reifenreparatur</p>
                  <p className="text-sm text-gray-600">Vulkanisierung bei kleinen Schäden</p>
                </div>
              </div>
            </div>
          </section>

          {/* Firmendaten */}
          <section className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Firmendaten</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Unternehmen</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Firma:</strong> Bereifung24</p>
                  <p><strong>Inhaber:</strong> Zdenek Kyzlink</p>
                  <p><strong>Gründung:</strong> 2022</p>
                  <p><strong>Sitz:</strong> Markgröningen, Baden-Württemberg</p>
                  <p><strong>USt-IdNr:</strong> DE354910030</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Kontakt</h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Adresse:</strong><br />
                    Jahnstraße 2<br />
                    71706 Markgröningen
                  </p>
                  <p>
                    <strong>Telefon:</strong>{' '}
                    <a href="tel:+4971479679990" className="text-blue-600 hover:underline">+49 7147 9679990</a>
                  </p>
                  <p>
                    <strong>E-Mail:</strong>{' '}
                    <a href="mailto:info@bereifung24.de" className="text-blue-600 hover:underline">info@bereifung24.de</a>
                  </p>
                  <p>
                    <strong>Support:</strong>{' '}
                    <a href="mailto:support@bereifung24.de" className="text-blue-600 hover:underline">support@bereifung24.de</a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Social Media & Plattformen */}
          <section className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Folgen Sie uns</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <a
                href="https://www.instagram.com/bereifung24/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors"
              >
                <span className="text-2xl">📸</span>
                <div>
                  <p className="font-semibold text-gray-900">Instagram</p>
                  <p className="text-sm text-gray-600">@bereifung24</p>
                </div>
              </a>
              <a
                href="https://www.facebook.com/people/Bereifung24/61552512005883/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <span className="text-2xl">📘</span>
                <div>
                  <p className="font-semibold text-gray-900">Facebook</p>
                  <p className="text-sm text-gray-600">Bereifung24</p>
                </div>
              </a>
              <a
                href="https://www.linkedin.com/company/bereifung24"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"
              >
                <span className="text-2xl">💼</span>
                <div>
                  <p className="font-semibold text-gray-900">LinkedIn</p>
                  <p className="text-sm text-gray-600">Bereifung24</p>
                </div>
              </a>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Bereit für Ihren nächsten Reifenwechsel?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Finden Sie jetzt eine geprüfte Werkstatt in Ihrer Nähe und buchen Sie zum Festpreis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-white text-blue-700 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                Werkstatt finden
              </Link>
              <Link
                href="/werkstatt-werden"
                className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                Werkstatt werden
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
