import Link from 'next/link'
import { Check, ArrowLeft, Search } from 'lucide-react'

export const metadata = {
  title: 'Reifenreparatur - Bereifung24',
  description: 'Professionelle Reifenreparatur - Schnell und günstig Reifen flicken bei Nagel oder Fremdkörper. Ventilschaden beheben.'
}

export default function ReifenreparaturPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-primary-600 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-primary-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Zurück zur Startseite
          </Link>
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
