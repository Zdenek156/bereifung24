'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { TireSizeData } from '@/lib/seo/tire-sizes'
import { getRelatedTireSizes } from '@/lib/seo/tire-sizes'

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const FAQ_ITEMS = (tire: TireSizeData) => [
  {
    q: `Was bedeutet die Reifengröße ${tire.displayName}?`,
    a: `Die Bezeichnung ${tire.displayName} beschreibt die Reifendimensionen: ${tire.width} mm Reifenbreite, ${tire.aspectRatio}% Verhältnis von Flankenhöhe zu Breite, und R${tire.rimDiameter} steht für Radialreifen mit ${tire.rimDiameter} Zoll Felgendurchmesser.${tire.displayName.includes('C') ? ' Das "C" kennzeichnet verstärkte Transporterreifen (Commercial).' : ''}`
  },
  {
    q: `Für welche Autos passt ${tire.displayName}?`,
    a: `Die Größe ${tire.displayName} wird häufig bei folgenden Fahrzeugen verwendet: ${tire.commonVehicles.join(', ')}. Prüfe immer deinen Fahrzeugschein (Feld 15.1 und 15.2) für die exakte zugelassene Reifengröße.`
  },
  {
    q: `Was kosten ${tire.displayName} Reifen?`,
    a: `Die Preise für ${tire.displayName} Reifen variieren je nach Marke und Saison. Budget-Reifen starten ab ca. 40-60€, Mittelklasse-Reifen liegen bei 60-100€ und Premium-Reifen (Continental, Michelin, Goodyear) kosten 90-160€ pro Reifen. Bei Bereifung24 findest du immer den besten Preis inklusive Montage.`
  },
  {
    q: `Soll ich Sommer-, Winter- oder Ganzjahresreifen in ${tire.displayName} wählen?`,
    a: tire.seasonTip
  },
  {
    q: `Was bedeuten die Geschwindigkeitsindizes ${tire.speedIndices.join(', ')} bei ${tire.displayName}?`,
    a: `Der Geschwindigkeitsindex gibt die maximal zulässige Geschwindigkeit an: ${tire.speedIndices.map(s => {
      const speeds: Record<string, string> = { T: 'T = 190 km/h', H: 'H = 210 km/h', V: 'V = 240 km/h', W: 'W = 270 km/h', Y: 'Y = 300 km/h', R: 'R = 170 km/h' }
      return speeds[s] || s
    }).join(', ')}. Wähle mindestens den Index, der in deinem Fahrzeugschein steht.`
  },
  {
    q: 'Wie bestelle ich Reifen mit Montage bei Bereifung24?',
    a: 'Ganz einfach: 1) Wähle deine Reifengröße und dein Wunschmodell. 2) Wähle eine Partnerwerkstatt in deiner Nähe. 3) Buche einen Montagetermin. Die Reifen werden direkt an die Werkstatt geliefert und dort professionell montiert. Du zahlst einen Komplettpreis ohne versteckte Kosten.'
  },
]

