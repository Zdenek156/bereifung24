'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import { useRoleBasedUrl } from '@/lib/utils/roleBasedUrl'
import { PermissionGuard } from '@/components/PermissionGuard'

interface AccountingStats {
  totalRevenue: number
  totalExpenses: number
  totalProfit: number
  entryCount: number
  accountCount: number
  lastEntryDate: string | null
}

export default function BuchhaltungPage() {
  const router = useRouter()
  const getUrl = useRoleBasedUrl()
  const [stats, setStats] = useState<AccountingStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    entryCount: 0,
    accountCount: 0,
    lastEntryDate: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/accounting/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching accounting stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PermissionGuard applicationKey="buchhaltung">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2">
                  <BackButton />
                </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Buchhaltung
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                SKR04 Kontenrahmen | GoBD-konform
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Erlöse (Gesamt)</p>
                <p className="mt-2 text-2xl font-bold text-green-600">
                  {loading ? '...' : `${stats.totalRevenue.toFixed(2)} €`}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aufwendungen (Gesamt)</p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {loading ? '...' : `${stats.totalExpenses.toFixed(2)} €`}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gewinn/Verlust</p>
                <p className={`mt-2 text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {loading ? '...' : `${stats.totalProfit.toFixed(2)} €`}
                </p>
              </div>
              <div className={`w-12 h-12 ${stats.totalProfit >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-lg flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${stats.totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Buchungseinträge</p>
                <p className="mt-2 text-2xl font-bold text-purple-600">
                  {loading ? '...' : stats.entryCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.accountCount} Konten aktiv
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Accounting Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm font-semibold text-gray-600">
              Laufende Buchhaltung
            </span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link
              href={getUrl('/admin/buchhaltung/journal')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Journalbuch</h3>
              <p className="text-sm text-gray-600 mb-4">Alle Buchungseinträge chronologisch ansehen</p>
              <div className="text-primary-600 font-medium">Zum Journal →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/kontenplan')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kontenplan (SKR04)</h3>
              <p className="text-sm text-gray-600 mb-4">Kontenrahmen verwalten und anpassen</p>
              <div className="text-primary-600 font-medium">Zu den Konten →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/manuelle-buchung')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-2 border-green-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manuelle Buchung</h3>
              <p className="text-sm text-gray-600 mb-4">Neuen Buchungseintrag erstellen</p>
              <div className="text-primary-600 font-medium">Buchung erstellen →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/belege')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Beleg-Verwaltung</h3>
              <p className="text-sm text-gray-600 mb-4">Rechnungen, Quittungen & Dokumente</p>
              <div className="text-primary-600 font-medium">Zu den Belegen →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/auswertungen')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Auswertungen</h3>
              <p className="text-sm text-gray-600 mb-4">BWA, Summen & Salden</p>
              <div className="text-primary-600 font-medium">Zu den Reports →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/auswertungen/ustva')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-2 border-purple-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">UStVA</h3>
              <p className="text-sm text-gray-600 mb-4">Umsatzsteuer-Voranmeldung</p>
              <div className="text-primary-600 font-medium">Zur Voranmeldung →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/einstellungen')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Einstellungen</h3>
              <p className="text-sm text-gray-600 mb-4">USt-Sätze, Steuerberater & Konfiguration</p>
              <div className="text-primary-600 font-medium">Einstellungen →</div>
            </Link>
          </div>
        </div>

        {/* Bilanzierung Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm font-semibold text-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-1 px-3 rounded-full">
              Bilanzierung
            </span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
            <Link
              href={getUrl('/admin/buchhaltung/bilanz')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 hover:shadow-xl transition-all border-2 border-blue-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bilanz</h3>
              <p className="text-sm text-gray-600 mb-4">Aktiva & Passiva (§266 HGB)</p>
              <div className="text-blue-700 font-medium">Zur Bilanz →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/guv')}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 hover:shadow-xl transition-all border-2 border-green-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">GuV</h3>
              <p className="text-sm text-gray-600 mb-4">Gewinn- und Verlustrechnung (§275 HGB)</p>
              <div className="text-green-700 font-medium">Zur GuV →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/anlagen')}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 hover:shadow-xl transition-all border-2 border-purple-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Anlagen</h3>
              <p className="text-sm text-gray-600 mb-4">Anlagevermögen & Abschreibungen</p>
              <div className="text-purple-700 font-medium">Zu den Anlagen →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/rueckstellungen')}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6 hover:shadow-xl transition-all border-2 border-orange-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-orange-600 rounded-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rückstellungen</h3>
              <p className="text-sm text-gray-600 mb-4">Provisionen & Rücklagen (§249 HGB)</p>
              <div className="text-orange-700 font-medium">Zu den Rückstellungen →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/jahresabschluss')}
              className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 hover:shadow-xl transition-all border-2 border-red-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Jahresabschluss</h3>
              <p className="text-sm text-gray-600 mb-4">Abschluss-Wizard & Bilanzprüfung</p>
              <div className="text-red-700 font-medium">Zum Abschluss →</div>
            </Link>

            <Link
              href={getUrl('/admin/buchhaltung/steuerberater')}
              className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow p-6 hover:shadow-xl transition-all border-2 border-indigo-200"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-lg mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Steuerberater</h3>
              <p className="text-sm text-gray-600 mb-4">Dokumente versenden & Kontaktdaten</p>
              <div className="text-indigo-700 font-medium">Zur Kommunikation →</div>
            </Link>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">GoBD-konforme Buchhaltung</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Dieses System verwendet den SKR04-Kontenrahmen und erfüllt die Anforderungen der GoBD 
                  (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und 
                  Unterlagen in elektronischer Form sowie zum Datenzugriff).
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>10 Jahre Aufbewahrungspflicht</li>
                  <li>Unveränderbare Buchungseinträge (nach Freigabe gesperrt)</li>
                  <li>Vollständige Audit-Trail-Protokollierung</li>
                  <li>Storno-Funktion statt Löschung</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </PermissionGuard>
  )
}
