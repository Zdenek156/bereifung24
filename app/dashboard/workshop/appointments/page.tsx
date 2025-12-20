'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Appointment {
  id: string
  appointmentDate: string
  appointmentTime: string
  estimatedDuration: number
  status: string
  paymentStatus: string
  completedAt: string | null
  customerNotes: string | null
  workshopNotes: string | null
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
  }
  offer: {
    tireBrand: string
    tireModel: string
    price: number
  }
  review: any | null
}

export default function WorkshopAppointments() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-orange-100 text-orange-800',
    }
    const labels = {
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
      // Show all upcoming appointments except COMPLETED and CANCELLED
      return apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED'
    }
    if (filter === 'completed') return apt.status === 'COMPLETED'
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

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
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
              ? 'ring-1.5 ring-primary-400 text-primary-600 hover:bg-primary-50'
              : isPast
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-900 cursor-pointer hover:bg-primary-50'
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
        <h3 className="text-center text-sm font-bold text-gray-900 mb-1.5">{monthName}</h3>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="w-7 text-center text-xs font-medium text-gray-600 py-0.5">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/workshop"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Zurück zum Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Termine & Kalender</h1>
              <p className="mt-1 text-sm text-gray-600">
                Verwalten Sie Ihre Kundentermine
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar View */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-2 mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Heute
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            {renderCalendar(0)}
            <div className="hidden md:block w-px bg-gray-200" />
            <div className="hidden md:block flex-1 min-w-0">
              {renderCalendar(1)}
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-3 text-xs text-gray-600">
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
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              Termine für <strong>{new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              {' '}werden unten angezeigt. Klicken Sie erneut um den Filter zu entfernen.
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Gesamt</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Anstehend</p>
            <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Abgeschlossen</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Storniert</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'upcoming'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Anstehend
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abgeschlossen
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'cancelled'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Storniert
            </button>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Termine</h3>
            <p className="mt-1 text-sm text-gray-500">
              Es gibt derzeit keine Termine in dieser Kategorie.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {new Date(apt.appointmentDate).toLocaleDateString('de-DE', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      {getStatusBadge(apt.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Uhrzeit: {apt.appointmentTime} ({apt.estimatedDuration} Minuten)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {apt.offer.price.toFixed(2)} €
                    </p>
                    <p className={`text-sm ${
                      apt.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {apt.paymentStatus === 'PAID' ? 'Bezahlt' : 'Ausstehend'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Kunde</h4>
                    <p className="text-sm text-gray-900 font-medium">
                      {apt.customer.user.firstName} {apt.customer.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{apt.customer.user.email}</p>
                    {apt.customer.user.phone && (
                      <p className="text-sm text-gray-600">{apt.customer.user.phone}</p>
                    )}
                    {apt.customer.user.street && (
                      <p className="text-sm text-gray-600">
                        {apt.customer.user.street}<br/>
                        {apt.customer.user.zipCode} {apt.customer.user.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Reifen</h4>
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
                  </div>
                </div>

                {apt.customerNotes && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Kundennotiz:</p>
                    <p className="text-sm text-blue-800">{apt.customerNotes}</p>
                  </div>
                )}

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
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
