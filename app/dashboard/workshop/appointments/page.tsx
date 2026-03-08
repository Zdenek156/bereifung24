'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Appointment {
  id: string
  appointmentDate: string
  appointmentTime: string
  estimatedDuration: number
  status: string
  paymentStatus: string
  completedAt: string | null
  createdAt?: string
  customerNotes: string | null
  workshopNotes: string | null
  isDirectBooking?: boolean
  paymentMethod?: string
  totalPrice?: number
  basePrice?: number
  balancingPrice?: number | null
  storagePrice?: number | null
  disposalFee?: number | null
  serviceType?: string
  // Direct Booking tire fields
  tireBrand?: string | null
  tireModel?: string | null
  tireSize?: string | null
  tireLoadIndex?: string | null
  tireSpeedIndex?: string | null
  tireEAN?: string | null
  tireQuantity?: number | null
  tirePurchasePrice?: number | null
  tireRunFlat?: boolean
  tire3PMSF?: boolean
  vehicle?: {
    make: string
    model: string
    year: number
    licensePlate: string | null
  }
  customer: {
    user: {
      firstName: string
      lastName: string
      email: string
      phone: string | null
      street: string | null
      zipCode: string | null
      city: string | null
    }
  }
  tireRequest: {
    season: string
    width: number
    aspectRatio: number
    diameter: number
    quantity: number
  } | null
  offer: {
    tireBrand: string
    tireModel: string
    price: number
  } | null
  review: any | null
}

// Service Type Translation Helper
const getServiceTypeName = (serviceType: string): string => {
  const serviceNames: Record<string, string> = {
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Radwechsel',
    'BALANCING': 'Auswuchten',
    'STORAGE': 'Einlagerung',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorradreifen',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice',
    'BRAKE_SERVICE': 'Bremsenservice',
    'BATTERY_SERVICE': 'Batterieservice',
    'OTHER_SERVICES': 'Sonstige Services'
  }
  return serviceNames[serviceType] || serviceType
}

