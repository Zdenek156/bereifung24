'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
}

export default function MitarbeiterDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    newDocuments: 0,
    pendingTasks: 0,
    unreadEmails: 0,
    totalCustomers: 0,
    totalWorkshops: 0,
    totalCommissions: 0
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchStats()
    }
  }, [status, session, router])

  const handleManualSync = async () => {
    console.log('[Manual Sync] Starting manual email sync...')
    setSyncing(true)
    try {
      const syncRes = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'INBOX', limit: 50 })
      })
      
      if (syncRes.ok) {
        const syncData = await syncRes.json()
        console.log('[Manual Sync] Sync completed:', syncData)
        
        // Nach Sync Stats neu laden (mit Verzögerung für DB-Schreibvorgänge)
        console.log('[Manual Sync] Waiting 500ms for DB writes...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('[Manual Sync] Fetching updated stats...')
        const res = await fetch('/api/employee/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          console.log('[Manual Sync] Stats updated:', data)
          console.log('[Manual Sync] Previous unreadEmails:', stats.unreadEmails)
          console.log('[Manual Sync] New unreadEmails:', data.unreadEmails)
          setStats(data)
        } else {
          console.error('[Manual Sync] Failed to fetch stats:', res.status, await res.text())
        }
      } else {
        console.error('[Manual Sync] Sync failed:', syncRes.status, await syncRes.text())
      }
    } catch (error) {
      console.error('[Manual Sync] Error:', error)
    } finally {
      setSyncing(false)
      console.log('[Manual Sync] Completed')
    }
  }

  const fetchStats = async () => {
    try {
      console.log('[Dashboard] Starting email sync...')
      // Trigger email sync before fetching stats (warten auf Abschluss)
      try {
        const syncRes = await fetch('/api/email/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: 'INBOX', limit: 50 })
        })
        
        if (syncRes.ok) {
          const syncData = await syncRes.json()
          console.log('[Dashboard] Email sync completed successfully:', syncData)
          // Kleine Verzögerung, damit DB-Schreibvorgänge abgeschlossen sind
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          const errorText = await syncRes.text()
          console.log('[Dashboard] Email sync returned non-OK status:', syncRes.status, errorText)
        }
      } catch (syncError: any) {
        console.log('[Dashboard] Email sync failed (non-critical):', syncError.message)
        // Continue even if sync fails
      }

      console.log('[Dashboard] Fetching dashboard stats...')
      // Jetzt Stats abrufen (nach dem Sync)
      const res = await fetch('/api/employee/dashboard/stats')
      if (res.ok) {
        const data = await res.json()
        console.log('[Dashboard] Stats loaded:', data)
        setStats(data)
      } else {
        console.error('[Dashboard] Failed to fetch stats:', res.status, await res.text())
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching stats:', error)
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Willkommen im Mitarbeiter-Portal!
            </h1>
            <p className="mt-2 text-gray-600">
              Hallo {session?.user?.email}, schön dass Sie da sind.
            </p>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Synchronisiere...' : 'E-Mails synchronisieren'}
          </button>
        </div>
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

        {/* Neue Dokumente */}
        <Link href="/mitarbeiter/dokumente" className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 truncate">Neue Dokumente</p>
              <p className="text-xl font-bold text-gray-900">{stats.newDocuments}</p>
              <p className="text-xs text-gray-500 truncate">Ungelesen</p>
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
              <p className="text-xs text-gray-500 truncate">Gesamt</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Schwarzes Brett */}
      <div className="mb-8">
        <AnnouncementsFeed />
      </div>

      {/* News Feed Stripe */}
      <div className="mb-8">
        <NewsFeed />
      </div>

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
