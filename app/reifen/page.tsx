import { Metadata } from 'next'
import Link from 'next/link'
import { TIRE_SIZES, TIRE_CATEGORIES, getTireSizesByCategory } from '@/lib/seo/tire-sizes'

export const metadata: Metadata = {
  title: 'Reifen nach Größe kaufen | Alle Reifengrößen mit Montage | Bereifung24',
  description: 'Finde Reifen in deiner Größe – von 155/65 R14 bis 285/45 R19. Über 50 Reifengrößen mit Bestpreisgarantie und professioneller Montage in deiner Nähe. Jetzt passende Reifen finden!',
  keywords: 'reifen kaufen, reifengröße, reifen online bestellen, reifen mit montage, sommerreifen, winterreifen, ganzjahresreifen, reifenwechsel',
  alternates: { canonical: 'https://www.bereifung24.de/reifen' },
  openGraph: {
    title: 'Reifen nach Größe kaufen | Bereifung24',
    description: 'Über 50 Reifengrößen mit Bestpreisgarantie und professioneller Montage.',
    type: 'website',
    url: 'https://www.bereifung24.de/reifen',
    siteName: 'Bereifung24',
    locale: 'de_DE',
  },
  robots: { index: true, follow: true },
}

export default function ReifenPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Reifen nach Größe kaufen',
    description: 'Alle verfügbaren Reifengrößen bei Bereifung24 mit Montage-Service.',
    url: 'https://www.bereifung24.de/reifen',
    publisher: {
      '@type': 'Organization',
      name: 'Bereifung24',
      url: 'https://www.bereifung24.de',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: TIRE_SIZES.length,
      itemListElement: TIRE_SIZES.slice(0, 20).map((size, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://www.bereifung24.de/reifen/${size.slug}`,
        name: `${size.displayName} Reifen`,
      })),
    },
  }

  const totalSearchVolume = TIRE_SIZES.reduce((sum, t) => sum + t.monthlySearchVolume, 0)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative border-b border-white/10 backdrop-blur-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <Link href="/" className="flex items-center gap-3">
                  <img src="/logos/B24_Logo_blau_gray.png" alt="Bereifung24" className="h-10 w-auto" />
                  <div>
                    <h2 className="text-2xl font-bold">Bereifung24</h2>
                    <p className="text-xs text-gray-400">Reifen & Montage</p>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <Link href="/suche" className="hidden sm:block px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                    Reifen suchen
                  </Link>
                  <Link href="/werkstatt" className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                    Für Werkstätten
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <nav className="text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">Startseite</Link>
              <span className="mx-2">›</span>
              <span className="text-white">Reifen nach Größe</span>
            </nav>
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-16 md:pb-28">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
                🛞 {TIRE_SIZES.length} Reifengrößen verfügbar
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Reifen nach Größe kaufen
              </h1>
              <p className="text-xl md:text-2xl mb-4 text-gray-300 font-medium">
                Finde die passenden Reifen für dein Fahrzeug – mit professioneller Montage
              </p>
              <p className="text-lg mb-10 text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Wähle deine Reifengröße und bestelle online zum Bestpreis. Deine neuen Reifen werden direkt an eine 
                Partnerwerkstatt in deiner Nähe geliefert und dort montiert. Einfacher geht&apos;s nicht.
              </p>
              <Link
                href="/suche"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                🔍 Jetzt Reifen suchen
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <div className="bg-gray-50 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{TIRE_SIZES.length}+</div>
                <div className="text-sm text-gray-600">Reifengrößen</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">7</div>
                <div className="text-sm text-gray-600">Fahrzeugkategorien</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600">mit Montage-Service</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-primary-600 font-bold">0€</div>
                <div className="text-sm text-gray-600">Versandkosten</div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {TIRE_CATEGORIES.map((cat) => {
          const sizes = getTireSizesByCategory(cat.name)
          if (sizes.length === 0) return null
          return (
            <section key={cat.name} className="py-12 border-b last:border-b-0">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{cat.icon}</span>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{cat.name}</h2>
                </div>
                <p className="text-gray-600 mb-8">{cat.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {sizes
                    .sort((a, b) => b.monthlySearchVolume - a.monthlySearchVolume)
                    .map((size) => (
                    <Link
                      key={size.slug}
                      href={`/reifen/${size.slug}`}
                      className="group relative bg-white border border-gray-200 hover:border-primary-400 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <div className="text-center">
                        <div className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {size.displayName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {size.rimDiameter}&quot; Felge
                        </div>
                        <div className="mt-2 text-xs text-gray-400 line-clamp-1">
                          {size.commonVehicles.slice(0, 2).join(', ')}
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary-600">
                        →
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )
        })}

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Deine Größe nicht gefunden?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Nutze unsere Reifensuche und finde aus tausenden Reifen das perfekte Modell für dein Fahrzeug.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/suche"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all"
              >
                🔍 Reifensuche starten
              </Link>
              <Link
                href="/smart-tire-advisor"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 text-white text-lg font-bold rounded-xl transition-all"
              >
                🤖 Smart Tire Advisor
              </Link>
            </div>
          </div>
        </section>

        {/* SEO Text */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reifen online kaufen mit Montage – So funktioniert&apos;s</h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Bei Bereifung24 findest du Reifen in jeder gängigen Größe – von Kleinwagen über Mittelklasse bis zum SUV. 
                Unser Service ist einzigartig: Du bestellst deine Reifen online zum Bestpreis, und wir liefern sie direkt 
                an eine unserer Partnerwerkstätten in deiner Nähe. Dort werden sie professionell montiert, gewuchtet und 
                auf deinem Fahrzeug angebracht.
              </p>
              <h3>Wie finde ich meine Reifengröße?</h3>
              <p>
                Deine Reifengröße findest du an der Seitenwand deines aktuellen Reifens. Sie besteht aus drei Zahlen, 
                z.B. <strong>205/55 R16</strong>. Dabei steht 205 für die Breite in Millimetern, 55 für das 
                Verhältnis von Höhe zu Breite in Prozent, und R16 für den Felgendurchmesser in Zoll.
              </p>
              <h3>Welche Reifengröße ist die beliebteste?</h3>
              <p>
                Die mit Abstand beliebteste Reifengröße in Deutschland ist <Link href="/reifen/205-55-r16" className="text-primary-600 hover:underline">205/55 R16</Link>. 
                Sie passt auf viele Kompaktklasse-Fahrzeuge wie VW Golf, Audi A3 und BMW 1er. Auf Platz zwei folgt 
                <Link href="/reifen/225-45-r17" className="text-primary-600 hover:underline"> 225/45 R17</Link> für die Mittelklasse.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Bereifung24 – Alle Rechte vorbehalten</p>
            <div className="flex justify-center gap-6 mt-3">
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
