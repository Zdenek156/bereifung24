'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  MapPin, 
  Star,
  Navigation,
  Loader2,
  SlidersHorizontal,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const SERVICE_TYPES = {
  WHEEL_CHANGE: { label: 'Räderwechsel', icon: '🔄' },
  TIRE_REPAIR: { label: 'Reifenreparatur', icon: '🔧' },
  WHEEL_ALIGNMENT: { label: 'Achsvermessung', icon: '📐' },
  AC_SERVICE: { label: 'Klimaanlagen-Service', icon: '❄️' },
}

export default function SuchePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL Parameters
  const serviceParam = searchParams.get('service') || 'WHEEL_CHANGE'
  const postalCodeParam = searchParams.get('postalCode') || ''
  const radiusParam = searchParams.get('radiusKm') || '25'
  const balancingParam = searchParams.get('balancing') === 'true'
  const storageParam = searchParams.get('storage') === 'true'
  const useGeoParam = searchParams.get('useGeo') === 'true'
  
  // Search State
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lon: number } | null>(null)
  
  // Filter State
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [minRating, setMinRating] = useState(0)
  const [maxDistance, setMaxDistance] = useState(100)
  const [showOnlyHighRated, setShowOnlyHighRated] = useState(false)
  const [showOnlyNearby, setShowOnlyNearby] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  
  // Sorting
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance')

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

  // Initial search on page load
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true)
      setHasSearched(true)
      setError(null)

      try {
        let location = customerLocation

        // Get location from postal code or geolocation
        if (useGeoParam && !location) {
          // Request geolocation
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const loc = {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude
                }
                setCustomerLocation(loc)
                searchWorkshops(loc)
              },
              () => {
                setError('Standortzugriff verweigert. Bitte geben Sie eine PLZ ein.')
                setLoading(false)
              }
            )
            return
          }
        } else if (postalCodeParam && !location) {
          location = await geocodePostalCode(postalCodeParam)
          if (!location) {
            setError('PLZ konnte nicht gefunden werden.')
            setLoading(false)
            return
          }
          setCustomerLocation(location)
        }

        if (location) {
          await searchWorkshops(location)
        } else {
          setError('Bitte geben Sie eine PLZ ein oder aktivieren Sie den Standortzugriff.')
          setLoading(false)
        }
      } catch (err) {
        setError('Fehler bei der Suche')
        setLoading(false)
      }
    }

    performSearch()
  }, [])

  const searchWorkshops = async (location: { lat: number; lon: number }) => {
    try {
      const response = await fetch('/api/customer/direct-booking/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: serviceParam,
          hasBalancing: balancingParam,
          hasStorage: storageParam,
          radiusKm: parseInt(radiusParam),
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

  // Apply filters
  const filteredWorkshops = workshops.filter((w) => {
    // Price filter
    if (w.totalPrice < priceRange[0] || w.totalPrice > priceRange[1]) return false
    
    // Rating filter
    if (w.rating && w.rating < minRating) return false
    
    // Distance filter
    if (w.distance > maxDistance) return false
    
    // High rated only (>= 4.0)
    if (showOnlyHighRated && (!w.rating || w.rating < 4.0)) return false
    
    // Nearby only (<= 10km)
    if (showOnlyNearby && w.distance > 10) return false
    
    return true
  })

  // Sort workshops
  const sortedWorkshops = [...filteredWorkshops].sort((a, b) => {
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

  const maxPrice = workshops.length > 0 ? Math.max(...workshops.map(w => w.totalPrice)) : 500

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-primary-600 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-600 text-xl font-bold">B24</span>
              </div>
              <h1 className="text-xl font-bold text-white">Bereifung24</h1>
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </nav>

      {/* Search Header */}
      <div className="bg-primary-600 text-white py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-2">
            {SERVICE_TYPES[serviceParam as keyof typeof SERVICE_TYPES]?.icon}{' '}
            {SERVICE_TYPES[serviceParam as keyof typeof SERVICE_TYPES]?.label}
          </h2>
          <p className="text-primary-100 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {postalCodeParam || 'Aktueller Standort'} · {radiusParam} km Umkreis
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters (only shown after search with results) */}
          {hasSearched && workshops.length > 0 && (
            <aside className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-24">
              {/* Filter Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filtern nach:
                </h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Filters */}
              <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Price Range */}
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold mb-3">Ihr Budget</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{formatEUR(priceRange[0])}</span>
                      <span>{formatEUR(priceRange[1])}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={maxPrice}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <p className="text-xs text-gray-500">
                      {filteredWorkshops.length} von {workshops.length} Werkstätten
                    </p>
                  </div>
                </div>

                {/* Popular Filters */}
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold mb-3">Beliebte Filter</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={showOnlyHighRated}
                        onChange={(e) => setShowOnlyHighRated(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm">Sehr gut: 8+ ({workshops.filter(w => w.rating >= 4).length})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={showOnlyNearby}
                        onChange={(e) => setShowOnlyNearby(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm">Weniger als 10 km ({workshops.filter(w => w.distance <= 10).length})</span>
                    </label>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-semibold mb-3">Bewertung</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                          minRating === rating ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-sm">& höher</span>
                        {minRating === rating && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance Filter */}
                <div className="p-4">
                  <h4 className="font-semibold mb-3">Maximale Entfernung</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>bis {maxDistance} km</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>
          )}

          {/* Main Content - Workshop List */}
          <main className="flex-1">
            {/* Sort Bar - only show after search with results */}
            {hasSearched && workshops.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm text-gray-600">
                    <strong>{sortedWorkshops.length}</strong> Werkstätten gefunden
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sortieren:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none"
                    >
                      <option value="distance">Entfernung</option>
                      <option value="price">Preis (niedrig-hoch)</option>
                      <option value="rating">Bewertung</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Workshop Cards */}
            {!loading && !error && (
              <div className="space-y-4">
                {sortedWorkshops.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <p className="text-gray-500 mb-4">Keine Werkstätten gefunden</p>
                    <p className="text-sm text-gray-400">Versuchen Sie, die Filter anzupassen</p>
                  </div>
                ) : (
                  sortedWorkshops.map((workshop) => (
                    <div
                      key={workshop.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Workshop Image */}
                        <div className="md:w-64 h-48 md:h-auto bg-gray-200 flex-shrink-0">
                          {workshop.logoUrl ? (
                            <img
                              src={workshop.logoUrl}
                              alt={workshop.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <span className="text-6xl">🔧</span>
                            </div>
                          )}
                        </div>

                        {/* Workshop Info */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {workshop.name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{workshop.distance.toFixed(1)} km entfernt</span>
                              </div>
                            </div>
                            {workshop.rating && (
                              <div className="flex items-center gap-1 bg-primary-600 text-white px-3 py-1 rounded-lg font-bold">
                                <Star className="w-4 h-4 fill-white" />
                                <span>{workshop.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {workshop.address}
                          </p>

                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Gesamtpreis</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatEUR(workshop.totalPrice)}
                              </p>
                            </div>
                            <Link
                              href={`/login?redirect=/dashboard/customer/direct-booking?workshop=${workshop.id}`}
                              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                            >
                              Jetzt buchen
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
