'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/DatePicker'
import { loadStripe } from '@stripe/stripe-js'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { 
  Car,
  Wrench,
  MapPin, 
  Loader2,
  Star,
  Clock,
  RefreshCw,
  AlertTriangle,
  Gauge,
  Wind,
  Calendar,
  CreditCard,
  CheckCircle,
  ChevronLeft,
  Check,
  X
} from 'lucide-react'

// Service Configuration
const SERVICE_TYPES = {
  WHEEL_CHANGE: {
    id: 'WHEEL_CHANGE',
    label: 'Räderwechsel',
    icon: RefreshCw,
    description: 'Sommer-/Winterreifen wechseln',
    options: ['balancing', 'storage']
  },
  TIRE_REPAIR: {
    id: 'TIRE_REPAIR',
    label: 'Reifenreparatur',
    icon: Wrench,
    description: 'Reifen flicken und abdichten',
    options: []
  },
  WHEEL_ALIGNMENT: {
    id: 'WHEEL_ALIGNMENT',
    label: 'Achsvermessung',
    icon: Gauge,
    description: 'Spur und Sturz einstellen',
    options: []
  },
  AC_SERVICE: {
    id: 'AC_SERVICE',
    label: 'Klimaanlagen-Service',
    icon: Wind,
    description: 'Wartung und Desinfektion',
    options: []
  }
}

type ServiceType = keyof typeof SERVICE_TYPES

