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
  acceptsMountingOnly: boolean | null
  mountingOnlySurcharge: number | null
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

const serviceTypeUrls: { [key: string]: string } = {
  TIRE_CHANGE: '/services/reifenwechsel',
  WHEEL_CHANGE: '/services/raederwechsel',
  TIRE_REPAIR: '/services/reifenreparatur',
  MOTORCYCLE_TIRE: '/services/motorradreifen',
  ALIGNMENT_BOTH: '/services/achsvermessung',
  CLIMATE_SERVICE: '/services/klimaservice'
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [refrigerantPrice, setRefrigerantPrice] = useState<string>('')
  const [runFlatSurcharge, setRunFlatSurcharge] = useState<string>('')
  const [disposalFee, setDisposalFee] = useState<string>('')
  
  // Nur Montage (TIRE_CHANGE): Kunde bringt eigene Reifen mit
  const [acceptsMountingOnly, setAcceptsMountingOnly] = useState<boolean>(true)
  const [mountingOnlySurcharge, setMountingOnlySurcharge] = useState<string>('0')
  
  // Package form state
  const [packages, setPackages] = useState<{ [key: string]: { price: string; duration: string; active: boolean } }>({})
  
  // Tire Change Pricing by Rim Size (13-24 Zoll)
  interface TireChangePricingEntry {
    pricePerTire: string
    durationPerTire: string
    isActive: boolean
  }
  const [tireChangePricing, setTireChangePricing] = useState<{ [rimSize: number]: TireChangePricingEntry }>({})
  const [tireChangePricingTemplate, setTireChangePricingTemplate] = useState({ pricePerTire: '', durationPerTire: '15' })
  const [savingTireChangePricing, setSavingTireChangePricing] = useState(false)

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

  const fetchTireChangePricing = async () => {
    try {
      const response = await fetch('/api/workshop/tire-change-pricing')
      if (response.ok) {
        const data = await response.json()
        const pricingMap: { [rimSize: number]: TireChangePricingEntry } = {}
        // Initialize all sizes 13-23
        for (let s = 13; s <= 23; s++) {
          pricingMap[s] = { pricePerTire: '', durationPerTire: '15', isActive: false }
        }
        // Override with saved values
        if (data.pricing) {
          for (const entry of data.pricing) {
            pricingMap[entry.rimSize] = {
              pricePerTire: entry.pricePerTire.toString(),
              durationPerTire: entry.durationPerTire.toString(),
              isActive: entry.isActive
            }
          }
        }
        setTireChangePricing(pricingMap)
      }
    } catch (error) {
      console.error('Error fetching tire change pricing:', error)
    }
  }

  const initializeTireChangePricing = () => {
    const pricingMap: { [rimSize: number]: TireChangePricingEntry } = {}
    for (let s = 13; s <= 23; s++) {
      pricingMap[s] = { pricePerTire: '', durationPerTire: '15', isActive: false }
    }
    setTireChangePricing(pricingMap)
  }

  const applyTemplateToAllSizes = () => {
    const newPricing = { ...tireChangePricing }
    for (let s = 13; s <= 23; s++) {
      newPricing[s] = {
        pricePerTire: tireChangePricingTemplate.pricePerTire,
        durationPerTire: tireChangePricingTemplate.durationPerTire,
        isActive: true
      }
    }
    setTireChangePricing(newPricing)
  }

  const saveTireChangePricing = async () => {
    setSavingTireChangePricing(true)
    try {
      const pricingArray = Object.entries(tireChangePricing)
        .filter(([_, entry]) => entry.isActive && entry.pricePerTire)
        .map(([rimSize, entry]) => ({
          rimSize: parseInt(rimSize),
          pricePerTire: parseFloat(entry.pricePerTire),
          durationPerTire: parseInt(entry.durationPerTire) || 15,
          isActive: entry.isActive
        }))

      const response = await fetch('/api/workshop/tire-change-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing: pricingArray })
      })

      if (!response.ok) {
        throw new Error('Failed to save tire change pricing')
      }
      return true
    } catch (error) {
      console.error('Error saving tire change pricing:', error)
      return false
    } finally {
      setSavingTireChangePricing(false)
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
    
    // Initialize TIRE_CHANGE with rim size pricing
    if (serviceType === 'TIRE_CHANGE') {
      initializeTireChangePricing()
      setPackages({
        directBooking: { price: '', duration: '', active: true }
      })
      return
    }
    
    // Initialize WHEEL_CHANGE with simple structure
    if (serviceType === 'WHEEL_CHANGE') {
      setPackages({
        base: { price: '', duration: '60', active: true },
        balancing: { price: '', duration: '5', active: false },
        storage: { price: '', duration: '0', active: false },
        washing: { price: '', duration: '0', active: false },
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
      // Prepare packages data (skip for WHEEL_CHANGE and TIRE_CHANGE - they have custom logic)
      const packagesData = (selectedServiceType === 'WHEEL_CHANGE' || selectedServiceType === 'TIRE_CHANGE')
        ? [] 
        : Object.entries(packages)
            .filter(([type, pkg]) => pkg.active && pkg.price && (pkg.duration || type === 'disposal'))
            .map(([type, pkg]) => {
              const config = packageConfigurations[selectedServiceType]?.find(p => p.type === type)
              return {
                packageType: type,
                name: config?.name || type,
                description: config?.description || null,
                price: parseFloat(pkg.price),
                durationMinutes: type === 'disposal' ? 0 : parseInt(pkg.duration),
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
            name: 'Auswuchten',
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
            name: 'Einlagerung',
            price: basePrice + storagePrice,
            durationMinutes: packages.base?.duration ? parseInt(packages.base.duration) : 60,
            isActive: true
          })
        }
        
        // Add with_washing package if washing is active
        if (packages.washing?.active && packages.washing?.price) {
          const basePrice = packages.base?.price ? parseFloat(packages.base.price) : 0
          const washingPrice = parseFloat(packages.washing.price)
          wheelPackages.push({
            packageType: 'with_washing',
            name: 'Räder waschen',
            price: basePrice + washingPrice,
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
        requestBody.washingPrice = packages.washing?.active && packages.washing?.price ? parseFloat(packages.washing.price) : null
        requestBody.washingAvailable = packages.washing?.active && !!packages.washing?.price
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
        // Nur-Montage settings
        requestBody.acceptsMountingOnly = acceptsMountingOnly
        requestBody.mountingOnlySurcharge = mountingOnlySurcharge ? parseFloat(mountingOnlySurcharge) : 0
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
        // For TIRE_CHANGE: also save rim-size pricing
        if (selectedServiceType === 'TIRE_CHANGE') {
          await saveTireChangePricing()
        }
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
      // Load Nur-Montage settings
      setAcceptsMountingOnly(service.acceptsMountingOnly !== false)
      setMountingOnlySurcharge(service.mountingOnlySurcharge?.toString() || '0')
      // Load rim-size pricing from API
      fetchTireChangePricing()
      setPackages({
        directBooking: { price: '', duration: '', active: service.allowsDirectBooking || false }
      })
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
        washing: {
          price: service.washingPrice?.toString() || '',
          duration: '0',
          active: !!service.washingPrice
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
    setAcceptsMountingOnly(true)
    setMountingOnlySurcharge('0')
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Services verwalten</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Servicepakete mit individuellen Preisen und Dauern</p>
          </div>
          {!showAddForm && availableTypes.length > 0 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Service hinzufügen
            </button>
          )}
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
          <div ref={formRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
            {/* Form Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingService ? 'Service bearbeiten' : 'Neuer Service'}
                  </h2>
                  <p className="text-xs text-primary-100">Kunden können aktivierte Services direkt online buchen</p>
                </div>
              </div>
              <button type="button" onClick={resetForm} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Compact Info Banner */}
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p className="font-medium">Service-Typ wählen → Pakete & Preise konfigurieren → Für Kunden freischalten</p>
                  <p className="text-blue-500 dark:text-blue-400">⚡ Sofortige Online-Buchungen ohne Angebotserstellung</p>
                </div>
              </div>

              {/* Service Type Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Service-Typ *
                </label>
                <select
                  value={selectedServiceType}
                  onChange={(e) => handleServiceTypeChange(e.target.value)}
                  required
                  disabled={!!editingService}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium transition-colors"
                >
                  <option value="">Bitte wählen...</option>
                  {(editingService ? availableServiceTypes : availableTypes).map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label} {type.hasPackages ? '(mit Paketen)' : ''}
                    </option>
                  ))}
                </select>
                {selectedServiceType && serviceTypeUrls[selectedServiceType] && (
                  <a
                    href={`https://www.bereifung24.de${serviceTypeUrls[selectedServiceType]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Was sieht der Kunde? → Service-Beschreibung ansehen
                  </a>
                )}
              </div>

              {/* Refrigerant Price for Climate Service */}
              {selectedServiceType === 'CLIMATE_SERVICE' && (
                <div className="rounded-xl border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-100/60 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                    <span className="text-base">💧</span>
                    <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-300">Kältemittel-Nachfüllung</h3>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Zusatzkosten bei unvollständiger Befüllung — wird dem Kunden transparent angezeigt.</p>
                    <div className="max-w-xs">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Preis pro 100ml (€) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={refrigerantPrice}
                          onChange={(e) => setRefrigerantPrice(e.target.value)}
                          required
                          className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="5.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RunFlat Surcharge and Disposal Fee for Tire Change */}
              {selectedServiceType === 'TIRE_CHANGE' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* RunFlat-Aufpreis */}
                  <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-100/60 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                      <span className="text-sm">🛞</span>
                      <h3 className="text-xs font-bold text-blue-800 dark:text-blue-300">RunFlat-Aufpreis</h3>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Pro Reifen — automatisch dazugerechnet</p>
                      <div className="relative">
                        <input type="number" step="0.01" min="0" value={runFlatSurcharge}
                          onChange={(e) => setRunFlatSurcharge(e.target.value)}
                          className="w-full pl-3 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="5.00" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Optional</p>
                    </div>
                  </div>

                  {/* Altreifenentsorgung */}
                  <div className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-100/60 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                      <span className="text-sm">♻️</span>
                      <h3 className="text-xs font-bold text-green-800 dark:text-green-300">Altreifenentsorgung</h3>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Pro Reifen — wenn Kunde Entsorgung wählt</p>
                      <div className="relative">
                        <input type="number" step="0.01" min="0" value={disposalFee}
                          onChange={(e) => setDisposalFee(e.target.value)}
                          className="w-full pl-3 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="3.00" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Optional</p>
                    </div>
                  </div>

                  {/* Nur Montage */}
                  <div className="rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-orange-100/60 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🔧</span>
                        <h3 className="text-xs font-bold text-orange-800 dark:text-orange-300">Nur Montage</h3>
                      </div>
                      <button type="button" onClick={() => setAcceptsMountingOnly(!acceptsMountingOnly)}
                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${acceptsMountingOnly ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${acceptsMountingOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                        {acceptsMountingOnly ? 'Kunden bringen eigene Reifen mit' : 'Nicht für Nur-Montage angezeigt'}
                      </p>
                      {acceptsMountingOnly ? (
                        <>
                          <div className="relative">
                            <input type="number" step="0.01" min="0" value={mountingOnlySurcharge}
                              onChange={(e) => setMountingOnlySurcharge(e.target.value)}
                              className="w-full pl-3 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500"
                              placeholder="0" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">Aufschlag/Reifen (0 = kein)</p>
                        </>
                      ) : (
                        <p className="text-[10px] text-gray-400">Nur Reifenwechsel mit Kauf</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Wheel Change Simple Configuration */}
              {selectedServiceType === 'WHEEL_CHANGE' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-sm">🔁</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">Räderwechsel konfigurieren</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Basis-Service + optionale Add-Ons</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Basis */}
                    {(() => {
                      const baseActive = packages.base?.active !== false
                      return (
                        <div className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                          baseActive ? 'border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <span>🎡</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">Basis</span>
                            </div>
                            <button type="button" onClick={() => handlePackageChange('base', 'active', !baseActive)}
                              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${baseActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${baseActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            <p className="text-[10px] text-gray-500">4 Kompletträder umstecken</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Preis</label>
                                <div className="relative">
                                  <input type="number" step="0.01" min="0" value={packages.base?.price || ''}
                                    onChange={(e) => handlePackageChange('base', 'price', e.target.value)} required={baseActive} disabled={!baseActive}
                                    className="w-full pl-3 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50" placeholder="55" />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Dauer</label>
                                <div className="relative">
                                  <input type="number" min="1" value={packages.base?.duration || ''}
                                    onChange={(e) => handlePackageChange('base', 'duration', e.target.value)} required={baseActive} disabled={!baseActive}
                                    className="w-full pl-3 pr-9 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50" placeholder="60" />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Min</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Wuchten */}
                    {(() => {
                      const balActive = packages.balancing?.active !== false
                      return (
                        <div className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                          balActive ? 'border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <span>⚖️</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">Wuchten</span>
                            </div>
                            <button type="button" onClick={() => handlePackageChange('balancing', 'active', !balActive)}
                              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${balActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${balActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            <p className="text-[10px] text-gray-500">Pro Rad — wird ×4 multipliziert</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Preis/Rad</label>
                                <div className="relative">
                                  <input type="number" step="0.01" min="0" value={packages.balancing?.price || ''}
                                    onChange={(e) => handlePackageChange('balancing', 'price', e.target.value)} disabled={!balActive}
                                    className="w-full pl-3 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50" placeholder="10" />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Zeit/Rad</label>
                                <div className="relative">
                                  <input type="number" min="0" value={packages.balancing?.duration || ''}
                                    onChange={(e) => handlePackageChange('balancing', 'duration', e.target.value)} disabled={!balActive}
                                    className="w-full pl-3 pr-9 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50" placeholder="5" />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Min</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Einlagerung */}
                    {(() => {
                      const storActive = packages.storage?.active !== false
                      return (
                        <div className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                          storActive ? 'border-green-300 dark:border-green-600 bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <span>📦</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">Einlagerung</span>
                            </div>
                            <button type="button" onClick={() => handlePackageChange('storage', 'active', !storActive)}
                              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${storActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${storActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            <p className="text-[10px] text-gray-500">Pro Saison — keine Extra-Dauer</p>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Preis</label>
                              <div className="relative">
                                <input type="number" step="0.01" min="0" value={packages.storage?.price || ''}
                                  onChange={(e) => handlePackageChange('storage', 'price', e.target.value)} disabled={!storActive}
                                  className="w-full pl-3 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50" placeholder="50" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Räder waschen */}
                    {(() => {
                      const washActive = packages.washing?.active === true
                      return (
                        <div className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                          washActive ? 'border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <span>🧼</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">Räder waschen</span>
                            </div>
                            <button type="button" onClick={() => {
                              const newActive = !washActive
                              handlePackageChange('washing', 'active', newActive)
                              // Auto-fill default price when activating with empty price
                              if (newActive && !packages.washing?.price) {
                                handlePackageChange('washing', 'price', '15')
                              }
                            }}
                              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${washActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${washActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            <p className="text-[10px] text-gray-500">Alle Räder werden vor Rückgabe/Einlagerung gewaschen — keine Extra-Dauer</p>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Preis</label>
                              <div className="relative">
                                <input type="number" step="0.01" min="0" value={packages.washing?.price || ''}
                                  onChange={(e) => handlePackageChange('washing', 'price', e.target.value)} disabled={!washActive}
                                  className="w-full pl-3 pr-7 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50" placeholder="15" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Live Calculation */}
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-4 py-3">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">📊 Beispiel-Buchung:</span> Basis {packages.base?.price || '0'} € / {packages.base?.duration || '0'} Min
                      {packages.balancing?.active && (
                        <> + Wuchten 4×{packages.balancing?.price || '0'} € = {(parseFloat(packages.balancing?.price || '0') * 4).toFixed(2)} €</>
                      )}
                      {packages.storage?.active && (
                        <> + Einlagerung {packages.storage?.price || '0'} €</>
                      )}
                      {packages.washing?.active && (
                        <> + Räder waschen {packages.washing?.price || '0'} €</>
                      )}
                      {' → '}
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {(
                          parseFloat(packages.base?.price || '0') +
                          (packages.balancing?.active ? parseFloat(packages.balancing?.price || '0') * 4 : 0) +
                          (packages.storage?.active ? parseFloat(packages.storage?.price || '0') : 0) +
                          (packages.washing?.active ? parseFloat(packages.washing?.price || '0') : 0)
                        ).toFixed(2)} € / {
                          parseInt(packages.base?.duration || '0') +
                          (packages.balancing?.active ? parseInt(packages.balancing?.duration || '0') * 4 : 0)
                        } Min
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* TIRE_CHANGE: Rim-Size Pricing Configuration */}
              {selectedServiceType === 'TIRE_CHANGE' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-base">📏</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">Preise pro Zollgröße</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Preis pro Reifen je Felgengröße — wird bei Buchung × Reifenanzahl (2 oder 4) gerechnet
                      </p>
                    </div>
                  </div>

                  {/* Apply to All Template */}
                  <div className="rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">⚡</span>
                      <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Auf alle Größen anwenden</span>
                    </div>
                    <div className="flex items-end gap-3 flex-wrap">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Preis/Reifen (€)</label>
                        <div className="relative">
                          <input
                            type="number" step="0.01" min="0"
                            value={tireChangePricingTemplate.pricePerTire}
                            onChange={(e) => setTireChangePricingTemplate(t => ({ ...t, pricePerTire: e.target.value }))}
                            className="w-28 pl-3 pr-7 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="25.00"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Dauer/Reifen (Min.)</label>
                        <div className="relative">
                          <input
                            type="number" min="1"
                            value={tireChangePricingTemplate.durationPerTire}
                            onChange={(e) => setTireChangePricingTemplate(t => ({ ...t, durationPerTire: e.target.value }))}
                            className="w-24 pl-3 pr-10 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="15"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Min</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={applyTemplateToAllSizes}
                        disabled={!tireChangePricingTemplate.pricePerTire}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-sm transition-colors"
                      >
                        ✓ Auf alle anwenden
                      </button>
                    </div>
                  </div>

                  {/* Rim Size Grid */}
                  <div className="space-y-1.5">
                    {/* Header */}
                    <div className="grid grid-cols-[60px_1fr_100px_80px_50px] gap-2 px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>Zoll</span>
                      <span></span>
                      <span>Preis/Reifen</span>
                      <span>Dauer/Reifen</span>
                      <span className="text-center">Aktiv</span>
                    </div>
                    {Array.from({ length: 12 }, (_, i) => i + 13).map(rimSize => {
                      const entry = tireChangePricing[rimSize] || { pricePerTire: '', durationPerTire: '15', isActive: false }
                      return (
                        <div
                          key={rimSize}
                          className={`grid grid-cols-[60px_1fr_100px_80px_50px] gap-2 items-center rounded-lg px-3 py-2 transition-all ${
                            entry.isActive
                              ? 'bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 shadow-sm'
                              : 'bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 opacity-60'
                          }`}
                        >
                          <span className={`font-bold text-sm ${entry.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            {rimSize}&quot;
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {rimSize <= 15 ? 'Kleinwagen' : rimSize <= 17 ? 'Mittelklasse' : rimSize <= 19 ? 'Oberklasse' : 'SUV / Luxus'}
                          </span>
                          <div className="relative">
                            <input
                              type="number" step="0.01" min="0"
                              value={entry.pricePerTire}
                              onChange={(e) => setTireChangePricing(prev => ({
                                ...prev,
                                [rimSize]: { ...prev[rimSize], pricePerTire: e.target.value }
                              }))}
                              disabled={!entry.isActive}
                              className="w-full pl-2 pr-6 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                              placeholder="0.00"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number" min="1"
                              value={entry.durationPerTire}
                              onChange={(e) => setTireChangePricing(prev => ({
                                ...prev,
                                [rimSize]: { ...prev[rimSize], durationPerTire: e.target.value }
                              }))}
                              disabled={!entry.isActive}
                              className="w-full pl-2 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                              placeholder="15"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Min</span>
                          </div>
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => setTireChangePricing(prev => ({
                                ...prev,
                                [rimSize]: { ...prev[rimSize], isActive: !entry.isActive }
                              }))}
                              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                                entry.isActive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                entry.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary */}
                  {(() => {
                    const activeSizes = Object.entries(tireChangePricing).filter(([_, e]) => e.isActive && e.pricePerTire)
                    if (activeSizes.length === 0) return null
                    const prices = activeSizes.map(([_, e]) => parseFloat(e.pricePerTire))
                    const minPrice = Math.min(...prices)
                    const maxPrice = Math.max(...prices)
                    return (
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3">
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          <span className="font-semibold">📊 Übersicht:</span>{' '}
                          {activeSizes.length} von 11 Größen aktiv — 
                          Preis/Reifen: {minPrice === maxPrice 
                            ? `${minPrice.toFixed(2).replace('.', ',')} €` 
                            : `${minPrice.toFixed(2).replace('.', ',')} € – ${maxPrice.toFixed(2).replace('.', ',')} €`
                          }
                          {' · '}4 Reifen: {(minPrice * 4).toFixed(2).replace('.', ',')} € – {(maxPrice * 4).toFixed(2).replace('.', ',')} €
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Package Configuration */}
              {hasPackages && selectedServiceType && selectedServiceType !== 'TIRE_CHANGE' && packageConfig.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">Servicepakete konfigurieren</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedServiceType === 'MOTORCYCLE_TIRE' 
                          ? 'Preis pro Reifen — wird bei 2 Reifen automatisch verdoppelt'
                          : 'Aktivierte Pakete können von Kunden direkt gebucht werden'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {packageConfig.filter(pkg => !(selectedServiceType === 'MOTORCYCLE_TIRE' && pkg.type === 'disposal')).map(pkg => {
                      const isActive = packages[pkg.type]?.active !== false
                      return (
                        <div
                          key={pkg.type}
                          className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                            isActive
                              ? 'border-primary-300 dark:border-primary-600 bg-white dark:bg-gray-800 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                          }`}
                        >
                          {/* Package Header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                {pkg.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{pkg.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handlePackageChange(pkg.type, 'active', !isActive)}
                              className={`relative flex-shrink-0 ml-3 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                                isActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                                isActive ? 'translate-x-5' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>

                          {/* Price & Duration Inputs */}
                          <div className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                  Preis (€)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={packages[pkg.type]?.price || ''}
                                    onChange={(e) => handlePackageChange(pkg.type, 'price', e.target.value)}
                                    required={isActive}
                                    disabled={!isActive}
                                    className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:text-gray-400 transition-colors"
                                    placeholder="0.00"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                  Dauer (Min.)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    value={packages[pkg.type]?.duration || ''}
                                    onChange={(e) => handlePackageChange(pkg.type, 'duration', e.target.value)}
                                    required={isActive}
                                    disabled={!isActive}
                                    className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:text-gray-400 transition-colors"
                                    placeholder="0"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Min</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Motorcycle Disposal */}
              {selectedServiceType === 'MOTORCYCLE_TIRE' && (
                <div className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-green-100/60 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                    <span className="text-base">♻️</span>
                    <h3 className="text-sm font-bold text-green-800 dark:text-green-300">Altreifenentsorgung</h3>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Pro Reifen — bei 2 Reifen automatisch verdoppelt</p>
                    <div className="max-w-xs">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Pro Reifen (€)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={packages['disposal']?.price || ''}
                          onChange={(e) => {
                            handlePackageChange('disposal', 'price', e.target.value)
                            if (e.target.value) handlePackageChange('disposal', 'active', true)
                          }}
                          className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="3.50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Optional</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={!selectedServiceType || (
                    selectedServiceType === 'TIRE_CHANGE' 
                      ? Object.values(tireChangePricing).filter(e => e.isActive && e.pricePerTire).length === 0
                      : (hasPackages && Object.values(packages).filter(p => p.active).length === 0)
                  )}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow transition-all"
                >
                  {editingService ? '✓ Aktualisieren' : '+ Hinzufügen'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
              <div className="text-4xl mb-3">📦</div>
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
            services.map(service => {
              const serviceColors: Record<string, { border: string; bg: string; icon: string; iconBg: string }> = {
                TIRE_CHANGE: { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', icon: '🔄', iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
                WHEEL_CHANGE: { border: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-900/10', icon: '🔁', iconBg: 'bg-green-100 dark:bg-green-900/30' },
                TIRE_REPAIR: { border: 'border-l-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10', icon: '🔧', iconBg: 'bg-orange-100 dark:bg-orange-900/30' },
                MOTORCYCLE_TIRE: { border: 'border-l-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10', icon: '🏍️', iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
                ALIGNMENT_BOTH: { border: 'border-l-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10', icon: '📐', iconBg: 'bg-yellow-100 dark:bg-yellow-900/30' },
                CLIMATE_SERVICE: { border: 'border-l-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/10', icon: '❄️', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30' },
              }
              const colors = serviceColors[service.serviceType] || { border: 'border-l-gray-400', bg: 'bg-gray-50', icon: '⚙️', iconBg: 'bg-gray-100' }
              const activePackages = service.servicePackages?.filter(p => p.isActive) || []
              const cheapest = activePackages.length > 0 ? Math.min(...activePackages.map(p => p.price)) : service.basePrice
              const isMenuOpen = openMenuId === service.id

              return (
                <div
                  key={service.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${colors.border} hover:shadow-md transition-shadow overflow-hidden`}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center text-xl`}>
                          {colors.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                            {serviceTypeLabels[service.serviceType] || service.serviceType}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              service.isActive 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {service.isActive ? '● Aktiv' : '○ Inaktiv'}
                            </span>
                            {serviceTypeUrls[service.serviceType] && (
                              <a
                                href={`https://www.bereifung24.de${serviceTypeUrls[service.serviceType]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                title="Kundenansicht dieses Service öffnen"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                Kundenansicht
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3-Dot Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(isMenuOpen ? null : service.id)
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {isMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-20 py-1">
                              <button
                                onClick={() => { handleEdit(service); setOpenMenuId(null) }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Bearbeiten
                              </button>
                              <button
                                onClick={() => { toggleActive(service); setOpenMenuId(null) }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
                              >
                                {service.isActive ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    Deaktivieren
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Aktivieren
                                  </>
                                )}
                              </button>
                              <div className="border-t border-gray-100 dark:border-gray-600 my-1" />
                              <button
                                onClick={() => { handleDelete(service.id); setOpenMenuId(null) }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Löschen
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body — Packages as mini-cards */}
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                    {/* TIRE_CHANGE: Show rim-size pricing info */}
                    {service.serviceType === 'TIRE_CHANGE' ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Preise nach Zollgröße</p>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                          <span className="text-base">📏</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Pro Reifen × Zollgröße (13&quot; – 23&quot;)</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400">Preis wird bei Buchung × Reifenanzahl gerechnet</p>
                          </div>
                          <button
                            onClick={() => handleEdit(service)}
                            className="flex-shrink-0 text-[10px] font-medium text-blue-700 dark:text-blue-300 hover:underline"
                          >
                            Bearbeiten →
                          </button>
                        </div>
                      </div>
                    ) : service.servicePackages && service.servicePackages.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Pakete</p>
                        {(() => {
                          // For WHEEL_CHANGE: find the basic package price to show surcharges
                          const basicPkg = service.serviceType === 'WHEEL_CHANGE' 
                            ? service.servicePackages.find(p => p.packageType === 'basic') 
                            : null
                          const basicPrice = basicPkg ? basicPkg.price : 0
                          const wheelChangeAddOns = ['with_balancing', 'with_storage', 'with_washing']
                          
                          return service.servicePackages.map(pkg => {
                            const isWheelChangeAddOn = service.serviceType === 'WHEEL_CHANGE' && wheelChangeAddOns.includes(pkg.packageType)
                            const displayPrice = isWheelChangeAddOn ? pkg.price - basicPrice : pkg.price
                            const surchargeLabel = isWheelChangeAddOn ? {
                              'with_balancing': 'Auswuchten',
                              'with_storage': 'Einlagerung',
                              'with_washing': 'Räder waschen'
                            }[pkg.packageType] || pkg.name : pkg.name
                            
                            return (
                            <div
                              key={pkg.id}
                              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                                pkg.isActive
                                  ? `${colors.bg} border border-gray-200 dark:border-gray-600`
                                  : 'bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-200 dark:border-gray-600 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  onClick={() => togglePackageActive(service.id, pkg.id, pkg.isActive)}
                                  className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    pkg.isActive
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-300 dark:border-gray-500 hover:border-green-400'
                                  }`}
                                  title={pkg.isActive ? 'Deaktivieren' : 'Aktivieren'}
                                >
                                  {pkg.isActive && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                                <span className={`font-medium truncate ${pkg.isActive ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 line-through'}`}>
                                  {isWheelChangeAddOn ? surchargeLabel : pkg.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                {!isWheelChangeAddOn && (
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{pkg.durationMinutes} Min.</span>
                                )}
                                <span className={`font-bold ${pkg.isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                                  {displayPrice.toFixed(2).replace('.', ',')} €
                                </span>
                              </div>
                            </div>
                            )
                          })
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Einzelservice</span>
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {service.basePrice > 0 ? `${service.basePrice.toFixed(2).replace('.', ',')} €` : 'Auf Anfrage'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Extra Info Footer */}
                  {((service.serviceType === 'TIRE_CHANGE' || service.serviceType === 'MOTORCYCLE_TIRE') && (service.runFlatSurcharge || service.disposalFee)) || 
                   (service.serviceType === 'CLIMATE_SERVICE' && service.refrigerantPricePer100ml) ? (
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {service.runFlatSurcharge && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            RunFlat +{service.runFlatSurcharge.toFixed(2)} €
                          </span>
                        )}
                        {service.disposalFee && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            ♻️ Entsorgung {service.disposalFee.toFixed(2)} €
                          </span>
                        )}
                        {service.refrigerantPricePer100ml && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            💧 Kältemittel {service.refrigerantPricePer100ml.toFixed(2)} €/100ml
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
