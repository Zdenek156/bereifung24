import Link from 'next/link'

export default function WorkshopBenefitsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/" className="text-primary-400 hover:text-primary-300 text-sm mb-4 inline-block">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Vorteile für Werkstätten</h1>
          <p className="text-xl text-gray-300">Steigern Sie Ihre Auslastung mit Bereifung24</p>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Benefits */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Warum Bereifung24?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{benefit.description}</p>
                  <ul className="space-y-2">
                    {benefit.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Bereit durchzustarten?</h2>
            <p className="text-xl text-primary-100 mb-8">
              Registrieren Sie Ihre Werkstatt jetzt kostenlos
            </p>
            <Link
              href="/register/workshop"
              className="inline-block px-8 py-4 bg-white text-primary-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
            >
              Jetzt registrieren
            </Link>
          </section>
        </div>
      </main>
    </div>
  )
}

const benefits = [
  {
    icon: '👥',
    title: 'Neue Kunden gewinnen',
    description: 'Erreichen Sie Autofahrer, die aktiv nach Ihren Services suchen',
    details: [
      'Qualifizierte Anfragen in Ihrem Umkreis',
      'Kunden suchen gezielt nach Services',
      'Höhere Conversion als klassische Werbung'
    ]
  },
  {
    icon: '📊',
    title: 'Auslastung optimieren',
    description: 'Füllen Sie Lücken in Ihrem Terminkalender',
    details: [
      'Flexibles Angebots-Management',
      'Automatische Terminverwaltung',
      'Echtzeit-Kapazitätsplanung'
    ]
  },
  {
    icon: '💰',
    title: 'Faire Konditionen',
    description: 'Keine versteckten Kosten oder Grundgebühren',
    details: [
      'Kostenlose Registrierung',
      'Keine monatlichen Fixkosten',
      'Provision nur bei erfolgreicher Vermittlung'
    ]
  },
  {
    icon: '💻',
    title: 'Digitale Verwaltung',
    description: 'Alle Prozesse in einem zentralen Dashboard',
    details: [
      'Einfache Serviceverwaltung',
      'Mitarbeiter- & Urlaubsplanung',
      'Automatisierte Benachrichtigungen'
    ]
  }
]
