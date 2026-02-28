import Link from 'next/link'
import { Check, ArrowLeft, Search } from 'lucide-react'

export const metadata = {
  title: 'Räderwechsel - Bereifung24',
  description: 'Professioneller Räderwechsel von Sommer- auf Winterreifen. Schnell, günstig und unkompliziert bei geprüften Werkstätten buchen.'
}

export default function RaederwechselPage() {
  return (
    <div className="min-h-screen bg-white">
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
            </div>
          </div>
        </div>
      </section>

      {/* Wichtige Hinweise */}
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
