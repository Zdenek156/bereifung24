import Link from 'next/link'

export default function WerkstattInfoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Werkstatt Premium Design */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
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
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">B24</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Bereifung24</h1>
                  <p className="text-xs text-gray-400">Für Werkstätten</p>
                </div>
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors"
              >
                Werkstatt-Login
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32 md:pt-24 md:pb-40">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
              Für Werkstätten & KFZ-Betriebe
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Erreiche mehr Kunden
            </h2>
            <p className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 text-gray-300">
              Steigere deine Auslastung
            </p>
            
            <p className="text-xl md:text-2xl mb-4 text-gray-300 font-medium">
              Die digitale Plattform für deine Werkstatt
            </p>
            
            <p className="text-lg mb-10 text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Profitiere von Deutschlands erster digitaler Reifenservice-Plattform. 
              Erreiche neue Kunden, optimiere deine Auslastung, verwalte alles zentral.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register/workshop"
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                Werkstatt registrieren
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white rounded-lg font-bold text-lg hover:bg-white/20 transition-all border-2 border-white/20"
              >
                Zum Login
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-300">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                <span className="text-sm font-medium">Qualifizierte Anfragen</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">Keine Grundgebühr</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">Faire Provision</span>
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

      {/* Workshop Benefits - Premium Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block mb-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                Deine Vorteile
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Warum Bereifung24 für deine Werkstatt?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Profitiere von der ersten vollständig digitalen Reifenservice-Plattform Deutschlands
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {workshopBenefits.map((benefit, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all">
                  <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center text-white text-2xl mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {benefit.description}
                  </p>
                  <ul className="space-y-2">
                    {benefit.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-gray-600">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 md:p-12 rounded-2xl text-center shadow-2xl text-white">
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

      {/* How It Works for Workshops */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              So funktioniert's für Werkstätten
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              In 3 einfachen Schritten zu mehr Kunden
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {workshopSteps.map((step, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-4xl mb-6 text-white">
                  {step.emoji}
                </div>
                <div className="mb-6">
                  <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold mb-3">
                    Schritt {index + 1}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Funktionen für deine Werkstatt
              </h2>
              <p className="text-xl text-gray-600">
                Alles was du brauchst in einem Dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {workshopFeatures.map((feature, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
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
              Bereit durchzustarten?
            </h2>
            <p className="text-xl text-primary-100 mb-10">
              Registriere deine Werkstatt jetzt kostenlos und erreiche mehr Kunden
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register/workshop"
                className="px-10 py-5 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
              >
                Jetzt registrieren
              </Link>
              <Link
                href="/pricing"
                className="px-10 py-5 bg-primary-500 text-white rounded-lg font-bold text-lg hover:bg-primary-400 transition-all border-2 border-white/20"
              >
                Preise ansehen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">B24</span>
                </div>
                <h3 className="text-2xl font-bold">Bereifung24</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Deutschlands erste digitale Plattform für Reifenservice.
              </p>
            </div>

            {/* For Workshops */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Werkstätten</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/register/workshop" className="hover:text-white transition-colors">Werkstatt registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Werkstatt-Login</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Preise & Konditionen</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Customer Link */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Kunden</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/" className="hover:text-white transition-colors">Zur Kunden-Seite</Link></li>
                <li><Link href="/register/customer" className="hover:text-white transition-colors">Kunde werden</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-bold mb-4">Rechtliches</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-white transition-colors">AGB</Link></li>
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

const workshopSteps = [
  {
    title: 'Registrieren',
    description: 'Erstelle dein kostenloses Werkstatt-Profil. Hinterlege deine Services, Preise und Verfügbarkeiten.',
    emoji: '📝'
  },
  {
    title: 'Angebote erstellen',
    description: 'Erhalte qualifizierte Anfragen von Kunden in deiner Nähe. Erstelle individuelle Angebote in wenigen Klicks.',
    emoji: '💼'
  },
  {
    title: 'Aufträge erhalten',
    description: 'Kunden buchen deinen Service direkt online. Du erhältst alle Details automatisch und kannst loslegen.',
    emoji: '✅'
  }
]

const workshopFeatures = [
  {
    icon: '📅',
    title: 'Terminkalender',
    description: 'Verwalte alle Termine zentral. Synchronisiere mit Google Calendar.'
  },
  {
    icon: '👨‍🔧',
    title: 'Mitarbeiterverwaltung',
    description: 'Weise Termine Mitarbeitern zu. Verwalte Urlaube und Auslastung.'
  },
  {
    icon: '🌐',
    title: 'Eigene Landing Page',
    description: 'Erstelle deine eigene Werkstatt-Webseite mit Infos, Öffnungszeiten und Google Maps Integration.'
  },
  {
    icon: '🧮',
    title: 'Automatische Preiskalkulation',
    description: 'Lege einmal deine Preiskalkulation fest - das System berechnet alle Preise automatisch für dich.'
  },
  {
    icon: '💶',
    title: 'Preismanagement',
    description: 'Passe Preise flexibel an. Erstelle Sonderangebote und Pakete.'
  },
  {
    icon: '📊',
    title: 'Statistiken',
    description: 'Behalte den Überblick über Anfragen, Buchungen und Umsätze.'
  },
  {
    icon: '⭐',
    title: 'Bewertungssystem',
    description: 'Sammle positive Bewertungen und baue Vertrauen auf.'
  },
  {
    icon: '🔔',
    title: 'Benachrichtigungen',
    description: 'Erhalte sofort Bescheid über neue Anfragen und Buchungen.'
  },
  {
    icon: '🎧',
    title: 'Persönlicher Support',
    description: 'Direkter Ansprechpartner bei Bereifung24. Wir helfen dir bei Fragen und Problemen.'
  }
]
