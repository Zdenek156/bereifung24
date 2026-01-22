'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NewsFeed from '@/components/NewsFeed'
import AnnouncementsFeed from '@/components/AnnouncementsFeed'
import EmployeeAdminTiles from '@/components/EmployeeAdminTiles'

interface DashboardStats {
  leaveBalance?: {
    remaining: number
    used: number
    total: number
  }
  newDocuments: number
  pendingTasks: number
  overtimeHours?: number
  unreadEmails: number
  totalCustomers: number
  totalWorkshops: number
  totalCommissions: number
  notActivatedWorkshops: number
}

export default function MitarbeiterDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<DashboardStats>({
    newDocuments: 0,
    pendingTasks: 0,
    unreadEmails: 0,
    totalCustomers: 0,
    totalWorkshops: 0,
    totalCommissions: 0,
    notActivatedWorkshops: 0
  })
  const [loading, setLoading] = useState(true)
  const [showNewsfeed, setShowNewsfeed] = useState(true)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  useEffect(() => {
    // Check for permission error from URL params
    const error = searchParams.get('error')
    const module = searchParams.get('module')
    
    if (error === 'no-permission' && module) {
      setPermissionError(module)
      // Clear URL params after showing error
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        url.searchParams.delete('module')
        window.history.replaceState({}, '', url)
      }, 100)
    }
  }, [searchParams])

  useEffect(() => {
    // Load newsfeed preference from localStorage
    const saved = localStorage.getItem('mitarbeiter_show_newsfeed')
    if (saved !== null) {
      setShowNewsfeed(saved === 'true')
    }
  }, [])

  const toggleNewsfeed = () => {
    const newValue = !showNewsfeed
    setShowNewsfeed(newValue)
    localStorage.setItem('mitarbeiter_show_newsfeed', String(newValue))
  }

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchStats()
    }
  }, [status, session, router])

  const fetchStats = async () => {
    try {
      // Trigger email sync before fetching stats
      try {
        await fetch('/api/email/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: 'INBOX', limit: 50 })
        })
      } catch (syncError) {
        // Continue even if sync fails
        console.error('Email sync failed:', syncError)
      }

      // Fetch dashboard stats
      const res = await fetch('/api/employee/dashboard/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Lade Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Permission Error Banner */}
      {permissionError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Zugriff verweigert
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Sie haben keine Berechtigung für das Modul <strong className="font-semibold">{permissionError}</strong>.
                  Wenden Sie sich an Ihren Administrator, wenn Sie Zugriff benötigen.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setPermissionError(null)}
                  className="text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen im Mitarbeiter-Portal!
        </h1>
        <p className="mt-2 text-gray-600">
          Hallo {session?.user?.email}, schön dass Sie da sind.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {/* Neue E-Mails */}
        <Link href="/mitarbeiter/email" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📧</span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 truncate">Neue E-Mails</p>
              <p className="text-xl font-bold text-gray-900">{stats.unreadEmails}</p>
              <p className="text-xs text-gray-500 truncate">Ungelesen</p>
            </div>
          </div>
        </Link>

        {/* Nicht freigeschaltete Werkstätten */}
        <Link href="/admin/workshops?filter=not-activated" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 truncate">Nicht freigeschaltet</p>
              <p className="text-xl font-bold text-gray-900">{stats.notActivatedWorkshops}</p>
              <p className="text-xs text-gray-500 truncate">Werkstätten</p>
            </div>
          </div>
        </Link>

        {/* Offene Aufgaben */}
        <Link href="/mitarbeiter/aufgaben" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✓</span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 truncate">Offene Aufgaben</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingTasks}</p>
              <p className="text-xs text-gray-500 truncate">Zu erledigen</p>
            </div>
          </div>
        </Link>

        {/* Anzahl Kunden */}
        <Link href="/admin/customers" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 truncate">Anzahl Kunden</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500 truncate">Registriert</p>
            </div>
          </div>
        </Link>

        {/* Anzahl Werkstätten */}
        <Link href="/admin/workshops" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🔧</span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 truncate">Anzahl Werkstätten</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalWorkshops}</p>
              <p className="text-xs text-gray-500 truncate">Registriert</p>
            </div>
          </div>
        </Link>

        {/* Provision */}
        <Link href="/admin/commissions" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 truncate">Provision</p>
              <p className="text-xl font-bold text-gray-900 truncate">{stats.totalCommissions.toFixed(2)} €</p>
              <p className="text-xs text-gray-500 truncate">Ausstehend</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Schwarzes Brett */}
      <div className="mb-8">
        <AnnouncementsFeed />
      </div>

      {/* News Feed Stripe */}
      {showNewsfeed && (
        <div className="mb-8 relative">
          <button
            onClick={toggleNewsfeed}
            className="absolute top-2 right-2 z-10 p-2 bg-white rounded-lg shadow hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
            title="Newsfeed ausblenden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <NewsFeed />
        </div>
      )}
      
      {!showNewsfeed && (
        <div className="mb-8">
          <button
            onClick={toggleNewsfeed}
            className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Newsfeed einblenden
          </button>
        </div>
      )}

      {/* Anwendungen mit Zugriffsrechten */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Anwendungen</h2>
          <p className="text-sm text-gray-600 mt-1">Basierend auf Ihren Zugriffsrechten</p>
        </div>
        <EmployeeAdminTiles />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Willkommen im Mitarbeiter-Portal!</h3>
            <div className="mt-2 text-sm text-blue-800">
              <p>
                Nutzen Sie das Menü links, um auf Ihre persönlichen Bereiche wie Profil, Dokumente, Urlaub und mehr zuzugreifen.
                Die Admin-Bereiche oben werden basierend auf Ihren Zugriffsrechten angezeigt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
