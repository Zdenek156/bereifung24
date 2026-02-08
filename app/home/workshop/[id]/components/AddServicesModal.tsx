'use client'

import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import InfoTooltip from '@/app/home/components/InfoTooltip'

interface Service {
  id: string
  type: string
  name: string
  packages: ServicePackage[]
}

interface ServicePackage {
  id: string
  type: string
  name: string
  price: number
  duration: number
  description?: string
}

interface SelectedService {
  serviceId: string
  serviceName: string
  packageId: string
  packageName: string
  price: number
  duration: number
}

interface AddServicesModalProps {
  isOpen: boolean
  onClose: () => void
  workshopId: string
  onServicesSelected: (services: SelectedService[]) => void
  selectedServiceType?: string // The main service from URL (e.g. 'WHEEL_CHANGE')
  additionalSelectedServices?: string[] // Array of service IDs already selected
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  WHEEL_CHANGE: '🔄 Räderwechsel',
  TIRE_CHANGE: '🚗 Reifenwechsel',
  TIRE_REPAIR: '🔧 Reifenreparatur',
  MOTORCYCLE_TIRE: '🏍️ Motorradreifen',
  ALIGNMENT_BOTH: '📏 Achsvermessung',
  CLIMATE_SERVICE: '❄️ Klimaservice',
}

export default function AddServicesModal({
  isOpen,
  onClose,
  workshopId,
  onServicesSelected,
  selectedServiceType,
  additionalSelectedServices = [],
}: AddServicesModalProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackages, setSelectedPackages] = useState<Record<string, string>>({}) // serviceId -> packageId

  useEffect(() => {
    if (isOpen && workshopId) {
      fetchServices()
    }
  }, [isOpen, workshopId])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/workshop/${workshopId}/services/all`)
      if (response.ok) {
        const data = await response.json()
        // Filter out already selected services
        const allServices = data.services || []
        const filteredServices = allServices.filter((service: Service) => {
          // Exclude main service from URL
          if (selectedServiceType && service.type === selectedServiceType) {
            return false
          }
          // Exclude additional selected services
          if (additionalSelectedServices.includes(service.id)) {
            return false
          }
          return true
        })
        setServices(filteredServices)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePackageSelect = (serviceId: string, packageId: string) => {
    setSelectedPackages(prev => ({
      ...prev,
      [serviceId]: packageId
    }))
  }

  const handleConfirm = () => {
    const selected: SelectedService[] = []
    
    Object.entries(selectedPackages).forEach(([serviceId, packageId]) => {
      const service = services.find(s => s.id === serviceId)
      if (!service) return
      
      const pkg = service.packages.find(p => p.id === packageId)
      if (!pkg) return
      
      selected.push({
        serviceId,
        serviceName: SERVICE_TYPE_LABELS[service.type] || service.name,
        packageId,
        packageName: pkg.name,
        price: pkg.price,
        duration: pkg.duration
      })
    })
    
    onServicesSelected(selected)
    onClose()
  }

  const calculateTotal = () => {
    let totalPrice = 0
    let totalDuration = 0
    
    Object.entries(selectedPackages).forEach(([serviceId, packageId]) => {
      const service = services.find(s => s.id === serviceId)
      if (!service) return
      
      const pkg = service.packages.find(p => p.id === packageId)
      if (!pkg) return
      
      totalPrice += pkg.price
      totalDuration += pkg.duration
    })
    
    return { totalPrice, totalDuration }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const { totalPrice, totalDuration } = calculateTotal()
  const hasSelection = Object.keys(selectedPackages).length > 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Weitere Services hinzufügen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Lade Services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Keine weiteren Services verfügbar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {services.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-xl p-4 hover:border-primary-300 transition-colors">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    {SERVICE_TYPE_LABELS[service.type] || service.name}
                  </h3>
                  
                  <div className="space-y-2">
                    {service.packages.map((pkg) => (
                      <label
                        key={pkg.id}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPackages[service.id] === pkg.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`service-${service.id}`}
                          checked={selectedPackages[service.id] === pkg.id}
                          onChange={() => handlePackageSelect(service.id, pkg.id)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{pkg.name}</span>
                              {pkg.description && (
                                <InfoTooltip content={pkg.description} />
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary-600">{formatEUR(pkg.price)}</div>
                              <div className="text-sm text-gray-500">~{pkg.duration} Min.</div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {hasSelection && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Zusätzliche Kosten:</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">{formatEUR(totalPrice)}</div>
                  <div className="text-sm text-gray-500">+{totalDuration} Min.</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasSelection}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-colors ${
                hasSelection
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {hasSelection ? `${Object.keys(selectedPackages).length} Service(s) hinzufügen` : 'Bitte Service wählen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
