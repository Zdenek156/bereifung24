'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  MapPin, 
  Navigation, 
  Star, 
  Check, 
  TrendingUp, 
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  Clock,
  ChevronUp
} from 'lucide-react'
import ServiceFilters from './components/ServiceFilters'

const SERVICES = [
  { id: 'WHEEL_CHANGE', label: 'Räderwechsel', icon: '🔄', description: 'Sommer-/Winterreifen wechseln' },
  { id: 'TIRE_CHANGE', label: 'Reifenwechsel', icon: '🚗', description: 'Reifen montieren/demontieren' },
  { id: 'TIRE_REPAIR', label: 'Reifenreparatur', icon: '🔧', description: 'Reifen flicken und abdichten' },
  { id: 'MOTORCYCLE_TIRE', label: 'Motorradreifen', icon: '🏍️', description: 'Motorradreifen-Service' },
  { id: 'ALIGNMENT_BOTH', label: 'Achsvermessung + Einstellung', icon: '📏', description: 'Vorder- und Hinterachse vermessen' },
  { id: 'CLIMATE_SERVICE', label: 'Klimaservice', icon: '❄️', description: 'Klimaanlage warten & prüfen' },
]

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
]

const STATS = [
  { value: '1000+', label: 'Werkstätten' },
  { value: '50.000+', label: 'Zufriedene Kunden' },
  { value: '4.8★', label: 'Durchschnittsbewertung' },
  { value: '24/7', label: 'Online Buchung' },
]

