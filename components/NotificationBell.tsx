'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  openRequests: number
  receivedOffers: number
  upcomingAppointments: number
  savedVehicles: number
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    openRequests: 0,
    receivedOffers: 0,
    upcomingAppointments: 0,
    savedVehicles: 0
  })
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
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

  const totalNotifications = stats.openRequests + stats.receivedOffers + stats.upcomingAppointments

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
                {/* Received Offers */}
                <button
                  onClick={() => {
                    router.push('/dashboard/customer/requests')
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
                      <h4 className="font-semibold text-sm text-gray-900 truncate">Erhaltene Angebote</h4>
                      {stats.receivedOffers > 0 && <span className="text-lg font-bold text-green-600 flex-shrink-0">{stats.receivedOffers}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stats.receivedOffers === 0 
                        ? 'Keine neuen Angebote' 
                        : stats.receivedOffers === 1
                        ? '1 neues Angebot'
                        : `${stats.receivedOffers} neue Angebote`
                      }
                    </p>
                  </div>
                </button>

                {/* Open Requests */}
                <button
                  onClick={() => {
                    router.push('/dashboard/customer/requests')
                    setIsOpen(false)
                  }}
                  className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-2"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">Offene Anfragen</h4>
                      {stats.openRequests > 0 && <span className="text-lg font-bold text-primary-600 flex-shrink-0">{stats.openRequests}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stats.openRequests === 0 
                        ? 'Keine offenen Anfragen' 
                        : stats.openRequests === 1
                        ? '1 Anfrage offen'
                        : `${stats.openRequests} Anfragen offen`
                      }
                    </p>
                  </div>
                </button>

                {/* Upcoming Appointments */}
                <button
                  onClick={() => {
                    router.push('/dashboard/customer/appointments')
                    setIsOpen(false)
                  }}
                  className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-2"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">Bevorstehende Termine</h4>
                      {stats.upcomingAppointments > 0 && <span className="text-lg font-bold text-blue-600 flex-shrink-0">{stats.upcomingAppointments}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stats.upcomingAppointments === 0 
                        ? 'Keine Termine' 
                        : stats.upcomingAppointments === 1
                        ? '1 Termin geplant'
                        : `${stats.upcomingAppointments} Termine geplant`
                      }
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => {
                router.push('/dashboard/customer/requests')
                setIsOpen(false)
              }}
              className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Alle ansehen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
