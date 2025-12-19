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
  refrigerantPricePer100ml: number | null
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
  ALIGNMENT_BOTH: 'Achsvermessung + Einstellung',
  CLIMATE_SERVICE: 'Klimaservice',
  BRAKE_SERVICE: 'Bremsen-Service',
  BATTERY_SERVICE: 'Batterie-Service',
  OTHER_SERVICES: 'Sonstige Reifendienste'
}

const availableServiceTypes = [
  { value: 'TIRE_CHANGE', label: 'Reifenwechsel', icon: '', hasPackages: true },
  { value: 'WHEEL_CHANGE', label: 'Räder umstecken', icon: '', hasPackages: true },
  { value: 'TIRE_REPAIR', label: 'Reifenreparatur', icon: '', hasPackages: true },
  { value: 'MOTORCYCLE_TIRE', label: 'Motorrad-Reifenwechsel', icon: '', hasPackages: true },
  { value: 'ALIGNMENT_BOTH', label: 'Achsvermessung + Einstellung', icon: '', hasPackages: true },
  { value: 'CLIMATE_SERVICE', label: 'Klimaservice', icon: '', hasPackages: true },
  { value: 'BRAKE_SERVICE', label: 'Bremsen-Service', icon: '', hasPackages: true },
  { value: 'BATTERY_SERVICE', label: 'Batterie-Service', icon: '', hasPackages: true },
  { value: 'OTHER_SERVICES', label: 'Sonstige Reifendienste', icon: '', hasPackages: true }
]

