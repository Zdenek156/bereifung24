'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TravelExpense {
  id: string
  purpose: string
  startDate: string
  endDate: string
  destination: string
  fullDays: number
  partialDays: number
  dailyRate: number
  mealDeduction: number
  accommodationCosts: number
  travelCosts: number
  travelMethod?: string
  kmDriven?: number
  kmRate?: number
  otherCosts: number
  otherDescription?: string
  totalAmount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  approvedBy?: {
    firstName: string
    lastName: string
  }
  approvedAt?: string
  rejectionNote?: string
  notes?: string
  createdAt: string
}

const statusLabels: Record<string, string> = {
  PENDING: 'Wartend',
  APPROVED: 'Genehmigt',
  REJECTED: 'Abgelehnt',
  PAID: 'Ausgezahlt',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PAID: 'bg-blue-100 text-blue-800',
}

export default function ReisekostenPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [travelExpenses, setTravelExpenses] = useState<TravelExpense[]>([])
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    purpose: '',
    startDate: '',
    endDate: '',
    destination: '',
    fullDays: '0',
    partialDays: '0',
    dailyRate: '28.00',
    mealDeduction: '0',
    accommodationCosts: '0',
    travelCosts: '0',
    travelMethod: 'CAR',
    kmDriven: '',
    kmRate: '0.30',
    otherCosts: '0',
    otherDescription: '',
    notes: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session) {
      fetchTravelExpenses()
    }
  }, [status, session, router])

  const fetchTravelExpenses = async () => {
    try {
      const res = await fetch('/api/employee/travel-expenses')
      if (res.ok) {
        const data = await res.json()
        setTravelExpenses(data.travelExpenses)
      }
    } catch (error) {
      console.error('Error fetching travel expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const verpflegung =
      parseFloat(formData.fullDays || '0') * parseFloat(formData.dailyRate) +
      parseFloat(formData.partialDays || '0') * parseFloat(formData.dailyRate) * 0.5 -
      parseFloat(formData.mealDeduction || '0')

    const fahrt =
      formData.travelMethod === 'CAR' && formData.kmDriven
        ? parseFloat(formData.kmDriven) * parseFloat(formData.kmRate)
        : parseFloat(formData.travelCosts || '0')

    return (
      verpflegung +
      parseFloat(formData.accommodationCosts || '0') +
      fahrt +
      parseFloat(formData.otherCosts || '0')
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/employee/travel-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        alert('Reisekostenabrechnung erfolgreich eingereicht!')
        setShowForm(false)
        setFormData({
          purpose: '',
          startDate: '',
          endDate: '',
          destination: '',
          fullDays: '0',
          partialDays: '0',
          dailyRate: '28.00',
          mealDeduction: '0',
          accommodationCosts: '0',
          travelCosts: '0',
          travelMethod: 'CAR',
          kmDriven: '',
          kmRate: '0.30',
          otherCosts: '0',
          otherDescription: '',
          notes: '',
        })
        fetchTravelExpenses()
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler beim Einreichen')
      }
    } catch (error) {
      console.error('Error submitting travel expense:', error)
      alert('Fehler beim Einreichen der Reisekostenabrechnung')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Reisekosten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link
              href="/mitarbeiter/spesen"
              className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Zurück zu Spesen
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              ✈️ Reisekostenabrechnung
            </h1>
            <p className="text-gray-600 mt-1">
              Dienstreisen abrechnen mit Verpflegungspauschalen
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? '❌ Abbrechen' : '➕ Neue Abrechnung'}
          </button>
        </div>
      </div>

      {/* Info-Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-blue-900 mb-2">
          ℹ️ Verpflegungspauschalen Deutschland (2024)
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Voller Tag (ab 24h):</strong> 28,00 €</li>
          <li>• <strong>Teilreisetag (8-24h):</strong> 14,00 € (50%)</li>
          <li>• <strong>Unter 8h:</strong> Keine Pauschale</li>
          <li>• <strong>PKW-Pauschale:</strong> 0,30 €/km</li>
        </ul>
      </div>

      {/* Formular */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Neue Reisekostenabrechnung</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reise-Informationen */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Reise-Informationen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zweck der Reise *
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="z.B. Kundentermin bei XYZ GmbH"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startdatum *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enddatum *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zielort *
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Stadt, Land"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Verpflegungspauschale */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-3">
                Verpflegungspauschale
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volle Tage (24h+)
                  </label>
                  <input
                    type="number"
                    value={formData.fullDays}
                    onChange={(e) =>
                      setFormData({ ...formData, fullDays: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teilreisetage (8-24h)
                  </label>
                  <input
                    type="number"
                    value={formData.partialDays}
                    onChange={(e) =>
                      setFormData({ ...formData, partialDays: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagessatz (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dailyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyRate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Abzug (gestellte Mahlzeiten)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mealDeduction}
                    onChange={(e) =>
                      setFormData({ ...formData, mealDeduction: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Übernachtungskosten */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-3">Übernachtungskosten</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gesamt (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.accommodationCosts}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accommodationCosts: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Fahrtkosten */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-3">Fahrtkosten</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verkehrsmittel
                  </label>
                  <select
                    value={formData.travelMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, travelMethod: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="CAR">PKW</option>
                    <option value="TRAIN">Bahn</option>
                    <option value="PLANE">Flugzeug</option>
                    <option value="TAXI">Taxi</option>
                    <option value="PUBLIC_TRANSPORT">ÖPNV</option>
                  </select>
                </div>

                {formData.travelMethod === 'CAR' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gefahrene KM
                      </label>
                      <input
                        type="number"
                        value={formData.kmDriven}
                        onChange={(e) =>
                          setFormData({ ...formData, kmDriven: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        €/km
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.kmRate}
                        onChange={(e) =>
                          setFormData({ ...formData, kmRate: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kosten (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.travelCosts}
                      onChange={(e) =>
                        setFormData({ ...formData, travelCosts: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sonstige Kosten */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-3">Sonstige Kosten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Betrag (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.otherCosts}
                    onChange={(e) =>
                      setFormData({ ...formData, otherCosts: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={formData.otherDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        otherDescription: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="z.B. Parkgebühren"
                  />
                </div>
              </div>
            </div>

            {/* Notizen */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zusätzliche Bemerkungen
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
              />
            </div>

            {/* Gesamtsumme */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">
                  Gesamtsumme:
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateTotal().toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {submitting ? 'Wird eingereicht...' : 'Einreichen'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Meine Reisekostenabrechnungen</h2>
          {travelExpenses.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Noch keine Reisekostenabrechnungen eingereicht
            </p>
          ) : (
            <div className="space-y-4">
              {travelExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-lg">
                          {expense.purpose}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            statusColors[expense.status]
                          }`}
                        >
                          {statusLabels[expense.status]}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        📍 {expense.destination}
                      </p>
                      <p className="text-sm text-gray-500">
                        📅{' '}
                        {new Date(expense.startDate).toLocaleDateString('de-DE')} -{' '}
                        {new Date(expense.endDate).toLocaleDateString('de-DE')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Volle Tage: {expense.fullDays} | Teilreisetage:{' '}
                        {expense.partialDays}
                      </p>
                      {expense.kmDriven && (
                        <p className="text-sm text-gray-500">
                          🚗 {expense.kmDriven} km × {expense.kmRate} € ={' '}
                          {(expense.kmDriven * Number(expense.kmRate)).toFixed(2)} €
                        </p>
                      )}
                      {expense.approvedBy && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Genehmigt von {expense.approvedBy.firstName}{' '}
                          {expense.approvedBy.lastName}
                        </p>
                      )}
                      {expense.rejectionNote && (
                        <p className="text-xs text-red-600 mt-2">
                          ✗ Abgelehnt: {expense.rejectionNote}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {Number(expense.totalAmount).toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
