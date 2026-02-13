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
  ChevronUp,
  Search,
  RefreshCw
} from 'lucide-react'

const SERVICE_TYPES = {
  WHEEL_CHANGE: { label: 'Räderwechsel', icon: '🔄' },
  TIRE_REPAIR: { label: 'Reifenreparatur', icon: '🔧' },
  WHEEL_ALIGNMENT: { label: 'Achsvermessung', icon: '📐' },
  AC_SERVICE: { label: 'Klimaanlagen-Service', icon: '❄️' },
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100]

export default function SuchePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Search form state (editable)
  const [selectedService, setSelectedService] = useState(searchParams.get('service') || 'WHEEL_CHANGE')
  const [postalCode, setPostalCode] = useState(searchParams.get('postalCode') || '')
  const [radiusKm, setRadiusKm] = useState(Number(searchParams.get('radiusKm')) || 25)
  const [useGeolocation, setUseGeolocation] = useState(searchParams.get('useGeo') === 'true')
  
  // Service-specific filter state (in sidebar)
  const [hasBalancing, setHasBalancing] = useState(searchParams.get('balancing') === 'true')
  const [hasStorage, setHasStorage] = useState(searchParams.get('storage') === 'true')
  
  // Tire Search State
  const [includeTires, setIncludeTires] = useState(searchParams.get('withTires') === 'true')
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [tireDimensions, setTireDimensions] = useState({
    width: searchParams.get('width') || '',
    height: searchParams.get('height') || '',
    diameter: searchParams.get('diameter') || ''
  })
  
  // Tire Filter State
  const [tireBudget, setTireBudget] = useState<number>(500)
  const [tireSeasons, setTireSeasons] = useState<string[]>(['s', 'w', 'g']) // summer, winter, all-season
  const [tireBrands, setTireBrands] = useState<string[]>([])
  const [requireRunFlat, setRequireRunFlat] = useState(false)
  const [require3PMSF, setRequire3PMSF] = useState(false)
  
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

  // Geolocation handling
  const requestGeolocation = () => {
    if (!useGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }
          setCustomerLocation(loc)
          setUseGeolocation(true)
          setPostalCode('') // Clear PLZ when using geolocation
        },
        (error) => {
          alert('Standortzugriff verweigert. Bitte geben Sie eine PLZ ein.')
        }
      )
    } else {
      setUseGeolocation(false)
      setCustomerLocation(null)
    }
  }

  // Search handler for form
  const handleSearch = async () => {
    if (!postalCode && !useGeolocation) {
      alert('Bitte PLZ eingeben oder Standort aktivieren')
      return
    }

    // Validate tire dimensions if tire search is enabled
    if (includeTires) {
      if (!tireDimensions.width || !tireDimensions.height || !tireDimensions.diameter) {
        alert('Bitte geben Sie die Reifengröße ein (Breite/Höhe/Zoll)')
        return
      }
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      let location = customerLocation

      // Get location
      if (useGeolocation && !location) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const loc = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
              }
              setCustomerLocation(loc)
              await searchWorkshops(loc)
            },
            () => {
              setError('Standortzugriff verweigert. Bitte geben Sie eine PLZ ein.')
              setLoading(false)
            }
          )
          return
        }
      } else if (postalCode && !location) {
        location = await geocodePostalCode(postalCode)
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

  // Initial search on page load
  useEffect(() => {
    const performInitialSearch = async () => {
      const urlPostalCode = searchParams.get('postalCode') || ''
      const urlUseGeo = searchParams.get('useGeo') === 'true'

      if (!urlPostalCode && !urlUseGeo) {
        return // No search params, don't auto-search
      }

      setLoading(true)
      setHasSearched(true)
      setError(null)

      try {
        let location = null

        // Get location from postal code or geolocation
        if (urlUseGeo) {
          // Request geolocation
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const loc = {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude
                }
                setCustomerLocation(loc)
                await searchWorkshops(loc)
              },
              () => {
                setError('Standortzugriff verweigert. Bitte geben Sie eine PLZ ein.')
                setLoading(false)
              }
            )
            return
          }
        } else if (urlPostalCode) {
          location = await geocodePostalCode(urlPostalCode)
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

    performInitialSearch()
  }, []) // Only run once on mount

  // Re-search when service-specific filters change
  useEffect(() => {
    if (hasSearched && customerLocation) {
      const debounce = setTimeout(() => {
        searchWorkshops(customerLocation)
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [hasBalancing, hasStorage])

  const searchWorkshops = async (location: { lat: number; lon: number }) => {
    try {
      const response = await fetch('/api/customer/direct-booking/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: selectedService,
          hasBalancing,
          hasStorage,
          radiusKm,
          customerLat: location.lat,
          customerLon: location.lon,
          // Tire search parameters
          includeTires,
          tireDimensions: includeTires ? tireDimensions : undefined,
          tireFilters: includeTires ? {
            maxPrice: tireBudget,
            seasons: tireSeasons,
            brands: tireBrands,
            runFlat: requireRunFlat || undefined,
            threePMSF: require3PMSF || undefined
          } : undefined
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
            <Link href="/" className="flex items-center gap-3">
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

      {/* Hero Section with Search Bar */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white pt-12 pb-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Finde deine Werkstatt
          </h2>
          <p className="text-xl text-primary-100">
            Vergleiche Preise, buche direkt online – einfach und transparent
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            {/* Service Type Toggle */}
            <div className="mb-4 flex gap-3">
              <button
                onClick={() => setIncludeTires(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  !includeTires
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔧 Nur Service
              </button>
              <button
                onClick={() => setIncludeTires(true)}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  includeTires
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🚗 Reifen mit Montage
              </button>
            </div>

            {/* Tire Dimensions (only if includeTires) */}
            {includeTires && (
              <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-3">Reifengröße eingeben:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Breite (z.B. 205)"
                    value={tireDimensions.width}
                    onChange={(e) => setTireDimensions({...tireDimensions, width: e.target.value})}
                    className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                  />
                  <span className="flex items-center text-gray-400 font-bold">/</span>
                  <input
                    type="text"
                    placeholder="Höhe (z.B. 55)"
                    value={tireDimensions.height}
                    onChange={(e) => setTireDimensions({...tireDimensions, height: e.target.value})}
                    className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                  />
                  <span className="flex items-center text-gray-400 font-bold">R</span>
                  <input
                    type="text"
                    placeholder="Zoll (z.B. 16)"
                    value={tireDimensions.diameter}
                    onChange={(e) => setTireDimensions({...tireDimensions, diameter: e.target.value})}
                    className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2">z.B. 205/55 R16 (finden Sie auf der Reifenflanke)</p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3">
              {/* Service Selection */}
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 font-medium"
                >
                  <option value="WHEEL_CHANGE">🔄 Räderwechsel</option>
                  <option value="TIRE_REPAIR">🔧 Reifenreparatur</option>
                  <option value="WHEEL_ALIGNMENT">📐 Achsvermessung</option>
                  <option value="AC_SERVICE">❄️ Klimaanlagen-Service</option>
                </select>
              </div>

              {/* Location Input or Geolocation Indicator */}
              <div className="flex-1 min-w-[200px]">
                {useGeolocation ? (
                  <div className="w-full px-4 py-3 rounded-xl border-2 border-green-500 bg-green-50 flex items-center gap-2 text-green-700 font-medium">
                    <Navigation className="w-5 h-5" />
                    <span>Standort aktiv</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="PLZ oder Ort"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700"
                  />
                )}
              </div>

              {/* Radius Selection */}
              <div className="flex-none w-full md:w-32">
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 font-medium"
                >
                  {RADIUS_OPTIONS.map((radius) => (
                    <option key={radius} value={radius}>
                      {radius} km
                    </option>
                  ))}
                </select>
              </div>

              {/* Standort nutzen Button */}
              <button
                onClick={requestGeolocation}
                className={`flex-none px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  useGeolocation
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Navigation className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {useGeolocation ? 'Deaktivieren' : 'Standort nutzen'}
                </span>
              </button>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-none px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Suche...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Suchen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

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

                {/* Service-Specific Options (for WHEEL_CHANGE only) */}
                {selectedService === 'WHEEL_CHANGE' && (
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-semibold mb-3">Service-Optionen</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={hasBalancing}
                          onChange={(e) => {
                            setHasBalancing(e.target.checked)
                            // Will trigger re-search via useEffect
                          }}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm">🎯 Auswuchten inkl.</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={hasStorage}
                          onChange={(e) => {
                            setHasStorage(e.target.checked)
                            // Will trigger re-search via useEffect
                          }}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm">📦 Einlagerung gewünscht</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Tire Filters (only if includeTires) */}
                {includeTires && (
                  <>
                    {/* Tire Budget */}
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="font-semibold mb-3">🚗 Reifen-Budget (pro Stück)</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>bis {formatEUR(tireBudget)}</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="500"
                          step="10"
                          value={tireBudget}
                          onChange={(e) => setTireBudget(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                      </div>
                    </div>

                    {/* Tire Season */}
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="font-semibold mb-3">❄️ Saison</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={tireSeasons.includes('s')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTireSeasons([...tireSeasons, 's'])
                              } else {
                                setTireSeasons(tireSeasons.filter(s => s !== 's'))
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm">☀️ Sommerreifen</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={tireSeasons.includes('w')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTireSeasons([...tireSeasons, 'w'])
                              } else {
                                setTireSeasons(tireSeasons.filter(s => s !== 'w'))
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm">❄️ Winterreifen</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={tireSeasons.includes('g')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTireSeasons([...tireSeasons, 'g'])
                              } else {
                                setTireSeasons(tireSeasons.filter(s => s !== 'g'))
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm">🔄 Ganzjahresreifen</span>
                        </label>
                      </div>
                    </div>

                    {/* Tire Features */}
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="font-semibold mb-3">✨ Eigenschaften</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={requireRunFlat}
                            onChange={(e) => setRequireRunFlat(e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm">🛡️ RunFlat</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={require3PMSF}
                            onChange={(e) => setRequire3PMSF(e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm">❄️ 3PMSF (Schneeflocke)</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

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
                              {includeTires && workshop.tirePrice ? (
                                <>
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500">Service</p>
                                    <p className="text-lg font-semibold text-gray-700">
                                      {formatEUR(workshop.basePrice || 0)}
                                    </p>
                                  </div>
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500">
                                      Reifen ({workshop.tireQuantity || 4}x {workshop.tireBrand || ''})
                                    </p>
                                    <p className="text-lg font-semibold text-gray-700">
                                      {formatEUR(workshop.tirePrice || 0)}
                                    </p>
                                  </div>
                                  <div className="pt-2 border-t border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Gesamtpreis</p>
                                    <p className="text-2xl font-bold text-primary-600">
                                      {formatEUR(workshop.totalPrice)}
                                    </p>
                                  </div>
                                </>
                              ) : includeTires ? (
                                <div className="text-yellow-600">
                                  <p className="text-xs mb-1">⚠️ Keine Reifen verfügbar</p>
                                  <p className="text-sm font-semibold">
                                    {formatEUR(workshop.basePrice || workshop.totalPrice)}
                                  </p>
                                  <p className="text-xs text-gray-500">Nur Service</p>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-500 mb-1">Gesamtpreis</p>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {formatEUR(workshop.totalPrice)}
                                  </p>
                                </>
                              )}
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
