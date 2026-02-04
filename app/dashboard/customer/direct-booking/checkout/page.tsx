'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DatePicker from '@/components/DatePicker'
import {
  Car,
  Calendar,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  Euro
} from 'lucide-react'

type ServiceType = 'WHEEL_CHANGE' | 'TIRE_REPAIR' | 'WHEEL_ALIGNMENT' | 'AC_SERVICE'

const SERVICE_LABELS: Record<ServiceType, string> = {
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_REPAIR: 'Reifenreparatur',
  WHEEL_ALIGNMENT: 'Achsvermessung',
  AC_SERVICE: 'Klimaanlagen-Service'
}

function CheckoutContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const workshopId = searchParams?.get('workshopId')
  const service = searchParams?.get('service') as ServiceType

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [workshop, setWorkshop] = useState<any>(null)
  const [servicePricing, setServicePricing] = useState<any>(null)
  
  // Step 1: Vehicle Selection
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [hasBalancing, setHasBalancing] = useState(false)
  const [hasStorage, setHasStorage] = useState(false)
  
  // Step 2: Date & Time Selection
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean}[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'PAYPAL'>('STRIPE')
  const [processingPayment, setProcessingPayment] = useState(false)

  const progressSteps = [
    { number: 1, label: 'Fahrzeug', icon: Car },
    { number: 2, label: 'Termin', icon: Calendar },
    { number: 3, label: 'Zahlung', icon: CreditCard }
  ]

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'CUSTOMER') {
      router.push('/login')
    }
  }, [session, status, router])

  // Load workshop and service data
  useEffect(() => {
    if (!workshopId || !service) return
    
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load workshop
        const workshopRes = await fetch(`/api/workshop/${workshopId}`)
        if (workshopRes.ok) {
          const workshopData = await workshopRes.json()
          setWorkshop(workshopData)
        }
        
        // Load service pricing
        const pricingRes = await fetch(`/api/workshop/${workshopId}/services/${service}`)
        if (pricingRes.ok) {
          const pricingData = await pricingRes.json()
          setServicePricing(pricingData)
        }
        
        // Load vehicles
        fetchVehicles()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [workshopId, service])

  const fetchVehicles = async () => {
    setLoadingVehicles(true)
    try {
      const response = await fetch('/api/customer/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoadingVehicles(false)
    }
  }

  const fetchAvailableSlots = async (dateString: string) => {
    if (!workshopId || !service) return
    
    setLoadingSlots(true)
    try {
      const response = await fetch(
        `/api/workshop/available-slots?workshopId=${workshopId}&date=${dateString}&serviceType=${service}`
      )
      
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

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString)
    setSelectedTime('')
    if (dateString) {
      // Use dateString directly (already in YYYY-MM-DD format)
      fetchAvailableSlots(dateString)
    }
  }

  const calculateTotal = () => {
    if (!servicePricing) return 0
    let total = servicePricing.basePrice || 0
    if (hasBalancing && servicePricing.balancingPrice) total += servicePricing.balancingPrice
    if (hasStorage && servicePricing.storagePrice) total += servicePricing.storagePrice
    return total
  }

  const canProceed = () => {
    if (currentStep === 1) return selectedVehicle !== null
    if (currentStep === 2) return selectedDate && selectedTime
    if (currentStep === 3) return paymentMethod !== null
    return false
  }

  const handleNext = () => {
    if (canProceed() && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Initialize PayPal SDK v6 when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.paypalSdkLoaded) {
      const script = document.createElement('script')
      script.src = 'https://www.paypal.com/web-sdk/v6/core'
      script.async = true
      script.onload = () => {
        window.paypalSdkLoaded = true
        window.dispatchEvent(new Event('paypal-sdk-loaded'))
      }
      document.head.appendChild(script)
    }
  }, [])

  // Render PayPal Button when on Step 3
  useEffect(() => {
    if (currentStep !== 3 || !workshopId || !service || !selectedVehicle || !selectedDate || !selectedTime) {
      return
    }

    const renderPayPalButton = async () => {
      if (!window.paypalSdkLoaded) {
        // Wait for SDK to load
        window.addEventListener('paypal-sdk-loaded', renderPayPalButton, { once: true })
        return
      }

      const container = document.getElementById('paypal-button-container')
      if (!container || container.children.length > 0) return // Already rendered

      try {
        // Get client token
        const tokenResponse = await fetch('/api/customer/direct-booking/paypal-client-token')
        if (!tokenResponse.ok) {
          console.error('Failed to get PayPal client token')
          return
        }

        const { clientToken } = await tokenResponse.json()
        if (!clientToken) {
          console.error('No client token received')
          return
        }

        // Create SDK instance
        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ['paypal-payments'],
          pageType: 'checkout'
        })

        const totalPrice = calculateTotal()

        // Create order function
        const createOrder = async () => {
          const orderResponse = await fetch('/api/customer/direct-booking/create-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: totalPrice,
              description: `${SERVICE_LABELS[service]} - ${workshop.name}`,
              customerName: session?.user?.name || '',
              customerEmail: session?.user?.email || '',
              workshopName: workshop.name,
              date: new Date(selectedDate).toLocaleDateString('de-DE', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              }),
              time: selectedTime,
              street: (session?.user as any)?.street || '',
              city: (session?.user as any)?.city || '',
              zipCode: (session?.user as any)?.zipCode || '',
              country: 'DE'
            })
          })
          
          const data = await orderResponse.json()
          return { orderId: data.id }
        }

        // Create payment session
        const paymentSession = sdkInstance.createPayPalOneTimePaymentSession({
          async onApprove(data: any) {
            setProcessingPayment(true)
            console.log('✅ PayPal Zahlung genehmigt:', data)
            
            try {
              // Capture payment
              const captureResponse = await fetch('/api/customer/direct-booking/capture-paypal-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderId })
              })
              
              if (!captureResponse.ok) {
                alert('Zahlung konnte nicht erfasst werden.')
                setProcessingPayment(false)
                return
              }
              
              const { captureId } = await captureResponse.json()
              
              // Create booking with all required pricing fields
              const bookingData = {
                workshopId,
                serviceType: service,
                vehicleId: selectedVehicle.id,
                date: selectedDate,
                time: selectedTime,
                hasBalancing,
                hasStorage,
                basePrice: servicePricing?.basePrice || 0,
                balancingPrice: hasBalancing ? (servicePricing?.balancingPrice || 0) : null,
                storagePrice: hasStorage ? (servicePricing?.storagePrice || 0) : null,
                totalPrice,
                durationMinutes: servicePricing?.durationMinutes || 60,
                paymentMethod: 'PAYPAL',
                paymentId: captureId
              }
              
              const response = await fetch('/api/customer/direct-booking/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
              })
              
              if (response.ok) {
                const { booking } = await response.json()
                // Redirect to booking details page
                router.push(`/dashboard/customer/bookings/${booking.id}`)
              } else {
                alert('Buchung fehlgeschlagen.')
              }
            } catch (error) {
              console.error('Booking error:', error)
              alert('Ein Fehler ist aufgetreten.')
            } finally {
              setProcessingPayment(false)
            }
          },
          
          onCancel(data: any) {
            console.log('❌ PayPal Zahlung abgebrochen:', data)
            setProcessingPayment(false)
            // User bleibt auf der Seite und kann erneut versuchen
          },
          
          onError(error: any) {
            console.error('❌ PayPal Zahlungsfehler:', error)
            setProcessingPayment(false)
            alert('Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.')
          }
        })

        // Create PayPal button element
        const paypalButton = document.createElement('paypal-button')
        paypalButton.setAttribute('type', 'pay')
        paypalButton.style.width = '100%'
        
        // Add click handler to button
        paypalButton.addEventListener('click', async () => {
          try {
            setProcessingPayment(true)
            console.log('🔵 PayPal Button geklickt - Starte Zahlung...')
            await paymentSession.start(
              { presentationMode: 'auto' },
              createOrder()
            )
          } catch (error) {
            console.error('❌ Fehler beim Starten der PayPal Zahlung:', error)
            setProcessingPayment(false)
            alert('PayPal konnte nicht gestartet werden.')
          }
        })
        
        // Append button to container
        container.appendChild(paypalButton)
        console.log('✅ PayPal Button gerendert und bereit')
      } catch (error) {
        console.error('Error rendering PayPal button:', error)
      }
    }

    renderPayPalButton()
  }, [currentStep, workshopId, service, selectedVehicle, selectedDate, selectedTime, session, workshop, hasBalancing, hasStorage, router])

  const handlePayment = async () => {
    if (!workshopId || !service || !selectedVehicle || !selectedDate || !selectedTime) return
    
    setProcessingPayment(true)
    try {
      const totalPrice = calculateTotal()

      if (paymentMethod === 'PAYPAL') {
        // SDK v6: Initialize PayPal with client token
        const tokenResponse = await fetch('/api/customer/direct-booking/paypal-client-token')
        if (!tokenResponse.ok) {
          alert('PayPal-Initialisierung fehlgeschlagen.')
          setProcessingPayment(false)
          return
        }

        const { clientToken } = await tokenResponse.json()

        // Create SDK instance
        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ['paypal-payments'],
          pageType: 'checkout'
        })

        // Create order function for SDK v6
        const createOrder = async () => {
          const orderResponse = await fetch('/api/customer/direct-booking/create-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: totalPrice,
              description: `${SERVICE_LABELS[service]} - ${workshop.name}`,
              customerName: session?.user?.name || '',
              customerEmail: session?.user?.email || '',
              workshopName: workshop.name,
              date: new Date(selectedDate).toLocaleDateString('de-DE', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }),
              time: selectedTime,
              street: (session?.user as any)?.street || '',
              city: (session?.user as any)?.city || '',
              zipCode: (session?.user as any)?.zipCode || '',
              country: 'DE'
            })
          })
          
          const data = await orderResponse.json()
          return { orderId: data.id }
        }

        // Create payment session with SDK v6
        const paymentSession = sdkInstance.createPayPalOneTimePaymentSession({
          async onApprove(data: any) {
            console.log('Payment approved:', data)
            
            // Capture payment
            const captureResponse = await fetch('/api/customer/direct-booking/capture-paypal-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderId })
            })

            if (!captureResponse.ok) {
              alert('Zahlung konnte nicht erfasst werden.')
              setProcessingPayment(false)
              return
            }

            const { captureId } = await captureResponse.json()

            // Create booking
            const bookingData = {
              workshopId,
              serviceType: service,
              vehicleId: selectedVehicle.id,
              date: selectedDate,
              time: selectedTime,
              hasBalancing,
              hasStorage,
              totalPrice,
              paymentMethod: 'PAYPAL',
              paymentId: captureId
            }

            const response = await fetch('/api/customer/direct-booking/book', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bookingData)
            })

            if (response.ok) {
              router.push(`/dashboard/customer/appointments`)
            } else {
              alert('Buchung fehlgeschlagen.')
            }
            setProcessingPayment(false)
          },
          onCancel(data: any) {
            console.log('Payment cancelled:', data)
            setProcessingPayment(false)
          },
          onError(error: any) {
            console.error('Payment error:', error)
            alert('Zahlung fehlgeschlagen.')
            setProcessingPayment(false)
          }
        })

        // Start payment with auto presentation mode
        try {
          await paymentSession.start(
            { presentationMode: 'auto' },
            createOrder()
          )
        } catch (error) {
          console.error('Payment start error:', error)
          alert('Zahlung konnte nicht gestartet werden.')
          setProcessingPayment(false)
        }
      } else if (paymentMethod === 'STRIPE') {
        // Stripe Checkout
        const response = await fetch('/api/customer/direct-booking/create-stripe-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workshopId,
            serviceType: service,
            vehicleId: selectedVehicle.id,
            date: selectedDate,
            time: selectedTime,
            hasBalancing,
            hasStorage,
            totalPrice,
            workshopName: workshop.companyName,
            serviceName: SERVICE_LABELS[service],
            vehicleInfo: `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.licensePlate})`
          })
        })

        if (!response.ok) {
          alert('Stripe-Checkout konnte nicht erstellt werden.')
          setProcessingPayment(false)
          return
        }

        const { url } = await response.json()
        
        // Redirect to Stripe Checkout
        window.location.href = url
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Ein Fehler ist aufgetreten.')
      setProcessingPayment(false)
    }
  }

  if (loading || !workshop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  const totalPrice = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/customer/direct-booking')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
            <div className="border-l pl-4">
              <h1 className="text-lg font-bold">{workshop.companyName}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                <span>{workshop.street}, {workshop.postalCode} {workshop.city}</span>
                {workshop.averageRating > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{workshop.averageRating.toFixed(1)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Progress Indicator */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              {progressSteps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.number
                const isCompleted = currentStep > step.number
                const isLast = index === progressSteps.length - 1
                
                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      {/* Circle */}
                      <div className={`
                        w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg
                        transition-all duration-300 relative
                        ${isCompleted 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                          : isActive 
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-300 scale-110' 
                          : 'bg-gray-200 text-gray-400'}
                      `}>
                        {isCompleted ? (
                          <Check className="h-7 w-7" />
                        ) : (
                          <Icon className="h-7 w-7" />
                        )}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-25"></div>
                        )}
                      </div>
                      {/* Label */}
                      <span className={`
                        mt-3 text-sm font-medium transition-colors
                        ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                      `}>
                        {step.label}
                      </span>
                    </div>
                    
                    {/* Connecting Line */}
                    {!isLast && (
                      <div className={`
                        flex-1 h-1 mx-4 transition-all duration-500
                        ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            {/* Left: Step Content */}
            <div className="col-span-2">
              <Card className="p-8">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Wählen Sie Ihr Fahrzeug</h2>
                      <p className="text-gray-600">Für welches Fahrzeug möchten Sie den Service buchen?</p>
                    </div>

                    {loadingVehicles ? (
                      <div className="text-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-gray-600">Lade Fahrzeuge...</p>
                      </div>
                    ) : vehicles.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                        <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">Keine Fahrzeuge gefunden</p>
                        <Button
                          onClick={() => router.push('/dashboard/customer/vehicles')}
                          variant="outline"
                        >
                          Fahrzeug hinzufügen
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {vehicles.map((vehicle) => (
                          <button
                            key={vehicle.id}
                            onClick={() => setSelectedVehicle(vehicle)}
                            className={`
                              p-6 border-2 rounded-xl text-left transition-all hover:shadow-lg
                              ${selectedVehicle?.id === vehicle.id
                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:border-blue-300'}
                            `}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center
                                ${selectedVehicle?.id === vehicle.id ? 'bg-blue-600' : 'bg-gray-200'}
                              `}>
                                <Car className={`h-6 w-6 ${selectedVehicle?.id === vehicle.id ? 'text-white' : 'text-gray-500'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-lg">
                                  {vehicle.make} {vehicle.model}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {vehicle.licensePlate} • {vehicle.year}
                                </div>
                              </div>
                              {selectedVehicle?.id === vehicle.id && (
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Check className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Additional Services */}
                    {selectedVehicle && (servicePricing?.balancingPrice || servicePricing?.storagePrice) && (
                      <div className="space-y-3 pt-6 border-t">
                        <h3 className="font-semibold">Zusatzleistungen</h3>
                        
                        {servicePricing?.balancingPrice && (
                          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                            <input
                              type="checkbox"
                              checked={hasBalancing}
                              onChange={(e) => setHasBalancing(e.target.checked)}
                              className="w-5 h-5 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="font-medium">Auswuchten</div>
                              <div className="text-sm text-gray-600">Alle 4 Räder auswuchten</div>
                            </div>
                            <div className="font-bold text-blue-600">
                              +{servicePricing.balancingPrice.toFixed(2)} €
                            </div>
                          </label>
                        )}

                        {servicePricing?.storagePrice && (
                          <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                            <input
                              type="checkbox"
                              checked={hasStorage}
                              onChange={(e) => setHasStorage(e.target.checked)}
                              className="w-5 h-5 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="font-medium">Einlagerung</div>
                              <div className="text-sm text-gray-600">Professionelle Reifeneinlagerung</div>
                            </div>
                            <div className="font-bold text-blue-600">
                              +{servicePricing.storagePrice.toFixed(2)} €
                            </div>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Wählen Sie Ihren Wunschtermin</h2>
                      <p className="text-gray-600">Wann möchten Sie vorbeikommen?</p>
                    </div>

                    {/* Calendar Date Picker - Full Width */}
                    <div>
                      <h3 className="font-semibold mb-3">Datum wählen</h3>
                      <DatePicker
                        selectedDate={selectedDate}
                        onChange={handleDateSelect}
                        minDate={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    {/* Time Slots - Below Calendar */}
                    <div>
                      <h3 className="font-semibold mb-3">Uhrzeit wählen</h3>
                      {!selectedDate ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">Bitte wählen Sie zuerst ein Datum</p>
                        </div>
                      ) : loadingSlots ? (
                        <div className="text-center py-12">
                          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                          <p className="text-gray-600">Lade verfügbare Zeiten...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                          {availableSlots.filter(slot => slot.available).map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`
                                p-3 border-2 rounded-lg font-medium transition-all
                                ${selectedTime === slot.time
                                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                                  : 'border-gray-200 hover:border-blue-300'}
                              `}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Jetzt bezahlen</h2>
                      <p className="text-gray-600">Wählen Sie Ihre Zahlungsmethode</p>
                    </div>

                    <div className="space-y-4">
                      {/* Stripe Button */}
                      <button
                        onClick={() => {
                          setPaymentMethod('STRIPE')
                          handlePayment()
                        }}
                        disabled={processingPayment}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 text-white py-5 rounded-xl font-semibold transition-all hover:shadow-lg"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5" />
                            <span>{processingPayment && paymentMethod === 'STRIPE' ? 'Wird verarbeitet...' : 'Mit Kreditkarte bezahlen'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs opacity-90">
                            <span>Oder:</span>
                            <div className="flex items-center gap-1.5">
                              {/* Apple Pay Icon */}
                              <div className="bg-white/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                                </svg>
                                <span className="text-[10px] font-medium">Pay</span>
                              </div>
                              {/* Google Pay Icon */}
                              <div className="bg-white/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                                </svg>
                                <span className="text-[10px] font-medium">Pay</span>
                              </div>
                              {/* More payment methods */}
                              <span className="text-[10px]">& mehr</span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* PayPal Button Container */}
                      <div id="paypal-button-container" className="relative">
                        {/* SDK v6 PayPal Button will be rendered here */}
                      </div>

                      <div className="text-center text-sm text-gray-500">
                        oder
                      </div>

                      {/* Alternative: Show loading state */}
                      {!window.paypalSdkLoaded && (
                        <div className="w-full bg-gray-100 py-4 rounded-xl flex items-center justify-center">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                          <span className="text-gray-600">PayPal lädt...</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                      <div className="flex gap-3">
                        <div className="text-blue-600 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-sm text-blue-900">
                          <strong>Hinweis:</strong> Die Zahlung erfolgt sicher über unseren Zahlungsdienstleister. Ihre Daten werden verschlüsselt übertragen.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Summary */}
            <div>
              <Card className="p-6 sticky top-6">
                <h3 className="font-bold text-lg mb-4">Zusammenfassung</h3>
                
                <div className="space-y-4 mb-6">
                  {/* Service */}
                  <div className="pb-4 border-b">
                    <div className="text-sm text-gray-600 mb-1">Service</div>
                    <div className="font-semibold">{SERVICE_LABELS[service]}</div>
                  </div>

                  {/* Vehicle */}
                  {selectedVehicle && (
                    <div className="pb-4 border-b">
                      <div className="text-sm text-gray-600 mb-1">Fahrzeug</div>
                      <div className="font-semibold">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedVehicle.licensePlate}
                      </div>
                    </div>
                  )}

                  {/* Date & Time */}
                  {selectedDate && selectedTime && (
                    <div className="pb-4 border-b">
                      <div className="text-sm text-gray-600 mb-1">Termin</div>
                      <div className="font-semibold">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {selectedTime} Uhr
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="space-y-2 pb-4 border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Grundpreis</span>
                      <span className="font-medium">{servicePricing?.basePrice?.toFixed(2) || '0.00'} €</span>
                    </div>
                    
                    {hasBalancing && servicePricing?.balancingPrice && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Auswuchten</span>
                        <span className="font-medium">+{servicePricing.balancingPrice.toFixed(2)} €</span>
                      </div>
                    )}
                    
                    {hasStorage && servicePricing?.storagePrice && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Einlagerung</span>
                        <span className="font-medium">+{servicePricing.storagePrice.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-lg">Gesamt</span>
                    <span className="font-bold text-2xl text-blue-600">
                      {totalPrice.toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {currentStep < 3 ? (
                    <>
                      {currentStep > 1 && (
                        <Button
                          onClick={handleBack}
                          variant="outline"
                          className="w-full"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Zurück
                        </Button>
                      )}
                      <Button
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Weiter
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="w-full"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Zurück
                    </Button>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                  Durch die Buchung akzeptieren Sie unsere AGB und Datenschutzbestimmungen
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
