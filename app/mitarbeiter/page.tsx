'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NewsFeed from '@/components/NewsFeed'
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
        {/* Neue E-Mails */}
        <Link href="/mitarbeiter/email" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📧</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Neue E-Mails</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unreadEmails}</p>
              <p className="text-xs text-gray-500 mt-1">Ungelesen</p>
            </div>
          </div>
        </Link>

        {/* Urlaubstage */}
        {stats.leaveBalance && (
          <Link href="/mitarbeiter/urlaub" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏖️</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Resturlaub</p>
                <p className="text-2xl font-bold text-gray-900">{stats.leaveBalance.remaining} Tage</p>
                <p className="text-xs text-gray-500 mt-1">von {stats.leaveBalance.total} Tagen</p>
              </div>
            </div>
          </Link>
        )}

        {/* Überstunden */}
        {stats.overtimeHours !== undefined && (
          <Link href="/mitarbeiter/zeit" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Überstunden</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overtimeHours > 0 ? '+' : ''}{stats.overtimeHours}h
                </p>
                <p className="text-xs text-gray-500 mt-1">Aktueller Stand</p>
              </div>
            </div>
          </Link>
        )}

        {/* Neue Dokumente */}
        <Link href="/mitarbeiter/dokumente" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Neue Dokumente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newDocuments}</p>
              <p className="text-xs text-gray-500 mt-1">Ungelesen</p>
            </div>
          </div>
        </Link>

        {/* Offene Aufgaben */}
        <Link href="/mitarbeiter/aufgaben" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Offene Aufgaben</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
              <p className="text-xs text-gray-500 mt-1">Zu erledigen</p>
            </div>
          </div>
        </Link>

        {/* Anzahl Kunden */}
        <Link href="/admin/customers" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Anzahl Kunden</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">Gesamt</p>
            </div>
          </div>
        </Link>

        {/* Anzahl Werkstätten */}
        <Link href="/admin/workshops" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Anzahl Werkstätten</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWorkshops}</p>
              <p className="text-xs text-gray-500 mt-1">Aktiv</p>
            </div>
          </div>
        </Link>

        {/* Provision */}
        <Link href="/admin/commissions" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Provision</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCommissions.toFixed(2)} €</p>
              <p className="text-xs text-gray-500 mt-1">Aktueller Monat</p>
            </div>
          </div>
        </Link>
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
