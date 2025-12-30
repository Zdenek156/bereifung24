'use client'

export default function InfluencerHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Bereifung24 Partner-Programm
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Verdienen Sie Provisionen als Influencer! Empfehlen Sie Deutschlands führende Reifen-Plattform und profitieren Sie von attraktiven Vergütungen.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href="/influencer/login"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Partner Login
            </a>
            <a
              href="mailto:partner@bereifung24.de"
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Partner werden
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Attraktive Provisionen</h3>
            <p className="text-gray-600">
              Verdienen Sie für jede Registrierung und jeden abgeschlossenen Deal über Ihren Link
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Live-Dashboard</h3>
            <p className="text-gray-600">
              Verfolgen Sie Ihre Clicks, Conversions und Einnahmen in Echtzeit
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schnelle Auszahlung</h3>
            <p className="text-gray-600">
              Fordern Sie Ihre Provisionen ab €50 an und erhalten Sie Ihr Geld innerhalb von 7-14 Tagen
            </p>
          </div>
        </div>

        {/* Commission Rates */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Unsere Provisionen</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
              <div className="text-4xl font-bold text-blue-600 mb-2">€3-5</div>
              <div className="text-gray-600 text-sm mb-2">pro 1000 Views</div>
              <div className="text-gray-500 text-xs">Verfolgen Sie Ihre Reichweite</div>
            </div>

            <div className="border-2 border-blue-500 rounded-xl p-6 text-center bg-blue-50">
              <div className="text-4xl font-bold text-blue-600 mb-2">€15</div>
              <div className="text-gray-600 text-sm mb-2">pro Registrierung</div>
              <div className="text-gray-500 text-xs">Jeder neue Kunde zählt</div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
              <div className="text-4xl font-bold text-blue-600 mb-2">€25</div>
              <div className="text-gray-600 text-sm mb-2">pro Deal</div>
              <div className="text-gray-500 text-xs">Bei abgeschlossenem Auftrag</div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">So funktioniert's</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Bewerben</h3>
              <p className="text-sm text-gray-600">Kontaktieren Sie uns und werden Sie Partner</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Link erhalten</h3>
              <p className="text-sm text-gray-600">Sie bekommen Ihren persönlichen Tracking-Link</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Promoten</h3>
              <p className="text-sm text-gray-600">Teilen Sie Bereifung24 mit Ihrer Community</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="font-semibold text-gray-900 mb-2">Verdienen</h3>
              <p className="text-sm text-gray-600">Erhalten Sie Provisionen für jeden Erfolg</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Bereit durchzustarten?</h2>
          <p className="text-xl mb-8 opacity-90">
            Werden Sie Teil unseres Partner-Netzwerks und verdienen Sie mit jedem vermittelten Kunden
          </p>
          <a
            href="mailto:partner@bereifung24.de"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Jetzt Partner werden
          </a>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600">
          <p className="mb-2">© {new Date().getFullYear()} Bereifung24. Alle Rechte vorbehalten.</p>
          <div className="flex gap-6 justify-center text-sm">
            <a href="/agb" className="hover:text-blue-600">AGB</a>
            <a href="/datenschutz" className="hover:text-blue-600">Datenschutz</a>
            <a href="/impressum" className="hover:text-blue-600">Impressum</a>
          </div>
        </div>
      </div>
    </div>
  )
}
