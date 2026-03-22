import Link from 'next/link'
import { Check, ArrowLeft, Search } from 'lucide-react'

export const metadata = {
  title: 'Reifenreparatur - Bereifung24',
  description: 'Professionelle Reifenreparatur - Schnell und günstig Reifen flicken bei Nagel oder Fremdkörper. Ventilschaden beheben.'
}

const faqData = [
  { question: 'Kann jeder Reifenschaden repariert werden?', answer: 'Nein. Nur Schäden in der Lauffläche können repariert werden. Seitenwandschäden, Risse oder Beulen erfordern einen Reifentausch. Die Werkstatt prüft, ob eine Reparatur möglich ist.' },
  { question: 'Was kostet eine Reifenreparatur?', answer: 'Eine einfache Fremdkörper-Reparatur (Nagel, Schraube) kostet zwischen 15-35€ pro Reifen. Ein Ventiltausch liegt bei 5-15€.' },
  { question: 'Wie lange hält eine Reifenreparatur?', answer: 'Eine fachgerecht durchgeführte Reparatur hält in der Regel für die restliche Lebensdauer des Reifens. Professionelle Werkstätten geben 2 Jahre Garantie.' },
  { question: 'Darf ich mit einem reparierten Reifen auf die Autobahn?', answer: 'Ja, eine professionell reparierte Reifenpanne ist verkehrssicher und für alle Geschwindigkeiten zugelassen, sofern die Reparatur fachgerecht nach Industriestandards durchgeführt wurde.' },
]

export default function ReifenreparaturPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://www.bereifung24.de' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://www.bereifung24.de/services' },
        { '@type': 'ListItem', position: 3, name: 'Reifenreparatur', item: 'https://www.bereifung24.de/services/reifenreparatur' },
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
            <div className="text-6xl mb-6">🔧</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Reifenreparatur
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Schnelle und professionelle Reparatur bei Reifenschäden
            </p>
            <Link
              href="/?service=TIRE_REPAIR"
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
              Wann kann ein Reifen repariert werden?
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Nicht jeder Reifenschaden kann repariert werden. Eine Reparatur ist nur möglich wenn:
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-3">✅ Reparatur möglich</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Einstich in der Lauffläche (Mitte)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Durchmesser max. 6mm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Profiltiefe noch ausreichend (&gt;3mm)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Seitenwand unbeschädigt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-gray-700">Kein Notlauf nach Plattreifen</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-3">❌ Reparatur NICHT möglich</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">×</span>
                    <span className="text-gray-700">Schaden in der Seitenwand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">×</span>
                    <span className="text-gray-700">Mehrere Einstiche</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">×</span>
                    <span className="text-gray-700">Riss oder Schnitt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">×</span>
                    <span className="text-gray-700">Loch größer als 6mm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">×</span>
                    <span className="text-gray-700">Zu wenig Profil (&lt;3mm)</span>
                  </li>
                </ul>
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
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border-2 border-primary-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fremdkörper-Reparatur</h3>
                <p className="text-gray-700 mb-4">
                  Professionelle Reparatur von Reifenschäden durch Fremdkörper wie Nägel oder Schrauben
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Demontage des Reifens von der Felge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Genaue Schadensanalyse von innen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Reparatur mit Vulkanisier-Verfahren</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Kombipflaster von innen (Pilz-Methode)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Montage, Auswuchten und Prüfung</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Dichtheitsprüfung nach Reparatur</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Standard-Methode:</strong> Die Kombipflaster-Reparatur ist die sicherste Methode und entspricht allen Standards. Dauer: ca. 30-45 Minuten.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Ventilschaden</h3>
                <p className="text-gray-700 mb-4">
                  Austausch oder Reparatur defekter oder undichter Ventile
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Prüfung des Ventils auf Dichtheit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Austausch des kompletten Ventils</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Auswuchten nach Demontage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Neue Ventilkappe</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ Hinweis:</strong> Bei RDKS-Sensoren (Reifendruckkontrolle) ist der Austausch aufwendiger und teurer, da spezielle Sensoren verbaut sind.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Wichtige Informationen
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">🏁</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Geschwindigkeitsbeschränkung</h3>
                <p className="text-gray-700">
                  Nach einer Reparatur wird empfohlen, max. 130 km/h zu fahren. Manche Versicherungen verlangen dies sogar. Informieren Sie sich bei Ihrer Versicherung.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Kosten-Nutzen-Abwägung</h3>
                <p className="text-gray-700">
                  Eine Reparatur kostet ca. 20-40€. Bei alten Reifen mit wenig Profil lohnt sich oft der Kauf eines neuen Reifens mehr. Die Werkstatt berät Sie dazu.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Nicht für Notlaufreifen</h3>
                <p className="text-gray-700">
                  Runflat-Reifen (notlauftauglich) dürfen nach Hersteller-Vorgaben NICHT repariert werden, sondern müssen komplett ersetzt werden.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Garantie auf Reparatur</h3>
                <p className="text-gray-700">
                  Professionelle Werkstätten geben in der Regel 2 Jahre Garantie auf die Reparatur. Wichtig ist die fachgerechte Ausführung nach Industrie-Standards.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Häufige Fragen zur Reifenreparatur</h2>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Reifenreparatur in deiner Stadt</h3>
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

      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Reifenschaden beheben lassen?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Finde jetzt eine Werkstatt in deiner Nähe für die Reparatur
          </p>
          <Link
            href="/?service=TIRE_REPAIR"
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
