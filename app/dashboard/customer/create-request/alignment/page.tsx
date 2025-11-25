'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
}

export default function AlignmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    alignmentType: 'full' as 'front' | 'full' | 'four-wheel',
    hasIssues: false,
    issueDescription: '',
    needByDate: '',
    radiusKm: 25,
    additionalNotes: ''
  })

  useEffect(() => {
    fetchVehicles()
    // Set default date (1 day from now for services)
    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 1)
    setFormData(prev => ({ ...prev, needByDate: defaultDate.toISOString().split('T')[0] }))
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

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      setFormData(prev => ({
        ...prev,
        vehicleId: vehicle.id,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        vehicleYear: vehicle.year.toString()
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vehicleMake || !formData.vehicleModel) {
      setError('Bitte geben Sie Fahrzeughersteller und -modell an')
      return
    }

    if (!formData.needByDate) {
      setError('Bitte wählen Sie ein Datum aus')
      return
    }

    if (formData.hasIssues && (!formData.issueDescription || formData.issueDescription.length < 10)) {
      setError('Bitte beschreiben Sie die Probleme genauer (mind. 10 Zeichen)')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const requestData = {
        vehicleId: formData.vehicleId || undefined,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear || undefined,
        alignmentType: formData.alignmentType,
        hasIssues: formData.hasIssues,
        issueDescription: formData.hasIssues ? formData.issueDescription : undefined,
        needByDate: formData.needByDate,
        radiusKm: formData.radiusKm,
        additionalNotes: formData.additionalNotes || undefined
      }

      const res = await fetch('/api/tire-requests/alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (res.ok) {
        router.push('/dashboard/customer?success=alignment')
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
          <h1 className="text-4xl font-bold text-gray-900">Achsvermessung Anfrage</h1>
          <p className="mt-2 text-lg text-gray-600">
            Fahrwerk vermessen und optimal einstellen lassen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Was ist eine Achsvermessung?</p>
                <p>Die Achsvermessung (Spureinstellung) sorgt für optimalen Reifenverschleiß, besseres Fahrverhalten und erhöhte Sicherheit. Empfohlen nach Stoßdämpferwechsel, Unfällen oder bei ungleichmäßigem Reifenverschleiß.</p>
              </div>
            </div>
          </div>

          {/* Fahrzeugauswahl */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fahrzeug auswählen <span className="text-sm font-normal text-gray-500">(optional)</span></h2>
            
            {loading ? (
              <div className="p-4 text-center text-gray-600">Lädt...</div>
            ) : vehicles.length === 0 ? (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 mb-2">Sie haben noch keine Fahrzeuge gespeichert.</p>
                <p className="text-sm text-blue-700 mb-4">Sie können die Anfrage auch ohne Fahrzeugauswahl erstellen.</p>
                <Link
                  href="/dashboard/customer/vehicles"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Fahrzeug hinzufügen
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.vehicleId === vehicle.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      value={vehicle.id}
                      checked={formData.vehicleId === vehicle.id}
                      onChange={(e) => handleVehicleSelect(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-600">Baujahr: {vehicle.year}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Manuelle Eingabe falls kein Fahrzeug */}
          {!formData.vehicleId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fahrzeughersteller *
                </label>
                <input
                  type="text"
                  value={formData.vehicleMake}
                  onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                  required
                  placeholder="z.B. BMW"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modell *
                </label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  required
                  placeholder="z.B. 3er"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Baujahr <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.vehicleYear}
                  onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                  placeholder="z.B. 2020"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Art der Vermessung */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Art der Vermessung</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.alignmentType === 'front' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="alignmentType"
                  value="front"
                  checked={formData.alignmentType === 'front'}
                  onChange={(e) => setFormData({ ...formData, alignmentType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">Vorderachse</p>
                <p className="text-sm text-gray-600 text-center">Nur vorne</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.alignmentType === 'full' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="alignmentType"
                  value="full"
                  checked={formData.alignmentType === 'full'}
                  onChange={(e) => setFormData({ ...formData, alignmentType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">Komplettvermessung</p>
                <p className="text-sm text-gray-600 text-center">Alle Achsen</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.alignmentType === 'four-wheel' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="alignmentType"
                  value="four-wheel"
                  checked={formData.alignmentType === 'four-wheel'}
                  onChange={(e) => setFormData({ ...formData, alignmentType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">4-Rad-Vermessung</p>
                <p className="text-sm text-gray-600 text-center">Präzise 4-Rad</p>
              </label>
            </div>
          </div>

          {/* Probleme */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gibt es Auffälligkeiten?</h2>
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasIssues}
                onChange={(e) => setFormData({ ...formData, hasIssues: e.target.checked, issueDescription: '' })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-gray-900">Ja, ich habe Probleme festgestellt</span>
            </label>

            {formData.hasIssues && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung der Probleme * <span className="text-xs text-gray-500">(mind. 10 Zeichen)</span>
                </label>
                <textarea
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  rows={4}
                  required={formData.hasIssues}
                  placeholder="z.B. Fahrzeug zieht nach links, ungleicher Reifenverschleiß, Lenkrad vibriert..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">{formData.issueDescription.length} Zeichen</p>
              </div>
            )}
          </div>

          {/* Benötigt bis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benötigt bis Datum *
            </label>
            <input
              type="date"
              value={formData.needByDate}
              onChange={(e) => setFormData({ ...formData, needByDate: e.target.value })}
              min={new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              required
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
              placeholder="z.B. kürzlich durchgeführte Reparaturen, Unfall, etc."
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
