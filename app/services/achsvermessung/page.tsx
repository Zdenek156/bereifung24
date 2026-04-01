import Link from 'next/link'
import { Check, ArrowLeft, Search, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Achsvermessung + Einstellung - Bereifung24',
  description: 'Professionelle Achsvermessung und Fahrwerkseinstellung. Spur, Sturz und Nachlauf präzise einstellen lassen.',
  alternates: { canonical: 'https://bereifung24.de/services/achsvermessung' }
}

const faqData = [
  { question: 'Was kostet eine Achsvermessung?', answer: 'Eine Achsvermessung kostet je nach Umfang zwischen 50-150€. Eine reine Vermessung ist günstiger, mit Einstellung der Spur und Sturz entsprechend teurer.' },
  { question: 'Wie lange dauert eine Achsvermessung?', answer: 'Eine Achsvermessung dauert ca. 30-60 Minuten. Mit anschließender Einstellung von Spur und Sturz kann es 60-90 Minuten dauern.' },
  { question: 'Wann brauche ich eine Achsvermessung?', answer: 'Bei ungleichmäßigem Reifenverschleiß, nach Schlagloch- oder Bordsteinkontakt, wenn das Fahrzeug seitlich zieht, nach Fahrwerksarbeiten und nach dem Kauf von Gebrauchtwagen.' },
  { question: 'Was wird bei einer Achsvermessung gemessen?', answer: 'Spur (Toe), Sturz (Camber) und Nachlauf (Caster) werden mit modernster 3D-Technik vermessen und mit den Herstellervorgaben verglichen.' },
]

