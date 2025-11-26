'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface ServicePackage {
  id: string
  packageType: string
  name: string
  description: string | null
  price: number
  durationMinutes: number
  isActive: boolean
}

interface Service {
  id: string
  serviceType: string
  basePrice: number
  basePrice4: number | null
  runFlatSurcharge: number | null
  disposalFee: number | null
  balancingPrice: number | null
  storagePrice: number | null
  durationMinutes: number
  durationMinutes4: number | null
  balancingMinutes: number | null
  storageAvailable: boolean | null
  description: string | null
  internalNotes: string | null
  isActive: boolean
  servicePackages: ServicePackage[]
}

const serviceTypeLabels: { [key: string]: string } = {
  TIRE_CHANGE: 'Reifenwechsel',
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_REPAIR: 'Reifenreparatur',
  MOTORCYCLE_TIRE: 'Motorradreifen',
  ALIGNMENT_MEASUREMENT: 'Achsvermessung',
  ALIGNMENT_ADJUSTMENT: 'Achseinstellung',
  ALIGNMENT_BOTH: 'Achsvermessung + Einstellung',
  CLIMATE_SERVICE: 'Klimaservice',
  BRAKE_SERVICE: 'Bremsen-Service',
  BATTERY_SERVICE: 'Batterie-Service',
  OTHER_SERVICES: 'Sonstige Reifendienste'
}

const availableServiceTypes = [
  { value: 'TIRE_CHANGE', label: 'Reifenwechsel', icon: '🔧', hasPackages: false },
  { value: 'WHEEL_CHANGE', label: 'Räderwechsel', icon: '🎡', hasPackages: false },
  { value: 'TIRE_REPAIR', label: 'Reifenreparatur', icon: '🔨', hasPackages: false },
  { value: 'MOTORCYCLE_TIRE', label: 'Motorradreifen', icon: '🏍️', hasPackages: false },
  { value: 'ALIGNMENT_MEASUREMENT', label: 'Achsvermessung', icon: '📏', hasPackages: true },
  { value: 'ALIGNMENT_ADJUSTMENT', label: 'Achseinstellung', icon: '⚙️', hasPackages: true },
  { value: 'ALIGNMENT_BOTH', label: 'Achsvermessung + Einstellung', icon: '🔧📏', hasPackages: true },
  { value: 'CLIMATE_SERVICE', label: 'Klimaservice', icon: '❄️', hasPackages: true },
  { value: 'BRAKE_SERVICE', label: 'Bremsen-Service', icon: '🛑', hasPackages: true },
  { value: 'BATTERY_SERVICE', label: 'Batterie-Service', icon: '🔋', hasPackages: false },
  { value: 'OTHER_SERVICES', label: 'Sonstige Reifendienste', icon: '🛠️', hasPackages: false }
]

