import Link from 'next/link'
import { Check, ArrowLeft, Search, AlertTriangle, Snowflake } from 'lucide-react'

export const metadata = {
  title: 'Klimaservice - Klimaanlage warten & befüllen - Bereifung24',
  description: 'Professioneller Klimaservice: Inspektion, Desinfektion, Befüllung und Wartung deiner Auto-Klimaanlage. R134a und R1234yf.',
  alternates: { canonical: 'https://bereifung24.de/services/klimaservice' }
}

const faqData = [
  { question: 'Was kostet ein Klimaservice?', answer: 'Ein Klimaservice kostet je nach Umfang zwischen 50-200€. Ein einfacher Basis-Check liegt bei ca. 50€, eine vollständige Befüllung mit Kältemittel bei 100-200€ je nach Kältemitteltyp (R134a oder R1234yf).' },
  { question: 'Wie oft sollte die Klimaanlage gewartet werden?', answer: 'Die Klimaanlage sollte alle 2 Jahre gewartet werden. Jährlich gehen ca. 10% des Kältemittels verloren, daher ist regelmäßige Befüllung wichtig.' },
  { question: 'Warum riecht meine Klimaanlage unangenehm?', answer: 'Unangenehme Gerüche entstehen durch Bakterien und Pilze im Verdampfer. Eine professionelle Desinfektion beseitigt das Problem und verbessert die Luftqualität im Fahrzeug.' },
  { question: 'Was ist der Unterschied zwischen R134a und R1234yf?', answer: 'R1234yf ist das neuere, umweltfreundlichere Kältemittel (ab Baujahr 2017 vorgeschrieben). R134a wird bei älteren Fahrzeugen verwendet. R1234yf ist teurer, dafür klimaschonender.' },
]

