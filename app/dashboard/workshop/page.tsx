'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import WorkshopNotificationBell from '@/components/WorkshopNotificationBell'

interface DashboardStats {
  todaysBookings: number
  todaysBookingsList: TodaysBooking[]
  totalRevenue: number
  workshopPayout: number
  bookingsCount7Days: number
  upcomingBookings: number
  averageRating: number
  totalReviews: number
  recentActivities: RecentActivity[]
}

interface TodaysBooking {
  id: string
  time: string
  customerName: string
  serviceType: string
  vehicle: string
  status: string
}

interface RecentActivity {
  id: string
  type: 'booking' | 'payment' | 'review'
  message: string
  time: string
  date: string
}

export default function WorkshopDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    todaysBookings: 0,
    todaysBookingsList: [],
    totalRevenue: 0,
    workshopPayout: 0,
    bookingsCount7Days: 0,
    upcomingBookings: 0,
    averageRating: 0,
    totalReviews: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/workshop/dashboard-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        
        setStats({
          todaysBookings: data.todaysBookings || 0,
          todaysBookingsList: data.todaysBookingsList || [],
          totalRevenue: data.totalRevenue || 0,
          workshopPayout: data.workshopPayout || 0,
          bookingsCount7Days: data.bookingsCount7Days || 0,
          upcomingBookings: data.upcomingBookings || 0,
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          recentActivities: data.recentActivities || []
        })
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
      title: 'Termin erstellen',
      description: 'Manuell einen Termin eintragen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: '/dashboard/workshop/create-appointment',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Kalender öffnen',
      description: 'Termine und Buchungen ansehen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/workshop/appointments',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Buchungen',
      description: 'Alle Buchungen verwalten',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: '/dashboard/workshop/bookings',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Bewertungen',
      description: 'Kundenfeedback ansehen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      href: '/dashboard/workshop/reviews',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      case 'payment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      case 'booking':
        return 'bg-blue-100 text-blue-600'
      case 'payment':
        return 'bg-green-100 text-green-600'
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: { label: 'Bestätigt', color: 'bg-green-100 text-green-700' },
      COMPLETED: { label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-700' },
      CANCELLED: { label: 'Storniert', color: 'bg-red-100 text-red-700' },
      RESERVED: { label: 'Reserviert', color: 'bg-yellow-100 text-yellow-700' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-700' }
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <p className="text-gray-600 dark:text-gray-400">Laden...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {getGreeting()}, {session?.user?.firstName || 'Werkstatt'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Hier ist Ihre Geschäftsübersicht für heute
            </p>
          </div>
          <WorkshopNotificationBell />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Anstehende Buchungen */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Nächste 7 Tage
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.upcomingBookings}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Anstehende Buchungen</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/dashboard/workshop/appointments" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Zu anstehenden Terminen →
              </Link>
            </div>
          </div>

          {/* Umsatz 7 Tage */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                7 Tage
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              €{stats.totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gesamtumsatz</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/dashboard/workshop/bookings" className="text-xs text-green-600 hover:text-green-700 font-medium">
                Zu allen Buchungen →
              </Link>
            </div>
          </div>

          {/* Neue Buchungen 7 Tage */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                7 Tage
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.bookingsCount7Days}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Neue Buchungen eingegangen</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/dashboard/workshop/bookings" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                Alle Buchungen ansehen →
              </Link>
            </div>
          </div>

          {/* Kundenzufriedenheit */}
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

          {/* Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Buchungen (7 Tage)</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Anzahl Buchungen</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.bookingsCount7Days}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(stats.bookingsCount7Days * 10, 100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ø Buchungswert</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    €{stats.bookingsCount7Days > 0 ? (stats.totalRevenue / stats.bookingsCount7Days).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500/70 dark:bg-green-500/60 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Gesamtumsatz</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    €{stats.totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Heute's Buchungen Widget */}
        {stats.todaysBookingsList.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Heute's Termine</h2>
            <div className="space-y-2">
              {stats.todaysBookingsList.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900 dark:text-white">{booking.time}</span>
                    <span className="text-gray-700 dark:text-gray-300">{booking.customerName}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{booking.serviceType}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-500">{booking.vehicle}</span>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aktivitäts-Feed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Letzte Aktivitäten</h2>
          {stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className={`flex-shrink-0 w-10 h-10 ${getActivityColor(activity.type)} rounded-lg flex items-center justify-center`}>
                    {getActivityIcon(activity.type)}
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
