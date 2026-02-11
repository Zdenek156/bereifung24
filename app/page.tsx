'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
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
  ChevronUp,
  User,
  LogOut,
  Plus,
  ClipboardList,
  Calendar,
  BookOpen,
  Car,
  Cloud,
  CreditCard,
  Sunrise,
  Sunset,
  CalendarDays,
  Wrench,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import ServiceFilters from './components/ServiceFilters'
import AffiliateTracker from '@/components/AffiliateTracker'
import LiveChat from '@/components/LiveChat'

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

interface Review {
  id: string
  rating: number
  comment: string | null
  customerName: string
  workshopName: string
  workshopCity: string | null
  createdAt: string
}

interface Stats {
  totalReviews: number
  avgRating: number
  workshopCount: number
  bookingCount: number
}

export default function NewHomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [selectedService, setSelectedService] = useState('WHEEL_CHANGE')
  const [postalCode, setPostalCode] = useState('')
  const [radiusKm, setRadiusKm] = useState(25)
  const [useGeolocation, setUseGeolocation] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // Search state
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  
  // Reviews and stats
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    avgRating: 0,
    workshopCount: 0,
    bookingCount: 0
  })
  
  // Service-specific package filters - Start empty, set defaults in useEffect when service changes
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  
  // Load reviews on page load
  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch('/api/public/reviews?limit=15')
        const data = await response.json()
        if (data.success) {
          setReviews(data.reviews)
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error loading reviews:', error)
      }
    }
    loadReviews()
  }, [])
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])
  
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
      const savedPackages = searchParams.get('packages')

      if (savedWorkshops) {
        try {
          console.log('🔍 [Hard Refresh] Restoring search from URL...')
          const parsedWorkshops = JSON.parse(decodeURIComponent(savedWorkshops))
          setWorkshops(parsedWorkshops)
          setHasSearched(true)
          if (savedService) setSelectedService(savedService)
          if (savedPostalCode) setPostalCode(savedPostalCode)
          if (savedRadius) setRadiusKm(Number(savedRadius))
          if (savedLat && savedLon) {
            setCustomerLocation({ lat: Number(savedLat), lon: Number(savedLon) })
          }
          // CRITICAL: Restore selected packages to prevent re-search with wrong packages
          if (savedPackages) {
            try {
              const packages = JSON.parse(savedPackages)
              console.log('🔍 [Hard Refresh] Restored packages:', packages)
              setSelectedPackages(packages)
            } catch (e) {
              console.error('Error parsing packages:', e)
            }
          }
          // Restore scroll position
          if (savedScroll) {
            setTimeout(() => window.scrollTo(0, Number(savedScroll)), 100)
          }
          console.log('✅ [Hard Refresh] Search restored successfully, workshops:', parsedWorkshops.length)
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
  
  // New filters
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [openingHours, setOpeningHours] = useState<string[]>([])
  const [hasMultipleServices, setHasMultipleServices] = useState(false)

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
    console.log('🔍 [searchWorkshops] Starting search...', {
      serviceType: selectedService,
      packageTypes: selectedPackages,
      radiusKm,
      location
    })
    
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
      console.log('📊 [searchWorkshops] API Response:', {
        success: result.success,
        workshopsCount: result.workshops?.length || 0,
        error: result.error
      })

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
        params.set('packages', JSON.stringify(selectedPackages))
        window.history.replaceState({}, '', `?${params.toString()}`)
        console.log('✅ [searchWorkshops] Search completed successfully, workshops:', workshops.length)
      } else {
        setWorkshops([])
        setError(result.error || 'Keine Werkstätten gefunden')
        console.warn('⚠️ [searchWorkshops] No workshops found or error:', result.error)
      }
    } catch (err) {
      setWorkshops([])
      setError('Fehler bei der Suche')
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!postalCode && !useGeolocation) {
      alert('Bitte PLZ oder Ort eingeben oder Standort aktivieren')
      return
    }
    
    setLoading(true)
    setError(null)
    setHasSearched(true)
    setWorkshops([]) // Clear previous results

    try {
      let location = customerLocation

      // Get location from geolocation
      if (useGeolocation) {
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
      } 
      // Get location from postal code
      else if (postalCode) {
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

  // Track if this is the initial mount
  const isInitialMount = useRef(true)
  
  // Re-search when service-specific filters change (but not on initial mount or while loading)
  useEffect(() => {
    console.log('🔄 [useEffect - selectedPackages] Triggered', {
      isInitialMount: isInitialMount.current,
      loading,
      hasSearched,
      customerLocation: !!customerLocation,
      selectedPackages,
      workshopsCount: workshops.length
    })
    
    if (isInitialMount.current) {
      console.log('⏭️  [useEffect] Skipping: Initial mount')
      isInitialMount.current = false
      return
    }
    
    // Don't trigger search if already loading or haven't searched yet
    if (loading || !hasSearched || !customerLocation) {
      console.log('⏭️  [useEffect] Skipping search:', { loading, hasSearched, customerLocation: !!customerLocation })
      return
    }
    
    console.log('⏱️  [useEffect] Debouncing search for 300ms...')
    const debounce = setTimeout(() => {
      console.log('🔎 [useEffect] Executing re-search with packages:', selectedPackages)
      searchWorkshops(customerLocation)
    }, 300)
    return () => {
      console.log('🚫 [useEffect] Debounce cleared')
      clearTimeout(debounce)
    }
  }, [selectedPackages])

  // Apply filters
  const filteredWorkshops = workshops.filter((w) => {
    // Price range filter
    if (w.totalPrice < priceRange[0] || w.totalPrice > priceRange[1]) return false
    
    // Rating filter
    if (w.rating && w.rating < minRating) return false
    
    // Distance filter
    if (w.distance > maxDistance) return false
    
    // High rated filter
    if (showOnlyHighRated && w.rating < 4) return false
    
    // Nearby filter
    if (showOnlyNearby && w.distance > 10) return false
    
    // Payment methods filter
    if (paymentMethods.length > 0) {
      const hasRequiredPayment = paymentMethods.some(method => {
        if (method === 'CREDIT_CARD' && w.stripeEnabled) return true
        if (method === 'PAYPAL' && w.paypalEmail) return true
        if (method === 'INSTALLMENT' && w.paypalEmail) return true // Ratenzahlung über PayPal
        return false
      })
      if (!hasRequiredPayment) return false
    }
    
    // Opening hours filter
    if (openingHours.length > 0) {
      const meetsOpeningHours = openingHours.every(hours => {
        if (hours === 'SATURDAY' && !w.openSaturday) return false
        if (hours === 'EVENING' && !w.openEvening) return false
        if (hours === 'EARLY' && !w.openEarly) return false
        return true
      })
      if (!meetsOpeningHours) return false
    }
    
    // Multiple services filter
    if (hasMultipleServices && !w.hasMultipleServices) return false
    
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
      service: selectedService, // Add service type for checkout
    })
    router.push(`/workshop/${workshop.id}?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      
      {/* Live Chat Widget */}
      <LiveChat />
      
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
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              {status === 'loading' ? (
                <div className="px-5 py-2.5 text-sm font-medium text-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : session ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">{session.user?.name || 'Mein Konto'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                          <p className="text-xs text-gray-500">{session.user?.email}</p>
                        </div>
                        
                        <Link
                          href="/dashboard/customer"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Star className="w-4 h-4" />
                          Startseite
                        </Link>
                        
                        <Link
                          href="/dashboard/customer/select-service"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Plus className="w-4 h-4" />
                          Neue Anfrage
                        </Link>
                        
                        <Link
                          href="/dashboard/customer/requests"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <ClipboardList className="w-4 h-4" />
                          Meine Anfragen
                        </Link>
                        
                        <Link
                          href="/dashboard/customer/appointments"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Calendar className="w-4 h-4" />
                          Termine
                        </Link>
                        
                        <Link
                          href="/dashboard/customer/bookings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BookOpen className="w-4 h-4" />
                          Buchungen
                        </Link>
                        
                        <Link
                          href="/dashboard/customer/vehicles"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Car className="w-4 h-4" />
                          Fahrzeuge
                        </Link>
                        
                        <Link
                          href="/dashboard/customer/tire-history"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <TrendingUp className="w-4 h-4" />
                          Reifenhistorie
                        </Link>
                        
                        <Link
                          href="/dashboard/customer/weather-alert"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Cloud className="w-4 h-4" />
                          Wetter-Erinnerung
                        </Link>
                        
                        <div className="border-t border-gray-200 my-2"></div>
                        
                        <Link
                          href="/dashboard/customer/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          Einstellungen
                        </Link>
                        
                        <button
                          onClick={async () => {
                            setShowUserMenu(false)
                            await signOut({ redirect: false })
                            window.location.href = '/'
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Abmelden
                        </button>
                      </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/register/customer"
                    className="px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Registrieren
                  </Link>
                  <Link
                    href="/login"
                    className="px-5 py-2.5 text-sm font-medium bg-white text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Anmelden
                  </Link>
                </div>
              )}
            </div>
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
              Reifenservice zum Festpreis – in 2 Minuten gebucht
            </h2>
            <p className="text-xl text-primary-100">
              Vergleiche geprüfte Werkstätten in deiner Nähe und buche direkt online
            </p>
          </div>

          {/* Search Card - Booking.com Style: One Line */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-3">
              <div className="flex flex-col md:flex-row gap-2">
                {/* Service Dropdown */}
                <div className="flex-1">
                  <select
                    name="service"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full h-16 px-4 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                    aria-label="Service auswählen"
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
                        name="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="PLZ oder Ort"
                        className="w-full h-full pl-12 pr-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                        aria-label="Postleitzahl oder Ort eingeben"
                      />
                    </div>
                  ) : (
                    <div className="h-16 px-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 font-semibold text-sm">Standort aktiv</span>
                    </div>
                  )}
                </div>

                {/* Radius + Geolocation Row (side by side on mobile) */}
                <div className="flex gap-2 w-full md:w-auto">
                  {/* Radius Dropdown */}
                  <div className="flex-1 md:w-32">
                    <select
                      name="radius"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="w-full h-16 px-4 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                      aria-label="Umkreis auswählen"
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
                    className={`w-16 h-16 flex-shrink-0 rounded-xl font-semibold transition-all flex items-center justify-center ${
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
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto h-16 px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">Jetzt Festpreise vergleichen</span>
                  <span className="md:hidden">Vergleichen</span>
                </button>
              </div>
            </div>
            
            {/* Micro Social Proof under search */}
            <div className="max-w-5xl mx-auto mt-4 flex flex-wrap items-center justify-center gap-4 text-primary-100 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}/5` : '4.9/5'} von {stats.totalReviews > 0 ? stats.totalReviews : '23'} Kunden</span>
              </div>
              <span className="text-primary-200">•</span>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Geprüfte Werkstätten</span>
              </div>
              <span className="text-primary-200">•</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Bis zu 40% günstiger</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="max-w-5xl mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 text-primary-100 text-xs">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">SSL-verschlüsselt</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="font-medium">Sichere Zahlung</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                <Star className="w-4 h-4" />
                <span className="font-medium">Geprüfte Qualität</span>
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-24 z-40">
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

                      {/* Payment Methods Filter */}
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Zahlungsmethoden
                        </h4>
                        <div className="space-y-2">
                          {[
                            { id: 'CREDIT_CARD', label: 'Kreditkarte' },
                            { id: 'PAYPAL', label: 'PayPal' },
                            { id: 'INSTALLMENT', label: 'Ratenzahlung' }
                          ].map((method) => (
                            <label
                              key={method.id}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={paymentMethods.includes(method.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPaymentMethods([...paymentMethods, method.id])
                                  } else {
                                    setPaymentMethods(paymentMethods.filter(m => m !== method.id))
                                  }
                                }}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm">{method.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Opening Hours Filter */}
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Öffnungszeiten
                        </h4>
                        <div className="space-y-2">
                          {[
                            { id: 'SATURDAY', label: 'Samstag geöffnet', icon: CalendarDays },
                            { id: 'EVENING', label: 'Abends (nach 18 Uhr)', icon: Sunset },
                            { id: 'EARLY', label: 'Frühmorgens (vor 8 Uhr)', icon: Sunrise }
                          ].map((hours) => (
                            <label
                              key={hours.id}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={openingHours.includes(hours.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setOpeningHours([...openingHours, hours.id])
                                  } else {
                                    setOpeningHours(openingHours.filter(h => h !== hours.id))
                                  }
                                }}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <hours.icon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{hours.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Multiple Services Filter */}
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Weitere Services
                        </h4>
                        <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={hasMultipleServices}
                            onChange={(e) => setHasMultipleServices(e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm">Nur Werkstätten mit weiteren Services</span>
                        </label>
                      </div>
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
                          className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-3 sm:p-4 relative isolate"
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
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    100%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Geprüfte Werkstätten
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    {stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}★` : '4.9★'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Durchschnittsbewertung
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Online Buchung
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    <Clock className="w-8 h-8 md:w-10 md:h-10 mx-auto text-primary-600" />
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Schneller Termin
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews Section - Real reviews from database */}
          {reviews.length > 0 && <ReviewsCarousel reviews={reviews} />}

      {/* How It Works - Ablauf */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              So einfach geht's
            </h2>
            <p className="text-xl text-gray-600">
              In 3 Schritten zum Wunschtermin
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  1
                </div>
                <div className="mb-6 mt-4">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-10 h-10 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Werkstatt finden
                </h3>
                <p className="text-gray-600">
                  Service wählen, Standort eingeben und passende Werkstätten mit Festpreisen vergleichen
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  2
                </div>
                <div className="mb-6 mt-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Online buchen & bezahlen
                </h3>
                <p className="text-gray-600">
                  Wunschtermin wählen, sicher online bezahlen und Bestätigung per E-Mail erhalten
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                  3
                </div>
                <div className="mb-6 mt-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Zur Werkstatt fahren
                </h3>
                <p className="text-gray-600">
                  Einfach zum vereinbarten Termin erscheinen - alles ist vorbereitet und erledigt
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center mt-12">
              <button
                onClick={() => document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-xl inline-flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Jetzt Werkstatt finden
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16" loading="lazy">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Beliebte Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Räderwechsel */}
            <Link
              href="/services/raederwechsel"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-primary-200 group block"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🔧
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Räderwechsel
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Kompletter Radwechsel vom Winter- auf Sommerreifen oder umgekehrt
              </p>
              <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                <span>Mehr erfahren</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Reifenwechsel */}
            <Link
              href="/services/reifenwechsel"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-primary-200 group block"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🔄
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Reifenwechsel
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Reifen von Felge ab- und aufziehen mit professioneller Montage
              </p>
              <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                <span>Mehr erfahren</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Reifenreparatur */}
            <Link
              href="/services/reifenreparatur"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-primary-200 group block"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🔨
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Reifenreparatur
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Professionelle Reparatur von Reifenschäden mit Vulkanisierung
              </p>
              <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                <span>Mehr erfahren</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Motorradreifen */}
            <Link
              href="/services/motorradreifen"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-primary-200 group block"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🏍️
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Motorradreifen
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Spezialisierte Montage für Motorrad-Vorder- und Hinterreifen
              </p>
              <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                <span>Mehr erfahren</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Achsvermessung */}
            <Link
              href="/services/achsvermessung"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-primary-200 group block"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                📏
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Achsvermessung
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                3D-Vermessung und Einstellung für optimalen Geradeauslauf
              </p>
              <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                <span>Mehr erfahren</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Klimaservice */}
            <Link
              href="/services/klimaservice"
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 hover:border-primary-200 group block"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                ❄️
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Klimaservice
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Wartung, Desinfektion und Befüllung der Auto-Klimaanlage
              </p>
              <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                <span>Mehr erfahren</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
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
            Tausende zufriedene Kunden vertrauen bereits auf Bereifung24
          </p>
          <button
            onClick={() => document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all transform hover:scale-105 shadow-2xl"
          >
            Jetzt Werkstatt finden
          </button>
          
          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-primary-100 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>100% geprüfte Werkstätten</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}` : '4.9'} Sterne Durchschnitt</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Sichere Bezahlung</span>
            </div>
          </div>
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-gray-400 text-sm">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <p>&copy; 2026 Bereifung24. Alle Rechte vorbehalten.</p>
                <p className="hidden md:block">|</p>
                <p>Made with ❤️ in Deutschland</p>
              </div>
              
              {/* Payment Methods & Trust Badges */}
              <div className="flex flex-col items-center md:items-end gap-3">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Sichere Zahlungsmethoden:</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* VISA */}
                  <div className="bg-white px-3 py-2 rounded flex items-center justify-center h-10">
                    <Image 
                      src="/logos/visa.png" 
                      alt="VISA" 
                      width={50} 
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* Mastercard */}
                  <div className="bg-white px-3 py-2 rounded flex items-center justify-center h-10">
                    <Image 
                      src="/logos/mastercard.png" 
                      alt="Mastercard" 
                      width={50} 
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* PayPal */}
                  <div className="bg-white px-3 py-2 rounded flex items-center justify-center h-10">
                    <Image 
                      src="/logos/paypal.png" 
                      alt="PayPal" 
                      width={80} 
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* PayPal Ratenzahlung */}
                  <div className="bg-white px-3 py-2 rounded flex items-center justify-center h-10">
                    <Image 
                      src="/logos/paypal-ratenzahlung.png" 
                      alt="PayPal Ratenzahlung" 
                      width={100} 
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* American Express */}
                  <div className="bg-white px-3 py-2 rounded flex items-center justify-center h-10">
                    <Image 
                      src="/logos/amex.png" 
                      alt="American Express" 
                      width={50} 
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* SSL Badge */}
                  <div className="bg-gray-800 px-3 py-2 rounded flex items-center gap-1.5 h-10 border border-gray-700">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium text-gray-300">SSL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Reviews Carousel Component - Shows 5 reviews at once
function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const REVIEWS_PER_PAGE = 5
  const [currentPage, setCurrentPage] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || totalPages <= 1) return

    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages)
    }, 8000) // Change page every 8 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, totalPages])

  const goToPrevious = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
    setIsAutoPlaying(false)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    setIsAutoPlaying(false)
  }

  if (reviews.length === 0) return null

  // Get reviews for current page
  const startIndex = currentPage * REVIEWS_PER_PAGE
  const currentReviews = reviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE)

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Das sagen unsere Kunden
          </h2>
          <p className="text-xl text-gray-600">
            Echte Bewertungen von zufriedenen Kunden
          </p>
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {currentReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-shadow flex flex-col"
              >
                {/* Rating */}
                <div className="flex items-center justify-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-4 flex-grow">
                    "{review.comment}"
                  </p>
                )}

                {/* Customer & Workshop */}
                <div className="border-t border-gray-200 pt-3 mt-auto">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {review.customerName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {review.workshopName}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.createdAt).toLocaleDateString('de-DE', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          {totalPages > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-3 shadow-lg border border-gray-200 transition-all hover:scale-110 z-10"
                aria-label="Vorherige Bewertungen"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 bg-white hover:bg-gray-50 text-gray-800 rounded-full p-3 shadow-lg border border-gray-200 transition-all hover:scale-110 z-10"
                aria-label="Nächste Bewertungen"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots Navigation */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`transition-all ${
                    index === currentPage
                      ? 'w-8 h-3 bg-primary-600'
                      : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                  } rounded-full`}
                  aria-label={`Zur Seite ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