export default function KlimaservicePage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://bereifung24.de' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://bereifung24.de/services' },
        { '@type': 'ListItem', position: 3, name: 'Klimaservice', item: 'https://bereifung24.de/services/klimaservice' },
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

      <section className="bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">❄️</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Klimaservice
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Wartung, Befüllung und Desinfektion deiner Auto-Klimaanlage
            </p>
            <Link
              href="/?service=CLIMATE_SERVICE"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-2xl"
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
              Warum ist Klimaservice wichtig?
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Eine Auto-Klimaanlage ist ein komplexes System, das <strong>regelmäßige Wartung</strong> benötigt. 
              Pro Jahr verliert sie etwa <strong>10-15% des Kältemittels</strong> durch natürliche Diffusion - selbst ohne Leck.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Nach 2-3 Jahren ohne Service ist die Kühlleistung oft deutlich geschwächt. Das führt nicht nur zu 
              schwacher Kühlung, sondern auch zu höherem Kraftstoffverbrauch und vorzeitigem Verschleiß des Klimakompressors.
            </p>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-orange-900 mb-2">Wann ist ein Klimaservice fällig?</h3>
                  <ul className="space-y-1 text-orange-900">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                      <span><strong>Alle 2 Jahre</strong> zur Wartung (Herstellerempfehlung)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                      <span>Klimaanlage kühlt nicht mehr richtig</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                      <span>Unangenehmer Geruch beim Einschalten</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                      <span>Beschlagene Scheiben im Sommer (Kondenswasser-Problem)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                      <span>Höherer Kraftstoffverbrauch durch ineffiziente Anlage</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3">So funktioniert eine Auto-Klimaanlage</h3>
              <p className="text-blue-900 mb-3">
                Die Klimaanlage arbeitet mit einem <strong>Kältemittelkreislauf</strong>:
              </p>
              <ol className="space-y-2 text-blue-900 list-decimal list-inside">
                <li><strong>Kompressor</strong> verdichtet das Kältemittel (erhöht Druck und Temperatur)</li>
                <li><strong>Kondensator</strong> (Verflüssiger) kühlt das heiße Gas zu flüssigem Kältemittel ab</li>
                <li><strong>Expansionsventil</strong> lässt das flüssige Kältemittel entspannen (Druckabfall)</li>
                <li><strong>Verdampfer</strong> entzieht der Innenraumluft Wärme (kalte Luft entsteht)</li>
              </ol>
              <p className="text-sm text-blue-800 mt-3">
                Zusätzlich enthält das System <strong>Kompressoröl</strong> zur Schmierung und einen 
                <strong> Trockner</strong> zur Feuchtigkeitsbindung.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Unsere Klimaservice-Pakete
            </h2>

            <div className="space-y-6">
              {/* Basis-Check */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Basis-Check</h3>
                    <p className="text-gray-600">
                      Schnelle Funktionsprüfung ohne Befüllung - ideal zur ersten Diagnose
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Dauer</div>
                    <div className="text-lg font-bold text-gray-900">15-20 Min</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">Sichtprüfung der Klimaanlage auf sichtbare Schäden</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">Funktionstest: Kühlt die Anlage?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">Druckmessung im Kältemittelkreislauf</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">Geruchsprüfung (Verdampfer verschmutzt?)</span>
                  </li>
                </ul>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ Hinweis:</strong> Beim Basis-Check wird <strong>kein Kältemittel nachgefüllt</strong>. 
                    Du erhältst eine Empfehlung, ob eine Befüllung oder Reparatur nötig ist.
                  </p>
                </div>
              </div>

              {/* Standard-Service */}
              <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Standard-Service</h3>
                    <p className="text-gray-600">
                      Funktionsprüfung und Nachfüllung von Kältemittel - für normale Wartung
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Dauer</div>
                    <div className="text-lg font-bold text-gray-900">30-45 Min</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">Alle Leistungen des Basis-Checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Nachfüllung von bis zu 100ml Kältemittel</strong> (R134a oder R1234yf)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">Nachfüllung von Kompressoröl (bei Bedarf)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">UV-Kontrastmittel zur Leckerkennung (optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-gray-700">Endkontrolle der Kühlleistung</span>
                  </li>
                </ul>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Ideal für:</strong> Fahrzeuge mit leichtem Kühlleistungsverlust nach 1-2 Jahren. 
                    Reicht meist für den normalen Kältemittelverlust.
                  </p>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-900">
                    <strong>💰 Zusatzkosten:</strong> Mehr als 100ml Kältemittel kostet extra (15-25€ pro 100ml). 
                    Werkstatt informiert dich vor dem Nachfüllen.
                  </p>
                </div>
              </div>

              {/* Komfort-Service */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      Komfort-Service
                      <span className="text-sm font-normal text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        Beliebt
                      </span>
                    </h3>
                    <p className="text-gray-700">
                      Erweiterte Wartung mit Innenraumfilter und Verdampfer-Reinigung
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Dauer</div>
                    <div className="text-lg font-bold text-gray-900">45-60 Min</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Alle Leistungen des Standard-Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Nachfüllung von bis zu 200ml Kältemittel</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Innenraumfilter-Wechsel</strong> (Pollenfilter/Aktivkohlefilter)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Verdampfer-Reinigung mit Schaum</strong> (entfernt Bakterien und Gerüche)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">UV-Kontrastmittel zur Lecksuche</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Desinfektionsmittel gegen Gerüche (Schaum-Methode)</span>
                  </li>
                </ul>

                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    <strong>✅ Empfohlen bei:</strong> Unangenehmen Gerüchen beim Einschalten, hoher Luftfeuchtigkeit 
                    im Auto oder wenn der Innenraumfilter länger als 1 Jahr nicht gewechselt wurde.
                  </p>
                </div>
              </div>

              {/* Premium-Service */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      Premium-Service
                      <span className="text-sm font-normal text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                        Komplett
                      </span>
                    </h3>
                    <p className="text-gray-700">
                      Vollständige Neubefüllung mit Ozon-Desinfektion und Premium-Filter
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Dauer</div>
                    <div className="text-lg font-bold text-gray-900">60-90 Min</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Alle Leistungen des Komfort-Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Komplette Neubefüllung (bis zu 500ml Kältemittel)</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Ozon-Desinfektion</strong> (tötet 99,9% aller Bakterien, Viren, Pilze)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700"><strong>Premium-Aktivkohlefilter</strong> mit mehrlagiger Filterung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">UV-Additiv zur Leckage-Erkennung (langfristig sichtbar)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Dichtigkeitsprüfung mit Vakuum-Test</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-gray-700">Detailliertes Service-Protokoll</span>
                  </li>
                </ul>

                <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                  <p className="text-sm text-purple-900">
                    <strong>🌟 Perfekt für:</strong> Fahrzeuge, bei denen die Klimaanlage seit 3+ Jahren nicht gewartet wurde, 
                    Allergiker (Ozon tötet alle Allergene ab) oder bei sehr starken Gerüchen.
                  </p>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">Was ist Ozon-Desinfektion?</h4>
                  <p className="text-sm text-blue-900">
                    Bei der Ozon-Behandlung wird hochkonzentriertes Ozon (O₃) in den Innenraum eingeleitet. 
                    Das Ozon dringt in alle Spalten und Hohlräume ein und oxidiert Bakterien, Viren, Schimmel und Geruchsmoleküle. 
                    Nach 20-30 Minuten Einwirkzeit wird das Ozon belüftet - zurück bleibt ein <strong>zu 99,9% keimfreier Innenraum</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kältemittel-Arten */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Kältemittel: R134a vs. R1234yf
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">R134a (altes Kältemittel)</h3>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                    <span className="text-gray-700">In Fahrzeugen bis etwa 2017</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                    <span className="text-gray-700">Günstiger (ca. 15€ pro 100ml)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                    <span className="text-gray-700">Nicht mehr in neuen Fahrzeugen erlaubt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                    <span className="text-gray-700">Hoher GWP (Treibhauseffekt)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-300">
                <h3 className="text-xl font-bold text-gray-900 mb-3">R1234yf (neues Kältemittel)</h3>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">In Fahrzeugen ab etwa 2017</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Teurer (ca. 25€ pro 100ml)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">EU-Pflicht seit 2017 (umweltfreundlich)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Niedriger GWP (klimafreundlich)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Welches Kältemittel hat mein Auto?</h3>
              <p className="text-blue-900 mb-3">
                Das steht auf einem Aufkleber im Motorraum - meist auf der Innenseite der Motorhaube oder 
                am Kühler. Die Werkstatt prüft das vor dem Service.
              </p>
              <p className="text-sm text-blue-800">
                <strong>⚠️ Wichtig:</strong> R134a und R1234yf dürfen NIEMALS gemischt werden! Das würde die 
                komplette Klimaanlage zerstören.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wichtige Hinweise */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Wichtige Hinweise zum Klimaservice
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Snowflake className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Regelmäßige Wartung</h3>
                <p className="text-gray-700">
                  Klimaanlagen sollten <strong>alle 2 Jahre</strong> gewartet werden - auch wenn sie noch kühlen. 
                  Das verlängert die Lebensdauer des Kompressors und verhindert teure Reparaturen.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Lecksuche</h3>
                <p className="text-gray-700">
                  Verliert die Klimaanlage <strong>mehr als 15% Kältemittel pro Jahr</strong>, liegt ein Leck vor. 
                  UV-Kontrastmittel macht Leckagen unter UV-Licht sichtbar. Erst Leck reparieren, dann befüllen!
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🌡️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Auch im Winter nutzen</h3>
                <p className="text-gray-700">
                  Schalte die Klimaanlage <strong>1x pro Monat für 10 Minuten</strong> ein - auch im Winter. 
                  Das hält die Dichtungen geschmeidig und verhindert, dass der Kompressor festsitzt.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Kostenersparnis</h3>
                <p className="text-gray-700">
                  Ein rechtzeitiger Klimaservice kostet 80-150€. Ein defekter Kompressor durch fehlende Wartung 
                  kostet <strong>800-1.500€</strong>. Regelmäßige Wartung lohnt sich!
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🦠</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Gesundheit</h3>
                <p className="text-gray-700">
                  Verschmutzte Verdampfer sind ideale Brutstätten für Bakterien, Schimmel und Allergene. 
                  Regelmäßige Desinfektion schützt deine Gesundheit - besonders wichtig für Allergiker!
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Effizienz</h3>
                <p className="text-gray-700">
                  Eine gut gewartete Klimaanlage verbraucht <strong>bis zu 20% weniger Kraftstoff</strong> 
                  als eine ungepflegte. Bei Langstrecken im Sommer spart das richtig Geld!
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Häufige Fragen zum Klimaservice</h2>
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
                  <Link href="/services/motorradreifen" className="px-4 py-2 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-sm font-medium text-gray-700 transition-colors">Motorradreifen</Link>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Klimaservice in deiner Stadt</h3>
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
      <section className="py-20 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Klimaanlage warten lassen?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Finde Werkstätten mit professioneller Klimaservice-Ausrüstung in deiner Nähe
          </p>
          <Link
            href="/?service=CLIMATE_SERVICE"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-2xl"
          >
            <Search className="w-5 h-5" />
            Jetzt Werkstatt finden
          </Link>
        </div>
      </section>
    </div>
  )
}
