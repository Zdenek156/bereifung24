'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DatePicker from '@/components/DatePicker'

interface TimeSlot {
  time: string
  available: boolean
}

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
  durationMinutes: number
  isActive: boolean
  servicePackages?: ServicePackage[]
}

interface Vehicle {
  id: string
  manufacturer: string
  model: string
  licensePlate: string | null
  modelYear: number | null
}

interface Customer {
  id: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  customerType: string
  vehicles?: Vehicle[]
}

export default function CreateAppointmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customer')
  
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('') // 'manual' oder Service-ID
  const [customDuration, setCustomDuration] = useState(60) // Für manuelle Eingabe
  const [services, setServices] = useState<Service[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingServices, setLoadingServices] = useState(true)
  
  // Customer data (loaded from ID or manual input)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  
  // Optionale Felder (nur wenn kein Customer-ID vorhanden)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState('')
  const [notes, setNotes] = useState('')
  const [price, setPrice] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Lade Customer wenn customerId vorhanden
  useEffect(() => {
    if (customerId) {
      loadCustomer()
    }
  }, [customerId])

  // Lade Services beim Start
  useEffect(() => {
    loadServices()
  }, [])

  // Lade verfügbare Zeitslots wenn Datum ausgewählt wurde
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedDate])
  const loadCustomer = async () => {
    if (!customerId) return
    
    setLoadingCustomer(true)
    try {
      const response = await fetch(`/api/workshop/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data.customer)
        
        // Load customer's vehicles
        const vehiclesResponse = await fetch(`/api/workshop/customers/${customerId}/vehicles`)
        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json()
          setCustomer(prev => prev ? { ...prev, vehicles: vehiclesData.vehicles || [] } : null)
        }
      }
    } catch (err) {
      console.error('Error loading customer:', err)
    } finally {
      setLoadingCustomer(false)
    }
  }
  const loadServices = async () => {
    try {
      const response = await fetch('/api/workshop/services')
      if (response.ok) {
        const data = await response.json()
        console.log('Available services:', data.services)
        setServices(data.services || [])
      }
    } catch (err) {
      console.error('Error loading services:', err)
    } finally {
      setLoadingServices(false)
    }
  }

  const loadAvailableSlots = async () => {
    setLoadingSlots(true)
    setError('')
    
    try {
      const response = await fetch(`/api/workshop/available-slots?date=${selectedDate}`)
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der verfügbaren Zeiten')
      }
      
      const data = await response.json()
      setAvailableSlots(data.slots || [])
    } catch (err: any) {
      console.error('Error loading slots:', err)
      setError(err.message || 'Fehler beim Laden der verfügbaren Zeiten')
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTime) {
      setError('Bitte wählen Sie ein Datum und eine Uhrzeit aus')
      return
    }

    if (!selectedServiceId) {
      setError('Bitte wählen Sie einen Service aus')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      // Parse service selection - could be "serviceId" or "serviceId:packageId"
      let serviceId = selectedServiceId
      let packageId = null
      
      if (selectedServiceId.includes(':')) {
        const parts = selectedServiceId.split(':')
        serviceId = parts[0]
        packageId = parts[1]
      }
      
      const response = await fetch('/api/workshop/create-manual-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          serviceId: serviceId === 'manual' ? null : serviceId,
          packageId: packageId, // Include package ID if selected
          customDuration: serviceId === 'manual' ? customDuration : null,
          customerId: customer?.id || null,
          vehicleId: selectedVehicleId || null,
          customerName: customer ? null : (customerName.trim() || null),
          customerPhone: customer ? null : (customerPhone.trim() || null),
          customerEmail: customer ? null : (customerEmail.trim() || null),
          serviceDescription: serviceDescription.trim() || null,
          vehicleInfo: !selectedVehicleId ? (vehicleInfo.trim() || null) : null,
          notes: notes.trim() || null,
          price: price ? parseFloat(price) : null,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen des Termins')
      }
      
      // Erfolgreich - zur Terminübersicht weiterleiten
      router.push('/dashboard/workshop/appointments')
    } catch (err: any) {
      console.error('Error creating appointment:', err)
      setError(err.message || 'Fehler beim Erstellen des Termins')
    } finally {
      setSubmitting(false)
    }
  }

  const minDate = new Date().toISOString().split('T')[0]

  // Map service type enum to German display name
  const getServiceTypeName = (serviceType: string): string => {
    const names: Record<string, string> = {
      'TIRE_CHANGE': 'Reifenwechsel',
      'WHEEL_CHANGE': 'Räderwechsel',
      'TIRE_REPAIR': 'Reifenreparatur',
      'MOTORCYCLE_TIRE': 'Motorradreifen',
      'ALIGNMENT_BOTH': 'Achsvermessung',
      'CLIMATE_SERVICE': 'Klimaservice',
      'BRAKE_SERVICE': 'Bremsen-Service',
      'BATTERY_SERVICE': 'Batterie-Service',
      'OTHER_SERVICES': 'Sonstige Services'
    }
    return names[serviceType] || serviceType
  }

  // Get customer display name
  const getCustomerName = () => {
    if (!customer) return ''
    if (customer.customerType === 'BUSINESS' && customer.companyName) {
      return customer.companyName
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
  }

  // Get customer contact
  const getCustomerContact = () => {
    if (!customer) return ''
    return customer.email || customer.phone || customer.mobile || ''
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/workshop"
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Zurück zum Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Termin erstellen</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Tragen Sie manuell einen neuen Termin ein
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          {/* Customer Info Banner (if customer loaded) */}
          {customer && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Termin für Kunde</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    <strong>{getCustomerName()}</strong>
                    {getCustomerContact() && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">• {getCustomerContact()}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datum & Zeit Auswahl */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datum & Uhrzeit</h2>
              
              {/* Datum */}
              <div>
                <DatePicker
                  selectedDate={selectedDate}
                  onChange={setSelectedDate}
                  minDate={minDate}
                  label="Datum"
                  required
                />
              </div>

              {/* Uhrzeit */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Uhrzeit <span className="text-red-500">*</span>
                  </label>
                  
                  {loadingSlots ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Lade verfügbare Zeiten...</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                            selectedTime === slot.time
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                              : slot.available
                              ? 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      Keine verfügbaren Zeitslots für dieses Datum
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Service-Auswahl */}
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service *
              </label>
              {loadingServices ? (
                <div className="text-center py-2">
                  <span className="text-sm text-gray-500">Lade Services...</span>
                </div>
              ) : (
                <select
                  id="service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Bitte wählen...</option>
                  {services.map((service) => {
                    // Wenn Service Pakete hat, zeige diese als separate Optionen
                    if (service.servicePackages && service.servicePackages.length > 0) {
                      return service.servicePackages
                        .filter(pkg => pkg.isActive)
                        .map(pkg => (
                          <option key={`${service.id}-${pkg.id}`} value={`${service.id}:${pkg.id}`}>
                            {pkg.name} ({pkg.durationMinutes} Min)
                          </option>
                        ))
                    } else {
                      // Wenn Service keine Pakete hat, zeige den Service direkt
                      const serviceTypeName = getServiceTypeName(service.serviceType)
                      return (
                        <option key={service.id} value={service.id}>
                          {serviceTypeName} ({service.durationMinutes} Min)
                        </option>
                      )
                    }
                  })}
                  <option value="manual">➕ Manuelle Eingabe</option>
                </select>
              )}
            </div>

            {/* Manuelle Dauer-Eingabe (nur wenn "Manuelle Eingabe" gewählt) */}
            {selectedServiceId === 'manual' && (
              <div>
                <label htmlFor="customDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dauer in Minuten *
                </label>
                <input
                  type="number"
                  id="customDuration"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="z.B. 60"
                  required
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Empfohlen: Vielfache von 15 Minuten
                </p>
              </div>
            )}

            {/* Vehicle Selection (if customer has vehicles) */}
            {customer && customer.vehicles && customer.vehicles.length > 0 && (
              <div>
                <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fahrzeug
                </label>
                <select
                  id="vehicle"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Kein Fahrzeug ausgewählt</option>
                  {customer.vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.manufacturer} {vehicle.model}
                      {vehicle.licensePlate && ` (${vehicle.licensePlate})`}
                      {vehicle.modelYear && ` - ${vehicle.modelYear}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preis
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">€</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Geschätzter Preis für diesen Service
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Zusätzliche Informationen <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
              </h2>

              {/* Kunden-Informationen (nur wenn kein Customer geladen) */}
              {!customer && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Kundeninformationen</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Max Mustermann"
                      />
                    </div>

                    <div>
                      <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+49 123 456789"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        E-Mail
                      </label>
                      <input
                        type="email"
                        id="customerEmail"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="max@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Service-Informationen */}
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Service-Informationen</h3>
                
                <div>
                  <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service-Beschreibung
                  </label>
                  <textarea
                    id="serviceDescription"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="z.B. Reifenwechsel, Ölwechsel, Inspektion..."
                  />
                </div>
              </div>

              {/* Fahrzeug-Informationen (nur wenn kein Fahrzeug ausgewählt) */}
              {!selectedVehicleId && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Fahrzeuginformationen</h3>
                  
                  <div>
                    <label htmlFor="vehicleInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fahrzeug
                    </label>
                    <input
                      type="text"
                      id="vehicleInfo"
                      value={vehicleInfo}
                      onChange={(e) => setVehicleInfo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. VW Golf, B-AB 1234 oder Hersteller/Modell"
                    />
                  </div>
                </div>
              )}

              {/* Notizen */}
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notizen</h3>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interne Notizen
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Zusätzliche Informationen oder Hinweise..."
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/dashboard/workshop/appointments"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </Link>
              <button
                type="submit"
                disabled={submitting || !selectedDate || !selectedTime}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Wird erstellt...
                  </>
                ) : (
                  'Termin erstellen'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
