'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NewsFeed from '@/components/NewsFeed'
import AnnouncementsFeed from '@/components/AnnouncementsFeed'
import EmployeeAdminTiles from '@/components/EmployeeAdminTiles'

interface TimeSession {
  id: string
  startTime: string
  breaks: { id: string; startTime: string; endTime: string | null }[]
}

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
  newSupportRequests: number
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
    newSupportRequests: 0,
    totalCustomers: 0,
    totalWorkshops: 0,
    totalCommissions: 0,
    notActivatedWorkshops: 0
  })
  const [loading, setLoading] = useState(true)
  const [showNewsfeed, setShowNewsfeed] = useState(true)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  // Time tracking state
  const [activeSession, setActiveSession] = useState<TimeSession | null>(null)
  const [timeLoading, setTimeLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

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

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchStats()
      fetchTimeData()
    }
  }, [status, session, router])

  const fetchTimeData = async () => {
    try {
      const res = await fetch('/api/employee/time')
      if (res.ok) {
        const data = await res.json()
        setActiveSession(data.activeSession || null)
      }
    } catch (e) {
      console.error('Time fetch error:', e)
    }
  }

  const handleTimeAction = async (action: 'start' | 'stop' | 'break-start' | 'break-end') => {
    setTimeLoading(true)
    try {
      const res = await fetch('/api/employee/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        await fetchTimeData()
      }
    } catch (e) {
      console.error('Time action error:', e)
    } finally {
      setTimeLoading(false)
    }
  }

  const getActiveTime = (): string => {
    if (!activeSession) return '0:00:00'
    let totalMs = currentTime.getTime() - new Date(activeSession.startTime).getTime()
    // Subtract break time
    for (const b of activeSession.breaks) {
      const breakStart = new Date(b.startTime).getTime()
      const breakEnd = b.endTime ? new Date(b.endTime).getTime() : currentTime.getTime()
      totalMs -= (breakEnd - breakStart)
    }
    if (totalMs < 0) totalMs = 0
    const totalSec = Math.floor(totalMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const isOnBreak = activeSession?.breaks.some(b => !b.endTime) ?? false

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
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Willkommen im Mitarbeiter-Portal!
          </h1>
          <p className="mt-2 text-gray-600">
            Hallo {(`${(session?.user as any)?.firstName || ''} ${(session?.user as any)?.lastName || ''}`).trim() || session?.user?.email}, schön dass Sie da sind.
          </p>
        </div>

        {/* Compact Time Tracking Widget */}
        <div className="bg-white rounded-xl shadow border border-gray-200 px-4 py-3 flex items-center gap-4 min-w-[260px]">
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Arbeitszeit</span>
            <span className="text-2xl font-mono font-bold text-gray-800 leading-tight">
              {activeSession ? getActiveTime() : '--:--:--'}
            </span>
            {isOnBreak && (
              <span className="text-xs text-yellow-600 font-medium">Pause läuft</span>
            )}
            {activeSession && !isOnBreak && (
              <span className="text-xs text-green-600 font-medium">Aktiv</span>
            )}
            {!activeSession && (
              <span className="text-xs text-gray-400">Nicht gestartet</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!activeSession && (
              <button
                onClick={() => handleTimeAction('start')}
                disabled={timeLoading}
                className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 flex items-center justify-center text-white shadow transition-colors"
                title="Arbeit starten"
              >
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            )}
            {activeSession && !isOnBreak && (
              <>
                <button
                  onClick={() => handleTimeAction('break-start')}
                  disabled={timeLoading}
                  className="w-9 h-9 rounded-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center text-white shadow transition-colors"
                  title="Pause starten"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <button
                  onClick={() => handleTimeAction('stop')}
                  disabled={timeLoading}
                  className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 disabled:opacity-50 flex items-center justify-center text-white shadow transition-colors"
                  title="Feierabend"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
                </button>
              </>
            )}
            {activeSession && isOnBreak && (
              <button
                onClick={() => handleTimeAction('break-end')}
                disabled={timeLoading}
                className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 flex items-center justify-center text-white shadow transition-colors"
                title="Pause beenden"
              >
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            )}
            <Link
              href="/mitarbeiter/zeit"
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 shadow transition-colors"
              title="Zeiterfassung öffnen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {/* Neue E-Mails */}
        <Link href="/mitarbeiter/email" className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition-shadow">
          <p className="text-xs font-medium text-gray-600 text-center mb-2">Neue E-Mails</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📧</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.unreadEmails}</p>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">Ungelesen</p>
        </Link>

        {/* Neue Support-Anfragen */}
        <Link href="/admin/support?status=NEW" className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition-shadow">
          <p className="text-xs font-medium text-gray-600 text-center mb-2">Support-Anfragen</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🎫</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.newSupportRequests}</p>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">Neu</p>
        </Link>

        {/* Nicht freigeschaltete Werkstätten */}
        <Link href="/admin/workshops?filter=not-activated" className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition-shadow">
          <p className="text-xs font-medium text-gray-600 text-center mb-2">Nicht freigeschaltet</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⏳</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.notActivatedWorkshops}</p>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">Werkstätten</p>
        </Link>

        {/* Offene Aufgaben */}
        <Link href="/mitarbeiter/aufgaben" className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition-shadow">
          <p className="text-xs font-medium text-gray-600 text-center mb-2">Offene Aufgaben</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✓</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">Zu erledigen</p>
        </Link>

        {/* Anzahl Kunden */}
        <Link href="/admin/customers" className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition-shadow">
          <p className="text-xs font-medium text-gray-600 text-center mb-2">Anzahl Kunden</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">👥</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">Registriert</p>
        </Link>

        {/* Anzahl Werkstätten */}
        <Link href="/admin/workshops" className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition-shadow">
          <p className="text-xs font-medium text-gray-600 text-center mb-2">Anzahl Werkstätten</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🔧</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalWorkshops}</p>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">Registriert</p>
        </Link>

        {/* Provision */}
        <Link href="/admin/commissions" className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition-shadow">
          <p className="text-xs font-medium text-gray-600 text-center mb-2">Provision</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💰</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.totalCommissions.toFixed(2)} €</p>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">Aktueller Monat</p>
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
