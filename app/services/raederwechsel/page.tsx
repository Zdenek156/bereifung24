import Link from 'next/link'
import { Check, ArrowLeft, Search } from 'lucide-react'

export const metadata = {
  title: 'Räderwechsel - Bereifung24',
  description: 'Professioneller Räderwechsel von Sommer- auf Winterreifen. Schnell, günstig und unkompliziert bei geprüften Werkstätten buchen.'
}

const faqData = [
  { question: 'Was kostet ein Räderwechsel?', answer: 'Ein Räderwechsel kostet zwischen 20-50€ für alle 4 Räder, je nach Werkstatt und Fahrzeugtyp. Bei Bereifung24 finden Sie transparente Festpreise.' },
  { question: 'Was ist der Unterschied zwischen Räderwechsel und Reifenwechsel?', answer: 'Beim Räderwechsel werden die kompletten Räder (Reifen + Felge) getauscht. Beim Reifenwechsel werden die Reifen von der Felge demontiert und neue aufgezogen.' },
  { question: 'Wie oft sollte man die Räder wechseln?', answer: 'Zweimal im Jahr: Im Oktober auf Winterreifen (O bis O: Oktober bis Ostern) und im April zurück auf Sommerreifen.' },
  { question: 'Muss ich die Schrauben nach dem Räderwechsel nachziehen?', answer: 'Ja! Nach 50-100 km sollten die Radschrauben unbedingt mit dem korrekten Drehmoment nachgezogen werden. Dies ist sicherheitsrelevant.' },
]

