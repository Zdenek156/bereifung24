'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DashboardStats {
  openRequests: number
  receivedOffers: number
  completedBookings: number
  savedVehicles: number
}

export default function CustomerDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<DashboardStats>({
    openRequests: 0,
    receivedOffers: 0,
    completedBookings: 0,
    savedVehicles: 0
  })
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    // Lade Dashboard-Statistiken
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

  // Check URL parameters for success message
  useEffect(() => {
    const success = searchParams.get('success')
    
    if (success) {
      const successMessages: { [key: string]: string } = {
        'repair': 'Ihre Reparaturanfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'alignment': 'Ihre Achsvermessungs-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'other-services': 'Ihre Service-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'wheel-change': 'Ihre Räderwechsel-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'motorcycle': 'Ihre Motorradreifen-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'tires': 'Ihre Reifenanfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'climate': 'Ihre Klimaservice-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'brakes': 'Ihre Bremsen-Service-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.',
        'battery': 'Ihre Batterie-Service-Anfrage wurde erfolgreich erstellt! Werkstätten in Ihrer Nähe werden benachrichtigt.'
      }
      
      setSuccessMessage(successMessages[success] || 'Ihre Anfrage wurde erfolgreich erstellt!')
      
      // Clear the success message after 10 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen, {session?.user?.name || 'Kunde'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Schön, dass Sie da sind. Hier finden Sie eine Übersicht über Ihre Aktivitäten.
        </p>
      </div>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="inline-flex text-green-400 hover:text-green-500 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome & Instructions Section */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg shadow-md p-8 mb-8 border border-primary-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🎯 So funktioniert Bereifung24
            </h2>
            <p className="text-gray-700 mb-6">
              Mit unserem Service erhalten Sie schnell und unkompliziert Angebote von Werkstätten in Ihrer Nähe. 
              Vergleichen Sie Preise und wählen Sie das beste Angebot für sich aus.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Anfrage erstellen</h3>
                    <p className="text-sm text-gray-600">
                      Wählen Sie Ihre Reifengröße oder einen anderen Service aus. Die Anfrage ist komplett kostenlos und unverbindlich.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Angebote erhalten</h3>
                    <p className="text-sm text-gray-600">
                      Werkstätten in Ihrer Nähe werden automatisch benachrichtigt und senden Ihnen passende Angebote zu.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Vergleichen & auswählen</h3>
                    <p className="text-sm text-gray-600">
                      Schauen Sie sich alle Angebote in Ruhe an und wählen Sie das beste für sich aus.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Termin vereinbaren</h3>
                    <p className="text-sm text-gray-600">
                      Buchen Sie direkt online einen passenden Termin bei der Werkstatt Ihrer Wahl.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-primary-700 bg-white rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">100% kostenlos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-700 bg-white rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Unverbindlich</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-700 bg-white rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Schnell & einfach</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-Action Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold mb-1">Jetzt Anfrage erstellen</h2>
              <p className="text-primary-100">Finden Sie die besten Angebote in Ihrer Nähe</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/customer/select-service')}
            className="w-full lg:w-auto px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg shadow-lg flex items-center justify-center gap-2"
          >
            Service auswählen
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offene Anfragen</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block animate-pulse bg-gray-200 rounded w-12 h-9"></span>
                ) : (
                  stats.openRequests
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Erhaltene Angebote</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block animate-pulse bg-gray-200 rounded w-12 h-9"></span>
                ) : (
                  stats.receivedOffers
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Termine</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block animate-pulse bg-gray-200 rounded w-12 h-9"></span>
                ) : (
                  stats.completedBookings
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fahrzeuge</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block animate-pulse bg-gray-200 rounded w-12 h-9"></span>
                ) : (
                  stats.savedVehicles
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Schnellzugriff</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/customer/requests')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Meine Anfragen</h3>
                <p className="text-sm text-gray-600">Angebote vergleichen</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/customer/vehicles')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fahrzeuge</h3>
                <p className="text-sm text-gray-600">Verwaltung</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/dashboard/customer/appointments')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Termine</h3>
                <p className="text-sm text-gray-600">Übersicht</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
