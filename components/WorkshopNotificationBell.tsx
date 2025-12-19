'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface WorkshopStats {
  newRequests: number
  acceptedOffers: number
  upcomingAppointments: number
  pendingReviews: number
}

export default function WorkshopNotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<WorkshopStats>({
    newRequests: 0,
    acceptedOffers: 0,
    upcomingAppointments: 0,
    pendingReviews: 0
  })
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/workshop/notification-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching workshop stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const totalNotifications = stats.newRequests + stats.acceptedOffers + stats.upcomingAppointments + stats.pendingReviews

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Notification Badge */}
        {totalNotifications > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {totalNotifications}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Benachrichtigungen</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* New Requests */}
                <button
                  onClick={() => {
                    router.push('/dashboard/workshop/browse-requests')
                    setIsOpen(false)
                  }}
                  className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-2"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">Neue Anfragen</h4>
                      {stats.newRequests > 0 && <span className="text-lg font-bold text-blue-600 flex-shrink-0">{stats.newRequests}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stats.newRequests === 0 
                        ? 'Keine neuen Anfragen' 
                        : stats.newRequests === 1
                        ? '1 neue Anfrage'
                        : `${stats.newRequests} neue Anfragen`
                      }
                    </p>
                  </div>
                </button>

                {/* Accepted Offers */}
                <button
                  onClick={() => {
                    router.push('/dashboard/workshop/offers')
                    setIsOpen(false)
                  }}
                  className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-2"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">Angenommene Angebote</h4>
                      {stats.acceptedOffers > 0 && <span className="text-lg font-bold text-green-600 flex-shrink-0">{stats.acceptedOffers}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stats.acceptedOffers === 0 
                        ? 'Keine angenommenen Angebote' 
                        : stats.acceptedOffers === 1
                        ? '1 Angebot angenommen'
                        : `${stats.acceptedOffers} Angebote angenommen`
                      }
                    </p>
                  </div>
                </button>

                {/* Upcoming Appointments */}
                <button
                  onClick={() => {
                    router.push('/dashboard/workshop/appointments')
                    setIsOpen(false)
                  }}
                  className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-2"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">Anstehende Termine</h4>
                      {stats.upcomingAppointments > 0 && <span className="text-lg font-bold text-purple-600 flex-shrink-0">{stats.upcomingAppointments}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stats.upcomingAppointments === 0 
                        ? 'Keine Termine (7 Tage)' 
                        : stats.upcomingAppointments === 1
                        ? '1 Termin (7 Tage)'
                        : `${stats.upcomingAppointments} Termine (7 Tage)`
                      }
                    </p>
                  </div>
                </button>

                {/* Pending Reviews */}
                <button
                  onClick={() => {
                    router.push('/dashboard/workshop/reviews')
                    setIsOpen(false)
                  }}
                  className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-2"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">Neue Bewertungen</h4>
                      {stats.pendingReviews > 0 && <span className="text-lg font-bold text-yellow-600 flex-shrink-0">{stats.pendingReviews}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stats.pendingReviews === 0 
                        ? 'Keine neuen Bewertungen' 
                        : stats.pendingReviews === 1
                        ? '1 neue Bewertung'
                        : `${stats.pendingReviews} neue Bewertungen`
                      }
                    </p>
                  </div>
                </button>

                {/* Footer */}
                {totalNotifications === 0 && (
                  <div className="p-6 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Alles erledigt!</p>
                    <p className="text-sm text-gray-400 mt-1">Keine neuen Benachrichtigungen</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
