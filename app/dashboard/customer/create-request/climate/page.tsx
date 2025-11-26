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

export default function ClimateServicePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: 'check' as 'check' | 'basic' | 'comfort' | 'premium',
    vin: '',
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
    
    if (!formData.needByDate) {
      setError('Bitte wählen Sie ein Datum aus')
      return
    }

    if (formData.hasIssues && !formData.issueDescription.trim()) {
      setError('Bitte beschreiben Sie die Probleme mit der Klimaanlage')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/tire-requests/climate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/customer?success=climate')
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
          <h1 className="text-4xl font-bold text-gray-900">Klimaservice Anfrage</h1>
          <p className="mt-2 text-lg text-gray-600">
            Professionelle Wartung und Reparatur Ihrer Klimaanlage - Von der einfachen Funktionsprüfung bis zum Premium-Service mit Desinfektion
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
              <p className="text-sm text-green-800">✓ Klimaservice-Anfrage erfolgreich erstellt! Werkstätten werden benachrichtigt. Sie werden weitergeleitet...</p>
            </div>
          )}

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

          {/* Service-Typ auswählen */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Service-Paket auswählen *</h2>
            
            <div className="space-y-4">
              <label className={`block p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.serviceType === 'check' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="serviceType"
                    value="check"
                    checked={formData.serviceType === 'check'}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                    className="mt-1 h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-900">Klimacheck</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Günstigste Option</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Umfassende Funktionsprüfung Ihrer Klimaanlage inkl. Sichtprüfung auf Undichtigkeiten und Kühlleistungstest
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Funktionsprüfung der Klimaanlage</li>
                      <li>✓ Sichtkontrolle auf Leckagen</li>
                      <li>✓ Kühlleistungstest</li>
                      <li>✓ Prüfung der Bedienelemente</li>
                    </ul>
                  </div>
                </div>
              </label>

              <label className={`block p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.serviceType === 'basic' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="serviceType"
                    value="basic"
                    checked={formData.serviceType === 'basic'}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                    className="mt-1 h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-900">Basis Service</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Empfohlen alle 2 Jahre</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Komplette Wartung mit Absaugen des alten Kältemittels, Neubefüllung mit Kältemittel und Öl sowie Dichtheitsprüfung
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Alle Leistungen vom Klimacheck</li>
                      <li>✓ Kältemittel absaugen und fachgerecht entsorgen</li>
                      <li>✓ Neubefüllung mit neuem Kältemittel (R134a/R1234yf)</li>
                      <li>✓ Kompressor-Öl auffüllen/erneuern</li>
                      <li>✓ Elektronische Dichtheitsprüfung</li>
                    </ul>
                  </div>
                </div>
              </label>

              <label className={`block p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.serviceType === 'comfort' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="serviceType"
                    value="comfort"
                    checked={formData.serviceType === 'comfort'}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                    className="mt-1 h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-900">Komfort Service</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">Beliebt</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Basis Service erweitert um intensive Dichtheitsprüfung und Lecksuche mit UV-Kontrastmittel
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Alle Leistungen vom Basis Service</li>
                      <li>✓ UV-Kontrastmittel für präzise Lecksuche</li>
                      <li>✓ Intensive Systemprüfung auf kleinste Undichtigkeiten</li>
                      <li>✓ Prüfung aller Schläuche und Verbindungen</li>
                    </ul>
                  </div>
                </div>
              </label>

              <label className={`block p-6 border-2 rounded-lg cursor-pointer transition-all ${
                formData.serviceType === 'premium' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
              }`}>
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    name="serviceType"
                    value="premium"
                    checked={formData.serviceType === 'premium'}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                    className="mt-1 h-5 w-5 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-900">Premium Service</span>
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-semibold rounded-full">Komplett-Paket</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Das Rundum-Sorglos-Paket: Komfort Service plus professionelle Desinfektion und Innenraumfilter-Wechsel für optimale Luftqualität
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✓ Alle Leistungen vom Komfort Service</li>
                      <li>✓ Ozon-Desinfektion oder Ultraschall-Vernebelung</li>
                      <li>✓ Eliminierung von Bakterien, Viren und Pilzen</li>
                      <li>✓ Innenraumfilter/Pollenfilter wechseln</li>
                      <li>✓ Verdampferreinigung gegen unangenehme Gerüche</li>
                      <li>✓ Perfekt bei muffigem Geruch oder Allergien</li>
                    </ul>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Fahrgestellnummer (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fahrgestellnummer (VIN) <span className="text-gray-500">(optional für detaillierten Preis)</span>
            </label>
            <input
              type="text"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
              placeholder="z.B. WBA12345678901234"
              maxLength={17}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
            />
            <p className="mt-1 text-xs text-gray-500">
              Die 17-stellige Fahrgestellnummer ermöglicht eine präzise Preiskalkulation basierend auf Ihrem exakten Fahrzeugmodell und Kältemitteltyp (R134a oder R1234yf)
            </p>
          </div>

          {/* Probleme mit der Klimaanlage */}
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
                Ich habe bereits Probleme mit der Klimaanlage
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
                  placeholder="z.B. Klimaanlage kühlt nicht mehr richtig, muffiger Geruch, laute Geräusche beim Einschalten..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Eine detaillierte Beschreibung hilft den Werkstätten bei der Vorbereitung und Preiskalkulation
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
              placeholder="z.B. Wunschtermin, spezielle Anforderungen..."
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
