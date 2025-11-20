'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DashboardStats {
  openRequests: number
  receivedOffers: number
  completedBookings: number
  savedVehicles: number
}

export default function CustomerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    openRequests: 0,
    receivedOffers: 0,
    completedBookings: 0,
    savedVehicles: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'CUSTOMER') {
      router.push('/dashboard')
      return
    }

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
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Willkommen, {session.user.name || 'Kunde'}!
              </h1>
              <p className="mt-1 text-sm text-gray-600">Kunden-Dashboard</p>
            </div>
            <button
              onClick={() => {
                fetch('/api/auth/signout', { method: 'POST' })
                router.push('/login')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Instructions Section */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg shadow-md p-6 mb-8 border border-primary-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                So kommen Sie zu Ihrem günstigen Reifenangebot
              </h2>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <p className="pt-0.5">
                    <strong>Anfrage erstellen:</strong> Wählen Sie die gewünschte Reifengröße aus Ihren gespeicherten Fahrzeugen oder geben Sie die Dimension manuell ein.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <p className="pt-0.5">
                    <strong>Angebote erhalten:</strong> Werkstätten in Ihrer Nähe sehen Ihre Anfrage und senden Ihnen individuelle Angebote zu.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <p className="pt-0.5">
                    <strong>Vergleichen & auswählen:</strong> Vergleichen Sie Preise und Leistungen und wählen Sie das beste Angebot für sich aus.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <p className="pt-0.5">
                    <strong>Termin vereinbaren:</strong> Buchen Sie direkt einen Termin bei der Werkstatt Ihrer Wahl.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-primary-700 bg-primary-100 rounded-lg px-4 py-2 inline-block">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Kostenlos, unverbindlich und zeitsparend!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prominent Call-to-Action Card */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-1">Neue Reifenanfrage erstellen</h2>
                <p className="text-primary-100">Erstellen Sie jetzt eine Anfrage und erhalten Sie günstige Angebote von Werkstätten in Ihrer Nähe</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/customer/select-service')}
              className="px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg shadow-lg flex items-center gap-2"
            >
              Anfrage erstellen
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meine Anfragen</h3>
            <p className="text-sm text-gray-600 mb-4">Offene und abgeschlossene Anfragen anzeigen</p>
            <button
              onClick={() => router.push('/dashboard/customer/requests')}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Anfragen ansehen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meine Fahrzeuge</h3>
            <p className="text-sm text-gray-600 mb-4">Fahrzeuge und Reifengrößen verwalten</p>
            <button
              onClick={() => router.push('/dashboard/customer/vehicles')}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fahrzeuge verwalten
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Termine</h3>
            <p className="text-sm text-gray-600 mb-4">Gebuchte Werkstatttermine verwalten</p>
            <button
              onClick={() => router.push('/dashboard/customer/appointments')}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Termine ansehen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meine Bewertungen</h3>
            <p className="text-sm text-gray-600 mb-4">Werkstätten bewerten und Erfahrungen teilen</p>
            <button
              onClick={() => router.push('/dashboard/customer/appointments')}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Bewertungen verwalten
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Persönliche Daten</h3>
            <p className="text-sm text-gray-600 mb-4">Rechnungsdaten und Einstellungen</p>
            <button
              onClick={() => router.push('/dashboard/customer/settings')}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Einstellungen öffnen
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reifenhistorie</h3>
            <p className="text-sm text-gray-600 mb-4">Alle gekauften Reifen anzeigen</p>
            <button
              onClick={() => router.push('/dashboard/customer/tire-history')}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Historie ansehen
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Offene Anfragen</p>
            <p className="mt-2 text-3xl font-bold text-primary-600">
              {loading ? (
                <span className="inline-block animate-pulse bg-gray-200 rounded w-12 h-9"></span>
              ) : (
                stats.openRequests
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Erhaltene Angebote</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {loading ? (
                <span className="inline-block animate-pulse bg-gray-200 rounded w-12 h-9"></span>
              ) : (
                stats.receivedOffers
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Abgeschlossene Aufträge</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {loading ? (
                <span className="inline-block animate-pulse bg-gray-200 rounded w-12 h-9"></span>
              ) : (
                stats.completedBookings
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Gespeicherte Fahrzeuge</p>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {loading ? (
                <span className="inline-block animate-pulse bg-gray-200 rounded w-12 h-9"></span>
              ) : (
                stats.savedVehicles
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