export default function WorkshopAppointments() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming')
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'price-asc' | 'price-desc'>('date-asc')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonType, setCancelReasonType] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }

    fetchAppointments()
  }, [session, status, router])

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingId(appointmentId)
    setCancelReason('')
    setCancelReasonType('')
    setShowCancelDialog(true)
  }

  const confirmCancelAppointment = async () => {
    if (!cancellingId) return

    // Prüfe ob Typ bei Kunden-Termin ausgewählt wurde
    const apt = appointments.find(a => a.id === cancellingId)
    if (apt) {
      try {
        const customerData = JSON.parse(apt.customerNotes || '{}')
        if (!customerData.manualEntry && !cancelReasonType) {
          alert('Bitte wählen Sie einen Stornierungsgrund aus.')
          return
        }
      } catch {}
    }

    try {
      const response = await fetch(`/api/workshop/appointments/${cancellingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: cancelReason,
          reasonType: cancelReasonType
        })
      })

      if (response.ok) {
        // Aktualisiere die Terminliste
        await fetchAppointments()
        setShowCancelDialog(false)
        setCancellingId(null)
        setCancelReason('')
        setCancelReasonType('')
      } else {
        const data = await response.json()
        alert('Fehler beim Stornieren: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Fehler beim Stornieren des Termins')
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/workshop/appointments')
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded appointments:', data.length)
        console.log('Appointments data:', data.map((apt: any) => ({
          id: apt.id,
          status: apt.status,
          date: apt.appointmentDate,
          customer: apt.customer?.user?.email
        })))
        setAppointments(data)
      } else {
        console.error('Failed to fetch appointments:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      RESERVED: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-orange-100 text-orange-800',
    }
    const labels = {
      RESERVED: 'Reserviert',
      CONFIRMED: 'Bestätigt',
      COMPLETED: 'Abgeschlossen',
      CANCELLED: 'Storniert',
      NO_SHOW: 'Nicht erschienen',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const isUpcoming = (date: string) => {
    const appointmentDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return appointmentDate >= today
  }

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true
    if (filter === 'upcoming') {
      // Only show future (or today) appointments that are not COMPLETED or CANCELLED
      return apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && isUpcoming(apt.appointmentDate)
    }
    if (filter === 'completed') return apt.status === 'COMPLETED' || (apt.status !== 'CANCELLED' && !isUpcoming(apt.appointmentDate))
    if (filter === 'cancelled') return apt.status === 'CANCELLED'
    return true
  }).filter(apt => {
    // Additional date filter if a date is selected
    if (selectedDate) {
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0]
      return aptDate === selectedDate
    }
    return true
  })

  // Sortier-Funktion
  const sortedFilteredAppointments = [...filteredAppointments].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc': {
        // Extrahiere nur den Datums-Teil (YYYY-MM-DD) ohne Zeit
        const datePartA = a.appointmentDate.split('T')[0]
        const datePartB = b.appointmentDate.split('T')[0]
        // Stelle sicher, dass Zeit im HH:MM Format ist
        const timeA = a.appointmentTime.includes(':') ? a.appointmentTime : `${a.appointmentTime}:00`
        const timeB = b.appointmentTime.includes(':') ? b.appointmentTime : `${b.appointmentTime}:00`
        // Kombiniere zu validem ISO-String
        const dateTimeA = `${datePartA}T${timeA}:00`
        const dateTimeB = `${datePartB}T${timeB}:00`
        const dateA = new Date(dateTimeA)
        const dateB = new Date(dateTimeB)
        return dateA.getTime() - dateB.getTime()
      }
      case 'date-desc': {
        // Extrahiere nur den Datums-Teil (YYYY-MM-DD) ohne Zeit
        const datePartA = a.appointmentDate.split('T')[0]
        const datePartB = b.appointmentDate.split('T')[0]
        const timeA = a.appointmentTime.includes(':') ? a.appointmentTime : `${a.appointmentTime}:00`
        const timeB = b.appointmentTime.includes(':') ? b.appointmentTime : `${b.appointmentTime}:00`
        const dateTimeA = `${datePartA}T${timeA}:00`
        const dateTimeB = `${datePartB}T${timeB}:00`
        const dateA = new Date(dateTimeA)
        const dateB = new Date(dateTimeB)
        return dateB.getTime() - dateA.getTime()
      }
      case 'price-asc': {
        const priceA = a.totalPrice || a.offer?.price || 0
        const priceB = b.totalPrice || b.offer?.price || 0
        return priceA - priceB
      }
      case 'price-desc': {
        const priceA = a.totalPrice || a.offer?.price || 0
        const priceB = b.totalPrice || b.offer?.price || 0
        return priceB - priceA
      }
      default:
        return 0
    }
  })

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && isUpcoming(a.appointmentDate)).length,
    completed: appointments.filter(a => a.status === 'COMPLETED' || (a.status !== 'CANCELLED' && !isUpcoming(a.appointmentDate))).length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
  }

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0]
      return aptDate === date && apt.status !== 'CANCELLED'
    })
  }

  const renderCalendar = (monthOffset: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1)
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(date)
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    
    const days = []
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 // Monday = 0
    
    // Empty cells for days before month starts
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-7 h-7" />)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayAppointments = getAppointmentsForDate(dateStr)
      const isToday = dateStr === new Date().toISOString().split('T')[0]
      const isSelected = dateStr === selectedDate
      const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0))
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
          className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium relative transition-colors ${
            isSelected
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : isToday
              ? 'ring-1.5 ring-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30'
              : isPast
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-900 dark:text-gray-300 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/30'
          }`}
          title={dayAppointments.length > 0 ? `${dayAppointments.length} Termin(e)` : undefined}
        >
          {day}
          {dayAppointments.length > 0 && (
            <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5`}>
              {dayAppointments.slice(0, 3).map((apt, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${
                    isSelected ? 'bg-white' : apt.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  title={`${apt.appointmentTime} - ${apt.customer.user.firstName} ${apt.customer.user.lastName}`}
                />
              ))}
            </div>
          )}
        </button>
      )
    }
    
    return (
      <div className="flex-1 min-w-0">
        <h3 className="text-center text-sm font-bold text-gray-900 dark:text-white mb-1.5">{monthName}</h3>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="w-7 text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-0.5">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days}
        </div>
      </div>
    )
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Termine & Kalender</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Verwalten Sie Ihre Kundentermine</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar View */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-2 mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Heute
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            {renderCalendar(0)}
            <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700" />
            <div className="hidden md:block flex-1 min-w-0">
              {renderCalendar(1)}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Bestätigt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Sonstige</span>
            </div>
          </div>
          
          {selectedDate && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded text-xs text-blue-800 dark:text-blue-300">
              Termine für <strong>{new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              {' '}werden unten angezeigt. Klicken Sie erneut um den Filter zu entfernen.
            </div>
          )}
        </div>

        {/* Statistics - Inline Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-2.5 mb-4 flex items-center gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Gesamt</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Anstehend</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.upcoming}</span>
          </div>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Abgeschlossen</span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.completed}</span>
          </div>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 dark:text-gray-400">Storniert</span>
            <span className="text-lg font-bold text-red-600 dark:text-red-400">{stats.cancelled}</span>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-2 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {(['upcoming', 'all', 'completed', 'cancelled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filter === f
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {{ upcoming: 'Anstehend', all: 'Alle', completed: 'Abgeschlossen', cancelled: 'Storniert' }[f]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="sortBy" className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Sortierung:</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500"
              >
                <option value="date-asc">Datum ↑</option>
                <option value="date-desc">Datum ↓</option>
                <option value="price-asc">Preis ↑</option>
                <option value="price-desc">Preis ↓</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {sortedFilteredAppointments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Keine Termine</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Es gibt derzeit keine Termine in dieser Kategorie.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sortedFilteredAppointments.map((apt) => {
              const isExpanded = expandedId === apt.id
              const statusColors: Record<string, string> = {
                RESERVED: 'border-l-yellow-400',
                CONFIRMED: 'border-l-blue-500',
                COMPLETED: 'border-l-green-500',
                CANCELLED: 'border-l-red-500',
                NO_SHOW: 'border-l-orange-500',
              }
              // Resolve price + customer name for compact row
              let displayPrice: number | null = null
              let paymentLabel = ''
              let isManualEntry = false
              let manualPrice: number | null = null
              let customerName = ''
              let serviceName = ''
              try {
                if (apt.customerNotes) {
                  const cd = JSON.parse(apt.customerNotes)
                  if (cd.manualEntry) {
                    isManualEntry = true
                    manualPrice = cd.price || null
                    customerName = cd.customerName || ''
                  }
                }
              } catch {}
              if (apt.isDirectBooking && apt.totalPrice) {
                displayPrice = apt.totalPrice
                paymentLabel = '✓ PayPal'
              } else if (isManualEntry && manualPrice) {
                displayPrice = manualPrice
                paymentLabel = 'Manuell'
              } else if (apt.offer) {
                displayPrice = apt.offer.price
                paymentLabel = apt.paymentStatus === 'PAID' ? 'Bezahlt' : 'Ausstehend'
              }
              if (!customerName && apt.customer) {
                customerName = `${apt.customer.user.firstName} ${apt.customer.user.lastName}`
              }
              if (!customerName && apt.notes) {
                try { const nd = JSON.parse(apt.notes); customerName = nd.customerName || '' } catch {}
              }
              if (apt.isDirectBooking) {
                serviceName = getServiceTypeName(apt.serviceType || '')
              } else if (isManualEntry && apt.offer) {
                serviceName = apt.offer.tireModel || ''
              } else if (apt.offer) {
                serviceName = `${apt.offer.tireBrand || ''} ${apt.offer.tireModel || ''}`.trim()
              }

              return (
              <div
                key={apt.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${statusColors[apt.status] || 'border-l-gray-300'} overflow-hidden`}
              >
                {/* Compact row — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {new Date(apt.appointmentDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}, {apt.appointmentTime}
                          </span>
                          {getStatusBadge(apt.status)}
                          {isManualEntry && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">Manuell</span>
                          )}
                          {apt.isDirectBooking && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">PayPal</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {customerName && <span className="truncate max-w-[150px]">{customerName}</span>}
                          {customerName && serviceName && <span>·</span>}
                          {serviceName && <span className="truncate max-w-[200px]">{serviceName}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {displayPrice !== null && (
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(displayPrice)}
                        </span>
                      )}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700">
                  {/* Date/Time details */}
                  <div className="pt-2 mb-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>{new Date(apt.appointmentDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>{apt.appointmentTime} ({apt.estimatedDuration} Min.)</span>
                    {apt.createdAt && <span>Erstellt: {new Date(apt.createdAt).toLocaleDateString('de-DE')} {new Date(apt.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>

                  {/* Payment info */}
                  {displayPrice !== null && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-base font-bold text-primary-600">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(displayPrice)}
                      </span>
                      {paymentLabel && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          paymentLabel.includes('Bezahlt') || paymentLabel.includes('PayPal') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                          paymentLabel === 'Manuell' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        }`}>{paymentLabel}</span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Kunde</h4>
                    {(() => {
                      // Prüfe zuerst customerNotes (für manuelle Termine)
                      if (apt.customerNotes) {
                        try {
                          const customerData = JSON.parse(apt.customerNotes)
                          if (customerData.manualEntry) {
                            // Für manuell erstellte Termine mit WorkshopCustomer
                            if (customerData.workshopCustomerId) {
                              // TODO: Laden der WorkshopCustomer-Daten (wenn nötig)
                              // Erstmal die gespeicherten Daten verwenden
                              return (
                                <>
                                  {customerData.customerName && (
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">{customerData.customerName}</p>
                                  )}
                                  {customerData.customerEmail && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{customerData.customerEmail}</p>
                                  )}
                                  {customerData.customerPhone && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{customerData.customerPhone}</p>
                                  )}
                                </>
                              )
                            }
                            // Für manuelle Termine ohne WorkshopCustomer (Einmal-Kunde)
                            return (
                              <>
                                {customerData.customerName && (
                                  <p className="text-sm text-gray-900 dark:text-white font-medium">{customerData.customerName}</p>
                                )}
                                {customerData.customerEmail && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{customerData.customerEmail}</p>
                                )}
                                {customerData.customerPhone && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{customerData.customerPhone}</p>
                                )}
                                {!customerData.customerName && !customerData.customerEmail && !customerData.customerPhone && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">Keine Kundeninformationen</p>
                                )}
                              </>
                            )
                          }
                        } catch {}
                      }
                      
                      // Normale Termine mit Customer-Objekt
                      if (apt.customer) {
                        return (
                          <>
                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                              {apt.customer.user.firstName} {apt.customer.user.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{apt.customer.user.email}</p>
                            {apt.customer.user.phone && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{apt.customer.user.phone}</p>
                            )}
                            {apt.customer.user.street && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {apt.customer.user.street}<br/>
                                {apt.customer.user.zipCode} {apt.customer.user.city}
                              </p>
                            )}
                          </>
                        )
                      }
                      
                      // Alte Struktur (apt.notes)
                      if (apt.notes) {
                        try {
                          const notesData = JSON.parse(apt.notes)
                          return (
                            <>
                              {notesData.customerName && (
                                <p className="text-sm text-gray-900 dark:text-white font-medium">{notesData.customerName}</p>
                              )}
                              {notesData.customerEmail && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{notesData.customerEmail}</p>
                              )}
                              {notesData.customerPhone && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{notesData.customerPhone}</p>
                              )}
                              {!notesData.customerName && !notesData.customerEmail && !notesData.customerPhone && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Keine Kundeninformationen</p>
                              )}
                            </>
                          )
                        } catch {
                          return <p className="text-sm text-gray-500 dark:text-gray-400 italic">Keine Kundeninformationen</p>
                        }
                      }
                      
                      return <p className="text-sm text-gray-500 dark:text-gray-400 italic">Keine Kundeninformationen</p>
                    })()}
                  </div>

                  <div>
                    {/* DirectBooking (PayPal) */}
                    {apt.isDirectBooking ? (
                      <>
                        <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Service</h4>
                        <p className="text-sm text-gray-900 font-medium">
                          {getServiceTypeName(apt.serviceType || '')}
                        </p>
                        {apt.vehicle && (
                          <>
                            <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 mt-2">Fahrzeug</h4>
                            <p className="text-sm text-gray-900">
                              {apt.vehicle.make} {apt.vehicle.model} ({apt.vehicle.year})
                            </p>
                            {apt.vehicle.licensePlate && (
                              <p className="text-sm text-gray-600">
                                Kennzeichen: {apt.vehicle.licensePlate}
                              </p>
                            )}
                          </>
                        )}
                        {apt.totalPrice && (
                          <>
                            <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 mt-2">Preis</h4>
                            <p className="text-sm text-gray-900 font-semibold">
                              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(apt.totalPrice)}
                            </p>
                            <p className="text-xs text-green-600 font-medium mt-1">
                              ✓ Bereits bezahlt (PayPal)
                            </p>
                          </>
                        )}
                        {apt.tireBrand && apt.tireModel && (
                          <>
                            <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 mt-2">🛞 Reifen</h4>
                            <p className="text-sm text-gray-900 font-medium">
                              {apt.tireBrand} {apt.tireModel}
                            </p>
                            {apt.tireSize && (
                              <p className="text-sm text-gray-600">
                                Größe: {apt.tireSize} {apt.tireLoadIndex || ''}{apt.tireSpeedIndex || ''}
                              </p>
                            )}
                            {apt.tireQuantity && (
                              <p className="text-sm text-gray-600">
                                Menge: {apt.tireQuantity} Stück
                              </p>
                            )}
                            {apt.tireEAN && (
                              <p className="text-xs text-gray-500 mt-1">
                                EAN: {apt.tireEAN}
                              </p>
                            )}
                            <div className="flex gap-2 mt-1">
                              {apt.tireRunFlat && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  ⚡ RunFlat
                                </span>
                              )}
                              {apt.tire3PMSF && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  ❄️ Winter
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    ) : apt.tireRequest && apt.offer ? (
                      (() => {
                        // Prüfe ob es ein manueller Termin ist (customerNotes als JSON)
                        let isManualEntryLocal = false
                        try {
                          if (apt.customerNotes) {
                            const customerData = JSON.parse(apt.customerNotes)
                            isManualEntryLocal = customerData.manualEntry === true
                          }
                        } catch {}

                        // Wenn es ein manueller Termin ist, zeige Service-Info statt Reifen-Dummy-Daten
                        if (isManualEntryLocal) {
                          return (
                            <>
                              <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Service</h4>
                              <p className="text-sm text-gray-900 font-medium">
                                {apt.offer.tireModel}
                              </p>
                              {apt.offer.description && apt.offer.description !== apt.offer.tireModel && (
                                <p className="text-sm text-gray-600">
                                  {apt.offer.description}
                                </p>
                              )}
                            </>
                          )
                        }

                        // Normaler Reifen-Termin
                        return (
                          <>
                            <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Reifen</h4>
                            <p className="text-sm text-gray-900 font-medium">
                              {apt.offer.tireBrand} {apt.offer.tireModel}
                            </p>
                            <p className="text-sm text-gray-600">
                              {apt.tireRequest.width}/{apt.tireRequest.aspectRatio} R{apt.tireRequest.diameter}
                            </p>
                            <p className="text-sm text-gray-600">
                              {apt.tireRequest.season === 'SUMMER' ? 'Sommerreifen' : 
                               apt.tireRequest.season === 'WINTER' ? 'Winterreifen' : 'Ganzjahresreifen'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Menge: {apt.tireRequest.quantity} Stück
                            </p>
                          </>
                        )
                      })()
                    ) : apt.notes ? (
                      (() => {
                        try {
                          const notesData = JSON.parse(apt.notes)
                          return (
                            <>
                              {notesData.serviceDescription && (
                                <>
                                  <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Service</h4>
                                  <p className="text-sm text-gray-900">{notesData.serviceDescription}</p>
                                </>
                              )}
                              {notesData.vehicleInfo && (
                                <>
                                  <h4 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 mt-2">Fahrzeug</h4>
                                  <p className="text-sm text-gray-900">{notesData.vehicleInfo}</p>
                                </>
                              )}
                              {!notesData.serviceDescription && !notesData.vehicleInfo && (
                                <p className="text-sm text-gray-500 italic">Keine Service-Informationen</p>
                              )}
                            </>
                          )
                        } catch {
                          return <p className="text-sm text-gray-500 italic">Keine Service-Informationen</p>
                        }
                      })()
                    ) : (
                      <p className="text-sm text-gray-500 italic">Keine Service-Informationen</p>
                    )}
                  </div>
                </div>

                {apt.customerNotes && (() => {
                  try {
                    const customerData = JSON.parse(apt.customerNotes)
                    
                    // Für manuelle Einträge: Keine extra Box mehr, da alle Infos oben sind
                    // Nur interne Notizen anzeigen falls vorhanden
                    if (customerData.manualEntry) {
                      if (customerData.internalNotes) {
                        return (
                          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Interne Notizen:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{customerData.internalNotes}</p>
                          </div>
                        )
                      }
                      return null
                    }
                    
                    // Normale Kundennotiz
                    return (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Kundennotiz:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{apt.customerNotes}</p>
                      </div>
                    )
                  } catch {
                    // Falls JSON.parse fehlschlägt, zeige als Text
                    return (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Kundennotiz:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{apt.customerNotes}</p>
                      </div>
                    )
                  }
                })()}

                {apt.notes && (() => {
                  try {
                    const notesData = JSON.parse(apt.notes)
                    if (notesData.internalNotes) {
                      return (
                        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 mb-1">Interne Notizen:</p>
                          <p className="text-sm text-gray-700">{notesData.internalNotes}</p>
                        </div>
                      )
                    }
                  } catch {}
                  return null
                })()}

                {apt.workshopNotes && (
                  <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">Werkstattnotiz:</p>
                    <p className="text-sm text-gray-700">{apt.workshopNotes}</p>
                  </div>
                )}

                {apt.review && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-yellow-900">Bewertung:</span>
                      <span className="text-yellow-500">{'⭐'.repeat(apt.review.rating)}</span>
                    </div>
                    {apt.review.comment && (
                      <p className="text-sm text-yellow-800">{apt.review.comment}</p>
                    )}
                  </div>
                )}

                {apt.status === 'COMPLETED' && apt.completedAt && (
                  <div className="mt-3 text-sm text-gray-600">
                    Abgeschlossen am: {new Date(apt.completedAt).toLocaleDateString('de-DE')}
                  </div>
                )}

                {/* Stornieren Button - nur für zukünftige ausstehende/bestätigte Termine */}
                {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && isUpcoming(apt.appointmentDate) && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancelAppointment(apt.id) }}
                      className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Termin {apt.status === 'PENDING' ? 'ablehnen' : 'stornieren'}
                    </button>
                  </div>
                )}
                </div>
                )}
              </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Stornierungsdialog */}
      {showCancelDialog && (() => {
        const apt = appointments.find(a => a.id === cancellingId)
        if (!apt) return null
        
        let isManualEntry = false
        try {
          const customerData = JSON.parse(apt.customerNotes || '{}')
          isManualEntry = customerData.manualEntry === true
        } catch {}

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Termin stornieren
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {isManualEntry 
                  ? 'Möchten Sie diesen manuellen Termin wirklich stornieren?'
                  : 'Möchten Sie diesen Kunden-Termin wirklich stornieren? Das Angebot bleibt bestehen und die Provision ist weiterhin fällig. Der Kunde wird per Email benachrichtigt.'}
              </p>
              
              {!isManualEntry && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stornierungsgrund <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={cancelReasonType}
                    onChange={(e) => setCancelReasonType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="customer_cancelled">Kunde hat abgesagt</option>
                    <option value="workshop_unavailable">Werkstatt nicht verfügbar</option>
                    <option value="technical_issue">Technisches Problem</option>
                    <option value="parts_unavailable">Fahrzeugteile nicht verfügbar</option>
                    <option value="reschedule_needed">Neuer Termin erforderlich</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isManualEntry ? 'Notiz (optional)' : 'Zusätzliche Nachricht an den Kunden (optional)'}
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder={isManualEntry ? 'Interne Notiz...' : 'z.B. Bitte rufen Sie uns an für einen neuen Termin...'}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelDialog(false)
                    setCancellingId(null)
                    setCancelReason('')
                    setCancelReasonType('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={confirmCancelAppointment}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Stornieren
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
