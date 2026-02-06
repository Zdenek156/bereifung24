'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, MapPin, Star, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function WorkshopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workshopId = params.id as string

  const [workshop, setWorkshop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({})
  const [openingHours, setOpeningHours] = useState<any>(null)

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
        totalPrice: parseFloat(searchParams.get('totalPrice') || '0'),
        estimatedDuration: parseInt(searchParams.get('duration') || '60'),
        description: '',
      }
      
      // Fetch full workshop details including description
      try {
        const response = await fetch(`/api/workshops/${workshopId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.workshop) {
            // Safely extract description
            const desc = data.workshop.companySettings?.description
            if (desc && desc.trim()) {
              workshopData.description = desc
            }
          }
        } else {
          console.error('Workshop API error:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error loading workshop details:', error)
      }
      
      setWorkshop(workshopData)
      setLoading(false)
    }
    
    loadWorkshop()
  }, [workshopId])

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
    // Only include AVAILABLE slots (skip busy times completely)
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        // Only add slot if NOT busy
        if (!busyTimes.includes(timeStr)) {
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
    
    // Debug: Log busy slots for this date
    const dateStr = date.toISOString().split('T')[0]
    console.log(`[CUSTOMER CALENDAR] Selected date: ${dateStr}`)
    console.log(`[CUSTOMER CALENDAR] Busy slots:`, busySlots[dateStr] || [])
    console.log(`[CUSTOMER CALENDAR] All busy slots:`, busySlots)
  }

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot)
  }

  const handleBooking = () => {
    if (!selectedSlot || !selectedDate) return
    
    // Redirect to login with return URL to checkout
    const returnUrl = `/dashboard/customer/direct-booking/checkout?` +
      `workshopId=${workshopId}&` +
      `date=${selectedDate.toISOString().split('T')[0]}&` +
      `time=${selectedSlot.time}`
    
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
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
            <Link href="/home" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-600 text-xl font-bold">B24</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Bereifung24</h1>
              </div>
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
          {/* Back to Search Button - uses browser history */}
          <div className="absolute top-0 left-4 sm:left-6 lg:left-8">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zurück zur Suche</span>
            </button>
          </div>

          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Finde deine Werkstatt
            </h2>
            <p className="text-xl text-primary-100">
              Vergleiche Preise, buche direkt online
            </p>
          </div>

          {/* Search Card - Booking.com Style: One Line - Same as /home */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-3">
              <div className="flex flex-col md:flex-row gap-2">
                {/* Service Dropdown */}
                <div className="flex-1">
                  <select
                    defaultValue="TIRE_CHANGE"
                    className="w-full h-16 px-4 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                    disabled
                  >
                    <option value="TIRE_CHANGE">Räderwechsel</option>
                  </select>
                </div>

                {/* Location Input */}
                <div className="flex-1">
                  <div className="relative h-16">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="PLZ oder Ort"
                      className="w-full h-full pl-12 pr-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                      disabled
                    />
                  </div>
                </div>

                {/* Radius Dropdown */}
                <div className="w-full md:w-32">
                  <select
                    defaultValue="25"
                    className="w-full h-16 px-4 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:border-primary-600 focus:ring-4 focus:ring-primary-100 outline-none transition-all cursor-pointer hover:border-gray-300"
                    disabled
                  >
                    <option value="25">25 km</option>
                  </select>
                </div>

                {/* Search Button */}
                <Link
                  href="/home"
                  className="w-full md:w-auto h-16 px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <span className="hidden md:inline">Neue Suche</span>
                  <span className="md:hidden">Suchen</span>
                </Link>
              </div>
            </div>
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
                className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Zu Favoriten hinzufügen"
              >
                <span className="text-2xl">🤍</span>
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
              
              {workshop.estimatedDuration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>~ {workshop.estimatedDuration} Min.</span>
                </div>
              )}
            </div>
            
            {/* Price and Button - Below everything */}
            <div className="border-t pt-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gesamtpreis</p>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatEUR(workshop.totalPrice)}
                  </p>
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
          {workshop.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📜 Über die Werkstatt</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {workshop.description}
              </p>
            </div>
          )}

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
            <div className="border-t pt-6">
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

          {/* Booking Button */}
          {selectedSlot && (
            <div className="border-t mt-6 pt-6">
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
                className="w-full px-8 py-5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl transition-all text-xl shadow-lg hover:shadow-xl"
              >
                Jetzt buchen
              </button>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                🔒 Sie werden zur Anmeldung weitergeleitet
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}