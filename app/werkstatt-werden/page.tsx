import { Metadata } from 'next'
import Link from 'next/link'
import { ALL_CITIES, getAllStates, getCitiesByState, TOTAL_CITIES } from '@/lib/seo/german-cities'

export const metadata: Metadata = {
  title: 'Werkstatt-Partner werden | Bereifung24 - Kostenlose Werkstatt-Website',
  description: `Registriere deine KFZ-Werkstatt kostenlos auf Bereifung24. Eigene Werkstatt-Website, Online-Buchungssystem, automatische Reifenbestellung. Jetzt in ganz Deutschland starten. ${TOTAL_CITIES} Städte in 16 Bundesländern.`,
  keywords: 'werkstatt registrieren deutschland, kfz werkstatt partner werden, reifenservice plattform, werkstatt plattform beitreten, werkstatt digitalisieren, kostenlose werkstatt website',
  alternates: {
    canonical: 'https://bereifung24.de/werkstatt-werden'
  },
  openGraph: {
    title: 'Werkstatt-Partner werden in ganz Deutschland | Bereifung24',
    description: 'Deutschlands erste digitale Reifenservice-Plattform. Jetzt als Werkstatt kostenlos registrieren und eigene Website erhalten.',
    type: 'website',
    url: 'https://bereifung24.de/werkstatt-werden',
    siteName: 'Bereifung24',
    locale: 'de_DE',
  },
  robots: { index: true, follow: true }
}

export default function WerkstattWerdenPage() {
  const states = getAllStates()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Werkstatt-Partner werden in ganz Deutschland',
    description: `Übersicht aller ${TOTAL_CITIES} Städte in 16 Bundesländern, in denen Werkstätten Partner bei Bereifung24 werden können.`,
    url: 'https://bereifung24.de/werkstatt-werden',
    publisher: {
      '@type': 'Organization',
      name: 'Bereifung24',
      url: 'https://bereifung24.de'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Nav */}
            <div className="flex items-center justify-between py-4 border-b border-white/10">
              <Link href="/" className="flex items-center gap-3">
                <img src="/logos/B24_Logo_blau_gray.png" alt="Bereifung24" className="h-10 w-auto" />
                <div>
                  <h2 className="text-2xl font-bold">Bereifung24</h2>
                  <p className="text-xs text-gray-400">Für Werkstätten</p>
                </div>
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/werkstatt" className="hidden sm:block px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                  Vorteile
                </Link>
                <Link href="/login" className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                  Login
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="py-16 md:py-24 text-center max-w-4xl mx-auto">
              <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
                🇩🇪 Jetzt in ganz Deutschland starten
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Werkstatt-Partner werden
              </h1>
              <p className="text-xl text-gray-300 mb-4 max-w-3xl mx-auto">
                Erhalte <strong className="text-white">kostenlos deine eigene Werkstatt-Website</strong> mit Online-Terminbuchung und automatischer Reifenbestellung. Kunden buchen direkt bei dir – ohne Werbekosten.
              </p>
              <p className="text-lg text-gray-400 mb-8">
                {TOTAL_CITIES} Städte • 16 Bundesländer • 0 € Grundgebühr
              </p>
              <Link
                href="/register/workshop"
                className="inline-block px-8 py-4 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                Jetzt kostenlos registrieren
              </Link>
            </div>
          </div>
        </section>

        {/* Key USPs */}
        <section className="py-12 bg-primary-50 border-b border-primary-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="text-4xl mb-3">🌐</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Eigene Werkstatt-Website</h3>
                <p className="text-sm text-gray-600">Professionelle Internetseite mit deinen Services, Preisen, Öffnungszeiten und Google Maps – komplett kostenlos.</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="text-4xl mb-3">📅</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Online-Buchung</h3>
                <p className="text-sm text-gray-600">Kunden buchen Reifenservice direkt online bei dir. Kein Telefonieren, keine Angebote schreiben.</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Automatische Reifenbestellung</h3>
                <p className="text-sm text-gray-600">Kunden bestellen Reifen, die automatisch zu dir geliefert werden. Kein eigenes Lager nötig.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cities by State */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-center">
                Wähle dein Bundesland
              </h2>
              <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
                Bereifung24 ist in allen 16 Bundesländern aktiv. Finde deine Stadt und erhalte sofort deine eigene kostenlose Werkstatt-Website.
              </p>

              {/* State quick nav */}
              <div className="flex flex-wrap justify-center gap-2 mb-12">
                {states.map(s => (
                  <a
                    key={s.short}
                    href={`#${s.short}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors"
                  >
                    {s.name} ({s.count})
                  </a>
                ))}
              </div>

              {/* Grouped by state */}
              {states.map(s => {
                const cities = getCitiesByState(s.name)
                return (
                  <div key={s.short} id={s.short} className="mb-12 scroll-mt-8">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">{s.name}</h3>
                      <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                        {s.count} {s.count === 1 ? 'Stadt' : 'Städte'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cities.map((city) => (
                        <Link
                          key={city.slug}
                          href={`/werkstatt-werden/${city.slug}`}
                          className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-300 transition-all duration-300 group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                              {city.name}
                            </h4>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                              {city.population.toLocaleString('de-DE')} Ew.
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm mb-3">{city.region}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{city.carOwners} Autofahrer</span>
                            <span className="text-primary-600 font-semibold group-hover:translate-x-1 transition-transform">
                              Details →
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* General Benefits Quick */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Deine Vorteile als Bereifung24 Partner</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {[
                  { icon: '🌐', text: 'Eigene Werkstatt-Website' },
                  { icon: '📅', text: 'Online-Terminbuchung' },
                  { icon: '📦', text: 'Automatische Reifenlieferung' },
                  { icon: '💰', text: 'Keine Grundgebühr' },
                  { icon: '💻', text: 'Widget für deine Seite' },
                  { icon: '⭐', text: 'Bewertungssystem' },
                  { icon: '📊', text: 'Statistik-Dashboard' },
                  { icon: '🔒', text: 'Kein Vertrag' },
                ].map((benefit, i) => (
                  <div key={i} className="p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-3xl mb-2">{benefit.icon}</p>
                    <p className="text-sm font-medium text-gray-700">{benefit.text}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/werkstatt"
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Alle Vorteile im Detail ansehen →
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Bereifung24. Alle Rechte vorbehalten.</p>
            <div className="mt-3 flex justify-center gap-6">
              <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
              <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
              <Link href="/agb" className="hover:text-white transition-colors">AGB</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
