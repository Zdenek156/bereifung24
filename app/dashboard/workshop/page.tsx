'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import WorkshopNotificationBell from '@/components/WorkshopNotificationBell'

interface DashboardStats {
  newRequests: number
  pendingOffers: number
  acceptedOffers: number
  upcomingAppointments: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
  conversionRate: number
}

interface RecentActivity {
  id: string
  type: 'request' | 'offer_accepted' | 'appointment' | 'review'
  message: string
  time: string
  icon: JSX.Element
  color: string
}

export default function WorkshopDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    newRequests: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    upcomingAppointments: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)

  const [activities, setActivities] = useState<RecentActivity[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/workshop/dashboard-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        
        setStats({
          newRequests: data.newRequests || 0,
          pendingOffers: data.pendingOffers || 0,
          acceptedOffers: data.acceptedOffers || 0,
          upcomingAppointments: data.upcomingAppointments || 0,
          totalRevenue: data.totalRevenue || 0,
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          conversionRate: data.conversionRate || 0
        })

        // Formatiere Aktivitäten mit Icons und Farben
        if (data.recentActivities && data.recentActivities.length > 0) {
          const formattedActivities = data.recentActivities.map((activity: any) => ({
            id: activity.id,
            type: activity.type,
            message: activity.message,
            time: activity.time,
            icon: getActivityIcon(activity.type),
            color: getActivityColor(activity.type)
          }))
          setActivities(formattedActivities)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickActions = [
    {
      title: 'Neue Anfragen',
      description: 'Aktuelle Kundenanfragen durchsuchen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      href: '/dashboard/workshop/browse-requests',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Termine verwalten',
      description: 'Kalender und Buchungen ansehen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/workshop/appointments',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Angebote',
      description: 'Gesendete Angebote überprüfen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/dashboard/workshop/offers',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Termin erstellen',
      description: 'Manuell einen Termin eintragen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      href: '/dashboard/workshop/create-appointment',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  // Hilfsfunktionen für Icons und Farben
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'request':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'offer_accepted':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'appointment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'review':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-blue-100 text-blue-600'
      case 'offer_accepted':
        return 'bg-green-100 text-green-600'
      case 'appointment':
        return 'bg-purple-100 text-purple-600'
      case 'review':
        return 'bg-yellow-100 text-yellow-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Guten Morgen'
    if (hour < 18) return 'Guten Tag'
    return 'Guten Abend'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header mit Begrüßung */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {getGreeting()}, {session?.user?.name || 'Werkstatt'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Hier ist Ihre Übersicht für heute
              </p>
            </div>
            <WorkshopNotificationBell />
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mt-2"></div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Neue Anfragen */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                +{stats.newRequests}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.newRequests}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Neue Anfragen</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/dashboard/workshop/browse-requests" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Anfragen ansehen →
              </Link>
            </div>
          </div>

          {/* Offene Angebote */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                Ausstehend
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.pendingOffers}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Offene Angebote</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/dashboard/workshop/offers" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                Angebote verwalten →
              </Link>
            </div>
          </div>

          {/* Anstehende Termine */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                7 Tage
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.upcomingAppointments}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Anstehende Termine</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/dashboard/workshop/appointments" className="text-xs text-green-600 hover:text-green-700 font-medium">
                Kalender öffnen →
              </Link>
            </div>
          </div>

          {/* Durchschnittliche Bewertung */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                {stats.totalReviews} Bewertungen
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.averageRating.toFixed(1)}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kundenzufriedenheit</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/dashboard/workshop/reviews" className="text-xs text-yellow-600 hover:text-yellow-700 font-medium">
                Bewertungen ansehen →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Schnellzugriffe */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Schnellzugriffe</h2>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className={`${action.color} text-white p-4 rounded-lg transition-transform hover:scale-105`}
                  >
                    <div className="flex items-center mb-2">
                      {action.icon}
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-xs opacity-90">{action.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Übersicht */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Performance</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.conversionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 dark:bg-green-600 h-2 rounded-full" style={{ width: `${stats.conversionRate}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Angenommene Angebote</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.acceptedOffers}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500/70 dark:bg-blue-500/60 h-2 rounded-full" style={{ width: `${(stats.acceptedOffers / 20) * 100}%` }}></div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Umsatz (30 Tage)</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">€{stats.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aktivitäts-Feed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Letzte Aktivitäten</h2>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className={`flex-shrink-0 w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center`}>
                    {activity.icon}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">Noch keine Aktivitäten vorhanden</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
            <Link href="/dashboard/workshop/browse-requests" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Alle Aktivitäten anzeigen →
            </Link>
          </div>
        </div>

        {/* Hilfe Banner */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Maximieren Sie Ihr Potenzial</h3>
              <p className="text-blue-100 text-sm">
                Nutzen Sie alle Features der Plattform, um mehr Kunden zu gewinnen und Ihren Umsatz zu steigern.
              </p>
            </div>
            <Link
              href="/dashboard/workshop/settings"
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex-shrink-0 ml-4"
            >
              Einstellungen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
