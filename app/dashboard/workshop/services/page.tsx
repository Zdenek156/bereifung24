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
  allowsDirectBooking: boolean | null
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
  CLIMATE_SERVICE: 'Klimaservice'
}

const availableServiceTypes = [
  { value: 'TIRE_CHANGE', label: 'Reifenwechsel', icon: '', hasPackages: true },
  { value: 'WHEEL_CHANGE', label: 'Räder umstecken', icon: '', hasPackages: false },
  { value: 'TIRE_REPAIR', label: 'Reifenreparatur', icon: '', hasPackages: true },
  { value: 'MOTORCYCLE_TIRE', label: 'Motorrad-Reifenwechsel', icon: '', hasPackages: true },
  { value: 'ALIGNMENT_BOTH', label: 'Achsvermessung + Einstellung', icon: '', hasPackages: true },
  { value: 'CLIMATE_SERVICE', label: 'Klimaservice', icon: '', hasPackages: true }
]

// Package configurations for each service type
// WICHTIG: NUR 2 PAKETE FÜR REIFENWECHSEL! Entsorgung über disposalFee-Feld!
const packageConfigurations: { [key: string]: { type: string; name: string; description: string }[] } = {
  TIRE_CHANGE: [
    { type: 'two_tires', name: '2 Reifen wechseln', description: 'Wechsel von 2 Reifen (z.B. Vorderachse oder Hinterachse)' },
    { type: 'four_tires', name: '4 Reifen wechseln', description: 'Kompletter Reifenwechsel aller 4 Reifen' }
  ],
  WHEEL_CHANGE: [
    { type: 'basic', name: 'Räder umstecken (Basis)', description: 'Einfaches Umstecken der Räder' },
    { type: 'with_balancing', name: 'Räder umstecken + Wuchten', description: 'Räder umstecken inklusive Wuchten aller 4 Räder' }
  ],
  TIRE_REPAIR: [
    { type: 'foreign_object', name: 'Reifenpanne / Loch (Fremdkörper)', description: 'Reparatur nach Fremdkörper (Nagel, Schraube, etc.)' },
    { type: 'valve_damage', name: 'Ventilschaden', description: 'Reparatur bei defektem Ventil' }
  ],
  MOTORCYCLE_TIRE: [
    { type: 'front', name: 'Vorderrad', description: 'Reifenwechsel am ausgebauten Vorderrad (nur Felge)' },
    { type: 'rear', name: 'Hinterrad', description: 'Reifenwechsel am ausgebauten Hinterrad (nur Felge)' },
    { type: 'disposal', name: 'Altreifenentsorgung', description: 'Umweltgerechte Entsorgung pro Reifen (wird bei 2 Reifen automatisch verdoppelt)' }
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
    
    // Add directBooking option for all services with packages
    initialPackages['directBooking'] = { price: '', duration: '', active: false }
    
    setPackages(initialPackages)
  }

  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceType(serviceType)
    
    // Initialize WHEEL_CHANGE with simple structure
    if (serviceType === 'WHEEL_CHANGE') {
      setPackages({
        base: { price: '', duration: '60', active: true },
        balancing: { price: '', duration: '5', active: false },
        storage: { price: '', duration: '0', active: false },
        directBooking: { price: '', duration: '', active: false }
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
    
    console.log('💾 [SAVE] Starting save process...', {
      selectedServiceType,
      packages,
      editingService: editingService?.id
    })
    
    try {
      // Prepare packages data (skip for WHEEL_CHANGE - it has custom logic)
      const packagesData = selectedServiceType === 'WHEEL_CHANGE' 
        ? [] 
        : Object.entries(packages)
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

      console.log('📦 [SAVE] Initial requestBody:', {
        serviceType: requestBody.serviceType,
        packagesCount: packagesData.length,
        packagesData
      })

      // WHEEL_CHANGE: Create ServicePackages from configuration
      if (selectedServiceType === 'WHEEL_CHANGE') {
        console.log('🔧 [WHEEL_CHANGE] Generating ServicePackages...', {
          hasBase: !!packages.base,
          baseActive: packages.base?.active,
          hasBalancing: !!packages.balancing,
          balancingActive: packages.balancing?.active,
          hasStorage: !!packages.storage,
          storageActive: packages.storage?.active
        })
        
        // Only save if base service is active
        if (!packages.base?.active) {
          alert('Bitte aktivieren Sie den Basis-Service!')
          return
        }
        
        const wheelPackages = []
        
        // Always create basic package
        wheelPackages.push({
          packageType: 'basic',
          name: 'Basis-Räderwechsel',
          price: packages.base?.price ? parseFloat(packages.base.price) : 0,
          durationMinutes: packages.base?.duration ? parseInt(packages.base.duration) : 60,
          isActive: true
        })
        
        // Add with_balancing package if balancing is active
        if (packages.balancing?.active && packages.balancing?.price) {
          const basePrice = packages.base?.price ? parseFloat(packages.base.price) : 0
          const balancingPrice = parseFloat(packages.balancing.price)
          wheelPackages.push({
            packageType: 'with_balancing',
            name: 'Mit Auswuchten',
            price: basePrice + (balancingPrice * 4), // Price per wheel * 4 wheels
            durationMinutes: (packages.base?.duration ? parseInt(packages.base.duration) : 60) + 
                           (packages.balancing?.duration ? parseInt(packages.balancing.duration) * 4 : 0),
            isActive: true
          })
        }
        
        // Add with_storage package if storage is active
        if (packages.storage?.active && packages.storage?.price) {
          const basePrice = packages.base?.price ? parseFloat(packages.base.price) : 0
          const storagePrice = parseFloat(packages.storage.price)
          wheelPackages.push({
            packageType: 'with_storage',
            name: 'Mit Einlagerung',
            price: basePrice + storagePrice,
            durationMinutes: packages.base?.duration ? parseInt(packages.base.duration) : 60,
            isActive: true
          })
        }
        
        requestBody.packages = wheelPackages
        console.log('✅ [WHEEL_CHANGE] Generated packages:', wheelPackages)
        requestBody.allowsDirectBooking = true
        
        // Keep legacy fields for backwards compatibility (but packages take priority)
        requestBody.basePrice = packages.base?.price ? parseFloat(packages.base.price) : 0
        requestBody.durationMinutes = packages.base?.duration ? parseInt(packages.base.duration) : 60
        requestBody.balancingPrice = packages.balancing?.active && packages.balancing?.price ? parseFloat(packages.balancing.price) : null
        requestBody.balancingMinutes = packages.balancing?.active && packages.balancing?.duration ? parseInt(packages.balancing.duration) : null
        requestBody.storagePrice = packages.storage?.active && packages.storage?.price ? parseFloat(packages.storage.price) : null
        requestBody.storageAvailable = packages.storage?.active && !!packages.storage?.price
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
        // Add allowsDirectBooking for TIRE_CHANGE (always enabled)
        requestBody.allowsDirectBooking = true
      }

      // Add allowsDirectBooking for other package-based services (always enabled)
      if (['TIRE_REPAIR', 'MOTORCYCLE_TIRE', 'ALIGNMENT_BOTH', 'CLIMATE_SERVICE'].includes(selectedServiceType)) {
        requestBody.allowsDirectBooking = true
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
          active: !!service.balancingPrice 
        },
        storage: { 
          price: service.storagePrice?.toString() || '', 
          duration: '0', 
          active: !!service.storagePrice 
        },
        directBooking: {
          price: '',
          duration: '',
          active: service.allowsDirectBooking || false
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
      // Add directBooking status for package-based services
      loadedPackages['directBooking'] = {
        price: '',
        duration: '',
        active: service.allowsDirectBooking || false
      }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard/workshop" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
                ← Zurück zum Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Services verwalten</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Konfigurieren Sie Ihre Servicepakete mit individuellen Preisen und Dauern</p>
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
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div ref={formRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold dark:text-white mb-6">
              {editingService ? 'Service bearbeiten' : 'Neuer Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informationsbox */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Services konfigurieren für direkte Online-Buchungen</h3>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                      <p className="font-medium">Alle Services, die Sie hier hinzufügen, werden automatisch für Direktbuchungen aktiviert. Kunden können diese Services direkt online buchen und bezahlen.</p>
                      <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li><strong>Wählen Sie einen Service-Typ:</strong> z.B. Reifenwechsel, Klimaservice, Achsvermessung</li>
                        <li><strong>Konfigurieren Sie die Pakete:</strong> Legen Sie Preise und Dauern für jedes Paket fest</li>
                        <li><strong>Aktivieren Sie die gewünschten Pakete:</strong> Nur aktivierte Pakete können von Kunden gebucht werden</li>
                      </ul>
                      <p className="mt-3 text-xs"><strong>⚡ Vorteil:</strong> Sofortige Zahlungen, keine Angebotserstellung mehr nötig, höhere Conversion-Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service-Typ *
                </label>
                <select
                  value={selectedServiceType}
                  onChange={(e) => handleServiceTypeChange(e.target.value)}
                  required
                  disabled={!!editingService}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
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
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
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

              {/* Wheel Change Simple Configuration with Checkboxes */}
              {selectedServiceType === 'WHEEL_CHANGE' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={packages.base?.active !== false}
                        onChange={(e) => handlePackageChange('base', 'active', e.target.checked)}
                        className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          🎡 Räderwechsel Basis-Service
                        </h3>
                        <p className="text-sm text-gray-700">
                          Geben Sie Preis und Dauer für das reine Umstecken der 4 Kompletträder an.
                        </p>
                      </div>
                    </div>
                    {packages.base?.active && (
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
                    )}
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={packages.balancing?.active !== false}
                        onChange={(e) => handlePackageChange('balancing', 'active', e.target.checked)}
                        className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          ⚖️ Wuchten (optional)
                        </h3>
                        <p className="text-sm text-gray-700">
                          Preis und zusätzliche Dauer pro Rad. Wird automatisch mit 4 multipliziert wenn Kunde Wuchten wählt.
                        </p>
                      </div>
                    </div>
                    {packages.balancing?.active && (
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
                    )}
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={packages.storage?.active !== false}
                        onChange={(e) => handlePackageChange('storage', 'active', e.target.checked)}
                        className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          📦 Einlagerung (optional)
                        </h3>
                        <p className="text-sm text-gray-700">
                          Preis für die Einlagerung der abmontierten Räder bis zur nächsten Saison.
                        </p>
                      </div>
                    </div>
                    {packages.storage?.active && (
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
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>Beispiel-Berechnung:</strong><br/>
                      Kunde wählt Wuchten + Einlagerung:<br/>
                      • Basis: {packages.base?.price || '0'} € + {packages.base?.duration || '0'} Min<br/>
                      {packages.balancing?.active && (
                        <>• Wuchten: 4 × {packages.balancing?.price || '0'} € = {(parseFloat(packages.balancing?.price || '0') * 4).toFixed(2)} € + 4 × {packages.balancing?.duration || '0'} Min = {parseInt(packages.balancing?.duration || '0') * 4} Min<br/></>
                      )}
                      {packages.storage?.active && (
                        <>• Einlagerung: {packages.storage?.price || '0'} €<br/></>
                      )}
                      <strong>Gesamt: {(
                        parseFloat(packages.base?.price || '0') +
                        (packages.balancing?.active ? parseFloat(packages.balancing?.price || '0') * 4 : 0) +
                        (packages.storage?.active ? parseFloat(packages.storage?.price || '0') : 0)
                      ).toFixed(2)} € / {
                        parseInt(packages.base?.duration || '0') +
                        (packages.balancing?.active ? parseInt(packages.balancing?.duration || '0') * 4 : 0)
                      } Min</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Package Configuration */}
              {hasPackages && selectedServiceType && packageConfig.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Servicepakete konfigurieren
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {selectedServiceType === 'MOTORCYCLE_TIRE' 
                      ? 'Legen Sie den Preis pro Motorradreifen-Montage fest. Bei 2 Reifen wird der Preis automatisch verdoppelt.'
                      : 'Legen Sie für jedes Paket Preis und Dauer fest. Aktivierte Pakete können von Kunden gewählt werden.'
                    }
                  </p>

                  <div className="space-y-6">
                    {packageConfig.map(pkg => (
                      <div key={pkg.type} className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={packages[pkg.type]?.active !== false}
                            onChange={(e) => handlePackageChange(pkg.type, 'active', e.target.checked)}
                            className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{pkg.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
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

              {/* Motorcycle Disposal Fee */}
              {selectedServiceType === 'MOTORCYCLE_TIRE' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    ♻️ Altreifenentsorgung (Motorrad)
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Geben Sie die Kosten für die Entsorgung pro Motorradreifen an. Diese werden automatisch multipliziert (1x oder 2x).
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
                      placeholder="z.B. 1.50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Dieser Betrag wird pro zu entsorgendem Motorradreifen berechnet (optional)
                    </p>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Noch keine Services konfiguriert</p>
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
              <div key={service.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
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
                      <div className="mb-3 text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        💧 Kältemittel: {service.refrigerantPricePer100ml.toFixed(2)} € / 100ml
                      </div>
                    )}

                    {/* RunFlat Surcharge and Disposal Fee Info for Tire Change */}
                    {service.serviceType === 'TIRE_CHANGE' && (
                      <>
                        {service.runFlatSurcharge && (
                          <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            RunFlat-Aufpreis: +{service.runFlatSurcharge.toFixed(2)} € pro Reifen
                          </div>
                        )}
                        {service.disposalFee && (
                          <div className="mb-3 text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            ♻️ Altreifenentsorgung: {service.disposalFee.toFixed(2)} € pro Reifen
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Display Packages Summary or Details */}
                    {service.servicePackages && service.servicePackages.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                              <div key={pkg.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">{pkg.name}</p>
                                  {pkg.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
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
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/services/${{
                                      WHEEL_CHANGE: 'raederwechsel',
                                      TIRE_CHANGE: 'reifenwechsel',
                                      TIRE_REPAIR: 'reifenreparatur',
                                      MOTORCYCLE_TIRE: 'motorradreifen',
                                      ALIGNMENT_BOTH: 'achsvermessung',
                                      CLIMATE_SERVICE: 'klimaservice'
                                    }[service.serviceType] || '#'}`}
                                    target="_blank"
                                    className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-xs font-medium"
                                    title="Details zu diesem Service anzeigen"
                                  >
                                    ℹ️ Info
                                  </Link>
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
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Einzelservice
                          </p>
                          <button
                            onClick={() => toggleServiceExpand(service.id)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {expandedServices.has(service.id) ? '▼ Details ausblenden' : '▶ Details anzeigen'}
                          </button>
                        </div>
                        {expandedServices.has(service.id) && (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Basispreis:</span>
                                <span className="text-sm">{service.basePrice.toFixed(2)} €</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Dauer:</span>
                                <span className="text-sm">{service.durationMinutes} Min.</span>
                              </div>
                              {service.basePrice4 && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <span className="text-sm font-medium">Preis (4 Räder):</span>
                                  <span className="text-sm">{service.basePrice4.toFixed(2)} €</span>
                                </div>
                              )}
                              {service.durationMinutes4 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Dauer (4 Räder):</span>
                                  <span className="text-sm">{service.durationMinutes4} Min.</span>
                                </div>
                              )}
                              {service.balancingPrice && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <span className="text-sm font-medium">Wuchten:</span>
                                  <span className="text-sm">{service.balancingPrice.toFixed(2)} € ({service.balancingMinutes} Min.)</span>
                                </div>
                              )}
                              {service.storagePrice && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Einlagerung:</span>
                                  <span className="text-sm">{service.storagePrice.toFixed(2)} €</span>
                                </div>
                              )}
                              {service.refrigerantPricePer100ml && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <span className="text-sm font-medium">Kältemittel:</span>
                                  <span className="text-sm">{service.refrigerantPricePer100ml.toFixed(2)} € / 100ml</span>
                                </div>
                              )}
                              {service.runFlatSurcharge && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">RunFlat-Aufpreis:</span>
                                  <span className="text-sm">{service.runFlatSurcharge.toFixed(2)} €</span>
                                </div>
                              )}
                              {service.disposalFee && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Entsorgungsgebühr:</span>
                                  <span className="text-sm">{service.disposalFee.toFixed(2)} €</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
