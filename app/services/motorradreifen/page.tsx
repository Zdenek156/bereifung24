import Link from 'next/link'
import { Check, ArrowLeft, Search, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Motorradreifen wechseln - Bereifung24',
  description: 'Professioneller Motorradreifen-Service. Vorderrad, Hinterrad oder beide Räder wechseln lassen bei Spezialisten.'
}

const faqData = [
  { question: 'Was kostet ein Motorradreifen-Wechsel?', answer: 'Ein Motorradreifen-Wechsel kostet zwischen 20-50€ pro Rad, je nach Werkstatt. Für beide Räder zusammen rechnen Sie mit 40-80€ inklusive Auswuchten.' },
  { question: 'Wie oft muss ich Motorradreifen wechseln?', answer: 'Motorradreifen halten durchschnittlich 5.000-15.000 km, je nach Fahrweise und Reifentyp. Sportreifen verschleißen schneller als Tourenreifen. Spätestens nach 5-6 Jahren sollten Reifen getauscht werden.' },
  { question: 'Kann ich Motorradreifen selbst montieren?', answer: 'Die Montage von Motorradreifen erfordert Spezialwerkzeug und Erfahrung. Falsch montierte Reifen können lebensgefährlich sein. Wir empfehlen immer den Wechsel in einer Fachwerkstatt.' },
  { question: 'Müssen Motorradreifen eingefahren werden?', answer: 'Ja! Neue Motorradreifen haben eine glatte Oberfläche und müssen ca. 100-200 km eingefahren werden. In dieser Zeit vorsichtig fahren und extreme Schräglagen vermeiden.' },
]

