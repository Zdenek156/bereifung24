'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SelectServicePage() {
  const router = useRouter()

  const services = [
    {
      id: 'tire-request',
      title: 'Autoreifen Anfrage mit Montage',
      description: 'Neue Reifen kaufen und montieren lassen',
      icon: '🚗',
      route: '/dashboard/customer/create-request/tires',
      available: true
    },
    {
      id: 'tire-change',
      title: 'Auto Räder umstecken (Sommer/Winter)',
      description: 'Saisonaler Räderwechsel ohne neue Reifen',
      icon: '🔄',
      route: '/dashboard/customer/create-request/wheel-change',
      available: true
    },
    {
      id: 'tire-repair',
      title: 'Reifenreparatur',
      description: 'z.B. Fremdkörper im Reifen',
      icon: '🔧',
      route: '/dashboard/customer/create-request/repair',
      available: true
    },
    {
      id: 'motorcycle',
      title: 'Motorradreifen Anfrage mit Montage',
      description: 'Neue Motorradreifen kaufen und montieren lassen',
      icon: '🏍️',
      route: '/dashboard/customer/create-request/motorcycle',
      available: true
    },
    {
      id: 'alignment',
      title: 'Achsvermessung',
      description: 'Fahrwerk einstellen und vermessen lassen',
      icon: '⚙️',
      route: '/dashboard/customer/create-request/alignment',
      available: true
    },
    {
      id: 'climate',
      title: 'Klimaservice',
      description: 'Klimaanlagen-Wartung, Desinfektion, Nachfüllen',
      icon: '❄️',
      route: '/dashboard/customer/create-request/climate',
      available: true
    },
    {
      id: 'brakes',
      title: 'Bremsen Service',
      description: 'Bremsbeläge und Bremsscheiben wechseln',
      icon: '🛑',
      route: '/dashboard/customer/create-request/brakes',
      available: true
    },
    {
      id: 'battery',
      title: 'Autobatterie Service',
      description: 'Batterie wechseln inkl. Registrierung',
      icon: '🔋',
      route: '/dashboard/customer/create-request/battery',
      available: true
    },
    {
      id: 'other-services',
      title: 'Sonstige Reifendienste',
      description: 'RDKS anlernen, Ventile tauschen, Räderwäsche, Reifen einlagern',
      icon: '🛠️',
      route: '/dashboard/customer/create-request/other-services',
      available: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard/customer"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welchen Service benötigen Sie?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Wählen Sie die passende Kategorie für Ihre Anfrage
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => router.push(service.route)}
              disabled={!service.available}
              className={`
                group relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition-all duration-300
                ${service.available 
                  ? 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md hover:scale-105 cursor-pointer' 
                  : 'border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="text-5xl mb-2 transition-transform duration-300 group-hover:scale-110">
                  {service.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {service.description}
                </p>

                {/* Arrow */}
                {service.available && (
                  <div className="mt-auto pt-1">
                    <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium group-hover:gap-3 transition-all">
                      Anfrage erstellen
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                )}

                {!service.available && (
                  <div className="mt-auto pt-1">
                    <span className="text-sm text-gray-400">
                      Demnächst verfügbar
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                So funktioniert's
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Wählen Sie den passenden Service aus</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Füllen Sie das Anfrageformular aus</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Erhalten Sie Angebote von Werkstätten in Ihrer Nähe</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Vergleichen Sie die Preise und wählen Sie das beste Angebot</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
