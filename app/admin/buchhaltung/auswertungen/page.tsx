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
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* GmbH Bilanzierung Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white py-1 px-3 rounded-full">
              GmbH Bilanzierung
            </span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Link
              href="/admin/buchhaltung/bilanz"
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 hover:shadow-xl transition-all border-2 border-blue-200"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">Bilanz</h3>
              <p className="text-xs text-gray-600 text-center">Aktiva & Passiva</p>
            </Link>

            <Link
              href="/admin/buchhaltung/guv"
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4 hover:shadow-xl transition-all border-2 border-green-200"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">GuV</h3>
              <p className="text-xs text-gray-600 text-center">Gewinn & Verlust</p>
            </Link>

            <Link
              href="/admin/buchhaltung/anlagen"
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 hover:shadow-xl transition-all border-2 border-purple-200"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-lg mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">Anlagen</h3>
              <p className="text-xs text-gray-600 text-center">Abschreibungen</p>
            </Link>

            <Link
              href="/admin/buchhaltung/rueckstellungen"
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-4 hover:shadow-xl transition-all border-2 border-orange-200"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-orange-600 rounded-lg mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">Rückstellungen</h3>
              <p className="text-xs text-gray-600 text-center">Provisionen</p>
            </Link>

            <Link
              href="/admin/buchhaltung/jahresabschluss"
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-4 hover:shadow-xl transition-all border-2 border-red-200"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">Jahresabschluss</h3>
              <p className="text-xs text-gray-600 text-center">Abschluss-Wizard</p>
            </Link>
          </div>
        </div>

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

            {/* Summen & Salden */}
            <Link href="/admin/buchhaltung/auswertungen/summen-salden">

              <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-500 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-semibold text-gray-900 mb-2">💰 Summen- und Saldenliste</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Übersicht aller Konten mit Anfangsbestand, Umsätzen und Endbestand
                </p>
                <div className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md text-sm text-center font-medium">
                  Bericht öffnen →
                </div>
              </div>
            </Link>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📊 Weitere Berichte & Auswertungen</h4>
            <p className="text-sm text-blue-800 mb-2">
              Zusätzlich zu BWA und Summen- & Saldenliste stehen Ihnen folgende Auswertungen zur Verfügung:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><Link href="/admin/buchhaltung/bilanz" className="hover:underline">Bilanz</Link> - Vermögensübersicht nach §266 HGB</li>
              <li><Link href="/admin/buchhaltung/guv" className="hover:underline">GuV</Link> - Gewinn- und Verlustrechnung nach §275 HGB</li>
              <li><Link href="/admin/buchhaltung/journal" className="hover:underline">Journal</Link> - Chronologische Buchungsübersicht</li>
              <li><Link href="/admin/buchhaltung/kontenplan" className="hover:underline">Kontenplan</Link> - SKR04 Kontenrahmen</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