export default function NewHomePage() {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState('WHEEL_CHANGE')
  const [postalCode, setPostalCode] = useState('')
  const [radiusKm, setRadiusKm] = useState(25)
  const [useGeolocation, setUseGeolocation] = useState(false)
  
  // Search state
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  
  // Service-specific package filters
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  
  // Restore search from URL on page load (for browser back button)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const savedWorkshops = searchParams.get('results')
      const savedService = searchParams.get('service')
      const savedPostalCode = searchParams.get('postalCode')
      const savedRadius = searchParams.get('radius')
      const savedLat = searchParams.get('lat')
      const savedLon = searchParams.get('lon')
      const savedScroll = searchParams.get('scroll')

      if (savedWorkshops) {
        try {
          const parsedWorkshops = JSON.parse(decodeURIComponent(savedWorkshops))
          setWorkshops(parsedWorkshops)
          setHasSearched(true)
          if (savedService) setSelectedService(savedService)
          if (savedPostalCode) setPostalCode(savedPostalCode)
          if (savedRadius) setRadiusKm(Number(savedRadius))
          if (savedLat && savedLon) {
            setCustomerLocation({ lat: Number(savedLat), lon: Number(savedLon) })
          }
          // Restore scroll position
          if (savedScroll) {
            setTimeout(() => window.scrollTo(0, Number(savedScroll)), 100)
          }
        } catch (e) {
          console.error('Error restoring search:', e)
        }
      }
    }
  }, [])

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('workshop_favorites')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [minRating, setMinRating] = useState(0)
  const [maxDistance, setMaxDistance] = useState(100)
  const [showOnlyHighRated, setShowOnlyHighRated] = useState(false)
  const [showOnlyNearby, setShowOnlyNearby] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance')

  // Geocode postal code
  const geocodePostalCode = async (input: string) => {
    try {
      // Check if input is a postal code (5 digits) or city name
      const isPostalCode = /^\d{5}$/.test(input)
      
      let url = ''
      if (isPostalCode) {
        url = `https://nominatim.openstreetmap.org/search?format=json&country=Germany&postalcode=${input}`
      } else {
        // Search by city name
        url = `https://nominatim.openstreetmap.org/search?format=json&country=Germany&city=${encodeURIComponent(input)}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data && data.length > 0) {
        // Sort results by importance (OSM importance score)
        // This helps prioritize larger cities when there are multiple matches
        const sorted = data.sort((a: any, b: any) => {
          const importanceA = parseFloat(a.importance || '0')
          const importanceB = parseFloat(b.importance || '0')
          return importanceB - importanceA
        })
        
        return {
          lat: parseFloat(sorted[0].lat),
          lon: parseFloat(sorted[0].lon)
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
      // Deaktivieren: Location zurücksetzen, damit PLZ-Suche wieder funktioniert
      setUseGeolocation(false)
      setCustomerLocation(null)
      setHasSearched(false) // Reset search state
    }
  }

  // Toggle favorite
  const toggleFavorite = (workshopId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(workshopId)
        ? prev.filter(id => id !== workshopId)
        : [...prev, workshopId]
      
      // Save to localStorage
      localStorage.setItem('workshop_favorites', JSON.stringify(newFavorites))
      
      // TODO: If user is logged in, also save to database
      // await fetch('/api/customer/favorites', { method: 'POST', body: JSON.stringify({ workshopId }) })
      
      return newFavorites
    })
  }

  // Search workshops
  const searchWorkshops = async (location: { lat: number; lon: number }) => {
    try {
      const response = await fetch('/api/customer/direct-booking/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: selectedService,
          packageTypes: selectedPackages,
          radiusKm,
          customerLat: location.lat,
          customerLon: location.lon
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const workshops = result.workshops || []
        setWorkshops(workshops)
        setError(null)
        
        // Save search to URL (for browser back button)
        const params = new URLSearchParams()
        params.set('results', encodeURIComponent(JSON.stringify(workshops)))
        params.set('service', selectedService)
        params.set('postalCode', postalCode)
        params.set('radius', radiusKm.toString())
        params.set('lat', location.lat.toString())
        params.set('lon', location.lon.toString())
        window.history.replaceState({}, '', `?${params.toString()}`)
      } else {
        setWorkshops([])
        setError(result.error || 'Keine Werkstätten gefunden')
      }
    } catch (err) {
      setWorkshops([])
      setError('Fehler bei der Suche')
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  // Handle search
  const handleSearch = async () => {
    if (!postalCode && !useGeolocation) {
      alert('Bitte PLZ oder Ort eingeben oder Standort aktivieren')
      return
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
          setError('PLZ oder Ort konnte nicht gefunden werden. Bitte überprüfen Sie Ihre Eingabe.')
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

  // Re-search when service-specific filters change
  useEffect(() => {
    if (hasSearched && customerLocation) {
      const debounce = setTimeout(() => {
        searchWorkshops(customerLocation)
      }, 300)
      return () => clearTimeout(debounce)
    }
  }, [selectedPackages])

  // Apply filters
  const filteredWorkshops = workshops.filter((w) => {
    if (w.totalPrice < priceRange[0] || w.totalPrice > priceRange[1]) return false
    if (w.rating && w.rating < minRating) return false
    if (w.distance > maxDistance) return false
    if (showOnlyHighRated && w.rating < 4) return false
    if (showOnlyNearby && w.distance > 10) return false
    return true
  })

  // Sort workshops
  const sortedWorkshops = [...filteredWorkshops].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.totalPrice - b.totalPrice
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'distance':
      default:
        return a.distance - b.distance
    }
  })

  // Get max price for slider
  const maxPrice = workshops.length > 0 
    ? Math.max(...workshops.map(w => w.totalPrice)) 
    : 500

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const handleBooking = (workshop: any) => {
    // Save current scroll position
    const currentScroll = window.scrollY
    const currentUrl = window.location.search
    const urlParams = new URLSearchParams(currentUrl)
    urlParams.set('scroll', currentScroll.toString())
    window.history.replaceState({}, '', `?${urlParams.toString()}`)
    
    // Navigate to workshop detail page with all workshop data as URL params
    const params = new URLSearchParams({
      name: workshop.name,
      city: workshop.city || '',
      distance: workshop.distance.toString(),
      rating: workshop.rating.toString(),
      reviewCount: workshop.reviewCount.toString(),
      totalPrice: workshop.totalPrice.toString(),
      duration: workshop.estimatedDuration?.toString() || '60',
    })
    router.push(`/home/workshop/${workshop.id}?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation - Blue like current homepage */}
      <nav className="bg-primary-600 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-600 text-xl font-bold">B24</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Bereifung24</h1>
              </div>
            </div>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Booking.com Style */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white pt-12 pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Finde deine Werkstatt
            </h2>
            <p className="text-xl text-primary-100">
              Vergleiche Preise, buche direkt online
            </p>
          </div>

          {/* Search Card - Booking.com Style: One Line */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-3">
              <div className="flex flex-col md:flex-row gap-2">
                {/* Service Dropdown */}
                <div className="flex-1">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full h-16 px-4 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                  >
                    {SERVICES.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location Input */}
                <div className="flex-1">
                  {!useGeolocation ? (
                    <div className="relative h-16">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="PLZ oder Ort"
                        className="w-full h-full pl-12 pr-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                      />
                    </div>
                  ) : (
                    <div className="h-16 px-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 font-semibold text-sm">Standort aktiv</span>
                    </div>
                  )}
                </div>

                {/* Radius Dropdown */}
                <div className="w-full md:w-32">
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full h-16 px-4 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                  >
                    {RADIUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Geolocation Button - Only Icon */}
                <button
                  onClick={() => {
                    if (useGeolocation) {
                      setUseGeolocation(false)
                      setCustomerLocation(null)
                      setHasSearched(false)
                    } else {
                      requestGeolocation()
                    }
                  }}
                  className={`w-16 h-16 rounded-xl font-semibold transition-all flex items-center justify-center ${
                    useGeolocation
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={useGeolocation ? 'Standort deaktivieren' : 'Standort nutzen'}
                >
                  <Navigation className="w-6 h-6" />
                  <span className="sr-only">
                    {useGeolocation ? 'Standort deaktivieren' : 'Standort nutzen'}
                  </span>
                </button>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto h-16 px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">Suchen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {hasSearched && (
        <section className="py-8 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Sidebar - Filters */}
              {workshops.length > 0 && (
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

                      {/* Service-Specific Package Filters */}
                      <div className="p-4 border-b border-gray-200">
                        <ServiceFilters
                          selectedService={selectedService}
                          onFiltersChange={(packages) => setSelectedPackages(packages)}
                        />
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

                      {/* Distance Filter - REMOVED (already in top radius selector) */}
                    </div>
                  </div>
                </aside>
              )}

              {/* Main Content - Workshop Results */}
              <main className="flex-1">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Suche Werkstätten...</p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {/* No Results */}
                {!loading && !error && workshops.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Keine Werkstätten gefunden
                    </h3>
                    <p className="text-gray-600">
                      Versuchen Sie einen größeren Umkreis oder eine andere PLZ
                    </p>
                  </div>
                )}

                {/* Results */}
                {!loading && workshops.length > 0 && (
                  <div className="space-y-4">
                    {/* Sort Bar */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{sortedWorkshops.length}</span> Werkstätten gefunden
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 whitespace-nowrap">Sortieren:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                        >
                          <option value="distance">Entfernung</option>
                          <option value="price">Preis</option>
                          <option value="rating">Bewertung</option>
                        </select>
                      </div>
                    </div>

                    {/* Workshop Cards */}
                    {sortedWorkshops.map((workshop) => {
                      const isFavorite = favorites.includes(workshop.id)
                      
                      return (
                        <div
                          key={workshop.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-3 sm:p-4 relative"
                        >
                          {/* Favorite Button */}
                          <button
                            onClick={() => toggleFavorite(workshop.id)}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all"
                            title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                          >
                            <svg
                              className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                                isFavorite
                                  ? 'fill-red-500 text-red-500'
                                  : 'fill-none text-gray-400 hover:text-red-500'
                              }`}
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>

                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center overflow-hidden">
                                {workshop.logoUrl ? (
                                  <img 
                                    src={workshop.logoUrl.startsWith('http') ? workshop.logoUrl : workshop.logoUrl} 
                                    alt={`${workshop.name} Logo`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        e.currentTarget.remove()
                                        const span = document.createElement('span')
                                        span.className = 'text-4xl'
                                        span.textContent = '🔧'
                                        parent.appendChild(span)
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-4xl">🔧</span>
                                )}
                              </div>
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 min-w-0">
                              {/* Workshop Name + Bewertung */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-0.5">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{workshop.name}</h3>
                                
                                {/* Bewertung */}
                                {workshop.rating > 0 && (
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-gray-900">{workshop.rating.toFixed(1)}</span>
                                    {workshop.reviewCount > 0 && (
                                      <span className="text-gray-500">({workshop.reviewCount} Bewertungen)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Stadt mit Maps-Button */}
                              <div className="flex items-center gap-2 mb-0.5">
                                {workshop.city && (
                                  <>
                                    <span className="text-sm text-gray-600">{workshop.city}</span>
                                    <button
                                      onClick={() => {
                                        const address = `${workshop.city}${workshop.address ? ', ' + workshop.address : ''}${workshop.postalCode ? ', ' + workshop.postalCode : ''}`
                                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
                                      }}
                                      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded transition-colors"
                                    >
                                      <MapPin className="w-3 h-3" />
                                      In Maps öffnen
                                    </button>
                                  </>
                                )}
                              </div>
                              
                              {/* Distanz */}
                              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                <MapPin className="w-4 h-4" />
                                {workshop.distance.toFixed(1)} km entfernt
                              </div>

                              {/* Available Services */}
                              {workshop.availableServices && workshop.availableServices.length > 0 && (() => {
                                const additionalServices = workshop.availableServices.filter((serviceType: string) => serviceType !== selectedService)
                                return additionalServices.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-0.5">📌 Weitere Services:</p>
                                    <p className="text-xs text-gray-500 mb-1">Zusätzlich buchbar</p>
                                    <div className="flex flex-wrap gap-1">
                                      {additionalServices
                                        .slice(0, 5)
                                        .map((serviceType: string) => {
                                          const service = SERVICES.find(s => s.id === serviceType)
                                          if (!service) return null
                                          
                                          return (
                                            <span 
                                              key={serviceType}
                                              className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                                              title={service.description}
                                            >
                                              <span>{service.icon}</span>
                                              {service.label}
                                            </span>
                                          )
                                        })}
                                      {additionalServices.length > 5 && (
                                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                                          +{additionalServices.length - 5} weitere
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>

                            {/* Price and Button */}
                            <div className="flex flex-col sm:items-end justify-between w-full sm:w-auto sm:ml-auto flex-shrink-0 mt-2 sm:mt-14">
                              <div className="text-left sm:text-right mb-3">
                                <p className="text-xs text-gray-600 mb-0.5">Gesamtpreis</p>
                                {workshop.totalPrice > 0 ? (
                                  <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                                    {formatEUR(workshop.totalPrice)}
                                  </p>
                                ) : (
                                  <p className="text-lg sm:text-xl font-semibold text-gray-500">
                                    Preis auf Anfrage
                                  </p>
                                )}
                                {workshop.estimatedDuration && (
                                  <p className="text-xs text-gray-500 mt-0.5">~ {workshop.estimatedDuration} Min.</p>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleBooking(workshop)}
                                className="w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                              >
                                Verfügbarkeit prüfen
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </main>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section - Only show when not searched */}
      {!hasSearched && (
        <>
          <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Beliebte Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-primary-200 cursor-pointer group"
                onClick={() => {
                  setSelectedService(service.id)
                  document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {service.label}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  Jetzt Werkstätten vergleichen und direkt buchen
                </p>
                <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                  <span>Mehr erfahren</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-gray-900">
              Warum Bereifung24?
            </h3>
            <p className="text-xl text-gray-600">
              Die moderne Art, Werkstätten zu finden
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Transparente Preise</h4>
              <p className="text-gray-600">
                Vergleiche Festpreise von geprüften Werkstätten in deiner Nähe
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Sofort buchen</h4>
              <p className="text-gray-600">
                Wähle deinen Wunschtermin und buche direkt online - einfach und schnell
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Star className="w-7 h-7 text-purple-600" />
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Geprüfte Qualität</h4>
              <p className="text-gray-600">
                Alle Werkstätten sind geprüft und von echten Kunden bewertet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold mb-6">
            Bereit für deinen Reifenservice?
          </h3>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Über 50.000 zufriedene Kunden vertrauen bereits auf Bereifung24
          </p>
          <button
            onClick={() => document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
          >
            Jetzt Werkstatt finden
          </button>
        </div>
      </section>
        </>
      )}

      {/* Footer - Reused from current homepage */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">B24</span>
                </div>
                <h3 className="text-2xl font-bold">Bereifung24</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Deutschlands erste digitale Plattform für Reifenservice. Transparent, fair und einfach.
              </p>
              <div className="flex gap-4">
                <Link href="/app-download" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors" title="Mobile App">
                  <span className="text-xl">📱</span>
                </Link>
                <Link href="/karriere" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors" title="Karriere">
                  <span className="text-xl">💼</span>
                </Link>
                <a href="mailto:info@bereifung24.de" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors" title="Kontakt">
                  <span className="text-xl">📧</span>
                </a>
              </div>
            </div>

            {/* For Customers */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Kunden</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/register/customer" className="hover:text-white transition-colors">Kostenlos registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Anmelden</Link></li>
                <li><Link href="/dashboard/customer/select-service" className="hover:text-white transition-colors">Alle Services</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">So funktioniert's</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* For Workshops */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Werkstätten</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/werkstatt" className="hover:text-white transition-colors">Werkstatt-Informationen</Link></li>
                <li><Link href="/register/workshop" className="hover:text-white transition-colors">Werkstatt registrieren</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Werkstatt-Login</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Preise & Konditionen</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Partner Program */}
            <div className="bg-gradient-to-br from-primary-600/10 to-primary-700/10 rounded-lg p-4 border border-primary-500/20">
              <h4 className="text-lg font-bold mb-3 text-primary-400">💰 Partner werden</h4>
              <p className="text-gray-300 text-sm mb-4">
                Verdiene als Influencer mit unserem Partner-Programm!
              </p>
              <Link 
                href="/influencer" 
                className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                Mehr erfahren →
              </Link>
            </div>

            {/* Karriere */}
            <div>
              <h4 className="text-lg font-bold mb-4">Karriere</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/karriere" className="hover:text-white transition-colors">Stellenangebote</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-bold mb-4">Rechtliches</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-white transition-colors">AGB</Link></li>
                <li><Link href="/cookie-settings" className="hover:text-white transition-colors">Cookie-Einstellungen</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
              <p>&copy; 2026 Bereifung24. Alle Rechte vorbehalten.</p>
              <p className="mt-4 md:mt-0">
                Made with ❤️ in Deutschland
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
