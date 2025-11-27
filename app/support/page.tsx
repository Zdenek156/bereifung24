import Link from 'next/link'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Support & Hilfe</h1>
        </div>
      </header>

      {/* Support Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">E-Mail</h3>
              <p className="text-gray-600 mb-4">Schreiben Sie uns</p>
              <a href="mailto:support@bereifung24.de" className="text-primary-600 hover:text-primary-700 font-medium">
                support@bereifung24.de
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Telefon</h3>
              <p className="text-gray-600 mb-4">Mo-Fr 9-17 Uhr</p>
              <a href="tel:+4971479679990" className="text-primary-600 hover:text-primary-700 font-medium">
                07147 - 9679990
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">FAQ</h3>
              <p className="text-gray-600 mb-4">Häufige Fragen</p>
              <Link href="/faq" className="text-primary-600 hover:text-primary-700 font-medium">
                Zur FAQ-Seite →
              </Link>
            </div>
          </div>

          {/* Support Topics */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Wie können wir helfen?</h2>
            <div className="space-y-4">
              {supportTopics.map((topic, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{topic.title}</h3>
                  <p className="text-gray-600">{topic.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form Placeholder */}
          <section className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kontaktformular</h2>
            <p className="text-gray-600 mb-6">
              Haben Sie eine spezifische Frage? Schreiben Sie uns direkt an{' '}
              <a href="mailto:support@bereifung24.de" className="text-primary-600 hover:text-primary-700 font-medium">
                support@bereifung24.de
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

const supportTopics = [
  {
    title: 'Erste Schritte als Kunde',
    description: 'Hilfe bei der Registrierung und Erstellung Ihrer ersten Anfrage'
  },
  {
    title: 'Werkstatt-Registrierung',
    description: 'Anleitung zur Registrierung und Einrichtung Ihres Werkstatt-Profils'
  },
  {
    title: 'Angebote vergleichen',
    description: 'Tipps zum Vergleich von Angeboten und zur Auswahl der richtigen Werkstatt'
  },
  {
    title: 'Termine buchen',
    description: 'Hilfe bei der Terminbuchung und -verwaltung'
  },
  {
    title: 'Technische Probleme',
    description: 'Unterstützung bei Login-Problemen oder anderen technischen Fragen'
  }
]
