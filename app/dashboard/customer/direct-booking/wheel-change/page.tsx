'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Car, 
  MapPin, 
  Loader2,
  Star,
  Clock,
  Navigation,
  Search,
  ArrowUpDown
} from 'lucide-react'

export default function DirectBookingWheelChangePage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Search Configuration
  const [postalCode, setPostalCode] = useState('')
  const [useGeolocation, setUseGeolocation] = useState(false)
  const [hasBalancing, setHasBalancing] = useState(false)
  const [hasStorage, setHasStorage] = useState(false)
  const [radiusKm, setRadiusKm] = useState(25)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lon: number } | null>(null)
  
  // Results
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Sorting
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance')
  
  // Modal
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null)

  // Geocode postal code to coordinates
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

  // Get user location via browser
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

      // If no geolocation, geocode postal code
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
          vehicleId: 'temp', // Not needed for initial search
          hasBalancing,
          hasStorage,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Search */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-3">🔄 Räderwechsel in Ihrer Nähe</h1>
            <p className="text-blue-100 mb-8">
              Vergleichen Sie Werkstätten nach Preis, Entfernung und Bewertung
            </p>

            {/* Search Card */}
            <Card className="bg-white text-gray-900 p-6 shadow-xl">
              <div className="grid gap-6">
                {/* Location Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Standort
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="PLZ oder Ort eingeben"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      disabled={useGeolocation}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button
                      variant="outline"
                      onClick={requestGeolocation}
                      disabled={useGeolocation}
                      className="whitespace-nowrap"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      {useGeolocation ? 'Aktiviert' : 'Aktueller Standort'}
                    </Button>
                  </div>
                  {useGeolocation && customerLocation && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Standort ermittelt
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

                {/* Service Checkboxes */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Zusätzliche Services
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
                      Im Umkreis von {radiusKm} km
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
                        {/* Workshop Logo Placeholder */}
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Car className="h-10 w-10 text-blue-600" />
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
                                <span className="font-medium">Räderwechsel:</span> {formatEUR(workshop.basePrice)}
                              </div>
                              {hasBalancing && workshop.totalBalancingPrice > 0 && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">+ Wuchten:</span> {formatEUR(workshop.totalBalancingPrice)}
                                </div>
                              )}
                              {hasStorage && workshop.storagePriceTotal > 0 && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">+ Einlagerung:</span> {formatEUR(workshop.storagePriceTotal)}
                                </div>
                              )}
                              <div className="text-2xl font-bold text-blue-600 mt-2">
                                {formatEUR(workshop.totalPrice)}
                              </div>
                            </div>

                            {/* Details Button */}
                            <Button
                              onClick={() => setSelectedWorkshop(workshop)}
                              size="lg"
                            >
                              Details ansehen
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
                    die Direktbuchungen anbieten.
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

      {/* Modal for Workshop Details - Phase 2 */}
      {selectedWorkshop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedWorkshop.name}</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedWorkshop.address}, {selectedWorkshop.postalCode} {selectedWorkshop.city}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedWorkshop(null)}
                  className="text-gray-500"
                >
                  ✕
                </Button>
              </div>

              <div className="border-t pt-4">
                <p className="text-center text-gray-600 py-8">
                  🚧 Buchungsflow folgt in Phase 2:<br />
                  Fahrzeugauswahl → Terminwahl → Bezahlung
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
