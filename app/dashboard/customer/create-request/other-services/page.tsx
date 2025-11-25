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

const SERVICE_OPTIONS = [
  { id: 'rdks', label: 'RDKS anlernen', description: 'Reifendruckkontrollsystem neu programmieren' },
  { id: 'valves', label: 'Ventile tauschen', description: 'Defekte oder alte Ventile ersetzen' },
  { id: 'wheel_wash', label: 'Räderwäsche', description: 'Professionelle Reinigung von Felgen und Reifen' },
  { id: 'tire_storage', label: 'Reifen einlagern', description: 'Sichere Lagerung Ihrer Saisonreifen' },
  { id: 'balancing', label: 'Räder auswuchten', description: 'Unwucht beseitigen für ruhigen Lauf' },
  { id: 'tire_check', label: 'Reifenzustandsprüfung', description: 'Profiltiefe, Alter und Zustand prüfen' },
  { id: 'pressure_check', label: 'Reifendruck prüfen', description: 'Luftdruck kontrollieren und anpassen' },
  { id: 'other', label: 'Sonstiges', description: 'Andere Reifenservices' }
]

export default function OtherServicesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const [formData, setFormData] = useState({
    vehicleId: '',
    services: [] as string[],
    otherServiceDescription: '',
    serviceDescription: '',
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

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.services.length === 0) {
      setError('Bitte wählen Sie mindestens einen Service aus')
      return
    }

    if (formData.services.includes('other') && (!formData.otherServiceDescription.trim() || formData.otherServiceDescription.length < 10)) {
      setError('Bitte beschreiben Sie den gewünschten Service bei "Sonstiges" genauer (mind. 10 Zeichen)')
      return
    }

    if (!formData.serviceDescription.trim() || formData.serviceDescription.length < 10) {
      setError('Bitte beschreiben Sie Ihre Anfrage genauer (mind. 10 Zeichen)')
      return
    }

    if (!formData.needByDate) {
      setError('Bitte wählen Sie ein Datum aus')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const requestData = {
        vehicleId: formData.vehicleId || undefined,
        services: formData.services,
        otherServiceDescription: formData.services.includes('other') ? formData.otherServiceDescription : undefined,
        serviceDescription: formData.serviceDescription,
        needByDate: formData.needByDate,
        radiusKm: formData.radiusKm,
        additionalNotes: formData.additionalNotes || undefined
      }

      const res = await fetch('/api/tire-requests/other-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (res.ok) {
        router.push('/dashboard/customer?success=other-services')
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
          <h1 className="text-4xl font-bold text-gray-900">Sonstige Reifendienste</h1>
          <p className="mt-2 text-lg text-gray-600">
            Zusätzliche Services rund um Ihre Reifen und Räder
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
                <p className="font-semibold mb-1">Zusätzliche Services anfragen</p>
                <p>Wählen Sie alle Services aus, die Sie benötigen. Werkstätten in Ihrer Nähe erstellen Ihnen individuelle Angebote.</p>
              </div>
            </div>
          </div>

          {/* Fahrzeugauswahl */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fahrzeug auswählen <span className="text-sm font-normal text-gray-500">(optional)</span></h2>
            <p className="text-sm text-gray-600 mb-4">
              Sie können ein Fahrzeug auswählen, wenn der Service an einem bestimmten Fahrzeug durchgeführt werden soll
            </p>
            
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

          {/* Service-Auswahl */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Welche Services benötigen Sie?</h2>
            <p className="text-sm text-gray-600 mb-4">Sie können mehrere Services auswählen</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVICE_OPTIONS.map(service => (
                <label
                  key={service.id}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.services.includes(service.id)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{service.label}</p>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sonstiges Beschreibung */}
          {formData.services.includes('other') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung für "Sonstiges" * <span className="text-xs text-gray-500">(mind. 10 Zeichen)</span>
              </label>
              <textarea
                value={formData.otherServiceDescription}
                onChange={(e) => setFormData({ ...formData, otherServiceDescription: e.target.value })}
                rows={3}
                placeholder="Bitte beschreiben Sie den gewünschten Service..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">{formData.otherServiceDescription.length} Zeichen</p>
            </div>
          )}

          {/* Service-Beschreibung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allgemeine Beschreibung Ihrer Anfrage * <span className="text-xs text-gray-500">(mind. 10 Zeichen)</span>
            </label>
            <textarea
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              rows={4}
              required
              placeholder="Beschreiben Sie bitte, was genau gemacht werden soll und worauf zu achten ist..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">{formData.serviceDescription.length} Zeichen</p>
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
              placeholder="Wählen Sie ein Datum"
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
              placeholder="Weitere Wünsche oder Informationen..."
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
              disabled={submitting || formData.services.length === 0}
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
