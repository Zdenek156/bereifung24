'use client' // v5.0 Cache Bust 2026-02-14

import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
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
  Calendar,
  BookOpen,
  Car,
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
  Snowflake,
  Sparkles
} from 'lucide-react'
import ServiceFilters from './components/ServiceFilters'
import { useScrollReveal, useCountUp } from './hooks/useAnimations'

// Dynamic imports for below-fold components — reduces initial JS bundle
const AffiliateTracker = dynamic(() => import('@/components/AffiliateTracker'), { ssr: false })
const LiveChat = dynamic(() => import('@/components/LiveChat'), { ssr: false })
const LoginModal = dynamic(() => import('@/components/LoginModal'), { ssr: false })

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

export interface FixedWorkshopContext {
  landingPageSlug: string
  workshopId: string
  workshopName: string
  latitude: number
  longitude: number
}

interface NewHomePageProps {
  initialFixedWorkshopContext?: FixedWorkshopContext | null
  hideHeroHeader?: boolean
  allowedServiceTypes?: string[]
  serviceCards?: Array<{
    serviceType: string
    basePrice: number
    basePrice4?: number | null
    durationMinutes?: number | null
    durationMinutes4?: number | null
  }>
  initialReviews?: Review[]
  initialStats?: Stats
}

export default function NewHomePage({
  initialFixedWorkshopContext = null,
  hideHeroHeader = false,
  allowedServiceTypes,
  serviceCards = [],
  initialReviews,
  initialStats,
}: NewHomePageProps = {}) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // RESTORE STATE IMMEDIATELY from sessionStorage (for back navigation)
  const getInitialState = () => {
    if (typeof window !== 'undefined') {
      const savedSearchState = sessionStorage.getItem('lastSearchState')
      if (savedSearchState) {
        try {
          const searchState = JSON.parse(savedSearchState)
          if (Date.now() - searchState.timestamp < 30 * 60 * 1000) {
            console.log('⚡ [INIT] Restoring state immediately from sessionStorage')
            return searchState
          }
        } catch (e) {
          console.error('Error parsing savedSearchState:', e)
        }
      }
    }
    return null
  }
  
  const initialState = getInitialState()
  
  const [selectedService, setSelectedService] = useState(() => {
    if (hideHeroHeader && initialFixedWorkshopContext) {
      return ''
    }
    return initialState?.selectedService || 'TIRE_CHANGE'
  })
  const [postalCode, setPostalCode] = useState(initialState?.postalCode || '')
  const [radiusKm, setRadiusKm] = useState(initialState?.radiusKm || 10)
  const [useGeolocation, setUseGeolocation] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [fixedWorkshopContext, setFixedWorkshopContext] = useState<FixedWorkshopContext | null>(() => {
    if (typeof window === 'undefined') return initialFixedWorkshopContext

    const params = new URLSearchParams(window.location.search)
    const landingPageSlug = params.get('landingPageSlug')
    const workshopId = params.get('fixedWorkshopId')
    const workshopName = params.get('fixedWorkshopName')
    const lat = params.get('fixedWorkshopLat')
    const lon = params.get('fixedWorkshopLon')

    if (!landingPageSlug || !workshopId || !lat || !lon) {
      return initialFixedWorkshopContext
    }

    const latitude = Number(lat)
    const longitude = Number(lon)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null
    }

    return {
      landingPageSlug,
      workshopId,
      workshopName: workshopName || 'Werkstatt',
      latitude,
      longitude,
    }
  })
  const isWorkshopFixed = !!fixedWorkshopContext
  const [userDistanceToFixed, setUserDistanceToFixed] = useState<number | null>(null)
  
  // Search state
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [missingSeasonError, setMissingSeasonError] = useState<{ message: string; seasonName: string } | null>(null)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  
  // Reviews and stats — use SSR data if available, otherwise empty (will fetch client-side)
  const [reviews, setReviews] = useState<Review[]>(initialReviews || [])
  const [stats, setStats] = useState<Stats>(initialStats || {
    totalReviews: 0,
    avgRating: 0,
    workshopCount: 0,
    bookingCount: 0
  })
  
  // Service-specific package filters - Set sensible defaults based on service
  const [selectedPackages, setSelectedPackages] = useState<string[]>(() => {
    if (initialState?.selectedPackages && initialState.selectedPackages.length > 0) {
      return initialState.selectedPackages
    }
    // Set defaults based on service type
    const service = initialState?.selectedService || 'TIRE_CHANGE'
    if (service === 'TIRE_REPAIR') return ['foreign_object']
    if (service === 'ALIGNMENT_BOTH') return ['measurement_both']
    if (service === 'MOTORCYCLE_TIRE') return ['motorcycle_tire_installation_only', 'both', 'with_disposal']
    return ['tire_installation_only', 'four_tires', 'with_disposal']
  })
  
  // Handler to change service and set default packages
  const handleServiceChange = (newService: string) => {
    console.log('🎯 [page.tsx] Service changed to:', newService)
    setSelectedService(newService)
    
    // Check if current vehicle is compatible with new service
    if (selectedVehicleId && customerVehicles.length > 0) {
      const currentVehicle = customerVehicles.find(v => v.id === selectedVehicleId)
      if (currentVehicle) {
        let shouldClearVehicle = false
        
        // For car tire/wheel services: clear if motorcycle selected
        if ((newService === 'TIRE_CHANGE' || newService === 'WHEEL_CHANGE') && currentVehicle.vehicleType === 'MOTORCYCLE') {
          shouldClearVehicle = true
          console.log('⚠️ [Service Change] Clearing motorcycle - not compatible with car tire service')
        }
        
        // For motorcycle tire service: clear if car/trailer selected
        if (newService === 'MOTORCYCLE_TIRE' && currentVehicle.vehicleType !== 'MOTORCYCLE') {
          shouldClearVehicle = true
          console.log('⚠️ [Service Change] Clearing car/trailer - not compatible with motorcycle service')
        }
        
        if (shouldClearVehicle) {
          setSelectedVehicleId('')
          setTireDimensions({ width: '', height: '', diameter: '', loadIndex: '', speedIndex: '' })
          setHasMixedTires(false)
          setTireDimensionsFront('')
          setTireDimensionsRear('')
        }
      }
    }
    
    // Immediately set packages for TIRE_CHANGE
    if (newService === 'TIRE_CHANGE') {
      console.log('✅ [page.tsx] Setting default: with_tire_purchase + four_tires + with_disposal')
      setSelectedPackages(['with_tire_purchase', 'four_tires', 'with_disposal'])
    } else if (newService === 'MOTORCYCLE_TIRE') {
      console.log('✅ [page.tsx] Setting default for MOTORCYCLE_TIRE: motorcycle_tire_installation_only + both + with_disposal')
      setSelectedPackages(['motorcycle_tire_installation_only', 'both', 'with_disposal']) // Default: Nur Montage + Beide Reifen
    } else if (newService === 'TIRE_REPAIR') {
      console.log('✅ [page.tsx] Setting default for TIRE_REPAIR: foreign_object')
      setSelectedPackages(['foreign_object']) // Default: Fremdkörper-Reparatur
    } else if (newService === 'ALIGNMENT_BOTH') {
      console.log('✅ [page.tsx] Setting default for ALIGNMENT_BOTH: measurement_both')
      setSelectedPackages(['measurement_both']) // Default: Vermessung beider Achsen
    } else {
      console.log('🔄 [page.tsx] Clearing packages for:', newService)
      setSelectedPackages([])
    }
  }
  
  // Auto-set default package when user switches to TIRE_CHANGE or MOTORCYCLE_TIRE
  useEffect(() => {
    console.log('🔍 [page.tsx] Effect running:', { selectedService, packageCount: selectedPackages.length })
    if (selectedService === 'TIRE_CHANGE' && selectedPackages.length === 0) {
      console.log('🔧 [page.tsx] Auto-setting default for TIRE_CHANGE')
      // Use setTimeout to ensure state update happens after render
      setTimeout(() => {
        setSelectedPackages(['with_tire_purchase', 'four_tires', 'with_disposal'])
      }, 0)
    } else if (selectedService === 'MOTORCYCLE_TIRE' && selectedPackages.length === 0) {
      console.log('🔧 [page.tsx] Auto-setting default for MOTORCYCLE_TIRE: Nur Montage')
      setTimeout(() => {
        setSelectedPackages(['motorcycle_tire_installation_only', 'both', 'with_disposal'])
      }, 0)
    } else if (selectedService === 'TIRE_REPAIR' && selectedPackages.length === 0) {
      console.log('🔧 [page.tsx] Auto-setting default for TIRE_REPAIR: foreign_object')
      setTimeout(() => {
        setSelectedPackages(['foreign_object'])
      }, 0)
    } else if (selectedService === 'ALIGNMENT_BOTH' && selectedPackages.length === 0) {
      console.log('🔧 [page.tsx] Auto-setting default for ALIGNMENT_BOTH: measurement_both')
      setTimeout(() => {
        setSelectedPackages(['measurement_both'])
      }, 0)
    }
  }, [selectedService])
  
  // Tire Search State
  const [includeTires, setIncludeTires] = useState(true)
  const [includeDisposal, setIncludeDisposal] = useState(true) // For motorcycle disposal fee
  const [tireDimensions, setTireDimensions] = useState({
    width: '',
    height: '',
    diameter: '',
    loadIndex: '',
    speedIndex: ''
  })
  const [hasMixedTires, setHasMixedTires] = useState(initialState?.hasMixedTires || false)
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
  const [tireConstruction, setTireConstruction] = useState<'radial' | 'diagonal' | ''>('radial') // Default: Radial for motorcycle
  const [requireSameBrand, setRequireSameBrand] = useState(false) // For mixed 4 tires: same brand
  const [requireSameModel, setRequireSameModel] = useState(false) // For motorcycle: Achs-Set (same brand AND model front+rear)
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('') // Global brand filter for tire recommendations
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialState?.selectedVehicleId || '')
  const [customerVehicles, setCustomerVehicles] = useState<any[]>([])
  const [selectedTireIndices, setSelectedTireIndices] = useState<Record<string, number>>({}) // workshopId -> tire index
  const [selectedTireFrontIndices, setSelectedTireFrontIndices] = useState<Record<string, number>>({}) // workshopId -> front tire index (mixed tires)
  const [selectedTireRearIndices, setSelectedTireRearIndices] = useState<Record<string, number>>({}) // workshopId -> rear tire index (mixed tires)
  const [selectedBrandOptionIndices, setSelectedBrandOptionIndices] = useState<Record<string, number>>({}) // workshopId -> brand option index (for sameBrand filter)

  const useServiceCards = hideHeroHeader && isWorkshopFixed
  const filteredServices = allowedServiceTypes && allowedServiceTypes.length > 0
    ? SERVICES.filter((service) => allowedServiceTypes.includes(service.id))
    : SERVICES
  const visibleServices = useServiceCards ? filteredServices : filteredServices.slice(0, 5)
  const serviceCardMap = serviceCards.reduce<Record<string, {
    basePrice: number
    basePrice4?: number | null
    durationMinutes?: number | null
    durationMinutes4?: number | null
  }>>((acc, service) => {
    acc[service.serviceType] = {
      basePrice: service.basePrice,
      basePrice4: service.basePrice4,
      durationMinutes: service.durationMinutes,
      durationMinutes4: service.durationMinutes4,
    }
    return acc
  }, {})

  useEffect(() => {
    if (useServiceCards) return
    if (visibleServices.length === 0) return
    if (!visibleServices.some((service) => service.id === selectedService)) {
      handleServiceChange(visibleServices[0].id)
    }
  }, [selectedService, useServiceCards, visibleServices.map((service) => service.id).join(',')])
  
  // Expanded tire selection states
  const [expandedTireWorkshops, setExpandedTireWorkshops] = useState<Record<string, number>>({}) // workshopId -> number of additional tires to show (0 = collapsed, 9, 18, 27...)
  const [tireQualityFilter, setTireQualityFilter] = useState<Record<string, 'all' | 'cheap' | 'best' | 'premium'>>({}) // workshopId -> filter (internal: also 'standard' for unmatched tires)
  const [tireSortBy, setTireSortBy] = useState<Record<string, 'price' | 'brand' | 'label'>>({}) // workshopId -> sort
  
  // Ref for scrolling to search results
  const searchResultsRef = useRef<HTMLElement>(null)
  const serviceDetailsRef = useRef<HTMLDivElement>(null)
  // Shared debounce ref to prevent stale closure race conditions between effects
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  // Track if filters changed during loading — triggers re-search after loading completes
  const pendingSearchRef = useRef(false)
  const isInitialSearchRef = useRef(true)

  // AI-selected tire (from KI Berater)
  const [aiSelectedTire, setAiSelectedTire] = useState<{
    brand: string; model: string; width: string; height: string; diameter: string;
    season: string; loadIndex: string; speedIndex: string;
  } | null>(null)

  // Read AI tire params from URL (when coming from KI Berater "Werkstatt suchen")
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('ai_tire') === '1') {
      const brand = params.get('tire_brand') || ''
      const model = params.get('tire_model') || ''
      const width = params.get('tire_width') || ''
      const height = params.get('tire_height') || ''
      const diameter = params.get('tire_diameter') || ''
      const season = params.get('tire_season') || 's'
      const loadIndex = params.get('tire_load') || ''
      const speedIndex = params.get('tire_speed') || ''
      if (width && height && diameter) {
        setSelectedService('TIRE_CHANGE')
        setSelectedPackages(['with_tire_purchase', 'four_tires', 'with_disposal'])
        setTireDimensions({ width, height, diameter, loadIndex, speedIndex })
        setSelectedSeason(season)
        setAiSelectedTire({ brand, model, width, height, diameter, season, loadIndex, speedIndex })
        // Clean up URL
        window.history.replaceState({}, '', '/')
      }
    }
  }, [])
  
  // Load reviews on page load — skip if SSR data was provided
  useEffect(() => {
    if (initialReviews && initialReviews.length > 0) return // Already have SSR data
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
  
  // Update includeTires based on selected service type (Nur Montage vs Mit Reifenkauf)
  useEffect(() => {
    if (selectedService === 'TIRE_CHANGE') {
      if (selectedPackages.includes('tire_installation_only')) {
        console.log('🎯 [page.tsx] Setting includeTires=false (Nur Montage)')
        setIncludeTires(false)
      } else if (selectedPackages.includes('with_tire_purchase')) {
        console.log('🎯 [page.tsx] Setting includeTires=true (Mit Reifenkauf)')
        setIncludeTires(true)
      }
    } else if (selectedService === 'MOTORCYCLE_TIRE') {
      if (selectedPackages.includes('motorcycle_tire_installation_only')) {
        console.log('🎯 [page.tsx] Setting includeTires=false (Nur Montage - Motorrad)')
        setIncludeTires(false)
      } else if (selectedPackages.includes('motorcycle_with_tire_purchase')) {
        console.log('🎯 [page.tsx] Setting includeTires=true (Mit Reifenkauf - Motorrad)')
        setIncludeTires(true)
      }
    } else {
      // Non-tire services (WHEEL_CHANGE, TIRE_REPAIR, ALIGNMENT_BOTH, CLIMATE_SERVICE, etc.)
      console.log('🎯 [page.tsx] Setting includeTires=false (kein Reifenkauf für', selectedService, ')')
      setIncludeTires(false)
    }
  }, [selectedPackages, selectedService])

  // CRITICAL: Trigger new search when includeTires changes (if user already searched)
  // This ensures prices update immediately when switching between "Mit Reifenkauf" and "Nur Montage"
  useEffect(() => {
    if (hasSearched && customerLocation && !loading) {
      // CRITICAL: Clear any pending debounced search from [selectedPackages] effect
      // to prevent stale closure from overwriting correct results
      if (searchDebounceRef.current) {
        console.log('🚫 [includeTires Changed] Clearing pending debounced search')
        clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }
      console.log('🔄 [includeTires Changed] Re-searching with includeTires:', includeTires)
      searchWorkshops(customerLocation)
    }
  }, [includeTires])
  
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
          diameter: data.dimensions.diameter.toString(),
          loadIndex: data.dimensions.loadIndex || '',
          speedIndex: data.dimensions.speedIndex || ''
        })
        
        // For MOTORCYCLE: Always treat as mixed tires (front/rear can be different)
        // If API doesn't provide mixed data, use single dimensions for both
        if (selectedService === 'MOTORCYCLE_TIRE') {
          if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
            // Use provided mixed dimensions
            setHasMixedTires(true)
            setTireDimensionsFront(data.dimensionsFront.formatted)
            setTireDimensionsRear(data.dimensionsRear.formatted)
            console.log('🏍️ [handleSeasonChange] Motorcycle with DIFFERENT front/rear dimensions:', {
              front: data.dimensionsFront.formatted,
              rear: data.dimensionsRear.formatted
            })
          } else {
            // Use same dimensions for both (user can search both same-size tires)
            setHasMixedTires(true)
            const formatted = `${data.dimensions.width}/${data.dimensions.height} R${data.dimensions.diameter}${data.dimensions.loadIndex && data.dimensions.speedIndex ? ' ' + data.dimensions.loadIndex + data.dimensions.speedIndex : ''}`
            setTireDimensionsFront(formatted)
            setTireDimensionsRear(formatted)
            console.log('🏍️ [handleSeasonChange] Motorcycle with SAME front/rear dimensions:', formatted)
          }
        } else {
          // Set mixed tire dimensions if available (PKW only)
          if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
            setHasMixedTires(true)
            setTireDimensionsFront(data.dimensionsFront.formatted)
            setTireDimensionsRear(data.dimensionsRear.formatted)
          } else {
            setHasMixedTires(false)
            setTireDimensionsFront('')
            setTireDimensionsRear('')
          }
        }
        
        // Build override data to avoid stale state issues
        const newTireDims = {
          width: data.dimensions.width.toString(),
          height: data.dimensions.height.toString(),
          diameter: data.dimensions.diameter.toString(),
          loadIndex: data.dimensions.loadIndex || '',
          speedIndex: data.dimensions.speedIndex || ''
        }
        
        let newMixedTires: { hasMixed: boolean; front?: string; rear?: string }
        if (selectedService === 'MOTORCYCLE_TIRE') {
          if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
            newMixedTires = { hasMixed: true, front: data.dimensionsFront.formatted, rear: data.dimensionsRear.formatted }
          } else {
            const formatted = `${data.dimensions.width}/${data.dimensions.height} R${data.dimensions.diameter}${data.dimensions.loadIndex && data.dimensions.speedIndex ? ' ' + data.dimensions.loadIndex + data.dimensions.speedIndex : ''}`
            newMixedTires = { hasMixed: true, front: formatted, rear: formatted }
          }
        } else if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
          newMixedTires = { hasMixed: true, front: data.dimensionsFront.formatted, rear: data.dimensionsRear.formatted }
        } else {
          newMixedTires = { hasMixed: false }
        }
        
        // Now search workshops with the new tire dimensions passed as overrides
        // CRITICAL: Pass dimensions directly to avoid React stale state
        if (hasSearched && customerLocation) {
          searchWorkshops(
            customerLocation, 
            newSeason, 
            newMixedTires,
            undefined, // overrideSameBrand
            undefined, // overrideQuality
            undefined, // overrideFuelEfficiency
            undefined, // overrideWetGrip
            undefined, // overrideShowDOTTires
            undefined, // overrideThreePMSF
            undefined, // overrideTireBudgetMin
            undefined, // overrideTireBudgetMax
            newTireDims // overrideTireDimensions
          )
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
  
  // Auto-search after vehicle dimensions change (triggered by vehicle selection)
  // IMPORTANT: Do NOT include selectedVehicleId in dependencies!
  // Vehicle selection → fetches new dimensions → dimensions change → this triggers
  // Including selectedVehicleId would cause double-fire with stale dimensions
  useEffect(() => {
    if (
      hasSearched && 
      customerLocation && 
      selectedVehicleId
    ) {
      // Standard tires: need width + diameter
      if (selectedService === 'TIRE_CHANGE' && tireDimensions.width && tireDimensions.diameter) {
        console.log('🔄 [Auto-Search] Dimensions changed (standard), triggering search. Diameter:', tireDimensions.diameter)
        searchWorkshops(customerLocation)
      }
      // Mixed tires: need front dimensions
      else if (selectedService === 'TIRE_CHANGE' && tireDimensionsFront) {
        console.log('🔄 [Auto-Search] Dimensions changed (mixed), triggering search. Front:', tireDimensionsFront)
        searchWorkshops(customerLocation)
      }
      // Motorcycle
      else if (selectedService === 'MOTORCYCLE_TIRE' && includeTires && tireDimensionsFront && tireDimensionsRear) {
        console.log('🔄 [Auto-Search] Dimensions changed (motorcycle), triggering search')
        searchWorkshops(customerLocation)
      }
    }
  }, [tireDimensions.width, tireDimensions.diameter, tireDimensionsFront, tireDimensionsRear])
  
  // Auto-search when motorcycle tire construction filter changes
  useEffect(() => {
    if (
      hasSearched &&
      customerLocation &&
      selectedService === 'MOTORCYCLE_TIRE' &&
      tireDimensionsFront &&
      tireDimensionsRear
    ) {
      console.log('🔄 [Auto-Search] Construction filter changed to:', tireConstruction)
      searchWorkshops(customerLocation)
    }
  }, [tireConstruction])

  // Restore search from URL on page load (for browser back button)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fixedParams = new URLSearchParams(window.location.search)
      const landingPageSlug = fixedParams.get('landingPageSlug')
      const workshopId = fixedParams.get('fixedWorkshopId')
      const workshopName = fixedParams.get('fixedWorkshopName')
      const lat = fixedParams.get('fixedWorkshopLat')
      const lon = fixedParams.get('fixedWorkshopLon')

      if (landingPageSlug && workshopId && lat && lon) {
        const latitude = Number(lat)
        const longitude = Number(lon)
        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
          setFixedWorkshopContext({
            landingPageSlug,
            workshopId,
            workshopName: workshopName || 'Werkstatt',
            latitude,
            longitude,
          })
        }
      } else if (!initialFixedWorkshopContext) {
        setFixedWorkshopContext(null)
      }

      // First try to restore from sessionStorage (back navigation from workshop)
      const savedSearchState = sessionStorage.getItem('lastSearchState')
      if (savedSearchState) {
        try {
          const searchState = JSON.parse(savedSearchState)
          // Only restore if saved within last 30 minutes
          if (Date.now() - searchState.timestamp < 30 * 60 * 1000) {
            console.log('🔍 [Back Navigation] Restoring workshops and additional state from sessionStorage...', searchState)
            setWorkshops(searchState.workshops || [])
            setHasSearched(searchState.hasSearched || false)
            // selectedService, postalCode, radiusKm, selectedVehicleId, hasMixedTires, selectedPackages are already restored in initial state
            setCustomerLocation(searchState.customerLocation || null)
            setTireDimensions(searchState.tireDimensions || { width: '', height: '', diameter: '', loadIndex: '', speedIndex: '' })
            if (searchState.tireDimensionsFront) setTireDimensionsFront(searchState.tireDimensionsFront)
            if (searchState.tireDimensionsRear) setTireDimensionsRear(searchState.tireDimensionsRear)
            if (searchState.hasMixedTires !== undefined) setHasMixedTires(searchState.hasMixedTires)
            setIncludeTires(searchState.includeTires !== undefined ? searchState.includeTires : true)
            if (searchState.fixedWorkshopContext) {
              setFixedWorkshopContext(searchState.fixedWorkshopContext)
            }
            // Restore scroll position (only on main homepage, not on landing pages)
            if (searchState.scrollPosition && !hideHeroHeader) {
              setTimeout(() => window.scrollTo(0, searchState.scrollPosition), 100)
            }
            console.log('✅ [Back Navigation] Search restored successfully (Service:', searchState.selectedService, ', Packages:', searchState.selectedPackages, ')')
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
      const savedLandingPageSlug = searchParams.get('landingPageSlug')
      const savedFixedWorkshopId = searchParams.get('fixedWorkshopId')
      const savedFixedWorkshopName = searchParams.get('fixedWorkshopName')
      const savedFixedWorkshopLat = searchParams.get('fixedWorkshopLat')
      const savedFixedWorkshopLon = searchParams.get('fixedWorkshopLon')

      if (savedLandingPageSlug && savedFixedWorkshopId && savedFixedWorkshopLat && savedFixedWorkshopLon) {
        const latitude = Number(savedFixedWorkshopLat)
        const longitude = Number(savedFixedWorkshopLon)
        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
          setFixedWorkshopContext({
            landingPageSlug: savedLandingPageSlug,
            workshopId: savedFixedWorkshopId,
            workshopName: savedFixedWorkshopName || 'Werkstatt',
            latitude,
            longitude,
          })
        }
      }

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
          // Restore scroll position (only on main homepage, not on landing pages)
          if (savedScroll && !hideHeroHeader) {
            setTimeout(() => window.scrollTo(0, Number(savedScroll)), 100)
          }
          console.log('✅ [Hard Refresh] Search restored successfully, workshops:', parsedWorkshops.length)
        } catch (e) {
          console.error('Error restoring search:', e)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!fixedWorkshopContext) return
    if (hasSearched || loading) return

    const location = {
      lat: fixedWorkshopContext.latitude,
      lon: fixedWorkshopContext.longitude,
    }

    setCustomerLocation(location)
    setHasSearched(true)

    // On service card landing pages (no service selected yet), skip initial search
    if (!selectedService) {
      return
    }

    setLoading(true)
    setError(null)
    setWorkshops([])
    searchWorkshops(location)
  }, [fixedWorkshopContext])

  // Listen for back navigation - restore filters when returning from workshop page
  // CRITICAL: Disable visibilitychange restore completely - causes more problems than it solves
  // User can simply re-search if they navigate back
  // This prevents old sessionStorage data from appearing after tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      // DISABLED: Restoration on tab focus causes stale data issues
      // Only restore on actual page navigation via browser back button
      console.log('⏭️ [Page Visible] Visibility changed, but restoration disabled')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
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
  
  // Favorites filter
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [animatingFavorite, setAnimatingFavorite] = useState<string | null>(null)

  // New filters
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [openingHours, setOpeningHours] = useState<string[]>([])
  const [hasMultipleServices, setHasMultipleServices] = useState(false)

  // Geocode postal code with rate limiting and retry logic
  const geocodePostalCode = async (input: string, retryCount = 0): Promise<any> => {
    try {
      // Use backend geocoding API to avoid CORS issues
      const url = `/api/geocode?input=${encodeURIComponent(input)}&retry=${retryCount}`
      
      const response = await fetch(url)

      // Handle 425 (Too Early) with retry
      if (response.status === 425 && retryCount < 2) {
        console.warn(`⏱️ Geocoding 425 (Too Early), retry ${retryCount + 1}/2`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        return geocodePostalCode(input, retryCount + 1)
      }

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Geocoding: Keine Ergebnisse gefunden')
          return null
        }
        throw new Error(`Geocoding API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data && data.lat && data.lon) {
        return {
          lat: data.lat,
          lon: data.lon
        }
      }
      return null
    } catch (err) {
      console.error('Geocoding error:', err)
      return null
    }
  }

  // Silently calculate distance from user to fixed workshop on LP pages
  useEffect(() => {
    if (isWorkshopFixed && fixedWorkshopContext && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const toRad = (deg: number) => deg * (Math.PI / 180)
          const R = 6371
          const dLat = toRad(fixedWorkshopContext.latitude - position.coords.latitude)
          const dLon = toRad(fixedWorkshopContext.longitude - position.coords.longitude)
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(position.coords.latitude)) *
              Math.cos(toRad(fixedWorkshopContext.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          setUserDistanceToFixed(Math.round(dist * 10) / 10)
        },
        () => { /* permission denied – keep null */ },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      )
    }
  }, [isWorkshopFixed, fixedWorkshopContext?.workshopId])

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

  // Toggle favorite with animation
  const toggleFavorite = (workshopId: string) => {
    // Trigger bounce animation
    setAnimatingFavorite(workshopId)
    setTimeout(() => setAnimatingFavorite(null), 300)

    setFavorites(prev => {
      const newFavorites = prev.includes(workshopId)
        ? prev.filter(id => id !== workshopId)
        : [...prev, workshopId]
      
      // Save to localStorage
      localStorage.setItem('workshop_favorites', JSON.stringify(newFavorites))
      
      // If removing last favorite while filter is active, disable filter
      if (newFavorites.length === 0 && showOnlyFavorites) {
        setShowOnlyFavorites(false)
      }
      
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
          dimensionsRear: data.dimensionsRear,
          vehicleType: vehicle.vehicleType
        })

        // For MOTORCYCLE: Always treat as mixed tires (front/rear can be different)
        // If API doesn't provide mixed data, use single dimensions for both
        if (vehicle.vehicleType === 'MOTORCYCLE') {
          if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
            // Use provided mixed dimensions
            setHasMixedTires(true)
            setTireDimensionsFront(data.dimensionsFront.formatted)
            setTireDimensionsRear(data.dimensionsRear.formatted)
            console.log('🏍️ [handleVehicleSelect] Motorcycle with DIFFERENT front/rear dimensions:', {
              front: data.dimensionsFront.formatted,
              rear: data.dimensionsRear.formatted
            })
          } else {
            // Use same dimensions for both
            setHasMixedTires(true)
            const formatted = `${data.dimensions.width}/${data.dimensions.height} R${data.dimensions.diameter}${data.dimensions.loadIndex && data.dimensions.speedIndex ? ' ' + data.dimensions.loadIndex + data.dimensions.speedIndex : ''}`
            setTireDimensionsFront(formatted)
            setTireDimensionsRear(formatted)
            console.log('🏍️ [handleVehicleSelect] Motorcycle with SAME front/rear dimensions:', formatted)
          }
          console.log('✅ [handleVehicleSelect] Motorcycle: keeping existing packages (both/front/rear)')
        } else if (selectedService === 'TIRE_CHANGE') {
          // CRITICAL: Only modify packages for TIRE_CHANGE service
          // Other services (TIRE_REPAIR, WHEEL_CHANGE, ALIGNMENT, etc.) keep their own packages
          // Set mixed tire dimensions if available (PKW only)
          if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
            console.log('🔄 [handleVehicleSelect] Mixed tires detected:', {
              front: data.dimensionsFront.formatted,
              rear: data.dimensionsRear.formatted,
              currentPackages: selectedPackages,
              vehicleType: vehicle.vehicleType
            })
            setHasMixedTires(true)
            setTireDimensionsFront(data.dimensionsFront.formatted)
            setTireDimensionsRear(data.dimensionsRear.formatted)
            
            // CRITICAL: Only change packages for PKW vehicles
            // Keep existing service-art marker (with_tire_purchase/tire_installation_only) and with_disposal
            if (vehicle.vehicleType !== 'MOTORCYCLE') {
              const serviceArtMarker = selectedPackages.find(p => ['with_tire_purchase', 'tire_installation_only'].includes(p)) || 'tire_installation_only'
              const hasDisposal = selectedPackages.includes('with_disposal')
              const newPackages = [serviceArtMarker, 'mixed_four_tires']
              if (hasDisposal) newPackages.push('with_disposal')
              console.log('🧹 [handleVehicleSelect] PKW mixed tires: setting', newPackages)
              setSelectedPackages(newPackages)
            }
          } else {
            console.log('✅ [handleVehicleSelect] Standard tires (no mixed)')
            setHasMixedTires(false)
            setTireDimensionsFront('')
            setTireDimensionsRear('')
            
            // Set standard package if none selected (PKW only)
            if (vehicle.vehicleType !== 'MOTORCYCLE' && !selectedPackages.some(p => ['two_tires', 'four_tires', 'with_tire_purchase', 'tire_installation_only'].includes(p))) {
              const hasDisposal = selectedPackages.includes('with_disposal')
              const newPackages = ['with_tire_purchase', 'four_tires']
              if (hasDisposal) newPackages.push('with_disposal')
              console.log('🧹 [handleVehicleSelect] PKW standard: setting', newPackages)
              setSelectedPackages(newPackages)
            }
          }
        } else {
          // For non-TIRE_CHANGE services (TIRE_REPAIR, WHEEL_CHANGE, ALIGNMENT, etc.)
          // Only update tire dimension state, do NOT modify selectedPackages
          console.log(`✅ [handleVehicleSelect] Service ${selectedService}: keeping existing packages`, selectedPackages)
          if (data.hasMixedTires && data.dimensionsFront && data.dimensionsRear) {
            setHasMixedTires(true)
            setTireDimensionsFront(data.dimensionsFront.formatted)
            setTireDimensionsRear(data.dimensionsRear.formatted)
          } else {
            setHasMixedTires(false)
            setTireDimensionsFront('')
            setTireDimensionsRear('')
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
    overrideQuality?: string, // Override for quality filter (premium/quality/budget)
    // Override for EU label filters to avoid async state issues
    overrideFuelEfficiency?: string,
    overrideWetGrip?: string,
    overrideShowDOTTires?: boolean,
    overrideThreePMSF?: boolean,
    overrideTireBudgetMin?: number,
    overrideTireBudgetMax?: number,
    // Override for standard (non-mixed) tire dimensions to avoid stale state
    overrideTireDimensions?: { width: string; height: string; diameter: string; loadIndex?: string; speedIndex?: string },
    overrideSameModel?: boolean // Override for Achs-Set (motorcycle) checkbox
  ) => {
    // Set loading state immediately so UI shows spinner instead of stale data
    setLoading(true)
    
    const seasonToUse = overrideSeason !== undefined ? overrideSeason : selectedSeason
    const mixedTiresData = overrideMixedTires || { hasMixed: hasMixedTires, front: tireDimensionsFront, rear: tireDimensionsRear }
    const tireDimsToUse = overrideTireDimensions || tireDimensions
    const sameBrandValue = overrideSameBrand !== undefined ? overrideSameBrand : requireSameBrand
    const sameModelValue = overrideSameModel !== undefined ? overrideSameModel : requireSameModel
    const qualityValue = overrideQuality !== undefined ? overrideQuality : tireQuality
    const fuelEfficiencyValue = overrideFuelEfficiency !== undefined ? overrideFuelEfficiency : fuelEfficiency
    const wetGripValue = overrideWetGrip !== undefined ? overrideWetGrip : wetGrip
    const showDOTTiresValue = overrideShowDOTTires !== undefined ? overrideShowDOTTires : showDOTTires
    const threePMSFValue = overrideThreePMSF !== undefined ? overrideThreePMSF : require3PMSF
    const tireBudgetMinValue = overrideTireBudgetMin !== undefined ? overrideTireBudgetMin : tireBudgetMin
    const tireBudgetMaxValue = overrideTireBudgetMax !== undefined ? overrideTireBudgetMax : tireBudgetMax
    
    // Motorcycles with "Mit Reifenkauf" but no vehicle selected: proceed without tires
    // API auto-corrects includeTires to false when dimensions are missing
    // Frontend shows yellow hint on workshop cards to select motorcycle
    
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
      tireDimensions: tireDimsToUse,
      season: seasonToUse
    })
    
    try {
      // Use motorcycle-search endpoint for MOTORCYCLE_TIRE service
      const endpoint = selectedService === 'MOTORCYCLE_TIRE' 
        ? '/api/customer/direct-booking/motorcycle-search'
        : '/api/customer/direct-booking/search'
      
      console.log('📍 [searchWorkshops] Using endpoint:', endpoint)
      
      // Build request body based on service type
      let requestBody: any
      
      if (selectedService === 'MOTORCYCLE_TIRE') {
        // Motorcycle-specific payload
        // Parse front dimensions (format: "120/70 R17 58W" or "120/70 R17")
        const parsedFront = mixedTiresData.front ? (() => {
          const match = mixedTiresData.front.match(/^(\d+)\/(\d+)\s*R(\d+)(?:\s+\d+[A-Z]+)?$/);
          const parsed = match ? { width: parseInt(match[1]), height: parseInt(match[2]), diameter: parseInt(match[3]) } : undefined;
          console.log('🏍️ [searchWorkshops] Parsing FRONT motorcycle dimensions:', mixedTiresData.front, '→', parsed);
          return parsed;
        })() : undefined;
        
        // Parse rear dimensions
        const parsedRear = mixedTiresData.rear ? (() => {
          const match = mixedTiresData.rear.match(/^(\d+)\/(\d+)\s*R(\d+)(?:\s+\d+[A-Z]+)?$/);
          const parsed = match ? { width: parseInt(match[1]), height: parseInt(match[2]), diameter: parseInt(match[3]) } : undefined;
          console.log('🏍️ [searchWorkshops] Parsing REAR motorcycle dimensions:', mixedTiresData.rear, '→', parsed);
          return parsed;
        })() : undefined;
        
        // Extract disposal and position packages
        const hasDisposal = selectedPackages.includes('with_disposal')
        const positionPackages = selectedPackages.filter(p => ['front', 'rear', 'both'].includes(p))
        const serviceArtPackages = selectedPackages.filter(p => ['motorcycle_with_tire_purchase', 'motorcycle_tire_installation_only'].includes(p))
        
        // Combine service-art + position (no need to combine with disposal in packageTypes)
        const finalPackages = [...serviceArtPackages, ...positionPackages]
        
        console.log('🏍️ [searchWorkshops] Package extraction:', {
          original: selectedPackages,
          hasDisposal,
          positionPackages,
          serviceArtPackages,
          final: finalPackages
        })
        
        requestBody = {
          packageTypes: finalPackages,
          radiusKm,
          customerLat: location.lat,
          customerLon: location.lon,
          forcedWorkshopId: fixedWorkshopContext?.workshopId,
          forcedWorkshopSlug: fixedWorkshopContext?.landingPageSlug,
          includeTires: includeTires, // Now controlled by service-art filter
          includeDisposal: hasDisposal, // Send disposal flag separately
          tireDimensionsFront: parsedFront,
          tireDimensionsRear: parsedRear,
          tireFilters: (includeTires && parsedFront && parsedRear) ? {
            minPrice: tireBudgetMin,
            maxPrice: tireBudgetMax,
            seasons: selectedSeason ? [selectedSeason] : [],
            quality: tireQuality || undefined,
            minFuelEfficiency: fuelEfficiency || undefined,
            minWetGrip: wetGrip || undefined,
            threePMSF: require3PMSF || undefined,
            showDOTTires: showDOTTires,
            construction: tireConstruction || undefined
          } : undefined,
          // Achs-Set: only show workshops where front+rear share brand AND model
          sameModel: includeTires && parsedFront && parsedRear && selectedPackages.includes('both') ? sameModelValue : false
        }
        
        console.log('🏍️ [searchWorkshops] Motorcycle payload:', {
          packageTypes: finalPackages,
          includeTires,
          hasDimensions: !!parsedFront || !!parsedRear,
          front: parsedFront,
          rear: parsedRear,
          includeDisposal: hasDisposal
        })
      } else {
        // PKW and other services payload
        // CRITICAL: Filter out frontend-only package markers that don't exist in DB
        // 'tire_installation_only', 'with_tire_purchase', 'motorcycle_tire_installation_only', 'motorcycle_with_tire_purchase'
        // These are only used to determine includeTires (true/false), not actual DB package types
        const frontendMarkers = ['tire_installation_only', 'with_tire_purchase', 'motorcycle_tire_installation_only', 'motorcycle_with_tire_purchase']
        const dbPackageTypes = selectedPackages.filter(p => !frontendMarkers.includes(p))
        
        console.log('🔍 [searchWorkshops] Filtering frontend markers:', {
          original: selectedPackages,
          filtered: dbPackageTypes
        })
        
        requestBody = {
          serviceType: selectedService,
          packageTypes: dbPackageTypes,
          radiusKm,
          customerLat: location.lat,
          customerLon: location.lon,
          forcedWorkshopId: fixedWorkshopContext?.workshopId,
          forcedWorkshopSlug: fixedWorkshopContext?.landingPageSlug,
          // Tire search parameters (only for TIRE_CHANGE service)
          includeTires: selectedService === 'TIRE_CHANGE' ? includeTires : false,
          // ALWAYS send tireDimensions for TIRE_CHANGE (needed for rim-size pricing even without tire purchase)
          tireDimensions: (selectedService === 'TIRE_CHANGE' && !mixedTiresData.hasMixed) ? tireDimsToUse : undefined,
          // Mixed tire dimensions — ALWAYS send for TIRE_CHANGE (needed for rim-size pricing)
          tireDimensionsFront: (selectedService === 'TIRE_CHANGE' && mixedTiresData.hasMixed && mixedTiresData.front) ? 
            (() => {
              // Regex accepts optional load/speed index: "245/35 R21" or "245/35 R21 96Y"
              const match = mixedTiresData.front.match(/^(\d+)\/(\d+)\s*R(\d+)(?:\s+\d+[A-Z]+)?$/);
              const parsed = match ? { width: parseInt(match[1]), height: parseInt(match[2]), diameter: parseInt(match[3]) } : undefined;
              console.log('🎯 [searchWorkshops] Parsing front dimensions:', mixedTiresData.front, '→', parsed);
              return parsed;
            })() : undefined,
          tireDimensionsRear: (selectedService === 'TIRE_CHANGE' && mixedTiresData.hasMixed && mixedTiresData.rear) ? 
            (() => {
              // Regex accepts optional load/speed index: "275/30 R21" or "275/30 R21 98Y"
              const match = mixedTiresData.rear.match(/^(\d+)\/(\d+)\s*R(\d+)(?:\s+\d+[A-Z]+)?$/);
              const parsed = match ? { width: parseInt(match[1]), height: parseInt(match[2]), diameter: parseInt(match[3]) } : undefined;
              console.log('🎯 [searchWorkshops] Parsing rear dimensions:', mixedTiresData.rear, '→', parsed);
              return parsed;
            })() : undefined,
          tireFilters: (selectedService === 'TIRE_CHANGE' && includeTires) ? {
            minPrice: tireBudgetMinValue,
            maxPrice: tireBudgetMaxValue,
            seasons: seasonToUse ? [seasonToUse] : [],
            quality: qualityValue || undefined,
            minFuelEfficiency: fuelEfficiencyValue || undefined,
            minWetGrip: wetGripValue || undefined,
            threePMSF: threePMSFValue || undefined,
            showDOTTires: showDOTTiresValue
          } : undefined,
          // Same brand filter (only for mixed 4 tires)
          sameBrand: (selectedService === 'TIRE_CHANGE' && includeTires && mixedTiresData.hasMixed && selectedPackages.includes('mixed_four_tires')) ? sameBrandValue : false
        }
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
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
        
        // Reset brand filter when new search results arrive (available brands may have changed)
        setSelectedBrandFilter('')
        
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
        // Use retry to handle case where section hasn't rendered yet
        const scrollToResults = (retries = 5) => {
          if (searchResultsRef.current) {
            searchResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } else if (retries > 0) {
            setTimeout(() => scrollToResults(retries - 1), 200)
          }
        }
        setTimeout(() => scrollToResults(), 100)
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
      // If filters changed during loading, trigger a re-search
      if (pendingSearchRef.current) {
        pendingSearchRef.current = false
        console.log('🔄 [searchWorkshops] Filters changed during loading — triggering re-search')
        setTimeout(() => {
          searchWorkshops(location)
        }, 100)
      }
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!isWorkshopFixed && !postalCode && !useGeolocation) {
      alert('Bitte PLZ oder Ort eingeben oder Standort aktivieren')
      return
    }
    
    // No tire dimension validation - user can search first, then select vehicle in filter
    // Motorcycle + "Mit Reifenkauf" without vehicle: search proceeds, shows workshops with hint to select motorcycle
    
    setLoading(true)
    setError(null)
    setHasSearched(true)
    setWorkshops([]) // Clear previous results

    try {
      let location = customerLocation

      if (isWorkshopFixed && fixedWorkshopContext) {
        location = {
          lat: fixedWorkshopContext.latitude,
          lon: fixedWorkshopContext.longitude,
        }
        setCustomerLocation(location)
        await searchWorkshops(location)
        return
      }

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
      // If loading, mark that a re-search is needed once loading finishes
      if (loading && hasSearched && customerLocation) {
        console.log('⏳ [useEffect] Filter changed during loading — will re-search after load')
        pendingSearchRef.current = true
      } else {
        console.log('⏭️  [useEffect] Skipping search:', { loading, hasSearched, customerLocation: !!customerLocation })
      }
      return
    }
    
    console.log('⏱️  [useEffect] Debouncing search for 300ms...')
    // Use shared ref so [includeTires] effect can cancel this if it fires first
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null
      console.log('🔎 [useEffect] Executing re-search with packages:', selectedPackages)
      searchWorkshops(customerLocation)
    }, 300)
    return () => {
      console.log('🚫 [useEffect] Debounce cleared')
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }
    }
  }, [selectedPackages])

  // Update sessionStorage whenever critical search parameters change
  // CRITICAL FIX: Use 'workshops' instead of 'workshops.length' to capture content changes
  // Only save when NOT loading to avoid saving incomplete/stale data
  useEffect(() => {
    if (hasSearched && workshops.length > 0 && !loading && typeof window !== 'undefined') {
      const searchState = {
        workshops,
        hasSearched,
        selectedService,
        postalCode,
        radiusKm,
        customerLocation,
        selectedVehicleId,
        tireDimensions,
        tireDimensionsFront,
        tireDimensionsRear,
        selectedPackages,
        includeTires,
        hasMixedTires,
        fixedWorkshopContext,
        scrollPosition: window.scrollY,
        timestamp: Date.now()
      }
      sessionStorage.setItem('lastSearchState', JSON.stringify(searchState))
      console.log('💾 [sessionStorage] Updated with current state:', { 
        workshopsCount: workshops.length, 
        selectedPackages, 
        includeTires,
        loading 
      })
    }
  }, [selectedPackages, selectedService, selectedVehicleId, hasMixedTires, includeTires, hasSearched, workshops, loading, fixedWorkshopContext])

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
    
    // Favorites filter
    if (showOnlyFavorites && !favorites.includes(w.id)) return false
    
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
      hasDisposal: (selectedService === 'TIRE_CHANGE' || selectedService === 'MOTORCYCLE_TIRE') && selectedPackages.includes('with_disposal'),
      disposalPrice: (selectedService === 'TIRE_CHANGE' || selectedService === 'MOTORCYCLE_TIRE') ? (workshop.disposalFeeApplied || 0) : 0,
      hasRunflat: selectedPackages.includes('runflat'),
      runflatPrice: workshop.runFlatSurchargeApplied || 0,
      // Tire count for per-tire calculations
      tireCount: workshop.isMixedTires
        ? ((selectedFrontRec ? 1 : 0) + (selectedRearRec ? 1 : 0))
        : (selectedPackages.includes('two_tires') ? 2 :
           selectedPackages.includes('four_tires') ? 4 : 0),
      // Selected vehicle
      selectedVehicle: customerVehicles.find(v => v.id === selectedVehicleId) || null
    }
    
    // Save tire and service data to sessionStorage for workshop page
    // Save if has tires OR has disposal/runflat flags OR is TIRE_CHANGE "Nur Montage" (needed for pricing on workshop page)
    const isTireRelatedService = selectedService === 'TIRE_CHANGE' || selectedService === 'MOTORCYCLE_TIRE'
    if (tireBookingData.hasTires || tireBookingData.hasDisposal || tireBookingData.hasRunflat || isTireRelatedService) {
      sessionStorage.setItem('tireBookingData', JSON.stringify(tireBookingData))
    } else {
      // Clear stale tire data for non-tire services (WHEEL_CHANGE, etc.)
      // Prevents old disposal/runflat flags from TIRE_CHANGE being carried over
      sessionStorage.removeItem('tireBookingData')
    }
    
    // Also save service data separately for non-tire services
    const serviceData = {
      serviceName: selectedService,
      selectedPackages: selectedPackages,
      servicePrice: workshop.totalPrice || 0,
      selectedVehicleId: selectedVehicleId || null,
      wheelChangeBreakdown: workshop.wheelChangeBreakdown || null
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
      fixedWorkshopContext,
      scrollPosition: window.scrollY,
      timestamp: Date.now()
    }
    sessionStorage.setItem('lastSearchState', JSON.stringify(searchState))
    
    // Navigate to workshop detail page with basic info (prices loaded from DB)
    const params = new URLSearchParams({
      name: workshop.name,
      city: workshop.city || '',
      distance: (workshop.distance ?? 0).toString(),
      rating: (workshop.rating ?? 0).toString(),
      reviewCount: (workshop.reviewCount ?? 0).toString(),
      duration: workshop.estimatedDuration?.toString() || '60',
      service: selectedService,
      t: Date.now().toString(), // Force page reload on filter change
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
      const premiumBrandsPKW = ['Michelin', 'Continental', 'Goodyear', 'Bridgestone', 'Pirelli', 'Dunlop']
      const premiumBrandsMotorrad = ['Michelin', 'Continental', 'Pirelli', 'Bridgestone', 'Dunlop', 'Metzeler', 'Heidenau']
      const premiumBrands = selectedService === 'MOTORCYCLE_TIRE' ? premiumBrandsMotorrad : premiumBrandsPKW
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
    
    // Filter by brand if selected
    if (selectedBrandFilter) {
      filtered = filtered.filter((tire: any) => {
        const tireBrand = tire.brand || tire.tire?.brand || ''
        return tireBrand.toLowerCase() === selectedBrandFilter.toLowerCase()
      })
      console.log(`🏷️ [Filter ${workshopId}] Brand filter "${selectedBrandFilter}": ${filtered.length} tires`)
    }
    
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

  // Compute available brands from all workshops' tire recommendations
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>()
    workshops.forEach((w: any) => {
      // Standard tire recommendations
      w.tireRecommendations?.forEach((t: any) => {
        const brand = t.brand || t.tire?.brand
        if (brand) brandSet.add(brand)
      })
      // Mixed/Motorcycle front recommendations
      w.tireFrontRecommendations?.forEach((t: any) => {
        const brand = t.brand || t.tire?.brand
        if (brand) brandSet.add(brand)
      })
      // Mixed/Motorcycle rear recommendations
      w.tireRearRecommendations?.forEach((t: any) => {
        const brand = t.brand || t.tire?.brand
        if (brand) brandSet.add(brand)
      })
      // Brand options (for mixed same-brand)
      w.brandOptions?.forEach((opt: any) => {
        if (opt.brand) brandSet.add(opt.brand)
      })
    })
    return Array.from(brandSet).sort((a, b) => a.localeCompare(b))
  }, [workshops])

  return (
    <div className={useServiceCards ? 'bg-transparent' : 'min-h-screen bg-white'}>
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
      
      {/* Live Chat Widget - hide on workshop landing pages */}
      {!useServiceCards && <LiveChat />}
      
      {/* Top Navigation - Blue like current homepage */}
      {!useServiceCards && (
      <nav className="bg-primary-600 sticky top-0 z-50 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src="/logos/B24_Logo_weiss.png" alt="Bereifung24" width={160} height={40} className="h-10 w-auto object-contain" />
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
                    {session.user?.image ? (
                      <img src={session.user.image} alt="" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
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
                        ) : /* Freelancer users - Startseite, Dashboard, Abmelden */
                        session.user?.role === 'FREELANCER' ? (
                          <>
                            <button
                              onClick={() => {
                                setShowUserMenu(false)
                                window.location.href = '/'
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                            >
                              <Star className="w-4 h-4" />
                              Startseite
                            </button>
                            <Link
                              href="/freelancer"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
                            </Link>
                          </>
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
                            <button
                              onClick={() => {
                                // Clear all booking-related sessionStorage
                                sessionStorage.removeItem('tireBookingData')
                                sessionStorage.removeItem('serviceBookingData')
                                sessionStorage.removeItem('bookingData')
                                sessionStorage.removeItem('lastSearchState')
                                sessionStorage.removeItem('additionalServices')
                                setShowUserMenu(false)
                                window.location.href = '/'
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                            >
                              <Star className="w-4 h-4" />
                              Startseite
                            </button>
                            
                            <Link
                              href="/dashboard/customer"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
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
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Hero Section - Booking.com Style */}
      <section className={`relative overflow-hidden ${useServiceCards ? 'bg-transparent text-gray-900 pt-0 pb-0' : hideHeroHeader ? 'bg-white text-gray-900 pt-4 pb-8' : 'text-white pt-16 pb-40'}`}
        style={!useServiceCards && !hideHeroHeader ? { backgroundImage: 'url(/bereifung24-hero-bg.webp)', backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {/* Hero Overlay for readability */}
        {!hideHeroHeader && (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900/70 via-gray-900/55 to-primary-900/70" />
        )}

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          {!hideHeroHeader && (
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                Reifenservice zum Festpreis – in 2 Minuten gebucht
              </h2>
              <p className="text-xl text-gray-100" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                Vergleiche geprüfte Werkstätten in deiner Nähe und buche direkt online
              </p>
            </div>
          )}

          {/* Search Card - Improved UX with service cards in landing mode */}
          <div className="max-w-5xl mx-auto">
            {useServiceCards ? (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleServices.map((service) => {
                  const Icon = service.icon
                  const isActive = selectedService === service.id
                  const pricing = serviceCardMap[service.id]
                  const displayPrice = pricing?.basePrice

                  return (
                    <div
                      key={service.id}
                      className={`rounded-xl border p-4 transition-all bg-white ${
                        isActive
                          ? 'border-primary-500 shadow-md ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-primary-600" />
                            <h3 className="text-lg font-bold text-gray-900">{service.label}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        </div>
                        {isActive && (
                          <span className="text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-2 py-1 rounded-full">
                            Ausgewählt
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Preis</p>
                          <p className="text-2xl font-extrabold text-primary-600">
                            {typeof displayPrice === 'number' && displayPrice > 0 ? `ab ${displayPrice.toFixed(2).replace('.', ',')} €` : 'Preis auf Anfrage'}
                          </p>
                        </div>
                        {pricing?.durationMinutes && (
                          <p className="text-sm text-gray-500">~ {pricing.durationMinutes} Min.</p>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            handleServiceChange(service.id)
                            setTimeout(() => {
                              serviceDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }, 100)
                          }}
                          className="w-full h-11 px-5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg font-bold transition-all"
                        >
                          Jetzt buchen
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mb-3 overflow-x-auto md:overflow-visible scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-transparent">
                <div className="flex gap-2 min-w-max md:min-w-0 md:justify-center pb-2">
                  {visibleServices.map((service) => {
                    const Icon = service.icon
                    const isActive = selectedService === service.id
                    return (
                      <button
                        key={service.id}
                        onClick={() => handleServiceChange(service.id)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all min-h-[48px] ${
                          isActive
                            ? 'bg-white text-primary-600 shadow-lg ring-2 ring-primary-500'
                            : hideHeroHeader
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            )}

            {!useServiceCards && (
            <>
            {/* AI-selected tire info banner */}
            {aiSelectedTire && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3 flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-900">KI-Empfehlung ausgewählt</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    <span className="font-bold">{aiSelectedTire.brand} {aiSelectedTire.model}</span>
                    {' · '}{aiSelectedTire.width}/{aiSelectedTire.height} R{aiSelectedTire.diameter}
                    {' · '}{aiSelectedTire.season === 's' ? 'Sommer' : aiSelectedTire.season === 'w' ? 'Winter' : 'Ganzjahr'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Gib deine PLZ ein und suche eine Werkstatt mit diesem Reifen!</p>
                </div>
                <button
                  onClick={() => setAiSelectedTire(null)}
                  className="p-1 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                  title="Auswahl entfernen"
                >
                  <X className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            )}
            <div ref={serviceDetailsRef} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div className="flex flex-col md:flex-row gap-4">

                {/* Location Input with Label and Integrated GPS */}
                {!isWorkshopFixed && (
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
                )}

                {/* Radius Dropdown - Smaller and Less Prominent */}
                {!isWorkshopFixed && (
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
                )}

                {/* Search Button */}
                {!useServiceCards && (
                <div className="w-full md:w-auto md:pt-6">
                  <button
                    onClick={handleSearch}
                    className="shimmer-btn w-full md:w-auto h-14 px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    style={{ boxShadow: '0 8px 25px rgba(0,112,186,0.3)' }}
                  >
                    <Search className="w-5 h-5" />
                    <span className="hidden lg:inline">{isWorkshopFixed ? 'Jetzt bei dieser Werkstatt buchen' : 'Jetzt Festpreise vergleichen'}</span>
                    <span className="lg:hidden">{isWorkshopFixed ? 'Jetzt buchen' : 'Vergleichen'}</span>
                  </button>
                </div>
                )}
              </div>
            </div>
            </>
            )}
            {!useServiceCards && (
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
            )}

            {/* Trust Badges */}
            {!useServiceCards && (
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
            )}

            {/* App Stores */}
            {!useServiceCards && (
            <div className="max-w-5xl mx-auto mt-5 flex flex-col items-center justify-center gap-3">
              <span className="text-primary-100 text-xs font-medium uppercase tracking-wider text-center">
                Auch als App verfügbar
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://apps.apple.com/de/app/bereifung24/id6761443270"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Bereifung24 im App Store laden"
                  className="transition-transform hover:scale-105"
                >
                  <img
                    src="/logos/app-store-badge.svg"
                    alt="Download im App Store"
                    height={48}
                    className="h-12 w-auto"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=de.bereifung24.bereifung24_app"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Bereifung24 bei Google Play laden"
                  className="transition-transform hover:scale-105"
                >
                  <img
                    src="/logos/google-play-badge.png"
                    alt="Jetzt bei Google Play"
                    height={70}
                    className="h-[70px] w-auto -my-3"
                  />
                </a>
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {hasSearched && (
        <section ref={searchResultsRef} className="py-8 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={isWorkshopFixed ? 'max-w-5xl mx-auto flex flex-col gap-4' : 'flex flex-col lg:flex-row gap-6'}>
              {/* Filter: Sidebar (homepage) or Horizontal Bar (LP) */}
              {(workshops.length > 0 || (hasSearched && !loading)) && (
                <div className={isWorkshopFixed ? 'w-full' : 'lg:w-80 flex-shrink-0'}>
                  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${!isWorkshopFixed ? 'sticky top-24 z-40' : ''}`}>
                    {/* Filter Header */}
                    <div className={`p-4 border-b border-gray-200 flex items-center justify-between ${isWorkshopFixed ? 'lg:hidden' : ''}`}>
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
                    <div className={`${showFilters ? 'block' : 'hidden lg:block'} ${isWorkshopFixed ? 'lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y' : 'divide-y'} divide-gray-200`}>

                      {/* === GENERAL FILTERS (for all services) === */}

                      {/* Fahrzeug wählen (for all services) */}
                      <div className="p-5 border-b border-gray-200 lg:border-b-0">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          {selectedService === 'MOTORCYCLE_TIRE' ? '🏍️ Motorrad wählen' : '🚙 Fahrzeug wählen'}
                        </h4>
                        {/* Special hint for motorcycle "Nur Montage" */}
                        {selectedService === 'MOTORCYCLE_TIRE' && selectedPackages.includes('motorcycle_tire_installation_only') && (
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                            💡 <strong>Optional:</strong> Wählen Sie Ihr Motorrad für genauere Preise und Details.
                          </div>
                        )}
                        {/* Special hint for motorcycle "Mit Reifenkauf" */}
                        {selectedService === 'MOTORCYCLE_TIRE' && selectedPackages.includes('motorcycle_with_tire_purchase') && !selectedVehicleId && (
                          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                            ⚠️ <strong>Erforderlich:</strong> Bitte wählen Sie Ihr Motorrad für die Reifensuche aus.
                          </div>
                        )}
                          {session ? (
                            <div className="space-y-2">
                              <select
                                value={selectedVehicleId}
                                onChange={(e) => handleVehicleSelect(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                              >
                                <option value="">{selectedService === 'MOTORCYCLE_TIRE' ? 'Motorrad auswählen...' : 'Fahrzeug auswählen...'}</option>
                                {(() => {
                                  // Filter vehicles based on selected service
                                  let filteredVehicles = customerVehicles
                                  
                                  if (selectedService === 'TIRE_CHANGE' || selectedService === 'WHEEL_CHANGE') {
                                    // For car tire/wheel services: show only cars and trailers (no motorcycles)
                                    filteredVehicles = customerVehicles.filter(v => v.vehicleType !== 'MOTORCYCLE')
                                  } else if (selectedService === 'MOTORCYCLE_TIRE') {
                                    // For motorcycle tire service: show only motorcycles
                                    filteredVehicles = customerVehicles.filter(v => v.vehicleType === 'MOTORCYCLE')
                                  }
                                  // For other services (alignment, climate, tire repair): show all vehicles
                                  
                                  return filteredVehicles.map(vehicle => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                      {vehicle.make} {vehicle.model} ({vehicle.year})
                                    </option>
                                  ))
                                })()}
                              </select>
                              {customerVehicles.length === 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Noch keine Fahrzeuge in der <a href="/dashboard/customer/vehicles" className="text-primary-600 hover:underline">Fahrzeugverwaltung</a> hinterlegt.
                                </p>
                              )}
                              {(() => {
                                // Show message if no vehicles match the filter
                                const filteredCount = selectedService === 'MOTORCYCLE_TIRE' 
                                  ? customerVehicles.filter(v => v.vehicleType === 'MOTORCYCLE').length
                                  : selectedService === 'TIRE_CHANGE' || selectedService === 'WHEEL_CHANGE'
                                  ? customerVehicles.filter(v => v.vehicleType !== 'MOTORCYCLE').length
                                  : customerVehicles.length
                                
                                if (customerVehicles.length > 0 && filteredCount === 0) {
                                  return (
                                    <p className="text-xs text-amber-600 mt-2">
                                      {selectedService === 'MOTORCYCLE_TIRE' 
                                        ? 'Keine Motorräder in Ihrer Fahrzeugverwaltung. Bitte fügen Sie ein Motorrad hinzu.'
                                        : 'Keine passenden Fahrzeuge (Auto/Anhänger) in Ihrer Fahrzeugverwaltung.'}
                                    </p>
                                  )
                                }
                                return null
                              })()}
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

                              {/* Anzahl Reifen Dropdown (bei Reifenwechsel und Nur Montage) */}
                              {selectedService === 'TIRE_CHANGE' && !hasMixedTires && (
                                <div className="mt-3">
                                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Anzahl Reifen
                                  </label>
                                  <select
                                    value={selectedPackages.includes('two_tires') ? 'two_tires' : 'four_tires'}
                                    onChange={(e) => {
                                      const newPkgs = selectedPackages.filter(p => p !== 'two_tires' && p !== 'four_tires')
                                      setSelectedPackages([...newPkgs, e.target.value])
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                                  >
                                    <option value="four_tires">4 Reifen (alle)</option>
                                    <option value="two_tires">2 Reifen</option>
                                  </select>
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
                          {/* Saison - nur bei "Mit Reifenkauf" */}
                          {includeTires && (
                          <div className="p-5 border-b border-gray-200 lg:border-b-0">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                ❄️ Saison
                              </h4>
                              <div className="space-y-1">
                                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                                  <input
                                    type="radio"
                                    name="tireSeason"
                                    checked={selectedSeason === 's'}
                                    onChange={() => handleSeasonChange('s')}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm">☀️ Sommerreifen</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                                  <input
                                    type="radio"
                                    name="tireSeason"
                                    checked={selectedSeason === 'w'}
                                    onChange={() => handleSeasonChange('w')}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm">❄️ Winterreifen</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
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

                          {/* Service-Optionen (Service-Art, Anzahl Reifen, Zusatzleistungen) */}
                          <div className="p-5 border-b border-gray-200 lg:border-b-0">
                            <ServiceFilters
                              key={`${selectedService}-${hasMixedTires ? 'mixed' : 'standard'}-${selectedPackages.join(',')}`}
                              selectedService={selectedService}
                              selectedPackages={selectedPackages}
                              onFiltersChange={(packages) => setSelectedPackages(packages)}
                              stackGroups={!isWorkshopFixed}
                              customConfig={
                                hasMixedTires && tireDimensionsFront && tireDimensionsRear && tireDimensionsFront !== tireDimensionsRear
                                  ? {
                                      groups: [
                                        {
                                          label: 'Service-Art',
                                          multiSelect: false,
                                          options: [
                                            { 
                                              packageType: 'with_tire_purchase', 
                                              label: 'Mit Reifen', 
                                              info: 'Neue Reifen bei der Werkstatt kaufen und montieren lassen.'
                                            },
                                            { 
                                              packageType: 'tire_installation_only', 
                                              label: 'Nur Montage', 
                                              info: 'Nur die Montage-Dienstleistung. Sie bringen Ihre eigenen Reifen mit.'
                                            }
                                          ]
                                        },
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
                            <div className="p-5 border-b border-gray-200 lg:border-b-0">
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

                          {/* Reifen-Budget (only if includeTires) */}
                          {includeTires && (
                            <div className="p-5 border-b border-gray-200 lg:border-b-0">
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
                                            searchWorkshops(customerLocation, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, newMin)
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
                                            searchWorkshops(customerLocation, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, newMax)
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
                        <div className="p-5 border-b border-gray-200 lg:border-b-0">
                          <ServiceFilters
                            key={`other-service-${selectedService}`}
                            selectedService={selectedService}
                            selectedPackages={selectedPackages}
                            onFiltersChange={(packages) => setSelectedPackages(packages)}
                            stackGroups={!isWorkshopFixed}
                          />
                        </div>
                      )}

                      {/* Reifenbauart Filter (only for MOTORCYCLE_TIRE) */}
                      {selectedService === 'MOTORCYCLE_TIRE' && (
                        <div className="p-5 border-b border-gray-200 lg:border-b-0">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            🏍️ Reifenbauart
                          </h4>
                          <div className="space-y-1">
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                              <input
                                type="radio"
                                name="tireConstruction"
                                checked={tireConstruction === 'radial'}
                                onChange={() => setTireConstruction('radial')}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                              />
                              <div>
                                <span className="text-sm font-medium">Radial</span>
                                <p className="text-xs text-gray-500">Standard für moderne Motorräder</p>
                              </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                              <input
                                type="radio"
                                name="tireConstruction"
                                checked={tireConstruction === 'diagonal'}
                                onChange={() => setTireConstruction('diagonal')}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                              />
                              <div>
                                <span className="text-sm font-medium">Diagonal</span>
                                <p className="text-xs text-gray-500">Für Chopper, Enduro & Oldtimer</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Achs-Set Filter (only for MOTORCYCLE_TIRE + Mit Reifen + Beide Reifen) */}
                      {selectedService === 'MOTORCYCLE_TIRE' &&
                        includeTires &&
                        selectedPackages.includes('both') && (
                          <div className="p-5 border-b border-gray-200 lg:border-b-0">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              ⭐ Achs-Set
                            </h4>
                            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={requireSameModel}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                  console.log('⭐ [Achs-Set] Toggled:', newValue)
                                  setRequireSameModel(newValue)
                                  if (hasSearched && customerLocation) {
                                    searchWorkshops(
                                      customerLocation,
                                      undefined, // overrideSeason
                                      undefined, // overrideMixedTires
                                      undefined, // overrideSameBrand
                                      undefined, // overrideQuality
                                      undefined, // overrideFuelEfficiency
                                      undefined, // overrideWetGrip
                                      undefined, // overrideShowDOTTires
                                      undefined, // overrideThreePMSF
                                      undefined, // overrideTireBudgetMin
                                      undefined, // overrideTireBudgetMax
                                      undefined, // overrideTireDimensions
                                      newValue   // overrideSameModel
                                    )
                                  }
                                }}
                                className="w-4 h-4 mt-0.5 text-primary-600 focus:ring-primary-500 rounded"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium">
                                  Nur gleicher Hersteller & Modell
                                </span>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Vorne und hinten dasselbe Profil (z. B. Metzeler Sportec M5
                                  Interact) – vom Hersteller empfohlen für optimales Fahrverhalten.
                                </p>
                              </div>
                            </label>
                          </div>
                        )}

                      {/* EU Labels (only for TIRE_CHANGE with tires) */}
                      {selectedService === 'TIRE_CHANGE' && includeTires && (
                        <div className="p-5 border-b border-gray-200 lg:border-b-0">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            🇪🇺 EU-Label
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Kraftstoffeffizienz (min.)</label>
                              <select
                                value={fuelEfficiency}
                                onChange={(e) => {
                                  const newValue = e.target.value
                                  setFuelEfficiency(newValue)
                                  if (hasSearched && customerLocation && tireDimensions.width && tireDimensions.height && tireDimensions.diameter) {
                                    searchWorkshops(customerLocation, undefined, undefined, undefined, undefined, newValue)
                                  }
                                }}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none min-h-[44px]"
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
                                  const newValue = e.target.value
                                  setWetGrip(newValue)
                                  if (hasSearched && customerLocation && tireDimensions.width && tireDimensions.height && tireDimensions.diameter) {
                                    searchWorkshops(customerLocation, undefined, undefined, undefined, undefined, undefined, newValue)
                                  }
                                }}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none min-h-[44px]"
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
                        <div className="p-5 border-b border-gray-200 lg:border-b-0">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            ✨ Zusatzmerkmale
                          </h4>
                          <div className="space-y-1">
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                              <input
                                type="checkbox"
                                checked={require3PMSF}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                  setRequire3PMSF(newValue)
                                  if (hasSearched && customerLocation && tireDimensions.width && tireDimensions.height && tireDimensions.diameter) {
                                    searchWorkshops(customerLocation, undefined, undefined, undefined, undefined, undefined, undefined, undefined, newValue)
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm">❄️ 3PMSF (Schneeflocke)</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                              <input
                                type="checkbox"
                                checked={showDOTTires}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                  setShowDOTTires(newValue)
                                  if (hasSearched && customerLocation) {
                                    searchWorkshops(customerLocation, undefined, undefined, undefined, undefined, undefined, undefined, newValue)
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm">🏷️ Nur DOT-Reifen anzeigen</span>
                            </label>
                          </div>
                        </div>
                      )}



                      {/* Favorites Filter - visible when user has favorites */}
                      {favorites.length > 0 && (
                        <div className="p-5 border-b border-gray-200 lg:border-b-0">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            ❤️ Favoriten
                          </h4>
                          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 cursor-pointer transition-colors min-h-[44px]">
                            <input
                              type="checkbox"
                              checked={showOnlyFavorites}
                              onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
                            />
                            <span className="text-sm">Nur Favoriten anzeigen ({favorites.length})</span>
                          </label>
                        </div>
                      )}

                      {/* Opening Hours Filter - hidden on landing pages */}
                      {!useServiceCards && (
                      <div className="p-4 border-b border-gray-200 lg:border-b-0 lg:border-r lg:flex-1 lg:min-w-[160px]">
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
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]"
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
                      )}

                      {/* Multiple Services Filter - hidden on landing pages */}
                      {!useServiceCards && (
                      <div className="p-5 border-b border-gray-200 lg:border-b-0">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Weitere Services
                        </h4>
                        <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={hasMultipleServices}
                            onChange={(e) => setHasMultipleServices(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm">Nur Werkstätten mit weiteren Services</span>
                        </label>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content - Workshop Results */}
              <main className={isWorkshopFixed ? 'w-full' : 'flex-1'}>
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                      <svg className="animate-spin w-14 h-14 text-primary-600" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Outer tire */}
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" strokeOpacity="0.2" />
                        <path d="M32 4a28 28 0 0 1 28 28" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        {/* Inner hub */}
                        <circle cx="32" cy="32" r="8" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
                        {/* Spokes */}
                        <line x1="32" y1="12" x2="32" y2="24" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                        <line x1="44" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                        <line x1="32" y1="52" x2="32" y2="40" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                        <line x1="20" y1="32" x2="24" y2="32" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium text-lg">
                      {includeTires ? 'Werkstätten & Reifenpreise werden abgerufen...' : 'Werkstätten & Preise werden abgerufen...'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">Einen Moment bitte</p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {/* No Results */}
                {!loading && !error && workshops.length === 0 && hasSearched && selectedService && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    {isWorkshopFixed ? (
                      <>
                        <div className="text-6xl mb-4">⏳</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Online-Buchung wird eingerichtet
                        </h3>
                        <p className="text-gray-600 mb-2">
                          Diese Werkstatt befindet sich aktuell noch im Verifizierungsprozess für die Online-Buchung.
                        </p>
                        <p className="text-gray-500 text-sm">
                          Die Online-Terminbuchung ist in Kürze verfügbar – schauen Sie bald wieder vorbei!
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Keine Werkstätten gefunden
                        </h3>
                        {selectedService === 'MOTORCYCLE_TIRE' && requireSameModel ? (
                          <>
                            <p className="text-gray-600 mb-4">
                              Im gewählten Umkreis ist kein passendes <strong>Achs-Set</strong> (gleicher Hersteller &amp; Modell für vorne und hinten) verfügbar.
                            </p>
                            <button
                              onClick={() => {
                                setRequireSameModel(false)
                                if (customerLocation) searchWorkshops(customerLocation)
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              ⭐ Achs-Set Filter deaktivieren
                            </button>
                            <p className="text-gray-500 text-xs mt-3">
                              Oder versuchen Sie einen größeren Umkreis.
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-600">
                            Versuchen Sie einen größeren Umkreis oder eine andere PLZ
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Results */}
                {!loading && workshops.length > 0 && (
                  <div className="space-y-4 w-full">
                    {/* Sort Bar - hidden on landing pages */}
                    {!useServiceCards && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{sortedWorkshops.length}</span> Werkstätten gefunden
                      </p>
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        {/* Brand Filter - only when tires are included and brands available */}
                        {includeTires && availableBrands.length > 0 && (
                          <select
                            value={selectedBrandFilter}
                            onChange={(e) => setSelectedBrandFilter(e.target.value)}
                            className="flex-1 sm:flex-initial px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none min-h-[44px]"
                          >
                            <option value="">Alle Hersteller</option>
                            {availableBrands.map((brand) => (
                              <option key={brand} value={brand}>{brand}</option>
                            ))}
                          </select>
                        )}
                        <span className="text-sm text-gray-600 whitespace-nowrap">Sortieren:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="flex-1 sm:flex-initial px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none min-h-[44px]"
                        >
                          <option value="distance">Entfernung</option>
                          <option value="price">Preis</option>
                          <option value="rating">Bewertung</option>
                        </select>
                      </div>
                    </div>
                    )}

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
                      
                      const getFuelEfficiencyIcon = () => '⛽' // Kraftstoffeffizienz
                      const getWetGripIcon = () => '💧' // Nasshaftung
                      
                      return (
                        <div
                          key={workshop.id}
                          id={`workshop-card-${workshop.id}`}
                          className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden w-full"
                        >
                          <div className={isWorkshopFixed ? 'p-4 sm:p-5 flex flex-col' : 'flex flex-col sm:flex-row'}>
                            {/* Left: Logo + Badge (homepage only) */}
                            {!isWorkshopFixed && (
                              <div className="relative flex-shrink-0 w-full sm:w-40 md:w-44 lg:w-48 h-40 sm:h-auto bg-gradient-to-br from-primary-500 to-primary-700">
                                {(workshop.cardImageUrl || workshop.logoUrl) ? (
                                  <img
                                    src={workshop.cardImageUrl || workshop.logoUrl}
                                    alt={`Werkstatt ${workshop.name} in ${workshop.city}`}
                                    width={192}
                                    height={160}
                                    className={`w-full h-full ${workshop.cardImageUrl ? 'object-cover' : 'object-contain p-4'}`}
                                    onError={(e) => {
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        e.currentTarget.remove()
                                        const div = document.createElement('div')
                                        div.className = 'absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700'
                                        div.innerHTML = `<svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg><span class="text-white/60 text-xs mt-3">Werkstatt-Foto folgt</span>`
                                        parent.appendChild(div)
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <span className="text-white/60 text-xs mt-3">Werkstatt-Foto folgt</span>
                                  </div>
                                )}
                                {workshop.rating >= 4.5 && workshop.reviewCount >= 5 && (
                                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-primary-600 text-white text-xs font-bold uppercase rounded-md shadow-md tracking-wider">
                                    Beliebt
                                  </div>
                                )}
                                <button
                                  onClick={() => toggleFavorite(workshop.id)}
                                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all"
                                >
                                  <svg
                                    className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'fill-none text-gray-500 hover:text-red-500'} ${animatingFavorite === workshop.id ? 'animate-[heartBounce_0.3s_ease-in-out]' : ''}`}
                                    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            {/* Content */}
                          <div className={`${isWorkshopFixed ? '' : 'flex-1 '}p-4 sm:p-5 flex flex-col`}>
                              {/* Header Row: Name + City + BELIEBT + Favorite */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {isWorkshopFixed && workshop.rating >= 4.5 && workshop.reviewCount >= 5 && (
                                    <span className="px-2.5 py-0.5 bg-primary-600 text-white text-xs font-bold uppercase rounded-md tracking-wider">Beliebt</span>
                                  )}
                                  <h3 className="text-xl font-bold text-gray-900">{workshop.name}</h3>
                                  {workshop.city && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                                      {workshop.city}
                                    </span>
                                  )}
                                  {workshop.axleSetMatched && (
                                    <span
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 text-xs font-semibold rounded-md border border-amber-200"
                                      title="Vorder- und Hinterreifen vom selben Hersteller und Modell – vom Hersteller empfohlen"
                                    >
                                      ⭐ Achs-Set
                                    </span>
                                  )}
                                </div>
                                {/* Favorite Button (LP only — on homepage it's on the image) */}
                                {isWorkshopFixed && (
                                <button
                                  onClick={() => toggleFavorite(workshop.id)}
                                  className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-all"
                                >
                                  <svg
                                    className={`w-5 h-5 transition-colors ${
                                      isFavorite ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400 hover:text-red-500'
                                    } ${animatingFavorite === workshop.id ? 'animate-[heartBounce_0.3s_ease-in-out]' : ''}`}
                                    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </button>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                                {/* Rating Badge — Booking.com style */}
                                {workshop.rating && workshop.rating > 0 ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-white text-lg ${
                                        workshop.rating >= 4.5 ? 'bg-green-600' : workshop.rating >= 3.5 ? 'bg-yellow-500' : 'bg-orange-500'
                                      }`}>
                                        {workshop.rating.toFixed(1)}
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-0.5">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3.5 h-3.5 ${
                                                i < Math.round(workshop.rating)
                                                  ? 'fill-yellow-400 text-yellow-400'
                                                  : 'fill-gray-200 text-gray-200'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {workshop.reviewCount === 1 ? '1 Bewertung' : `${workshop.reviewCount} Bewertungen`}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-gray-300">|</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                      Neu auf Bereifung24
                                    </span>
                                    <span className="text-gray-300">|</span>
                                  </>
                                )}
                                <span className="flex items-center gap-1 text-gray-600">
                                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                                  {isWorkshopFixed
                                    ? (userDistanceToFixed !== null ? `${userDistanceToFixed.toFixed(1)} km` : 'Deine Werkstatt')
                                    : `${workshop.distance.toFixed(1)} km`}
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
                                const visibleAdditionalCount = expandedTireWorkshops[workshop.id] || 0
                                const allTires = filterAndSortTires(workshop.tireRecommendations, workshop.id)
                                const displayedTires = allTires.slice(0, 3 + visibleAdditionalCount)
                                const remainingCount = allTires.length - displayedTires.length
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
                                            className={`px-3 py-2.5 text-xs font-semibold rounded-lg transition-all min-h-[44px] ${
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
                                        className="px-3 py-2.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none min-h-[44px]"
                                      >
                                        <option value="price">Preis ↑</option>
                                        <option value="brand">Marke A-Z</option>
                                        <option value="label">EU-Label</option>
                                      </select>
                                    </div>
                                    
                                    {/* Tire Grid */}
                                    <div className={`grid grid-cols-1 ${visibleAdditionalCount > 0 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3'} gap-2 mb-2`}>
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
                                                <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getLabelColor(rec.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                                  {getFuelEfficiencyIcon()} {rec.labelFuelEfficiency}
                                                </span>
                                              )}
                                              {rec.labelWetGrip && (
                                                <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getLabelColor(rec.labelWetGrip)}`} title="Nasshaftung">
                                                  {getWetGripIcon()} {rec.labelWetGrip}
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
                                    
                                    {/* Show More / Less Buttons */}
                                    {allTires.length > 3 && (
                                      <div className="flex gap-2">
                                        {remainingCount > 0 && (
                                          <button
                                            onClick={() => setExpandedTireWorkshops(prev => ({ ...prev, [workshop.id]: (prev[workshop.id] || 0) + 9 }))}
                                            className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 text-primary-600 font-semibold text-sm rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-all flex items-center justify-center gap-2"
                                          >
                                            <ChevronDown className="w-4 h-4" />
                                            {Math.min(remainingCount, 9)} weitere Reifen anzeigen
                                          </button>
                                        )}
                                        {visibleAdditionalCount > 0 && (
                                          <button
                                            onClick={() => {
                                              setExpandedTireWorkshops(prev => ({ ...prev, [workshop.id]: 0 }))
                                              setTimeout(() => {
                                                document.getElementById(`workshop-card-${workshop.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                              }, 50)
                                            }}
                                            className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-600 font-semibold text-sm rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                                          >
                                            <ChevronUp className="w-4 h-4" />
                                            Weniger anzeigen
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* ⭐ ACHS-SET Panel: combined cards (replaces both axle panels when matched) */}
                              {showTires && workshop.isMixedTires && workshop.axleSetMatched && workshop.tireFrontRecommendations?.length > 0 && workshop.tireRearRecommendations?.length > 0 && (() => {
                                const workshopKey = `${workshop.id}-set`
                                const currentFilter = tireQualityFilter[workshopKey] || 'all'
                                const currentSort = tireSortBy[workshopKey] || 'price'
                                const visibleAdditionalCount = expandedTireWorkshops[workshopKey] || 0

                                // Build axle-sets by pairing front+rear with same brand+model (cheapest each)
                                const keyOf = (r: any) => `${(r.tire?.brand || '').toLowerCase().trim()}|${(r.tire?.model || '').toLowerCase().trim()}`
                                const cheapestByKey = (recs: any[]) => {
                                  const map: Record<string, any> = {}
                                  for (const r of recs) {
                                    const k = keyOf(r)
                                    const price = r.totalPrice || r.pricePerTire || 0
                                    if (!map[k] || (map[k].totalPrice || map[k].pricePerTire || 0) > price) map[k] = r
                                  }
                                  return map
                                }
                                const frontMap = cheapestByKey(workshop.tireFrontRecommendations)
                                const rearMap = cheapestByKey(workshop.tireRearRecommendations)
                                const sets = Object.keys(frontMap)
                                  .filter((k) => rearMap[k])
                                  .map((k) => {
                                    const f = frontMap[k]
                                    const r = rearMap[k]
                                    const total = (f.totalPrice || f.pricePerTire || 0) + (r.totalPrice || r.pricePerTire || 0)
                                    return { key: k, front: f, rear: r, totalPrice: total, tire: f.tire }
                                  })

                                // Premium-Brand Check (same logic as filterAndSortTires)
                                const premiumBrandsMotorrad = ['Michelin', 'Continental', 'Pirelli', 'Bridgestone', 'Dunlop', 'Metzeler', 'Heidenau']
                                const isPremium = (s: any) => {
                                  const b = (s.tire?.brand || '').toLowerCase()
                                  return premiumBrandsMotorrad.some((p) => b.includes(p.toLowerCase()))
                                }
                                const sortedAsc = [...sets].sort((a, b) => a.totalPrice - b.totalPrice)
                                const cheapThreshold = sortedAsc.length > 0 ? sortedAsc[Math.floor(sortedAsc.length * 0.33)].totalPrice : 0

                                // Filter
                                let filteredSets = sets
                                if (selectedBrandFilter) {
                                  filteredSets = filteredSets.filter((s) => (s.tire?.brand || '').toLowerCase() === selectedBrandFilter.toLowerCase())
                                }
                                if (currentFilter === 'premium') filteredSets = filteredSets.filter(isPremium)
                                else if (currentFilter === 'cheap') filteredSets = filteredSets.filter((s) => s.totalPrice <= cheapThreshold)

                                // Sort
                                if (currentSort === 'brand') {
                                  filteredSets.sort((a, b) => (a.tire?.brand || '').localeCompare(b.tire?.brand || ''))
                                } else {
                                  filteredSets.sort((a, b) => a.totalPrice - b.totalPrice)
                                }

                                // Auto-Labels
                                const labelFor = (s: any, idx: number): string => {
                                  if (s === sortedAsc[0]) return 'Günstigster'
                                  if (isPremium(s) && filteredSets.filter(isPremium)[0] === s) return 'Premium'
                                  return ''
                                }

                                const displayedSets = filteredSets.slice(0, 3 + visibleAdditionalCount)
                                const remainingCount = filteredSets.length - displayedSets.length
                                const selectedSetIdx = selectedTireFrontIndices[workshop.id] ?? 0

                                // Sync rear selection when set is selected (find rear index that matches front's brand+model)
                                const selectSet = (setKey: string) => {
                                  const frontIdx = workshop.tireFrontRecommendations.findIndex((r: any) => keyOf(r) === setKey)
                                  const rearIdx = workshop.tireRearRecommendations.findIndex((r: any) => keyOf(r) === setKey)
                                  if (frontIdx >= 0) setSelectedTireFrontIndices((prev) => ({ ...prev, [workshop.id]: frontIdx }))
                                  if (rearIdx >= 0) setSelectedTireRearIndices((prev) => ({ ...prev, [workshop.id]: rearIdx }))
                                }

                                const selectedKey = keyOf(workshop.tireFrontRecommendations[selectedSetIdx] || workshop.tireFrontRecommendations[0])

                                return (
                                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mb-3">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        ⭐ Achs-Set · {workshop.tireFront?.dimensions} + {workshop.tireRear?.dimensions} <span className="text-gray-400">({filteredSets.length} Sets)</span>
                                      </p>
                                    </div>

                                    {/* Quick Filters + Sorting */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => setTireQualityFilter((prev) => ({ ...prev, [workshopKey]: 'all' }))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${currentFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                        >
                                          🔍 Alle
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter((prev) => ({ ...prev, [workshopKey]: 'cheap' }))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${currentFilter === 'cheap' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                        >
                                          💰 Günstige
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter((prev) => ({ ...prev, [workshopKey]: 'premium' }))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${currentFilter === 'premium' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                        >
                                          ⭐ Premium
                                        </button>
                                      </div>
                                      <select
                                        value={currentSort}
                                        onChange={(e) => setTireSortBy((prev) => ({ ...prev, [workshopKey]: e.target.value as 'price' | 'brand' | 'label' }))}
                                        className="px-3 py-2.5 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                                      >
                                        <option value="price">Set-Preis ↑</option>
                                        <option value="brand">Marke A-Z</option>
                                      </select>
                                    </div>

                                    {/* Set Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      {displayedSets.map((s, idx) => {
                                        const label = labelFor(s, idx)
                                        const isSelected = selectedKey === s.key
                                        return (
                                          <button
                                            key={s.key}
                                            onClick={() => selectSet(s.key)}
                                            className={`text-left p-2.5 rounded-lg border-2 transition-all ${isSelected ? 'border-primary-500 bg-white shadow-sm' : 'border-transparent bg-white hover:border-gray-300'}`}
                                          >
                                            {label && <p className="text-xs font-bold text-primary-600 mb-0.5">{label}</p>}
                                            <p className="text-sm font-bold text-gray-900 truncate">{s.tire?.brand}</p>
                                            <p className="text-xs text-gray-500 truncate mb-1.5">{s.tire?.model}</p>
                                            <div className="space-y-0.5 mb-1.5 text-xs text-gray-600">
                                              <div className="flex justify-between gap-2">
                                                <span className="truncate">🔹 Vorne</span>
                                                <span className="font-medium tabular-nums">{formatEUR(s.front.pricePerTire)}</span>
                                              </div>
                                              <div className="flex justify-between gap-2">
                                                <span className="truncate">🔸 Hinten</span>
                                                <span className="font-medium tabular-nums">{formatEUR(s.rear.pricePerTire)}</span>
                                              </div>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900 pt-1.5 border-t border-gray-100">
                                              Set: {formatEUR(s.totalPrice)}
                                            </p>
                                          </button>
                                        )
                                      })}
                                    </div>

                                    {/* Show more/less buttons */}
                                    {filteredSets.length > 3 && (
                                      <div className="flex gap-2 mt-2">
                                        {remainingCount > 0 && (
                                          <button
                                            onClick={() => setExpandedTireWorkshops((prev) => ({ ...prev, [workshopKey]: (prev[workshopKey] || 0) + 9 }))}
                                            className="flex-1 px-3 py-2.5 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition min-h-[44px]"
                                          >
                                            {Math.min(remainingCount, 9)} weitere Sets anzeigen
                                          </button>
                                        )}
                                        {visibleAdditionalCount > 0 && (
                                          <button
                                            onClick={() => {
                                              setExpandedTireWorkshops((prev) => ({ ...prev, [workshopKey]: 0 }))
                                              setTimeout(() => {
                                                document.getElementById(`workshop-card-${workshop.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                              }, 50)
                                            }}
                                            className="flex-1 px-3 py-2.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
                                          >
                                            Weniger anzeigen
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Mixed Tire Recommendations Panel - Front */}
                              {showTires && workshop.isMixedTires && !workshop.axleSetMatched && workshop.tireFrontRecommendations?.length > 0 && (() => {
                                const workshopKey = `${workshop.id}-front`
                                const filteredTires = filterAndSortTires(workshop.tireFrontRecommendations, workshopKey)
                                const visibleAdditionalCount = expandedTireWorkshops[workshopKey] || 0
                                const displayedTires = filteredTires.slice(0, 3 + visibleAdditionalCount)
                                const remainingCount = filteredTires.length - displayedTires.length
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
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${
                                            currentFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          🔍 Alle
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'cheap'}))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${
                                            currentFilter === 'cheap' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          💰 Günstige
                                        </button>
                                        {selectedService !== 'MOTORCYCLE_TIRE' && (
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'best'}))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${
                                            currentFilter === 'best' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          🏆 Beste Eigenschaften
                                        </button>
                                        )}
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'premium'}))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${
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
                                        className="px-3 py-2.5 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
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
                                            <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getLabelColor(rec.tire.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                              {getFuelEfficiencyIcon()} {rec.tire.labelFuelEfficiency}
                                            </span>
                                          )}
                                          {rec.tire.labelWetGrip && (
                                            <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getLabelColor(rec.tire.labelWetGrip)}`} title="Nasshaftung">
                                              {getWetGripIcon()} {rec.tire.labelWetGrip}
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

                                    {/* Show more/less buttons */}
                                    {filteredTires.length > 3 && (
                                      <div className="flex gap-2 mt-2">
                                        {remainingCount > 0 && (
                                          <button
                                            onClick={() => setExpandedTireWorkshops(prev => ({ ...prev, [workshopKey]: (prev[workshopKey] || 0) + 9 }))}
                                            className="flex-1 px-3 py-2.5 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition min-h-[44px]"
                                          >
                                            {Math.min(remainingCount, 9)} weitere Reifen anzeigen
                                          </button>
                                        )}
                                        {visibleAdditionalCount > 0 && (
                                          <button
                                            onClick={() => {
                                              setExpandedTireWorkshops(prev => ({ ...prev, [workshopKey]: 0 }))
                                              setTimeout(() => {
                                                document.getElementById(`workshop-card-${workshop.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                              }, 50)
                                            }}
                                            className="flex-1 px-3 py-2.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
                                          >
                                            Weniger anzeigen
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Mixed Tire Recommendations Panel - Rear */}
                              {showTires && workshop.isMixedTires && !workshop.axleSetMatched && workshop.tireRearRecommendations?.length > 0 && (() => {
                                const workshopKey = `${workshop.id}-rear`
                                const filteredTires = filterAndSortTires(workshop.tireRearRecommendations, workshopKey)
                                const visibleAdditionalCount = expandedTireWorkshops[workshopKey] || 0
                                const displayedTires = filteredTires.slice(0, 3 + visibleAdditionalCount)
                                const remainingCount = filteredTires.length - displayedTires.length
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
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${
                                            currentFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          🔍 Alle
                                        </button>
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'cheap'}))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${
                                            currentFilter === 'cheap' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          💰 Günstige
                                        </button>
                                        {selectedService !== 'MOTORCYCLE_TIRE' && (
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'best'}))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${
                                            currentFilter === 'best' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          🏆 Beste Eigenschaften
                                        </button>
                                        )}
                                        <button
                                          onClick={() => setTireQualityFilter(prev => ({...prev, [workshopKey]: 'premium'}))}
                                          className={`px-3 py-2.5 text-xs rounded-md transition min-h-[44px] ${
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
                                        className="px-3 py-2.5 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
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
                                            <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getLabelColor(rec.tire.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                              {getFuelEfficiencyIcon()} {rec.tire.labelFuelEfficiency}
                                            </span>
                                          )}
                                          {rec.tire.labelWetGrip && (
                                            <span className={`inline-flex items-center justify-center px-1.5 h-6 rounded text-xs font-bold ${getLabelColor(rec.tire.labelWetGrip)}`} title="Nasshaftung">
                                              {getWetGripIcon()} {rec.tire.labelWetGrip}
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

                                    {/* Show more/less buttons */}
                                    {filteredTires.length > 3 && (
                                      <div className="flex gap-2 mt-2">
                                        {remainingCount > 0 && (
                                          <button
                                            onClick={() => setExpandedTireWorkshops(prev => ({ ...prev, [workshopKey]: (prev[workshopKey] || 0) + 9 }))}
                                            className="flex-1 px-3 py-2.5 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition min-h-[44px]"
                                          >
                                            {Math.min(remainingCount, 9)} weitere Reifen anzeigen
                                          </button>
                                        )}
                                        {visibleAdditionalCount > 0 && (
                                          <button
                                            onClick={() => {
                                              setExpandedTireWorkshops(prev => ({ ...prev, [workshopKey]: 0 }))
                                              setTimeout(() => {
                                                document.getElementById(`workshop-card-${workshop.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                              }, 50)
                                            }}
                                            className="flex-1 px-3 py-2.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
                                          >
                                            Weniger anzeigen
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Tire not available warning / loading indicator - for TIRE_CHANGE and MOTORCYCLE_TIRE */}
                              {(selectedService === 'TIRE_CHANGE' || selectedService === 'MOTORCYCLE_TIRE') && showTires && !workshop.tireAvailable && (
                                <div className={`rounded-lg p-3 mb-3 ${loading ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                                  {loading ? (
                                    <div className="flex items-center gap-3">
                                      <svg className="animate-spin h-5 w-5 text-blue-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M12 2a10 10 0 0110 10h-4a6 6 0 00-6-6V2z"></path>
                                      </svg>
                                      <p className="text-sm text-blue-700 font-medium">Reifenpreise werden abgerufen...</p>
                                    </div>
                                  ) : !selectedVehicleId ? (
                                    <div>
                                      <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ {selectedService === 'MOTORCYCLE_TIRE' ? 'Motorrad auswählen' : 'Fahrzeug auswählen'}</p>
                                      <p className="text-xs text-yellow-700">
                                        {selectedService === 'MOTORCYCLE_TIRE' 
                                          ? 'Bitte wählen Sie links unter "Fahrzeug wählen" Ihr Motorrad aus, um passende Reifen anzuzeigen.'
                                          : 'Bitte wählen Sie links unter "Fahrzeug wählen" Ihr Fahrzeug aus, um passende Reifen anzuzeigen.'
                                        }
                                      </p>
                                    </div>
                                  ) : workshop.tirePartiallyAvailable && workshop.unavailableDimensions?.length > 0 ? (
                                    <div>
                                      <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ Teilweise keine Reifen verfügbar</p>
                                      <p className="text-xs text-yellow-700">
                                        Für folgende Größe(n) sind aktuell keine Reifen verfügbar: {workshop.unavailableDimensions.join(', ')}
                                      </p>
                                      <p className="text-xs text-yellow-600 mt-1">Der angezeigte Preis enthält nur den Montageservice.</p>
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
                                      <div className="space-y-1 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mb-2">
                                        {workshop.isMixedTires && (selectedFrontRec || selectedRearRec) ? (
                                          <>
                                            {/* Mixed tires: Show selected front and rear */}
                                            {selectedFrontRec && (
                                              <div className="flex justify-between gap-4">
                                                <span>{selectedFrontRec.quantity}× {selectedFrontRec.tire.brand} {selectedFrontRec.tire.model} à {formatEUR(selectedFrontRec.pricePerTire)}</span>
                                                <span className="font-medium">{formatEUR(selectedFrontRec.totalPrice)}</span>
                                              </div>
                                            )}
                                            {selectedRearRec && (
                                              <div className="flex justify-between gap-4">
                                                <span>{selectedRearRec.quantity}× {selectedRearRec.tire.brand} {selectedRearRec.tire.model} à {formatEUR(selectedRearRec.pricePerTire)}</span>
                                                <span className="font-medium">{formatEUR(selectedRearRec.totalPrice)}</span>
                                              </div>
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
                                        {((workshop.disposalFeeApplied || 0) > 0) && (selectedRec || workshop.isMixedTires || selectedFrontRec || selectedRearRec) && (() => {
                                          // Calculate tire count based on service type
                                          let tireCount = 0
                                          if (selectedService === 'MOTORCYCLE_TIRE') {
                                            // Motorcycle: 1 or 2 tires
                                            if (selectedFrontRec && selectedRearRec) tireCount = 2
                                            else if (selectedFrontRec || selectedRearRec) tireCount = 1
                                            else tireCount = selectedPackages.includes('both') ? 2 : 1
                                          } else if (workshop.isMixedTires) {
                                            tireCount = 4
                                          } else if (selectedRec) {
                                            tireCount = selectedRec.quantity || 0
                                          }
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
                                        {((workshop.runFlatSurchargeApplied || 0) > 0) && (() => {
                                          let tireCount = 0
                                          if (workshop.isMixedTires) {
                                            tireCount = 4
                                          } else if (selectedRec) {
                                            tireCount = selectedRec.quantity || 0
                                          }
                                          if (tireCount > 0) {
                                            const perTire = (workshop.runFlatSurchargeApplied || 0) / tireCount
                                            return (
                                              <div className="flex justify-between gap-4">
                                                <span>Runflat-Zuschlag ({tireCount}× {formatEUR(perTire)})</span>
                                                <span className="font-medium">{formatEUR(workshop.runFlatSurchargeApplied)}</span>
                                              </div>
                                            )
                                          }
                                          return null
                                        })()}
                                      </div>
                                      {/* Total price — CHECK24-style prominent */}
                                      <div className="flex items-center justify-between gap-4 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 mt-1">
                                        <span className="text-sm font-medium text-primary-700 whitespace-nowrap">Gesamtpreis</span>
                                        <span className="text-2xl sm:text-3xl font-extrabold text-primary-700 whitespace-nowrap">
                                          {formatEUR(currentTotalPrice)}
                                        </span>
                                      </div>
                                    </>
                                  ) : selectedService === 'WHEEL_CHANGE' ? (
                                    <>
                                      {/* Price breakdown for Räderwechsel */}
                                      {workshop.totalPrice > 0 ? (
                                        <>
                                          <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mb-1">
                                            <div className="flex justify-between gap-4">
                                              <span>Räderwechsel</span>
                                              <span className="font-medium">{formatEUR(workshop.wheelChangeBreakdown?.basePrice || workshop.basePrice)}</span>
                                            </div>
                                            {workshop.wheelChangeBreakdown?.balancingSurcharge > 0 && (
                                              <div className="flex justify-between gap-4">
                                                <span>Auswuchten</span>
                                                <span className="font-medium">+ {formatEUR(workshop.wheelChangeBreakdown.balancingSurcharge)}</span>
                                              </div>
                                            )}
                                            {workshop.wheelChangeBreakdown?.storageSurcharge > 0 && (
                                              <div className="flex justify-between gap-4">
                                                <span>Einlagerung</span>
                                                <span className="font-medium">+ {formatEUR(workshop.wheelChangeBreakdown.storageSurcharge)}</span>
                                              </div>
                                            )}
                                            {workshop.wheelChangeBreakdown?.washingSurcharge > 0 && (
                                              <div className="flex justify-between gap-4">
                                                <span>Räder waschen</span>
                                                <span className="font-medium">+ {formatEUR(workshop.wheelChangeBreakdown.washingSurcharge)}</span>
                                              </div>
                                            )}
                                          </div>
                                          {/* Total price — CHECK24-style prominent */}
                                          <div className="flex items-center justify-between gap-4 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 mt-1">
                                            <span className="text-sm font-medium text-primary-700 whitespace-nowrap">Gesamtpreis</span>
                                            <span className="text-2xl sm:text-3xl font-extrabold text-primary-700 whitespace-nowrap">
                                              {formatEUR(workshop.totalPrice)}
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-lg font-semibold text-gray-500">Preis auf Anfrage</span>
                                      )}
                                    </>
                                  ) : !includeTires ? (
                                    <>
                                      {/* Price breakdown for Nur Montage */}
                                      {selectedService === 'TIRE_CHANGE' && !selectedVehicleId && workshop.basePrice === 0 ? (
                                        /* No vehicle selected — show warning */
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                          <p className="text-sm text-yellow-800 font-semibold mb-1">⚠️ Fahrzeug auswählen</p>
                                          <p className="text-xs text-yellow-700">Bitte wählen Sie links unter &quot;Fahrzeug wählen&quot; Ihr Fahrzeug aus, um passende Reifen anzuzeigen.</p>
                                        </div>
                                      ) : workshop.totalPrice > 0 ? (
                                        <>
                                          <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mb-1">
                                            {((workshop.basePrice || 0) + (workshop.mountingOnlySurchargeApplied || 0)) > 0 && (
                                              <div className="flex justify-between gap-4">
                                                <span>Montage</span>
                                                <span className="font-medium">{formatEUR((workshop.basePrice || 0) + (workshop.mountingOnlySurchargeApplied || 0))}</span>
                                              </div>
                                            )}
                                            {((workshop.runFlatSurchargeApplied || 0) > 0) && (() => {
                                              let tireCount = selectedPackages.includes('two_tires') ? 2 : 4
                                              const perTire = (workshop.runFlatSurchargeApplied || 0) / tireCount
                                              return (
                                                <div className="flex justify-between gap-4">
                                                  <span>Runflat ({tireCount}× {formatEUR(perTire)})</span>
                                                  <span className="font-medium">{formatEUR(workshop.runFlatSurchargeApplied)}</span>
                                                </div>
                                              )
                                            })()}
                                            {((workshop.disposalFeeApplied || 0) > 0) && (() => {
                                              // Determine tire count based on service type
                                              let tireCount = 4
                                              if (selectedService === 'MOTORCYCLE_TIRE') {
                                                tireCount = selectedPackages.includes('both') ? 2 : 1
                                              } else {
                                                tireCount = selectedPackages.includes('two_tires') ? 2 : 4
                                              }
                                              const perTire = (workshop.disposalFeeApplied || 0) / tireCount
                                              return (
                                                <div className="flex justify-between gap-4">
                                                  <span>Entsorgung ({tireCount}× {formatEUR(perTire)})</span>
                                                  <span className="font-medium">{formatEUR(workshop.disposalFeeApplied)}</span>
                                                </div>
                                              )
                                            })()}
                                          </div>
                                          {/* Total price — CHECK24-style prominent */}
                                          <div className="flex items-center justify-between gap-4 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 mt-1">
                                            <span className="text-sm font-medium text-primary-700 whitespace-nowrap">Gesamtpreis</span>
                                            <span className="text-2xl sm:text-3xl font-extrabold text-primary-700 whitespace-nowrap">
                                              {formatEUR(workshop.totalPrice)}
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-lg font-semibold text-gray-500">Preis auf Anfrage</span>
                                      )}
                                    </>
                                  ) : showTires && !workshop.tireAvailable ? (
                                    <div>
                                      <p className="text-sm text-gray-500">Keine Reifen für diese Größe verfügbar</p>
                                      <p className="text-xs text-gray-400 mt-1">Montagepreis: {formatEUR(workshop.basePrice)}</p>
                                    </div>
                                  ) : (
                                    <div>
                                      {selectedService === 'TIRE_CHANGE' && !selectedVehicleId ? (
                                        /* Warning already shown above in tire availability section */
                                        null
                                      ) : (
                                        <>
                                          <p className="text-sm text-gray-600">
                                            {selectedService === 'TIRE_REPAIR' 
                                              ? (selectedPackages.includes('valve_damage') ? 'Ventilschaden' : 'Fremdkörper-Reparatur')
                                              : selectedService === 'ALIGNMENT_BOTH'
                                              ? 'Achsvermessung'
                                              : 'Nur Montage'
                                            }
                                          </p>
                                          <span className="text-2xl font-extrabold text-primary-700">{formatEUR(workshop.basePrice || workshop.totalPrice)}</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    {workshop.estimatedDuration > 0 && (
                                      <span>~ {workshop.estimatedDuration} Min.</span>
                                    )}
                                    {selectedService !== 'WHEEL_CHANGE' && workshop.estimatedDuration > 0 && selectedPackages.includes('with_balancing') && (
                                      <span>·</span>
                                    )}
                                    {selectedService !== 'WHEEL_CHANGE' && selectedPackages.includes('with_balancing') && (
                                      <span>inkl. Wuchten</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleBooking(workshop)}
                                  disabled={(session && !selectedVehicleId) || (showTires && !workshop.tireAvailable)}
                                  className={`flex-shrink-0 px-6 py-3 font-semibold rounded-xl transition-colors whitespace-nowrap shadow-sm hover:shadow-md ${
                                    (session && !selectedVehicleId) || (showTires && !workshop.tireAvailable)
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                                  }`}
                                >
                                  {session && !selectedVehicleId
                                    ? 'Bitte Fahrzeug wählen'
                                    : showTires && !workshop.tireAvailable
                                    ? 'Keine Reifen verfügbar'
                                    : selectedService === 'WHEEL_CHANGE' 
                                    ? 'Räderwechsel buchen →'
                                    : selectedService === 'TIRE_REPAIR'
                                    ? 'Reparatur buchen →'
                                    : selectedService === 'ALIGNMENT_BOTH'
                                    ? 'Vermessung buchen →'
                                    : selectedService === 'TIRE_CHANGE' && includeTires 
                                    ? 'Reifen & Montage buchen →'
                                    : 'Montage buchen →'
                                  }
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
          <StatsCountUp avgRating={stats.avgRating} />

          {/* Reviews Section - Real reviews from database */}
          {reviews.length > 0 && <ReviewsCarousel reviews={reviews} />}

      {/* How It Works - Ablauf */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              So einfach geht&apos;s
            </h2>
            <p className="text-xl text-gray-600">
              In 3 Schritten zum Wunschtermin
            </p>
          </div>

          <StepsSection />

            {/* CTA Button */}
            <div className="text-center mt-12">
              <button
                onClick={() => document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="shimmer-btn px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all hover:-translate-y-0.5 shadow-xl inline-flex items-center gap-2"
                style={{ boxShadow: '0 8px 25px rgba(0,112,186,0.3)' }}
              >
                <Search className="w-5 h-5" />
                Jetzt Werkstatt finden
              </button>
            </div>
        </div>
      </section>

      {/* Popular Services */}
      <section id="services" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Beliebte Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { href: '/services/raederwechsel', emoji: '🔧', title: 'Räderwechsel', desc: 'Kompletter Radwechsel vom Winter- auf Sommerreifen oder umgekehrt' },
              { href: '/services/reifenwechsel', emoji: '🔄', title: 'Reifenwechsel', desc: 'Reifen von Felge ab- und aufziehen mit professioneller Montage' },
              { href: '/services/reifenreparatur', emoji: '🔨', title: 'Reifenreparatur', desc: 'Professionelle Reparatur von Reifenschäden mit Vulkanisierung' },
              { href: '/services/motorradreifen', emoji: '🏍️', title: 'Motorradreifen', desc: 'Spezialisierte Montage für Motorrad-Vorder- und Hinterreifen' },
              { href: '/services/achsvermessung', emoji: '📏', title: 'Achsvermessung', desc: '3D-Vermessung und Einstellung für optimalen Geradeauslauf' },
              { href: '/services/klimaservice', emoji: '❄️', title: 'Klimaservice', desc: 'Wartung, Desinfektion und Befüllung der Auto-Klimaanlage' },
            ].map((service, index) => (
              <Link
                key={service.href}
                href={service.href}
                className="relative bg-white rounded-xl shadow-lg transition-all duration-300 p-6 border border-gray-100 hover:border-primary-400 group block hover:-translate-y-1.5"
                style={{ transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,112,186,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  {service.emoji}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {service.title}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  {service.desc}
                </p>
                <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                  <span>Mehr erfahren</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
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
            Tausende zufriedene Kunden vertrauen bereits auf Bereifung24
          </p>
          <button
            onClick={() => document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="shimmer-btn pulse-cta px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all hover:-translate-y-0.5 shadow-2xl"
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
      {!useServiceCards && (
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logos/B24_Logo_blau_gray.png"
                  alt="Bereifung24"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Deutschlands erste digitale Plattform für Reifenservice. Transparent, fair und einfach.
              </p>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/people/Bereifung24/61552512005883/" target="_blank" rel="noopener noreferrer" className="social-icon" title="Facebook">
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/bereifung24/" target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://linkedin.com/company/bereifung24" target="_blank" rel="noopener noreferrer" className="social-icon" title="LinkedIn">
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* For Customers */}
            <div>
              <h4 className="text-lg font-bold mb-4">Für Kunden</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/register/customer" className="hover:text-white transition-colors">Kostenlos registrieren</Link></li>
                <li><button onClick={() => setShowLoginModal(true)} className="hover:text-white transition-colors">Anmelden</button></li>
                <li><Link href="/#services" className="hover:text-white transition-colors">Alle Services</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white transition-colors">So funktioniert&apos;s</Link></li>
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

            {/* Unternehmen */}
            <div>
              <h4 className="text-lg font-bold mb-4">Unternehmen</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/ueber-uns" className="hover:text-white transition-colors">Über uns</Link></li>
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
            {/* App Download */}
            <div className="mb-8 flex flex-col items-center gap-3">
              <p className="text-center text-xs uppercase tracking-widest text-gray-500 opacity-60 font-medium">
                Bereifung24 App herunterladen
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://apps.apple.com/de/app/bereifung24/id6761443270"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Bereifung24 im App Store laden"
                  className="transition-transform hover:scale-105"
                >
                  <img
                    src="/logos/app-store-badge.svg"
                    alt="Download im App Store"
                    height={48}
                    className="h-12 w-auto"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=de.bereifung24.bereifung24_app"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Bereifung24 bei Google Play laden"
                  className="transition-transform hover:scale-105"
                >
                  <img
                    src="/logos/google-play-badge.png"
                    alt="Jetzt bei Google Play"
                    height={70}
                    className="h-[70px] w-auto -my-3"
                  />
                </a>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-gray-400 text-sm">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <p>&copy; 2026 Bereifung24. Alle Rechte vorbehalten.</p>
                <p className="hidden md:block">|</p>
                <p>Made with ❤️ in Deutschland</p>
              </div>
              
              {/* Payment Methods & Trust Badges */}
              <div className="flex flex-col items-center gap-4">
                <div className="payment-container">
                  <p className="text-center text-xs uppercase tracking-widest text-gray-500 opacity-60 mb-3 font-medium">
                    Sichere Zahlungsmethoden
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
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
                    
                    {/* Apple Pay */}
                    <div className="bg-white px-3 py-2 rounded flex items-center justify-center h-10">
                      <Image 
                        src="/logos/apple-pay.svg" 
                        alt="Apple Pay" 
                        width={50} 
                        height={32}
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Google Pay */}
                    <div className="bg-white px-3 py-2 rounded flex items-center justify-center h-10">
                      <Image 
                        src="/logos/google-pay.png" 
                        alt="Google Pay" 
                        width={60} 
                        height={32}
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Klarna */}
                    <div className="bg-white px-3 py-2 rounded flex items-center justify-center h-10">
                      <img 
                        src="/payment-logos/klarna-logo.png" 
                        alt="Klarna" 
                        width={60}
                        height={24}
                        className="h-6 w-auto object-contain"
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
        </div>
      </footer>
      )}
    </div>
  )
}

// Steps Section Component with SVG paths and hover effects
function StepsSection() {
  const [sectionRef, isVisible] = useScrollReveal(0.15)

  const steps = [
    {
      num: 1,
      icon: <Search className="w-10 h-10 text-primary-600" />,
      iconBg: 'bg-primary-100',
      title: 'Werkstatt finden',
      desc: 'Service wählen, Standort eingeben und passende Werkstätten mit Festpreisen vergleichen',
      extra: 'Über 100+ Werkstätten deutschlandweit',
      extraColor: 'text-primary-600',
    },
    {
      num: 2,
      icon: <Calendar className="w-10 h-10 text-green-600" />,
      iconBg: 'bg-green-100',
      title: 'Online buchen & bezahlen',
      desc: 'Wunschtermin wählen, sicher online bezahlen und Bestätigung per E-Mail erhalten',
      extra: 'Sichere Zahlung mit allen gängigen Methoden',
      extraColor: 'text-green-600',
    },
    {
      num: 3,
      icon: <Check className="w-10 h-10 text-blue-600" />,
      iconBg: 'bg-blue-100',
      title: 'Zur Werkstatt fahren',
      desc: 'Einfach zum vereinbarten Termin erscheinen - alles ist vorbereitet und erledigt',
      extra: 'Keine Wartezeit, alles vorbereitet',
      extraColor: 'text-blue-600',
    },
  ]

  return (
    <div ref={sectionRef as React.RefObject<HTMLDivElement>} className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* SVG Connection Paths - Desktop only, percentage-based for symmetry */}
        <svg className="hidden md:block absolute top-24 left-0 w-full h-12 pointer-events-none" viewBox="0 0 900 40" preserveAspectRatio="none" style={{ zIndex: 1 }}>
          {/* Path 1→2 */}
          <path
            d="M 200 25 Q 300 0 400 25"
            fill="none"
            stroke="#0070ba"
            strokeWidth="2"
            strokeOpacity="0.3"
            className={`step-path-line ${isVisible ? 'draw' : ''}`}
            style={{ transitionDelay: '0.5s' }}
            markerEnd="url(#arrowhead)"
          />
          {/* Path 2→3 */}
          <path
            d="M 500 25 Q 600 0 700 25"
            fill="none"
            stroke="#0070ba"
            strokeWidth="2"
            strokeOpacity="0.3"
            className={`step-path-line ${isVisible ? 'draw' : ''}`}
            style={{ transitionDelay: '0.9s' }}
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#0070ba" opacity="0.4" />
            </marker>
          </defs>
        </svg>

        {steps.map((step, index) => (
          <div
            key={step.num}
            className={`step-card bg-white rounded-2xl shadow-lg p-8 text-center relative transition-all duration-300 hover:-translate-y-1 cursor-default scroll-reveal ${isVisible ? 'visible' : ''}`}
            style={{
              transitionDelay: `${index * 0.15}s`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
              {step.num}
            </div>
            <div className="mb-6 mt-4">
              <div className={`w-20 h-20 ${step.iconBg} rounded-full flex items-center justify-center mx-auto`}>
                {step.icon}
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {step.title}
            </h3>
            <p className="text-gray-600">
              {step.desc}
            </p>
            {/* Extra text on hover */}
            <div className={`step-extra-text text-sm font-semibold ${step.extraColor}`}>
              {step.extra}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stats Count-Up Component
function StatsCountUp({ avgRating }: { avgRating: number }) {
  const [sectionRef, isVisible] = useScrollReveal(0.15)
  const count100 = useCountUp(100, isVisible, 2000, 0)
  const ratingTarget = avgRating > 0 ? avgRating : 4.9
  const countRating = useCountUp(ratingTarget, isVisible, 2000, 1)
  const count24 = useCountUp(24, isVisible, 2000, 0)
  const count24h = useCountUp(24, isVisible, 2000, 0)

  const cards = [
    { value: `${count100}%`, label: 'Geprüfte Werkstätten' },
    { value: `${countRating}★`, label: 'Durchschnittsbewertung' },
    { value: `${count24}/7`, label: 'Online Buchung' },
    { value: `< ${count24h}h`, label: 'Schneller Termin' },
  ]

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="py-12 bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`text-center stat-card ${isVisible ? 'animate-in' : ''}`}
              style={{ transitionDelay: `${index * 0.15}s` }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                {card.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Reviews Grid Component - Shows newest 5 reviews with star animations
function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [sectionRef, isVisible] = useScrollReveal(0.1)

  if (reviews.length === 0) return null

  // Show only the 5 newest reviews
  const displayedReviews = reviews.slice(0, 5)

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 scroll-reveal ${isVisible ? 'visible' : ''}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Das sagen unsere Kunden
          </h2>
          <p className="text-xl text-gray-600">
            Echte Bewertungen von zufriedenen Kunden
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Reviews Grid - 5 newest reviews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {displayedReviews.map((review, cardIndex) => (
              <div
                key={review.id}
                className={`bg-white rounded-xl shadow-lg border border-gray-200 p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 scroll-reveal ${isVisible ? 'visible' : ''}`}
                style={{
                  transitionDelay: isVisible ? `${0.15 + cardIndex * 0.1}s` : '0s',
                  boxShadow: undefined,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '' }}
              >
                {/* Rating - Star Pop Animation */}
                <div className="flex items-center justify-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 star-animate ${isVisible ? 'pop' : ''} ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                      style={{ animationDelay: `${cardIndex * 0.15 + i * 0.1}s` }}
                    />
                  ))}
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-4 flex-grow">
                    &quot;{review.comment}&quot;
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
        </div>
      </div>
    </section>
  )
}
