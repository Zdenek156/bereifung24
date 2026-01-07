'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function ExportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href="/admin/buchhaltung" 
            className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
          >
            ← Zurück zur Buchhaltung
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Datenexport</h1>
          <p className="mt-1 text-sm text-gray-600">DATEV, Excel oder PDF exportieren</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Datenexport</h2>
          <p className="text-gray-600 mb-6">
            Exportieren Sie Ihre Buchhaltungsdaten für Steuerberater oder zur Archivierung.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* DATEV Export */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">DATEV CSV</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Standard-Format für Steuerberater-Software
                </p>
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 py-2 px-4 rounded-md cursor-not-allowed text-sm"
                >
                  Kommt bald
                </button>
              </div>
            </div>

            {/* Excel Export */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Excel (XLSX)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tabellenformat für eigene Auswertungen
                </p>
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 py-2 px-4 rounded-md cursor-not-allowed text-sm"
                >
                  Kommt bald
                </button>
              </div>
            </div>

            {/* PDF Export */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-red-300 transition-colors">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">PDF Bericht</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Druckfertiger Jahresabschluss
                </p>
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 py-2 px-4 rounded-md cursor-not-allowed text-sm"
                >
                  Kommt bald
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Geplante Export-Features (Phase 8)</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>DATEV CSV-Export nach offiziellem Standard</li>
              <li>Excel-Export mit mehreren Tabellenblättern (Journal, Konten, EÜR, UStVA)</li>
              <li>PDF-Berichte mit Firmenlogo und Steuerberater-Daten</li>
              <li>Zeitraum-Auswahl (Monat, Quartal, Jahr, benutzerdefiniert)</li>
              <li>Direkter E-Mail-Versand an Steuerberater</li>
              <li>Export-Historie und Wiederholung</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
