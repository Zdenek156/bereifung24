'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Navigation,
  Search,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  Gauge,
  Wind,
  Info,
  Calendar,
  CreditCard,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Service Configuration
const SERVICE_TYPES = {
  WHEEL_CHANGE: {
    id: 'WHEEL_CHANGE',
    label: '🔄 Räderwechsel',
    icon: RefreshCw,
    description: 'Sommer-/Winterreifen wechseln',
    options: ['balancing', 'storage']
  },
  TIRE_REPAIR: {
    id: 'TIRE_REPAIR',
    label: '🔧 Reifenreparatur',
    icon: Wrench,
    description: 'Reifen flicken und abdichten',
    options: []
  },
  WHEEL_ALIGNMENT: {
    id: 'WHEEL_ALIGNMENT',
    label: '📐 Achsvermessung',
    icon: Gauge,
    description: 'Spur und Sturz einstellen',
    options: []
  },
  AC_SERVICE: {
    id: 'AC_SERVICE',
    label: '❄️ Klimaanlagen-Service',
    icon: Wind,
    description: 'Wartung und Desinfektion',
    options: []
  },
  OTHER: {
    id: 'OTHER',
    label: '🛠️ Sonstige Reifendienste',
    icon: AlertTriangle,
    description: 'Weitere Services',
    options: []
  }
}

