'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  leaveBalance?: {
    remaining: number
    used: number
    total: number
  }
  newDocuments: number
  pendingTasks: number
  overtimeHours?: number
}

export default function MitarbeiterDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    newDocuments: 0,
    pendingTasks: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mitarbeiter-Portal
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Willkommen, {session?.user?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                ← Zurück zum Hauptmenü
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Urlaubstage */}
          {stats.leaveBalance && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏖️</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Resturlaub</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.leaveBalance.remaining} Tage
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    von {stats.leaveBalance.total} Tagen
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Überstunden */}
          {stats.overtimeHours !== undefined && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⏰</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Überstunden</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.overtimeHours > 0 ? '+' : ''}
                    {stats.overtimeHours}h
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Aktueller Stand</p>
                </div>
              </div>
            </div>
          )}

          {/* Neue Dokumente */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Neue Dokumente
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.newDocuments}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ungelesen</p>
              </div>
            </div>
          </div>

          {/* Offene Aufgaben */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Offene Aufgaben
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingTasks}
                </p>
                <p className="text-xs text-gray-500 mt-1">Zu erledigen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Schnellzugriff
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link
                href="/mitarbeiter/email"
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">📧</span>
                </div>
                <span className="text-sm font-medium text-gray-900">E-Mail</span>
              </Link>

              <Link
                href="/mitarbeiter/profil"
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">👤</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Profil</span>
              </Link>

              <Link
                href="/mitarbeiter/dokumente"
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">📄</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Dokumente</span>
              </Link>

              <div className="flex flex-col items-center p-4 rounded-lg opacity-50 cursor-not-allowed">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">🏖️</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Urlaub</span>
                <span className="text-xs text-gray-500">Demnächst</span>
              </div>

              <div className="flex flex-col items-center p-4 rounded-lg opacity-50 cursor-not-allowed">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">⏰</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Zeiten
                </span>
                <span className="text-xs text-gray-500">Demnächst</span>
              </div>

              <div className="flex flex-col items-center p-4 rounded-lg opacity-50 cursor-not-allowed">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">🚗</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Fahrten
                </span>
                <span className="text-xs text-gray-500">Demnächst</span>
              </div>

              <div className="flex flex-col items-center p-4 rounded-lg opacity-50 cursor-not-allowed">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-2xl">💰</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Spesen
                </span>
                <span className="text-xs text-gray-500">Demnächst</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">
                Willkommen im Mitarbeiter-Portal!
              </h3>
              <div className="mt-2 text-sm text-blue-800">
                <p>
                  Hier finden Sie alle wichtigen Funktionen für Ihren Arbeitsalltag.
                  Weitere Features wie Zeiterfassung, Urlaubsverwaltung und mehr
                  werden in Kürze verfügbar sein.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
