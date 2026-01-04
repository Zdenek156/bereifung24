'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LeaveBalance {
  totalDays: number
  usedDays: number
  pendingDays: number
  remainingDays: number
  carryOverDays: number
}

interface LeaveRequest {
  id: string
  type: string
  startDate: string
  endDate: string
  days: number
  reason?: string
  status: string
  approvedBy?: {
    firstName: string
    lastName: string
  }
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
}

export default function UrlaubPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: ''
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
      const res = await fetch('/api/employee/leave')
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching leave data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/employee/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        alert('Urlaubsantrag erfolgreich eingereicht!')
        setShowForm(false)
        setFormData({ type: 'vacation', startDate: '', endDate: '', reason: '' })
        fetchData()
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Fehler')
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      alert('Fehler beim Einreichen des Antrags')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      pending: 'Ausstehend',
      approved: 'Genehmigt',
      rejected: 'Abgelehnt',
      cancelled: 'Storniert'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      vacation: 'Erholungsurlaub',
      special: 'Sonderurlaub',
      unpaid: 'Unbezahlter Urlaub'
    }
    return labels[type as keyof typeof labels] || type
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
          <Link
            href="/mitarbeiter"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Urlaubsverwaltung</h1>
          <p className="text-sm text-gray-600 mt-1">
            Urlaubsanträge verwalten und Resturlaub einsehen
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Urlaubskonto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Jahresanspruch</div>
            <div className="text-3xl font-bold text-blue-600">
              {balance?.totalDays || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Tage</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Genommen</div>
            <div className="text-3xl font-bold text-gray-900">
              {balance?.usedDays || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Tage</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Beantragt</div>
            <div className="text-3xl font-bold text-yellow-600">
              {balance?.pendingDays || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Tage</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Verfügbar</div>
            <div className="text-3xl font-bold text-green-600">
              {balance?.remainingDays || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Tage</div>
          </div>
        </div>

        {/* Neuer Antrag Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Abbrechen' : '+ Neuer Urlaubsantrag'}
          </button>
        </div>

        {/* Antragsformular */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Urlaubsantrag einreichen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Art des Urlaubs
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="vacation">Erholungsurlaub</option>
                    <option value="special">Sonderurlaub</option>
                    <option value="unpaid">Unbezahlter Urlaub</option>
                  </select>
                </div>

                <div className="md:col-span-1"></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Von
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bis
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Begründung (optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional: Grund für den Urlaubsantrag"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? 'Wird eingereicht...' : 'Antrag einreichen'}
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

        {/* Anträge-Liste */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Meine Urlaubsanträge</h2>
          </div>
          <div className="divide-y">
            {requests.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Noch keine Urlaubsanträge vorhanden
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900">
                          {getTypeLabel(request.type)}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          📅 {new Date(request.startDate).toLocaleDateString('de-DE')} 
                          {' - '}
                          {new Date(request.endDate).toLocaleDateString('de-DE')}
                          <span className="ml-2 font-medium">({request.days} Tage)</span>
                        </div>
                        {request.reason && (
                          <div>💬 {request.reason}</div>
                        )}
                        {request.approvedBy && (
                          <div className="text-green-600">
                            ✓ Genehmigt von {request.approvedBy.firstName} {request.approvedBy.lastName}
                          </div>
                        )}
                        {request.rejectionReason && (
                          <div className="text-red-600">
                            ✗ Abgelehnt: {request.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Eingereicht: {new Date(request.createdAt).toLocaleDateString('de-DE')}
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