export default function MotorradreifenPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://www.bereifung24.de' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://www.bereifung24.de/services' },
        { '@type': 'ListItem', position: 3, name: 'Motorradreifen', item: 'https://www.bereifung24.de/services/motorradreifen' },
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

      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">🏍️</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Motorradreifen
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Professionelle Reifenmontage für Motorräder
            </p>
            <Link
              href="/?service=MOTORCYCLE_TIRE"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
            >
              <Search className="w-5 h-5" />
              Jetzt Werkstatt finden
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Motorradreifen-Service
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Der Reifenwechsel beim Motorrad erfordert spezielles Know-how und Werkzeug. Im Gegensatz zum Auto sind Motorradreifen komplexer zu montieren, da:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Die Reifen schlauchlos sind und präzise montiert werden müssen</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Spezielle Montagemaschinen für Motorradreifen nötig sind</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Die Felgen leicht beschädigt werden können</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Bei vielen Motorrädern das Hinterrad schwer zugänglich ist</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Die richtige Laufrichtung und Montage sicherheitsrelevant ist</span>
              </li>
            </ul>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-orange-900 mb-2">Wichtig: Spezialisierte Werkstatt wählen</h3>
                  <p className="text-orange-900">
                    Nicht jede Kfz-Werkstatt bietet Motorradreifen-Service an. Achten Sie darauf, dass die Werkstatt über 
                    Erfahrung, spezielles Werkzeug und Motorrad-Montagemaschinen verfügt. Unsachgemäße Montage kann zu 
                    gefährlichen Situationen führen.
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
              Unsere Service-Optionen
            </h2>

            <div className="space-y-6">
              {/* Vorderrad */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Vorderrad wechseln</h3>
                <p className="text-gray-700 mb-4">
                  Reifenwechsel am ausgebauten Vorderrad (nur Felge)
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Demontage des alten Reifens von der Felge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Montage des neuen Reifens mit Montagemaschine</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Neues Ventil (empfohlen)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Auswuchten des Rades</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Info:</strong> Das Vorderrad ist einfacher zu wechseln als das Hinterrad. Dauer: ca. 45-60 Min.
                  </p>
                </div>
              </div>

              {/* Hinterrad */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Hinterrad wechseln</h3>
                <p className="text-gray-700 mb-4">
                  Reifenwechsel am ausgebauten Hinterrad (nur Felge)
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Demontage des alten Reifens von der Felge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Montage des neuen Reifens mit spezieller Motorrad-Montagemaschine</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Neues Ventil (dringend empfohlen)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Auswuchten des Rades</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ Hinweis:</strong> Der Hinterrad-Wechsel ist aufwendiger, da Kette/Riemen, Bremse und Antrieb berücksichtigt werden müssen. Dauer: ca. 60-90 Min.
                  </p>
                </div>
              </div>

              {/* Beide Räder */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border-2 border-primary-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  Beide Räder wechseln
                  <span className="text-sm font-normal text-primary-600 bg-white px-3 py-1 rounded-full">
                    Empfohlen
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  Kompletter Reifenwechsel vorne und hinten für optimale Fahreigenschaften
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Alle Leistungen von Vorder- und Hinterrad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Kompletter Reifensatz für gleichmäßigen Verschleiß</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Optimale Fahreigenschaften und Sicherheit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Meist günstiger als Einzelwechsel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Nur ein Werkstattbesuch nötig</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">
                    <strong>✅ Empfehlung:</strong> Vorder- und Hinterreifen sollten idealerweise zusammen gewechselt werden, 
                    da unterschiedliche Reifenalter das Fahrverhalten negativ beeinflussen können. Dies ist besonders bei 
                    Sportmotorrädern wichtig.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reifentypen */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Motorradreifen-Typen
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Straßenreifen</h3>
                <p className="text-gray-700 mb-3">
                  Standard-Reifen für Straßenmotorräder, Tourer und Cruiser
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Gute Haftung bei verschiedenen Wetterbedingungen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Hohe Laufleistung (8.000-15.000 km)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Ausgewogenes Preis-Leistungs-Verhältnis</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Sportreifen</h3>
                <p className="text-gray-700 mb-3">
                  High-Performance Reifen für Sportmotorräder und sportliche Fahrer
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Maximaler Grip bei hohen Geschwindigkeiten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Kürzere Laufleistung (3.000-6.000 km)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Benötigen Betriebstemperatur für optimale Haftung</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Tourenreifen</h3>
                <p className="text-gray-700 mb-3">
                  Langstrecken-Reifen für Touring- und Reise-Motorräder
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Maximale Laufleistung (12.000-20.000 km)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Komfort bei langen Strecken</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Gut bei Nässe und wechselnden Bedingungen</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Enduro/Off-Road</h3>
                <p className="text-gray-700 mb-3">
                  Spezialreifen für Gelände und Enduro-Motorräder
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Grobes Profil für Grip im Gelände</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Verstärkte Karkasse für Steine und Wurzeln</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <span>Auch straßenzugelassene Varianten verfügbar</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wichtige Hinweise */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Wichtige Sicherheitshinweise
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">🏁</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Einfahrzeit beachten</h3>
                <p className="text-gray-700">
                  Neue Motorradreifen haben eine Trennmittelschicht von der Produktion. Fahren Sie die ersten 100-200 km vorsichtig, 
                  vermeiden Sie starke Schräglagen und abrupte Bremsungen.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">📏</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Profiltiefe kontrollieren</h3>
                <p className="text-gray-700">
                  Gesetzliches Minimum: 1,6mm. Empfohlen: mindestens 2mm für Sicherheit bei Nässe. Besonders in Schräglagen 
                  ist ausreichend Profil lebenswichtig.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">💨</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Reifendruck</h3>
                <p className="text-gray-700">
                  Prüfen Sie den Reifendruck regelmäßig (alle 2 Wochen) im kalten Zustand. Falscher Druck beeinflusst 
                  Handling, Verschleiß und Sicherheit massiv. Werte siehe Bedienungsanleitung oder Aufkleber.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">📅</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">DOT-Nummer (Alter)</h3>
                <p className="text-gray-700">
                  Motorradreifen sollten nicht älter als 5-6 Jahre sein, auch bei ausreichend Profil. Das Gummi wird mit 
                  der Zeit hart und verliert Haftung. DOT-Nummer zeigt Produktionswoche und -jahr.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">↔️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Laufrichtung</h3>
                <p className="text-gray-700">
                  Motorradreifen haben eine vorgeschriebene Laufrichtung (Pfeil auf der Seitenwand). Falsche Montage 
                  beeinträchtigt Grip und Wasserableitung erheblich - lebensgefährlich!
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-3xl mb-3">🔧</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ventile wechseln</h3>
                <p className="text-gray-700">
                  Bei jedem Reifenwechsel sollten neue Ventile montiert werden. Alte Gummiventile können undicht werden. 
                  Kosten sind gering, Sicherheit geht vor.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Häufige Fragen zu Motorradreifen</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Weitere Services</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Unsere Services</h3>
                <div className="flex flex-wrap gap-2">
                  <Link href="/services/reifenwechsel" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Reifenwechsel</Link>
                  <Link href="/services/raederwechsel" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Räderwechsel</Link>
                  <Link href="/services/reifenreparatur" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Reifenreparatur</Link>
                  <Link href="/services/achsvermessung" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Achsvermessung</Link>
                  <Link href="/services/klimaservice" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Klimaservice</Link>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Werkstatt in deiner Stadt</h3>
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Motorradreifen wechseln lassen?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Finde Spezialisten für Motorradreifen in deiner Nähe
          </p>
          <Link
            href="/?service=MOTORCYCLE_TIRE"
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
