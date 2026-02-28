import Link from 'next/link'
import { Check, ArrowLeft, Search } from 'lucide-react'

export const metadata = {
  title: 'Reifenwechsel - Bereifung24',
  description: 'Professioneller Reifenwechsel - Reifen montieren und demontieren. Neue Reifen aufziehen oder alte Reifen wechseln.'
}

export default function ReifenwechselPage() {
  return (
    <div className="min-h-screen bg-white">
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
            <div className="text-6xl mb-6">🚗</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Reifenwechsel
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Reifen von Felgen de- und montieren - für neue oder gewechselte Reifen
            </p>
            <Link
              href="/?service=TIRE_CHANGE"
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
              Was ist ein Reifenwechsel?
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Beim Reifenwechsel werden die Reifen von den Felgen demontiert und neue bzw. andere Reifen aufgezogen. Dies ist notwendig, wenn:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Sie neue Reifen kaufen und aufziehen lassen möchten</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Sie nur einen Satz Felgen besitzen (z.B. Alufelgen)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Die Reifen beschädigt oder abgefahren sind</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary-600 mt-1" />
                <span className="text-gray-700">Sie auf andere Reifendimensionen wechseln möchten</span>
              </li>
            </ul>
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
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">2 Reifen wechseln</h3>
                <p className="text-gray-700 mb-4">
                  Wechsel von 2 Reifen (z.B. nur Vorderachse oder Hinterachse)
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Demontage der alten Reifen von den Felgen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Montage der neuen Reifen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Auswuchten der Räder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Montage am Fahrzeug</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Luftdruckeinstellung</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border-2 border-primary-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">4 Reifen wechseln (komplett)</h3>
                <p className="text-gray-700 mb-4">
                  Kompletter Reifenwechsel für alle 4 Räder
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Demontage aller 4 alten Reifen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Montage aller 4 neuen Reifen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Computergestütztes Auswuchten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Neue Ventile (empfohlen)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Montage und Anzug mit Drehmoment</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Tipp:</strong> Bei komplettem Reifenwechsel sollten immer neue Ventile montiert werden!
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mit Entsorgung</h3>
                <p className="text-gray-700 mb-4">
                  Fachgerechte Entsorgung der alten Reifen inklusive
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Umweltgerechte Entsorgung nach Vorgaben</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Recycling der Altreifen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">Kein Transport der Altreifen nötig</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-orange-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Runflat-Reifen</h3>
                <p className="text-gray-700 mb-4">
                  Spezial-Service für Runflat-Reifen (notlauftauglich, ohne Notrad)
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-orange-600 mt-0.5" />
                    <span className="text-gray-700">Spezielle Montagetechnik erforderlich</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-orange-600 mt-0.5" />
                    <span className="text-gray-700">Verstärkte Seitenwände - schwerer zu montieren</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-orange-600 mt-0.5" />
                    <span className="text-gray-700">Spezialwerkzeug und Erfahrung nötig</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-orange-600 mt-0.5" />
                    <span className="text-gray-700">Aufpreis aufgrund höherem Aufwand</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-900">
                    <strong>⚠️ Wichtig:</strong> Nicht alle Werkstätten bieten Runflat-Service an. Bitte beim Buchen beachten!
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
              Wichtige Hinweise
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">🔧</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Neue Ventile empfohlen</h3>
                <p className="text-gray-700">
                  Beim Reifenwechsel sollten immer neue Ventile montiert werden. Alte Ventile können porös werden und Luft verlieren. Kosten: ca. 2-5€ pro Ventil.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">⚖️</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Auswuchten inklusive</h3>
                <p className="text-gray-700">
                  Nach der Montage wird jeder Reifen computergestützt ausgewuchtet. Dies verhindert Vibrationen und sorgt für gleichmäßigen Verschleiß.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">📏</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Reifenfreigabe prüfen</h3>
                <p className="text-gray-700">
                  Nicht jeder Reifen passt auf jedes Fahrzeug. Die Werkstatt prüft die Reifenfreigabe in den Fahrzeugpapieren vor der Montage.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">RDKS-Programmierung</h3>
                <p className="text-gray-700">
                  Bei Fahrzeugen mit Reifendruckkontrollsystem (RDKS) müssen die Sensoren nach dem Reifenwechsel neu angelernt werden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Neue Reifen benötigt?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Finde jetzt die passende Werkstatt für deinen Reifenwechsel
          </p>
          <Link
            href="/?service=TIRE_CHANGE"
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
