import Link from 'next/link'
import { Suspense } from 'react'
import AffiliateTracker from '@/components/AffiliateTracker'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      {/* Hero Section - Premium Design */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Top Navigation Bar */}
        <div className="relative border-b border-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-primary-600 text-xl font-bold">B24</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Bereifung24</h1>
                  <p className="text-xs text-primary-100">Deutschlands digitale Reifenservice-Plattform</p>
                </div>
              </div>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors"
              >
                Anmelden
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32 md:pt-24 md:pb-40">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
              Deutschlands erste digitale Reifenservice-Plattform
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Dein Reifenservice
            </h2>
            <p className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-primary-100">
              Digital & Einfach
            </p>
            
            <p className="text-xl md:text-2xl mb-4 text-primary-100 font-medium">
              Anfrage stellen • Angebote vergleichen • Online buchen
            </p>
            
            <p className="text-lg mb-10 text-primary-50 max-w-3xl mx-auto leading-relaxed">
              Die intelligente Plattform, die Autofahrer mit geprüften Werkstätten vernetzt. 
              Transparente Preise, verbindliche Termine, faire Konditionen für beide Seiten.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register/customer"
                className="w-full sm:w-auto px-8 py-4 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
              >
                Jetzt Anfrage stellen
              </Link>
              <Link
                href="/register/workshop"
                className="w-full sm:w-auto px-8 py-4 bg-primary-500 text-white rounded-lg font-bold text-lg hover:bg-primary-400 transition-all border-2 border-white/20"
              >
                Werkstatt registrieren
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-primary-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                <span className="text-sm font-medium">Geprüfte Werkstätten</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">100% Datenschutz</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">Kostenlose Nutzung</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Unique Selling Points - Deutschlands Erste */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              Einzigartig in Deutschland
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8">
              Was macht Bereifung24 besonders?
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-50 to-white p-8 md:p-12 rounded-3xl border border-gray-200 shadow-xl">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                Bereifung24 ist <span className="font-bold text-primary-600">Deutschlands erste vollständig digitale Reifenservice-Plattform</span>, die Autofahrer und Werkstätten auf eine völlig neue Art verbindet. Während traditionelle Portale nur Reifenwechsel anbieten, decken wir das gesamte Spektrum ab – von Motorradreifen über Achsvermessung bis hin zu Klimaservice und Batteriewechsel.
              </p>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                Die Plattform vereint <span className="font-bold text-primary-600">modernste Technologie mit höchster Benutzerfreundlichkeit</span>: Anfrage erstellen in 2 Minuten, mehrere Angebote vergleichen, Termin online buchen – alles ohne Telefonate. Geprüfte Werkstätten, transparente Bewertungen, sichere Datenverwaltung nach EU-DSGVO. So wird Reifenservice zum digitalen Erlebnis, das Zeit spart, Geld spart, <span className="font-bold text-green-600">CO₂ spart</span> und Nerven schont.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Step by Step */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              So einfach funktioniert's
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              In nur 3 Schritten zu deinem Wunschtermin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-4xl mb-6">
                  {step.emoji}
                </div>
                <div className="mb-6">
                  <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-3">
                    Schritt {index + 1}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    {step.title}
                  </h3>
                  <p className="text-primary-50 leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>
                <div className="border-t border-white/20 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-primary-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-bold text-lg">{step.benefit}</span>
                  </div>
                  <p className="text-primary-100 text-sm">
                    {step.benefitDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Customer Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block mb-4 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Für Autofahrer
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                  Deine Vorteile als Kunde
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Spare Zeit, Geld und Nerven bei deinem nächsten Reifenservice
                </p>

                <div className="space-y-6">
                  {customerBenefits.map((benefit, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register/customer"
                  className="inline-block mt-8 px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Kostenlos registrieren
                </Link>
              </div>


            </div>
          </div>
        </div>
      </section>

      {/* Workshop Benefits - Premium Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block mb-4 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold">
                Für Werkstätten
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Erreiche mehr Kunden. Steigere deine Auslastung.
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Profitiere von Deutschlands erster digitaler Reifenservice-Plattform und gewinne neue Stammkunden
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {workshopBenefits.map((benefit, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
                  <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {benefit.description}
                  </p>
                  <ul className="space-y-2">
                    {benefit.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-gray-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 md:p-12 rounded-2xl text-center shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Kostenlose Registrierung • Keine monatlichen Gebühren
              </h3>
              <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
                Zahle nur eine faire Provision bei erfolgreicher Vermittlung. Keine versteckten Kosten.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register/workshop"
                  className="px-8 py-4 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                >
                  Werkstatt registrieren
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-bold text-lg hover:bg-white/10 transition-all"
                >
                  Werkstatt-Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Vertrauen & Sicherheit
              </h2>
              <p className="text-xl text-gray-600">
                Deine Daten sind bei uns in sicheren Händen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {trustFeatures.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-md text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-3xl mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Bereit für den digitalen Reifenservice?
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Starte jetzt und erlebe, wie einfach Reifenservice sein kann
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register/customer"
                className="px-10 py-5 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
              >
                Als Kunde registrieren
              </Link>
              <Link
                href="/register/workshop"
                className="px-10 py-5 bg-primary-500 text-white rounded-lg font-bold text-lg hover:bg-primary-400 transition-all border-2 border-white/20"
              >
                Als Werkstatt registrieren
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Professional */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">B24</span>
                </div>
                <h3 className="text-2xl font-bold">Bereifung24</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Deutschlands erste digitale Plattform für Reifenservice. Transparent, fair und einfach.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="text-xl">📱</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="text-xl">💼</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="text-xl">📧</span>
                </a>
              </div>
            </div>

            {/* For Customers */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Kunden</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/register/customer" className="hover:text-white transition-colors">Kostenlos registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Anmelden</Link></li>
                <li><Link href="#services" className="hover:text-white transition-colors">Alle Services</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">So funktioniert's</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* For Workshops */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Werkstätten</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/register/workshop" className="hover:text-white transition-colors">Werkstatt registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Werkstatt-Login</Link></li>
                <li><Link href="/workshop-benefits" className="hover:text-white transition-colors">Vorteile</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Preise & Konditionen</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Partner Program */}
            <div className="bg-gradient-to-br from-primary-600/10 to-primary-700/10 rounded-lg p-4 border border-primary-500/20">
              <h4 className="text-lg font-bold mb-3 text-primary-400">💰 Partner werden</h4>
              <p className="text-gray-300 text-sm mb-4">
                Verdiene als Influencer mit unserem Partner-Programm!
              </p>
              <Link 
                href="/influencer" 
                className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                Mehr erfahren →
              </Link>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-bold mb-4">Rechtliches</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-white transition-colors">AGB</Link></li>
                <li><Link href="/cookie-settings" className="hover:text-white transition-colors">Cookie-Einstellungen</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
              <p>&copy; 2025 Bereifung24. Alle Rechte vorbehalten.</p>
              <p className="mt-4 md:mt-0">
                Made with ❤️ in Deutschland
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Data Arrays

const uniqueFeatures = [
  {
    title: '🎯 Umfassende Service-Pakete',
    description: 'Als einzige Plattform bieten wir granulare Servicepakete: Von 2 oder 4 Reifen über Runflat-Optionen bis zu Altreifenentsorgung. Kunden wählen genau, was sie brauchen.',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  },
  {
    title: '🏍️ Motorrad-Spezialist',
    description: 'Deutschlandweit die erste Plattform mit dedizierter Motorradreifen-Verwaltung. Separate Preise für Vorder- und Hinterrad, inkl. Entsorgungsoptionen.',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  },
  {
    title: '🔧 Achsvermessung individuell',
    description: 'Als einzige Plattform mit separaten Preisen für Vorderachse, Hinterachse oder beide. Kunden zahlen nur für das, was gemessen/eingestellt wird.',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
  },
  {
    title: '❄️ Klimaservice transparent',
    description: 'Einzigartig: Kältemittel-Nachfüllkosten pro 100ml transparent ausgewiesen. Kunden wissen vorher, was zusätzliche Befüllung kostet.',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
  },
  {
    title: '🔋 Batterie-Intelligenz',
    description: 'Identifikation via VIN, Schlüsselnummer oder Teilenummer. Werkstätten können exakte Batterie ermitteln – keine Verwechslungen mehr.',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
  },
  {
    title: '🎪 Alle Services vereint',
    description: 'Die einzige Plattform, die ALLE Reifenservices abdeckt: Reifen-, Räderwechsel, Reparatur, Motorrad, Achsvermessung, Bremsen, Batterie, Klima und mehr.',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
  },
]

const steps = [
  {
    title: 'Anfrage erstellen',
    description: 'Wähle deinen Service (Reifenwechsel, Achsvermessung, Klimaservice etc.) und beschreibe deine Anforderungen. Das dauert nur 2 Minuten.',
    emoji: '📝',
    benefit: 'Zeitersparnis',
    benefitDescription: 'Keine Telefonate mehr bei 5 verschiedenen Werkstätten. Eine Anfrage erreicht alle passenden Betriebe in deiner Nähe.',
    details: [
      'Fahrzeugdaten optional hinterlegen',
      'Radius frei wählen (5-50 km)',
      'Wunschtermin angeben',
      'Detaillierte Servicepakete auswählen'
    ]
  },
  {
    title: 'Angebote vergleichen',
    description: 'Erhalte zeitnah Angebote von Werkstätten in deiner Nähe. Vergleiche Preise, Leistungen, Bewertungen und Verfügbarkeit.',
    emoji: '💰',
    benefit: 'Preistransparenz',
    benefitDescription: 'Alle Kosten auf einen Blick. Keine versteckten Gebühren. Du siehst sofort, wer das beste Preis-Leistungs-Verhältnis bietet.',
    details: [
      'Mehrere Angebote in kurzer Zeit',
      'Detaillierte Leistungsbeschreibung',
      'Bewertungen anderer Kunden',
      'Direkte Verfügbarkeitsanzeige'
    ]
  },
  {
    title: 'Online buchen',
    description: 'Wähle das beste Angebot und buche deinen Wunschtermin direkt online. Die Werkstatt erhält automatisch alle Details.',
    emoji: '✅',
    benefit: 'Komfort',
    benefitDescription: 'Alles digital: Von der Anfrage über das Angebot bis zur Terminbestätigung. Keine Anrufe, keine Wartezeiten.',
    details: [
      'Sofortige Terminbestätigung',
      'Alle Details in einer Übersicht',
      'Automatische Benachrichtigungen',
      'Kostenlose Stornierung möglich'
    ]
  }
]

const allServices = [
  {
    title: 'Reifenwechsel',
    icon: '🔧',
    description: 'Von 2 oder 4 Reifen, mit/ohne Entsorgung, Runflat-Optionen',
    packages: ['2 Reifen', '4 Reifen', 'Runflat', 'Entsorgung']
  },
  {
    title: 'Räderwechsel',
    icon: '🎡',
    description: 'Umstecken von Kompletträdern mit optionalem Wuchten und Einlagerung',
    packages: ['Basis', 'Wuchten', 'Einlagerung', 'Komplett']
  },
  {
    title: 'Reifenreparatur',
    icon: '🔨',
    description: 'Fremdkörper entfernen, Ventil reparieren, Notfall-Service',
    packages: ['Fremdkörper', 'Ventil', 'Notfall']
  },
  {
    title: 'Motorradreifen',
    icon: '🏍️',
    description: 'Spezialisiert auf Motorräder - Vorder-, Hinterrad oder beide',
    packages: ['Vorne', 'Hinten', 'Beide', 'Entsorgung']
  },
  {
    title: 'Achsvermessung',
    icon: '📏',
    description: 'Vorder-, Hinterachse oder beide vermessen und einstellen',
    packages: ['Vorne', 'Hinten', 'Beide', 'Einstellung', 'Inspektion']
  },
  {
    title: 'Klimaservice',
    icon: '❄️',
    description: 'Check, Desinfektion, Filterwechsel, Kältemittel auffüllen',
    packages: ['Check', 'Basic', 'Comfort', 'Premium']
  },
  {
    title: 'Bremsen-Service',
    icon: '🛑',
    description: 'Bremsbeläge und -scheiben wechseln, vorne/hinten',
    packages: ['Beläge', 'Scheiben', 'Vorne', 'Hinten', 'Handbremse']
  },
  {
    title: 'Batterie-Service',
    icon: '🔋',
    description: 'Test, Wechsel, Premium-Service mit Codierung',
    packages: ['Test', 'Wechsel', 'Premium', 'Codierung']
  },
  {
    title: 'Weitere Services',
    icon: '🛠️',
    description: 'RDKS, TPMS, Ventilwechsel, Reifeneinlagerung',
    packages: ['RDKS', 'TPMS', 'Ventile', 'Lagerung']
  }
]

const customerBenefits = [
  {
    title: '100% Kostenlos',
    description: 'Die Nutzung der Plattform ist für Kunden komplett kostenlos. Keine versteckten Gebühren, keine Abo-Fallen.'
  },
  {
    title: 'Transparente Preise',
    description: 'Vergleiche Angebote verschiedener Werkstätten. Du siehst alle Kosten auf einen Blick – keine Überraschungen.'
  },
  {
    title: 'Zeitersparnis',
    description: 'Eine Anfrage, mehrere Angebote. Spare dir Telefonate und Besuche bei verschiedenen Werkstätten.'
  },
  {
    title: 'Geprüfte Werkstätten',
    description: 'Alle Werkstätten werden von uns verifiziert. Lies Bewertungen anderer Kunden.'
  },
  {
    title: 'Online buchen',
    description: 'Buche deinen Termin direkt online. Keine Warteschleifen, keine Rückrufe.'
  },
  {
    title: 'Flexible Stornierung',
    description: 'Pläne ändern sich? Storniere oder verschiebe deinen Termin kostenlos.'
  }
]

const workshopBenefits = [
  {
    title: 'Neue Kunden gewinnen',
    icon: '👥',
    description: 'Erreiche Autofahrer, die aktiv nach deinen Services suchen. Erweitere deinen Kundenstamm digital.',
    details: [
      'Qualifizierte Anfragen in deinem Radius',
      'Kunden suchen aktiv nach deinen Services',
      'Höhere Conversion als klassische Werbung'
    ]
  },
  {
    title: 'Auslastung optimieren',
    icon: '📊',
    description: 'Fülle Lücken in deinem Terminkalender. Nutze freie Kapazitäten optimal aus.',
    details: [
      'Flexibles Angebots-Management',
      'Automatische Terminverwaltung',
      'Echtzeit-Kapazitätsplanung'
    ]
  },
  {
    title: 'Faire Konditionen',
    icon: '💰',
    description: 'Keine monatlichen Fixkosten. Zahle nur bei erfolgreicher Vermittlung eine faire Provision.',
    details: [
      'Keine Grundgebühr',
      'Transparente Provisionsmodelle',
      'Volle Kostenkontrolle'
    ]
  },
  {
    title: 'Digitale Verwaltung',
    icon: '💻',
    description: 'Verwalte Services, Preise, Termine und Mitarbeiter zentral. Alles in einem Dashboard.',
    details: [
      'Intuitive Bedienung',
      'Mitarbeiter- & Urlaubsverwaltung',
      'Automatisierte Prozesse'
    ]
  }
]

const trustFeatures = [
  {
    icon: '🔒',
    description: 'SSL-Verschlüsselung und sichere Datenspeicherung nach EU-DSGVO'
  },
  {
    icon: '✅',
    description: 'Alle Werkstätten werden manuell geprüft und verifiziert'
  },
  {
    icon: '⚡',
    description: 'Schnelle Vermittlung - durchschnittlich 3-5 Angebote innerhalb von 24 Stunden'
  }
]
