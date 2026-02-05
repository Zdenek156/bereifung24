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
  const [busySlots, setBusySlots] = useState<any[]>([])

  // Load workshop details from URL params or fetch
  useEffect(() => {
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
    }
    setWorkshop(workshopData)
    setLoading(false)
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
        setBusySlots(data.busySlots || [])
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
    return availableSlots.some(slot => slot.date === dateStr && slot.availableSlots > 0)
  }

  const isDatePast = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const daySlots = availableSlots.find(slot => slot.date === dateStr)
    return daySlots?.slots || []
  }

  const handleDateClick = (date: Date | null) => {
    if (!date || isDatePast(date) || !isDateAvailable(date)) return
    setSelectedDate(date)
    setSelectedSlot(null) // Reset slot selection
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
      {/* Header with Search */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/home" className="flex items-center gap-2 text-white hover:text-primary-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Zurück zur Suche</span>
            </Link>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Bereifung24</h1>
          
          {/* Search Form - Same as /home */}
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  defaultValue="TIRE_CHANGE"
                  disabled
                >
                  <option value="TIRE_CHANGE">Räderwechsel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postleitzahl
                </label>
                <input
                  type="text"
                  placeholder="z.B. 59955"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Umkreis
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  defaultValue="25"
                  disabled
                >
                  <option value="25">25 km</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <Link
                href="/home"
                className="w-full md:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors inline-block text-center"
              >
                Neue Suche starten
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Info */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {workshop.name}
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Gesamtpreis</p>
              <p className="text-3xl font-bold text-primary-600">
                {formatEUR(workshop.totalPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Verfügbare Termine</h3>
          
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={currentMonth <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <span className="text-lg font-semibold">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Month 1 */}
            <div>
              <h4 className="text-center font-semibold mb-3">
                {month1.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="grid grid-cols-7 gap-1">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {days1.map((date, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDateClick(date)}
                    disabled={!date || isDatePast(date) || !isDateAvailable(date)}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                      ${!date ? 'invisible' : ''}
                      ${isDatePast(date) ? 'text-gray-300 cursor-not-allowed' : ''}
                      ${isDateAvailable(date) ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer' : ''}
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
              <h4 className="text-center font-semibold mb-3">
                {month2.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="grid grid-cols-7 gap-1">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {days2.map((date, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDateClick(date)}
                    disabled={!date || isDatePast(date) || !isDateAvailable(date)}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                      ${!date ? 'invisible' : ''}
                      ${isDatePast(date) ? 'text-gray-300 cursor-not-allowed' : ''}
                      ${isDateAvailable(date) ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer' : ''}
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
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span>Verfügbar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>Ausgebucht</span>
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">
                Verfügbare Zeiten am {selectedDate.toLocaleDateString('de-DE', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {getSlotsForDate(selectedDate).map((slot: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleSlotSelect(slot)}
                    className={`
                      px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
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
            </div>
          )}

          {/* Booking Button */}
          {selectedSlot && (
            <div className="border-t mt-6 pt-6">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Ausgewählter Termin:</strong>
                </p>
                <p className="text-lg font-semibold text-primary-700">
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
                className="w-full px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors text-lg"
              >
                Jetzt buchen
              </button>
              
              <p className="text-sm text-gray-500 text-center mt-3">
                Sie werden zur Anmeldung weitergeleitet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
