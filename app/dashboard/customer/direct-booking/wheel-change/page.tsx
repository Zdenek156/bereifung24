'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Car, 
  CheckCircle, 
  MapPin, 
  Loader2,
  Star,
  Clock,
  Euro,
  Navigation
} from 'lucide-react'

export default function DirectBookingWheelChangePage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [step, setStep] = useState(1) // 1: Config, 2: Workshop List, 3: Payment
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Step 1: Configuration
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [hasBalancing, setHasBalancing] = useState(false)
  const [hasStorage, setHasStorage] = useState(false)
  const [radiusKm, setRadiusKm] = useState(25)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lon: number } | null>(null)
  
  // Step 2: Workshop List
  const [workshops, setWorkshops] = useState<any[]>([])
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null)

  useEffect(() => {
    if (session?.user) {
      loadVehicles()
      getCustomerLocation()
    }
  }, [session])

  const loadVehicles = async () => {
    try {
      console.log('🚗 Loading vehicles...')
      const response = await fetch('/api/customer/vehicles')
      console.log('📡 Response status:', response.status)
      const result = await response.json()
      console.log('📦 Result:', result)
      
      if (result.success && result.vehicles) {
        console.log('✅ Setting vehicles:', result.vehicles.length)
        setVehicles(result.vehicles)
        if (result.vehicles.length > 0) {
          setSelectedVehicle(result.vehicles[0].id)
          console.log('🎯 Selected vehicle:', result.vehicles[0].id)
        }
      } else {
        console.error('❌ No success or no vehicles in response')
      }
    } catch (err) {
      console.error('💥 Error loading vehicles:', err)
    }
  }

  const getCustomerLocation = async () => {
    try {
      // Try to get user's location from their profile or use browser geolocation
      const user = await fetch('/api/user/profile')
      const userData = await user.json()
      
      if (userData.address) {
        // Geocode address (simplified - in production use proper geocoding API)
        setCustomerLocation({ lat: 51.1657, lon: 10.4515 }) // Germany center as fallback
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCustomerLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            })
          },
          () => {
            // Fallback to Germany center
            setCustomerLocation({ lat: 51.1657, lon: 10.4515 })
          }
        )
      }
    } catch (err) {
      console.error('Error getting location:', err)
      setCustomerLocation({ lat: 51.1657, lon: 10.4515 })
    }
  }

  const handleSearchWorkshops = async () => {
    if (!selectedVehicle || !customerLocation) {
      setError('Bitte wählen Sie ein Fahrzeug aus')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/customer/direct-booking/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          hasBalancing,
          hasStorage,
          radiusKm,
          customerLat: customerLocation.lat,
          customerLon: customerLocation.lon
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setWorkshops(result.workshops || [])
        setStep(2)
      } else {
        setError(result.error || 'Fehler bei der Werkstattsuche')
      }
    } catch (err) {
      setError('Fehler bei der Werkstattsuche')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectWorkshop = (workshop: any) => {
    setSelectedWorkshop(workshop)
    setStep(3)
  }

  const handlePayment = async () => {
    if (!selectedWorkshop || !selectedVehicle) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/customer/direct-booking/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: selectedWorkshop.id,
          vehicleId: selectedVehicle,
          serviceType: 'WHEEL_CHANGE',
          hasBalancing,
          hasStorage,
          basePrice: selectedWorkshop.basePrice,
          balancingPrice: selectedWorkshop.totalBalancingPrice,
          storagePrice: selectedWorkshop.storagePriceTotal,
          totalPrice: selectedWorkshop.totalPrice,
          durationMinutes: selectedWorkshop.estimatedDuration,
          paymentMethod: 'STRIPE'
        })
      })

      const result = await response.json()

      if (response.ok && result.success && result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl
      } else {
        setError(result.error || 'Fehler beim Erstellen der Zahlung')
      }
    } catch (err) {
      setError('Fehler beim Erstellen der Zahlung')
    } finally {
      setLoading(false)
    }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)

  // Step 1: Configuration
  if (step === 1) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🔄 Räder wechseln</h1>
          <p className="text-gray-600">
            Konfigurieren Sie Ihren Service und finden Sie die passende Werkstatt
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                <Car className="inline h-4 w-4 mr-1" />
                Fahrzeug auswählen
              </label>
              {vehicles.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  Keine Fahrzeuge vorhanden. 
                  <Button 
                    variant="link" 
                    onClick={() => router.push('/dashboard/customer/vehicles')}
                    className="p-0 h-auto ml-1"
                  >
                    Jetzt hinzufügen
                  </Button>
                </div>
              ) : (
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.manufacturer} {vehicle.model} ({vehicle.licensePlate})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Service Options */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Zusätzliche Services
              </label>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBalancing}
                    onChange={(e) => setHasBalancing(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Wuchten</div>
                    <div className="text-sm text-gray-600">Alle 4 Räder auswuchten</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasStorage}
                    onChange={(e) => setHasStorage(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Einlagerung</div>
                    <div className="text-sm text-gray-600">Reifen für die nächste Saison einlagern</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Umkreis: {radiusKm} km
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 km</span>
                <span>100 km</span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
                {error}
              </div>
            )}

            <Button
              onClick={handleSearchWorkshops}
              disabled={loading || !selectedVehicle}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Suche Werkstätten...
                </>
              ) : (
                <>
                  <Navigation className="h-5 w-5 mr-2" />
                  Werkstätten finden
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Step 2: Workshop List
  if (step === 2) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setStep(1)}
            className="mb-4"
          >
            ← Zurück zur Konfiguration
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">
            Werkstätten in Ihrer Nähe
          </h1>
          <p className="text-gray-600">
            {workshops.length} {workshops.length === 1 ? 'Werkstatt' : 'Werkstätten'} gefunden • 
            {selectedVehicleData && ` ${selectedVehicleData.manufacturer} ${selectedVehicleData.model}`}
          </p>
        </div>

        {workshops.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Keine Werkstätten gefunden</h2>
            <p className="text-gray-600 mb-4">
              In Ihrem Umkreis ({radiusKm} km) sind leider keine Werkstätten verfügbar.
            </p>
            <Button onClick={() => setStep(1)}>
              Suchradius erweitern
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workshops.map((workshop) => (
              <Card 
                key={workshop.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectWorkshop(workshop)}
              >
                {/* Workshop Header */}
                <div className="mb-3">
                  <h3 className="font-bold text-lg mb-1">{workshop.name}</h3>
                  <p className="text-sm text-gray-600">
                    {workshop.address}, {workshop.postalCode} {workshop.city}
                  </p>
                </div>

                {/* Rating & Distance */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                  {workshop.rating > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{workshop.rating}</span>
                      <span className="text-gray-500">({workshop.reviewCount})</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Noch keine Bewertungen</span>
                  )}
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{workshop.distance} km</span>
                  </div>
                </div>

                {/* Opening Hours */}
                {workshop.openingHours && (
                  <div className="text-sm text-gray-600 mb-3">
                    <Clock className="inline h-4 w-4 mr-1" />
                    {workshop.openingHours}
                  </div>
                )}

                {/* Pricing */}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Grundpreis:</span>
                    <span>{formatEUR(workshop.basePrice)}</span>
                  </div>
                  {hasBalancing && workshop.totalBalancingPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>+ Wuchten (4x):</span>
                      <span>{formatEUR(workshop.totalBalancingPrice)}</span>
                    </div>
                  )}
                  {hasStorage && workshop.storagePriceTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>+ Einlagerung:</span>
                      <span>{formatEUR(workshop.storagePriceTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Gesamt:</span>
                    <span className="text-blue-600">{formatEUR(workshop.totalPrice)}</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="text-sm text-gray-600 mt-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  ca. {workshop.estimatedDuration} Min.
                </div>

                {/* Select Button */}
                <Button className="w-full mt-4" size="sm">
                  Auswählen & Bezahlen
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Step 3: Payment Confirmation
  if (step === 3 && selectedWorkshop) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setStep(2)}
            className="mb-4"
          >
            ← Zurück zur Werkstattauswahl
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Buchung bestätigen</h2>

          {/* Workshop Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-2">{selectedWorkshop.name}</h3>
            <p className="text-sm text-gray-600">
              {selectedWorkshop.address}, {selectedWorkshop.postalCode} {selectedWorkshop.city}
            </p>
            {selectedWorkshop.rating > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{selectedWorkshop.rating}</span>
                <span className="text-sm text-gray-500">
                  ({selectedWorkshop.reviewCount} Bewertungen)
                </span>
              </div>
            )}
          </div>

          {/* Service Summary */}
          <div className="border-t border-b py-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <span>Service:</span>
              <span className="font-semibold">Räderwechsel</span>
            </div>
            <div className="flex justify-between">
              <span>Fahrzeug:</span>
              <span className="font-semibold">
                {selectedVehicleData?.manufacturer} {selectedVehicleData?.model}
              </span>
            </div>
            {hasBalancing && (
              <div className="flex justify-between">
                <span>Wuchten:</span>
                <span className="font-semibold">✓ Ja</span>
              </div>
            )}
            {hasStorage && (
              <div className="flex justify-between">
                <span>Einlagerung:</span>
                <span className="font-semibold">✓ Ja</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Dauer:</span>
              <span className="font-semibold">ca. {selectedWorkshop.estimatedDuration} Min.</span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between">
              <span>Grundpreis:</span>
              <span>{formatEUR(selectedWorkshop.basePrice)}</span>
            </div>
            {hasBalancing && selectedWorkshop.totalBalancingPrice > 0 && (
              <div className="flex justify-between">
                <span>Wuchten (4 Räder):</span>
                <span>{formatEUR(selectedWorkshop.totalBalancingPrice)}</span>
              </div>
            )}
            {hasStorage && selectedWorkshop.storagePriceTotal > 0 && (
              <div className="flex justify-between">
                <span>Einlagerung:</span>
                <span>{formatEUR(selectedWorkshop.storagePriceTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Gesamtpreis:</span>
              <span className="text-blue-600">{formatEUR(selectedWorkshop.totalPrice)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm">
              <strong>💳 Sichere Bezahlung mit Stripe</strong><br />
              Nach erfolgreicher Zahlung können Sie Ihren Wunschtermin auswählen.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 mb-4">
              {error}
            </div>
          )}

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Weiterleitung...
              </>
            ) : (
              <>
                <Euro className="h-5 w-5 mr-2" />
                Jetzt bezahlen ({formatEUR(selectedWorkshop.totalPrice)})
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Mit dem Klick auf "Jetzt bezahlen" werden Sie zu Stripe weitergeleitet.
          </p>
        </Card>
      </div>
    )
  }

  return null
}