export default function AchsvermessungPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://bereifung24.de' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://bereifung24.de/services' },
        { '@type': 'ListItem', position: 3, name: 'Achsvermessung', item: 'https://bereifung24.de/services/achsvermessung' },
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
            <div className="text-6xl mb-6">📏</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Achsvermessung + Einstellung
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Präzise Fahrwerksvermessung für optimalen Geradeauslauf und Reifenverschleiß
            </p>
            <Link
              href="/?service=ALIGNMENT_BOTH"
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
              Was ist eine Achsvermessung?
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Bei der Achsvermessung (auch Spureinstellung oder Fahrwerkvermessung genannt) werden die Winkel und 
              Positionen der Räder zueinander und zur Fahrzeugachse computergestützt gemessen und - bei Bedarf - korrigiert.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Moderne 3D-Achsvermessungsgeräte erfassen dabei präzise:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
                <h3 className="font-bold text-gray-900 mb-2">Spur (Vorspur/Nachspur)</h3>
                <p className="text-sm text-gray-700">
                  Der Winkel der Räder in Fahrtrichtung. Falsche Spur führt zu einseitigem Reifenverschleiß und 
                  schlechtem Geradeauslauf.
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
                <h3 className="font-bold text-gray-900 mb-2">Sturz (Camber)</h3>
                <p className="text-sm text-gray-700">
                  Die Neigung des Rades zur Senkrechten. Beeinflusst Kurvenstabilität und Reifenverschleiß an den Rändern.
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
                <h3 className="font-bold text-gray-900 mb-2">Nachlauf (Caster)</h3>
                <p className="text-sm text-gray-700">
                  Die Neigung der Lenkachse. Wichtig für das Lenkverhalten und das Rückstellmoment des Lenkrads.
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
                <h3 className="font-bold text-gray-900 mb-2">Spreizung</h3>
                <p className="text-sm text-gray-700">
                  Der Winkel der Lenkachse zur Fahrzeuglängsachse. Beeinflusst die Lenkkräfte und Stabilität.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Wann ist eine Achsvermessung nötig?</h3>
                  <ul className="space-y-1 text-blue-900">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <span>Nach einem Unfall oder Bordsteinkontakt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <span>Bei einseitigem oder ungleichmäßigem Reifenverschleiß</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <span>Wenn das Fahrzeug zur Seite zieht</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <span>Nach Fahrwerksarbeiten (Stoßdämpfer, Federn, Querlenker)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <span>Lenkrad steht beim Geradeausfahren schief</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <span>Bei neuen Reifen (zur Optimierung)</span>
                    </li>
                  </ul>
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
              {/* Nur Messung */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Nur Vermessung</h3>
                  <p className="text-gray-600">
                    Computergestützte 3D-Vermessung ohne anschließende Einstellung
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Vorderachse vermessen</h4>
                    <p className="text-gray-700 mb-3">
                      Vermessung der Vorderachse mit detailliertem Prüfprotokoll
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">3D-Vermessung der Vorderachse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Messung von Spur, Sturz und Nachlauf</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Ausgedrucktes Messprotokoll mit Soll-/Ist-Werten</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Empfehlung zur Einstellung (falls nötig)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Hinterachse vermessen</h4>
                    <p className="text-gray-700 mb-3">
                      Vermessung der Hinterachse mit detailliertem Prüfprotokoll
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">3D-Vermessung der Hinterachse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Messung von Spur und Sturz (Nachlauf nicht relevant)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Messprotokoll mit Toleranzen</span>
                      </li>
                    </ul>
                    <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-900">
                        <strong>⚠️ Hinweis:</strong> Nicht bei allen Fahrzeugen ist die Hinterachse einstellbar!
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Beide Achsen vermessen</h4>
                    <p className="text-gray-700 mb-3">
                      Komplette Vermessung von Vorder- und Hinterachse mit Gesamtprotokoll
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Vollständige 3D-Analyse des Fahrwerks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Alle Werte von Vorder- und Hinterachse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Radstand und Achsversatz werden geprüft</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                        <span className="text-gray-700">Detailliertes Gesamtprotokoll</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mit Einstellung */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300">
                <div className="mb-4 pb-4 border-b border-green-300">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Mit Einstellung</h3>
                  <p className="text-gray-700">
                    Vermessung und präzise Korrektur der Achsgeometrie auf Sollwerte
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Vorderachse einstellen</h4>
                    <p className="text-gray-700 mb-3">
                      Vermessung und präzise Einstellung der Vorderachse für optimalen Geradeauslauf
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Komplette 3D-Vermessung</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Einstellung der Vorderachse auf Sollwerte</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Spurkorrektur (falls möglich)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Kontrolle nach Einstellung</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Messprotokoll vorher/nachher</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Hinterachse einstellen</h4>
                    <p className="text-gray-700 mb-3">
                      Vermessung und präzise Einstellung der Hinterachse (falls einstellbar)
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">3D-Vermessung der Hinterachse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Einstellung auf Herstellervorgaben</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Spurkorrektur hinten (bei Mehrlenkerachse)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Kontrolle und Protokoll</span>
                      </li>
                    </ul>
                    <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                      <p className="text-sm text-orange-900">
                        <strong>💡 Wichtig:</strong> Hinterachsen von Limousinen sind oft nicht einstellbar. Bei Mehrlenkerachsen 
                        (z.B. Sportwagen, SUVs) ist meist eine Einstellung möglich.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border-2 border-green-400">
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      Beide Achsen einstellen
                      <span className="text-sm font-normal text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        Empfohlen
                      </span>
                    </h4>
                    <p className="text-gray-700 mb-3">
                      Komplette Vermessung und Einstellung beider Achsen für perfekte Fahreigenschaften
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Vollständige 3D-Vermessung vorne und hinten</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Einstellung Vorder- und Hinterachse</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Optimaler Geradeauslauf garantiert</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Minimaler Reifenverschleiß</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-gray-700">Perfekte Kurvenstabilität</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Komplett-Service */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-300">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Komplett-Service mit Inspektion</h3>
                <p className="text-gray-700 mb-4">
                  Achsvermessung, Einstellung und zusätzliche Fahrwerksinspektion (Stoßdämpfer, Spurstangen, etc.)
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Alle Leistungen der Einstellung beider Achsen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Komplette Fahrwerksinspektion</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Prüfung der Stoßdämpfer (Funktionstest)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Kontrolle der Spurstangen und Gelenke</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Prüfung der Querlenkerlager und Gummilager</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Sichtprüfung auf Beschädigungen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Detaillierter Inspektionsbericht</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-900">
                    <strong>✅ Ideal für:</strong> Fahrzeuge mit hoher Laufleistung, nach Unfällen oder bei auffälligem 
                    Fahrverhalten. Die Inspektion deckt versteckte Mängel auf, die eine optimale Einstellung verhindern könnten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vorteile */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Vorteile einer korrekten Achsgeometrie
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Längere Reifenlebensdauer</h3>
                <p className="text-gray-700">
                  Falsche Spureinstellung kann Reifen in wenigen Tausend Kilometern ruinieren. Korrekte Einstellung spart bares Geld.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🛡️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Mehr Sicherheit</h3>
                <p className="text-gray-700">
                  Optimale Spureinstellung bedeutet bessere Straßenlage, kürzere Bremswege und sichereres Handling.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⛽</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Weniger Verbrauch</h3>
                <p className="text-gray-700">
                  Falsch eingestellte Räder erhöhen den Rollwiderstand. Optimierte Spur spart Kraftstoff.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Häufige Fragen zur Achsvermessung</h2>
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
                  <Link href="/services/raederwechsel" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Räderwechsel</Link>
                  <Link href="/services/reifenreparatur" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Reifenreparatur</Link>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Achsvermessung in deiner Stadt</h3>
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
            Achsvermessung durchführen lassen?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Finde Werkstätten mit moderner 3D-Vermessung in deiner Nähe
          </p>
          <Link
            href="/?service=ALIGNMENT_BOTH"
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
