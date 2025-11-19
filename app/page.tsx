import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-3 tracking-tight">
                Bereifung24
              </h1>
              <p className="text-xl md:text-2xl text-primary-100 font-medium">
                Die Online Plattform für Ihren Reifenservice
              </p>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 mt-8">
              Neue Reifen benötigt?
            </h2>
            <p className="text-xl md:text-2xl mb-4 text-primary-100">
              Anfrage stellen • Angebote vergleichen • Termin buchen
            </p>
            <p className="text-lg mb-10 text-primary-50 max-w-2xl mx-auto">
              Verbinde dich mit geprüften Werkstätten in deiner Nähe. Transparente Preise, schnelle Buchung, faire Konditionen.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register/customer"
                className="inline-block bg-white text-primary-600 px-10 py-5 rounded-lg font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
              >
                Jetzt Reifen anfragen
              </Link>
              <Link
                href="/login"
                className="inline-block bg-primary-500 text-white px-10 py-5 rounded-lg font-bold text-lg hover:bg-primary-400 transition-all border-2 border-white"
              >
                Anmelden
              </Link>
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

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              So einfach funktioniert's
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              In nur 3 Schritten zu deinen neuen Reifen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-lg">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Deine Vorteile
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="text-primary-600 mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Workshop */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 text-center shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Werkstatt-Betreiber?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Erreiche neue Kunden und steigere deine Auslastung. Registriere deine Werkstatt kostenlos!
            </p>
            <Link
              href="/register/workshop"
              className="inline-block bg-primary-600 text-white px-10 py-5 rounded-lg font-bold text-lg hover:bg-primary-500 transition-all transform hover:scale-105"
            >
              Werkstatt registrieren
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Bereifung24</h3>
              <p className="text-gray-400">
                Die moderne Plattform für Reifenkauf und Montage.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Für Kunden</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register/customer" className="hover:text-white">Registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white">Anmelden</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white">So funktioniert's</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Für Werkstätten</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register/workshop" className="hover:text-white">Werkstatt registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white">Werkstatt-Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-gray-400">
              <p>&copy; 2025 Bereifung24. Alle Rechte vorbehalten.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <Link href="/impressum" className="hover:text-white">Impressum</Link>
                <Link href="/datenschutz" className="hover:text-white">Datenschutz</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const steps = [
  {
    title: 'Anfrage stellen',
    description: 'Gib deine Reifendaten und Wünsche ein. Kostenlos und unverbindlich.',
  },
  {
    title: 'Angebote erhalten',
    description: 'Werkstätten in deiner Nähe erstellen dir passende Angebote.',
  },
  {
    title: 'Termin buchen',
    description: 'Wähle das beste Angebot und buche direkt deinen Wunschtermin.',
  },
]

const features = [
  {
    title: 'Kostenlos',
    description: 'Anfragen sind für Kunden komplett kostenlos und unverbindlich.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Transparent',
    description: 'Vergleiche Angebote und Preise verschiedener Werkstätten.',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Schnell',
    description: 'Erhalte zeitnah passende Angebote von Werkstätten in deiner Nähe.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'Geprüft',
    description: 'Alle Werkstätten werden von uns verifiziert.',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  },
]