// Package configurations for each service type
// WICHTIG: NUR 2 PAKETE FÜR REIFENWECHSEL! Entsorgung über disposalFee-Feld!
const packageConfigurations: { [key: string]: { type: string; name: string; description: string }[] } = {
  TIRE_CHANGE: [
    { type: 'two_tires', name: '2 Reifen wechseln', description: 'Wechsel von 2 Reifen (z.B. Vorderachse oder Hinterachse)' },
    { type: 'four_tires', name: '4 Reifen wechseln', description: 'Kompletter Reifenwechsel aller 4 Reifen' }
  ],
  // WHEEL_CHANGE uses simple pricing: basePrice + optional balancingPrice + optional storagePrice
  TIRE_REPAIR: [
    { type: 'foreign_object', name: 'Reifenpanne / Loch (Fremdkörper)', description: 'Reparatur nach Fremdkörper (Nagel, Schraube, etc.)' },
    { type: 'valve_damage', name: 'Ventilschaden', description: 'Reparatur bei defektem Ventil' }
  ],
  MOTORCYCLE_TIRE: [
    { type: 'front', name: 'Vorderrad', description: 'Reifenwechsel am ausgebauten Vorderrad (nur Felge)' },
    { type: 'rear', name: 'Hinterrad', description: 'Reifenwechsel am ausgebauten Hinterrad (nur Felge)' },
    { type: 'both', name: 'Beide Räder', description: 'Reifenwechsel an beiden ausgebauten Rädern (nur Felgen)' },
    { type: 'front_disposal', name: 'Vorderrad + Entsorgung', description: 'Vorderrad mit Altreifenentsorgung' },
    { type: 'rear_disposal', name: 'Hinterrad + Entsorgung', description: 'Hinterrad mit Altreifenentsorgung' },
    { type: 'both_disposal', name: 'Beide + Entsorgung', description: 'Beide Räder mit Altreifenentsorgung' }
  ],
  ALIGNMENT_BOTH: [
    { type: 'measurement_front', name: 'Vermessung Vorderachse', description: 'Achsvermessung nur Vorderachse' },
    { type: 'measurement_rear', name: 'Vermessung Hinterachse', description: 'Achsvermessung nur Hinterachse' },
    { type: 'measurement_both', name: 'Vermessung beide Achsen', description: 'Vollständige Achsvermessung vorne + hinten' },
    { type: 'adjustment_front', name: 'Einstellung Vorderachse', description: 'Vermessung + Einstellung Vorderachse' },
    { type: 'adjustment_rear', name: 'Einstellung Hinterachse', description: 'Vermessung + Einstellung Hinterachse' },
    { type: 'adjustment_both', name: 'Einstellung beide Achsen', description: 'Vermessung + Einstellung vorne + hinten' },
    { type: 'full_service', name: 'Komplett-Service', description: 'Vermessung + Einstellung + Fahrwerksinspektion' }
  ],
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
  BATTERY_SERVICE: [
    { type: 'replacement', name: 'Batterie-Wechsel', description: 'Ausbau, Einbau und Registrierung der neuen Batterie' }
  ],
  OTHER_SERVICES: [
    { type: 'rdks', name: 'RDKS-Service', description: 'Reifendruckkontrollsystem prüfen/programmieren' },
    { type: 'valve', name: 'Ventil-Wechsel', description: 'Austausch von Reifenventilen' },
    { type: 'storage', name: 'Reifen-Einlagerung', description: 'Einlagerung von Reifen/Rädern' },
    { type: 'tpms', name: 'TPMS-Programmierung', description: 'Reifendrucksensoren programmieren' }
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
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  const [refrigerantPrice, setRefrigerantPrice] = useState<string>('')
  const [runFlatSurcharge, setRunFlatSurcharge] = useState<string>('')
  const [disposalFee, setDisposalFee] = useState<string>('')
  
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
      // Skip old disposal packages for TIRE_CHANGE
      if (serviceType === 'TIRE_CHANGE' && 
          (pkg.type === 'two_tires_disposal' || pkg.type === 'four_tires_disposal')) {
        return
      }
      
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
    
    // Initialize WHEEL_CHANGE with simple structure
    if (serviceType === 'WHEEL_CHANGE') {
      setPackages({
        base: { price: '', duration: '60', active: true },
        balancing: { price: '', duration: '5', active: true },
        storage: { price: '', duration: '0', active: true }
      })
    } else {
      // Initialize packages if service type supports them
      const serviceConfig = availableServiceTypes.find(s => s.value === serviceType)
      if (serviceConfig?.hasPackages) {
        initializePackages(serviceType)
      }
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
      
      const requestBody: any = {
        serviceType: selectedServiceType,
        isActive: true,
        packages: packagesData.length > 0 ? packagesData : undefined,
        // For non-package services, include basic pricing
        basePrice: packagesData.length === 0 ? 0 : undefined,
        durationMinutes: packagesData.length === 0 ? 60 : undefined
      }

      // WHEEL_CHANGE: Simple pricing with base + optional balancing + optional storage
      if (selectedServiceType === 'WHEEL_CHANGE') {
        requestBody.basePrice = packages.base?.price ? parseFloat(packages.base.price) : 0
        requestBody.durationMinutes = packages.base?.duration ? parseInt(packages.base.duration) : 60
        requestBody.balancingPrice = packages.balancing?.price ? parseFloat(packages.balancing.price) : null
        requestBody.balancingMinutes = packages.balancing?.duration ? parseInt(packages.balancing.duration) : null
        requestBody.storagePrice = packages.storage?.price ? parseFloat(packages.storage.price) : null
        requestBody.storageAvailable = !!packages.storage?.price
        requestBody.packages = undefined // No packages for WHEEL_CHANGE
      }

      // Add refrigerant price for CLIMATE_SERVICE
      if (selectedServiceType === 'CLIMATE_SERVICE' && refrigerantPrice) {
        requestBody.refrigerantPricePer100ml = parseFloat(refrigerantPrice)
      }

      // Add RunFlat surcharge and disposal fee for TIRE_CHANGE
      if (selectedServiceType === 'TIRE_CHANGE') {
        if (runFlatSurcharge) {
          requestBody.runFlatSurcharge = parseFloat(runFlatSurcharge)
        }
        if (disposalFee) {
          requestBody.disposalFee = parseFloat(disposalFee)
        }
      }
      
      const response = await fetch(url, {
        method: editingService ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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

  const toggleServiceExpand = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setSelectedServiceType(service.serviceType)
    
    // Load refrigerant price for climate service
    if (service.serviceType === 'CLIMATE_SERVICE' && service.refrigerantPricePer100ml) {
      setRefrigerantPrice(service.refrigerantPricePer100ml.toString())
    }

    // Load RunFlat surcharge and disposal fee for tire change
    if (service.serviceType === 'TIRE_CHANGE') {
      if (service.runFlatSurcharge) {
        setRunFlatSurcharge(service.runFlatSurcharge.toString())
      }
      if (service.disposalFee) {
        setDisposalFee(service.disposalFee.toString())
      }
    }
    
    // Load WHEEL_CHANGE simple pricing
    if (service.serviceType === 'WHEEL_CHANGE') {
      setPackages({
        base: { 
          price: service.basePrice?.toString() || '', 
          duration: service.durationMinutes?.toString() || '60', 
          active: true 
        },
        balancing: { 
          price: service.balancingPrice?.toString() || '', 
          duration: service.balancingMinutes?.toString() || '5', 
          active: true 
        },
        storage: { 
          price: service.storagePrice?.toString() || '', 
          duration: '0', 
          active: true 
        }
      })
    }
    // Load existing packages (filter out old disposal packages for TIRE_CHANGE)
    else if (service.servicePackages && service.servicePackages.length > 0) {
      const loadedPackages: { [key: string]: { price: string; duration: string; active: boolean } } = {}
      service.servicePackages.forEach(pkg => {
        // Skip old disposal packages for TIRE_CHANGE
        if (service.serviceType === 'TIRE_CHANGE' && 
            (pkg.packageType === 'two_tires_disposal' || pkg.packageType === 'four_tires_disposal')) {
          return
        }
        
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
    
    // Expand the service when editing
    setExpandedServices(new Set([service.id]))
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
    setRefrigerantPrice('')
    setRunFlatSurcharge('')
    setDisposalFee('')
    setEditingService(null)
    setShowAddForm(false)
    setExpandedServices(new Set())
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

              {/* Refrigerant Price for Climate Service */}
              {selectedServiceType === 'CLIMATE_SERVICE' && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Hinweis zur Kältemittelbefüllung
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Wenn die Klimaanlage nicht voll ist, können zusätzliche Kosten für die Befüllung entstehen.
                  </p>
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preis pro 100ml Kältemittel (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={refrigerantPrice}
                      onChange={(e) => setRefrigerantPrice(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="z.B. 5.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Dieser Preis wird dem Kunden angezeigt
                    </p>
                  </div>
                </div>
              )}

              {/* RunFlat Surcharge and Disposal Fee for Tire Change */}
              {selectedServiceType === 'TIRE_CHANGE' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      RunFlat-Reifen Aufpreis
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Geben Sie den Aufpreis pro Reifen für RunFlat-Reifen an. Dieser wird automatisch beim Angebot dazugerechnet, wenn der Kunde RunFlat-Reifen hat.
                    </p>
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aufpreis pro RunFlat-Reifen (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={runFlatSurcharge}
                        onChange={(e) => setRunFlatSurcharge(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 5.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dieser Aufpreis wird pro Reifen berechnet (optional)
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      ♻️ Altreifenentsorgung
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Geben Sie die Kosten für die Entsorgung pro Altreifen an. Diese werden automatisch berechnet, wenn der Kunde die Entsorgung wünscht.
                    </p>
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entsorgungsgebühr pro Reifen (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={disposalFee}
                        onChange={(e) => setDisposalFee(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 3.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dieser Betrag wird pro zu entsorgendem Reifen berechnet (optional)
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Wheel Change Simple Configuration */}
              {selectedServiceType === 'WHEEL_CHANGE' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      🎡 Räderwechsel Basis-Service
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Geben Sie Preis und Dauer für das reine Umstecken der 4 Komplettäder an.
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Basis-Preis (€) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={packages.base?.price || ''}
                          onChange={(e) => handlePackageChange('base', 'price', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 55.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dauer (Min.) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={packages.base?.duration || ''}
                          onChange={(e) => handlePackageChange('base', 'duration', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 60"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      ⚖️ Wuchten (optional)
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Preis und zusätzliche Dauer pro Rad. Wird automatisch mit 4 multipliziert wenn Kunde Wuchten wählt.
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preis pro Rad (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={packages.balancing?.price || ''}
                          onChange={(e) => handlePackageChange('balancing', 'price', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 10.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Wird × 4 gerechnet</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zeit pro Rad (Min.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={packages.balancing?.duration || ''}
                          onChange={(e) => handlePackageChange('balancing', 'duration', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="z.B. 5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Wird × 4 gerechnet</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Einlagerung (optional)
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Preis für die Einlagerung der abmontierten Räder bis zur nächsten Saison.
                    </p>
                    <div className="max-w-xs">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Einlagerungs-Preis (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={packages.storage?.price || ''}
                        onChange={(e) => handlePackageChange('storage', 'price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="z.B. 50.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Pro Saison (keine Extra-Dauer)</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Beispiel-Berechnung:</strong><br/>
                      Kunde wählt Wuchten + Einlagerung:<br/>
                      • Basis: {packages.base?.price || '0'} € + {packages.base?.duration || '0'} Min<br/>
                      • Wuchten: 4 × {packages.balancing?.price || '0'} € = {(parseFloat(packages.balancing?.price || '0') * 4).toFixed(2)} € + 4 × {packages.balancing?.duration || '0'} Min = {parseInt(packages.balancing?.duration || '0') * 4} Min<br/>
                      • Einlagerung: {packages.storage?.price || '0'} €<br/>
                      <strong>Gesamt: {(
                        parseFloat(packages.base?.price || '0') +
                        parseFloat(packages.balancing?.price || '0') * 4 +
                        parseFloat(packages.storage?.price || '0')
                      ).toFixed(2)} € / {
                        parseInt(packages.base?.duration || '0') +
                        parseInt(packages.balancing?.duration || '0') * 4
                      } Min</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Package Configuration */}
              {hasPackages && selectedServiceType && selectedServiceType !== 'WHEEL_CHANGE' && packageConfig.length > 0 && (
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
                    
                    {/* Refrigerant Price Info for Climate Service */}
                    {service.serviceType === 'CLIMATE_SERVICE' && service.refrigerantPricePer100ml && (
                      <div className="mb-3 text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                        💧 Kältemittel: {service.refrigerantPricePer100ml.toFixed(2)} € / 100ml
                      </div>
                    )}

                    {/* RunFlat Surcharge and Disposal Fee Info for Tire Change */}
                    {service.serviceType === 'TIRE_CHANGE' && (
                      <>
                        {service.runFlatSurcharge && (
                          <div className="mb-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                            RunFlat-Aufpreis: +{service.runFlatSurcharge.toFixed(2)} € pro Reifen
                          </div>
                        )}
                        {service.disposalFee && (
                          <div className="mb-3 text-sm text-gray-700 bg-green-50 p-2 rounded">
                            ♻️ Altreifenentsorgung: {service.disposalFee.toFixed(2)} € pro Reifen
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Display Packages Summary or Details */}
                    {service.servicePackages && service.servicePackages.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">
                            {service.servicePackages.filter(p => p.isActive).length} Servicepakete aktiv
                          </p>
                          <button
                            onClick={() => toggleServiceExpand(service.id)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {expandedServices.has(service.id) ? '▼ Details ausblenden' : '▶ Details anzeigen'}
                          </button>
                        </div>
                        
                        {expandedServices.has(service.id) && (
                          <div className="space-y-2 mt-3">
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
                        )}
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
