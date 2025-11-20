'use client'

import Link from 'next/link'

export default function AlignmentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/dashboard/customer/select-service"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Service-Auswahl
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-6">⚙️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Achsvermessung</h1>
          <p className="text-xl text-gray-600 mb-8">
            Diese Funktion befindet sich derzeit in der Entwicklung und wird in Kürze verfügbar sein.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Was Sie hier bald machen können:</h3>
            <ul className="text-left text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Achsvermessung anfragen</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Fahrwerkseinstellung durchführen lassen</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Angebote von Werkstätten mit Vermessungstechnik erhalten</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Termine vereinbaren</span>
              </li>
            </ul>
          </div>

          <Link
            href="/dashboard/customer/select-service"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Zurück zur Service-Auswahl
          </Link>
        </div>
      </div>
    </div>
  )
}
