'use client'

import Link from 'next/link'
import { ArrowLeft, Search, Star, CheckCircle, ChevronDown, ChevronUp, MapPin, Clock, Euro } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { ServiceDefinition, ServiceCityData } from '@/lib/seo/service-city-pages'
import { getServiceCityFaqs, SERVICES, SERVICE_CITIES } from '@/lib/seo/service-city-pages'

interface ServiceCityPageProps {
  service: ServiceDefinition
  city: ServiceCityData
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

export default function ServiceCityPage({ service, city }: ServiceCityPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const faqs = getServiceCityFaqs(service, city)

  // Other services for cross-linking (exclude current)
  const otherServices = Object.values(SERVICES).filter(s => s.slug !== service.slug)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-primary-600 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Startseite</span>
            </Link>
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/logos/B24_Logo_weiss.png" alt="Bereifung24" className="h-10 w-auto object-contain" />
            </Link>
            <Link
              href={service.searchPath}
              className="flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Werkstatt finden</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">{service.icon}</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              {service.name} in {city.cityName}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {service.description} Finde die beste Werkstatt in {city.cityName} und buche direkt online.
            </p>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <Euro className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                <p className="text-xs text-white/70">Preis</p>
                <p className="text-sm font-bold">{service.priceRange}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                <p className="text-xs text-white/70">Dauer</p>
                <p className="text-sm font-bold">{service.duration}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <MapPin className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                <p className="text-xs text-white/70">Standort</p>
                <p className="text-sm font-bold">{city.cityName}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={service.searchPath}
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105 shadow-xl"
              >
                <Search className="w-5 h-5" />
                Werkstatt in {city.cityName} finden
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <AnimatedSection>
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
                So funktioniert {service.name} mit Bereifung24
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { step: '1', title: 'Service wählen', desc: `Wähle "${service.name}" und gib deinen Standort ${city.cityName} ein. Vergleiche Werkstätten und Preise.` },
                  { step: '2', title: 'Online buchen', desc: `Wähle deine Wunschwerkstatt in ${city.cityName}, den passenden Termin und buche in wenigen Klicks.` },
                  { step: '3', title: 'Fertig!', desc: `Komm zum Termin, dein ${service.name} wird professionell durchgeführt. Festpreis, keine Überraschungen.` },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Benefits */}
      <AnimatedSection>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
                Warum {service.name} über Bereifung24?
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Festpreise', desc: 'Transparente Preise ohne versteckte Kosten. Du siehst den Endpreis vor der Buchung.' },
                  { title: 'Online buchen', desc: 'Keine Warteschlange, kein Telefonieren. Buche deinen Termin bequem online.' },
                  { title: 'Geprüfte Werkstätten', desc: `Alle Werkstätten in ${city.cityName} sind geprüft und bewertet von echten Kunden.` },
                  { title: 'Reifen-Lieferung', desc: 'Neue Reifen werden direkt zur Werkstatt geliefert. Kein Schleppen, kein Stress.' },
                  { title: 'Beste Marken', desc: 'Continental, Michelin, Bridgestone, Dunlop und viele mehr – alle Marken verfügbar.' },
                  { title: 'Kostenlos stornieren', desc: 'Terminänderung oder Stornierung jederzeit kostenlos möglich.' },
                ].map((benefit) => (
                  <div key={benefit.title} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                        <p className="text-sm text-gray-600">{benefit.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Local Info */}
      <AnimatedSection>
        <section className="py-16 bg-primary-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
                {service.name} in {city.cityName} und Umgebung
              </h2>
              <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
                {city.localHighlight} Bereifung24 verbindet Autofahrer aus {city.cityName} und Umgebung mit den besten Werkstätten der Region.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    Standort & Einzugsgebiet
                  </h3>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li>📍 {city.cityName} ({city.postalCodes.join(', ')})</li>
                    <li>👥 ca. {city.population.toLocaleString('de-DE')} Einwohner</li>
                    <li>🏘️ {city.region}</li>
                    <li>🚗 Auch für: {city.nearbyAreas}</li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Bereifung24 Vorteile
                  </h3>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li>✅ Werkstätten in {city.cityName} vergleichen</li>
                    <li>✅ Echte Kundenbewertungen lesen</li>
                    <li>✅ Online zum Festpreis buchen</li>
                    <li>✅ Reifen direkt zur Werkstatt liefern lassen</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
                Häufige Fragen zu {service.name} in {city.cityName}
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                      {openFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === index && (
                      <div className="px-5 pb-5 text-gray-600">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Jetzt {service.name} in {city.cityName} buchen
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
            Finde die beste Werkstatt, vergleiche Preise und buche online – einfach, schnell und transparent.
          </p>
          <Link
            href={service.searchPath}
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg transition-all transform hover:scale-105 shadow-xl"
          >
            <Search className="w-5 h-5" />
            Werkstatt finden
          </Link>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/70">
            <span>✅ Keine Grundgebühr</span>
            <span>✅ Festpreise</span>
            <span>✅ Kostenlos stornieren</span>
          </div>
        </div>
      </section>

      {/* Cross-Links: Other Services */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Weitere Services in {city.cityName}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {otherServices.slice(0, 9).map(s => (
                    <Link
                      key={s.slug}
                      href={`/${s.slug}/${city.citySlug}`}
                      className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200"
                    >
                      {s.icon} {s.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Beliebte Reifengrößen</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/reifen/205-55-r16" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">205/55 R16</Link>
                  <Link href="/reifen/225-45-r17" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">225/45 R17</Link>
                  <Link href="/reifen/195-65-r15" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">195/65 R15</Link>
                  <Link href="/reifen/225-40-r18" className="px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors border border-gray-200">225/40 R18</Link>
                  <Link href="/reifen" className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium transition-colors">Alle Größen →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Startseite</Link>
            <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
            <Link href="/agb" className="hover:text-white transition-colors">AGB</Link>
          </div>
          <p>© {new Date().getFullYear()} Bereifung24. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}