export default function DirectBookingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Service Selection
  const [selectedService, setSelectedService] = useState<keyof typeof SERVICE_TYPES>('WHEEL_CHANGE')
  
  // Search Configuration
  const [postalCode, setPostalCode] = useState('')
  const [useGeolocation, setUseGeolocation] = useState(false)
  const [radiusKm, setRadiusKm] = useState(25)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lon: number } | null>(null)
  
  // Service-specific options
  const [hasBalancing, setHasBalancing] = useState(false)
  const [hasStorage, setHasStorage] = useState(false)
  
  // Results
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Sorting
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance')
  
  // Modal State
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null)
  const [bookingStep, setBookingStep] = useState(1) // 1=Vehicle, 2=Calendar, 3=Payment, 4=Confirmation
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'PAYPAL'>('STRIPE')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null)

  const currentService = SERVICE_TYPES[selectedService]
  const ServiceIcon = currentService.icon

  // Geocode postal code
  const geocodePostalCode = async (plz: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&country=Germany&postalcode=${plz}`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        }
      }
      return null
    } catch (err) {
      console.error('Geocoding error:', err)
      return null
    }
  }

  // Get user location
  const requestGeolocation = () => {
    setUseGeolocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
          setError(null)
        },
        (err) => {
          setError('Standortzugriff wurde verweigert. Bitte geben Sie eine PLZ ein.')
          setUseGeolocation(false)
        }
      )
    } else {
      setError('Ihr Browser unterstützt keine Standortermittlung.')
      setUseGeolocation(false)
    }
  }

  // Search workshops
  const handleSearch = async () => {
    setError(null)
    setLoading(true)
    setHasSearched(true)

    try {
      let location = customerLocation

      if (!location && postalCode) {
        location = await geocodePostalCode(postalCode)
        if (!location) {
          setError('PLZ konnte nicht gefunden werden. Bitte überprüfen Sie die Eingabe.')
          setLoading(false)
          return
        }
        setCustomerLocation(location)
      }

      if (!location) {
        setError('Bitte geben Sie eine PLZ ein oder nutzen Sie den Standortzugriff.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/customer/direct-booking/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: selectedService,
          hasBalancing: selectedService === 'WHEEL_CHANGE' ? hasBalancing : false,
          hasStorage: selectedService === 'WHEEL_CHANGE' ? hasStorage : false,
          radiusKm,
          customerLat: location.lat,
          customerLon: location.lon
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setWorkshops(result.workshops || [])
      } else {
        setError(result.error || 'Keine Werkstätten gefunden')
      }
    } catch (err) {
      setError('Fehler bei der Suche')
    } finally {
      setLoading(false)
    }
  }

  // Sort workshops
  const sortedWorkshops = [...workshops].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return a.distance - b.distance
      case 'price':
        return a.totalPrice - b.totalPrice
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      default:
        return 0
    }
  })

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Fetch customer vehicles when modal opens
  useEffect(() => {
    if (selectedWorkshop && bookingStep === 1) {
      fetchVehicles()
    }
  }, [selectedWorkshop, bookingStep])

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && selectedWorkshop) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedWorkshop])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/customer/vehicles')
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedWorkshop || !selectedWorkshop.id) {
      console.error('fetchAvailableSlots called but selectedWorkshop is invalid:', selectedWorkshop)
      return
    }
    
    setLoadingSlots(true)
    console.log('Fetching slots for workshop:', {
      id: selectedWorkshop.id,
      name: selectedWorkshop.name,
      openingHours: selectedWorkshop.openingHours
    })
    
    try {
      const response = await fetch('/api/customer/direct-booking/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: selectedWorkshop.id,
          serviceType: selectedService,
          date: selectedDate,
          duration: 60
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Slots API Response:', data)
        console.log('Workshop:', selectedWorkshop.name, 'Date:', selectedDate)
        if (data.slots && data.slots.length > 0) {
          setAvailableSlots(data.slots.map((slot: any) => slot.time))
        } else {
          console.warn('No slots returned:', data.message || 'No slots available')
          setAvailableSlots([])
        }
      } else {
        console.error('Slots API error:', response.status, await response.text())
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleReserveSlot = async () => {
    if (!selectedVehicle || !selectedDate || !selectedTime) return

    const totalPrice = selectedWorkshop.basePrice + 
      (selectedService === 'WHEEL_CHANGE' && hasBalancing ? selectedWorkshop.totalBalancingPrice : 0) +
      (selectedService === 'WHEEL_CHANGE' && hasStorage ? selectedWorkshop.storagePriceTotal : 0)

    try {
      const response = await fetch('/api/customer/direct-booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: selectedWorkshop.id,
          vehicleId: selectedVehicle.id,
          serviceType: selectedService,
          date: selectedDate,
          time: selectedTime,
          hasBalancing,
          hasStorage,
          totalPrice
        })
      })

      if (response.ok) {
        const data = await response.json()
        setReservationId(data.reservationId)
        setBookingStep(3) // Move to payment
      } else if (response.status === 409) {
        alert('Dieser Termin wurde gerade eben gebucht. Bitte wählen Sie einen anderen Zeitpunkt.')
        fetchAvailableSlots()
      }
    } catch (error) {
      console.error('Error reserving slot:', error)
      alert('Fehler bei der Reservierung. Bitte versuchen Sie es erneut.')
    }
  }

  const handleStripePayment = async () => {
    if (!reservationId) return
    
    setProcessingPayment(true)
    try {
      const response = await fetch('/api/payment/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          serviceType: selectedService,
          workshopName: selectedWorkshop.name,
          amount: selectedWorkshop.basePrice + 
            (hasBalancing ? selectedWorkshop.totalBalancingPrice : 0) +
            (hasStorage ? selectedWorkshop.storagePriceTotal : 0)
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
        setBookingStep(4)
      } else if (response.status === 410) {
        alert('Ihre Reservierung ist abgelaufen. Bitte buchen Sie erneut.')
        resetModal()
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Fehler bei der Buchung. Bitte versuchen Sie es erneut.')
    } finally {
      setProcessingPayment(false)
    }
  }

  const resetModal = () => {
    setSelectedWorkshop(null)
    setBookingStep(1)
    setSelectedVehicle(null)
    setSelectedDate('')
    setSelectedTime('')
    setReservationId(null)
    setPaymentMethod('STRIPE')
    setBookingConfirmation(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Search */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-3">🔧 Service-Buchung</h1>
            <p className="text-blue-100 mb-8">
              Finden Sie die passende Werkstatt für Ihren Service
            </p>

            {/* Search Card */}
            <Card className="bg-white text-gray-900 p-6 shadow-xl">
              <div className="grid gap-6">
                {/* Service Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    <Wrench className="inline h-4 w-4 mr-1" />
                    Service auswählen
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => {
                      setSelectedService(e.target.value as keyof typeof SERVICE_TYPES)
                      setHasBalancing(false)
                      setHasStorage(false)
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(SERVICE_TYPES).map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {currentService.description}
                  </p>
                </div>

                {/* Location Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Standort
                  </label>
                  <div className="flex gap-2">
                    {!useGeolocation && (
                      <Input
                        type="text"
                        placeholder="PLZ oder Ort eingeben"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    )}
                    {useGeolocation && customerLocation && (
                      <div className="flex-1 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        <span className="font-medium">Aktueller Standort wird verwendet</span>
                      </div>
                    )}
                    <Button
                      variant={useGeolocation ? "destructive" : "outline"}
                      onClick={() => {
                        if (useGeolocation) {
                          setUseGeolocation(false)
                          setCustomerLocation(null)
                        } else {
                          requestGeolocation()
                        }
                      }}
                      className="whitespace-nowrap"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      {useGeolocation ? 'Deaktivieren' : 'Aktueller Standort'}
                    </Button>
                  </div>
                  {error && error.includes('Standort') && (
                    <p className="text-xs text-red-600 mt-1">
                      {error}
                    </p>
                  )}
                </div>

                {/* Radius Slider */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Umkreis: {radiusKm} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5 km</span>
                    <span>100 km</span>
                  </div>
                </div>

                {/* Service-specific Options */}
                {selectedService === 'WHEEL_CHANGE' && (
                  <div>
                    <label className="block text-sm font-semibold mb-3">
                      Zusätzliche Optionen
                    </label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasBalancing}
                          onChange={(e) => setHasBalancing(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">Mit Wuchten</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasStorage}
                          onChange={(e) => setHasStorage(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">Mit Einlagerung</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Suche läuft...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Werkstätten finden
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {workshops.length > 0 ? (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {workshops.length} Werkstätten gefunden
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {currentService.label} im Umkreis von {radiusKm} km
                    </p>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-gray-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="distance">Nach Entfernung</option>
                      <option value="price">Nach Preis</option>
                      <option value="rating">Nach Bewertung</option>
                    </select>
                  </div>
                </div>

                {/* Workshop Cards */}
                <div className="space-y-4">
                  {sortedWorkshops.map((workshop) => (
                    <Card key={workshop.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex gap-6">
                        {/* Workshop Logo */}
                        <div className="w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                          {workshop.logoUrl ? (
                            <img
                              src={workshop.logoUrl}
                              alt={workshop.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <ServiceIcon className="h-10 w-10 text-blue-600" />
                            </div>
                          )}
                        </div>

                        {/* Workshop Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {workshop.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {workshop.address}, {workshop.postalCode} {workshop.city}
                              </p>
                            </div>
                            
                            {/* Rating */}
                            {workshop.rating > 0 && (
                              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-sm">
                                  {workshop.rating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({workshop.reviewCount})
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Details Row */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{workshop.distance.toFixed(1)} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>ca. {workshop.estimatedDuration} Min.</span>
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className="flex items-end justify-between">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">{currentService.label}:</span> {formatEUR(workshop.basePrice)}
                              </div>
                              {selectedService === 'WHEEL_CHANGE' && hasBalancing && workshop.totalBalancingPrice > 0 && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">+ Wuchten:</span> {formatEUR(workshop.totalBalancingPrice)}
                                </div>
                              )}
                              {selectedService === 'WHEEL_CHANGE' && hasStorage && workshop.storagePriceTotal > 0 && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">+ Einlagerung:</span> {formatEUR(workshop.storagePriceTotal)}
                                </div>
                              )}
                              <div className="text-2xl font-bold text-blue-600 mt-2">
                                {formatEUR(
                                  workshop.basePrice + 
                                  (selectedService === 'WHEEL_CHANGE' && hasBalancing ? workshop.totalBalancingPrice : 0) +
                                  (selectedService === 'WHEEL_CHANGE' && hasStorage ? workshop.storagePriceTotal : 0)
                                )}
                              </div>
                            </div>

                            {/* Booking Button */}
                            <Button
                              onClick={() => {
                                console.log('🔍 Workshop clicked:', workshop)
                                setSelectedWorkshop(workshop)
                              }}
                              size="lg"
                            >
                              Jetzt buchen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              /* No Results */
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold mb-2">Keine Werkstätten gefunden</h3>
                  <p className="text-gray-600 mb-4">
                    In Ihrem Suchgebiet ({radiusKm} km) wurden keine Werkstätten gefunden, 
                    die {currentService.label} als Direktbuchung anbieten.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRadiusKm(50)
                      handleSearch()
                    }}
                  >
                    Suchradius auf 50 km erweitern
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal - 4 Steps */}
      {selectedWorkshop && (
        <PayPalScriptProvider options={{ 
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb',
          currency: 'EUR'
        }}>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <Card className="max-w-4xl w-full my-8">
              <div className="p-6">
                {/* Header with Close Button */}
                <div className="flex items-start justify-between mb-4 border-b pb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedWorkshop?.name || 'Werkstatt'}</h2>
                    <div className="flex items-center gap-4">
                      {selectedWorkshop?.rating && selectedWorkshop.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{selectedWorkshop.rating.toFixed(1)}</span>
                          <span className="text-gray-500">({selectedWorkshop.reviewCount || 0} Bewertungen)</span>
                        </span>
                      )}
                      {selectedWorkshop?.distance && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {selectedWorkshop.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={resetModal}
                    className="-mt-2 -mr-2"
                  >
                    ✕
                  </Button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center mb-8 px-4">
                  {[
                    { num: 1, label: 'Fahrzeug', icon: Car },
                    { num: 2, label: 'Termin', icon: Calendar },
                    { num: 3, label: 'Bezahlung', icon: CreditCard },
                    { num: 4, label: 'Bestätigung', icon: CheckCircle }
                  ].map((step, idx) => {
                    const StepIcon = step.icon
                    return (
                      <div key={step.num} className="flex items-center" style={{ flex: idx < 3 ? '1' : '0 0 auto' }}>
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            bookingStep >= step.num 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'border-gray-300 text-gray-400'
                          }`}>
                            <StepIcon className="h-5 w-5" />
                          </div>
                          <span className={`text-xs mt-1 whitespace-nowrap ${
                            bookingStep >= step.num ? 'text-blue-600 font-semibold' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        {idx < 3 && (
                          <div className={`flex-1 h-0.5 mx-3 ${
                            bookingStep > step.num ? 'bg-blue-600' : 'bg-gray-300'
                          }`} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Step Content */}
                <div className="border-t pt-6">
                {/* Step 1: Vehicle Selection */}
                {bookingStep === 1 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Car className="h-6 w-6 text-blue-600" />
                      Wählen Sie Ihr Fahrzeug
                    </h3>
                    {vehicles.length === 0 ? (
                      <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-dashed border-blue-300">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Car className="h-10 w-10 text-blue-600" />
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">Kein Fahrzeug vorhanden</h4>
                          <p className="text-gray-700 mb-2">
                            Um einen Termin zu buchen, müssen Sie zunächst ein Fahrzeug in Ihrer Fahrzeugverwaltung hinterlegen.
                          </p>
                          <p className="text-sm text-gray-600 mb-6">
                            💡 Das geht schnell: Kennzeichen, Marke, Modell und Reifengröße - fertig!
                          </p>
                          <div className="flex gap-3 justify-center">
                            <Button 
                              variant="outline"
                              onClick={resetModal}
                            >
                              Abbrechen
                            </Button>
                            <Button 
                              onClick={() => {
                                router.push('/dashboard/customer/vehicles')
                                resetModal()
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Car className="h-4 w-4 mr-2" />
                              Jetzt Fahrzeug hinzufügen
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vehicles.map((vehicle: any) => (
                          <Card
                            key={vehicle.id}
                            className={`p-4 cursor-pointer transition-all ${
                              selectedVehicle?.id === vehicle.id
                                ? 'ring-2 ring-blue-600 bg-blue-50'
                                : 'hover:shadow-md'
                            }`}
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Car className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
                                <p className="text-sm text-gray-600">
                                  {vehicle.licensePlate}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {vehicle.tireSize}
                                </p>
                              </div>
                              {selectedVehicle?.id === vehicle.id && (
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                      <Button variant="outline" onClick={resetModal}>
                        Abbrechen
                      </Button>
                      <Button
                        onClick={() => setBookingStep(2)}
                        disabled={!selectedVehicle}
                      >
                        Weiter
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Time Selection */}
                {bookingStep === 2 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      Wählen Sie Ihren Wunschtermin
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Wählen Sie zuerst ein Datum aus dem Kalender und anschließend eine verfügbare Uhrzeit.
                    </p>
                    
                    {/* Date Picker */}
                    <div className="mb-6">
                      <DatePicker
                        selectedDate={selectedDate}
                        onChange={setSelectedDate}
                        minDate={new Date().toISOString().split('T')[0]}
                        label="📅 Wunschdatum"
                        required
                      />
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                      <div className="border-t pt-6">
                        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Verfügbare Uhrzeiten am {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </label>
                        {loadingSlots ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                            <p className="text-sm text-gray-600">Lade verfügbare Zeiten...</p>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <Card className="p-8 bg-yellow-50 border-yellow-200 text-center">
                            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                            <p className="font-semibold text-gray-900 mb-1">Keine Termine verfügbar</p>
                            <p className="text-sm text-gray-600">
                              An diesem Tag sind leider alle Termine ausgebucht. Bitte wählen Sie ein anderes Datum.
                            </p>
                          </Card>
                        ) : (
                          <div>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                              {availableSlots.map((slot) => (
                                <Button
                                  key={slot}
                                  variant={selectedTime === slot ? 'default' : 'outline'}
                                  onClick={() => setSelectedTime(slot)}
                                  className="h-14 text-base font-semibold"
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  {slot}
                                </Button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                              💡 Alle Zeitangaben sind Startzeiten. Ihr Termin dauert ca. {selectedWorkshop.estimatedDuration || 60} Minuten.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price Summary */}
                    {selectedDate && selectedTime && (
                      <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">Gesamtpreis</p>
                            <p className="text-sm text-gray-600">
                              {selectedService === 'WHEEL_CHANGE' && hasBalancing && '+ Wuchten '}
                              {selectedService === 'WHEEL_CHANGE' && hasStorage && '+ Einlagerung'}
                            </p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatEUR(
                              selectedWorkshop.basePrice + 
                              (selectedService === 'WHEEL_CHANGE' && hasBalancing ? selectedWorkshop.totalBalancingPrice : 0) +
                              (selectedService === 'WHEEL_CHANGE' && hasStorage ? selectedWorkshop.storagePriceTotal : 0)
                            )}
                          </p>
                        </div>
                      </Card>
                    )}

                    <div className="flex justify-between gap-3 mt-6">
                      <Button variant="outline" onClick={() => setBookingStep(1)}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Zurück
                      </Button>
                      <Button
                        onClick={handleReserveSlot}
                        disabled={!selectedDate || !selectedTime}
                      >
                        Termin reservieren
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {bookingStep === 3 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Zahlung</h3>
                    
                    <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-800">Termin reserviert</p>
                          <p className="text-sm text-yellow-700">
                            Ihr Termin ist für 10 Minuten reserviert. Bitte schließen Sie die Zahlung ab.
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Booking Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold mb-3">Buchungsübersicht</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Werkstatt:</span>
                          <span className="font-medium">{selectedWorkshop.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service:</span>
                          <span className="font-medium">{SERVICE_TYPES[selectedService].label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fahrzeug:</span>
                          <span className="font-medium">{selectedVehicle.brand} {selectedVehicle.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Termin:</span>
                          <span className="font-medium">
                            {new Date(selectedDate).toLocaleDateString('de-DE')} um {selectedTime} Uhr
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                          <span>Gesamtpreis:</span>
                          <span className="text-blue-600">
                            {formatEUR(
                              selectedWorkshop.basePrice + 
                              (hasBalancing ? selectedWorkshop.totalBalancingPrice : 0) +
                              (hasStorage ? selectedWorkshop.storagePriceTotal : 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Button
                          variant={paymentMethod === 'STRIPE' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('STRIPE')}
                          className="flex-1"
                        >
                          💳 Kreditkarte (Stripe)
                        </Button>
                        <Button
                          variant={paymentMethod === 'PAYPAL' ? 'default' : 'outline'}
                          onClick={() => setPaymentMethod('PAYPAL')}
                          className="flex-1"
                        >
                          🅿️ PayPal
                        </Button>
                      </div>

                      {paymentMethod === 'STRIPE' && (
                        <Button
                          onClick={handleStripePayment}
                          disabled={processingPayment}
                          className="w-full"
                          size="lg"
                        >
                          {processingPayment ? (
                            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Verarbeitung...</>
                          ) : (
                            <>Jetzt mit Kreditkarte bezahlen</>
                          )}
                        </Button>
                      )}

                      {paymentMethod === 'PAYPAL' && (
                        <PayPalButtons
                          createOrder={(data, actions) => {
                            return actions.order.create({
                              intent: 'CAPTURE',
                              purchase_units: [{
                                amount: {
                                  currency_code: 'EUR',
                                  value: (
                                    selectedWorkshop.basePrice + 
                                    (hasBalancing ? selectedWorkshop.totalBalancingPrice : 0) +
                                    (hasStorage ? selectedWorkshop.storagePriceTotal : 0)
                                  ).toFixed(2)
                                },
                                description: `${SERVICE_TYPES[selectedService].label} - ${selectedWorkshop.name}`
                              }]
                            })
                          }}
                          onApprove={handlePayPalApprove}
                          onError={(err) => {
                            console.error('PayPal error:', err)
                            alert('PayPal-Zahlung fehlgeschlagen')
                          }}
                        />
                      )}
                    </div>

                    <div className="flex justify-start mt-6">
                      <Button variant="outline" onClick={() => setBookingStep(2)}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Zurück
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {bookingStep === 4 && bookingConfirmation && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Buchung bestätigt!</h3>
                    <p className="text-gray-600 mb-6">
                      Ihre Buchung wurde erfolgreich abgeschlossen.
                    </p>

                    <Card className="p-6 bg-gray-50 text-left max-w-md mx-auto mb-6">
                      <h4 className="font-semibold mb-4 text-center">Buchungsdetails</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Buchungsnummer:</span>
                          <span className="font-mono font-semibold">{bookingConfirmation.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Werkstatt:</span>
                          <span className="font-medium">{selectedWorkshop.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Termin:</span>
                          <span className="font-medium">
                            {new Date(selectedDate).toLocaleDateString('de-DE')} • {selectedTime} Uhr
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fahrzeug:</span>
                          <span className="font-medium">{selectedVehicle.brand} {selectedVehicle.model}</span>
                        </div>
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                          <span>Bezahlt:</span>
                          <span className="text-green-600">
                            {formatEUR(bookingConfirmation.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={() => router.push('/dashboard/customer/bookings')}>
                        Meine Buchungen
                      </Button>
                      <Button onClick={resetModal}>
                        Weitere Buchung
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
        </PayPalScriptProvider>
      )}
    </div>
  )
}
