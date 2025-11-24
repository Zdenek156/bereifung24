'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Service {
  id: string
  serviceType: string
  basePrice: number
  basePrice4: number | null
  runFlatSurcharge: number | null
  disposalFee: number | null
  wheelSizeSurcharge: any | null
  balancingPrice: number | null
  storagePrice: number | null
  durationMinutes: number
  durationMinutes4: number | null
  balancingMinutes: number | null
  storageAvailable: boolean | null
  description: string | null
  internalNotes: string | null
  isActive: boolean
  priceFor: string | null // '2_TIRES' or '4_TIRES' or 'SINGLE' or 'BOTH'
}

const serviceTypeLabels: { [key: string]: string } = {
  TIRE_CHANGE: 'Reifenwechsel',
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_REPAIR: 'Reifenreparatur',
  MOTORCYCLE_TIRE: 'Motorradreifen',
  ALIGNMENT_MEASUREMENT: 'Achsvermessung',
  ALIGNMENT_ADJUSTMENT: 'Achseinstellung',
  ALIGNMENT_BOTH: 'Achsvermessung + Einstellung'
}

const availableServiceTypes = [
  { value: 'TIRE_CHANGE', label: 'Reifenwechsel', icon: '🔧' },
  { value: 'WHEEL_CHANGE', label: 'Räderwechsel', icon: '🎡' },
  { value: 'TIRE_REPAIR', label: 'Reifenreparatur', icon: '🔨' },
  { value: 'MOTORCYCLE_TIRE', label: 'Motorradreifen', icon: '🏍️' },
  { value: 'ALIGNMENT_MEASUREMENT', label: 'Achsvermessung', icon: '📏' },
  { value: 'ALIGNMENT_ADJUSTMENT', label: 'Achseinstellung', icon: '⚙️' },
  { value: 'ALIGNMENT_BOTH', label: 'Achsvermessung + Einstellung', icon: '🔧📏' }
]

