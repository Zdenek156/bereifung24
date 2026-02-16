'use client' // v5.0 Cache Bust 2026-02-14

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
  LayoutDashboard,
  CalendarDays,
  Wrench,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  RotateCw,
  Bike,
  Ruler,
  Snowflake
} from 'lucide-react'
import ServiceFilters from './components/ServiceFilters'
import AffiliateTracker from '@/components/AffiliateTracker'
import LiveChat from '@/components/LiveChat'
import LoginModal from '@/components/LoginModal'

const SERVICES = [
  { id: 'TIRE_CHANGE', label: 'Reifenwechsel', icon: RefreshCw, description: 'Reifen montieren/demontieren' },
  { id: 'WHEEL_CHANGE', label: 'Räderwechsel', icon: RotateCw, description: 'Sommer-/Winterreifen wechseln' },
  { id: 'TIRE_REPAIR', label: 'Reifenreparatur', icon: Wrench, description: 'Reifen flicken und abdichten' },
  { id: 'MOTORCYCLE_TIRE', label: 'Motorradreifenwechsel', icon: Bike, description: 'Motorradreifen-Service' },
  { id: 'ALIGNMENT_BOTH', label: 'Achsvermessung', icon: Ruler, description: 'Vorder- und Hinterachse vermessen' },
  { id: 'CLIMATE_SERVICE', label: 'Klimaservice', icon: Snowflake, description: 'Klimaanlage warten & prüfen' },
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
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // Search state
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [missingSeasonError, setMissingSeasonError] = useState<{ message: string; seasonName: string } | null>(null)
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
  
  // Service-specific package filters
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  
  // Handler to change service and set default packages
  const handleServiceChange = (newService: string) => {
    console.log('🎯 [page.tsx] Service changed to:', newService)
    setSelectedService(newService)
    
    // Immediately set packages for TIRE_CHANGE
    if (newService === 'TIRE_CHANGE') {
      console.log('✅ [page.tsx] Setting default: four_tires')
      setSelectedPackages(['four_tires'])
    } else {
      console.log('🔄 [page.tsx] Clearing packages for:', newService)
      setSelectedPackages([])
    }
  }
  
  // Auto-set default package when user switches to TIRE_CHANGE
  useEffect(() => {
    console.log('🔍 [page.tsx] Effect running:', { selectedService, packageCount: selectedPackages.length })
    if (selectedService === 'TIRE_CHANGE' && selectedPackages.length === 0) {
      console.log('🔧 [page.tsx] Auto-setting default for TIRE_CHANGE')
      // Use setTimeout to ensure state update happens after render
      setTimeout(() => {
        setSelectedPackages(['four_tires'])
      }, 0)
    }
  }, [selectedService])
  
  // Tire Search State
  const [includeTires, setIncludeTires] = useState(true)
  const [tireDimensions, setTireDimensions] = useState({
    width: '',
    height: '',
    diameter: '',
    loadIndex: '',
    speedIndex: ''
  })
  const [hasMixedTires, setHasMixedTires] = useState(false)
  const [tireDimensionsFront, setTireDimensionsFront] = useState<string>('')
  const [tireDimensionsRear, setTireDimensionsRear] = useState<string>('')
  const [tireBudgetMin, setTireBudgetMin] = useState<number>(50)
  const [tireBudgetMax, setTireBudgetMax] = useState<number>(500)
  const [selectedSeason, setSelectedSeason] = useState<string>('s') // 's', 'w', 'g', or '' - Default to Summer
  const [tireQuality, setTireQuality] = useState<string>('') // Removed from global filters - card-level filtering only
  const [fuelEfficiency, setFuelEfficiency] = useState<string>('') // A-G or ''
  const [wetGrip, setWetGrip] = useState<string>('') // A-G or ''
  const [require3PMSF, setRequire3PMSF] = useState(false)
  const [showDOTTires, setShowDOTTires] = useState(false) // Default: DOT tires hidden
  const [requireSameBrand, setRequireSameBrand] = useState(false) // For mixed 4 tires: same brand
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [customerVehicles, setCustomerVehicles] = useState<any[]>([])
  const [selectedTireIndices, setSelectedTireIndices] = useState<Record<string, number>>({}) // workshopId -> tire index
  const [selectedTireFrontIndices, setSelectedTireFrontIndices] = useState<Record<string, number>>({}) // workshopId -> front tire index (mixed tires)
  const [selectedTireRearIndices, setSelectedTireRearIndices] = useState<Record<string, number>>({}) // workshopId -> rear tire index (mixed tires)
  const [selectedBrandOptionIndices, setSelectedBrandOptionIndices] = useState<Record<string, number>>({}) // workshopId -> brand option index (for sameBrand filter)
  
  // Expanded tire selection states
  const [expandedTireWorkshops, setExpandedTireWorkshops] = useState<Record<string, boolean>>({}) // workshopId -> expanded
  const [tireQualityFilter, setTireQualityFilter] = useState<Record<string, 'all' | 'cheap' | 'best' | 'premium'>>({}) // workshopId -> filter (internal: also 'standard' for unmatched tires)
  const [tireSortBy, setTireSortBy] = useState<Record<string, 'price' | 'brand' | 'label'>>({}) // workshopId -> sort
  
  // Ref for scrolling to search results
  const searchResultsRef = useRef<HTMLElement>(null)
  
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
  
  // Reload tire dimensions when season changes (if vehicle selected)
  // Handle season change (fetch tire dimensions for new season)
  const handleSeasonChange = async (newSeason: string) => {
    if (!selectedVehicleId) return
    
    setSelectedSeason(newSeason)
    
    // Fetch tire dimensions for the new season
    try {
      const response = await fetch(`/api/customer/vehicles/${selectedVehicleId}/tire-dimensions?season=${newSeason}`)
      
      // Handle HTTP errors (404, 401, etc.)
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Fehler beim Laden der Reifendaten' }))
        
        // Check if season-specific data is missing
        if (data.missingSeasonData) {
          setMissingSeasonError({
            message: data.error,
            seasonName: data.seasonName || 'Reifendaten'
          })
          setTireDimensions({ width: '', height: '', diameter: '' })
          setHasMixedTires(false)
          setTireDimensionsFront('')
          setTireDimensionsRear('')
          // Don't clear workshops - keep previous results visible for user reference
          // Keep hasSearched = true for auto-search on next vehicle change
          return
        }
        
        console.error('API error:', data)
        return
      }
      
      const data = await response.json()
      
      // Clear missing season error if data is found
      setMissingSeasonError(null)
      
      if (data.success && data.dimensions) {
        setTireDimensions({
          width: data.dimensions.width.toString(),
          height: data.dimensions.height.toString(),
          diameter: data.dimensions.diameter.toString()
        })
        
        // Set mixed tire dimensions if available
        if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
          setHasMixedTires(true)
          setTireDimensionsFront(data.dimensionsFront.formatted)
          setTireDimensionsRear(data.dimensionsRear.formatted)
        } else {
          setHasMixedTires(false)
          setTireDimensionsFront('')
          setTireDimensionsRear('')
        }
        
        // Now search workshops with the new tire dimensions
        // Only search if user has searched before (hasSearched) and has location
        if (hasSearched && customerLocation) {
          searchWorkshops(customerLocation, newSeason)
        }
      }
    } catch (error) {
      console.error('Error fetching tire dimensions for season change:', error)
    }
  }
  
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
  
  // Auto-search after vehicle selection if user has already searched
  useEffect(() => {
    // Only trigger if:
    // 1. User has searched before (hasSearched = true)
    // 2. Location is available (customerLocation not null)
    // 3. Service is TIRE_CHANGE with tires included
    // 4. We have valid tire dimensions
    if (
      hasSearched && 
      customerLocation && 
      selectedService === 'TIRE_CHANGE' && 
      includeTires && 
      selectedVehicleId &&
      tireDimensions.width && 
      tireDimensions.diameter
    ) {
      console.log('🔄 [Auto-Search] Triggering search after vehicle change')
      searchWorkshops(customerLocation)
    }
  }, [selectedVehicleId, tireDimensions.width, tireDimensions.diameter])
  
  // Restore search from URL on page load (for browser back button)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // First try to restore from sessionStorage (back navigation from workshop)
      const savedSearchState = sessionStorage.getItem('lastSearchState')
      if (savedSearchState) {
        try {
          const searchState = JSON.parse(savedSearchState)
          // Only restore if saved within last 30 minutes
          if (Date.now() - searchState.timestamp < 30 * 60 * 1000) {
            console.log('🔍 [Back Navigation] Restoring search from sessionStorage...', searchState)
            setWorkshops(searchState.workshops || [])
            setHasSearched(searchState.hasSearched || false)
            setSelectedService(searchState.selectedService || 'WHEEL_CHANGE')
            setPostalCode(searchState.postalCode || '')
            setRadiusKm(searchState.radiusKm || 25)
            setCustomerLocation(searchState.customerLocation || null)
            setSelectedVehicleId(searchState.selectedVehicleId || '')
            setTireDimensions(searchState.tireDimensions || { width: '', height: '', diameter: '', loadIndex: '', speedIndex: '' })
            setSelectedPackages(searchState.selectedPackages || [])
            setIncludeTires(searchState.includeTires !== undefined ? searchState.includeTires : true)
            // Restore scroll position
            if (searchState.scrollPosition) {
              setTimeout(() => window.scrollTo(0, searchState.scrollPosition), 100)
            }
            console.log('✅ [Back Navigation] Search restored successfully')
            return // Don't try URL restore if sessionStorage worked
          } else {
            console.log('⚠️ [Back Navigation] Saved state too old, clearing...')
            sessionStorage.removeItem('lastSearchState')
          }
        } catch (e) {
          console.error('Error restoring search from sessionStorage:', e)
        }
      }
      
      // Fallback: Try URL parameters (hard refresh)
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

  // Rate limiting for Nominatim API (max 1 request per second)
  let lastNominatimRequest = 0
  const NOMINATIM_DELAY = 1100 // 1.1 seconds to be safe

  // Geocode postal code with rate limiting and retry logic
  const geocodePostalCode = async (input: string, retryCount = 0): Promise<any> => {
    try {
      // Rate limiting: Wait if last request was too recent
      const now = Date.now()
      const timeSinceLastRequest = now - lastNominatimRequest
      if (timeSinceLastRequest < NOMINATIM_DELAY) {
        await new Promise(resolve => setTimeout(resolve, NOMINATIM_DELAY - timeSinceLastRequest))
      }
      lastNominatimRequest = Date.now()

      // Check if input is a postal code (5 digits) or city name
      const isPostalCode = /^\d{5}$/.test(input)
      
      let url = ''
      if (isPostalCode) {
        url = `https://nominatim.openstreetmap.org/search?format=json&country=Germany&postalcode=${input}`
      } else {
        // Search by city name
        url = `https://nominatim.openstreetmap.org/search?format=json&country=Germany&city=${encodeURIComponent(input)}`
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Bereifung24.de/1.0 (contact@bereifung24.de)'
        }
      })

      // Handle 425 (Too Early) with retry
      if (response.status === 425 && retryCount < 2) {
        console.warn(`⏱️ Nominatim 425 (Too Early), retry ${retryCount + 1}/2`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        return geocodePostalCode(input, retryCount + 1)
      }

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`)
      }
      
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

  // Load customer vehicles when logged in
  useEffect(() => {
    const loadVehicles = async () => {
      if (!session?.user?.id) {
        setCustomerVehicles([])
        return
      }

      try {
        const response = await fetch('/api/customer/vehicles')
        const data = await response.json()
        
        if (data.success && data.vehicles) {
          setCustomerVehicles(data.vehicles)
        }
      } catch (error) {
        console.error('Error loading vehicles:', error)
      }
    }

    loadVehicles()
  }, [session])

  // Handle vehicle selection
  const handleVehicleSelect = async (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    
    if (!vehicleId) {
      // Clear tire dimensions if no vehicle selected
      setTireDimensions({ width: '', height: '', diameter: '' })
      setHasMixedTires(false)
      setTireDimensionsFront('')
      setTireDimensionsRear('')
      return
    }

    // Find selected vehicle and extract tire dimensions
    const vehicle = customerVehicles.find(v => v.id === vehicleId)
    if (!vehicle) return

    // Check if current season is available for this vehicle
    let currentSeason = selectedSeason || 's' // Default to summer
    const availableSeasons = (vehicle as any).availableSeasons
    
    if (availableSeasons) {
      // Map season codes to available flags
      const seasonMap: { [key: string]: boolean } = {
        's': availableSeasons.summer,
        'w': availableSeasons.winter,
        'g': availableSeasons.allSeason
      }
      
      // If current season not available, auto-select first available season
      if (!seasonMap[currentSeason]) {
        console.log(`⚠️ [handleVehicleSelect] Current season "${currentSeason}" not available for ${vehicle.make} ${vehicle.model}`)
        
        // Find first available season
        if (availableSeasons.summer) {
          currentSeason = 's'
          setSelectedSeason('s')
          console.log('✅ Auto-switched to summer tires')
        } else if (availableSeasons.winter) {
          currentSeason = 'w'
          setSelectedSeason('w')
          console.log('✅ Auto-switched to winter tires')
        } else if (availableSeasons.allSeason) {
          currentSeason = 'g'
          setSelectedSeason('g')
          console.log('✅ Auto-switched to all-season tires')
        } else {
          // No seasons available at all - show error
          setMissingSeasonError({
            message: 'Für dieses Fahrzeug sind keine Reifendaten hinterlegt. Bitte ergänzen Sie die Reifendaten in der Fahrzeugverwaltung.',
            seasonName: 'Reifendaten'
          })
          setTireDimensions({ width: '', height: '', diameter: '' })
          setHasMixedTires(false)
          setTireDimensionsFront('')
          setTireDimensionsRear('')
          // Don't clear workshops - keep previous results visible
          // Keep hasSearched = true
          return
        }
      }
    }

    // Try to get tire dimensions from vehicle data
    // Fetch based on selected season (summer/winter/allseason)
    try {
      const response = await fetch(`/api/customer/vehicles/${vehicleId}/tire-dimensions?season=${currentSeason}`)
      
      // Handle HTTP errors (404, 401, etc.)
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Fehler beim Laden der Reifendaten' }))
        
        // Check if season-specific data is missing
        if (data.missingSeasonData) {
          setMissingSeasonError({
            message: data.error,
            seasonName: data.seasonName || 'Reifendaten'
          })
          setTireDimensions({ width: '', height: '', diameter: '' })
          setHasMixedTires(false)
          setTireDimensionsFront('')
          setTireDimensionsRear('')
          // Don't clear workshops - keep previous results visible
          // Keep hasSearched = true for auto-search on next vehicle change
          return
        }
        
        // Other error (e.g., unauthorized)
        console.error('API error:', data)
        return
      }
      
      const data = await response.json()
      
      // Check if season-specific data is missing (belt and braces check)
      if (data.missingSeasonData) {
        setMissingSeasonError({
          message: data.error,
          seasonName: data.seasonName || 'Reifendaten'
        })
        setTireDimensions({ width: '', height: '', diameter: '', loadIndex: '', speedIndex: '' })
        setHasMixedTires(false)
        setTireDimensionsFront('')
        setTireDimensionsRear('')
        // Don't clear workshops - keep previous results visible
        // Keep hasSearched = true
        return
      }
      
      // Clear missing season error if data is found
      setMissingSeasonError(null)
      
      if (data.success && data.dimensions) {
        setTireDimensions({
          width: data.dimensions.width.toString(),
          height: data.dimensions.height.toString(),
          diameter: data.dimensions.diameter.toString(),
          loadIndex: data.dimensions.loadIndex?.toString() || '',
          speedIndex: data.dimensions.speedIndex || ''
        })

        console.log('🔒 [SAFETY CHECK] Tire dimensions loaded:', {
          dimensions: `${data.dimensions.width}/${data.dimensions.height} R${data.dimensions.diameter}`,
          loadIndex: data.dimensions.loadIndex || 'NOT SET ⚠️',
          speedIndex: data.dimensions.speedIndex || 'NOT SET ⚠️'
        })

        // DEBUG: Log what API returned
        console.log('🔍 [handleVehicleSelect] API Response:', {
          hasMixedTires: data.hasMixedTires,
          dimensionsFront: data.dimensionsFront,
          dimensionsRear: data.dimensionsRear
        })

        // Set mixed tire dimensions if available
        if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
          console.log('🔄 [handleVehicleSelect] Mixed tires detected:', {
            front: data.dimensionsFront.formatted,
            rear: data.dimensionsRear.formatted,
            currentPackages: selectedPackages
          })
          setHasMixedTires(true)
          setTireDimensionsFront(data.dimensionsFront.formatted)
          setTireDimensionsRear(data.dimensionsRear.formatted)
          
          // CRITICAL: Replace all packages with mixed default
          console.log('🧹 [handleVehicleSelect] Cleaning packages: removing standard, setting mixed_four_tires')
          setSelectedPackages(['mixed_four_tires'])
        } else {
          console.log('✅ [handleVehicleSelect] Standard tires (no mixed)')
          setHasMixedTires(false)
          setTireDimensionsFront('')
          setTireDimensionsRear('')
          
          // Set standard package if none selected
          if (!selectedPackages.some(p => ['two_tires', 'four_tires'].includes(p))) {
            console.log('🧹 [handleVehicleSelect] Setting standard: four_tires')
            setSelectedPackages(['four_tires'])
          }
        }
        
        // CRITICAL: Enable auto-search by setting hasSearched=true when location available
        // This allows the useEffect (lines 263-281) to automatically trigger search
        // when tire dimensions change after vehicle selection
        if (customerLocation) {
          console.log('✅ [handleVehicleSelect] Enabling auto-search (hasSearched=true)')
          setHasSearched(true)
        }
      }
    } catch (error) {
      console.error('Error loading tire dimensions:', error)
    }
  }

  // Search workshops
  const searchWorkshops = async (
    location: { lat: number; lon: number }, 
    overrideSeason?: string,
    // CRITICAL: Accept tire dimensions directly to avoid async state issues
    overrideMixedTires?: { hasMixed: boolean; front?: string; rear?: string },
    overrideSameBrand?: boolean, // Override for immediate use when checkbox changes
    overrideQuality?: string // Override for quality filter (premium/quality/budget)
  ) => {
    const seasonToUse = overrideSeason !== undefined ? overrideSeason : selectedSeason
    const mixedTiresData = overrideMixedTires || { hasMixed: hasMixedTires, front: tireDimensionsFront, rear: tireDimensionsRear }
    const sameBrandValue = overrideSameBrand !== undefined ? overrideSameBrand : requireSameBrand
    const qualityValue = overrideQuality !== undefined ? overrideQuality : tireQuality
    
    console.log('🎯 [sameBrand] Using value:', {
      override: overrideSameBrand,
      state: requireSameBrand,
      final: sameBrandValue
    })
    
    // DEBUG: Log all values before API call
    console.log('🔍 [searchWorkshops] Values:', {
      serviceType: selectedService,
      packageTypes: selectedPackages,
      includeTires,
      mixedTiresData,
      tireDimensions,
      season: seasonToUse
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
          customerLon: location.lon,
          // Tire search parameters (only for TIRE_CHANGE service)
          includeTires: selectedService === 'TIRE_CHANGE' ? includeTires : false,
          tireDimensions: (selectedService === 'TIRE_CHANGE' && includeTires && !mixedTiresData.hasMixed) ? tireDimensions : undefined,
          // Mixed tire dimensions (if vehicle has different front/rear sizes)
          tireDimensionsFront: (selectedService === 'TIRE_CHANGE' && includeTires && mixedTiresData.hasMixed && mixedTiresData.front) ? 
            (() => {
              // Regex accepts optional load/speed index: "245/35 R21" or "245/35 R21 96Y"
              const match = mixedTiresData.front.match(/^(\d+)\/(\d+)\s*R(\d+)(?:\s+\d+[A-Z]+)?$/);
              const parsed = match ? { width: parseInt(match[1]), height: parseInt(match[2]), diameter: parseInt(match[3]) } : undefined;
              console.log('🎯 [searchWorkshops] Parsing front dimensions:', mixedTiresData.front, '→', parsed);
              return parsed;
            })() : undefined,
          tireDimensionsRear: (selectedService === 'TIRE_CHANGE' && includeTires && mixedTiresData.hasMixed && mixedTiresData.rear) ? 
            (() => {
              // Regex accepts optional load/speed index: "275/30 R21" or "275/30 R21 98Y"
              const match = mixedTiresData.rear.match(/^(\d+)\/(\d+)\s*R(\d+)(?:\s+\d+[A-Z]+)?$/);
              const parsed = match ? { width: parseInt(match[1]), height: parseInt(match[2]), diameter: parseInt(match[3]) } : undefined;
              console.log('🎯 [searchWorkshops] Parsing rear dimensions:', mixedTiresData.rear, '→', parsed);
              return parsed;
            })() : undefined,
          tireFilters: (selectedService === 'TIRE_CHANGE' && includeTires) ? {
            minPrice: tireBudgetMin,
            maxPrice:tireBudgetMax,
            seasons: seasonToUse ? [seasonToUse] : [],
            quality: qualityValue || undefined,
            fuelEfficiency: fuelEfficiency || undefined,
            wetGrip: wetGrip || undefined,
            threePMSF: require3PMSF || undefined,
            showDOTTires: showDOTTires // Default false = hide DOT tires
          } : undefined,
          // Same brand filter (only for mixed 4 tires)
          sameBrand: (selectedService === 'TIRE_CHANGE' && includeTires && mixedTiresData.hasMixed && selectedPackages.includes('mixed_four_tires')) ? sameBrandValue : false
        })
      })

      console.log('📤 [API Request] Sending sameBrand:', {
        condition: selectedService === 'TIRE_CHANGE' && includeTires && mixedTiresData.hasMixed && selectedPackages.includes('mixed_four_tires'),
        sameBrandValue,
        finalValue: (selectedService === 'TIRE_CHANGE' && includeTires && mixedTiresData.hasMixed && selectedPackages.includes('mixed_four_tires')) ? sameBrandValue : false
      })

      const result = await response.json()
      console.log('📊 [searchWorkshops] API Response:', {
        success: result.success,
        workshopsCount: result.workshops?.length || 0,
        error: result.error
      })
      
      // Debug: Log first workshop totalPrice
      if (result.workshops?.[0]) {
        console.log('💰 [Frontend] First workshop:', {
          name: result.workshops[0].name,
          totalPrice: result.workshops[0].totalPrice,
          rating: result.workshops[0].rating,
          reviewCount: result.workshops[0].reviewCount
        })
      }

      if (response.ok && result.success) {
        const workshops = result.workshops || []
        console.log('🔍 [DEBUG] First workshop pricing:', {
          basePrice: workshops[0]?.basePrice,
          totalPrice: workshops[0]?.totalPrice,
          _debug_pricing: workshops[0]?._debug_pricing
        })
        setWorkshops(workshops)
        setError(null)
        
        // Auto-adjust price range to include all workshops
        if (workshops.length > 0) {
          const maxWorkshopPrice = Math.max(...workshops.map(w => w.totalPrice))
          const newMaxPrice = Math.ceil(maxWorkshopPrice / 100) * 100 // Round up to nearest 100
          setPriceRange(prev => [prev[0], Math.max(prev[1], newMaxPrice)])
          console.log('💰 [priceRange] Auto-adjusted max price to:', newMaxPrice)
        }
        
        // Note: Do NOT save workshop results to URL - causes 431 error (URL too long)
        // Browser back/forward will simply re-trigger the search via useEffect
        console.log('✅ [searchWorkshops] Search completed successfully, workshops:', workshops.length)
        
        // Auto-scroll to results after search completes
        setTimeout(() => {
          searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
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
    
    // No tire dimension validation - user can search first, then select vehicle in filter
    
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
    
    // Collect selected tire data
    const tireIdx = selectedTireIndices[workshop.id] ?? 0
    const selectedRec = workshop.tireRecommendations?.[tireIdx]
    
    // Mixed tire data
    const brandOptionIdx = selectedBrandOptionIndices[workshop.id] ?? 0
    const selectedBrandOption = workshop.brandOptions?.[brandOptionIdx]
    
    let selectedFrontRec, selectedRearRec
    if (selectedBrandOption) {
      selectedFrontRec = {
        ...selectedBrandOption.front,
        tire: selectedBrandOption.front.tire,
        quantity: selectedBrandOption.front.quantity
      }
      selectedRearRec = {
        ...selectedBrandOption.rear,
        tire: selectedBrandOption.rear.tire,
        quantity: selectedBrandOption.rear.quantity
      }
    } else {
      const tireFrontIdx = selectedTireFrontIndices[workshop.id] ?? 0
      const tireRearIdx = selectedTireRearIndices[workshop.id] ?? 0
      selectedFrontRec = workshop.tireFrontRecommendations?.[tireFrontIdx]
      selectedRearRec = workshop.tireRearRecommendations?.[tireRearIdx]
    }
    
    // Prepare tire booking data
    const tireBookingData = {
      hasTires: includeTires && !missingSeasonError && workshop.tireAvailable,
      isMixedTires: workshop.isMixedTires || false,
      tireDimensions: workshop.isMixedTires ? null : {
        width: tireDimensions.width,
        height: tireDimensions.height,
        diameter: tireDimensions.diameter,
        loadIndex: tireDimensions.loadIndex,
        speedIndex: tireDimensions.speedIndex
      },
      tireDimensionsFront: workshop.isMixedTires ? tireDimensionsFront : null,
      tireDimensionsRear: workshop.isMixedTires ? tireDimensionsRear : null,
      selectedTire: selectedRec,
      selectedFrontTire: workshop.isMixedTires ? selectedFrontRec : null,
      selectedRearTire: workshop.isMixedTires ? selectedRearRec : null,
      selectedPackages: selectedPackages,
      // Service information
      serviceName: selectedService,
      servicePrice: workshop.basePrice || 0,
      // Additional services with prices
      hasDisposal: selectedPackages.includes('with_disposal'),
      disposalPrice: workshop.disposalFeeApplied || 0,
      hasRunflat: selectedPackages.includes('runflat'),
      runflatPrice: workshop.runflatSurcharge || 0,
      // Tire count for per-tire calculations
      tireCount: workshop.isMixedTires ? 4 : (
        selectedPackages.includes('two_tires') ? 2 :
        selectedPackages.includes('four_tires') ? 4 : 0
      ),
      // Selected vehicle
      selectedVehicle: customerVehicles.find(v => v.id === selectedVehicleId) || null
    }
    
    // Save tire and service data to sessionStorage for workshop page
    if (tireBookingData.hasTires) {
      sessionStorage.setItem('tireBookingData', JSON.stringify(tireBookingData))
    }
    
    // Also save service data separately for non-tire services
    const serviceData = {
      serviceName: selectedService,
      selectedPackages: selectedPackages,
      servicePrice: workshop.totalPrice || 0
    }
    sessionStorage.setItem('serviceBookingData', JSON.stringify(serviceData))
    
    // CRITICAL: Save complete search state for back navigation
    const searchState = {
      workshops,
      hasSearched,
      selectedService,
      postalCode,
      radiusKm,
      customerLocation,
      selectedVehicleId,
      tireDimensions,
      selectedPackages,
      includeTires,
      scrollPosition: window.scrollY,
      timestamp: Date.now()
    }
    sessionStorage.setItem('lastSearchState', JSON.stringify(searchState))
    
    // Navigate to workshop detail page with basic info (prices loaded from DB)
    const params = new URLSearchParams({
      name: workshop.name,
      city: workshop.city || '',
      distance: workshop.distance.toString(),
      rating: workshop.rating.toString(),
      reviewCount: workshop.reviewCount.toString(),
      duration: workshop.estimatedDuration?.toString() || '60',
      service: selectedService,
    })
    router.push(`/workshop/${workshop.id}?${params.toString()}`)
  }

  // Helper function to filter and sort tire recommendations
  const filterAndSortTires = (tires: any[], workshopId: string) => {
    if (!tires || tires.length === 0) return []
    
    const qualityFilter = tireQualityFilter[workshopId] || 'all'
    const sortBy = tireSortBy[workshopId] || 'price'
    
    // Calculate price threshold for "cheap" category (bottom 33%)
    const prices = tires.map((t: any) => t.totalPrice || t.pricePerTire || 0).filter((p: number) => p > 0).sort((a: number, b: number) => a - b)
    const cheapThreshold = prices.length > 0 ? prices[Math.floor(prices.length * 0.33)] : 0
    
    console.log(`🏷️ [Filter ${workshopId}] Cheap threshold (33%): €${cheapThreshold.toFixed(2)} of ${prices.length} tires`)
    
    // Helper: Check if tire has "Beste Eigenschaften" (good labels)
    const hasBesteEigenschaften = (tire: any): boolean => {
      const fuelEff = tire.labelFuelEfficiency || tire.tire?.labelFuelEfficiency
      const wetGrip = tire.labelWetGrip || tire.tire?.labelWetGrip
      const noise = tire.labelNoise || tire.tire?.labelNoise
      
      const hasAllLabels = fuelEff && wetGrip && noise
      if (!hasAllLabels) return false
      
      let greenCount = 0
      let yellowCount = 0
      let redCount = 0
      
      // Fuel efficiency
      if (['A', 'B'].includes(fuelEff.toUpperCase())) greenCount++
      else if (['C', 'D'].includes(fuelEff.toUpperCase())) yellowCount++
      else redCount++ // E+
      
      // Wet grip
      if (['A', 'B'].includes(wetGrip.toUpperCase())) greenCount++
      else if (['C', 'D'].includes(wetGrip.toUpperCase())) yellowCount++
      else redCount++ // E+
      
      // Noise
      if (noise <= 68) greenCount++ // A-B level (grün)
      else if (noise <= 71) yellowCount++ // C-D level (gelb)
      else redCount++ // E+ level (rot, ≥72dB)
      
      // Beste Eigenschaften: Min. 2 grün, keine roten
      return greenCount >= 2 && redCount === 0
    }
    
    // Helper: Determine quality category (for display and default "Alle" filter)
    const getTireQualityCategory = (tire: any): 'premium' | 'best' | 'cheap' | 'standard' => {
      const tireBrand = tire.brand || tire.tire?.brand || ''
      
      // 1. Premium brands are always Premium (for category display)
      const premiumBrands = ['Michelin', 'Continental', 'Goodyear', 'Bridgestone', 'Pirelli', 'Dunlop']
      if (premiumBrands.some(brand => tireBrand.toLowerCase().includes(brand.toLowerCase()))) {
        console.log(`  ⭐ ${tireBrand}: Premium (brand)`)
        return 'premium'
      }
      
      // 2. Beste Eigenschaften: Min. 2 von 3 Labels A-B (grün), dritte C-D (gelb), KEINE roten!
      if (hasBesteEigenschaften(tire)) {
        const fuelEff = tire.labelFuelEfficiency || tire.tire?.labelFuelEfficiency
        const wetGrip = tire.labelWetGrip || tire.tire?.labelWetGrip
        const noise = tire.labelNoise || tire.tire?.labelNoise
        console.log(`  🏆 ${tireBrand}: Beste Eigenschaften (Fuel=${fuelEff}, Wet=${wetGrip}, Noise=${noise}dB)`)
        return 'best'
      }
      
      // 3. Günstige: Bottom 33% by price
      const tirePrice = tire.totalPrice || tire.pricePerTire || 0
      if (tirePrice > 0 && tirePrice <= cheapThreshold) {
        console.log(`  💰 ${tireBrand}: Günstige (€${tirePrice.toFixed(2)} ≤ €${cheapThreshold.toFixed(2)})`)
        return 'cheap'
      }
      
      // 4. Standard: Doesn't fit premium, best or cheap (shown only in "Alle" filter)
      console.log(`  ➖ ${tireBrand}: Standard/Mittelklasse (nicht premium/best/cheap)`)
      return 'standard'
    }
    
    // Start with all tires
    let filtered = [...tires]
    
    // Filter by category if not 'all'
    if (qualityFilter !== 'all') {
      console.log(`\n🔍 [Filter ${workshopId}] Applying filter: ${qualityFilter}`)
      filtered = filtered.filter((tire: any) => {
        const tireBrand = tire.brand || tire.tire?.brand || ''
        const premiumBrands = ['Michelin', 'Continental', 'Goodyear', 'Bridgestone', 'Pirelli', 'Dunlop']
        const isPremium = premiumBrands.some(brand => tireBrand.toLowerCase().includes(brand.toLowerCase()))
        
        if (qualityFilter === 'premium') {
          return isPremium
        } else if (qualityFilter === 'best') {
          // Show ALL tires with good labels (including premium brands)
          return hasBesteEigenschaften(tire)
        } else if (qualityFilter === 'cheap') {
          return getTireQualityCategory(tire) === 'cheap'
        }
        return false
      })
      console.log(`✅ [Filter ${workshopId}] Result: ${filtered.length} tires match "${qualityFilter}" filter\n`)
    }
    
    // Sort
    console.log(`📊 [SORT] Sortierung: ${sortBy}`)
    filtered.sort((a: any, b: any) => {
      if (sortBy === 'price') {
        const priceA = a.totalPrice || a.pricePerTire || 0
        const priceB = b.totalPrice || b.pricePerTire || 0
        return priceA - priceB
      } else if (sortBy === 'brand') {
        const brandA = a.brand || a.tire?.brand || ''
        const brandB = b.brand || b.tire?.brand || ''
        return brandA.localeCompare(brandB)
      } else if (sortBy === 'label') {
        // Sort by EU label (A is best)
        const labelA = a.labelFuelEfficiency || a.tire?.labelFuelEfficiency || 'Z'
        const labelB = b.labelFuelEfficiency || b.tire?.labelFuelEfficiency || 'Z'
        return labelA.localeCompare(labelB)
      }
      return 0
    })
    
    // Log first 3 sorted tires for debugging
    console.log(`🎯 [SORT RESULT] Erste 3 Reifen:`, filtered.slice(0, 3).map(t => ({
      brand: t.brand || t.tire?.brand,
      model: t.model || t.tire?.model,
      price: t.totalPrice || t.pricePerTire
    })))
    
    return filtered
  }

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      
      {/* Live Chat Widget */}
      <LiveChat />
      
      {/* Top Navigation - Blue like current homepage */}
      <nav className="bg-primary-600 sticky top-0 z-50 backdrop-blur-sm shadow-lg">
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
                        
                        {/* Admin users - only Abmelden (work in /admin) */}
                        {session.user?.role === 'ADMIN' ? (
                          <></>
                        ) : /* Employee users - only Abmelden (work in /mitarbeiter) */
                        (session.user?.role === 'EMPLOYEE' || session.user?.role === 'B24_EMPLOYEE') ? (
                          <></>
                        ) : /* Workshop users - Dashboard, Einstellungen, Abmelden */
                        session.user?.role === 'WORKSHOP' ? (
                          <>
                            <Link
                              href="/dashboard/workshop"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
                            </Link>
                            
                            <Link
                              href="/dashboard/workshop/settings"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <SlidersHorizontal className="w-4 h-4" />
                              Einstellungen
                            </Link>
                          </>
                        ) : (
                          /* Customer users - full menu */
                          <>
                            <Link
                              href="/"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Star className="w-4 h-4" />
                              Startseite
                            </Link>
                            
                            <Link
                              href="/dashboard/customer"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
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
                          </>
                        )}
                        
                        <div className="border-t border-gray-200 my-2"></div>
                        
                        <button
                          onClick={async () => {
                            console.log('[LOGOUT] Starting logout...')
                            setShowUserMenu(false)
                            
                            try {
                              // Save cookie consent before clearing storage
                              const cookieConsent = localStorage.getItem('cookieConsent')
                              const bereifung24Consent = localStorage.getItem('bereifung24_cookie_consent')
                              const bereifung24ConsentDate = localStorage.getItem('bereifung24_cookie_consent_date')
                              
                              // Step 1: Call NextAuth signout first
                              console.log('[LOGOUT] Step 1: Calling NextAuth signout')
                              await signOut({ redirect: false })
                              
                              // Step 2: Call custom logout endpoint to force cookie deletion
                              console.log('[LOGOUT] Step 2: Calling /api/logout to force delete cookies')
                              await fetch('/api/logout', {
                                method: 'POST',
                                credentials: 'include'
                              })
                              
                              // Step 3: Clear all client storage
                              console.log('[LOGOUT] Step 3: Clearing storage')
                              localStorage.clear()
                              sessionStorage.clear()
                              
                              // Restore cookie consent
                              if (cookieConsent) {
                                localStorage.setItem('cookieConsent', cookieConsent)
                              }
                              if (bereifung24Consent) {
                                localStorage.setItem('bereifung24_cookie_consent', bereifung24Consent)
                              }
                              if (bereifung24ConsentDate) {
                                localStorage.setItem('bereifung24_cookie_consent_date', bereifung24ConsentDate)
                              }
                              
                              // Step 4: Force page reload
                              console.log('[LOGOUT] Step 4: Reloading to /')
                              window.location.href = '/'
                            } catch (error) {
                              console.error('[LOGOUT] Error during logout:', error)
                              // Force reload anyway
                              const cookieConsent = localStorage.getItem('cookieConsent')
                              const bereifung24Consent = localStorage.getItem('bereifung24_cookie_consent')
                              const bereifung24ConsentDate = localStorage.getItem('bereifung24_cookie_consent_date')
                              localStorage.clear()
                              sessionStorage.clear()
                              if (cookieConsent) {
                                localStorage.setItem('cookieConsent', cookieConsent)
                              }
                              if (bereifung24Consent) {
                                localStorage.setItem('bereifung24_cookie_consent', bereifung24Consent)
                              }
                              if (bereifung24ConsentDate) {
                                localStorage.setItem('bereifung24_cookie_consent_date', bereifung24ConsentDate)
                              }
                              window.location.href = '/'
                            }
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
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/register/customer"
                    className="px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Registrieren
                  </Link>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium bg-white text-primary-600 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Anmelden
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

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

          {/* Search Card - Improved UX with Visible Service Tabs */}
          <div className="max-w-5xl mx-auto">
            {/* Service Tabs - Visible above search card */}
            <div className="mb-3 overflow-x-auto md:overflow-visible scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-transparent">
              <div className="flex gap-2 min-w-max md:min-w-0 md:justify-center pb-2">
                {SERVICES.slice(0, 5).map((service) => {
                  const Icon = service.icon
                  const isActive = selectedService === service.id
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleServiceChange(service.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all min-h-[48px] ${
                        isActive
                          ? 'bg-white text-primary-600 shadow-lg ring-2 ring-primary-500'
                          : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                      }`}
                      aria-label={service.label}
                      aria-pressed={isActive}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="whitespace-nowrap leading-none">{service.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-4">
              <div className="flex flex-col md:flex-row gap-4">

                {/* Location Input with Label and Integrated GPS */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 px-1">
                    Dein Ort
                  </label>
                  {!useGeolocation ? (
                    <div className="relative h-14">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="PLZ oder Ort"
                        className="w-full h-full pl-12 pr-12 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                        aria-label="Postleitzahl oder Ort eingeben"
                      />
                      {/* GPS Button Integrated */}
                      <button
                        onClick={requestGeolocation}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Standort nutzen"
                        aria-label="Standort nutzen"
                      >
                        <Navigation className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative h-14">
                      <div className="h-full px-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-green-700 font-semibold text-sm">Standort aktiv</span>
                      </div>
                      <button
                        onClick={() => {
                          setUseGeolocation(false)
                          setCustomerLocation(null)
                          setHasSearched(false)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Standort deaktivieren"
                        aria-label="Standort deaktivieren"
                      >
                        <X className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Radius Dropdown - Smaller and Less Prominent */}
                <div className="w-full md:w-28">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 px-1">
                    Umkreis
                  </label>
                  <select
                    name="radius"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full h-14 px-3 border-2 border-gray-200 rounded-xl text-gray-900 text-sm font-semibold focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                    aria-label="Umkreis auswählen"
                  >
                    {RADIUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <div className="w-full md:w-auto md:pt-6">
                  <button
                    onClick={handleSearch}
                    className="w-full md:w-auto h-14 px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    <span className="hidden lg:inline">Jetzt Festpreise vergleichen</span>
                    <span className="lg:hidden">Vergleichen</span>
                  </button>
                </div>
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
        <section ref={searchResultsRef} className="py-8 bg-gray-50">
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

                      {/* === GENERAL FILTERS (for all services) === */}

                      {/* Fahrzeug wählen (for all services) */}
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          🚙 Fahrzeug wählen
                        </h4>
                          {session ? (
                            <div className="space-y-2">
                              <select
                                value={selectedVehicleId}
                                onChange={(e) => handleVehicleSelect(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                              >
                                <option value="">Fahrzeug auswählen...</option>
                                {customerVehicles.map(vehicle => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.make} {vehicle.model} ({vehicle.year})
                                  </option>
                                ))}
                              </select>
                              {customerVehicles.length === 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Noch keine Fahrzeuge in der <a href="/dashboard/customer/vehicles" className="text-primary-600 hover:underline">Fahrzeugverwaltung</a> hinterlegt.
                                </p>
                              )}
                              {/* Show tire dimensions only for TIRE_CHANGE service */}
                              {selectedService === 'TIRE_CHANGE' && selectedVehicleId && tireDimensions.width && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="text-xs text-green-800">
                                    {/* Mixed tires - show front and/or rear based on selection */}
                                    {hasMixedTires && tireDimensionsFront && tireDimensionsRear ? (
                                      <>
                                        {selectedPackages.includes('front_two_tires') && (
                                          <p>✅ Reifengröße: {tireDimensionsFront} (Vorderachse)</p>
                                        )}
                                        {selectedPackages.includes('rear_two_tires') && (
                                          <p>✅ Reifengröße: {tireDimensionsRear} (Hinterachse)</p>
                                        )}
                                        {selectedPackages.includes('mixed_four_tires') && (
                                          <>
                                            <p>✅ Vorne: {tireDimensionsFront}</p>
                                            <p>✅ Hinten: {tireDimensionsRear}</p>
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      /* Standard tires - single size for all wheels */
                                      <p>
                                        ✅ Reifengröße: {tireDimensions.width}/{tireDimensions.height} R{tireDimensions.diameter}
                                        {tireDimensions.loadIndex && tireDimensions.speedIndex ? ` ${tireDimensions.loadIndex}${tireDimensions.speedIndex}` : ''}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Missing Season Data Warning - only for TIRE_CHANGE */}
                              {selectedService === 'TIRE_CHANGE' && missingSeasonError && selectedVehicleId && (
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <span className="text-yellow-600 text-lg flex-shrink-0">⚠️</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-yellow-900 mb-1">
                                        {missingSeasonError.seasonName} nicht gespeichert
                                      </p>
                                      <p className="text-xs text-yellow-800 mb-2">
                                        Für dieses Fahrzeug sind keine {missingSeasonError.seasonName} in der Fahrzeugverwaltung hinterlegt.
                                      </p>
                                      <a
                                        href="/dashboard?tab=vehicles"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-yellow-900 hover:text-yellow-700 underline"
                                      >
                                        <Car className="w-3 h-3" />
                                        Zur Fahrzeugverwaltung
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-900 mb-2">
                                ⚠️ Bitte melden Sie sich an, um Ihr Fahrzeug auszuwählen
                              </p>
                              <button
                                onClick={() => setShowLoginModal(true)}
                                className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
                              >
                                Jetzt anmelden
                              </button>
                            </div>
                          )}
                        </div>

                      {/* === TIRE-CHANGE SPECIFIC FILTERS (only for Reifenwechsel) === */}
                      {selectedService === 'TIRE_CHANGE' && (
                        <>
                          {/* 1. Reifenmontage Art */}
                          <div className="p-4 border-b border-gray-200">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              🚗 Reifenmontage
                            </h4>
                            <div className="space-y-1">
                              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name="tireOption"
                                  checked={!includeTires}
                                  onChange={() => {
                                    setIncludeTires(false)
                                    if (hasSearched && customerLocation) {
                                      searchWorkshops(customerLocation)
                                    }
                                  }}
                                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium">Nur Montage</span>
                              </label>
                              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name="tireOption"
                                  checked={includeTires}
                                  onChange={() => {
                                    setIncludeTires(true)
                                  }}
                                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium">Reifenmontage mit Reifen</span>
                              </label>
                            </div>
                          </div>

                          {/* 2. Service-Optionen (Anzahl Reifen, Zusatzleistungen) */}
                          <div className="p-4 border-b border-gray-200">
                            <ServiceFilters
                              key={`tire-change-${selectedService}-${hasMixedTires ? 'mixed' : 'standard'}`}
                              selectedService={selectedService}
                              selectedPackages={selectedPackages}
                              onFiltersChange={(packages) => setSelectedPackages(packages)}
                              customConfig={
                                hasMixedTires && tireDimensionsFront && tireDimensionsRear && tireDimensionsFront !== tireDimensionsRear
                                  ? {
                                      groups: [
                                        {
                                          label: 'Anzahl Reifen',
                                          multiSelect: false,
                                          options: [
                                            {
                                              packageType: 'front_two_tires',
                                              label: '2 Reifen Vorderachse',
                                              info: `Wechsel der Vorderachse (${tireDimensionsFront})`
                                            },
                                            {
                                              packageType: 'rear_two_tires',
                                              label: '2 Reifen Hinterachse',
                                              info: `Wechsel der Hinterachse (${tireDimensionsRear})`
                                            },
                                            {
                                              packageType: 'mixed_four_tires',
                                              label: '4 Reifen Komplettsatz',
                                              info: `Alle 4 Reifen (2× ${tireDimensionsFront} vorne + 2× ${tireDimensionsRear} hinten)`
                                            }
                                          ]
                                        },
                                        {
                                          label: 'Zusatzleistungen',
                                          multiSelect: true,
                                          options: [
                                            { 
                                              packageType: 'with_disposal', 
                                              label: 'Mit Entsorgung', 
                                              info: 'Fachgerechte Entsorgung der alten Reifen inklusive'
                                            },
                                            { 
                                              packageType: 'runflat', 
                                              label: 'Runflat-Reifen', 
                                              info: 'Spezieller Service für Runflat-Reifen (notlauftauglich, ohne Notrad)'
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  : undefined
                              }
                              tireDimensionsFront={tireDimensionsFront}
                              tireDimensionsRear={tireDimensionsRear}
                            />
                          </div>

                          {/* Same Brand filter - only for mixed 4 tires */}
                          {includeTires && hasMixedTires && selectedPackages.includes('mixed_four_tires') && (
                            <div className="p-4 border-b border-gray-200">
                              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors bg-blue-50/50 border border-blue-200">
                                <input
                                  type="checkbox"
                                  checked={requireSameBrand}
                                  onChange={(e) => {
                                    const newValue = e.target.checked
                                    console.log('🏷️ [SameBrand] Checkbox toggled:', newValue)
                                    setRequireSameBrand(newValue)
                                    // Trigger immediate re-search with new filter value
                                    if (customerLocation) {
                                      searchWorkshops(customerLocation, undefined, undefined, newValue)
                                    }
                                  }}
                                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">🏷️ Gleicher Hersteller</div>
                                  <div className="text-xs text-gray-600 mt-0.5">Nur Kombinationen mit identischer Marke vorne und hinten anzeigen</div>
                                </div>
                              </label>
                            </div>
                          )}

                          {/* 4. Saison (only if includeTires) */}
                          {includeTires && (
                            <div className="p-4 border-b border-gray-200">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                ❄️ Saison
                              </h4>
                              <div className="space-y-1">
                                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                  <input
                                    type="radio"
                                    name="tireSeason"
                                    checked={selectedSeason === 's'}
                                    onChange={() => handleSeasonChange('s')}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm">☀️ Sommerreifen</span>
                                </label>
                                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                  <input
                                    type="radio"
                                    name="tireSeason"
                                    checked={selectedSeason === 'w'}
                                    onChange={() => handleSeasonChange('w')}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm">❄️ Winterreifen</span>
                                </label>
                                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                  <input
                                    type="radio"
                                    name="tireSeason"
                                    checked={selectedSeason === 'g'}
                                    onChange={() => handleSeasonChange('g')}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm">🔄 Ganzjahresreifen</span>
                                </label>
                              </div>
                            </div>
                          )}

                          {/* 6. Reifen-Budget (only if includeTires) */}
                          {includeTires && (
                            <div className="p-4 border-b border-gray-200">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                💶 Reifen-Budget (pro Stück)
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span>{formatEUR(tireBudgetMin)}</span>
                                  <span className="text-gray-400">bis</span>
                                  <span>{formatEUR(tireBudgetMax)}</span>
                                </div>
                                <div className="space-y-2">
                                  <label className="block">
                                    <span className="text-xs text-gray-500">Mindestpreis</span>
                                    <input
                                      type="range"
                                      min="50"
                                      max="500"
                                      step="10"
                                      value={tireBudgetMin}
                                      onChange={(e) => {
                                        const newMin = parseInt(e.target.value)
                                        if (newMin <= tireBudgetMax) {
                                          setTireBudgetMin(newMin)
                                          if (hasSearched && customerLocation && tireDimensions.width && tireDimensions.height && tireDimensions.diameter) {
                                            searchWorkshops(customerLocation)
                                          }
                                        }
                                      }}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="text-xs text-gray-500">Höchstpreis</span>
                                    <input
                                      type="range"
                                      min="50"
                                      max="500"
                                      step="10"
                                      value={tireBudgetMax}
                                      onChange={(e) => {
                                        const newMax = parseInt(e.target.value)
                                        if (newMax >= tireBudgetMin) {
                                          setTireBudgetMax(newMax)
                                          if (hasSearched && customerLocation && tireDimensions.width && tireDimensions.height && tireDimensions.diameter) {
                                            searchWorkshops(customerLocation)
                                          }
                                        }
                                      }}
                                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Service-Specific Package Filters (for non-TIRE_CHANGE services) */}
                      {selectedService !== 'TIRE_CHANGE' && (
                        <div className="p-4 border-b border-gray-200">
                          <ServiceFilters
                            key={`other-service-${selectedService}`}
                            selectedService={selectedService}
                            selectedPackages={selectedPackages}
                            onFiltersChange={(packages) => setSelectedPackages(packages)}
                          />
                        </div>
                      )}

                      {/* EU Labels (only for TIRE_CHANGE with tires) */}
                      {selectedService === 'TIRE_CHANGE' && includeTires && (
                        <div className="p-4 border-b border-gray-200">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            🇪🇺 EU-Label
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Kraftstoffeffizienz (min.)</label>
                              <select
                                value={fuelEfficiency}
                                onChange={(e) => {
                                  setFuelEfficiency(e.target.value)
                                  if (hasSearched && customerLocation && tireDimensions.width && tireDimensions.height && tireDimensions.diameter) {
                                    searchWorkshops(customerLocation)
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                              >
                                <option value="">Alle</option>
                                <option value="A">A (Beste)</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Nasshaftung (min.)</label>
                              <select
                                value={wetGrip}
                                onChange={(e) => {
                                  setWetGrip(e.target.value)
                                  if (hasSearched && customerLocation && tireDimensions.width && tireDimensions.height && tireDimensions.diameter) {
                                    searchWorkshops(customerLocation)
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                              >
                                <option value="">Alle</option>
                                <option value="A">A (Beste)</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Zusatzmerkmale (only for TIRE_CHANGE with tires) */}
                      {selectedService === 'TIRE_CHANGE' && includeTires && (
                        <div className="p-4 border-b border-gray-200">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            ✨ Zusatzmerkmale
                          </h4>
                          <div className="space-y-1">
                            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={require3PMSF}
                                onChange={(e) => {
                                  setRequire3PMSF(e.target.checked)
                                  if (hasSearched && customerLocation && tireDimensions.width && tireDimensions.height && tireDimensions.diameter) {
                                    searchWorkshops(customerLocation)
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm">❄️ 3PMSF (Schneeflocke)</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={showDOTTires}
                                onChange={(e) => {
                                  setShowDOTTires(e.target.checked)
                                  if (hasSearched && customerLocation) {
                                    searchWorkshops(customerLocation)
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm">🏷️ DOT-Reifen anzeigen</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Payment Methods Filter */}
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Zahlungsmethoden
                        </h4>
                        <div className="space-y-1">
                          {[
                            { id: 'CREDIT_CARD', label: 'Kreditkarte' },
                            { id: 'PAYPAL', label: 'PayPal' },
                            { id: 'INSTALLMENT', label: 'Ratenzahlung' }
                          ].map((method) => (
                            <label
                              key={method.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
                        <div className="space-y-1">
                          {[
                            { id: 'SATURDAY', label: 'Samstag geöffnet', icon: CalendarDays },
                            { id: 'EVENING', label: 'Abends (nach 18 Uhr)', icon: Sunset },
                            { id: 'EARLY', label: 'Frühmorgens (vor 8 Uhr)', icon: Sunrise }
                          ].map((hours) => (
                            <label
                              key={hours.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={hasMultipleServices}
                            onChange={(e) => setHasMultipleServices(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
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
                      // Hide tires if season data is missing (safety feature - prevent wrong tire orders)
                      const showTires = includeTires && !missingSeasonError
                      
                      const isFavorite = favorites.includes(workshop.id)
                      const tireIdx = selectedTireIndices[workshop.id] ?? 0
                      const selectedRec = workshop.tireRecommendations?.[tireIdx]
                      
                      // Brand option handling (for sameBrand filter)
                      const brandOptionIdx = selectedBrandOptionIndices[workshop.id] ?? 0
                      const selectedBrandOption = workshop.brandOptions?.[brandOptionIdx]
                      
                      // Mixed tire indices - use brandOption if available
                      let tireFrontIdx, tireRearIdx, selectedFrontRec, selectedRearRec
                      
                      if (selectedBrandOption) {
                        // Use tires from selected brand option
                        selectedFrontRec = {
                          ...selectedBrandOption.front,
                          tire: selectedBrandOption.front.tire,
                          quantity: selectedBrandOption.front.quantity
                        }
                        selectedRearRec = {
                          ...selectedBrandOption.rear,
                          tire: selectedBrandOption.rear.tire,
                          quantity: selectedBrandOption.rear.quantity
                        }
                      } else {
                        // Use default selections from tire indices
                        tireFrontIdx = selectedTireFrontIndices[workshop.id] ?? 0
                        tireRearIdx = selectedTireRearIndices[workshop.id] ?? 0
                        selectedFrontRec = workshop.tireFrontRecommendations?.[tireFrontIdx]
                        selectedRearRec = workshop.tireRearRecommendations?.[tireRearIdx]
                      }
                      
                      // Use workshop.totalPrice from backend (includes disposal fee)
                      // If a different tire is selected, adjust the price by the difference
                      const defaultTirePrice = workshop.tirePrice ?? 0
                      
                      let currentTirePrice = defaultTirePrice
                      if (workshop.isMixedTires) {
                        // For mixed tires: sum selected front and rear recommendations
                        currentTirePrice = (selectedFrontRec?.totalPrice ?? workshop.tireFront?.totalPrice ?? 0) + 
                                          (selectedRearRec?.totalPrice ?? workshop.tireRear?.totalPrice ?? 0)
                      } else {
                        // For standard tires: use selected recommendation
                        currentTirePrice = selectedRec?.totalPrice ?? defaultTirePrice
                      }
                      
                      const currentTotalPrice = (workshop.totalPrice || 0) - defaultTirePrice + currentTirePrice
                      
                      // EU Label color helper
                      const getLabelColor = (grade: string | null | undefined) => {
                        if (!grade) return 'bg-gray-200 text-gray-700'
                        const colors: Record<string, string> = {
                          'A': 'bg-green-600 text-white',
                          'B': 'bg-green-500 text-white',
                          'C': 'bg-yellow-400 text-gray-900',
                          'D': 'bg-orange-400 text-white',
                          'E': 'bg-red-500 text-white',
                          'F': 'bg-red-700 text-white',
                          'G': 'bg-red-900 text-white',
                        }
                        return colors[grade.toUpperCase()] || 'bg-gray-200 text-gray-700'
                      }
                      
                      const getNoiseColor = (noise: number | null | undefined) => {
                        if (!noise) return 'bg-gray-200 text-gray-700'
                        if (noise <= 68) return 'bg-green-600 text-white'
                        if (noise <= 71) return 'bg-yellow-400 text-gray-900'
                        return 'bg-red-500 text-white'
                      }
                      
                      const getNoiseWaves = (noise: number | null | undefined) => {
                        if (!noise) return ''
                        if (noise <= 68) return '🔈' // Leise (1 Welle)
                        if (noise <= 71) return '🔉' // Mittel (2 Wellen)
                        return '🔊' // Laut (3 Wellen)
                      }
                      
                      return (
                        <div
                          key={workshop.id}
                          className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row">
                            {/* Left: Logo + Badge */}
                            <div className="relative flex-shrink-0 w-full sm:w-44 h-44 sm:h-auto bg-gradient-to-br from-slate-100 to-slate-200">
                              {workshop.logoUrl ? (
                                <img 
                                  src={workshop.logoUrl} 
                                  alt={`${workshop.name} Logo`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const parent = e.currentTarget.parentElement
                                    if (parent) {
                                      e.currentTarget.remove()
                                      const span = document.createElement('span')
                                      span.className = 'text-5xl absolute inset-0 flex items-center justify-center'
                                      span.textContent = '🔧'
                                      parent.appendChild(span)
                                    }
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-5xl">🔧</span>
                                </div>
                              )}
                              {/* BELIEBT Badge */}
                              {workshop.rating >= 4.5 && workshop.reviewCount >= 5 && (
                                <div className="absolute top-3 left-3 px-3 py-1 bg-primary-600 text-white text-xs font-bold uppercase rounded-md shadow-md tracking-wider">
                                  Beliebt
                                </div>
                              )}
                              {/* Favorite Button */}
                              <button
                                onClick={() => toggleFavorite(workshop.id)}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all"
                              >
                                <svg
                                  className={`w-5 h-5 transition-colors ${
                                    isFavorite ? 'fill-red-500 text-red-500' : 'fill-none text-gray-500 hover:text-red-500'
                                  }`}
                                  stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </button>
                            </div>

                            {/* Right: Content */}
                            <div className="flex-1 p-4 sm:p-5 flex flex-col">
                              {/* Header Row: Name + City + Rating + Distance */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{workshop.name}</h3>
                                {workshop.city && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                                    {workshop.city}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                                {/* Stars */}
                                {workshop.rating && workshop.rating > 0 ? (
                                  <>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < Math.round(workshop.rating)
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'fill-gray-200 text-gray-200'
                                          }`}
                                        />
                                      ))}
                                      <span className="font-semibold text-gray-900 ml-0.5">{workshop.rating.toFixed(1)}</span>
                                      {workshop.reviewCount && workshop.reviewCount > 0 && (
                                        <span className="text-gray-500">({workshop.reviewCount})</span>
                                      )}
                                    </div>
                                    <span className="text-gray-400">·</span>
                                  </>
                                ) : null}
                                <span className="flex items-center gap-1 text-gray-600">
                                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                                  {workshop.distance.toFixed(1)} km
                                </span>
                              </div>

                              {/* Service Tags */}
                              {workshop.availableServices && workshop.availableServices.length > 0 && (() => {
                                const additionalServices = workshop.availableServices.filter((s: string) => s !== selectedService)
                                if (additionalServices.length > 0) {
                                  return (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                      {additionalServices.slice(0, 5).map((serviceType: string) => {
                                        const service = SERVICES.find(s => s.id === serviceType)
                                        if (!service) return null
                                        const ServiceIcon = service.icon
                                        return (
                                          <span key={serviceType} className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200" title={service.description}>
                                            <ServiceIcon className="w-3 h-3" /> {service.label}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  )
                                }
                                return null
                              })()}

                              {/* Tire Recommendations Panel - Enhanced with Expandable Grid */}
                              {showTires && workshop.tireAvailable && workshop.tireRecommendations?.length > 0 && (() => {
                                const isExpanded = expandedTireWorkshops[workshop.id] || false
                                const allTires = filterAndSortTires(workshop.tireRecommendations, workshop.id)
                                const displayedTires = isExpanded ? allTires : allTires.slice(0, 3)
                                const remainingCount = allTires.length - 3
                                const currentFilter = tireQualityFilter[workshop.id] || 'all'
                                const currentSort = tireSortBy[workshop.id] || 'price'
                                
                                return (
                                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mb-3">
                                    {/* Header with dimension */}
                                    <div className="flex items-center justify-between mb-3">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Reifen auswählen · {tireDimensions.width}/{tireDimensions.height} R{tireDimensions.diameter}
                                      </p>
                                      <span className="text-xs text-gray-500">{allTires.length} verfügbar</span>
                                    </div>
                                    
                                    {/* Quick Filters & Sort */}
                                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                      {/* Quality Filter Buttons */}
                                      <div className="flex gap-1 flex-wrap">
                                        {[
                                          { id: 'all', label: 'Alle', icon: '🔍' },
                                          { id: 'cheap', label: 'Günstige', icon: '💰' },
                                          { id: 'best', label: 'Beste Eigenschaften', icon: '🏆' },
                                          { id: 'premium', label: 'Premium', icon: '⭐' },
                                        ].map((filter) => (
                                          <button
                                            key={filter.id}
                                            onClick={() => setTireQualityFilter(prev => ({ ...prev, [workshop.id]: filter.id as any }))}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                              currentFilter === filter.id
                                                ? 'bg-primary-600 text-white shadow-sm'
                                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                          >
                                            {filter.icon} {filter.label}
                                          </button>
                                        ))}
                                      </div>
                                      
                                      {/* Sort Dropdown */}
                                      <select
                                        value={currentSort}
                                        onChange={(e) => setTireSortBy(prev => ({ ...prev, [workshop.id]: e.target.value as any }))}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                                      >
                                        <option value="price">Preis ↑</option>
                                        <option value="brand">Marke A-Z</option>
                                        <option value="label">EU-Label</option>
                                      </select>
                                    </div>
                                    
                                    {/* Tire Grid */}
                                    <div className={`grid grid-cols-1 ${isExpanded ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3'} gap-2 mb-2`}>
                                      {displayedTires.map((rec: any, idx: number) => {
                                        // FIX: Find index in ORIGINAL array, not filtered array
                                        const originalIdx = workshop.tireRecommendations.indexOf(rec)
                                        return (
                                          <button
                                            key={idx}
                                            onClick={() => setSelectedTireIndices(prev => ({...prev, [workshop.id]: originalIdx}))}
                                            className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                                              tireIdx === originalIdx
                                                ? 'border-primary-500 bg-white shadow-md ring-2 ring-primary-200'
                                                : 'border-transparent bg-white hover:border-gray-300'
                                            }`}
                                          >
                                            <p className="text-xs font-bold text-primary-600 mb-0.5">{rec.label}</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{rec.brand}</p>
                                            <p className="text-xs text-gray-500 truncate mb-0.5">{rec.model}</p>
                                            {/* Safety: Show Load & Speed Index */}
                                            {(rec.loadIndex || rec.speedIndex) && (
                                              <p className="text-xs text-gray-600 font-medium mb-1.5">
                                                {rec.loadIndex && <span className="text-green-700">{rec.loadIndex}</span>}
                                                {rec.loadIndex && rec.speedIndex && <span className="text-gray-400 mx-0.5">/</span>}
                                                {rec.speedIndex && <span className="text-blue-700">{rec.speedIndex}</span>}
                                              </p>
                                            )}
                                            <div className="flex gap-1 mb-1.5">
                                              {rec.labelFuelEfficiency && (
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${getLabelColor(rec.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                                  {rec.labelFuelEfficiency}
                                                </span>
                                              )}
                                              {rec.labelWetGrip && (
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${getLabelColor(rec.labelWetGrip)}`} title="Nasshaftung">
                                                  {rec.labelWetGrip}
                                                </span>
                                              )}
                                              {rec.labelNoise && (
                                                <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getNoiseColor(rec.labelNoise)}`} title={`Lautstärke: ${rec.labelNoise} dB`}>
                                                  {getNoiseWaves(rec.labelNoise)} {rec.labelNoise}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900">{formatEUR(rec.totalPrice || rec.pricePerTire || 0)}</p>
                                          </button>
                                        )
                                      })}
                                    </div>
                                    
                                    {/* Show More / Less Button */}
                                    {allTires.length > 3 && (
                                      <button
                                        onClick={() => setExpandedTireWorkshops(prev => ({ ...prev, [workshop.id]: !isExpanded }))}
                                        className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-primary-600 font-semibold text-sm rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-all flex items-center justify-center gap-2"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="w-4 h-4" />
                                            Weniger anzeigen
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-4 h-4" />
                                            {remainingCount} weitere Reifen anzeigen
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Brand Selector (for sameBrand filter with multiple options) */}
                              {showTires && workshop.isMixedTires && workshop.brandOptions && workshop.brandOptions.length > 1 && (
                                <div className="bg-blue-50 rounded-xl border-2 border-blue-300 p-3 mb-3">
                                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    🏷️ Hersteller wählen
                                    <span className="text-xs font-normal normal-case text-blue-600">· {workshop.brandOptions.length} Optionen verfügbar</span>
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {workshop.brandOptions.map((brandOpt: any, idx: number) => {
                                      // Color based on label
                                      const labelColor = brandOpt.label === 'Günstigster' ? 'text-green-600' :
                                                        brandOpt.label === 'Testsieger' ? 'text-purple-600' :
                                                        'text-blue-600'
                                      
                                      // Calculate total price including service costs
                                      const brandOptionTirePrice = (brandOpt.front?.totalPrice ?? 0) + (brandOpt.rear?.totalPrice ?? 0)
                                      const brandOptionTotalPrice = (workshop.totalPrice || 0) - defaultTirePrice + brandOptionTirePrice
                                      
                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => setSelectedBrandOptionIndices(prev => ({...prev, [workshop.id]: idx}))}
                                          className={`text-left p-3 rounded-lg border-2 transition-all ${
                                            brandOptionIdx === idx
                                              ? 'border-blue-500 bg-white shadow-md'
                                              : 'border-transparent bg-white hover:border-blue-300'
                                          }`}
                                        >
                                          <p className={`text-xs font-bold mb-1 ${labelColor}`}>{brandOpt.label}</p>
                                          <p className="text-sm font-bold text-gray-900 mb-0.5">{brandOpt.brand}</p>
                                          <p className="text-xs text-gray-600 mb-2">Vorne + Hinten</p>
                                          <p className="text-lg font-bold text-primary-600">{formatEUR(brandOptionTotalPrice)}</p>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Mixed Tire Recommendations Panel - Front */}
                              {showTires && workshop.isMixedTires && workshop.tireFrontRecommendations?.length > 0 && !workshop.brandOptions && (() => {
                                const workshopKey = `${workshop.id}-front`
                                const filteredTires = filterAndSortTires(workshop.tireFrontRecommendations, workshopKey)
                                const isExpanded = expandedTireWorkshops[workshopKey] || false
                                const displayedTires = isExpanded ? filteredTires : filteredTires.slice(0, 3)
                                const hasMoreTires = filteredTires.length > 3
                                const currentFilter = tireQualityFilter[workshopKey] || 'all'
                                const currentSort = tireSortBy[workshopKey] || 'price'

                                return (
                                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mb-3">
                                    {/* Header with tire count */}
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        🔹 Vorderachse · {workshop.tireFront?.dimensions} <span className="text-gray-400">({filteredTires.length} Reifen)</span>
                                      </p>
                                    </div>

                                    {/* Quick Filters + Sorting */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                      {/* Quality filter buttons */}
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'all'}))}
                                          className={`px-2 py-1 text-xs rounded-md transition ${
                                            currentFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          🔍 Alle
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'cheap'}))}
                                          className={`px-2 py-1 text-xs rounded-md transition ${
                                            currentFilter === 'cheap' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          💰 Günstige
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'best'}))}
                                          className={`px-2 py-1 text-xs rounded-md transition ${
                                            currentFilter === 'best' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          🏆 Beste Eigenschaften
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'premium'}))}
                                          className={`px-2 py-1 text-xs rounded-md transition ${
                                            currentFilter === 'premium' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          ⭐ Premium
                                        </button>
                                      </div>

                                      {/* Sort dropdown */}
                                      <select
                                        value={currentSort}
                                        onChange={(e) => setTireSortBy(prev => ({...prev, [workshopKey]: e.target.value as 'price' | 'brand' | 'label'}))}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      >
                                        <option value="price">Preis ↑</option>
                                        <option value="brand">Marke A-Z</option>
                                        <option value="label">EU-Label</option>
                                      </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      {displayedTires.map((rec: any, idx: number) => {
                                        const originalIdx = workshop.tireFrontRecommendations.findIndex((r: any) => r === rec)
                                        return (
                                        <button
                                          key={idx}
                                          onClick={() => setSelectedTireFrontIndices(prev => ({...prev, [workshop.id]: originalIdx}))}
                                          className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                                            (selectedTireFrontIndices[workshop.id] ?? 0) === originalIdx
                                              ? 'border-primary-500 bg-white shadow-sm'
                                              : 'border-transparent bg-white hover:border-gray-300'
                                          }`}
                                      >
                                        <p className="text-xs font-bold text-primary-600 mb-0.5">{rec.label}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{rec.tire.brand}</p>
                                        <p className="text-xs text-gray-500 truncate mb-0.5">{rec.tire.model}</p>
                                        {/* Safety: Show Load & Speed Index */}
                                        {(rec.tire.loadIndex || rec.tire.speedIndex) && (
                                          <p className="text-xs text-gray-600 font-medium mb-1.5">
                                            {rec.tire.loadIndex && <span className="text-green-700">{rec.tire.loadIndex}</span>}
                                            {rec.tire.loadIndex && rec.tire.speedIndex && <span className="text-gray-400 mx-0.5">/</span>}
                                            {rec.tire.speedIndex && <span className="text-blue-700">{rec.tire.speedIndex}</span>}
                                          </p>
                                        )}
                                        <div className="flex gap-1 mb-1.5">
                                          {rec.tire.labelFuelEfficiency && (
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${getLabelColor(rec.tire.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                              {rec.tire.labelFuelEfficiency}
                                            </span>
                                          )}
                                          {rec.tire.labelWetGrip && (
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${getLabelColor(rec.tire.labelWetGrip)}`} title="Nasshaftung">
                                              {rec.tire.labelWetGrip}
                                            </span>
                                          )}
                                          {rec.tire.labelNoise && (
                                            <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getNoiseColor(rec.tire.labelNoise)}`} title={`Lautstärke: ${rec.tire.labelNoise} dB`}>
                                              {getNoiseWaves(rec.tire.labelNoise)} {rec.tire.labelNoise}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">{formatEUR(rec.pricePerTire)} × {rec.quantity}</p>
                                      </button>
                                      )})
                                    }
                                    </div>

                                    {/* Show more button */}
                                    {hasMoreTires && (
                                      <button
                                        onClick={() => setExpandedTireWorkshops(prev => ({...prev, [workshopKey]: !isExpanded}))}
                                        className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition"
                                      >
                                        {isExpanded ? 'Weniger anzeigen' : `${filteredTires.length - 3} weitere Reifen anzeigen`}
                                      </button>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Mixed Tire Recommendations Panel - Rear */}
                              {showTires && workshop.isMixedTires && workshop.tireRearRecommendations?.length > 0 && !workshop.brandOptions && (() => {
                                const workshopKey = `${workshop.id}-rear`
                                const filteredTires = filterAndSortTires(workshop.tireRearRecommendations, workshopKey)
                                const isExpanded = expandedTireWorkshops[workshopKey] || false
                                const displayedTires = isExpanded ? filteredTires : filteredTires.slice(0, 3)
                                const hasMoreTires = filteredTires.length > 3
                                const currentFilter = tireQualityFilter[workshopKey] || 'all'
                                const currentSort = tireSortBy[workshopKey] || 'price'

                                return (
                                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mb-3">
                                    {/* Header with tire count */}
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        🔸 Hinterachse · {workshop.tireRear?.dimensions} <span className="text-gray-400">({filteredTires.length} Reifen)</span>
                                      </p>
                                    </div>

                                    {/* Quick Filters + Sorting */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                      {/* Quality filter buttons */}
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'all'}))}
                                          className={`px-2 py-1 text-xs rounded-md transition ${
                                            currentFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          🔍 Alle
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'cheap'}))}
                                          className={`px-2 py-1 text-xs rounded-md transition ${
                                            currentFilter === 'cheap' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          💰 Günstige
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'best'}))}
                                          className={`px-2 py-1 text-xs rounded-md transition ${
                                            currentFilter === 'best' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          🏆 Beste Eigenschaften
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'premium'}))}
                                          className={`px-2 py-1 text-xs rounded-md transition ${
                                            currentFilter === 'premium' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          ⭐ Premium
                                        </button>
                                      </div>

                                      {/* Sort dropdown */}
                                      <select
                                        value={currentSort}
                                        onChange={(e) => setTireSortBy(prev => ({...prev, [workshopKey]: e.target.value as 'price' | 'brand' | 'label'}))}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      >
                                        <option value="price">Preis ↑</option>
                                        <option value="brand">Marke A-Z</option>
                                        <option value="label">EU-Label</option>
                                      </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      {displayedTires.map((rec: any, idx: number) => {
                                        const originalIdx = workshop.tireRearRecommendations.findIndex((r: any) => r === rec)
                                        return (
                                        <button
                                          key={idx}
                                          onClick={() => setSelectedTireRearIndices(prev => ({...prev, [workshop.id]: originalIdx}))}
                                          className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                                            (selectedTireRearIndices[workshop.id] ?? 0) === originalIdx
                                              ? 'border-primary-500 bg-white shadow-sm'
                                              : 'border-transparent bg-white hover:border-gray-300'
                                          }`}
                                      >
                                        <p className="text-xs font-bold text-primary-600 mb-0.5">{rec.label}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{rec.tire.brand}</p>
                                        <p className="text-xs text-gray-500 truncate mb-0.5">{rec.tire.model}</p>
                                        {/* Safety: Show Load & Speed Index */}
                                        {(rec.tire.loadIndex || rec.tire.speedIndex) && (
                                          <p className="text-xs text-gray-600 font-medium mb-1.5">
                                            {rec.tire.loadIndex && <span className="text-green-700">{rec.tire.loadIndex}</span>}
                                            {rec.tire.loadIndex && rec.tire.speedIndex && <span className="text-gray-400 mx-0.5">/</span>}
                                            {rec.tire.speedIndex && <span className="text-blue-700">{rec.tire.speedIndex}</span>}
                                          </p>
                                        )}
                                        <div className="flex gap-1 mb-1.5">
                                          {rec.tire.labelFuelEfficiency && (
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${getLabelColor(rec.tire.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                              {rec.tire.labelFuelEfficiency}
                                            </span>
                                          )}
                                          {rec.tire.labelWetGrip && (
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${getLabelColor(rec.tire.labelWetGrip)}`} title="Nasshaftung">
                                              {rec.tire.labelWetGrip}
                                            </span>
                                          )}
                                          {rec.tire.labelNoise && (
                                            <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getNoiseColor(rec.tire.labelNoise)}`} title={`Lautstärke: ${rec.tire.labelNoise} dB`}>
                                              {getNoiseWaves(rec.tire.labelNoise)} {rec.tire.labelNoise}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">{formatEUR(rec.pricePerTire)} × {rec.quantity}</p>
                                      </button>
                                      )})
                                    }
                                    </div>

                                    {/* Show more button */}
                                    {hasMoreTires && (
                                      <button
                                        onClick={() => setExpandedTireWorkshops(prev => ({...prev, [workshopKey]: !isExpanded}))}
                                        className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition"
                                      >
                                        {isExpanded ? 'Weniger anzeigen' : `${filteredTires.length - 3} weitere Reifen anzeigen`}
                                      </button>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Tire not available warning - only for TIRE_CHANGE service */}
                              {selectedService === 'TIRE_CHANGE' && showTires && !workshop.tireAvailable && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                  {!selectedVehicleId ? (
                                    <div>
                                      <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ Fahrzeug auswählen</p>
                                      <p className="text-xs text-yellow-700">Bitte wählen Sie links unter "Fahrzeug wählen" Ihr Fahrzeug aus, um passende Reifen anzuzeigen.</p>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-yellow-800">⚠️ Keine passenden Reifen verfügbar</p>
                                  )}
                                </div>
                              )}

                              {/* Bottom Row: Price Info + CTA */}
                              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-auto gap-3">
                                <div className="w-full sm:w-auto">
                                  {showTires && workshop.tireAvailable && (selectedRec || workshop.isMixedTires) ? (
                                    <>
                                      {/* Price breakdown */}
                                      <div className="space-y-0.5 text-sm text-gray-600 mb-2">
                                        {workshop.isMixedTires && (selectedFrontRec || selectedRearRec) ? (
                                          <>
                                            {/* Mixed tires: Show selected front and rear */}
                                            {selectedFrontRec && (
                                              <>
                                                <div className="flex justify-between gap-4">
                                                  <span className="text-xs">🔹 Vorderachse ({workshop.tireFront?.dimensions})</span>
                                                </div>
                                                <div className="flex justify-between gap-4 ml-3">
                                                  <span>{selectedFrontRec.quantity}× {selectedFrontRec.tire.brand} {selectedFrontRec.tire.model} à {formatEUR(selectedFrontRec.pricePerTire)}</span>
                                                  <span className="font-medium">{formatEUR(selectedFrontRec.totalPrice)}</span>
                                                </div>
                                              </>
                                            )}
                                            {selectedRearRec && (
                                              <>
                                                <div className="flex justify-between gap-4 mt-1">
                                                  <span className="text-xs">🔸 Hinterachse ({workshop.tireRear?.dimensions})</span>
                                                </div>
                                                <div className="flex justify-between gap-4 ml-3">
                                                  <span>{selectedRearRec.quantity}× {selectedRearRec.tire.brand} {selectedRearRec.tire.model} à {formatEUR(selectedRearRec.pricePerTire)}</span>
                                                  <span className="font-medium">{formatEUR(selectedRearRec.totalPrice)}</span>
                                                </div>
                                              </>
                                            )}
                                          </>
                                        ) : selectedRec ? (
                                          <>
                                            {/* Standard tires: Single tire type */}
                                            <div className="flex justify-between gap-4">
                                              <span>{selectedRec.quantity}× {selectedRec.brand} à {formatEUR(selectedRec.pricePerTire)}</span>
                                              <span className="font-medium">{formatEUR(selectedRec.totalPrice)}</span>
                                            </div>
                                          </>
                                        ) : null}
                                        {workshop.basePrice > 0 ? (
                                          <div className="flex justify-between gap-4">
                                            <span>Montage</span>
                                            <span className="font-medium">{formatEUR(workshop.basePrice)}</span>
                                          </div>
                                        ) : null}
                                        {workshop.disposalFeeApplied && workshop.disposalFeeApplied > 0 && (selectedRec || workshop.isMixedTires) && (() => {
                                          const tireCount = workshop.isMixedTires ? 4 : (selectedRec?.quantity || 0)
                                          // Only show disposal fee if there are actually tires selected
                                          if (tireCount > 0) {
                                            return (
                                              <div className="flex justify-between gap-4">
                                                <span>Entsorgung ({tireCount}× {formatEUR(workshop.disposalFeeApplied / tireCount)})</span>
                                                <span className="font-medium">{formatEUR(workshop.disposalFeeApplied)}</span>
                                              </div>
                                            )
                                          }
                                          return null
                                        })()}
                                        <div className="border-t border-gray-200 pt-1 mt-1"></div>
                                      </div>
                                      {/* Total price */}
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-xs text-gray-500">Gesamtpreis</span>
                                        <span className="text-2xl sm:text-3xl font-bold text-primary-600">
                                          ab {formatEUR(currentTotalPrice)}
                                        </span>
                                      </div>
                                    </>
                                  ) : !includeTires ? (
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs text-gray-500">Gesamtpreis</span>
                                      {workshop.totalPrice > 0 ? (
                                        <span className="text-2xl sm:text-3xl font-bold text-primary-600">
                                          ab {formatEUR(workshop.totalPrice)}
                                        </span>
                                      ) : (
                                        <span className="text-lg font-semibold text-gray-500">Preis auf Anfrage</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm text-gray-600">Nur Montage</p>
                                      <span className="text-2xl font-bold text-primary-600">ab {formatEUR(workshop.basePrice || workshop.totalPrice)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    {workshop.estimatedDuration && (
                                      <span>~ {workshop.estimatedDuration} Min.</span>
                                    )}
                                    {workshop.estimatedDuration && selectedPackages.includes('with_balancing') && (
                                      <span>·</span>
                                    )}
                                    {selectedPackages.includes('with_balancing') && (
                                      <span>inkl. Wuchten</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleBooking(workshop)}
                                  className="flex-shrink-0 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
                                >
                                  Termin buchen →
                                </button>
                              </div>
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
      <section className="py-16">
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
                <li><button onClick={() => setShowLoginModal(true)} className="hover:text-white transition-colors">Anmelden</button></li>
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
