'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Star, 
  Clock, 
  ArrowLeft, 
  Plus,
  User,
  LogOut,
  ClipboardList,
  Calendar,
  BookOpen,
  Car,
  TrendingUp,
  Cloud,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  Check,
  Heart,
  Phone,
  Globe,
  Shield,
  Wrench,
  Package,
  Award,
  X
} from 'lucide-react'
import Link from 'next/link'
import AddServicesModal from './components/AddServicesModal'
import LoginModal from '@/components/LoginModal'

export default function WorkshopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workshopId = params.id as string

  const { data: session, status } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  const [workshop, setWorkshop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({})
  const [vacationDates, setVacationDates] = useState<string[]>([])
  const [openingHours, setOpeningHours] = useState<any>(null)
  const [calendarError, setCalendarError] = useState(false)
  const [serviceType, setServiceType] = useState<string>('WHEEL_CHANGE')
  
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  
  const [isFavorite, setIsFavorite] = useState(false)
  
  const [showServicesModal, setShowServicesModal] = useState(false)
  const [additionalServices, setAdditionalServices] = useState<any[]>([])
  const [basePrice, setBasePrice] = useState(0)
  const [baseDuration, setBaseDuration] = useState(60)
  const [mountingSurchargeAmount, setMountingSurchargeAmount] = useState(0)
  
  const [tireBookingData, setTireBookingData] = useState<any>(null)
  const [availableServices, setAvailableServices] = useState<any[]>([])
  const [selectedPackageName, setSelectedPackageName] = useState<string>('')
  const [isSmallBusiness, setIsSmallBusiness] = useState(false)
  const [isBusinessCustomer, setIsBusinessCustomer] = useState(false)
  const [lastLoadTimestamp, setLastLoadTimestamp] = useState<number>(0)

  // Fetch available slots when component mounts
  useEffect(() => {
    if (!workshopId) return
    fetchAvailableSlots()
  }, [workshopId])

  const fetchAvailableSlots = async () => {
    try {
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0)
      
      const response = await fetch(
        `/api/customer/direct-booking/${workshopId}/available-slots?` +
        `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
        setBusySlots(data.busySlots || {})
        setVacationDates(data.vacationDates || [])
        setCalendarError(data.calendarError || false)
        if (data.openingHours) {
          try {
            setOpeningHours(JSON.parse(data.openingHours))
          } catch (e) {
            console.error('Error parsing opening hours:', e)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }

  const getNextMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1)
  }

  const isDateAvailable = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Block today and all past dates — same-day bookings are not allowed
    if (date <= today) return false
    // Block next 7 days for tire services with tire purchase (delivery time)
    const hasTirePurchase = isTireService && tireBookingData?.hasTires && (tireBookingData?.selectedTire || tireBookingData?.selectedFrontTire)
    if (hasTirePurchase) {
      const minDeliveryDate = new Date(today)
      minDeliveryDate.setDate(minDeliveryDate.getDate() + 7)
      if (date <= minDeliveryDate) return false
    }
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (vacationDates.includes(dateStr)) return false
    return true
  }

  const isDatePast = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Today counts as "past" for booking purposes (no same-day bookings)
    return date <= today
  }

  const getSlotsForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const slots = []
    const busyTimes = busySlots[dateStr] || []
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    
    let startHour = 8
    let endHour = 18
    
    if (openingHours && openingHours[dayName]) {
      const hours = openingHours[dayName]
      
      if (hours && typeof hours === 'object' && hours.closed === true) {
        return []
      }
      
      if (hours && typeof hours === 'object' && hours.from && hours.to) {
        const fromParts = hours.from.split(':')
        const toParts = hours.to.split(':')
        if (fromParts.length >= 1) startHour = parseInt(fromParts[0])
        if (toParts.length >= 1) endHour = parseInt(toParts[0])
      }
    }
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        const slotMinutes = hour * 60 + minute
        const endMinutes = endHour * 60 // opening hours end in minutes
        
        const totalDur = calculateTotalDuration()
        
        // Check if entire service fits within opening hours
        if (slotMinutes + totalDur > endMinutes) {
          continue // Service would run past closing time
        }
        
        let isFullServicePeriodFree = true
        for (let offset = 0; offset < totalDur; offset += 30) {
          const checkMinutes = slotMinutes + offset
          const checkHour = Math.floor(checkMinutes / 60)
          const checkMinute = checkMinutes % 60
          const checkTimeStr = `${String(checkHour).padStart(2, '0')}:${String(checkMinute).padStart(2, '0')}`
          
          if (busyTimes.includes(checkTimeStr)) {
            isFullServicePeriodFree = false
            break
          }
        }
        
        if (isFullServicePeriodFree) {
          slots.push({ time: timeStr, available: true })
        }
      }
    }
    
    return slots
  }

  const nextMonth = () => {
    const today = new Date()
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    if (newMonth.getTime() <= maxMonth.getTime()) {
      setCurrentMonth(newMonth)
    }
  }

  const prevMonth = () => {
    const today = new Date()
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth)
    }
  }

  // Helper: Does this service involve tire purchase?
  const isTireService = serviceType === 'TIRE_CHANGE' || serviceType === 'MOTORCYCLE_TIRE'

  // Get the selected service subtype from sessionStorage (e.g. 'valve_damage', 'foreign_object')
  const getServiceSubtype = (): string | null => {
    try {
      if (typeof window === 'undefined') return null
      const svcData = sessionStorage.getItem('serviceBookingData')
      if (svcData) {
        const parsed = JSON.parse(svcData)
        const subtypes = ['foreign_object', 'valve_damage']
        return parsed.selectedPackages?.find((p: string) => subtypes.includes(p)) || null
      }
    } catch (e) {}
    return null
  }

  // Get service icon and name
  const getServiceInfo = (serviceType: string) => {
    const serviceMap: Record<string, { icon: JSX.Element, name: string }> = {
      'TIRE_CHANGE': { icon: <Wrench className="w-5 h-5" />, name: 'Reifenwechsel' },
      'WHEEL_CHANGE': { icon: <Package className="w-5 h-5" />, name: 'Räderwechsel' },
      'ALIGNMENT_BOTH': { icon: <SlidersHorizontal className="w-5 h-5" />, name: 'Achsvermessung' },
      'TIRE_REPAIR': { icon: <Wrench className="w-5 h-5" />, name: 'Reifenreparatur' },
      'CLIMATE_SERVICE': { icon: <Cloud className="w-5 h-5" />, name: 'Klimaservice' },
      'MOTORCYCLE_TIRE': { icon: <Wrench className="w-5 h-5" />, name: 'Motorradreifenmontage' },
    }
    // For TIRE_REPAIR, show specific subtype name
    if (serviceType === 'TIRE_REPAIR') {
      const subtype = getServiceSubtype()
      const subtypeLabels: Record<string, string> = {
        'foreign_object': 'Fremdkörper-Entfernung',
        'valve_damage': 'Ventilschaden-Reparatur',
      }
      if (subtype && subtypeLabels[subtype]) {
        return { icon: <Wrench className="w-5 h-5" />, name: subtypeLabels[subtype] }
      }
    }
    return serviceMap[serviceType] || { icon: <Wrench className="w-5 h-5" />, name: serviceType }
  }

  // Get available workshop services (excluding current service, wheel change, and motorcycle)
  const getAvailableServices = () => {
    return availableServices.filter((s: any) => 
      s.serviceType !== serviceType && 
      s.serviceType !== 'WHEEL_CHANGE' && 
      s.serviceType !== 'MOTORCYCLE_TIRE'
    ).slice(0, 3)
  }

  const formatEUR = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents)
  }

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
    if (noise < 68) return 'bg-green-600 text-white'
    if (noise <= 72) return 'bg-yellow-400 text-gray-900'
    return 'bg-red-600 text-white'
  }

  const getNoiseWaves = (noise: number | null | undefined) => {
    if (!noise) return '🔇'
    if (noise < 68) return '🔈'
    if (noise <= 72) return '🔉'
    return '🔊'
  }

  const toggleFavorite = () => {
    if (typeof window !== 'undefined') {
      const savedFavorites = localStorage.getItem('workshop_favorites')
      let favorites: string[] = []
      
      if (savedFavorites) {
        try {
          favorites = JSON.parse(savedFavorites)
        } catch (e) {
          favorites = []
        }
      }
      
      const newFavorites = isFavorite
        ? favorites.filter((id: string) => id !== workshopId)
        : [...favorites, workshopId]
      
      localStorage.setItem('workshop_favorites', JSON.stringify(newFavorites))
      setIsFavorite(newFavorites.includes(workshopId))
    }
  }

  // Load user vehicles
  useEffect(() => {
    const loadVehicles = async () => {
      if (session?.user) {
        setLoadingVehicles(true)
        try {
          const response = await fetch('/api/customer/vehicles')
          if (response.ok) {
            const data = await response.json()
            const userVehicles = data.vehicles || []
            setVehicles(userVehicles)
            
            // Auto-select vehicle from sessionStorage (set by search page)
            // Do NOT blindly auto-select first vehicle - user must explicitly choose
            if (userVehicles.length > 0 && !selectedVehicle) {
              // Check URL param first (from TireStorageCard)
              const urlVehicleId = new URLSearchParams(window.location.search).get('vehicleId')
              if (urlVehicleId && userVehicles.find((v: any) => v.id === urlVehicleId)) {
                console.log('🚗 [WORKSHOP] Using vehicle from URL param:', urlVehicleId)
                setSelectedVehicle(urlVehicleId)
              } else {
              // Check if vehicle was selected from tireBookingData
              const hasTireVehicle = sessionStorage.getItem('tireBookingData')
              if (hasTireVehicle) {
                try {
                  const tireData = JSON.parse(hasTireVehicle)
                  if (tireData.selectedVehicle?.id) {
                    console.log('🚗 [WORKSHOP] Using vehicle from tireBookingData:', tireData.selectedVehicle.id)
                    setSelectedVehicle(tireData.selectedVehicle.id)
                  }
                } catch (e) { /* ignore */ }
              } else {
                // Check serviceBookingData for vehicle selection
                const savedServiceData = sessionStorage.getItem('serviceBookingData')
                if (savedServiceData) {
                  try {
                    const svcData = JSON.parse(savedServiceData)
                    if (svcData.selectedVehicleId) {
                      console.log('🚗 [WORKSHOP] Using vehicle from serviceBookingData:', svcData.selectedVehicleId)
                      setSelectedVehicle(svcData.selectedVehicleId)
                    }
                  } catch (e) { /* ignore */ }
                }
              }
              }
            }
          }
        } catch (error) {
          console.error('Error loading vehicles:', error)
        } finally {
          setLoadingVehicles(false)
        }
      }
    }
    loadVehicles()
  }, [session])

  // Load workshop details
  useEffect(() => {
    const loadWorkshop = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const workshopData = {
        id: workshopId,
        name: searchParams.get('name') || '',
        city: searchParams.get('city') || '',
        distance: parseFloat(searchParams.get('distance') || '0'),
        rating: parseFloat(searchParams.get('rating') || '0'),
        reviewCount: parseInt(searchParams.get('reviewCount') || '0'),
        totalPrice: 0,
        estimatedDuration: parseInt(searchParams.get('duration') || '60'),
        description: '',
      }
      
      const service = searchParams.get('service') || 'WHEEL_CHANGE'
      setServiceType(service)
      
      try {
        const response = await fetch(`/api/workshops/${workshopId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.workshop) {
            // Merge API data into workshopData
            workshopData.street = data.workshop.street || ''
            workshopData.postalCode = data.workshop.postalCode || ''
            workshopData.phone = data.workshop.phone || ''
            workshopData.website = data.workshop.companySettings?.website || ''
            workshopData.logoUrl = data.workshop.logoUrl || ''
            workshopData.heroImage = data.workshop.heroImage || ''
            
            // Check if workshop is small business (Kleinunternehmer)
            if (data.workshop.taxMode === 'KLEINUNTERNEHMER') {
              setIsSmallBusiness(true)
            }
            
            const desc = data.workshop.companySettings?.description
            if (desc && desc.trim()) {
              workshopData.description = desc
            }
            
            if (data.workshop.services) {
              setAvailableServices(data.workshop.services)
              const serviceData = data.workshop.services.find((s: any) => s.serviceType === service)
              
              // TIRE_CHANGE: Use rim-size pricing if available
              if (service === 'TIRE_CHANGE' && data.workshop.tireChangePricing && data.workshop.tireChangePricing.length > 0) {
                const savedTireData = sessionStorage.getItem('tireBookingData')
                let tireCount = 4
                let rimSize: number | null = null
                
                let hasTires = true
                if (savedTireData) {
                  try {
                    const tireData = JSON.parse(savedTireData)
                    tireCount = tireData.tireCount || 4
                    hasTires = tireData.hasTires !== false
                    // Extract rim size from tire dimensions
                    if (tireData.tireDimensions?.diameter) {
                      rimSize = parseInt(tireData.tireDimensions.diameter)
                    } else if (tireData.tireDimensionsFront?.diameter) {
                      rimSize = parseInt(tireData.tireDimensionsFront.diameter)
                    }
                  } catch (e) {}
                }
                
                // Also check sessionStorage for vehicle rim size
                if (!rimSize) {
                  const vehicleData = sessionStorage.getItem('selectedVehicle')
                  if (vehicleData) {
                    try {
                      const vehicle = JSON.parse(vehicleData)
                      if (vehicle.rimSize) rimSize = parseInt(vehicle.rimSize)
                    } catch (e) {}
                  }
                }
                
                const pricingForSize = rimSize 
                  ? data.workshop.tireChangePricing.find((p: any) => p.rimSize === rimSize)
                  : data.workshop.tireChangePricing.sort((a: any, b: any) => a.pricePerTire - b.pricePerTire)[0]
                
                if (pricingForSize) {
                  workshopData.totalPrice = Number(pricingForSize.pricePerTire) * tireCount
                  workshopData.estimatedDuration = pricingForSize.durationPerTire * tireCount
                  
                  // Track mounting-only surcharge for "Nur Montage" (shown as separate line)
                  if (!hasTires && serviceData?.mountingOnlySurcharge) {
                    const mountingSurcharge = Number(serviceData.mountingOnlySurcharge) * tireCount
                    setMountingSurchargeAmount(mountingSurcharge)
                    console.log(`📏 [WORKSHOP] Mounting-only surcharge: ${serviceData.mountingOnlySurcharge}€/tire × ${tireCount} = ${mountingSurcharge}€`)
                  }
                  
                  console.log(`📏 [WORKSHOP] TIRE_CHANGE rim-size pricing: ${rimSize}" → ${pricingForSize.pricePerTire}€/tire × ${tireCount} = ${workshopData.totalPrice}€`)
                } else if (serviceData) {
                  workshopData.totalPrice = serviceData.basePrice || 0
                  workshopData.estimatedDuration = serviceData.durationMinutes || 60
                  // Track mounting-only surcharge for "Nur Montage" (shown as separate line)
                  if (!hasTires && serviceData.mountingOnlySurcharge) {
                    const mountingSurcharge = Number(serviceData.mountingOnlySurcharge) * tireCount
                    setMountingSurchargeAmount(mountingSurcharge)
                    console.log(`📏 [WORKSHOP] Mounting-only surcharge (fallback): ${serviceData.mountingOnlySurcharge}€/tire × ${tireCount} = ${mountingSurcharge}€`)
                  }
                }
              } else if (serviceData && serviceData.servicePackages && serviceData.servicePackages.length > 0) {
                let selectedPackage = null
                
                const savedTireData = sessionStorage.getItem('tireBookingData')
                let isMotoMixed = false
                let pkgHasTires = true
                let pkgTireCount = 4
                if (savedTireData) {
                  try {
                    const tireData = JSON.parse(savedTireData)
                    isMotoMixed = tireData.isMixedTires || false
                    pkgHasTires = tireData.hasTires !== false
                    pkgTireCount = tireData.tireCount || 4
                    if (tireData.selectedPackages && tireData.selectedPackages.length > 0) {
                      const packageType = tireData.selectedPackages[0]
                      selectedPackage = serviceData.servicePackages.find((p: any) => p.packageType === packageType)
                    }
                    if (!selectedPackage && tireData.tireCount) {
                      const packageType = tireData.tireCount === 4 ? 'four_tires' : 'two_tires'
                      selectedPackage = serviceData.servicePackages.find((p: any) => p.packageType === packageType)
                    }
                  } catch (e) {
                    console.error('Error parsing tire booking data:', e)
                  }
                }

                // Also check serviceBookingData for correct package selection (e.g., TIRE_REPAIR: foreign_object vs valve_damage)
                if (!selectedPackage) {
                  const savedServiceBooking = sessionStorage.getItem('serviceBookingData')
                  if (savedServiceBooking) {
                    try {
                      const svcData = JSON.parse(savedServiceBooking)
                      // For WHEEL_CHANGE: skip add-on packages (with_balancing, with_storage, with_washing)
                      // These are surcharges, NOT the base package. They're handled as additionalServices.
                      const wheelChangeAddOns = ['with_balancing', 'with_storage', 'with_washing']
                      if (svcData.selectedPackages && svcData.selectedPackages.length > 0) {
                        for (const pkgType of svcData.selectedPackages) {
                          // Skip WHEEL_CHANGE add-on packages - they should not set the base price
                          if (service === 'WHEEL_CHANGE' && wheelChangeAddOns.includes(pkgType)) {
                            console.log(`⏭️ [WORKSHOP] Skipping WHEEL_CHANGE add-on for base price: ${pkgType}`)
                            continue
                          }
                          const found = serviceData.servicePackages.find((p: any) => p.packageType === pkgType)
                          if (found) {
                            selectedPackage = found
                            console.log(`📦 [WORKSHOP] Selected package from serviceBookingData: ${pkgType}`, found)
                            break
                          }
                        }
                      }
                    } catch (e) {
                      console.error('Error parsing service booking data:', e)
                    }
                  }
                }
                
                // Store the selected package name for display (e.g., "Einstellung beide Achsen" for ALIGNMENT_BOTH)
                if (selectedPackage && selectedPackage.name) {
                  setSelectedPackageName(selectedPackage.name)
                  console.log(`📦 [WORKSHOP] Selected package name: ${selectedPackage.name}`)
                }
                
                // Motorcycle with both tires: sum front + rear package prices
                // Also handle case when no tire data is saved (e.g., "Nur Montage" or sessionStorage empty)
                if (!selectedPackage && (isMotoMixed || service === 'MOTORCYCLE_TIRE') && service === 'MOTORCYCLE_TIRE') {
                  const frontPkg = serviceData.servicePackages.find((p: any) => p.packageType === 'front')
                  const rearPkg = serviceData.servicePackages.find((p: any) => p.packageType === 'rear')
                  if (frontPkg && rearPkg) {
                    const combinedPrice = (frontPkg.price || 0) + (rearPkg.price || 0)
                    const maxDuration = Math.max(frontPkg.durationMinutes || 60, rearPkg.durationMinutes || 60)
                    workshopData.totalPrice = combinedPrice
                    workshopData.estimatedDuration = maxDuration
                  } else {
                    const packageToUse = frontPkg || rearPkg || serviceData.servicePackages[0]
                    workshopData.totalPrice = packageToUse.price || 0
                    workshopData.estimatedDuration = packageToUse.durationMinutes || 60
                  }
                } else {
                  const packageToUse = selectedPackage || serviceData.servicePackages[0]
                  workshopData.totalPrice = packageToUse.price || 0
                  workshopData.estimatedDuration = packageToUse.durationMinutes || 60
                }
                // Track mounting-only surcharge for "Nur Montage" (shown as separate line)
                if (service === 'TIRE_CHANGE' && !pkgHasTires && serviceData.mountingOnlySurcharge) {
                  const mountingSurcharge = Number(serviceData.mountingOnlySurcharge) * pkgTireCount
                  setMountingSurchargeAmount(mountingSurcharge)
                  console.log(`📏 [WORKSHOP] Mounting-only surcharge (packages): ${serviceData.mountingOnlySurcharge}€/tire × ${pkgTireCount} = ${mountingSurcharge}€`)
                }
              } else if (serviceData) {
                workshopData.totalPrice = serviceData.basePrice || 0
                workshopData.estimatedDuration = serviceData.durationMinutes || 60
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading workshop details:', error)
      }
      
      setWorkshop(workshopData)
      setBasePrice(workshopData.totalPrice)
      setBaseDuration(workshopData.estimatedDuration)
      setLoading(false)
    }
    
    loadWorkshop()
  }, [workshopId])

  // Load tire booking data and service booking data
  useEffect(() => {
    const loadBookingData = async () => {
      if (typeof window === 'undefined') return
      
      // If coming from TireStorageCard (fromStorageBookingId in URL), clear stale sessionStorage
      // to prevent old data from overriding the URL params
      const urlCheck = new URLSearchParams(window.location.search)
      if (urlCheck.get('fromStorageBookingId')) {
        sessionStorage.removeItem('additionalServices')
        sessionStorage.removeItem('serviceBookingData')
        sessionStorage.removeItem('tireBookingData')
        console.log('📦 [WORKSHOP] Cleared sessionStorage for TireStorageCard flow')
      }
      
      // Load tire booking data
      const savedData = sessionStorage.getItem('tireBookingData')
      if (savedData) {
        try {
          const data = JSON.parse(savedData)
          console.log('📦 [WORKSHOP] Loaded tire booking data:', {
            hasTires: data.hasTires,
            isMixedTires: data.isMixedTires,
            hasSelectedFrontTire: !!data.selectedFrontTire,
            hasSelectedRearTire: !!data.selectedRearTire,
            hasSelectedTire: !!data.selectedTire
          })
          setTireBookingData(data)
          if (data.selectedVehicle?.id) {
            setSelectedVehicle(data.selectedVehicle.id)
          }
        } catch (e) {
          console.error('Error loading tire booking data:', e)
        }
      }
      
      // Load additional services
      const savedServices = sessionStorage.getItem('additionalServices')
      if (savedServices) {
        try {
          const services = JSON.parse(savedServices)
          setAdditionalServices(services)
        } catch (e) {
          console.error('Error loading additional services:', e)
        }
      }
      
      // Load service booking data (from homepage filters)
      const savedServiceData = sessionStorage.getItem('serviceBookingData')
      if (savedServiceData && availableServices.length > 0) {
        try {
          const serviceData = JSON.parse(savedServiceData)
          console.log('📦 [WORKSHOP] Loaded service booking data:', serviceData)
          
          // If no vehicle set from tireBookingData, try serviceBookingData
          if (!savedData && serviceData.selectedVehicleId) {
            console.log('🚗 [WORKSHOP] Setting vehicle from serviceBookingData:', serviceData.selectedVehicleId)
            setSelectedVehicle(serviceData.selectedVehicleId)
          }
          
          if (serviceData.selectedPackages && serviceData.selectedPackages.length > 0) {
            // Convert selectedPackages (e.g. ['with_balancing', 'with_storage']) to additionalServices
            const servicesFromFilters: any[] = []
            
            // IMPORTANT: Exclude main service packages (two_tires, four_tires, etc.)
            // These are NOT additional services, they define the main service type
            const mainServicePackages = ['two_tires', 'four_tires', 'basic', 'measurement_front', 'measurement_rear', 'measurement_both', 'adjustment_front', 'adjustment_rear', 'adjustment_both', 'full_service', 'foreign_object', 'valve_damage', 'front', 'rear', 'both', 'check', 'comfort', 'premium', 'front_two_tires', 'rear_two_tires', 'mixed_four_tires', 'motorcycle_tire_installation_only', 'with_tire_purchase', 'tire_installation_only']
            
            // For WHEEL_CHANGE, find the basic package price to calculate surcharges
            let wheelChangeBasicPrice = 0
            const currentServiceType = serviceData.serviceName || new URLSearchParams(window.location.search).get('service') || 'WHEEL_CHANGE'
            if (currentServiceType === 'WHEEL_CHANGE') {
              for (const service of availableServices) {
                if (service.serviceType === 'WHEEL_CHANGE') {
                  const basicPkg = service.servicePackages?.find((p: any) => p.packageType === 'basic')
                  if (basicPkg) {
                    wheelChangeBasicPrice = Number(basicPkg.price) || 0
                    console.log('💰 [WORKSHOP] WHEEL_CHANGE basic price for surcharge calc:', wheelChangeBasicPrice)
                  }
                  break
                }
              }
            }
            
            for (const packageType of serviceData.selectedPackages) {
              // Skip main service packages
              if (mainServicePackages.includes(packageType)) {
                console.log(`⏭️ [WORKSHOP] Skipping main service package: ${packageType}`)
                continue
              }
              
              // Handle disposal and runflat as tireBookingData flags (not additional services)
              // Disposal only applies to TIRE_CHANGE and MOTORCYCLE_TIRE, NOT WHEEL_CHANGE
              if (packageType === 'with_disposal' || packageType === 'runflat') {
                if (packageType === 'with_disposal' && currentServiceType !== 'TIRE_CHANGE' && currentServiceType !== 'MOTORCYCLE_TIRE') {
                  console.log(`⏭️ [WORKSHOP] Skipping disposal for non-tire service: ${currentServiceType}`)
                  continue
                }
                console.log(`🔧 [WORKSHOP] Setting tire flag from package: ${packageType}`)
                setTireBookingData((prev: any) => {
                  const updated = { ...(prev || {}), }
                  if (packageType === 'with_disposal') {
                    updated.hasDisposal = true
                    // Find disposal price from workshop services (multiply by tire count)
                    const tCount = updated.tireCount || 4
                    for (const service of availableServices) {
                      if (service.serviceType === currentServiceType && service.disposalFee) {
                        updated.disposalPrice = (Number(service.disposalFee) || 0) * tCount
                        break
                      }
                    }
                  }
                  if (packageType === 'runflat') {
                    updated.hasRunflat = true
                    // Find runflat price from workshop services (multiply by tire count)
                    const rtCount = updated.tireCount || 4
                    for (const service of availableServices) {
                      if (service.serviceType === currentServiceType && service.runflatSurcharge) {
                        updated.runflatPrice = (Number(service.runflatSurcharge) || 0) * rtCount
                        break
                      }
                    }
                  }
                  return updated
                })
                continue
              }
              
              // Map packageType to service info
              let serviceName = ''
              let servicePrice = 0
              
              // Find matching service package in availableServices
              for (const service of availableServices) {
                const pkg = service.servicePackages?.find((p: any) => p.packageType === packageType)
                if (pkg) {
                  serviceName = pkg.name
                  // For WHEEL_CHANGE: use surcharge (package price - basic price)
                  // because the base price already covers the basic service
                  if (currentServiceType === 'WHEEL_CHANGE' && wheelChangeBasicPrice > 0 && 
                      (packageType === 'with_balancing' || packageType === 'with_storage' || packageType === 'with_washing')) {
                    servicePrice = Math.max(0, Number(pkg.price) - wheelChangeBasicPrice)
                    console.log(`💰 [WORKSHOP] WHEEL_CHANGE surcharge for ${packageType}: ${pkg.price} - ${wheelChangeBasicPrice} = ${servicePrice}`)
                  } else {
                    servicePrice = pkg.price
                  }
                  break
                }
              }
              
              // Fallback: Use WorkshopService prices directly (no packages)
              if (!serviceName) {
                const wsService = availableServices.find((s: any) => s.serviceType === currentServiceType)
                if (packageType === 'with_balancing' && wsService?.balancingPrice) {
                  serviceName = 'Auswuchten'
                  servicePrice = Number(wsService.balancingPrice)
                } else if (packageType === 'with_storage' && wsService?.storagePrice) {
                  serviceName = 'Einlagerung'
                  servicePrice = Number(wsService.storagePrice)
                } else if (packageType === 'with_washing' && wsService?.washingPrice) {
                  serviceName = 'Räder waschen'
                  servicePrice = Number(wsService.washingPrice)
                }
              }
              
              if (serviceName) {
                // Map packageType to type for payment page detection
                let serviceTypeTag = ''
                if (packageType === 'with_balancing') serviceTypeTag = 'BALANCING'
                else if (packageType === 'with_storage') serviceTypeTag = 'STORAGE'
                else if (packageType === 'with_washing') serviceTypeTag = 'WASHING'
                
                servicesFromFilters.push({
                  serviceName,
                  packageName: '',
                  name: serviceName,
                  price: servicePrice,
                  duration: 0,
                  type: serviceTypeTag,
                  packageType: packageType
                })
              }
            }
            
            if (servicesFromFilters.length > 0) {
              console.log('✅ [WORKSHOP] Auto-added services from filters:', servicesFromFilters)
              setAdditionalServices(prev => {
                // Merge with existing services, avoid duplicates
                const existing = prev.map(s => s.serviceName || s.name)
                const newServices = servicesFromFilters.filter(s => 
                  !existing.includes(s.serviceName || s.name)
                )
                const merged = [...prev, ...newServices]
                // Save to sessionStorage
                sessionStorage.setItem('additionalServices', JSON.stringify(merged))
                return merged
              })
            }
          }
        } catch (e) {
          console.error('Error loading service booking data:', e)
        }
      }

      // Auto-add balancing/storage from URL params (TireStorageCard flow)
      const urlParams = new URLSearchParams(window.location.search)
      const urlBalancing = urlParams.get('balancing') === 'true'
      const urlStorage = urlParams.get('storage') === 'true'
      if (urlBalancing || urlStorage) {
        const servicesFromUrl: any[] = []
        const currentServiceType = urlParams.get('service') || serviceType || 'WHEEL_CHANGE'
        let wheelChangeBasicPrice = 0
        for (const svc of availableServices) {
          if (svc.serviceType === currentServiceType) {
            const basicPkg = svc.servicePackages?.find((p: any) => p.packageType === 'basic' || p.packageType === 'four_tires')
            if (basicPkg) wheelChangeBasicPrice = Number(basicPkg.price) || 0
            break
          }
        }
        if (urlBalancing) {
          let name = 'Auswuchten', price = 0
          for (const svc of availableServices) {
            const pkg = svc.servicePackages?.find((p: any) => p.packageType === 'with_balancing')
            if (pkg) { name = pkg.name || 'Auswuchten'; price = wheelChangeBasicPrice > 0 ? Math.max(0, Number(pkg.price) - wheelChangeBasicPrice) : Number(pkg.price); break }
          }
          if (price === 0) {
            const wsService = availableServices.find((s: any) => s.serviceType === currentServiceType)
            if (wsService?.balancingPrice) price = Number(wsService.balancingPrice)
          }
          servicesFromUrl.push({ serviceName: name, name, price, duration: 0, type: 'BALANCING', packageType: 'with_balancing', packageName: '' })
        }
        if (urlStorage) {
          let name = 'Einlagerung', price = 0
          for (const svc of availableServices) {
            const pkg = svc.servicePackages?.find((p: any) => p.packageType === 'with_storage')
            if (pkg) { name = pkg.name || 'Einlagerung'; price = wheelChangeBasicPrice > 0 ? Math.max(0, Number(pkg.price) - wheelChangeBasicPrice) : Number(pkg.price); break }
          }
          if (price === 0) {
            const wsService = availableServices.find((s: any) => s.serviceType === currentServiceType)
            if (wsService?.storagePrice) price = Number(wsService.storagePrice)
          }
          servicesFromUrl.push({ serviceName: name, name, price, duration: 0, type: 'STORAGE', packageType: 'with_storage', packageName: '' })
        }
        if (servicesFromUrl.length > 0) {
          console.log('📦 [WORKSHOP] Auto-added services from URL params:', servicesFromUrl)
          setAdditionalServices(prev => {
            const existing = prev.map(s => s.type)
            const newSvcs = servicesFromUrl.filter(s => !existing.includes(s.type))
            if (newSvcs.length === 0) return prev
            const merged = [...prev, ...newSvcs]
            sessionStorage.setItem('additionalServices', JSON.stringify(merged))
            return merged
          })
        }
      }
    }
    
    if (availableServices.length > 0) {
      loadBookingData()
    }
  }, [availableServices])

  // Reload booking data when URL timestamp changes (user clicked workshop again after changing filters)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const urlTimestamp = searchParams.get('t')
    
    if (urlTimestamp && availableServices.length > 0) {
      const timestamp = parseInt(urlTimestamp)
      if (timestamp > lastLoadTimestamp) {
        console.log('🔄 [WORKSHOP] URL timestamp changed, reloading booking data...')
        setLastLoadTimestamp(timestamp)
        
        // Reload booking data from sessionStorage
        const loadBookingData = async () => {
          if (typeof window === 'undefined') return
          
          // Clear previous additional services
          setAdditionalServices([])
          
          // IMPORTANT: Reload tire booking data first!
          const savedTireData = sessionStorage.getItem('tireBookingData')
          if (savedTireData) {
            try {
              const data = JSON.parse(savedTireData)
              console.log('🔄 [WORKSHOP] Reloaded tire booking data:', {
                hasTires: data.hasTires,
                isMixedTires: data.isMixedTires,
                hasSelectedFrontTire: !!data.selectedFrontTire,
                hasSelectedRearTire: !!data.selectedRearTire,
                hasSelectedTire: !!data.selectedTire
              })
              setTireBookingData(data)
              if (data.selectedVehicle?.id) {
                setSelectedVehicle(data.selectedVehicle.id)
              }
            } catch (e) {
              console.error('Error reloading tire booking data:', e)
            }
          }
          
          // Load service booking data (from homepage filters)
          const savedServiceData = sessionStorage.getItem('serviceBookingData')
          if (savedServiceData && availableServices.length > 0) {
            try {
              const serviceData = JSON.parse(savedServiceData)
              console.log('📦 [WORKSHOP] Reloaded service booking data:', serviceData)
              
              // If no vehicle from tireBookingData, try serviceBookingData
              if (!savedTireData && serviceData.selectedVehicleId) {
                console.log('🚗 [WORKSHOP] Setting vehicle from serviceBookingData (reload):', serviceData.selectedVehicleId)
                setSelectedVehicle(serviceData.selectedVehicleId)
              }
              
              if (serviceData.selectedPackages && serviceData.selectedPackages.length > 0) {
                // Convert selectedPackages to additionalServices
                const servicesFromFilters: any[] = []
                
                const mainServicePackages = ['two_tires', 'four_tires', 'basic', 'measurement_front', 'measurement_rear', 'measurement_both', 'adjustment_front', 'adjustment_rear', 'adjustment_both', 'full_service', 'foreign_object', 'valve_damage', 'front', 'rear', 'both', 'check', 'comfort', 'premium', 'front_two_tires', 'rear_two_tires', 'mixed_four_tires', 'motorcycle_tire_installation_only', 'with_tire_purchase', 'tire_installation_only']
                
                // For WHEEL_CHANGE, find the basic package price to calculate surcharges
                let wheelChangeBasicPrice = 0
                const currentServiceType = serviceData.serviceName || new URLSearchParams(window.location.search).get('service') || 'WHEEL_CHANGE'
                if (currentServiceType === 'WHEEL_CHANGE') {
                  for (const service of availableServices) {
                    if (service.serviceType === 'WHEEL_CHANGE') {
                      const basicPkg = service.servicePackages?.find((p: any) => p.packageType === 'basic')
                      if (basicPkg) {
                        wheelChangeBasicPrice = Number(basicPkg.price) || 0
                      }
                      break
                    }
                  }
                }
                
                for (const packageType of serviceData.selectedPackages) {
                  if (mainServicePackages.includes(packageType)) {
                    console.log(`⏭️ [WORKSHOP] Skipping main service package: ${packageType}`)
                    continue
                  }
                  
                  // Handle disposal and runflat as tireBookingData flags (not additional services)
                  // Disposal only applies to TIRE_CHANGE and MOTORCYCLE_TIRE, NOT WHEEL_CHANGE
                  if (packageType === 'with_disposal' || packageType === 'runflat') {
                    if (packageType === 'with_disposal' && currentServiceType !== 'TIRE_CHANGE' && currentServiceType !== 'MOTORCYCLE_TIRE') {
                      console.log(`⏭️ [WORKSHOP] Skipping disposal for non-tire service (reload): ${currentServiceType}`)
                      continue
                    }
                    console.log(`🔧 [WORKSHOP] Setting tire flag from package (reload): ${packageType}`)
                    setTireBookingData((prev: any) => {
                      const updated = { ...(prev || {}), }
                      if (packageType === 'with_disposal') {
                        updated.hasDisposal = true
                        const tCount = updated.tireCount || 4
                        for (const service of availableServices) {
                          if (service.serviceType === currentServiceType && service.disposalFee) {
                            updated.disposalPrice = (Number(service.disposalFee) || 0) * tCount
                            break
                          }
                        }
                      }
                      if (packageType === 'runflat') {
                        updated.hasRunflat = true
                        const rtCount = updated.tireCount || 4
                        for (const service of availableServices) {
                          if (service.serviceType === currentServiceType && service.runflatSurcharge) {
                            updated.runflatPrice = (Number(service.runflatSurcharge) || 0) * rtCount
                            break
                          }
                        }
                      }
                      return updated
                    })
                    continue
                  }
                  
                  let serviceName = ''
                  let servicePrice = 0
                  
                  for (const service of availableServices) {
                    const pkg = service.servicePackages?.find((p: any) => p.packageType === packageType)
                    if (pkg) {
                      serviceName = pkg.name
                      // For WHEEL_CHANGE: use surcharge (package price - basic price)
                      if (currentServiceType === 'WHEEL_CHANGE' && wheelChangeBasicPrice > 0 && 
                          (packageType === 'with_balancing' || packageType === 'with_storage' || packageType === 'with_washing')) {
                        servicePrice = Math.max(0, Number(pkg.price) - wheelChangeBasicPrice)
                      } else {
                        servicePrice = pkg.price
                      }
                      break
                    }
                  }
                  
                  if (!serviceName) {
                    const wsService = availableServices.find((s: any) => s.serviceType === currentServiceType)
                    if (packageType === 'with_balancing' && wsService?.balancingPrice) {
                      serviceName = 'Auswuchten'
                      servicePrice = Number(wsService.balancingPrice)
                    } else if (packageType === 'with_storage' && wsService?.storagePrice) {
                      serviceName = 'Einlagerung'
                      servicePrice = Number(wsService.storagePrice)
                    } else if (packageType === 'with_washing' && wsService?.washingPrice) {
                      serviceName = 'Räder waschen'
                      servicePrice = Number(wsService.washingPrice)
                    }
                  }
                  
                  if (serviceName) {
                    // Map packageType to type for payment page detection
                    let serviceTypeTag = ''
                    if (packageType === 'with_balancing') serviceTypeTag = 'BALANCING'
                    else if (packageType === 'with_storage') serviceTypeTag = 'STORAGE'
                    else if (packageType === 'with_washing') serviceTypeTag = 'WASHING'
                    
                    servicesFromFilters.push({
                      serviceName,
                      packageName: '',
                      name: serviceName,
                      price: servicePrice,
                      duration: 0,
                      type: serviceTypeTag,
                      packageType: packageType
                    })
                  }
                }
                
                if (servicesFromFilters.length > 0) {
                  console.log('✅ [WORKSHOP] Reloaded services from filters:', servicesFromFilters)
                  setAdditionalServices(servicesFromFilters)
                  sessionStorage.setItem('additionalServices', JSON.stringify(servicesFromFilters))
                }
              }
            } catch (e) {
              console.error('Error reloading service booking data:', e)
            }
          }
        }
        
        loadBookingData()
      }
    }
  }, [availableServices, lastLoadTimestamp])

  // Check if customer is business customer
  useEffect(() => {
    const checkBusinessCustomer = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/profile')
          if (response.ok) {
            const data = await response.json()
            if (data.customerType === 'BUSINESS') {
              setIsBusinessCustomer(true)
            }
          }
        } catch (error) {
          console.error('Error checking business customer:', error)
        }
      }
    }
    checkBusinessCustomer()
  }, [session])

  // Load favorites
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFavorites = localStorage.getItem('workshop_favorites')
      if (savedFavorites) {
        try {
          const favorites = JSON.parse(savedFavorites)
          setIsFavorite(favorites.includes(workshopId))
        } catch (e) {
          console.error('Error loading favorites:', e)
        }
      }
    }
  }, [workshopId])

  // Close user menu on outside click
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

  const handleAdditionalServicesSelected = (services: any[]) => {
    // Keep existing BALANCING and STORAGE services (from package filters)
    // Only replace non-BALANCING/STORAGE services (from the modal)
    const existingCoreServices = additionalServices.filter(
      s => s.type === 'BALANCING' || s.type === 'STORAGE'
    )
    const merged = [...existingCoreServices, ...services]
    setAdditionalServices(merged)
    // Reset date/time selection since duration changed
    setSelectedDate(null)
    setSelectedSlot(null)
    // Save to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('additionalServices', JSON.stringify(merged))
    }
  }

  const removeAdditionalService = (index: number) => {
    const updated = additionalServices.filter((_, i) => i !== index)
    setAdditionalServices(updated)
    // Reset date/time selection since duration changed
    setSelectedDate(null)
    setSelectedSlot(null)
    // Update sessionStorage
    if (typeof window !== 'undefined') {
      if (updated.length > 0) {
        sessionStorage.setItem('additionalServices', JSON.stringify(updated))
      } else {
        sessionStorage.removeItem('additionalServices')
      }
    }
  }

  const removeEmojis = (text: string) => {
    // Remove emojis and icons from service names
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
  }

  const calculateTotalPrice = () => {
    let total = basePrice
    
    // Add mounting-only surcharge (tracked separately for display)
    total += mountingSurchargeAmount
    
    // Add tire prices
    if (tireBookingData?.isMixedTires) {
      // Mixed tires: sum front and rear
      if (tireBookingData?.selectedFrontTire?.totalPrice) {
        total += tireBookingData.selectedFrontTire.totalPrice
      } else if (tireBookingData?.selectedFrontTire) {
        total += (tireBookingData.selectedFrontTire.pricePerTire * tireBookingData.selectedFrontTire.quantity)
      }
      
      if (tireBookingData?.selectedRearTire?.totalPrice) {
        total += tireBookingData.selectedRearTire.totalPrice
      } else if (tireBookingData?.selectedRearTire) {
        total += (tireBookingData.selectedRearTire.pricePerTire * tireBookingData.selectedRearTire.quantity)
      }
    } else if (tireBookingData?.selectedTire?.totalPrice) {
      // Standard tires: single tire type
      total += tireBookingData.selectedTire.totalPrice
    }
    
    if (tireBookingData?.hasDisposal && tireBookingData?.disposalPrice) {
      total += tireBookingData.disposalPrice
    }
    if (tireBookingData?.hasRunflat && tireBookingData?.runflatPrice) {
      total += tireBookingData.runflatPrice
    }
    additionalServices.forEach(service => {
      total += service.price
    })
    
    // If workshop is normal (not small business) and customer is business customer, show net price
    if (!isSmallBusiness && isBusinessCustomer) {
      return total / 1.19 // Remove VAT
    }
    
    return total
  }

  const getTaxLabel = () => {
    if (isSmallBusiness) {
      return 'gemäß §19 UStG wird die MwSt. nicht ausgewiesen'
    }
    if (isBusinessCustomer) {
      return 'zzgl. MwSt.'
    }
    return 'inkl. MwSt.'
  }

  const calculateTotalDuration = () => {
    let total = baseDuration
    additionalServices.forEach(service => {
      total += service.duration
    })
    return total
  }

  const handleDateClick = (date: Date | null) => {
    if (!date || isDatePast(date) || !isDateAvailable(date)) return
    setSelectedDate(date)
    setSelectedSlot(null)
    
    // Scroll to time slots section
    setTimeout(() => {
      document.getElementById('time-slots-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot)
    
    // Scroll to top to see sticky bar completely
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const canBook = selectedDate && selectedSlot && selectedVehicle

  const handleBooking = () => {
    if (!canBook) return
    
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)
    
    const bookingData = {
      workshop: {
        id: workshopId,
        name: workshop.name,
        city: workshop.city,
        distance: workshop.distance,
        rating: workshop.rating,
        reviewCount: workshop.reviewCount,
      },
      service: {
        type: serviceType,
        basePrice: basePrice,
        baseDuration: baseDuration,
        // Include service subtype from serviceBookingData (e.g. 'foreign_object', 'valve_damage' for TIRE_REPAIR)
        subtype: (() => {
          try {
            const svcData = sessionStorage.getItem('serviceBookingData')
            if (svcData) {
              const parsed = JSON.parse(svcData)
              const mainPkgs = ['foreign_object', 'valve_damage', 'basic', 'comfort', 'premium', 'check', 'front', 'rear', 'both', 'two_tires', 'four_tires', 'with_tire_purchase', 'tire_installation_only', 'measurement_front', 'measurement_rear', 'measurement_both', 'adjustment_front', 'adjustment_rear', 'adjustment_both', 'full_service']
              return parsed.selectedPackages?.find((p: string) => mainPkgs.includes(p)) || null
            }
          } catch (e) {}
          return null
        })(),
      },
      additionalServices: additionalServices,
      tireBooking: tireBookingData || null,
      vehicle: selectedVehicleData ? {
        id: selectedVehicleData.id,
        make: selectedVehicleData.make,
        model: selectedVehicleData.model,
        year: selectedVehicleData.year,
        licensePlate: selectedVehicleData.licensePlate,
      } : null,
      appointment: {
        date: dateStr,
        time: selectedSlot.time,
      },
      pricing: {
        servicePrice: basePrice + mountingSurchargeAmount,
        tirePrice: tireBookingData?.isMixedTires
          ? (tireBookingData?.selectedFrontTire?.totalPrice || (tireBookingData?.selectedFrontTire?.pricePerTire * tireBookingData?.selectedFrontTire?.quantity) || 0) +
            (tireBookingData?.selectedRearTire?.totalPrice || (tireBookingData?.selectedRearTire?.pricePerTire * tireBookingData?.selectedRearTire?.quantity) || 0)
          : (tireBookingData?.selectedTire?.totalPrice || 0),
        disposalPrice: tireBookingData?.hasDisposal ? (tireBookingData?.disposalPrice || 0) : 0,
        runflatPrice: tireBookingData?.hasRunflat ? (tireBookingData?.runflatPrice || 0) : 0,
        additionalServicesPrice: additionalServices.reduce((sum, s) => sum + s.price, 0),
        totalPrice: calculateTotalPrice(),
      },
      timestamp: Date.now(),
    }
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
    
    // Forward fromStorageBookingId from URL if present (from TireStorageCard)
    const urlParams = new URLSearchParams(window.location.search)
    const fsbi = urlParams.get('fromStorageBookingId')
    const paymentUrl = `/workshop/${workshopId}/payment?date=${dateStr}&time=${selectedSlot.time}&vehicleId=${selectedVehicle}${fsbi ? `&fromStorageBookingId=${fsbi}` : ''}`
    
    if (session) {
      router.push(paymentUrl)
    } else {
      router.push(`/login?redirect=${encodeURIComponent(paymentUrl)}`)
    }
  }

  if (loading || !workshop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Build structured data for this workshop (AutoRepair / LocalBusiness)
  const workshopStructuredData = (() => {
    const base: any = {
      '@context': 'https://schema.org',
      '@type': ['AutoRepair', 'LocalBusiness'],
      '@id': `https://bereifung24.de/workshop/${workshopId}`,
      name: workshop.name,
      url: `https://bereifung24.de/workshop/${workshopId}`,
      image: workshop.logoUrl || 'https://bereifung24.de/logos/B24_Logo.png',
      description: workshop.description || `${workshop.name} – Geprüfte Werkstatt auf Bereifung24. Reifenservice mit Festpreisgarantie.`,
      telephone: workshop.phone || undefined,
      priceRange: '€€',
      currenciesAccepted: 'EUR',
      paymentAccepted: 'Cash, Credit Card, EC Card',
      isAccessibleForFree: false,
    }

    // Address
    if (workshop.city || workshop.street || workshop.postalCode) {
      base.address = {
        '@type': 'PostalAddress',
        streetAddress: workshop.street || undefined,
        postalCode: workshop.postalCode || undefined,
        addressLocality: workshop.city || undefined,
        addressCountry: 'DE',
      }
    }

    // Geo coordinates (from Google Maps link if available)
    if (workshop.latitude && workshop.longitude) {
      base.geo = {
        '@type': 'GeoCoordinates',
        latitude: workshop.latitude,
        longitude: workshop.longitude,
      }
    }

    // AggregateRating from real reviews
    if (workshop.rating > 0 && workshop.reviewCount > 0) {
      base.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: workshop.rating.toFixed(1),
        bestRating: '5',
        worstRating: '1',
        ratingCount: String(workshop.reviewCount),
      }
    }

    // Services as offers
    if (availableServices.length > 0) {
      const allPrices = availableServices
        .flatMap((s: any) => {
          const prices = [s.basePrice]
          if (s.servicePackages) {
            s.servicePackages.forEach((p: any) => prices.push(p.price))
          }
          return prices
        })
        .filter((p: number) => p > 0)

      if (allPrices.length > 0) {
        base.makesOffer = {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice: Math.min(...allPrices).toFixed(2),
          highPrice: Math.max(...allPrices).toFixed(2),
          offerCount: String(allPrices.length),
        }
      }
    }

    // Parent organization
    base.parentOrganization = {
      '@type': 'Organization',
      '@id': 'https://bereifung24.de/#organization',
      name: 'Bereifung24',
      url: 'https://bereifung24.de',
    }

    return base
  })()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data: AutoRepair / LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(workshopStructuredData) }}
      />

      {/* Compact Navigation */}
      <nav className="bg-primary-600 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white hidden sm:inline">Zurück zur Suche</span>
            </Link>
            
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <img
                src="/logos/B24_Logo_weiss.png"
                alt="Bereifung24"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : session ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{session.user?.name || 'Konto'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Anmelden
                </button>
              )}

              {/* User Dropdown Menu (kept from original) */}
              {showUserMenu && session && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-gray-500">{session.user?.email}</p>
                  </div>
                  
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
                    href="/dashboard/customer/bookings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Calendar className="w-4 h-4" />
                    Buchungen
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
                  
                  <button
                    onClick={async () => {
                      setShowUserMenu(false)
                      try {
                        const cookieConsent = localStorage.getItem('cookieConsent')
                        const bereifung24Consent = localStorage.getItem('bereifung24_cookie_consent')
                        const bereifung24ConsentDate = localStorage.getItem('bereifung24_cookie_consent_date')
                        await signOut({ redirect: false })
                        await fetch('/api/logout', { method: 'POST', credentials: 'include' })
                        localStorage.clear()
                        sessionStorage.clear()
                        if (cookieConsent) localStorage.setItem('cookieConsent', cookieConsent)
                        if (bereifung24Consent) localStorage.setItem('bereifung24_cookie_consent', bereifung24Consent)
                        if (bereifung24ConsentDate) localStorage.setItem('bereifung24_cookie_consent_date', bereifung24ConsentDate)
                      } catch (error) {
                        console.error('[LOGOUT] Error:', error)
                        localStorage.clear()
                        sessionStorage.clear()
                      }
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
          </div>
        </div>
      </nav>

      {/* Main Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workshop Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Workshop Hero Image / Fallback */}
              {workshop.heroImage ? (
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={workshop.heroImage}
                    alt={workshop.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay with workshop name */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <p className="text-lg font-semibold text-white drop-shadow-lg">{workshop.name}</p>
                  </div>
                </div>
              ) : workshop.logoUrl ? (
                <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={workshop.logoUrl}
                      alt={workshop.name}
                      className="max-h-24 max-w-[200px] object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Wrench className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p className="text-lg font-semibold opacity-75">{workshop.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Workshop Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{workshop.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {workshop.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">{workshop.rating.toFixed(1)}</span>
                          {workshop.reviewCount > 0 && (
                            <span className="text-gray-500">({workshop.reviewCount})</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{workshop.city} · {workshop.distance.toFixed(1)} km</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={toggleFavorite}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>

                {/* Available Services */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">🔧 Zusätzliche Services</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {getAvailableServices().map((service) => {
                      const info = getServiceInfo(service.serviceType)
                      return (
                        <div key={service.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="text-primary-600 text-lg">{info.icon}</div>
                          <span>{info.name}</span>
                        </div>
                      )
                    })}
                    {getAvailableServices().length === 0 && (
                      <p className="text-sm text-gray-500 col-span-3">Keine weiteren Services verfügbar</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Workshop Description */}
            {workshop.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Über die Werkstatt</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {workshop.description}
                </p>
              </div>
            )}

            {/* Selected Service Info */}
            {(tireBookingData || additionalServices.length > 0 || serviceType) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">🔧 Gewählter Service</h2>
                
                <div className="space-y-4">
                  {/* Service Type */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Serviceart</p>
                    <p className="text-base font-semibold text-gray-900">
                      {serviceType === 'MOTORCYCLE_TIRE' && tireBookingData?.isMixedTires
                        ? `Motorradreifenmontage${tireBookingData?.selectedFrontTire && tireBookingData?.selectedRearTire ? ' (Vorder- & Hinterreifen)' : tireBookingData?.selectedFrontTire ? ' (Vorderreifen)' : ' (Hinterreifen)'}`
                        : serviceType === 'TIRE_CHANGE' && tireBookingData?.tireCount
                        ? `Reifenwechsel für ${tireBookingData.tireCount} Reifen`
                        : getServiceInfo(serviceType).name
                      }
                    </p>
                    {/* Show selected package name for ALIGNMENT_BOTH, CLIMATE_SERVICE etc. */}
                    {selectedPackageName && (
                      <p className="text-sm text-primary-600 font-medium mt-1">
                        {selectedPackageName}
                      </p>
                    )}
                    
                    {/* Additional services for tire services */}
                    {isTireService && (tireBookingData?.hasDisposal || tireBookingData?.hasRunflat) && (
                      <div className="mt-3 space-y-1">
                        {tireBookingData?.hasDisposal && (
                          <p className="text-sm text-gray-600">+ Reifenentsorgung</p>
                        )}
                        {tireBookingData?.hasRunflat && (
                          <p className="text-sm text-gray-600">+ Runflatzuschlag</p>
                        )}
                      </div>
                    )}
                    
                    {/* Additional services from modal (for all service types) */}
                    {additionalServices.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {additionalServices.map((service, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            {removeEmojis((service.serviceName || service.name || '').replace(/^Mit /, ''))}{service.packageName && service.packageName !== (service.serviceName || service.name) ? ` (${service.packageName})` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tire Details - Show for tire services */}
                  {isTireService && (tireBookingData?.selectedTire || tireBookingData?.isMixedTires) && (
                    <>
                      {/* Mixed Tires: Show Front and Rear separately */}
                      {tireBookingData?.isMixedTires && (tireBookingData?.selectedFrontTire || tireBookingData?.selectedRearTire) ? (
                        <>
                          {/* Front Tires */}
                          {tireBookingData?.selectedFrontTire && (
                            <div className="pb-4 border-b border-gray-200 mb-4">
                              <p className="text-sm text-gray-600 mb-2">🔹 Vorderachse</p>
                              <p className="text-base font-semibold text-gray-900">
                                {tireBookingData.selectedFrontTire.quantity || 1}x {tireBookingData.selectedFrontTire.tire?.brand || tireBookingData.selectedFrontTire.brand}
                                {(tireBookingData.selectedFrontTire.tire?.model || tireBookingData.selectedFrontTire.model) && ` ${tireBookingData.selectedFrontTire.tire?.model || tireBookingData.selectedFrontTire.model}`}
                                {' '}
                                {tireBookingData.tireDimensionsFront
                                  ? (typeof tireBookingData.tireDimensionsFront === 'string'
                                      ? tireBookingData.tireDimensionsFront
                                      : `${tireBookingData.tireDimensionsFront.width}/${tireBookingData.tireDimensionsFront.height} R${tireBookingData.tireDimensionsFront.diameter}`)
                                  : null
                                }
                                {(tireBookingData.selectedFrontTire.tire?.loadIndex || tireBookingData.selectedFrontTire.tire?.speedIndex) && (
                                  <span>
                                    {' '}{tireBookingData.selectedFrontTire.tire?.loadIndex || ''}{tireBookingData.selectedFrontTire.tire?.speedIndex || ''}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-primary-600 font-semibold mt-2">
                                {formatEUR(tireBookingData.selectedFrontTire.totalPrice || (tireBookingData.selectedFrontTire.pricePerTire * (tireBookingData.selectedFrontTire.quantity || 1)))}
                              </p>
                            </div>
                          )}

                          {/* Rear Tires */}
                          {tireBookingData?.selectedRearTire && (
                            <div className="pb-4 border-b border-gray-200">
                              <p className="text-sm text-gray-600 mb-2">🔸 Hinterachse</p>
                              <p className="text-base font-semibold text-gray-900">
                                {tireBookingData.selectedRearTire.quantity || 1}x {tireBookingData.selectedRearTire.tire?.brand || tireBookingData.selectedRearTire.brand}
                                {(tireBookingData.selectedRearTire.tire?.model || tireBookingData.selectedRearTire.model) && ` ${tireBookingData.selectedRearTire.tire?.model || tireBookingData.selectedRearTire.model}`}
                                {' '}
                                {tireBookingData.tireDimensionsRear
                                  ? (typeof tireBookingData.tireDimensionsRear === 'string'
                                      ? tireBookingData.tireDimensionsRear
                                      : `${tireBookingData.tireDimensionsRear.width}/${tireBookingData.tireDimensionsRear.height} R${tireBookingData.tireDimensionsRear.diameter}`)
                                  : null
                                }
                                {(tireBookingData.selectedRearTire.tire?.loadIndex || tireBookingData.selectedRearTire.tire?.speedIndex) && (
                                  <span>
                                    {' '}{tireBookingData.selectedRearTire.tire?.loadIndex || ''}{tireBookingData.selectedRearTire.tire?.speedIndex || ''}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-primary-600 font-semibold mt-2">
                                {formatEUR(tireBookingData.selectedRearTire.totalPrice || (tireBookingData.selectedRearTire.pricePerTire * (tireBookingData.selectedRearTire.quantity || 1)))}
                              </p>
                            </div>
                          )}
                        </>
                      ) : tireBookingData?.selectedTire && (
                        <>
                          {/* Standard Tires (non-mixed) */}
                          <div className="pb-4 border-b border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Ausgewählte Reifen</p>
                            
                            {/* Brand, Model and Full Specs in one line */}
                            <p className="text-base font-semibold text-gray-900">
                              {tireBookingData?.tireCount && `${tireBookingData.tireCount}x `}
                              {tireBookingData.selectedTire.brand}
                              {tireBookingData.selectedTire.model && ` ${tireBookingData.selectedTire.model}`}
                              {/* Dimension */}
                              {(tireBookingData.tireDimensions || tireBookingData.selectedTire.dimension) && (
                                <span>
                                  {' '}
                                  {tireBookingData.tireDimensions 
                                    ? `${tireBookingData.tireDimensions.width}/${tireBookingData.tireDimensions.height} R${tireBookingData.tireDimensions.diameter}`
                                    : tireBookingData.selectedTire.dimension
                                  }
                                </span>
                              )}
                              {/* Load and Speed Index */}
                              {((tireBookingData.tireDimensions?.loadIndex || tireBookingData.selectedTire.loadIndex) ||
                                (tireBookingData.tireDimensions?.speedIndex || tireBookingData.selectedTire.speedIndex)) && (
                                <span>
                                  {' '}
                                  {tireBookingData.tireDimensions?.loadIndex || tireBookingData.selectedTire.loadIndex || ''}
                                  {tireBookingData.tireDimensions?.speedIndex || tireBookingData.selectedTire.speedIndex || ''}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* EU Labels */}
                          {(tireBookingData.selectedTire.fuelEfficiency || tireBookingData.selectedTire.wetGrip || tireBookingData.selectedTire.noise) && (
                            <div>
                              <p className="text-sm text-gray-600 mb-3">EU-Reifenlabel</p>
                              <div className="grid grid-cols-3 gap-3">
                                {/* Fuel Efficiency */}
                                {tireBookingData.selectedTire.fuelEfficiency && (
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-2">Kraftstoff-<br />effizienz</p>
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded font-bold text-lg ${getLabelColor(tireBookingData.selectedTire.fuelEfficiency)}`}>
                                      {tireBookingData.selectedTire.fuelEfficiency}
                                    </div>
                                  </div>
                                )}

                                {/* Wet Grip */}
                                {tireBookingData.selectedTire.wetGrip && (
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-2">Nasshaftung</p>
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded font-bold text-lg ${getLabelColor(tireBookingData.selectedTire.wetGrip)}`}>
                                      {tireBookingData.selectedTire.wetGrip}
                                    </div>
                                  </div>
                                )}

                                {/* Noise */}
                                {tireBookingData.selectedTire.noise && (
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-2">Geräusch</p>
                                    <div className={`inline-flex items-center justify-center px-2 h-10 rounded font-bold text-base ${getNoiseColor(tireBookingData.selectedTire.noise)}`}>
                                      <span className="mr-1">{getNoiseWaves(tireBookingData.selectedTire.noise)}</span>
                                      <span className="text-xs">{tireBookingData.selectedTire.noise}dB</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Additional Services */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">➕ Zusätzliche Services</h2>
              <button
                onClick={() => setShowServicesModal(true)}
                disabled={!!selectedDate}
                className={`w-full px-4 py-3 border-2 border-dashed rounded-lg transition-all text-sm font-medium ${
                  selectedDate
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                <Plus className="w-5 h-5 inline-block mr-2" />
                Services auswählen
              </button>
              {selectedDate && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Bitte zuerst den Termin zurücksetzen, um weitere Services hinzuzufügen. Die Gesamtdauer beeinflusst die verfügbaren Zeitfenster.
                </p>
              )}
              
              {additionalServices.filter(service => {
                // For WHEEL_CHANGE, exclude balancing, storage, and washing (they're additional LEISTUNGEN, not SERVICES)
                const serviceName = (service.serviceName || service.name || '').toLowerCase()
                if (serviceType === 'WHEEL_CHANGE') {
                  return !serviceName.includes('auswuchten') && !serviceName.includes('einlager') && !serviceName.includes('waschen')
                }
                return true
              }).length > 0 && (
                <div className="mt-4 space-y-2">
                  {additionalServices
                    .filter(service => {
                      // For WHEEL_CHANGE, exclude balancing, storage, and washing (they're additional LEISTUNGEN, not SERVICES)
                      const serviceName = (service.serviceName || service.name || '').toLowerCase()
                      if (serviceType === 'WHEEL_CHANGE') {
                        return !serviceName.includes('auswuchten') && !serviceName.includes('einlager') && !serviceName.includes('waschen')
                      }
                      return true
                    })
                    .map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{removeEmojis((service.serviceName || service.name || '').replace(/^Mit /, ''))}</span>
                        {service.packageName && service.packageName !== (service.serviceName || service.name) && (
                          <span className="text-xs text-gray-500 ml-2">({service.packageName})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-primary-600">{formatEUR(service.price)}</span>
                        <button
                          onClick={() => removeAdditionalService(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                          title="Service entfernen"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar Section - Desktop Only */}
            <div id="calendar-section" className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📅 Verfügbare Termine</h2>
              <p className="text-sm text-gray-600 mb-4">Wählen Sie einen verfügbaren Termin für Ihren Service</p>
              
              {/* Two Months Side by Side */}
              <div className="grid grid-cols-2 gap-6">
                {/* Current Month */}
                <div>
                  <div className="text-center mb-3">
                    <span className="text-sm font-semibold">
                      {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Calendar Grid for Current Month */}
                  <div className="mb-3">
                    <div className="grid grid-cols-7 gap-1">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                          {day}
                        </div>
                      ))}
                      {getDaysInMonth(currentMonth).map((date, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleDateClick(date)}
                          disabled={!date || isDatePast(date) || !isDateAvailable(date)}
                          className={`
                            aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all
                            ${!date ? 'invisible' : ''}
                            ${isDatePast(date) ? 'text-gray-300 cursor-not-allowed' : ''}
                            ${isDateAvailable(date) ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer font-semibold' : ''}
                            ${!isDateAvailable(date) && !isDatePast(date) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                            ${selectedDate && date && selectedDate.toDateString() === date.toDateString() ? 'ring-2 ring-primary-500 bg-primary-100' : ''}
                          `}
                        >
                          {date ? date.getDate() : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next Month */}
                <div>
                  <div className="text-center mb-3">
                    <span className="text-sm font-semibold">
                      {new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Calendar Grid for Next Month */}
                  <div className="mb-3">
                    <div className="grid grid-cols-7 gap-1">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                          {day}
                        </div>
                      ))}
                      {getDaysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)).map((date, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleDateClick(date)}
                          disabled={!date || isDatePast(date) || !isDateAvailable(date)}
                          className={`
                            aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all
                            ${!date ? 'invisible' : ''}
                            ${isDatePast(date) ? 'text-gray-300 cursor-not-allowed' : ''}
                            ${isDateAvailable(date) ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer font-semibold' : ''}
                            ${!isDateAvailable(date) && !isDatePast(date) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                            ${selectedDate && date && selectedDate.toDateString() === date.toDateString() ? 'ring-2 ring-primary-500 bg-primary-100' : ''}
                          `}
                        >
                          {date ? date.getDate() : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-3 justify-center mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded border border-green-200"></div>
                  <span className="text-gray-600">Verfügbar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-100 rounded border border-gray-200"></div>
                  <span className="text-gray-600">Ausgebucht</span>
                </div>
              </div>

              {/* Calendar Error Warning */}
              {calendarError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 font-medium">⚠️ Google Kalender konnte nicht abgefragt werden. Bitte kontaktieren Sie die Werkstatt telefonisch für eine Terminvereinbarung.</p>
                </div>
              )}

              {/* Time Slots */}
              {selectedDate && !calendarError && (
                <div id="time-slots-section" className="border-t pt-4">
                  <h4 className="text-sm font-bold mb-3">
                    Zeiten am {selectedDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
                  </h4>
                  
                  {getSlotsForDate(selectedDate).length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-yellow-800">Keine Termine verfügbar</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {getSlotsForDate(selectedDate).map((slot: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => handleSlotSelect(slot)}
                          className={`
                            px-3 py-2 rounded-lg border-2 transition-all font-semibold text-xs
                            ${selectedSlot?.time === slot.time
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sticky Booking Card (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                {/* Price */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-1">Gesamtpreis</p>
                  <p className="text-3xl font-bold text-gray-900">{formatEUR(calculateTotalPrice())}</p>
                  <p className="text-xs text-gray-500 mt-1">{getTaxLabel()}</p>
                </div>

                {/* Service Summary */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  {/* Service Price (includes mounting-only surcharge if applicable) */}
                  {isTireService ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Montage</span>
                      <span className="font-medium text-gray-900">{formatEUR(basePrice + mountingSurchargeAmount)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{getServiceInfo(serviceType).name}</span>
                      <span className="font-medium text-gray-900">{formatEUR(basePrice)}</span>
                    </div>
                  )}
                  {/* Tire Price */}
                  {isTireService && (tireBookingData?.selectedTire || tireBookingData?.isMixedTires) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{tireBookingData.tireCount || 4}× Reifen</span>
                      <span className="font-medium text-gray-900">
                        {formatEUR(
                          tireBookingData.isMixedTires
                            ? (tireBookingData.selectedFrontTire?.totalPrice || (tireBookingData.selectedFrontTire?.pricePerTire * tireBookingData.selectedFrontTire?.quantity) || 0) +
                              (tireBookingData.selectedRearTire?.totalPrice || (tireBookingData.selectedRearTire?.pricePerTire * tireBookingData.selectedRearTire?.quantity) || 0)
                            : tireBookingData.selectedTire.totalPrice
                        )}
                      </span>
                    </div>
                  )}
                  {/* Disposal Fee */}
                  {tireBookingData?.hasDisposal && tireBookingData?.disposalPrice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Reifenentsorgung</span>
                      <span className="font-medium text-gray-900">{formatEUR(tireBookingData.disposalPrice)}</span>
                    </div>
                  )}
                  {/* Runflat Surcharge */}
                  {tireBookingData?.hasRunflat && tireBookingData?.runflatPrice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Runflat-Zuschlag</span>
                      <span className="font-medium text-gray-900">{formatEUR(tireBookingData.runflatPrice)}</span>
                    </div>
                  )}
                  {/* Additional Services / Leistungen */}
                  {additionalServices.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{removeEmojis((service.serviceName || service.name || '').replace(/^Mit /, ''))}</span>
                      <span className="font-medium text-gray-900">{formatEUR(service.price)}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Selectors */}
                <div className="space-y-4">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Termin wählen</label>
                    {!selectedDate ? (
                      <button 
                        onClick={() => document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:border-primary-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Datum auswählen</span>
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            {selectedSlot && (
                              <p className="text-xs text-gray-600 mt-1">{selectedSlot.time} Uhr</p>
                            )}
                          </div>
                          <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ausgewähltes Fahrzeug</label>
                    {tireBookingData?.selectedVehicle ? (
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Car className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {tireBookingData.selectedVehicle.make} {tireBookingData.selectedVehicle.model}
                            </p>
                            {tireBookingData.selectedVehicle.year && (
                              <p className="text-xs text-gray-500">
                                {tireBookingData.selectedVehicle.year} · {tireBookingData.selectedVehicle.licensePlate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : session ? (
                      selectedVehicle && vehicles.find(v => v.id === selectedVehicle) ? (
                        <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {vehicles.find(v => v.id === selectedVehicle)?.make} {vehicles.find(v => v.id === selectedVehicle)?.model}
                              </p>
                              <p className="text-xs text-gray-500">
                                {vehicles.find(v => v.id === selectedVehicle)?.year} · {vehicles.find(v => v.id === selectedVehicle)?.licensePlate}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <select
                          value={selectedVehicle || ''}
                          onChange={(e) => setSelectedVehicle(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          disabled={loadingVehicles}
                        >
                          <option value="">Fahrzeug auswählen</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.make} {v.model} ({v.licensePlate})
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:border-primary-500 transition-colors"
                      >
                        <span className="text-sm text-gray-600">Anmelden um Fahrzeug zu wählen</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Booking Button */}
                <button
                  id="booking-button"
                  onClick={handleBooking}
                  disabled={!canBook}
                  className={`w-full mt-6 px-6 py-4 rounded-lg font-semibold text-white transition-all ${
                    canBook
                      ? 'bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {!canBook && !selectedVehicle
                    ? 'Bitte Fahrzeug wählen'
                    : !canBook
                    ? 'Termin auswählen'
                    : serviceType === 'WHEEL_CHANGE'
                    ? 'Räderwechsel buchen'
                    : serviceType === 'TIRE_CHANGE'
                    ? 'Reifen & Montage buchen'
                    : serviceType === 'MOTORCYCLE_TIRE'
                    ? 'Montage buchen'
                    : serviceType === 'TIRE_REPAIR'
                    ? 'Reparatur buchen'
                    : serviceType === 'TIRE_STORAGE'
                    ? 'Einlagerung buchen'
                    : 'Jetzt verbindlich buchen'
                  }
                </button>

                {canBook && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    Stornierung auf Anfrage direkt mit der Werkstatt
                  </p>
                )}
              </div>

              {/* Workshop Location Map */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  Standort
                </h3>
                
                {/* Google Maps Static Image */}
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBvxhXA7Lx5Qz6F3DVhLPJZ9V-JoKHGQSM'}&q=${encodeURIComponent(`${workshop?.name || ''}, ${workshop?.street || ''}, ${workshop?.city || ''}`)}&zoom=15`}
                    allowFullScreen
                  />
                </div>

                {/* Workshop Address */}
                <div className="text-xs text-gray-600 mb-3 space-y-1">
                  <p className="font-medium text-gray-900">{workshop?.name}</p>
                  {workshop?.street && <p>{workshop.street}</p>}
                  {(workshop?.city || workshop?.postalCode) && (
                    <p>{workshop?.postalCode} {workshop?.city}</p>
                  )}
                </div>

                {/* Open in Maps Button */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${workshop?.name || ''}, ${workshop?.street || ''}, ${workshop?.city || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  In Google Maps öffnen
                </a>
              </div>

              {/* Trust Badges */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Geprüfte Werkstatt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span>Bestpreisgarantie</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span>Zertifizierte Mechaniker</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Service Type Filter */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">🔧 Service-Art</h2>
          <div className="space-y-3">
            <button
              onClick={() => {
                setServiceType('WHEEL_CHANGE')
                // Reset tire data
                setTireBookingData(null)
                sessionStorage.removeItem('tireBookingData')
                // Recalculate price
                setBasePrice(workshop.estimatedDuration || 60)
              }}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                serviceType === 'WHEEL_CHANGE'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className={`w-5 h-5 ${serviceType === 'WHEEL_CHANGE' ? 'text-primary-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-semibold text-sm ${serviceType === 'WHEEL_CHANGE' ? 'text-gray-900' : 'text-gray-700'}`}>
                    Nur Montage
                  </p>
                  <p className="text-xs text-gray-600">Ich bringe eigene Reifen mit</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                // Save current workshop ID
                sessionStorage.setItem('returnToWorkshop', workshopId)
                // Redirect to tire search to select tires
                router.push('/')
              }}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                isTireService
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wrench className={`w-5 h-5 ${isTireService ? 'text-primary-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-semibold text-sm ${isTireService ? 'text-gray-900' : 'text-gray-700'}`}>
                    Mit Reifenkauf
                  </p>
                  <p className="text-xs text-gray-600">Reifen auswählen und montieren lassen</p>
                </div>
              </div>
            </button>
          </div>
          
          {isTireService && !tireBookingData?.selectedTire && !tireBookingData?.selectedFrontTire && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ Bitte wählen Sie zuerst Ihre Reifen aus, um fortzufahren.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Calendar Section */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📅 Termin wählen</h2>
          
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={currentMonth.getTime() <= new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <span className="text-sm font-semibold">
                {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={currentMonth.getTime() >= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime()}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mb-4">
            <div className="grid grid-cols-7 gap-1">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map((date, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDateClick(date)}
                  disabled={!date || isDatePast(date) || !isDateAvailable(date)}
                  className={`
                    aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all
                    ${!date ? 'invisible' : ''}
                    ${isDatePast(date) ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${isDateAvailable(date) ? 'bg-green-100 text-green-800 active:bg-green-200' : ''}
                    ${!isDateAvailable(date) && !isDatePast(date) ? 'bg-gray-100 text-gray-400' : ''}
                    ${selectedDate && date && selectedDate.toDateString() === date.toDateString() ? 'ring-2 ring-primary-500 bg-primary-100' : ''}
                  `}
                >
                  {date ? date.getDate() : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-3 justify-center mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded border border-green-200"></div>
              <span className="text-gray-600">Verfügbar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded border border-gray-200"></div>
              <span className="text-gray-600">Ausgebucht</span>
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-bold mb-3">
                Zeiten am {selectedDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
              </h4>
              
              {getSlotsForDate(selectedDate).length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800">Keine Termine verfügbar</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {getSlotsForDate(selectedDate).map((slot: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleSlotSelect(slot)}
                      className={`
                        px-3 py-2 rounded-lg border-2 transition-all font-semibold text-sm
                        ${selectedSlot?.time === slot.time
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 active:border-primary-300 active:bg-gray-50'
                        }
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vehicle Selection Mobile */}
          {selectedSlot && session && (
            <div className="border-t mt-4 pt-4">
              <h4 className="text-sm font-bold mb-3">Fahrzeug wählen</h4>
              <select
                value={selectedVehicle || ''}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loadingVehicles}
              >
                <option value="">Fahrzeug auswählen</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.licensePlate})
                  </option>
                ))}
              </select>
            </div>
          )}

          {!session && selectedSlot && (
            <div className="border-t mt-4 pt-4">
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Anmelden um zu buchen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Gesamtpreis</p>
            <p className="text-2xl font-bold text-gray-900">{formatEUR(calculateTotalPrice())}</p>
          </div>
          <button
            onClick={handleBooking}
            disabled={!canBook}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${
              canBook
                ? 'bg-primary-600 active:bg-primary-700'
                : 'bg-gray-300'
            }`}
          >
            {!canBook && !selectedVehicle
              ? 'Fahrzeug wählen'
              : !canBook
              ? 'Termin wählen'
              : serviceType === 'WHEEL_CHANGE'
              ? 'Räderwechsel'
              : serviceType === 'TIRE_CHANGE'
              ? 'Reifen & Montage'
              : serviceType === 'MOTORCYCLE_TIRE'
              ? 'Montage buchen'
              : serviceType === 'TIRE_REPAIR'
              ? 'Reparatur'
              : serviceType === 'TIRE_STORAGE'
              ? 'Einlagerung'
              : 'Jetzt buchen'
            }
          </button>
        </div>
      </div>

      {/* Modals */}
      {showServicesModal && (
        <AddServicesModal
          isOpen={showServicesModal}
          onClose={() => setShowServicesModal(false)}
          onServicesSelected={handleAdditionalServicesSelected}
          workshopId={workshopId}
          selectedServiceType={serviceType}
        />
      )}

      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Add bottom padding for mobile fixed bar */}
      <div className="lg:hidden h-32"></div>
    </div>
  )
}
