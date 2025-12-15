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

export default function BrakesServicePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    vehicleId: '',
    vin: '',
    frontAxle: 'none' as 'none' | 'pads' | 'pads-discs',
    rearAxle: 'none' as 'none' | 'pads' | 'pads-discs' | 'pads-discs-handbrake',
    preferredBrands: '',
    hasIssues: false,
    issueDescription: '',
    needByDate: '',
    radiusKm: 25,
    additionalNotes: ''
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles')
      if (res.ok) {
        const data = await res.json()
        setVehicles(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVehicleChange = (vehicleId: string) => {
    setFormData({ ...formData, vehicleId })
    
    if (vehicleId) {
      const selectedVehicle = vehicles.find(v => v.id === vehicleId)
      if (selectedVehicle?.vin) {
        setFormData(prev => ({ ...prev, vehicleId, vin: selectedVehicle.vin! }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vin || formData.vin.length < 17) {
      setError('Bitte geben Sie die vollständige 17-stellige Fahrgestellnummer (VIN) an')
      return
    }

    if (formData.frontAxle === 'none' && formData.rearAxle === 'none') {
      setError('Bitte wählen Sie mindestens eine Achse für den Bremsenwechsel aus')
      return
    }

    if (!formData.needByDate) {
      setError('Bitte wählen Sie ein Datum aus')
      return
    }

    if (formData.hasIssues && !formData.issueDescription.trim()) {
      setError('Bitte beschreiben Sie die Probleme mit den Bremsen')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/tire-requests/brakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/customer?success=brakes')
        }, 2000)
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
          <h1 className="text-4xl font-bold text-gray-900">Bremsen Service Anfrage</h1>
          <p className="mt-2 text-lg text-gray-600">
            Professioneller Bremsenwechsel - Beläge, Scheiben und Handbremse. Ihre Sicherheit ist unsere Priorität.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">✓ Bremsen-Service-Anfrage erfolgreich erstellt! Werkstätten werden benachrichtigt. Sie werden weitergeleitet...</p>
            </div>
          )}

          {/* Info-Box */}
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Wichtige Information zum Bremsenwechsel:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Nach dem Wechsel müssen neue Bremsbeläge eingebremst werden (ca. 200-300 km schonende Fahrweise)</li>
                  <li>Die volle Bremsleistung entwickelt sich erst nach der Einfahrzeit</li>
                  <li>Bei Scheibenwechsel wird empfohlen, immer auch die Beläge zu erneuern</li>
                  <li>Bremsen sollten immer achsweise gewechselt werden (beide Räder gleichzeitig)</li>
                  <li>Die Bremsflüssigkeit sollte alle 2 Jahre gewechselt werden</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fahrzeug auswählen */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fahrzeug auswählen <span className="text-sm font-normal text-gray-500">(optional)</span></h2>
            
            <div className="space-y-4">
              <select
                value={formData.vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
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
          </div>

          {/* Fahrgestellnummer (ERFORDERLICH) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fahrgestellnummer (VIN) *
            </label>
            <input
              type="text"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
              placeholder="z.B. WBA12345678901234"
              required
              minLength={17}
              maxLength={17}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
            />
            <p className="mt-1 text-xs text-gray-500">
              <strong>Erforderlich:</strong> Die 17-stellige Fahrgestellnummer wird für eine exakte Identifikation der Bremsenteile und präzise Preiskalkulation benötigt. Sie finden die VIN in Ihrem Fahrzeugschein (Feld E).
            </p>
          </div>

          {/* Vorderachse */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Vorderachse</h2>
            
            <div className="space-y-3">
              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.frontAxle === 'none' ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="frontAxle"
                    value="none"
                    checked={formData.frontAxle === 'none'}
                    onChange={(e) => setFormData({ ...formData, frontAxle: e.target.value as any })}
                    className="h-5 w-5 text-primary-600"
                  />
                  <span className="font-medium text-gray-900">Kein Service an der Vorderachse</span>
                </div>
              </label>

              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.frontAxle === 'pads' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="frontAxle"
                    value="pads"
                    checked={formData.frontAxle === 'pads'}
                    onChange={(e) => setFormData({ ...formData, frontAxle: e.target.value as any })}
                    className="h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Nur Bremsbeläge wechseln</span>
                    <p className="text-sm text-gray-600 mt-1">Bremsscheiben bleiben verbaut (wenn noch ausreichend Materialstärke vorhanden)</p>
                  </div>
                </div>
              </label>

              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.frontAxle === 'pads-discs' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="frontAxle"
                    value="pads-discs"
                    checked={formData.frontAxle === 'pads-discs'}
                    onChange={(e) => setFormData({ ...formData, frontAxle: e.target.value as any })}
                    className="h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">Bremsbeläge + Bremsscheiben wechseln</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">Empfohlen</span>
                    </div>
                    <p className="text-sm text-gray-600">Kompletter Wechsel für optimale Bremsleistung und Sicherheit</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Hinterachse */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hinterachse</h2>
            
            <div className="space-y-3">
              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.rearAxle === 'none' ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="rearAxle"
                    value="none"
                    checked={formData.rearAxle === 'none'}
                    onChange={(e) => setFormData({ ...formData, rearAxle: e.target.value as any })}
                    className="h-5 w-5 text-primary-600"
                  />
                  <span className="font-medium text-gray-900">Kein Service an der Hinterachse</span>
                </div>
              </label>

              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.rearAxle === 'pads' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="rearAxle"
                    value="pads"
                    checked={formData.rearAxle === 'pads'}
                    onChange={(e) => setFormData({ ...formData, rearAxle: e.target.value as any })}
                    className="h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Nur Bremsbeläge wechseln</span>
                    <p className="text-sm text-gray-600 mt-1">Bremsscheiben bleiben verbaut</p>
                  </div>
                </div>
              </label>

              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.rearAxle === 'pads-discs' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="rearAxle"
                    value="pads-discs"
                    checked={formData.rearAxle === 'pads-discs'}
                    onChange={(e) => setFormData({ ...formData, rearAxle: e.target.value as any })}
                    className="h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Bremsbeläge + Bremsscheiben wechseln</span>
                    <p className="text-sm text-gray-600 mt-1">Kompletter Wechsel für optimale Bremsleistung</p>
                  </div>
                </div>
              </label>

              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.rearAxle === 'pads-discs-handbrake' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="rearAxle"
                    value="pads-discs-handbrake"
                    checked={formData.rearAxle === 'pads-discs-handbrake'}
                    onChange={(e) => setFormData({ ...formData, rearAxle: e.target.value as any })}
                    className="h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">Beläge + Scheiben + Handbremse</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Komplett-Service</span>
                    </div>
                    <p className="text-sm text-gray-600">Inkl. Handbremse nachstellen/erneuern und Seilzüge prüfen</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Hersteller-Präferenz */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bevorzugte Hersteller <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.preferredBrands}
              onChange={(e) => setFormData({ ...formData, preferredBrands: e.target.value })}
              placeholder="z.B. ATE, Brembo, TRW, Bosch, Textar, Zimmermann"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Geben Sie hier Ihre bevorzugten Marken an. Werkstätten werden versuchen, diese zu verwenden (je nach Verfügbarkeit und Preis)
            </p>
          </div>

          {/* Probleme mit den Bremsen */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="hasIssues"
                checked={formData.hasIssues}
                onChange={(e) => setFormData({ ...formData, hasIssues: e.target.checked, issueDescription: e.target.checked ? formData.issueDescription : '' })}
                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="hasIssues" className="text-base font-medium text-gray-900 cursor-pointer">
                Ich habe bereits Probleme mit den Bremsen
              </label>
            </div>

            {formData.hasIssues && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung der Probleme *
                </label>
                <textarea
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  rows={4}
                  required={formData.hasIssues}
                  placeholder="z.B. Quietschende Geräusche beim Bremsen, Vibrationen im Bremspedal, einseitiges Ziehen, verlängerter Bremsweg..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-red-600 font-medium">
                  ⚠️ Bei akuten Bremsproblemen fahren Sie bitte nicht mehr und kontaktieren Sie umgehend eine Werkstatt!
                </p>
              </div>
            )}
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
              placeholder="z.B. Wunschtermin, spezielle Anforderungen, Fragen zur Bremsflüssigkeit..."
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