export default function DirectBookingCheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workshopId = searchParams?.get('workshopId') || ''
  
  // Workshop Info
  const [workshop, setWorkshop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Progressive Disclosure Steps
  const [currentStep, setCurrentStep] = useState(1)
  
  // Step 1: Service Selection
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null)
  
  // Step 2: Vehicle Selection
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  
  // Step 3: Date & Time Selection
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean}[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Step 4: Additional Services
  const [hasBalancing, setHasBalancing] = useState(false)
  const [hasStorage, setHasStorage] = useState(false)
  
  // Step 5: Payment
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'PAYPAL'>('STRIPE')
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // Step 6: Confirmation
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)

  // Load workshop data
  useEffect(() => {
    if (!workshopId) return
    
    const fetchWorkshop = async () => {
      try {
        setLoading(true)
        
        // Fetch workshop details
        const workshopResponse = await fetch(`/api/workshop/${workshopId}`)
        if (!workshopResponse.ok) {
          console.error('Failed to load workshop')
          return
        }
        const workshopData = await workshopResponse.json()
        
        // Fetch service pricing
        const serviceType = searchParams?.get('service') || 'WHEEL_CHANGE'
        const servicePricingResponse = await fetch(`/api/workshop/${workshopId}/services/${serviceType}`)
        if (!servicePricingResponse.ok) {
          console.error('Failed to load service pricing')
          return
        }
        const servicePricingData = await servicePricingResponse.json()
        
        // Combine workshop data with service pricing
        setWorkshop({
          ...workshopData,
          basePrice: servicePricingData.basePrice || 0,
          basePrice4: servicePricingData.basePrice4 || 0,
          disposalFee: servicePricingData.disposalFee || 0,
          runFlatSurcharge: servicePricingData.runFlatSurcharge || 0,
          durationMinutes: servicePricingData.durationMinutes || 60,
          totalBalancingPrice: 0, // Will be calculated based on selection
          storagePriceTotal: 0, // Will be calculated based on selection
        })
        
        // Pre-select service from URL
        const serviceParam = searchParams?.get('service') as ServiceType
        if (serviceParam && SERVICE_TYPES[serviceParam]) {
          setSelectedService(serviceParam)
          setCurrentStep(2) // Move to vehicle selection
        }
      } catch (error) {
        console.error('Error loading workshop:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWorkshop()
  }, [workshopId, searchParams])

  // Load vehicles when moving to step 2
  useEffect(() => {
    if (currentStep === 2 && !loadingVehicles && vehicles.length === 0) {
      fetchVehicles()
    }
  }, [currentStep])

  // Load available slots when date selected
  useEffect(() => {
    if (selectedDate && selectedService && selectedVehicle) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedService, selectedVehicle])

  const fetchVehicles = async () => {
    setLoadingVehicles(true)
    try {
      const response = await fetch('/api/customer/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoadingVehicles(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!workshop || !selectedDate || !selectedVehicle || !selectedService) return
    
    setLoadingSlots(true)
    try {
      const response = await fetch('/api/customer/direct-booking/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: workshop.id,
          vehicleId: selectedVehicle.id,
          serviceType: selectedService,
          date: selectedDate
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleServiceSelect = (serviceType: ServiceType) => {
    setSelectedService(serviceType)
    setCurrentStep(2)
  }

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle)
    setCurrentStep(3)
  }

  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time)
    
    // Check if service has options
    const serviceConfig = SERVICE_TYPES[selectedService!]
    if (serviceConfig.options.length > 0) {
      setCurrentStep(4) // Go to additional services
    } else {
      // No additional services, create reservation directly
      await createReservation()
      setCurrentStep(5) // Go to payment
    }
  }

  const handleContinueToPayment = async () => {
    await createReservation()
    setCurrentStep(5)
  }

  const createReservation = async () => {
    if (!workshop || !selectedVehicle || !selectedDate || !selectedTime || !selectedService) return
    
    try {
      const basePrice = workshop.basePrice || 0
      const balancingPrice = hasBalancing ? (workshop.totalBalancingPrice || 0) : 0
      const storagePrice = hasStorage ? (workshop.storagePriceTotal || 0) : 0
      const totalPrice = basePrice + balancingPrice + storagePrice
      
      const response = await fetch('/api/customer/direct-booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: workshop.id,
          vehicleId: selectedVehicle.id,
          serviceType: selectedService,
          date: selectedDate,
          time: selectedTime,
          hasBalancing,
          hasStorage,
          basePrice,
          balancingPrice,
          storagePrice,
          totalPrice
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setReservationId(data.reservationId)
      } else {
        alert('Fehler bei der Reservierung. Bitte versuchen Sie es erneut.')
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      alert('Fehler bei der Reservierung. Bitte versuchen Sie es erneut.')
    }
  }

  const handleStripePayment = async () => {
    if (!reservationId) return
    
    setProcessingPayment(true)
    try {
      const totalAmount = (workshop?.basePrice || 0) + 
        (hasBalancing ? (workshop?.totalBalancingPrice || 0) : 0) +
        (hasStorage ? (workshop?.storagePriceTotal || 0) : 0)
      
      const response = await fetch('/api/payment/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          serviceType: selectedService,
          workshopName: workshop?.name,
          amount: totalAmount
        })
      })

      if (response.ok) {
        const { sessionId } = await response.json()
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        await stripe?.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Stripe error:', error)
      alert('Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handlePayPalApprove = async (data: any) => {
    if (!reservationId) return
    
    setProcessingPayment(true)
    try {
      const response = await fetch('/api/customer/direct-booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          paymentMethod: 'PAYPAL',
          paymentId: data.orderID
        })
      })

      if (response.ok) {
        const booking = await response.json()
        setBookingConfirmation(booking)
        setCurrentStep(6)
      } else if (response.status === 410) {
        alert('Ihre Reservierung ist abgelaufen. Bitte buchen Sie erneut.')
        router.push('/dashboard/customer/direct-booking')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Fehler bei der Buchung. Bitte versuchen Sie es erneut.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Lade Werkstatt-Informationen...</p>
        </div>
      </div>
    )
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Werkstatt nicht gefunden</h2>
          <p className="text-gray-600 mb-6">
            Die angeforderte Werkstatt konnte nicht geladen werden.
          </p>
          <Button onClick={() => router.push('/dashboard/customer/direct-booking')}>
            Zurück zur Suche
          </Button>
        </Card>
      </div>
    )
  }

  // Calculate total price (only after workshop is loaded)
  const totalPrice = (workshop?.basePrice || 0) + 
    (hasBalancing ? (workshop?.totalBalancingPrice || 0) : 0) +
    (hasStorage ? (workshop?.storagePriceTotal || 0) : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/customer/direct-booking')}
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Zurück zur Suche
              </Button>
              <div className="border-l pl-4">
                <h1 className="text-xl font-bold">{workshop.companyName}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{workshop.street}, {workshop.postalCode} {workshop.city}</span>
                  {workshop.averageRating > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{workshop.averageRating.toFixed(1)} ({workshop.reviewCount} Bewertungen)</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[
              { step: 1, label: 'Service', completed: currentStep > 1 },
              { step: 2, label: 'Fahrzeug', completed: currentStep > 2 },
              { step: 3, label: 'Termin', completed: currentStep > 3 },
              { step: 4, label: 'Zusatzleistungen', completed: currentStep > 4 },
              { step: 5, label: 'Zahlung', completed: currentStep > 5 },
              { step: 6, label: 'Bestätigung', completed: currentStep > 6 }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${item.completed ? 'bg-green-500 text-white' : 
                      item.step === currentStep ? 'bg-blue-600 text-white' : 
                      'bg-gray-200 text-gray-500'}
                  `}>
                    {item.completed ? <Check className="h-5 w-5" /> : item.step}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    item.step === currentStep ? 'text-blue-600' : 
                    item.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {index < 5 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    item.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Step 1: Service Selection */}
          {currentStep >= 1 && (
            <Card className={`p-6 ${currentStep === 1 ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Wrench className="h-6 w-6 mr-2 text-blue-600" />
                  1. Service auswählen
                </h2>
                {selectedService && currentStep > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                  >
                    Ändern
                  </Button>
                )}
              </div>
              
              {currentStep === 1 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(SERVICE_TYPES).map(([key, service]) => {
                    const Icon = service.icon
                    return (
                      <button
                        key={key}
                        onClick={() => handleServiceSelect(key as ServiceType)}
                        className="p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                      >
                        <Icon className="h-8 w-8 text-blue-600 mb-2" />
                        <div className="font-semibold mb-1">{service.label}</div>
                        <div className="text-xs text-gray-600">{service.description}</div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-700">
                  {selectedService && (() => {
                    const service = SERVICE_TYPES[selectedService]
                    const Icon = service.icon
                    return (
                      <>
                        <Icon className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">{service.label}</span>
                        <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                      </>
                    )
                  })()}
                </div>
              )}
            </Card>
          )}

          {/* Step 2: Vehicle Selection */}
          {currentStep >= 2 && (
            <Card className={`p-6 ${currentStep === 2 ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Car className="h-6 w-6 mr-2 text-blue-600" />
                  2. Fahrzeug auswählen
                </h2>
                {selectedVehicle && currentStep > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(2)}
                  >
                    Ändern
                  </Button>
                )}
              </div>
              
              {currentStep === 2 ? (
                loadingVehicles ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Lade Fahrzeuge...</p>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Noch keine Fahrzeuge hinterlegt</p>
                    <Button onClick={() => router.push('/dashboard/customer/vehicles')}>
                      Fahrzeug hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleVehicleSelect(vehicle)}
                        className="p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="font-semibold text-lg mb-1">
                          {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-600">
                          {vehicle.licensePlate} • {vehicle.year}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="flex items-center gap-3 text-gray-700">
                  {selectedVehicle && (
                    <>
                      <Car className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </span>
                      <span className="text-gray-500">
                        ({selectedVehicle.licensePlate})
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    </>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Step 3: Date & Time Selection */}
          {currentStep >= 3 && (
            <Card className={`p-6 ${currentStep === 3 ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                  3. Termin wählen
                </h2>
                {selectedTime && currentStep > 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(3)}
                  >
                    Ändern
                  </Button>
                )}
              </div>
              
              {currentStep === 3 ? (
                <div className="space-y-6">
                  {/* Date Picker */}
                  <div className="max-w-sm mx-auto">
                    <label className="block text-sm font-semibold mb-2">Datum wählen</label>
                    <DatePicker
                      value={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date)
                        setSelectedTime('')
                      }}
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-semibold mb-3">
                        Verfügbare Uhrzeiten am {formatDate(selectedDate)}
                      </label>
                      {loadingSlots ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                          <p className="text-gray-600">Prüfe Verfügbarkeit...</p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-600">Keine freien Termine an diesem Tag</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Bitte wählen Sie ein anderes Datum
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {availableSlots.map((slot) => (
                            <Button
                              key={slot.time}
                              onClick={() => handleTimeSelect(slot.time)}
                              variant="outline"
                              className="h-10 text-sm font-semibold"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-700">
                  {selectedDate && selectedTime && (
                    <>
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">
                        {formatDate(selectedDate)} um {selectedTime} Uhr
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    </>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Step 4: Additional Services (Only for WHEEL_CHANGE) */}
          {currentStep >= 4 && selectedService === 'WHEEL_CHANGE' && (
            <Card className={`p-6 ${currentStep === 4 ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Wrench className="h-6 w-6 mr-2 text-blue-600" />
                  4. Zusatzleistungen
                </h2>
              </div>
              
              {currentStep === 4 ? (
                <div className="space-y-4">
                  {/* Balancing Option */}
                  {workshop.totalBalancingPrice > 0 && (
                    <label className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                      <input
                        type="checkbox"
                        checked={hasBalancing}
                        onChange={(e) => setHasBalancing(e.target.checked)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">Auswuchten</div>
                        <div className="text-sm text-gray-600">Alle 4 Räder auswuchten</div>
                      </div>
                      <div className="font-bold text-blue-600">
                        + {formatEUR(workshop.totalBalancingPrice)}
                      </div>
                    </label>
                  )}

                  {/* Storage Option */}
                  {workshop.storagePriceTotal > 0 && (
                    <label className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition">
                      <input
                        type="checkbox"
                        checked={hasStorage}
                        onChange={(e) => setHasStorage(e.target.checked)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">Einlagerung</div>
                        <div className="text-sm text-gray-600">
                          Reifen fachgerecht einlagern (6 Monate)
                        </div>
                      </div>
                      <div className="font-bold text-blue-600">
                        + {formatEUR(workshop.storagePriceTotal)}
                      </div>
                    </label>
                  )}

                  {/* Continue Button */}
                  <Button
                    onClick={handleContinueToPayment}
                    className="w-full"
                    size="lg"
                  >
                    Weiter zur Zahlung
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 text-gray-700">
                  {hasBalancing && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Auswuchten ({formatEUR(workshop.totalBalancingPrice)})</span>
                    </div>
                  )}
                  {hasStorage && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Einlagerung ({formatEUR(workshop.storagePriceTotal)})</span>
                    </div>
                  )}
                  {!hasBalancing && !hasStorage && (
                    <div className="text-gray-500">Keine Zusatzleistungen gewählt</div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Step 5: Payment */}
          {currentStep >= 5 && reservationId && (
            <Card className={`p-6 ${currentStep === 5 ? 'ring-2 ring-blue-500' : ''}`}>
              <h2 className="text-xl font-bold flex items-center mb-6">
                <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
                5. Zahlung
              </h2>

              {/* Price Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Grundpreis ({SERVICE_TYPES[selectedService!].label})</span>
                    <span className="font-semibold">{formatEUR(workshop.basePrice)}</span>
                  </div>
                  {hasBalancing && workshop.totalBalancingPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Auswuchten</span>
                      <span className="font-semibold">{formatEUR(workshop.totalBalancingPrice)}</span>
                    </div>
                  )}
                  {hasStorage && workshop.storagePriceTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Einlagerung</span>
                      <span className="font-semibold">{formatEUR(workshop.storagePriceTotal)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Gesamt</span>
                    <span className="text-blue-600">{formatEUR(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setPaymentMethod('STRIPE')}
                    className={`flex-1 p-4 border-2 rounded-lg font-semibold transition ${
                      paymentMethod === 'STRIPE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    💳 Kreditkarte
                  </button>
                  <button
                    onClick={() => setPaymentMethod('PAYPAL')}
                    className={`flex-1 p-4 border-2 rounded-lg font-semibold transition ${
                      paymentMethod === 'PAYPAL' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    PayPal
                  </button>
                </div>

                {paymentMethod === 'STRIPE' ? (
                  <Button
                    onClick={handleStripePayment}
                    disabled={processingPayment}
                    className="w-full"
                    size="lg"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        Jetzt bezahlen ({formatEUR(totalPrice)})
                      </>
                    )}
                  </Button>
                ) : (
                  <PayPalScriptProvider
                    options={{
                      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                      currency: 'EUR'
                    }}
                  >
                    <PayPalButtons
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [{
                            amount: {
                              value: totalPrice.toFixed(2)
                            }
                          }]
                        })
                      }}
                      onApprove={handlePayPalApprove}
                      disabled={processingPayment}
                    />
                  </PayPalScriptProvider>
                )}
              </div>
            </Card>
          )}

          {/* Step 6: Confirmation */}
          {currentStep >= 6 && bookingConfirmation && (
            <Card className="p-8 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Buchung bestätigt!</h2>
              <p className="text-gray-600 mb-6">
                Ihre Buchung wurde erfolgreich abgeschlossen.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
                <h3 className="font-bold mb-4">Buchungsdetails</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buchungsnummer:</span>
                    <span className="font-semibold">{bookingConfirmation.bookingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Werkstatt:</span>
                    <span className="font-semibold">{workshop.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-semibold">{SERVICE_TYPES[selectedService!].label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Termin:</span>
                    <span className="font-semibold">
                      {formatDate(selectedDate!)} um {selectedTime} Uhr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fahrzeug:</span>
                    <span className="font-semibold">
                      {selectedVehicle?.make} {selectedVehicle?.model}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Gesamtpreis:</span>
                    <span className="font-bold text-lg">{formatEUR(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => router.push('/dashboard/customer/appointments')}
                  variant="outline"
                  className="flex-1"
                >
                  Zu meinen Terminen
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/customer')}
                  className="flex-1"
                >
                  Zum Dashboard
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