export default function TireSizePage({ tire }: { tire: TireSizeData }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const relatedSizes = getRelatedTireSizes(tire, 6)
  const faqItems = FAQ_ITEMS(tire)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Navigation */}
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
                <Link href="/reifen" className="hidden sm:block px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                  Alle Größen
                </Link>
                <Link href="/suche" className="px-5 py-2.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                  Reifen suchen
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <nav className="text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Startseite</Link>
            <span className="mx-2">›</span>
            <Link href="/reifen" className="hover:text-white transition-colors">Reifen</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{tire.displayName}</span>
          </nav>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 md:pt-16 md:pb-32">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
              🛞 {tire.category}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {tire.h1}
            </h1>

            <p className="text-xl md:text-2xl mb-4 text-gray-300 font-medium">
              Passend für {tire.commonVehicles.slice(0, 3).join(', ')} & mehr
            </p>

            <p className="text-lg mb-10 text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {tire.introText}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={`/suche?width=${tire.width}&aspect=${tire.aspectRatio}&rim=${tire.rimDiameter}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                🔍 {tire.displayName} Reifen finden
              </Link>
              <Link
                href="/smart-tire-advisor"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-lg font-medium rounded-xl transition-all"
              >
                🤖 Reifenberater starten
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <AnimatedSection>
        <section className="py-12 bg-gray-50 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Technische Daten – {tire.displayName}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <div className="text-3xl font-bold text-primary-600">{tire.width}</div>
                <div className="text-sm text-gray-600 mt-1">Breite (mm)</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <div className="text-3xl font-bold text-primary-600">{tire.aspectRatio}</div>
                <div className="text-sm text-gray-600 mt-1">Querschnitt (%)</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <div className="text-3xl font-bold text-primary-600">R{tire.rimDiameter}</div>
                <div className="text-sm text-gray-600 mt-1">Felgengröße (Zoll)</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <div className="text-3xl font-bold text-primary-600">{tire.speedIndices.join('/')}</div>
                <div className="text-sm text-gray-600 mt-1">Speed-Index</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <div className="text-3xl font-bold text-primary-600">{tire.loadIndices.join('/')}</div>
                <div className="text-sm text-gray-600 mt-1">Lastindex</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
                <div className="text-3xl font-bold text-primary-600">
                  {Math.round(tire.width * (tire.aspectRatio / 100) * 2 + tire.rimDiameter * 25.4)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Ø Gesamt (mm)</div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Compatible Vehicles */}
      <AnimatedSection delay={100}>
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              🚗 Passende Fahrzeuge für {tire.displayName}
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
              Diese Fahrzeuge werden häufig mit der Reifengröße {tire.displayName} ausgestattet. 
              Überprüfe immer deinen Fahrzeugschein für die exakten Angaben.
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {tire.commonVehicles.map((vehicle) => (
                <div
                  key={vehicle}
                  className="bg-gray-100 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 rounded-lg px-5 py-3 text-gray-800 font-medium transition-colors"
                >
                  {vehicle}
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Season Recommendation */}
      <AnimatedSection delay={150}>
        <section className="py-12 bg-gradient-to-r from-blue-50 to-orange-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              ☀️❄️ Saison-Empfehlung
            </h2>
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 border">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {tire.seasonTip}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href={`/suche?width=${tire.width}&aspect=${tire.aspectRatio}&rim=${tire.rimDiameter}&season=summer`}
                  className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors"
                >
                  <span className="text-2xl">☀️</span>
                  <div>
                    <div className="font-semibold text-gray-900">Sommerreifen</div>
                    <div className="text-sm text-gray-600">{tire.displayName}</div>
                  </div>
                </Link>
                <Link
                  href={`/suche?width=${tire.width}&aspect=${tire.aspectRatio}&rim=${tire.rimDiameter}&season=winter`}
                  className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                >
                  <span className="text-2xl">❄️</span>
                  <div>
                    <div className="font-semibold text-gray-900">Winterreifen</div>
                    <div className="text-sm text-gray-600">{tire.displayName}</div>
                  </div>
                </Link>
                <Link
                  href={`/suche?width=${tire.width}&aspect=${tire.aspectRatio}&rim=${tire.rimDiameter}&season=allseason`}
                  className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
                >
                  <span className="text-2xl">🌤️</span>
                  <div>
                    <div className="font-semibold text-gray-900">Ganzjahresreifen</div>
                    <div className="text-sm text-gray-600">{tire.displayName}</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* How it works */}
      <AnimatedSection delay={200}>
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              So bestellst du {tire.displayName} Reifen
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              In 3 einfachen Schritten zu deinen neuen Reifen – komplett mit Montage.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Reifen auswählen</h3>
                <p className="text-gray-600">Wähle {tire.displayName} Reifen von Top-Marken wie Continental, Michelin oder Goodyear zum Bestpreis.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Werkstatt wählen</h3>
                <p className="text-gray-600">Suche eine Partnerwerkstatt in deiner Nähe und buche einen Montagetermin – online und bequem.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Montage genießen</h3>
                <p className="text-gray-600">Deine Reifen werden direkt zur Werkstatt geliefert und professionell montiert. Fertig!</p>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* USPs */}
      <AnimatedSection delay={250}>
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Warum {tire.displayName} Reifen bei Bereifung24?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: '💰', title: 'Bestpreis-Garantie', desc: `${tire.displayName} Reifen zum günstigsten Preis – wir vergleichen alle Top-Marken.` },
                { icon: '🔧', title: 'Inklusive Montage', desc: 'Professionelle Montage, Wuchten und Ventilwechsel in einer Partnerwerkstatt.' },
                { icon: '🚚', title: 'Kostenlose Lieferung', desc: 'Deine Reifen werden direkt zur Werkstatt geliefert – ohne Versandkosten.' },
                { icon: '⭐', title: 'Top-Marken', desc: 'Continental, Michelin, Goodyear, Bridgestone, Hankook und viele mehr.' },
                { icon: '📅', title: 'Online-Terminbuchung', desc: 'Bequem online einen Montagetermin in deiner Nähe buchen.' },
                { icon: '✅', title: 'Geprüfte Werkstätten', desc: 'Alle Partnerwerkstätten sind zertifiziert und qualitätsgeprüft.' },
              ].map((usp) => (
                <div key={usp.title} className="bg-white rounded-xl p-6 border hover:shadow-md transition-shadow">
                  <span className="text-3xl">{usp.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-3 mb-2">{usp.title}</h3>
                  <p className="text-gray-600 text-sm">{usp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection delay={300}>
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Häufige Fragen zu {tire.displayName} Reifen
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <div key={i} className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                    <span className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-gray-600 leading-relaxed border-t bg-gray-50">
                      <p className="pt-4">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {tire.displayName} Reifen jetzt bestellen
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Finde die besten {tire.displayName} Reifen zum Bestpreis – mit kostenloser Lieferung und professioneller Montage.
          </p>
          <Link
            href={`/suche?width=${tire.width}&aspect=${tire.aspectRatio}&rim=${tire.rimDiameter}`}
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-primary-700 text-xl font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            🛞 {tire.displayName} Reifen finden
          </Link>
        </div>
      </section>

      {/* Related Sizes */}
      {relatedSizes.length > 0 && (
        <AnimatedSection>
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Ähnliche Reifengrößen
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
                {relatedSizes.map((size) => (
                  <Link
                    key={size.slug}
                    href={`/reifen/${size.slug}`}
                    className="group bg-white border border-gray-200 hover:border-primary-400 rounded-xl p-4 text-center transition-all hover:shadow-md"
                  >
                    <div className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {size.displayName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{size.category}</div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/reifen" className="text-primary-600 hover:underline font-medium">
                  ← Alle Reifengrößen anzeigen
                </Link>
              </div>
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* Services & Cities Cross-Links */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Unsere Services</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/services/reifenwechsel" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Reifenwechsel</Link>
                  <Link href="/services/raederwechsel" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Räderwechsel</Link>
                  <Link href="/services/reifenreparatur" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Reifenreparatur</Link>
                  <Link href="/services/achsvermessung" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Achsvermessung</Link>
                  <Link href="/services/klimaservice" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Klimaservice</Link>
                  <Link href="/services/motorradreifen" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Motorradreifen</Link>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Werkstatt in deiner Stadt</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/werkstatt-werden/berlin" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Berlin</Link>
                  <Link href="/werkstatt-werden/muenchen" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">München</Link>
                  <Link href="/werkstatt-werden/hamburg" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Hamburg</Link>
                  <Link href="/werkstatt-werden/koeln" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Köln</Link>
                  <Link href="/werkstatt-werden/frankfurt-am-main" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Frankfurt</Link>
                  <Link href="/werkstatt-werden/stuttgart" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Stuttgart</Link>
                  <Link href="/werkstatt-werden" className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium transition-colors">Alle Städte →</Link>
                </div>
              </div>
            </div>
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
  )
}
