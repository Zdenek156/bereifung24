import Link from 'next/link'

export default function CookieSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cookie-Einstellungen</h1>
          <p className="text-gray-600 mt-2">Informationen zu Cookies auf bereifung24.de</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Was sind Cookies?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie unsere Website besuchen. 
              Sie helfen uns, Ihre Login-Sitzung aufrechtzuerhalten und die Website-Sicherheit zu gewährleisten.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Gemäß der EU-Datenschutz-Grundverordnung (DSGVO) informieren wir Sie transparent über die Verwendung von Cookies auf unserer Website.
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="text-lg font-bold text-green-900 mb-2">✅ Maximaler Datenschutz auf bereifung24.de</h3>
                <p className="text-green-800 leading-relaxed">
                  Wir verwenden ausschließlich <strong>technisch notwendige Cookies</strong>, die für den Betrieb der Website erforderlich sind. 
                  Diese Cookies benötigen nach DSGVO und ePrivacy-Richtlinie <strong>keine Einwilligung</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Necessary Cookies Only */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  🔒 Technisch notwendige Cookies
                </h3>
                <p className="text-gray-600 mb-4">
                  Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden. 
                  Sie speichern keine personenbezogenen Daten und dienen ausschließlich der Sicherheit und Funktionalität.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Session-Cookies</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Zweck:</strong> Aufrechterhaltung Ihrer Login-Sitzung</p>
                      <p><strong>Cookie-Name:</strong> <code className="bg-gray-200 px-2 py-1 rounded">next-auth.session-token</code></p>
                      <p><strong>Speicherdauer:</strong> Bis Ende der Browser-Sitzung</p>
                      <p><strong>Typ:</strong> First-Party Cookie (nur bereifung24.de)</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">CSRF-Schutz</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Zweck:</strong> Schutz vor Cross-Site-Request-Forgery-Angriffen</p>
                      <p><strong>Cookie-Name:</strong> <code className="bg-gray-200 px-2 py-1 rounded">next-auth.csrf-token</code></p>
                      <p><strong>Speicherdauer:</strong> Bis Ende der Browser-Sitzung</p>
                      <p><strong>Typ:</strong> First-Party Cookie (nur bereifung24.de)</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Cookie-Hinweis</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Zweck:</strong> Speichert, dass Sie den Cookie-Hinweis gesehen haben</p>
                      <p><strong>Cookie-Name:</strong> <code className="bg-gray-200 px-2 py-1 rounded">cookie_consent</code></p>
                      <p><strong>Speicherdauer:</strong> 1 Jahr</p>
                      <p><strong>Typ:</strong> First-Party Cookie (nur bereifung24.de)</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-7 bg-green-600 rounded-full relative">
                  <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Immer aktiv</p>
              </div>
            </div>
          </div>

          {/* Was wir NICHT verwenden */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-green-500">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Was wir NICHT verwenden
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">❌ Kein Google Analytics</h4>
                <p className="text-sm text-gray-600">
                  Wir verwenden kein Google Analytics oder andere Google-Tracking-Dienste.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">❌ Kein Facebook Pixel</h4>
                <p className="text-sm text-gray-600">
                  Wir verwenden kein Facebook Pixel oder Meta-Tracking.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">❌ Keine Marketing-Cookies</h4>
                <p className="text-sm text-gray-600">
                  Wir setzen keine Cookies für Werbezwecke oder Retargeting.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">❌ Keine Drittanbieter-Tracker</h4>
                <p className="text-sm text-gray-600">
                  Wir geben keine Daten an externe Werbenetzwerke weiter.
                </p>
              </div>
            </div>
          </div>

          {/* Eigenes Analytics */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-3">📊 Unser eigenes, datenschutzfreundliches Analytics</h3>
            <p className="text-blue-800 leading-relaxed mb-3">
              Für die Verbesserung unserer Website nutzen wir ein <strong>eigenes, serverseitiges Analytics-System</strong>, 
              das vollständig auf unseren Servern läuft und <strong>keine Cookies im Browser setzt</strong>.
            </p>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Keine Browser-Cookies:</strong> Alle Daten werden serverseitig erfasst</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Keine Drittanbieter:</strong> Daten bleiben auf unseren Servern in Deutschland</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Anonymisierte Daten:</strong> Keine personenbezogenen Daten, nur Seitenaufrufe und Referrer</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>DSGVO-konform:</strong> Volle Kontrolle über Ihre Daten</span>
              </li>
            </ul>
          </div>

          {/* DSGVO Rights */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🛡️ Ihre Rechte nach DSGVO</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Auskunft (Art. 15 DSGVO):</strong> Sie haben ein Recht auf Auskunft über gespeicherte Daten</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Berichtigung (Art. 16 DSGVO):</strong> Sie können falsche Daten korrigieren lassen</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Widerspruch (Art. 21 DSGVO):</strong> Sie können der Verarbeitung widersprechen</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Beschwerde:</strong> Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-6 p-4 bg-gray-50 rounded">
              <strong>Kontakt für Datenschutzfragen:</strong><br />
              E-Mail: <a href="mailto:datenschutz@bereifung24.de" className="text-primary-600 hover:text-primary-700 font-semibold">datenschutz@bereifung24.de</a><br />
              Telefon: <a href="tel:+4971479679990" className="text-primary-600 hover:text-primary-700 font-semibold">+49 7147 9679990</a>
            </p>
          </div>

          {/* Links */}
          <div className="bg-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Weitere Informationen</h3>
            <div className="flex flex-col gap-3">
              <Link 
                href="/datenschutz" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Vollständige Datenschutzerklärung
              </Link>
              <Link 
                href="/impressum" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Impressum
              </Link>
              <Link 
                href="/agb" 
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Allgemeine Geschäftsbedingungen
              </Link>
            </div>
          </div>

          {/* Last Updated */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Stand: 24.01.2026
          </p>
        </div>
      </main>
    </div>
  )
}
