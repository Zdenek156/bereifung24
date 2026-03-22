'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { CityData } from '@/lib/seo/german-cities'

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

export default function WerkstattWerdenCityPage({ city }: { city: CityData }) {
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
                  <p className="text-xs text-gray-400">Für Werkstätten</p>
                </div>
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/werkstatt" className="hidden sm:block px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                  Alle Vorteile
                </Link>
                <Link href="/login" className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors">
                  Werkstatt-Login
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
            <Link href="/werkstatt" className="hover:text-white transition-colors">Für Werkstätten</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{city.name}</span>
          </nav>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:pt-16 md:pb-36">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
              📍 {city.region} • {city.state || 'Deutschland'}
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {city.h1}
            </h1>
            
            <p className="text-xl md:text-2xl mb-4 text-gray-300 font-medium">
              {city.carOwners} Autofahrer suchen Reifenservice in {city.name}
            </p>
            
            <p className="text-lg mb-10 text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {city.introText}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register/workshop"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                Jetzt kostenlos registrieren
              </Link>
              <Link
                href="/werkstatt"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white rounded-lg font-bold text-lg hover:bg-white/20 transition-all border-2 border-white/20"
              >
                Alle Vorteile ansehen
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-gray-300">
              <span className="flex items-center gap-2 text-sm font-medium">✓ Keine Grundgebühr</span>
              <span className="flex items-center gap-2 text-sm font-medium">✓ In 5 Min. online</span>
              <span className="flex items-center gap-2 text-sm font-medium">✓ Kein Vertrag</span>
              <span className="flex items-center gap-2 text-sm font-medium">✓ Faire Provision</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Local Facts Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Warum {city.name} perfekt für digitalen Reifenservice ist
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {city.description} – mit enormem Potenzial für deine Werkstatt
              </p>
            </AnimatedSection>

            <AnimatedSection>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {city.localFacts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100">
                    <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0">
                      {['📊', '🏙️', '🚗', '⭐'][i % 4]}
                    </div>
                    <p className="text-gray-700 font-medium pt-2">{fact}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            {/* Stats Bar */}
            <AnimatedSection>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-2xl p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-600">{city.workshopCount}</p>
                  <p className="text-sm text-gray-600 mt-1">KFZ-Werkstätten</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-600">{city.carOwners}</p>
                  <p className="text-sm text-gray-600 mt-1">Autofahrer</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-600">{city.population.toLocaleString('de-DE')}</p>
                  <p className="text-sm text-gray-600 mt-1">Einwohner</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-600">0 €</p>
                  <p className="text-sm text-gray-600 mt-1">Grundgebühr</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* USP Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                So profitiert deine Werkstatt in {city.name}
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🌐',
                  title: 'Eigene Werkstatt-Website',
                  description: `Erhalte eine professionelle Landingpage für deine Werkstatt in ${city.name}. Mit Öffnungszeiten, Services, Preisen und Google Maps Integration. Kunden buchen direkt bei dir.`
                },
                {
                  icon: '📦',
                  title: 'Automatische Reifenbestellung',
                  description: `Keine Lagerhaltung nötig. Kunden bestellen Reifen über Bereifung24, diese werden automatisch zu deiner Werkstatt in ${city.name} geliefert. Du montierst nur noch.`
                },
                {
                  icon: '📅',
                  title: 'Online-Terminbuchung',
                  description: `Kunden in ${city.name} buchen deinen Reifenservice direkt online. Kein Telefonieren, keine Angebote schreiben. Der Termin erscheint automatisch in deinem Kalender.`
                },
                {
                  icon: '💻',
                  title: 'Widget für deine Homepage',
                  description: `Integriere das Bereifung24-Buchungswidget auf deiner bestehenden Werkstatt-Website in ${city.name}. Ein HTML-Code – und deine Kunden können direkt bei dir buchen.`
                },
                {
                  icon: '💰',
                  title: 'Keine Grundgebühr',
                  description: 'Keine monatlichen Kosten. Zahle nur eine faire Provision bei erfolgreicher Vermittlung. Kein Vertrag, jederzeit kündbar. Null Risiko für dich.'
                },
                {
                  icon: '⭐',
                  title: 'Bewertungen & Vertrauen',
                  description: `Sammle Kundenbewertungen und baue Vertrauen auf. Zufriedene Kunden in ${city.name} empfehlen dich weiter – kostenlose Werbung für deine Werkstatt.`
                }
              ].map((usp, i) => (
                <AnimatedSection key={i} delay={i * 100}>
                  <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="text-4xl mb-4">{usp.icon}</div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{usp.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{usp.description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                In 3 Schritten als Werkstatt in {city.name} online
              </h2>
            </AnimatedSection>

            <div className="space-y-8">
              {[
                {
                  step: '1',
                  title: 'Kostenlos registrieren',
                  description: `Melde deine Werkstatt in ${city.name} in unter 5 Minuten an. Hinterlege Services, Preise und Öffnungszeiten.`,
                  time: 'ca. 5 Minuten'
                },
                {
                  step: '2',
                  title: 'Profil einrichten',
                  description: `Erstelle deine Werkstatt-Landingpage. Lade Fotos hoch, beschreibe deine Spezialgebiete und aktiviere dein Buchungssystem.`,
                  time: 'ca. 10 Minuten'
                },
                {
                  step: '3',
                  title: 'Kunden empfangen',
                  description: `Autofahrer in ${city.name} finden dich, buchen online und bezahlen direkt. Reifen werden automatisch zu dir geliefert.`,
                  time: 'Sofort startklar'
                }
              ].map((step, i) => (
                <AnimatedSection key={i} delay={i * 200}>
                  <div className="flex gap-6 items-start">
                    <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                      <p className="text-gray-600 mb-2">{step.description}</p>
                      <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                        ⏱ {step.time}
                      </span>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - unique per city for SEO */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Häufige Fragen von Werkstätten in {city.name}
              </h2>
            </AnimatedSection>

            <div className="space-y-4">
              {[
                {
                  q: `Was kostet die Registrierung als Werkstatt in ${city.name}?`,
                  a: 'Die Registrierung bei Bereifung24 ist komplett kostenlos. Es gibt keine Grundgebühr und keine Vertragslaufzeit. Du zahlst nur eine faire Provision, wenn tatsächlich eine Buchung über die Plattform zustande kommt.'
                },
                {
                  q: `Wie schnell kann ich als Werkstatt in ${city.name} Buchungen empfangen?`,
                  a: 'Nach der Registrierung und Einrichtung deines Profils (ca. 15 Minuten) bist du sofort für Kunden sichtbar. Die ersten Buchungen können bereits am selben Tag eingehen.'
                },
                {
                  q: 'Muss ich Reifen auf Lager haben?',
                  a: 'Nein! Das ist einer der größten Vorteile von Bereifung24. Kunden bestellen Reifen über die Plattform und diese werden automatisch zu deiner Werkstatt geliefert. Du brauchst kein Reifenlager und keine Bestellungen aufgeben.'
                },
                {
                  q: 'Kann ich Bereifung24 auf meiner bestehenden Website einbinden?',
                  a: 'Ja! Mit unserem Widget kannst du das Bereifung24-Buchungssystem direkt auf deiner eigenen Website integrieren. Ein einfacher HTML-Code genügt – deine Kunden können dann direkt auf deiner Seite buchen.'
                },
                {
                  q: `Wie viele Werkstätten gibt es bereits in ${city.name} auf Bereifung24?`,
                  a: `Bereifung24 expandiert aktuell in ${city.name} und der Region ${city.region}. Jetzt ist der perfekte Zeitpunkt, um als einer der ersten Partner in ${city.name} dabei zu sein und von der wachsenden Nachfrage zu profitieren.`
                },
                {
                  q: 'Muss ich Angebote an Kunden schreiben?',
                  a: 'Nein! Deine Preise und Services sind bereits in deinem Profil hinterlegt. Kunden sehen sofort transparente Festpreise und können direkt buchen. Kein Angebote schreiben, kein Hin-und-Her-Telefonieren.'
                }
              ].map((faq, i) => (
                <AnimatedSection key={i} delay={i * 50}>
                  <details className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
                    <summary className="p-5 cursor-pointer font-bold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      {faq.q}
                      <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-5 text-gray-600 leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Starte jetzt als Werkstatt in {city.name}
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              {city.carOwners} Autofahrer in {city.name} suchen Reifenservice. Sei der Partner, den sie finden.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register/workshop"
                className="px-10 py-5 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
              >
                Jetzt kostenlos registrieren
              </Link>
              <Link
                href="/werkstatt"
                className="px-10 py-5 bg-primary-500 text-white rounded-lg font-bold text-lg hover:bg-primary-400 transition-all border-2 border-white/20"
              >
                Alle Vorteile ansehen
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-primary-200 text-sm">
              <span>✓ Keine Vertragslaufzeit</span>
              <span>✓ Sofort einsatzbereit</span>
              <span>✓ Persönlicher Support</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Other BW Cities Section - Internal Linking */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Bereifung24 in weiteren Städten {city.state ? `in ${city.state}` : 'in Deutschland'}
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {getCitiesInSameStateExcluding(city.slug).map((otherCity) => (
                <Link
                  key={otherCity.slug}
                  href={`/werkstatt-werden/${otherCity.slug}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors"
                >
                  {otherCity.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services & Tire Sizes Cross-Links */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Unsere Services in {city.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/services/reifenwechsel" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">Reifenwechsel</Link>
                  <Link href="/services/raederwechsel" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">Räderwechsel</Link>
                  <Link href="/services/reifenreparatur" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">Reifenreparatur</Link>
                  <Link href="/services/achsvermessung" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">Achsvermessung</Link>
                  <Link href="/services/klimaservice" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">Klimaservice</Link>
                  <Link href="/services/motorradreifen" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">Motorradreifen</Link>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Beliebte Reifengrößen</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/reifen/205-55-r16" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">205/55 R16</Link>
                  <Link href="/reifen/225-45-r17" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">225/45 R17</Link>
                  <Link href="/reifen/195-65-r15" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">195/65 R15</Link>
                  <Link href="/reifen/225-40-r18" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">225/40 R18</Link>
                  <Link href="/reifen/205-60-r16" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">205/60 R16</Link>
                  <Link href="/reifen/175-65-r14" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">175/65 R14</Link>
                  <Link href="/reifen" className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium transition-colors">Alle Größen →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logos/B24_Logo_blau_gray.png" alt="Bereifung24" className="h-10 w-auto" />
                <h3 className="text-2xl font-bold">Bereifung24</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Deutschlands erste digitale Plattform für Reifenservice.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Für Werkstätten</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register/workshop" className="hover:text-white transition-colors">Werkstatt registrieren</Link></li>
                <li><Link href="/werkstatt" className="hover:text-white transition-colors">Alle Vorteile</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Werkstatt-Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Rechtliches</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-white transition-colors">AGB</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Bereifung24. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper to get other cities for internal linking
import { getCitiesInSameState } from '@/lib/seo/german-cities'

function getCitiesInSameStateExcluding(currentSlug: string) {
  return getCitiesInSameState(currentSlug)
}