// Package configurations for each service type
const packageConfigurations: { [key: string]: { type: string; name: string; description: string }[] } = {
  CLIMATE_SERVICE: [
    { type: 'check', name: 'Klimacheck/Inspektion', description: 'Funktionsprüfung der Klimaanlage' },
    { type: 'basic', name: 'Basic Service', description: 'Desinfektion der Klimaanlage' },
    { type: 'comfort', name: 'Comfort Service', description: 'Desinfektion + Pollenfilter wechseln' },
    { type: 'premium', name: 'Premium Service', description: 'Desinfektion + Pollenfilter + Kältemittel auffüllen' }
  ],
  BRAKE_SERVICE: [
    { type: 'front_pads', name: 'Vorderachse - Bremsbeläge', description: 'Wechsel der Bremsbeläge vorne' },
    { type: 'front_pads_discs', name: 'Vorderachse - Beläge + Scheiben', description: 'Wechsel Bremsbeläge + Bremsscheiben vorne' },
    { type: 'rear_pads', name: 'Hinterachse - Bremsbeläge', description: 'Wechsel der Bremsbeläge hinten' },
    { type: 'rear_pads_discs', name: 'Hinterachse - Beläge + Scheiben', description: 'Wechsel Bremsbeläge + Bremsscheiben hinten' },
    { type: 'rear_pads_discs_handbrake', name: 'Hinterachse - Beläge + Scheiben + Handbremse', description: 'Komplettpaket hinten inkl. Handbremse' }
  ],
  ALIGNMENT_MEASUREMENT: [
    { type: 'measurement_only', name: 'Nur Vermessung', description: 'Achsvermessung ohne Einstellung' },
    { type: 'with_adjustment', name: 'Vermessung + Einstellung', description: 'Achsvermessung mit anschließender Einstellung' }
  ],
  ALIGNMENT_ADJUSTMENT: [
    { type: 'adjustment_only', name: 'Nur Einstellung', description: 'Achseinstellung ohne Vermessung' },
    { type: 'with_measurement', name: 'Einstellung + Vermessung', description: 'Achseinstellung mit Vermessung' }
  ],
  ALIGNMENT_BOTH: [
    { type: 'measurement_only', name: 'Nur Vermessung', description: 'Achsvermessung ohne Einstellung' },
    { type: 'with_adjustment', name: 'Vermessung + Einstellung', description: 'Vollständige Achsvermessung mit Einstellung' },
    { type: 'with_adjustment_inspection', name: 'Vermessung + Einstellung + Inspektion', description: 'Komplett-Service mit Fahrwerksinspektion' }
  ]
}

