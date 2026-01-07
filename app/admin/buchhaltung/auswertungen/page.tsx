'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function ReportsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Auswertungen</h1>
          <p className="mt-1 text-sm text-gray-600">BWA, GuV, Bilanz und Reports</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Auswertungen & Berichte</h2>
          <p className="text-gray-600 mb-6">
            Betriebswirtschaftliche Auswertungen und steuerrelevante Berichte für Ihr Unternehmen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* BWA */}
            <Link href="/admin/buchhaltung/auswertungen/bwa">
              <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-semibold text-gray-900 mb-2">📊 BWA (Betriebswirtschaftliche Auswertung)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Monatliche Übersicht über Einnahmen, Ausgaben und Gewinn nach Kontengruppen
                </p>
                <div className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm text-center font-medium">
                  Bericht öffnen →
                </div>
              </div>
            </Link>

            {/* EÜR */}
            <Link href="/admin/buchhaltung/auswertungen/euer">
              <div className="border border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-semibold text-gray-900 mb-2">📋 EÜR (Einnahmen-Überschuss-Rechnung)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Jahresabschluss für Kleinunternehmer und Freiberufler nach § 4 Abs. 3 EStG
                </p>
                <div className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm text-center font-medium">
                  Bericht öffnen →
                </div>
              </div>
            </Link>

            {/* UStVA */}
            <Link href="/admin/buchhaltung/auswertungen/ustva">
              <div className="border border-gray-200 rounded-lg p-6 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-semibold text-gray-900 mb-2">🧾 UStVA (Umsatzsteuer-Voranmeldung)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Monatliche oder quartalsweise Umsatzsteuer-Voranmeldung ans Finanzamt
                </p>
                <div className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm text-center font-medium">
                  Bericht öffnen →
                </div>
              </div>
            </Link>

            {/* Summen & Salden */}
            <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2">💰 Summen- und Saldenliste</h3>
              <p className="text-sm text-gray-600 mb-4">
                Übersicht aller Konten mit Anfangsbestand, Umsätzen und Endbestand
              </p>
              <button
                disabled
                className="w-full bg-gray-100 text-gray-400 py-2 px-4 rounded-md cursor-not-allowed text-sm"
              >
                Kommt in Phase 7
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🎯 Verfügbare Auswertungen</h4>
            <p className="text-sm text-blue-800 mb-2">
              Aktuell können Sie folgende Daten bereits einsehen:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><Link href="/admin/buchhaltung/journal" className="hover:underline">Journalbuch</Link> - Alle Buchungen chronologisch</li>
              <li><Link href="/admin/buchhaltung/kontenplan" className="hover:underline">Kontenplan</Link> - SKR04 Kontenübersicht</li>
              <li><Link href="/admin/buchhaltung" className="hover:underline">Dashboard</Link> - Kennzahlen (Einnahmen, Ausgaben, Gewinn)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
