'use client'

/**
 * ADMIN DASHBOARD
 * 
 * 🔧 ENTWICKLER-HINWEIS:
 * Beim Hinzufügen einer neuen Admin-Anwendung, bitte folgende Checkliste beachten:
 * 📋 Siehe: .github/NEW_ADMIN_APPLICATION_CHECKLIST.md
 * 
 * Wichtigste Schritte:
 * 1. Datenbankeintrag in Application-Tabelle
 * 2. Route in middleware.ts registrieren (ROUTE_TO_APPLICATION_MAP)
 * 3. Optional: PermissionGuard in Seite einbauen
 * 4. Deployment mit npm build & PM2 restart
 * 5. Berechtigungen über HR → Anwendungsverwaltung vergeben
 */

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import EmployeeAdminTiles from '@/components/EmployeeAdminTiles'

interface DashboardStats {
  totalCustomers: number
  totalWorkshops: number
  totalOffers: number
  acceptedOffers: number
  monthlyRevenue: number
  monthlyCommission: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalWorkshops: 0,
    totalOffers: 0,
    acceptedOffers: 0,
    monthlyRevenue: 0,
    monthlyCommission: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // ADMIN und B24_EMPLOYEE dürfen ins Admin-Dashboard
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (response.ok) {
        console.log('Stats loaded:', data)
        setStats(data)
      } else {
        console.error('Failed to fetch stats:', data)
        alert('Fehler beim Laden der Statistiken: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      alert('Fehler beim Laden der Statistiken')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin-Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">Bereifung24 Administration</p>
            </div>
            <button
              onClick={async () => {
                await signOut({ redirect: false })
                window.location.href = '/login'
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registrierte Kunden</p>
                <p className="mt-2 text-3xl font-bold text-primary-600">
                  {loading ? '...' : stats.totalCustomers}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registrierte Werkstätten</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {loading ? '...' : stats.totalWorkshops}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Erstellte Angebote</p>
                <p className="mt-2 text-3xl font-bold text-purple-600">
                  {loading ? '...' : stats.totalOffers}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Angenommene Angebote</p>
                <p className="mt-2 text-3xl font-bold text-indigo-600">
                  {loading ? '...' : stats.acceptedOffers}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Umsatz lfd. Monat</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {loading ? '...' : `${stats.monthlyRevenue.toFixed(2)} €`}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Provision lfd. Monat</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {loading ? '...' : `${stats.monthlyCommission.toFixed(2)} €`}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <EmployeeAdminTiles />

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Letzte Aktivitäten</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">Noch keine Aktivitäten vorhanden</p>
          </div>
        </div>
      </main>
    </div>
  )
}
