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

interface NavigationItem {
  href: string
  title: string
  description: string
  icon: string
  color: string
  resource: string
  isDefault?: boolean // Immer sichtbar
}

// Verfügbare Mitarbeiter-Portal Seiten
const allNavigationItems: NavigationItem[] = [
  // Standard-Seiten (immer sichtbar)
  {
    href: '/mitarbeiter/profil',
    title: 'Mein Profil',
    description: 'Persönliche Daten & Bankverbindung',
    icon: '👤',
    color: 'bg-blue-100',
    resource: '',
    isDefault: true
  },
  {
    href: '/mitarbeiter/dokumente',
    title: 'Dokumente',
    description: 'Verträge, Gehaltsabrechnungen & mehr',
    icon: '📄',
    color: 'bg-orange-100',
    resource: '',
    isDefault: true
  },
  {
    href: '/mitarbeiter/urlaub',
    title: 'Urlaub & Spesen',
    description: 'Urlaubsanträge & Spesenabrechnungen',
    icon: '🏖️',
    color: 'bg-purple-100',
    resource: 'leave-requests',
    isDefault: true // Immer sichtbar für alle Mitarbeiter
  },
  {
    href: '/mitarbeiter/krankmeldung',
    title: 'Krankmeldung',
    description: 'Krankmeldungen einreichen',
    icon: '🤒',
    color: 'bg-red-100',
    resource: '',
    isDefault: true // Immer sichtbar
  },
  // Berechtigungsbasierte Seiten
  {
    href: '/mitarbeiter/email',
    title: 'E-Mail',
    description: 'Postfach mit IMAP/SMTP',
    icon: '📧',
    color: 'bg-green-100',
    resource: 'email'
  },
  {
    href: '/mitarbeiter/files',
    title: 'Dateiverwaltung',
    description: 'Gemeinsame Dateien & Ordner',
    icon: '📁',
    color: 'bg-yellow-100',
    resource: 'files'
  },
  {
    href: '/admin/kvp',
    title: 'Verbesserungsvorschläge',
    description: 'KVP - Ideen einreichen',
    icon: '💡',
    color: 'bg-indigo-100',
    resource: 'kvp'
  }
]

export default function MitarbeiterDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    newDocuments: 0,
    pendingTasks: 0,
  })
  const [loading, setLoading] = useState(true)
  const [visibleItems, setVisibleItems] = useState<NavigationItem[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchStats()
      fetchPermissions()
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

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/employee/permissions')
      if (res.ok) {
        const data = await res.json()
        const accessibleResources = new Set(data.accessibleResources)
        
        // Filtere Seiten: Standard-Seiten immer sichtbar, andere nur mit Permission
        const filtered = allNavigationItems.filter(item => 
          item.isDefault || accessibleResources.has(item.resource)
        )
        
        setVisibleItems(filtered)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      // Bei Fehler: Nur Standard-Seiten anzeigen
      setVisibleItems(allNavigationItems.filter(item => item.isDefault))
    } finally {
      setPermissionsLoading(false)
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

        {/* Quick Actions / Navigation Kacheln */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Verfügbare Bereiche
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Basierend auf Ihren Berechtigungen
            </p>
          </div>
          <div className="p-6">
            {permissionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-32"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
                        <span className="text-2xl">{item.icon}</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                        {item.isDefault && (
                          <span className="inline-block mt-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            Standard
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Old Quick Actions - Entfernen */}
        {/* 
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
                  Die angezeigten Bereiche basieren auf Ihren Berechtigungen.
                  Bei Fragen zur Freischaltung weiterer Funktionen wenden Sie sich bitte an den Administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  )
}
