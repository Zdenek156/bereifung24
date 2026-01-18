'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/BackButton'

export default function AdminCleanupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [deleteVehicles, setDeleteVehicles] = useState(false)
  const [deleteTireRequests, setDeleteTireRequests] = useState(false)
  const [deleteOffers, setDeleteOffers] = useState(false)
  const [deleteBookings, setDeleteBookings] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
    router.push('/admin')
    return null
  }

  const handleCleanup = async () => {
    if (!deleteVehicles && !deleteTireRequests && !deleteOffers && !deleteBookings) {
      setError('Bitte wählen Sie mindestens eine Option aus')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/vehicles/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deleteVehicles,
          deleteTireRequests,
          deleteOffers,
          deleteBookings
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(data)
        setShowConfirmation(false)
        // Reset checkboxes
        setDeleteVehicles(false)
        setDeleteTireRequests(false)
        setDeleteOffers(false)
        setDeleteBookings(false)
      } else {
        setError(data.error || 'Fehler beim Löschen')
      }
    } catch (error) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const getSelectionSummary = () => {
    const items = []
    if (deleteVehicles) items.push('Fahrzeuge')
    if (deleteTireRequests) items.push('Anfragen')
    if (deleteOffers) items.push('Angebote')
    if (deleteBookings) items.push('Termine')
    return items.join(', ')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <BackButton />
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zum Admin-Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Datenbank Bereinigung</h1>
          <p className="mt-2 text-lg text-gray-600">
            Löschen Sie selektiv Daten aus der Datenbank
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">⚠️ Achtung!</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Diese Aktion kann nicht rückgängig gemacht werden!</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Das Löschen von Anfragen löscht automatisch auch zugehörige Angebote und Termine</li>
                  <li>Das Löschen von Angeboten löscht automatisch auch zugehörige Termine</li>
                  <li>Gelöschte Daten können nicht wiederhergestellt werden</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-2">✓ Erfolgreich gelöscht:</p>
              <ul className="text-sm text-green-700 space-y-1">
                {success.deletedCounts.vehicles !== undefined && (
                  <li>• Fahrzeuge: {success.deletedCounts.vehicles}</li>
                )}
                {success.deletedCounts.tireRequests !== undefined && (
                  <li>• Anfragen: {success.deletedCounts.tireRequests}</li>
                )}
                {success.deletedCounts.offers !== undefined && (
                  <li>• Angebote: {success.deletedCounts.offers}</li>
                )}
                {success.deletedCounts.bookings !== undefined && (
                  <li>• Termine: {success.deletedCounts.bookings}</li>
                )}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Was möchten Sie löschen?</h2>

            {/* Checkboxes */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteVehicles}
                  onChange={(e) => setDeleteVehicles(e.target.checked)}
                  className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">🚗 Alle Fahrzeuge</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Löscht alle gespeicherten Kundenfahrzeuge (inkl. Reifengrößen, VIN, TÜV-Daten)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteTireRequests}
                  onChange={(e) => setDeleteTireRequests(e.target.checked)}
                  className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">📋 Alle Anfragen</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Löscht alle Reifenanfragen (Reifen, Räder wechseln, Batterie, etc.)
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    ⚠️ Löscht automatisch auch alle zugehörigen Angebote und Termine!
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteOffers}
                  onChange={(e) => setDeleteOffers(e.target.checked)}
                  disabled={deleteTireRequests}
                  className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">💰 Alle Angebote</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Löscht alle Werkstatt-Angebote
                  </p>
                  {deleteTireRequests && (
                    <p className="text-sm text-gray-500 mt-1 italic">
                      Wird automatisch mit Anfragen gelöscht
                    </p>
                  )}
                  {!deleteTireRequests && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ Löscht automatisch auch alle zugehörigen Termine!
                    </p>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteBookings}
                  onChange={(e) => setDeleteBookings(e.target.checked)}
                  disabled={deleteTireRequests || deleteOffers}
                  className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">📅 Alle Termine</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Löscht alle gebuchten Werkstatt-Termine
                  </p>
                  {(deleteTireRequests || deleteOffers) && (
                    <p className="text-sm text-gray-500 mt-1 italic">
                      Wird automatisch mit {deleteTireRequests ? 'Anfragen' : 'Angeboten'} gelöscht
                    </p>
                  )}
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowConfirmation(true)}
                disabled={loading || (!deleteVehicles && !deleteTireRequests && !deleteOffers && !deleteBookings)}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Wird gelöscht...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sind Sie sicher?</h3>
                <p className="text-gray-600 mb-4">
                  Sie sind dabei, folgende Daten unwiderruflich zu löschen:
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-semibold">{getSelectionSummary()}</p>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Diese Aktion kann nicht rückgängig gemacht werden!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleCleanup}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Löschen...' : 'Jetzt löschen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