export default function RaederwechselPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://www.bereifung24.de' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://www.bereifung24.de/services' },
        { '@type': 'ListItem', position: 3, name: 'Räderwechsel', item: 'https://www.bereifung24.de/services/raederwechsel' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Navigation */}
      <nav className="bg-primary-600 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Zurück</span>
            </Link>
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <img src="/logos/B24_Logo_weiss.png" alt="Bereifung24" className="h-10 w-auto object-contain" />
            </Link>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">🔄</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Räderwechsel
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Schneller und professioneller Wechsel von Sommer- auf Winterreifen oder umgekehrt
            </p>
            <Link
              href="/?service=WHEEL_CHANGE"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
            >
              <Search className="w-5 h-5" />
              Jetzt Werkstatt finden
            </Link>
          </div>
        </div>
      </section>

      {/* Was ist ein Räderwechsel */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Was ist ein Räderwechsel?
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Beim Räderwechsel werden die kompletten Räder (Reifen + Felge als Einheit) vom Fahrzeug ab- und wieder anmontiert. Dies ist der klassische Wechsel zwischen Sommer- und Winterreifen, wenn Sie bereits zwei Sätze komplett montierter Räder besitzen.
            </p>
            <p className="text-lg text-gray-700">
              Der Räderwechsel ist schneller und günstiger als ein Reifenwechsel, da die Reifen nicht von den Felgen demontiert werden müssen. Die Räder werden einfach gewechselt und mit dem vorgeschriebenen Drehmoment angezogen.
            </p>
          </div>
        </div>
      </section>

      {/* Unterschied Räderwechsel vs Reifenwechsel */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Räderwechsel vs. Reifenwechsel
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Räderwechsel */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-primary-200">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Räderwechsel</h3>
                <p className="text-gray-700 mb-4">
                  Wechsel kompletter Räder (Reifen + Felge)
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Schneller (ca. 15-30 Min.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Günstiger (ab 20€)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Beide Felgensätze notwendig</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Ideal für saisonalen Wechsel</span>
                  </li>
                </ul>
              </div>

              {/* Reifenwechsel */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                <div className="text-4xl mb-4">🚗</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Reifenwechsel</h3>
                <p className="text-gray-700 mb-4">
                  Reifen werden von Felgen demontiert
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Länger (ca. 45-90 Min.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Teurer (ab 40€)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Nur ein Felgensatz nötig</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Bei neuen/alten Reifen</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service-Optionen */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Unsere Service-Optionen
            </h2>

            <div className="space-y-6">
              {/* Basis Räderwechsel */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border-2 border-primary-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Basis Räderwechsel</h3>
                <p className="text-gray-700 mb-4">
                  Der einfache Wechsel Ihrer Räder mit professioneller Montage
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Demontage der alten Räder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Montage der neuen Räder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Anzug mit Drehmomentschlüssel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Luftdruckkontrolle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Profiltiefenprüfung</span>
                  </li>
                </ul>
              </div>

              {/* Mit Auswuchten */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  Mit Auswuchten 
                  <span className="text-sm font-normal text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    Empfohlen
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  Räderwechsel inkl. professionellem Auswuchten für ruhigen Lauf
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Alle Leistungen vom Basis-Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Computergestütztes Auswuchten</strong> aller 4 Räder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Vermeidung von Vibrationen und Flattern</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Längere Lebensdauer der Reifen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Schonung von Radlagern und Fahrwerk</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Tipp:</strong> Auswuchten wird empfohlen bei langer Lagerung (über 6 Monate) oder wenn Vibrationen spürbar sind.
                  </p>
                </div>
              </div>

              {/* Mit Einlagerung */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mit Einlagerung</h3>
                <p className="text-gray-700 mb-4">
                  Räderwechsel inkl. fachgerechte Einlagerung Ihrer Reifen bis zur nächsten Saison
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Alle Leistungen vom Basis-Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Fachgerechte Lagerung</strong> in klimatisiertem Reifen hotel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Reinigung vor der Einlagerung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Dokumentation und Kennzeichnung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Versicherungsschutz inkludiert</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Lagerung für 6 Monate (verlängerbar)</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">
                    <strong>✅ Vorteil:</strong> Kein Platzbedarf zuhause, optimale Lagerbedingungen, längere Reifenlebensdauer.
                  </p>
                </div>
              </div>

              {/* Mit Räderwäsche */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  Mit Räderwäsche
                  <span className="text-sm font-normal text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
                    Beliebte Option
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  Räderwechsel inkl. professioneller Reinigung Ihrer abmontierten Räder — so nehmen Sie saubere Räder mit nach Hause
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Alle Leistungen vom Basis-Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Gründliche Reinigung</strong> aller 4 abmontierten Räder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Entfernung von Bremsstaub, Schmutz und Salzresten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Felgen und Reifen gereinigt zur Mitnahme bereit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Schont die Felgen und verhindert Korrosion</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <p className="text-sm text-cyan-900">
                    <strong>🧼 Tipp:</strong> Besonders empfehlenswert nach der Wintersaison — Streusalz und Bremsstaub greifen ungereinigt die Felgen an. Saubere Räder lagern besser und halten länger.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Wichtige Hinweise
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">🔧</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Drehmoment</h3>
                <p className="text-gray-700">
                  Die Radschrauben werden immer mit dem vom Hersteller vorgeschriebenen Drehmoment angezogen. Nach 50-100 km sollten Sie die Schrauben nachziehen lassen.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">📏</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Profiltiefe</h3>
                <p className="text-gray-700">
                  Bei jeder Montage wird die Profiltiefe geprüft. Gesetzliches Minimum: 1,6mm. Empfohlen für sicheres Fahren: mindestens 3mm (Sommer) bzw. 4mm (Winter).
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">💨</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Luftdruck</h3>
                <p className="text-gray-700">
                  Der richtige Reifendruck wird eingestellt (siehe Türholm oder Tankdeckel). Zu niedriger Druck erhöht Verschleiß und Verbrauch.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">RDKS-Sensoren</h3>
                <p className="text-gray-700">
                  Bei Fahrzeugen mit Reifendruckkontrollsystem (RDKS) müssen die Sensoren neu angelernt werden. Dies ist bei den meisten Werkstätten im Preis enthalten.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Häufige Fragen zum Räderwechsel</h2>
            <div className="space-y-4">
              {faqData.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Links */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Weitere Services & beliebte Reifengrößen</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Unsere Services</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/services/reifenwechsel" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Reifenwechsel</Link>
                  <Link href="/services/reifenreparatur" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Reifenreparatur</Link>
                  <Link href="/services/achsvermessung" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Achsvermessung</Link>
                  <Link href="/services/klimaservice" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Klimaservice</Link>
                  <Link href="/services/motorradreifen" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Motorradreifen</Link>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Beliebte Reifengrößen</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/reifen/205-55-r16" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">205/55 R16</Link>
                  <Link href="/reifen/225-45-r17" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">225/45 R17</Link>
                  <Link href="/reifen/195-65-r15" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">195/65 R15</Link>
                  <Link href="/reifen/225-40-r18" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">225/40 R18</Link>
                  <Link href="/reifen/205-60-r16" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">205/60 R16</Link>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Räderwechsel in deiner Stadt</h3>
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
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Bereit für den Räderwechsel?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Finde jetzt die passende Werkstatt in deiner Nähe und buche direkt online
          </p>
          <Link
            href="/?service=WHEEL_CHANGE"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
          >
            <Search className="w-5 h-5" />
            Jetzt Werkstatt finden
          </Link>
        </div>
      </section>
    </div>
  )
}
