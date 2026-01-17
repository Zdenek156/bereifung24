'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'

interface SickLeave {
  id: string
  startDate: string
  endDate?: string
  expectedReturnDate?: string
  actualReturnDate?: string
  certificateRequired: boolean
  certificateUrl?: string
  certificateUploadedAt?: string
  notes?: string
  notifiedAt: string
  createdAt: string
}

export default function KrankmeldungPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sickLeaves, setSickLeaves] = useState<SickLeave[]>([])
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    expectedReturnDate: '',
    notes: '',
    certificate: null as File | null
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchData()
    }
  }, [status, session, router])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/employee/sick-leave')
      if (res.ok) {
        const data = await res.json()
        setSickLeaves(data.sickLeaves)
      }
    } catch (error) {
      console.error('Error fetching sick leaves:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('startDate', formData.startDate)
      if (formData.endDate) formDataToSend.append('endDate', formData.endDate)
      if (formData.expectedReturnDate) formDataToSend.append('expectedReturnDate', formData.expectedReturnDate)
      if (formData.notes) formDataToSend.append('notes', formData.notes)
      if (formData.certificate) formDataToSend.append('certificate', formData.certificate)

      const res = await fetch('/api/employee/sick-leave', {
        method: 'POST',
        body: formDataToSend
      })

      if (res.ok) {
        alert('Krankmeldung erfolgreich eingereicht!')
        setShowForm(false)
        setFormData({
          startDate: '',
          endDate: '',
          expectedReturnDate: '',
          notes: '',
          certificate: null
        })
        fetchData()
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Fehler')
      }
    } catch (error) {
      console.error('Error submitting sick leave:', error)
      alert('Fehler beim Einreichen der Krankmeldung')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Lade Daten...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Krankmeldung</h1>
          <p className="text-sm text-gray-600 mt-1">
            Krankmeldungen einreichen und verwalten
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">Wichtige Hinweise</h3>
              <div className="mt-2 text-sm text-blue-800">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Bitte melde dich so früh wie möglich krank</li>
                  <li>Ab dem 3. Krankheitstag ist eine AU-Bescheinigung erforderlich</li>
                  <li>Lade die AU-Bescheinigung schnellstmöglich hoch</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Neuer Antrag Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {showForm ? 'Abbrechen' : '🤒 Krankmeldung einreichen'}
          </button>
        </div>

        {/* Krankmeldungsformular */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Neue Krankmeldung</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Krank seit *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voraussichtlich bis (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Erwartete Rückkehr (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AU-Bescheinigung hochladen
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({ ...formData, certificate: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF oder Bild (ab 3. Krankheitstag erforderlich)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bemerkungen (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Weitere Informationen..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? 'Wird eingereicht...' : 'Krankmeldung einreichen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Krankmeldungs-Liste */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Meine Krankmeldungen</h2>
          </div>
          <div className="divide-y">
            {sickLeaves.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Keine Krankmeldungen vorhanden
              </div>
            ) : (
              sickLeaves.map((leave) => (
                <div key={leave.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900">
                          🤒 Krankmeldung
                        </span>
                        {leave.certificateUrl ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            AU vorhanden
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            AU ausstehend
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          📅 Krank seit: {new Date(leave.startDate).toLocaleDateString('de-DE')}
                          {leave.endDate && ` bis ${new Date(leave.endDate).toLocaleDateString('de-DE')}`}
                        </div>
                        {leave.expectedReturnDate && (
                          <div>
                            ↩️ Erwartet zurück: {new Date(leave.expectedReturnDate).toLocaleDateString('de-DE')}
                          </div>
                        )}
                        {leave.actualReturnDate && (
                          <div className="text-green-600">
                            ✓ Zurückgekehrt am: {new Date(leave.actualReturnDate).toLocaleDateString('de-DE')}
                          </div>
                        )}
                        {leave.notes && (
                          <div>💬 {leave.notes}</div>
                        )}
                        {leave.certificateUrl && (
                          <div>
                            <a
                              href={leave.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              📄 AU-Bescheinigung anzeigen
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Gemeldet: {new Date(leave.notifiedAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
