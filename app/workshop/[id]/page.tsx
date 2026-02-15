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
  Check
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
  
  // Refs for auto-scroll
  const timeSlotsRef = useRef<HTMLDivElement>(null)
  const vehicleSelectionRef = useRef<HTMLDivElement>(null)
  const bookingButtonRef = useRef<HTMLDivElement>(null)

  const [workshop, setWorkshop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({})
  const [openingHours, setOpeningHours] = useState<any>(null)
  const [serviceType, setServiceType] = useState<string>('WHEEL_CHANGE') // Store service type from URL
  
  // Vehicle selection
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  
  // Favorites
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Additional services
  const [showServicesModal, setShowServicesModal] = useState(false)
  const [additionalServices, setAdditionalServices] = useState<any[]>([])
  const [basePrice, setBasePrice] = useState(0)
  const [baseDuration, setBaseDuration] = useState(60)
  
  // Tire booking data from previous page
  const [tireBookingData, setTireBookingData] = useState<any>(null)
  
  // Handle image load errors globally
  useEffect(() => {
    const handleImageError = (e: Event) => {
      const target = e.target as HTMLImageElement
      if (target.tagName === 'IMG' && target.src.includes('/uploads/logos/')) {
        // Prevent infinite loop
        if (!target.src.includes('data:image')) {
          console.log('[IMAGE ERROR] Failed to load logo:', target.src)
          // Set placeholder
          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" text-anchor="middle" dy=".3em"%3E🔧%3C/text%3E%3C/svg%3E'
          target.onerror = null // Prevent further error handling
        }
      }
    }
    
    document.addEventListener('error', handleImageError, true)
    return () => document.removeEventListener('error', handleImageError, true)
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

  // Load favorites from localStorage
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
  
  // Toggle favorite
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
      
      const newFavorites = favorites.includes(workshopId)
        ? favorites.filter(id => id !== workshopId)
        : [...favorites, workshopId]
      
      localStorage.setItem('workshop_favorites', JSON.stringify(newFavorites))
      setIsFavorite(newFavorites.includes(workshopId))
    }
  }

  // Load user vehicles when logged in
  useEffect(() => {
    const loadVehicles = async () => {
      if (session?.user) {
        setLoadingVehicles(true)
        try {
          const response = await fetch('/api/customer/vehicles')
          if (response.ok) {
            const data = await response.json()
            setVehicles(data.vehicles || [])
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

  // Load workshop details from URL params and API
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
        totalPrice: 0, // Will be calculated from tireBookingData or loaded from DB
        estimatedDuration: parseInt(searchParams.get('duration') || '60'),
        description: '',
      }
      
      // Extract service type from URL
      const service = searchParams.get('service') || 'WHEEL_CHANGE'
      console.log('🔧 [WORKSHOP] Service type from URL:', service)
      setServiceType(service)
      
      // Fetch full workshop details including description and pricing
      try {
        const response = await fetch(`/api/workshops/${workshopId}`)
        if (response.ok) {
          const data = await response.json()
          console.log('🏪 [WORKSHOP] API response:', data)
          if (data.success && data.workshop) {
            // Safely extract description
            const desc = data.workshop.companySettings?.description
            if (desc && desc.trim()) {
              workshopData.description = desc
            }
            // Get base service price from workshop data
            if (data.workshop.services) {
              console.log('💰 [WORKSHOP] Available services:', data.workshop.services)
              const serviceData = data.workshop.services.find((s: any) => s.serviceType === service)
              console.log('✅ [WORKSHOP] Found service:', serviceData)
              if (serviceData && serviceData.servicePackages && serviceData.servicePackages.length > 0) {
                // Find the correct package based on tire booking data
                let selectedPackage = null
                
                // Check if we have tire booking data with selected packages
                const savedTireData = sessionStorage.getItem('tireBookingData')
                if (savedTireData) {
                  try {
                    const tireData = JSON.parse(savedTireData)
                    console.log('📦 [WORKSHOP] Tire booking data:', tireData)
                    
                    // Find matching package from selectedPackages
                    if (tireData.selectedPackages && tireData.selectedPackages.length > 0) {
                      const packageType = tireData.selectedPackages[0] // e.g., "two_tires", "four_tires"
                      selectedPackage = serviceData.servicePackages.find((p: any) => p.packageType === packageType)
                      console.log(`🎯 [WORKSHOP] Looking for package type '${packageType}':`, selectedPackage)
                    }
                    
                    // Fallback: use tireCount to determine package
                    if (!selectedPackage && tireData.tireCount) {
                      const packageType = tireData.tireCount === 4 ? 'four_tires' : 'two_tires'
                      selectedPackage = serviceData.servicePackages.find((p: any) => p.packageType === packageType)
                      console.log(`🎯 [WORKSHOP] Fallback to tireCount ${tireData.tireCount}, package type '${packageType}':`, selectedPackage)
                    }
                  } catch (e) {
                    console.error('Error parsing tire booking data:', e)
                  }
                }
                
                // Use selected package or fall back to first package
                const packageToUse = selectedPackage || serviceData.servicePackages[0]
                workshopData.totalPrice = packageToUse.price || 0
                workshopData.estimatedDuration = packageToUse.durationMinutes || 60
                console.log('💵 [WORKSHOP] Using package:', packageToUse.name, 'Price:', packageToUse.price, 'Duration:', packageToUse.durationMinutes)
              } else if (serviceData) {
                // Fallback to basePrice if no packages
                workshopData.totalPrice = serviceData.basePrice || 0
                workshopData.estimatedDuration = serviceData.durationMinutes || 60
                console.log('💵 [WORKSHOP] No packages, using basePrice:', serviceData.basePrice, 'duration:', serviceData.durationMinutes)
              } else {
                console.warn('⚠️ [WORKSHOP] Service not found for type:', service)
              }
            } else {
              console.warn('⚠️ [WORKSHOP] No services found in API response')
            }
          }
        } else {
          console.error('Workshop API error:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error loading workshop details:', error)
      }
      
      console.log('📊 [WORKSHOP] Final workshopData:', workshopData)
      setWorkshop(workshopData)
      setBasePrice(workshopData.totalPrice)
      setBaseDuration(workshopData.estimatedDuration)
      setLoading(false)
    }
    
    loadWorkshop()
  }, [workshopId])

  // Back navigation - always go to homepage which restores search from sessionStorage
  const getBackUrl = () => '/'

  // Load tire booking data from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('tireBookingData')
      if (savedData) {
        try {
          const data = JSON.parse(savedData)
          console.log('📦 [WORKSHOP] Loaded tire booking data:', data)
          setTireBookingData(data)
          
          // Auto-select vehicle if provided
          if (data.selectedVehicle?.id) {
            console.log('🚗 [WORKSHOP] Auto-selecting vehicle:', data.selectedVehicle.id)
            setSelectedVehicle(data.selectedVehicle.id)
          }
        } catch (e) {
          console.error('Error parsing tire booking data:', e)
        }
      }
    }
  }, [])

  // Fetch available slots when month changes
  useEffect(() => {
    if (!workshopId) return
    fetchAvailableSlots()
  }, [workshopId, currentMonth])

  const fetchAvailableSlots = async () => {
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0) // 2 months
      
      const response = await fetch(
        `/api/customer/direct-booking/${workshopId}/available-slots?` +
        `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
        setBusySlots(data.busySlots || {})
        // Parse opening hours from API
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

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // EU Label color helpers for tire display
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday = 0

    const days = []
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add days of month
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
    const dateStr = date.toISOString().split('T')[0]
    // busySlots is now an object: { "2026-02-19": ["16:00", "08:00"], ... }
    // A date is available if it's not fully booked (has some free slots)
    // We consider a date available if it either has no busy slots, or if workshop is open that day
    // For now, we'll show all future dates as potentially available (workshop can configure open hours)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const isDatePast = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getSlotsForDate = (date: Date) => {
    // Format date as YYYY-MM-DD WITHOUT timezone conversion (toISOString would shift to UTC)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const slots = []
    const busyTimes = busySlots[dateStr] || []
    
    // Get day name (monday, tuesday, etc.)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[date.getDay()]
    
    // Default business hours if no opening hours set
    let startHour = 8
    let endHour = 18
    
    // Parse opening hours for this day
    if (openingHours && openingHours[dayName]) {
      const hours = openingHours[dayName]
      
      // Check if workshop is closed
      if (hours && typeof hours === 'object' && hours.closed === true) {
        return []
      }
      
      // Parse object format: {from: "08:00", to: "18:00", closed: false}
      if (hours && typeof hours === 'object' && hours.from && hours.to) {
        const fromParts = hours.from.split(':')
        const toParts = hours.to.split(':')
        if (fromParts.length >= 1) {
          startHour = parseInt(fromParts[0])
        }
        if (toParts.length >= 1) {
          endHour = parseInt(toParts[0])
        }
      }
      // Parse string format: "09:00-18:00" or "09:00-12:00,14:00-18:00"
      else if (hours && typeof hours === 'string' && hours !== 'closed') {
        const ranges = hours.split(',')
        const firstRange = ranges[0].split('-')
        if (firstRange.length === 2) {
          const startTime = firstRange[0].split(':')
          if (startTime.length >= 1) {
            startHour = parseInt(startTime[0])
          }
          // Use last range's end time
          const lastRange = ranges[ranges.length - 1].split('-')
          if (lastRange.length === 2) {
            const endTime = lastRange[1].split(':')
            if (endTime.length >= 1) {
              endHour = parseInt(endTime[0])
            }
          }
        }
      } else if (hours === 'closed') {
        return []
      }
    }
    
    // Generate time slots for opening hours (every 30 min)
    // Only include slots where the ENTIRE service duration would be free
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        
        // Check if this slot AND all following slots for the service duration are free
        const slotMinutes = hour * 60 + minute
        const serviceDurationMinutes = baseDuration // Use actual service duration from booking
        
        let isFullServicePeriodFree = true
        
        // Check all 30-min slots within the service duration
        for (let offset = 0; offset < serviceDurationMinutes; offset += 30) {
          const checkMinutes = slotMinutes + offset
          const checkHour = Math.floor(checkMinutes / 60)
          const checkMinute = checkMinutes % 60
          const checkTimeStr = `${String(checkHour).padStart(2, '0')}:${String(checkMinute).padStart(2, '0')}`
          
          // If any slot in the service period is busy, this start time is not available
          if (busyTimes.includes(checkTimeStr)) {
            isFullServicePeriodFree = false
            break
          }
        }
        
        // Only add slot if the entire service period is free
        if (isFullServicePeriodFree) {
          slots.push({
            time: timeStr,
            available: true
          })
        }
      }
    }
    
    return slots
  }

  const handleDateClick = (date: Date | null) => {
    if (!date || isDatePast(date) || !isDateAvailable(date)) return
    setSelectedDate(date)
    setSelectedSlot(null) // Reset slot selection
    
    // Debug: Log busy slots for this date (format without UTC conversion)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    console.log(`[CUSTOMER CALENDAR] Selected date: ${dateStr}`)
    console.log(`[CUSTOMER CALENDAR] Busy slots:`, busySlots[dateStr] || [])
    console.log(`[CUSTOMER CALENDAR] All busy slots:`, busySlots)
    
    // Auto-scroll to time slots after selection
    setTimeout(() => {
      timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot)
    
    // Auto-scroll to vehicle selection (if logged in) or booking button (if not logged in)
    setTimeout(() => {
      if (session) {
        vehicleSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        bookingButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleAdditionalServicesSelected = (services: any[]) => {
    setAdditionalServices(services)
  }

  const calculateTotalPrice = () => {
    let total = basePrice
    
    // Add tire price if available from previous page
    if (tireBookingData?.selectedTire?.totalPrice) {
      total += tireBookingData.selectedTire.totalPrice
    }
    
    // Add additional services
    additionalServices.forEach(service => {
      total += service.price
    })
    
    return total
  }

  const calculateTotalDuration = () => {
    let total = baseDuration
    additionalServices.forEach(service => {
      total += service.duration
    })
    return total
  }

  const handleBooking = () => {
    if (!selectedSlot || !selectedDate || !selectedVehicle) return
    
    // Format date in local timezone (YYYY-MM-DD) to avoid timezone offset issues
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // Find selected vehicle details
    const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)
    
    // Save complete booking data to sessionStorage (secure, not in URL)
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
        servicePrice: basePrice,
        tirePrice: tireBookingData?.selectedTire?.totalPrice || 0,
        additionalServicesPrice: additionalServices.reduce((sum, s) => sum + s.price, 0),
        totalPrice: calculateTotalPrice(),
      },
      timestamp: Date.now(),
    }
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
    console.log('💾 [BOOKING] Saved booking data to sessionStorage:', bookingData)
    
    // Navigate with minimal URL parameters (only IDs needed for API calls)
    const paymentUrl = `/workshop/${workshopId}/payment?` +
      `date=${dateStr}&` +
      `time=${selectedSlot.time}&` +
      `vehicleId=${selectedVehicle}`
    
    // Wenn angemeldet → direkt zur Bezahlungsseite
    if (session) {
      router.push(paymentUrl)
    } else {
      // Wenn nicht angemeldet → zur Login-Seite mit Redirect zurück zur Bezahlung
      router.push(`/login?redirect=${encodeURIComponent(paymentUrl)}`)
    }
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    const today = new Date()
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 md:p-6">
          <div className="text-center py-12">Lade Werkstatt-Details...</div>
        </div>
      </div>
    )
  }

  const month1 = currentMonth
  const month2 = getNextMonth(currentMonth)
  const days1 = getDaysInMonth(month1)
  const days2 = getDaysInMonth(month2)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Blue like home page */}
      <nav className="bg-primary-600 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-600 text-2xl font-bold">B24</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Bereifung24</h1>
              </div>
            </Link>
            
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
                          
                          try {
                            // Save cookie consent before clearing storage
                            const cookieConsent = localStorage.getItem('cookieConsent')
                            const bereifung24Consent = localStorage.getItem('bereifung24_cookie_consent')
                            const bereifung24ConsentDate = localStorage.getItem('bereifung24_cookie_consent_date')
                            
                            // Step 1: Call NextAuth signout first
                            await signOut({ redirect: false })
                            
                            // Step 2: Call custom logout endpoint to force cookie deletion
                            await fetch('/api/logout', {
                              method: 'POST',
                              credentials: 'include'
                            })
                            
                            // Step 3: Clear all client storage
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
                            window.location.href = '/'
                          } catch (error) {
                            console.error('[LOGOUT] Error during logout:', error)
                            // Force reload anyway
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
                <div className="flex items-center gap-3">
                  <Link
                    href="/register/customer"
                    className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Registrieren
                  </Link>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 text-sm font-medium bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Anmelden
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Exact Same as /home */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white pt-12 pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Search Button - returns to home with preserved search */}
          <div className="absolute top-0 left-4 sm:left-6 lg:left-8">
            <Link 
              href={getBackUrl()}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zurück zur Suche</span>
            </Link>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {workshop?.name || 'Werkstatt Details'}
            </h2>
            <p className="text-xl text-primary-100 mb-6">
              Wähle deinen Wunschtermin und buche direkt online
            </p>
            <Link
              href={getBackUrl()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Zurück zur Werkstattsuche
            </Link>
          </div>
        </div>
      </section>

      {/* Workshop Info - Centered with max-width */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
            {/* Top Row: Name and Heart */}
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 flex-1">
                {workshop.name}
              </h2>
              <button 
                onClick={toggleFavorite}
                className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
              >
                <svg
                  className={`w-6 h-6 transition-colors ${
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
            </div>
            
            {/* Workshop Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
              {workshop.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">{workshop.rating.toFixed(1)}</span>
                  {workshop.reviewCount > 0 && (
                    <span className="text-gray-500">({workshop.reviewCount} Bewertungen)</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{workshop.city}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span>📍 {workshop.distance.toFixed(1)} km entfernt</span>
              </div>
              
              {baseDuration > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>~ {calculateTotalDuration()} Min.</span>
                </div>
              )}
            </div>
            
            {/* Price and Button - Below everything */}
            <div className="border-t pt-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gesamtpreis</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatEUR(calculateTotalPrice())}
                  </p>
                  {additionalServices.length > 0 && (
                    <p className="text-sm text-gray-500">
                      inkl. {additionalServices.length} zusätzliche{additionalServices.length > 1 ? 'r' : ''} Service{additionalServices.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    const calendarSection = document.getElementById('calendar-section')
                    if (calendarSection) {
                      calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Verfügbarkeit prüfen
                </button>
              </div>
            </div>
          </div>

          {/* Workshop Description */}
          {workshop?.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📜 Über die Werkstatt</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {workshop?.description}
              </p>
            </div>
          )}

          {/* Selected Service Card */}
          {tireBookingData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                🔧 Gewählter Service
              </h3>
              
              <div className="space-y-3">
                {/* Main Service - WITHOUT tire info */}
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {tireBookingData.serviceName === 'TIRE_CHANGE' ? '🔄 Reifenmontage' : 
                       tireBookingData.serviceName === 'WHEEL_CHANGE' ? '⚙️ Räderwechsel' :
                       tireBookingData.serviceName === 'ALIGNMENT_BOTH' ? '📐 Achsvermessung' :
                       '🔧 Service'}
                    </p>
                  </div>
                  {tireBookingData.servicePrice && (
                    <p className="text-lg font-bold text-primary-600">
                      {formatEUR(tireBookingData.servicePrice)}
                    </p>
                  )}
                </div>

                {/* Disposal Service */}
                {tireBookingData.hasDisposal && tireBookingData.disposalPrice > 0 && (
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                    <div>
                      <p className="font-semibold text-gray-900">♻️ Entsorgung</p>
                      <p className="text-sm text-gray-600">
                        Fachgerechte Entsorgung ({tireBookingData.tireCount}× {formatEUR(tireBookingData.disposalPrice / tireBookingData.tireCount)})
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatEUR(tireBookingData.disposalPrice)}
                    </p>
                  </div>
                )}

                {/* Runflat Service */}
                {tireBookingData.hasRunflat && tireBookingData.runflatPrice > 0 && (
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                    <div>
                      <p className="font-semibold text-gray-900">⚠️ Runflat-Reifen</p>
                      <p className="text-sm text-gray-600">
                        Spezialmontage für notlauftaugliche Reifen
                      </p>
                    </div>
                    <p className="text-lg font-bold text-orange-600">
                      {formatEUR(tireBookingData.runflatPrice)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Tires Card */}
          {tireBookingData && tireBookingData.hasTires && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                🚗 Ausgewählte Reifen
              </h3>
              
              {/* Mixed Tires */}
              {tireBookingData.isMixedTires ? (
                <div className="space-y-4">
                  {/* Front Tires */}
                  {tireBookingData.selectedFrontTire && tireBookingData.selectedPackages?.includes('front_two_tires') && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-primary-600 mb-2">
                        Vorderachse · {tireBookingData.tireDimensionsFront?.formatted || `${tireBookingData.tireDimensionsFront?.width}/${tireBookingData.tireDimensionsFront?.height} R${tireBookingData.tireDimensionsFront?.diameter}`}
                      </p>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-primary-600 font-medium mb-1">{tireBookingData.selectedFrontTire.label}</p>
                          <p className="text-lg font-bold text-gray-900">{tireBookingData.selectedFrontTire.brand}</p>
                          <p className="text-sm text-gray-600">{tireBookingData.selectedFrontTire.model}</p>
                          
                          {/* Load & Speed Index */}
                          {(tireBookingData.selectedFrontTire.loadIndex || tireBookingData.selectedFrontTire.speedIndex) && (
                            <p className="text-sm text-gray-700 font-medium mt-2">
                              {tireBookingData.selectedFrontTire.loadIndex && <span className="text-green-700">Tragfähigkeit: {tireBookingData.selectedFrontTire.loadIndex}</span>}
                              {tireBookingData.selectedFrontTire.loadIndex && tireBookingData.selectedFrontTire.speedIndex && <span className="text-gray-400 mx-1">·</span>}
                              {tireBookingData.selectedFrontTire.speedIndex && <span className="text-blue-700">Speed: {tireBookingData.selectedFrontTire.speedIndex}</span>}
                            </p>
                          )}
                          
                          {/* EU Labels */}
                          <div className="flex gap-2 mt-3">
                            {tireBookingData.selectedFrontTire.labelFuelEfficiency && (
                              <div className="text-center">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded text-sm font-bold ${getLabelColor(tireBookingData.selectedFrontTire.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                  {tireBookingData.selectedFrontTire.labelFuelEfficiency}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Effizienz</p>
                              </div>
                            )}
                            {tireBookingData.selectedFrontTire.labelWetGrip && (
                              <div className="text-center">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded text-sm font-bold ${getLabelColor(tireBookingData.selectedFrontTire.labelWetGrip)}`} title="Nasshaftung">
                                  {tireBookingData.selectedFrontTire.labelWetGrip}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Nässe</p>
                              </div>
                            )}
                            {tireBookingData.selectedFrontTire.labelNoise && (
                              <div className="text-center">
                                <span className={`inline-flex items-center justify-center px-2 h-10 rounded text-sm font-bold ${getNoiseColor(tireBookingData.selectedFrontTire.labelNoise)}`} title={`Lautstärke: ${tireBookingData.selectedFrontTire.labelNoise} dB`}>
                                  {getNoiseWaves(tireBookingData.selectedFrontTire.labelNoise)} {tireBookingData.selectedFrontTire.labelNoise}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Lautstärke</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {tireBookingData.selectedFrontTire.quantity || 2}× à {formatEUR(tireBookingData.selectedFrontTire.pricePerTire || 0)}
                          </p>
                          <p className="text-2xl font-bold text-primary-600">
                            {formatEUR(tireBookingData.selectedFrontTire.totalPrice || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Rear Tires */}
                  {tireBookingData.selectedRearTire && (tireBookingData.selectedPackages?.includes('rear_two_tires') || tireBookingData.selectedPackages?.includes('mixed_four_tires')) && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-primary-600 mb-2">
                        Hinterachse · {tireBookingData.tireDimensionsRear?.formatted || `${tireBookingData.tireDimensionsRear?.width}/${tireBookingData.tireDimensionsRear?.height} R${tireBookingData.tireDimensionsRear?.diameter}`}
                      </p>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-primary-600 font-medium mb-1">{tireBookingData.selectedRearTire.label}</p>
                          <p className="text-lg font-bold text-gray-900">{tireBookingData.selectedRearTire.brand}</p>
                          <p className="text-sm text-gray-600">{tireBookingData.selectedRearTire.model}</p>
                          
                          {/* Load & Speed Index */}
                          {(tireBookingData.selectedRearTire.loadIndex || tireBookingData.selectedRearTire.speedIndex) && (
                            <p className="text-sm text-gray-700 font-medium mt-2">
                              {tireBookingData.selectedRearTire.loadIndex && <span className="text-green-700">Tragfähigkeit: {tireBookingData.selectedRearTire.loadIndex}</span>}
                              {tireBookingData.selectedRearTire.loadIndex && tireBookingData.selectedRearTire.speedIndex && <span className="text-gray-400 mx-1">·</span>}
                              {tireBookingData.selectedRearTire.speedIndex && <span className="text-blue-700">Speed: {tireBookingData.selectedRearTire.speedIndex}</span>}
                            </p>
                          )}
                          
                          {/* EU Labels */}
                          <div className="flex gap-2 mt-3">
                            {tireBookingData.selectedRearTire.labelFuelEfficiency && (
                              <div className="text-center">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded text-sm font-bold ${getLabelColor(tireBookingData.selectedRearTire.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                  {tireBookingData.selectedRearTire.labelFuelEfficiency}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Effizienz</p>
                              </div>
                            )}
                            {tireBookingData.selectedRearTire.labelWetGrip && (
                              <div className="text-center">
                                <span className={`inline-flex items-center justify-center w-10 h-10 rounded text-sm font-bold ${getLabelColor(tireBookingData.selectedRearTire.labelWetGrip)}`} title="Nasshaftung">
                                  {tireBookingData.selectedRearTire.labelWetGrip}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Nässe</p>
                              </div>
                            )}
                            {tireBookingData.selectedRearTire.labelNoise && (
                              <div className="text-center">
                                <span className={`inline-flex items-center justify-center px-2 h-10 rounded text-sm font-bold ${getNoiseColor(tireBookingData.selectedRearTire.labelNoise)}`} title={`Lautstärke: ${tireBookingData.selectedRearTire.labelNoise} dB`}>
                                  {getNoiseWaves(tireBookingData.selectedRearTire.labelNoise)} {tireBookingData.selectedRearTire.labelNoise}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Lautstärke</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {tireBookingData.selectedRearTire.quantity || 2}× à {formatEUR(tireBookingData.selectedRearTire.pricePerTire || 0)}
                          </p>
                          <p className="text-2xl font-bold text-primary-600">
                            {formatEUR(tireBookingData.selectedRearTire.totalPrice || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Tires */
                tireBookingData.selectedTire && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-primary-600 mb-2">
                      {tireBookingData.tireDimensions && `${tireBookingData.tireDimensions.width}/${tireBookingData.tireDimensions.height} R${tireBookingData.tireDimensions.diameter}`}
                      {tireBookingData.tireDimensions?.loadIndex && tireBookingData.tireDimensions?.speedIndex && ` ${tireBookingData.tireDimensions.loadIndex}${tireBookingData.tireDimensions.speedIndex}`}
                    </p>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-primary-600 font-medium mb-1">{tireBookingData.selectedTire.label}</p>
                        <p className="text-lg font-bold text-gray-900">{tireBookingData.selectedTire.brand}</p>
                        <p className="text-sm text-gray-600">{tireBookingData.selectedTire.model}</p>
                        
                        {/* Load & Speed Index */}
                        {(tireBookingData.selectedTire.loadIndex || tireBookingData.selectedTire.speedIndex) && (
                          <p className="text-sm text-gray-700 font-medium mt-2">
                            {tireBookingData.selectedTire.loadIndex && <span className="text-green-700">Tragfähigkeit: {tireBookingData.selectedTire.loadIndex}</span>}
                            {tireBookingData.selectedTire.loadIndex && tireBookingData.selectedTire.speedIndex && <span className="text-gray-400 mx-1">·</span>}
                            {tireBookingData.selectedTire.speedIndex && <span className="text-blue-700">Speed: {tireBookingData.selectedTire.speedIndex}</span>}
                          </p>
                        )}
                        
                        {/* EU Labels */}
                        <div className="flex gap-2 mt-3">
                          {tireBookingData.selectedTire.labelFuelEfficiency && (
                            <div className="text-center">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded text-sm font-bold ${getLabelColor(tireBookingData.selectedTire.labelFuelEfficiency)}`} title="Kraftstoffeffizienz">
                                {tireBookingData.selectedTire.labelFuelEfficiency}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">Effizienz</p>
                            </div>
                          )}
                          {tireBookingData.selectedTire.labelWetGrip && (
                            <div className="text-center">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded text-sm font-bold ${getLabelColor(tireBookingData.selectedTire.labelWetGrip)}`} title="Nasshaftung">
                                {tireBookingData.selectedTire.labelWetGrip}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">Nässe</p>
                            </div>
                          )}
                          {tireBookingData.selectedTire.labelNoise && (
                            <div className="text-center">
                              <span className={`inline-flex items-center justify-center px-2 h-10 rounded text-sm font-bold ${getNoiseColor(tireBookingData.selectedTire.labelNoise)}`} title={`Lautstärke: ${tireBookingData.selectedTire.labelNoise} dB`}>
                                {getNoiseWaves(tireBookingData.selectedTire.labelNoise)} {tireBookingData.selectedTire.labelNoise}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">Lautstärke</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {tireBookingData.selectedTire.quantity || 4}× à {formatEUR(tireBookingData.selectedTire.pricePerTire || 0)}
                        </p>
                        <p className="text-2xl font-bold text-primary-600">
                          {formatEUR(tireBookingData.selectedTire.totalPrice || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Selected Vehicle Card */}
          {tireBookingData?.selectedVehicle && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                🚗 Ausgewähltes Fahrzeug
              </h3>
              
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-900">
                    {tireBookingData.selectedVehicle.make} {tireBookingData.selectedVehicle.model}
                  </p>
                  <p className="text-gray-600">
                    {tireBookingData.selectedVehicle.variant && <span>{tireBookingData.selectedVehicle.variant} · </span>}
                    {tireBookingData.selectedVehicle.year && <span>Bj. {tireBookingData.selectedVehicle.year}</span>}
                  </p>
                  
                  {/* License Plate */}
                  {tireBookingData.selectedVehicle.licensePlate && (
                    <div className="mt-3 inline-flex items-center bg-white border-2 border-gray-800 rounded-md overflow-hidden font-mono text-lg font-bold">
                      <div className="bg-blue-600 text-white px-2 py-1 flex items-center gap-1">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="8" r="1.5"/>
                          <circle cx="12" cy="5" r="1.5"/>
                          <circle cx="19" cy="8" r="1.5"/>
                          <circle cx="5" cy="16" r="1.5"/>
                          <circle cx="12" cy="19" r="1.5"/>
                          <circle cx="19" cy="16" r="1.5"/>
                        </svg>
                        <span className="text-xs font-bold">D</span>
                      </div>
                      <div className="px-3 py-1 text-gray-900">
                        {tireBookingData.selectedVehicle.licensePlate}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Services Section */}
          <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl shadow-sm border-2 border-primary-200 p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  ➕ Weitere Services hinzufügen
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Möchten Sie gleich weitere Services dieser Werkstatt mitbuchen? Wählen Sie aus allen verfügbaren Leistungen.
                </p>
                
                {additionalServices.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-gray-700">Ausgewählte Services:</p>
                    {additionalServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-primary-200">
                        <div>
                          <span className="font-semibold text-gray-900">{service.serviceName}</span>
                          <span className="text-sm text-gray-500 ml-2">• {service.packageName}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-600">{formatEUR(service.price)}</div>
                          <div className="text-xs text-gray-500">+{service.duration} Min.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowServicesModal(true)}
                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                {additionalServices.length > 0 ? 'Bearbeiten' : 'Auswählen'}
              </button>
            </div>
          </div>

          {/* Calendar Section */}
          <div id="calendar-section" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">📅 Verfügbare Termine</h3>
          
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={currentMonth <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <span className="text-base font-semibold">
                {month1.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                {' - '}
                {month2.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Two Month Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Month 1 */}
            <div>
              <h4 className="text-center font-semibold text-base mb-3">
                {month1.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="grid grid-cols-7 gap-1">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                    {day}
                  </div>
                ))}
                {days1.map((date, idx) => (
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

            {/* Month 2 */}
            <div>
              <h4 className="text-center font-semibold text-base mb-3">
                {month2.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="grid grid-cols-7 gap-1">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                    {day}
                  </div>
                ))}
                {days2.map((date, idx) => (
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

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mb-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-lg border border-green-200"></div>
              <span className="text-gray-600">Verfügbar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 rounded-lg border border-gray-200"></div>
              <span className="text-gray-600">Ausgebucht</span>
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div ref={timeSlotsRef} className="border-t pt-6">
              <h4 className="text-lg font-bold mb-4">
                Verfügbare Zeiten am {selectedDate.toLocaleDateString('de-DE', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h4>
              
              {getSlotsForDate(selectedDate).length === 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                  <div className="text-4xl mb-2">🕐</div>
                  <h5 className="text-lg font-bold text-gray-900 mb-2">Außerhalb der Öffnungszeiten</h5>
                  <p className="text-sm text-gray-600">
                    Die Werkstatt hat an diesem Tag geschlossen oder es sind keine Termine verfügbar.
                    Bitte wählen Sie ein anderes Datum.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
                  {getSlotsForDate(selectedDate).map((slot: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleSlotSelect(slot)}
                      className={`
                        px-3 py-3 rounded-lg border-2 transition-all font-semibold text-sm
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

          {/* Vehicle Selection - Only show if no vehicle already selected from previous page */}
          {selectedSlot && session && !tireBookingData?.selectedVehicle && (
            <div ref={vehicleSelectionRef} className="border-t mt-6 pt-6">
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-600 mb-1">
                  <strong>📅 Ausgewählter Termin:</strong>
                </p>
                <p className="text-lg font-bold text-primary-700">
                  {selectedDate?.toLocaleDateString('de-DE', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}, {selectedSlot.time} Uhr
                </p>
              </div>

              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-4">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary-600" />
                  Mit welchem Fahrzeug kommen Sie?
                </h4>
                
                {loadingVehicles ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                      <p className="text-yellow-800 font-semibold mb-2">⚠️ Fahrzeug erforderlich</p>
                      <p className="text-yellow-700 text-sm mb-4">
                        Um einen Termin zu buchen, müssen Sie zunächst ein Fahrzeug hinzufügen.
                        Das Kennzeichen wird zur Identifikation bei der Werkstatt benötigt.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/customer/vehicles"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                    >
                      <Plus className="w-5 h-5" />
                      Fahrzeug jetzt hinzufügen
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicles.map((vehicle: any) => (
                      <button
                        key={vehicle.id}
                        onClick={() => {
                          setSelectedVehicle(vehicle.id)
                          // Auto-scroll to booking button after vehicle selection
                          setTimeout(() => {
                            bookingButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                          }, 100)
                        }}
                        className={`
                          group relative w-full p-5 rounded-xl text-left transition-all duration-300
                          ${selectedVehicle === vehicle.id
                            ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-lg scale-[1.02]'
                            : 'border-2 border-gray-200 hover:border-primary-300 hover:shadow-md hover:scale-[1.01] bg-white'
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          {/* Car Icon */}
                          <div className={`
                            flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all
                            ${selectedVehicle === vehicle.id
                              ? 'bg-primary-600 shadow-lg'
                              : 'bg-gray-100 group-hover:bg-primary-100'
                            }
                          `}>
                            <Car className={`w-7 h-7 ${selectedVehicle === vehicle.id ? 'text-white' : 'text-gray-600 group-hover:text-primary-600'}`} />
                          </div>
                          
                          {/* Vehicle Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h5 className="text-lg font-bold text-gray-900 truncate">
                                {vehicle.make} {vehicle.model}
                              </h5>
                              {selectedVehicle === vehicle.id && (
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                              {/* German License Plate */}
                              <div className="inline-flex items-stretch h-9 rounded-sm overflow-hidden shadow-md border-2 border-black font-mono font-bold">
                                {/* Blue EU strip */}
                                <div className="flex flex-col items-center justify-center bg-[#003399] px-1.5 text-white">
                                  <div className="text-xs leading-none font-bold">D</div>
                                </div>
                                {/* White plate with black text */}
                                <div className="flex items-center bg-white px-2.5 text-black text-base tracking-[0.15em]">
                                  {vehicle.licensePlate}
                                </div>
                              </div>
                              
                              {/* Year Badge */}
                              <span className={`
                                inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium
                                ${selectedVehicle === vehicle.id
                                  ? 'bg-white/60 text-gray-700'
                                  : 'bg-gray-50 text-gray-600 group-hover:bg-gray-100'
                                }
                              `}>
                                <Calendar className="w-3.5 h-3.5" />
                                {vehicle.year}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Selected Indicator Bar */}
                        {selectedVehicle === vehicle.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-blue-500 rounded-b-xl"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking Button for non-logged in users */}
          {selectedSlot && !session && (
            <div ref={bookingButtonRef} className="border-t mt-6 pt-6">
              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-600 mb-1">
                  <strong>📅 Ausgewählter Termin:</strong>
                </p>
                <p className="text-lg font-bold text-primary-700">
                  {selectedDate?.toLocaleDateString('de-DE', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}, {selectedSlot.time} Uhr
                </p>
              </div>
              
              <button
                onClick={handleBooking}
                disabled
                className="w-full px-8 py-5 bg-gray-400 text-white font-bold rounded-xl transition-all text-xl shadow-lg cursor-not-allowed"
              >
                Anmelden & buchen
              </button>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                🔐 Bitte melden Sie sich an, um die Buchung abzuschließen
              </p>
            </div>
          )}

          {/* Booking Button for logged in users */}
          {selectedSlot && session && selectedVehicle && (
            <div ref={bookingButtonRef} className="mt-4">
              <button
                onClick={handleBooking}
                className="w-full px-8 py-5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl transition-all text-xl shadow-lg hover:shadow-xl"
              >
                Jetzt buchen
              </button>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                🔒 Sichere Bezahlung
              </p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Additional Services Modal */}
      <AddServicesModal
        isOpen={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        workshopId={workshopId}
        onServicesSelected={handleAdditionalServicesSelected}
        selectedServiceType={serviceType}
        additionalSelectedServices={additionalServices.map(s => s.serviceId)}
      />

      {/* Footer */}
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

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}