export default function WorkshopServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedServiceType, setSelectedServiceType] = useState('')
  
  // Package form state
  const [packages, setPackages] = useState<{ [key: string]: { price: string; duration: string; active: boolean } }>({})

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

  const initializePackages = (serviceType: string) => {
    const config = packageConfigurations[serviceType] || []
    const initialPackages: { [key: string]: { price: string; duration: string; active: boolean } } = {}
    
    config.forEach(pkg => {
      initialPackages[pkg.type] = {
        price: '',
        duration: '60',
        active: true
      }
    })
    
    setPackages(initialPackages)
  }

  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceType(serviceType)
    
    // Initialize packages if service type supports them
    const serviceConfig = availableServiceTypes.find(s => s.value === serviceType)
    if (serviceConfig?.hasPackages) {
      initializePackages(serviceType)
    }
  }

  const handlePackageChange = (packageType: string, field: 'price' | 'duration' | 'active', value: string | boolean) => {
    setPackages(prev => ({
      ...prev,
      [packageType]: {
        ...prev[packageType],
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Prepare packages data
      const packagesData = Object.entries(packages)
        .filter(([_, pkg]) => pkg.active && pkg.price && pkg.duration)
        .map(([type, pkg]) => {
          const config = packageConfigurations[selectedServiceType]?.find(p => p.type === type)
          return {
            packageType: type,
            name: config?.name || type,
            description: config?.description || null,
            price: parseFloat(pkg.price),
            durationMinutes: parseInt(pkg.duration),
            isActive: pkg.active
          }
        })

      const url = editingService 
        ? `/api/workshop/services/${editingService.id}`
        : '/api/workshop/services'
      
      const response = await fetch(url, {
        method: editingService ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: selectedServiceType,
          isActive: true,
          packages: packagesData.length > 0 ? packagesData : undefined,
          // For non-package services, include basic pricing
          basePrice: packagesData.length === 0 ? 0 : undefined,
          durationMinutes: packagesData.length === 0 ? 60 : undefined
        })
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
    setSelectedServiceType(service.serviceType)
    
    // Load existing packages
    if (service.servicePackages && service.servicePackages.length > 0) {
      const loadedPackages: { [key: string]: { price: string; duration: string; active: boolean } } = {}
      service.servicePackages.forEach(pkg => {
        loadedPackages[pkg.packageType] = {
          price: pkg.price.toString(),
          duration: pkg.durationMinutes.toString(),
          active: pkg.isActive
        }
      })
      setPackages(loadedPackages)
    } else {
      initializePackages(service.serviceType)
    }
    
    setShowAddForm(true)
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
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
        if (editingService?.id === id) {
          resetForm()
        }
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

  const togglePackageActive = async (serviceId: string, packageId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/workshop/services/${serviceId}/packages/${packageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      })

      if (response.ok) {
        fetchServices()
      }
    } catch (error) {
      console.error('Error toggling package:', error)
    }
  }

  const resetForm = () => {
    setSelectedServiceType('')
    setPackages({})
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

  const serviceConfig = availableServiceTypes.find(s => s.value === selectedServiceType)
  const hasPackages = serviceConfig?.hasPackages || false
  const packageConfig = packageConfigurations[selectedServiceType] || []

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
              <p className="mt-1 text-sm text-gray-600">Konfigurieren Sie Ihre Servicepakete mit individuellen Preisen und Dauern</p>
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
          <div ref={formRef} className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">
              {editingService ? 'Service bearbeiten' : 'Neuer Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service-Typ *
                </label>
                <select
                  value={selectedServiceType}
                  onChange={(e) => handleServiceTypeChange(e.target.value)}
                  required
                  disabled={!!editingService}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Bitte wählen...</option>
                  {(editingService ? availableServiceTypes : availableTypes).map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label} {type.hasPackages ? '(mit Paketen)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Configuration */}
              {hasPackages && selectedServiceType && packageConfig.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Servicepakete konfigurieren
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Legen Sie für jedes Paket Preis und Dauer fest. Aktivierte Pakete können von Kunden gewählt werden.
                  </p>

                  <div className="space-y-6">
                    {packageConfig.map(pkg => (
                      <div key={pkg.type} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={packages[pkg.type]?.active !== false}
                            onChange={(e) => handlePackageChange(pkg.type, 'active', e.target.checked)}
                            className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                              <p className="font-semibold text-gray-900">{pkg.name}</p>
                              <p className="text-sm text-gray-600">{pkg.description}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preis (€) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={packages[pkg.type]?.price || ''}
                                onChange={(e) => handlePackageChange(pkg.type, 'price', e.target.value)}
                                required={packages[pkg.type]?.active !== false}
                                disabled={packages[pkg.type]?.active === false}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                placeholder="z.B. 89.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dauer (Min.) *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={packages[pkg.type]?.duration || ''}
                                onChange={(e) => handlePackageChange(pkg.type, 'duration', e.target.value)}
                                required={packages[pkg.type]?.active !== false}
                                disabled={packages[pkg.type]?.active === false}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                placeholder="z.B. 60"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No packages message for simple services */}
              {!hasPackages && selectedServiceType && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ℹ️ Dieser Service-Typ verwendet noch das alte Format ohne Pakete. 
                    Verwenden Sie die alte Service-Verwaltung oder warten Sie auf das Update.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!selectedServiceType || (hasPackages && Object.values(packages).filter(p => p.active).length === 0)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                    
                    {/* Display Packages */}
                    {service.servicePackages && service.servicePackages.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Servicepakete:</p>
                        {service.servicePackages.map(pkg => (
                          <div key={pkg.id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{pkg.name}</p>
                              {pkg.description && (
                                <p className="text-sm text-gray-600">{pkg.description}</p>
                              )}
                              <div className="flex gap-6 mt-2">
                                <span className="text-sm">
                                  <span className="font-medium">Preis:</span> {pkg.price.toFixed(2)} €
                                </span>
                                <span className="text-sm">
                                  <span className="font-medium">Dauer:</span> {pkg.durationMinutes} Min.
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => togglePackageActive(service.id, pkg.id, pkg.isActive)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                pkg.isActive 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {pkg.isActive ? 'Aktiv' : 'Inaktiv'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p>Preis: {service.basePrice.toFixed(2)} € | Dauer: {service.durationMinutes} Min.</p>
                      </div>
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
