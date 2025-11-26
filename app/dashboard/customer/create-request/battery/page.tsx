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
}

export default function BatteryServicePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [identificationMethod, setIdentificationMethod] = useState<'manual' | 'vin' | 'key'>('manual')

  const [formData, setFormData] = useState({
    vehicleId: '',
    vin: '',
    keyNumber: '',
    currentBatteryAh: '',
    currentBatteryCCA: '',
    currentBatteryType: '' as '' | 'lead-acid' | 'efb' | 'agm' | 'lithium',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation based on identification method
    if (identificationMethod === 'vin' && (!formData.vin || formData.vin.length < 17)) {
      setError('Bitte geben Sie die vollständige 17-stellige Fahrgestellnummer an')
      return
    }

    if (identificationMethod === 'key' && !formData.keyNumber) {
      setError('Bitte geben Sie die Schlüsselnummer an')
      return
    }

    if (identificationMethod === 'manual') {
      if (!formData.currentBatteryAh && !formData.currentBatteryType) {
        setError('Bitte geben Sie entweder die Kapazität (Ah) oder den Batterietyp an')
        return
      }
    }

    if (!formData.needByDate) {
      setError('Bitte wählen Sie ein Datum aus')
      return
    }

    if (formData.hasIssues && !formData.issueDescription.trim()) {
      setError('Bitte beschreiben Sie die Probleme mit der Batterie')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/tire-requests/battery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          identificationMethod
        })
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/customer?success=battery')
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
          <h1 className="text-4xl font-bold text-gray-900">Autobatterie Service</h1>
          <p className="mt-2 text-lg text-gray-600">
            Professioneller Batteriewechsel inkl. Registrierung und Anlernung bei modernen Fahrzeugen
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
              <p className="text-sm text-green-800">✓ Batterie-Service-Anfrage erfolgreich erstellt! Werkstätten werden benachrichtigt. Sie werden weitergeleitet...</p>
            </div>
          )}

          {/* Info-Box */}
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Wichtige Information zum Batteriewechsel:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Moderne Fahrzeuge (ab ca. 2010):</strong> Batterie muss nach dem Wechsel elektronisch registriert und angelernt werden</li>
                  <li><strong>Ohne Registrierung:</strong> Lademanagement funktioniert nicht korrekt, verkürzte Batterielebensdauer</li>
                  <li><strong>Start-Stopp-Systeme:</strong> Benötigen spezielle EFB- oder AGM-Batterien (nicht Standard Bleisäure)</li>
                  <li><strong>Batterietyp beachten:</strong> AGM nur durch AGM ersetzen, EFB kann durch AGM ersetzt werden</li>
                  <li><strong>Kapazität:</strong> Neue Batterie sollte mindestens die gleiche Ah-Zahl wie die alte haben</li>
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
          </div>

          {/* Identifikationsmethode */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Batterie-Identifikation</h2>
            <p className="text-sm text-gray-600 mb-4">
              Wählen Sie, wie Sie Ihre benötigte Batterie identifizieren möchten:
            </p>

            <div className="space-y-3 mb-6">
              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                identificationMethod === 'manual' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="identificationMethod"
                    value="manual"
                    checked={identificationMethod === 'manual'}
                    onChange={(e) => setIdentificationMethod(e.target.value as any)}
                    className="mt-1 h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Manuelle Eingabe der aktuellen Batterie</span>
                    <p className="text-sm text-gray-600 mt-1">Sie kennen die Daten Ihrer aktuellen Batterie (Ah, Typ)</p>
                  </div>
                </div>
              </label>

              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                identificationMethod === 'vin' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="identificationMethod"
                    value="vin"
                    checked={identificationMethod === 'vin'}
                    onChange={(e) => setIdentificationMethod(e.target.value as any)}
                    className="mt-1 h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">Über Fahrgestellnummer (VIN)</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">Genaueste Methode</span>
                    </div>
                    <p className="text-sm text-gray-600">Werkstätten können exakte Batterie anhand der FIN ermitteln</p>
                  </div>
                </div>
              </label>

              <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                identificationMethod === 'key' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="identificationMethod"
                    value="key"
                    checked={identificationMethod === 'key'}
                    onChange={(e) => setIdentificationMethod(e.target.value as any)}
                    className="mt-1 h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Über Schlüsselnummer (HSN/TSN)</span>
                    <p className="text-sm text-gray-600 mt-1">Die 4-stellige HSN und 3-stellige TSN aus Ihrem Fahrzeugschein</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Conditional Fields based on identification method */}
            {identificationMethod === 'manual' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kapazität (Ah) <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.currentBatteryAh}
                      onChange={(e) => setFormData({ ...formData, currentBatteryAh: e.target.value })}
                      placeholder="z.B. 70"
                      min="30"
                      max="200"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ampere-Stunden (steht auf der Batterie)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kaltstartleistung (CCA) <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.currentBatteryCCA}
                      onChange={(e) => setFormData({ ...formData, currentBatteryCCA: e.target.value })}
                      placeholder="z.B. 680"
                      min="200"
                      max="1000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Cold Cranking Amps (A)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batterietyp <span className="text-gray-500">(optional)</span>
                  </label>
                  <select
                    value={formData.currentBatteryType}
                    onChange={(e) => setFormData({ ...formData, currentBatteryType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Typ auswählen...</option>
                    <option value="lead-acid">Standard Bleisäure (ältere Fahrzeuge ohne Start-Stopp)</option>
                    <option value="efb">EFB - Enhanced Flooded Battery (einfache Start-Stopp-Systeme)</option>
                    <option value="agm">AGM - Absorbent Glass Mat (moderne Start-Stopp, Rekuperation)</option>
                    <option value="lithium">Lithium-Ionen (Hybride, E-Autos)</option>
                  </select>
                </div>
              </div>
            )}

            {identificationMethod === 'vin' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fahrgestellnummer (VIN) *
                </label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                  placeholder="z.B. WBA12345678901234"
                  required={identificationMethod === 'vin'}
                  minLength={17}
                  maxLength={17}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Die 17-stellige Fahrgestellnummer finden Sie in Ihrem Fahrzeugschein (Feld E) oder am Fahrzeug eingraviert
                </p>
              </div>
            )}

            {identificationMethod === 'key' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schlüsselnummer (HSN/TSN) *
                </label>
                <input
                  type="text"
                  value={formData.keyNumber}
                  onChange={(e) => setFormData({ ...formData, keyNumber: e.target.value.toUpperCase() })}
                  placeholder="z.B. 0588/BGM oder 0005/667"
                  required={identificationMethod === 'key'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                />
                <p className="mt-1 text-xs text-gray-500">
                  HSN (4 Ziffern) und TSN (3 Buchstaben/Ziffern) finden Sie in Ihrem Fahrzeugschein Teil 1 (Felder 2.1 und 2.2)
                </p>
              </div>
            )}
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
              placeholder="z.B. Varta, Bosch, Exide, Banner, Moll, Yuasa"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Geben Sie hier Ihre bevorzugten Marken an. Werkstätten werden versuchen, diese zu verwenden (je nach Verfügbarkeit und Preis)
            </p>
          </div>

          {/* Probleme mit der Batterie */}
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
                Ich habe bereits Probleme mit der Batterie
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
                  placeholder="z.B. Startprobleme morgens, Warnleuchte im Cockpit, Batterie ist älter als 5 Jahre, Motor springt schwer an..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Bitte beschreiben Sie die Symptome möglichst genau
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
              placeholder="z.B. Wunschtermin, Fragen zur Batterieregistrierung, Entsorgung der alten Batterie..."
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
