'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  vin?: string
}

export default function TireRepairPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    vehicleId: '',
    issueType: 'puncture' as 'puncture' | 'valve' | 'other',
    issueDescription: '',
    needByDate: '',
    radiusKm: 25,
    additionalNotes: ''
  })

  const [userZipCode, setUserZipCode] = useState('')

  useEffect(() => {
    // Fetch user profile to get zipCode
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const data = await res.json()
          setUserZipCode(data.zipCode || '')
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    fetchUserProfile()
  }, [])

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles')
      if (res.ok) {
        const data = await res.json()
        // API returns array directly, not { vehicles: [...] }
        setVehicles(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.issueDescription.trim() || formData.issueDescription.length < 10) {
      setError('Bitte beschreiben Sie das Problem genauer (mind. 10 Zeichen)')
      return
    }

    if (!formData.needByDate) {
      setError('Bitte wählen Sie ein Datum aus')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/tire-requests/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formData.vehicleId || undefined,
          issueType: formData.issueType,
          issueDescription: formData.issueDescription,
          needByDate: formData.needByDate,
          radiusKm: formData.radiusKm,
          additionalNotes: formData.additionalNotes || undefined
        })
      })

      if (res.ok) {
        router.push('/dashboard/customer?success=repair')
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Erstellen der Anfrage')
      }
    } catch (error) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/dashboard/customer/select-service"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Service-Auswahl
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Reifenreparatur</h1>
          <p className="mt-2 text-lg text-gray-600">
            Schnelle Hilfe bei Reifenschäden - Fremdkörper, Ventilschäden und mehr
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Fahrzeug auswählen */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fahrzeug auswählen <span className="text-sm font-normal text-gray-500">(optional)</span></h2>
            
            {loading ? (
              <div className="p-4 text-center text-gray-600">Lädt Fahrzeuge...</div>
            ) : (
              <div className="space-y-4">
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Wählen Sie hier Ihr Fahrzeug aus (optional)</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </option>
                  ))}
                </select>
                
                {vehicles.length === 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    Sie haben noch keine Fahrzeuge gespeichert. Sie können die Anfrage auch ohne Fahrzeug erstellen oder{' '}
                    <Link href="/dashboard/customer/vehicles" className="font-medium underline">
                      ein Fahrzeug hinzufügen
                    </Link>.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Art des Problems */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Art des Problems</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.issueType === 'puncture' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="issueType"
                  value="puncture"
                  checked={formData.issueType === 'puncture'}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value as any })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">🔩 Fremdkörper im Reifen</p>
                  <p className="text-sm text-gray-600">Nagel, Schraube, etc.</p>
                </div>
              </label>

              <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.issueType === 'valve' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="issueType"
                  value="valve"
                  checked={formData.issueType === 'valve'}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value as any })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">⚙️ Ventilschaden</p>
                  <p className="text-sm text-gray-600">Ventil undicht</p>
                </div>
              </label>

              <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.issueType === 'other' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="issueType"
                  value="other"
                  checked={formData.issueType === 'other'}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value as any })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="font-semibold text-gray-900">❓ Sonstiges</p>
                  <p className="text-sm text-gray-600">Anderes Problem</p>
                </div>
              </label>
            </div>
          </div>

          {/* Problembeschreibung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung des Problems * <span className="text-xs text-gray-500">(mind. 10 Zeichen)</span>
            </label>
            <textarea
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              rows={4}
              required
              placeholder="Beschreiben Sie bitte so genau wie möglich, was mit dem Reifen ist..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">{formData.issueDescription.length} Zeichen</p>
          </div>

          {/* Benötigt bis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benötigt bis *
            </label>
            <input
              type="date"
              value={formData.needByDate}
              onChange={(e) => setFormData({ ...formData, needByDate: e.target.value })}
              min={new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              required
              placeholder="Hier Datum auswählen"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Frühestens morgen</p>
          </div>

          {/* Suchradius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suchradius: {formData.radiusKm} km
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={formData.radiusKm}
              onChange={(e) => setFormData({ ...formData, radiusKm: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Zusätzliche Anmerkungen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zusätzliche Anmerkungen (optional)
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              rows={4}
              placeholder="z.B. Dringlichkeit, besondere Umstände..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link
              href="/dashboard/customer/select-service"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Wird erstellt...' : 'Anfrage erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