export default function WorkshopServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    serviceType: '',
    basePrice: '',
    basePrice4: '',
    runFlatSurcharge: '',
    disposalFee: '',
    balancingPrice: '',
    storagePrice: '',
    durationMinutes: '60',
    durationMinutes4: '',
    balancingMinutes: '',
    storageAvailable: false,
    description: '',
    internalNotes: '',
    isActive: true,
    priceFor: '4_TIRES'
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }
    fetchServices()
  }, [session, status, router])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/workshop/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingService 
        ? `/api/workshop/services/${editingService.id}`
        : '/api/workshop/services'
      
      const response = await fetch(url, {
        method: editingService ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingService ? 'Service aktualisiert' : 'Service hinzugefügt'
        })
        fetchServices()
        resetForm()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Fehler beim Speichern' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netzwerkfehler' })
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    
    setFormData({
      serviceType: service.serviceType,
      basePrice: service.basePrice.toString(),
      basePrice4: service.basePrice4?.toString() || '',
      runFlatSurcharge: service.runFlatSurcharge?.toString() || '',
      disposalFee: service.disposalFee?.toString() || '',
      balancingPrice: service.balancingPrice?.toString() || '',
      storagePrice: service.storagePrice?.toString() || '',
      durationMinutes: service.durationMinutes.toString(),
      durationMinutes4: service.durationMinutes4?.toString() || '',
      balancingMinutes: service.balancingMinutes?.toString() || '',
      storageAvailable: service.storageAvailable || false,
      description: service.description || '',
      internalNotes: service.internalNotes || '',
      isActive: service.isActive,
      priceFor: service.priceFor || '4_TIRES'
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Service wirklich löschen?')) return

    try {
      const response = await fetch(`/api/workshop/services/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Service gelöscht' })
        fetchServices()
      } else {
        setMessage({ type: 'error', text: 'Fehler beim Löschen' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Netzwerkfehler' })
    }
  }

  const toggleActive = async (service: Service) => {
    try {
      const response = await fetch(`/api/workshop/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive })
      })

      if (response.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Error toggling service:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      serviceType: '',
      basePrice: '',
      basePrice4: '',
      runFlatSurcharge: '',
      disposalFee: '',
      balancingPrice: '',
      storagePrice: '',
      durationMinutes: '60',
      durationMinutes4: '',
      balancingMinutes: '',
      storageAvailable: false,
      description: '',
      internalNotes: '',
      isActive: true,
      priceFor: '4_TIRES'
    })
    setEditingService(null)
    setShowAddForm(false)
  }

  const usedServiceTypes = services.map(s => s.serviceType)
  const availableTypes = availableServiceTypes.filter(t => !usedServiceTypes.includes(t.value))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard/workshop" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
                ← Zurück zum Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Services verwalten</h1>
              <p className="mt-1 text-sm text-gray-600">Preise, Dauer und Optionen für Ihre angebotenen Services</p>
            </div>
            {!showAddForm && availableTypes.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Service hinzufügen
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">
              {editingService ? 'Service bearbeiten' : 'Neuer Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service-Typ *
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    required
                    disabled={!!editingService}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Bitte wählen...</option>
                    {(editingService ? availableServiceTypes : availableTypes).map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reifenwechsel: 2 oder 4 Reifen */}
                {formData.serviceType === 'TIRE_CHANGE' && (
                  <>
                    <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-3">Preise und Dauer für 2 oder 4 Reifen</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preis für 2 Reifen (€) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preis für 4 Reifen (€) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.basePrice4}
                            onChange={(e) => setFormData({ ...formData, basePrice4: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dauer für 2 Reifen (Min.) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dauer für 4 Reifen (Min.) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.durationMinutes4}
                            onChange={(e) => setFormData({ ...formData, durationMinutes4: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Runflat-Aufpreis pro Reifen (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.runFlatSurcharge}
                        onChange={(e) => setFormData({ ...formData, runFlatSurcharge: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 5.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Wird pro Reifen berechnet</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entsorgungsgebühr pro Reifen (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.disposalFee}
                        onChange={(e) => setFormData({ ...formData, disposalFee: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 3.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Wird pro Reifen berechnet</p>
                    </div>
                  </>
                )}

                {/* Motorradreifen: 1 oder 2 Reifen */}
                {formData.serviceType === 'MOTORCYCLE_TIRE' && (
                  <>
                    <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-3">Preise und Dauer für 1 oder 2 Reifen</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preis für 1 Reifen (€) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preis für 2 Reifen (€) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.basePrice4}
                            onChange={(e) => setFormData({ ...formData, basePrice4: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dauer für 1 Reifen (Min.) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dauer für 2 Reifen (Min.) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.durationMinutes4}
                            onChange={(e) => setFormData({ ...formData, durationMinutes4: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entsorgungsgebühr pro Reifen (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.disposalFee}
                        onChange={(e) => setFormData({ ...formData, disposalFee: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 3.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Wird pro Reifen berechnet</p>
                    </div>
                  </>
                )}

                {/* Räderwechsel: Spezielle Felder */}
                {formData.serviceType === 'WHEEL_CHANGE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grundpreis (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Preis für das Umstecken von 4 Rädern</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dauer (Minuten) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Dauer für das Umstecken ohne zusätzliche Services</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wuchten - Preis pro Rad (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.balancingPrice}
                        onChange={(e) => setFormData({ ...formData, balancingPrice: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 5.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional: Aufpreis wenn Kunde Wuchten wünscht</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wuchten - Zusätzliche Dauer pro Rad (Min.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.balancingMinutes}
                        onChange={(e) => setFormData({ ...formData, balancingMinutes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Zusätzliche Minuten pro Rad für Wuchten</p>
                    </div>
                    <div className="md:col-span-2 border-t pt-4">
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.storageAvailable}
                          onChange={(e) => setFormData({ ...formData, storageAvailable: e.target.checked })}
                          className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                        <div className="ml-3">
                          <span className="block font-medium text-gray-700">Einlagerung verfügbar</span>
                          <span className="block text-sm text-gray-500">Können Sie die abmontierten Räder einlagern?</span>
                        </div>
                      </label>
                    </div>
                    {formData.storageAvailable && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Einlagerungspreis pro Saison (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.storagePrice}
                          onChange={(e) => setFormData({ ...formData, storagePrice: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 50.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Preis für die Einlagerung bis zur nächsten Saison</p>
                      </div>
                    )}
                  </>
                )}

                {/* Alle anderen Services: Standard Preis und Dauer */}
                {!['TIRE_CHANGE', 'MOTORCYCLE_TIRE', 'WHEEL_CHANGE'].includes(formData.serviceType) && formData.serviceType && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preis (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dauer (Minuten) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Wichtig für Kalendereinträge</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Für Kunden sichtbare Beschreibung..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interne Notizen
                </label>
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nur für interne Verwendung..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Service aktiv (für Kunden verfügbar)
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingService ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="space-y-4">
          {services.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">Noch keine Services konfiguriert</p>
              {availableTypes.length > 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Ersten Service hinzufügen
                </button>
              )}
            </div>
          ) : (
            services.map(service => (
              <div key={service.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {serviceTypeLabels[service.serviceType] || service.serviceType}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Reifenwechsel oder Motorradreifen: 2 Preise/Dauern */}
                      {(service.serviceType === 'TIRE_CHANGE' || service.serviceType === 'MOTORCYCLE_TIRE') ? (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">
                              {service.serviceType === 'TIRE_CHANGE' ? 'Preis 2 Reifen' : 'Preis 1 Reifen'}
                            </p>
                            <p className="text-lg font-semibold text-gray-900">{service.basePrice.toFixed(2)} €</p>
                            <p className="text-sm text-gray-600 mt-2">
                              {service.serviceType === 'TIRE_CHANGE' ? 'Preis 4 Reifen' : 'Preis 2 Reifen'}
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {service.basePrice4 ? `${service.basePrice4.toFixed(2)} €` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {service.serviceType === 'TIRE_CHANGE' ? 'Dauer 2 Reifen' : 'Dauer 1 Reifen'}
                            </p>
                            <p className="text-lg font-semibold text-gray-900">{service.durationMinutes} Min.</p>
                            <p className="text-sm text-gray-600 mt-2">
                              {service.serviceType === 'TIRE_CHANGE' ? 'Dauer 4 Reifen' : 'Dauer 2 Reifen'}
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {service.durationMinutes4 ? `${service.durationMinutes4} Min.` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Zuschläge pro Reifen</p>
                            <div className="text-sm text-gray-700">
                              {service.serviceType === 'TIRE_CHANGE' && service.runFlatSurcharge && (
                                <span className="block">+ {service.runFlatSurcharge.toFixed(2)}€ Runflat</span>
                              )}
                              {service.disposalFee && (
                                <span className="block">+ {service.disposalFee.toFixed(2)}€ Entsorgung</span>
                              )}
                              {!service.runFlatSurcharge && !service.disposalFee && (
                                <span className="text-gray-400">Keine</span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Preis</p>
                            <p className="text-lg font-semibold text-gray-900">{service.basePrice.toFixed(2)} €</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Dauer</p>
                            <p className="text-lg font-semibold text-gray-900">{service.durationMinutes} Min.</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Zuschläge</p>
                            <p className="text-sm text-gray-400">Keine</p>
                          </div>
                        </>
                      )}
                    </div>

                    {service.description && (
                      <p className="text-sm text-gray-700 mb-2">{service.description}</p>
                    )}
                    {service.internalNotes && (
                      <p className="text-xs text-gray-500 italic">Intern: {service.internalNotes}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => toggleActive(service)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        service.isActive 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {service.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button
                      onClick={() => handleEdit(service)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
