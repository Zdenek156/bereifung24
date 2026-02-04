'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Car, Euro, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface DirectBooking {
  id: string
  bookingNumber: string
  serviceType: string
  date: string
  time: string
  status: string
  paymentStatus: string
  paymentMethod: string
  basePrice: number
  balancingPrice: number | null
  storagePrice: number | null
  totalPrice: number
  hasBalancing: boolean
  hasStorage: boolean
  durationMinutes: number
  createdAt: string
  workshop: {
    id: string
    companyName: string
    address: string
    city: string
    postalCode: string
    phone: string
    email: string
  }
  vehicle: {
    id: string
    brand: string
    model: string
    licensePlate: string
    year: number
  }
}

const serviceTypeLabels: Record<string, string> = {
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_CHANGE: 'Reifenwechsel',
  TIRE_HOTEL: 'Reifenhotel',
  WHEEL_ALIGNMENT: 'Achsvermessung',
  TIRE_REPAIR: 'Reifenreparatur',
  NEW_TIRES: 'Neue Reifen'
}

const statusLabels: Record<string, { label: string, color: string, icon: JSX.Element }> = {
  PENDING: {
    label: 'Ausstehend',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: <AlertCircle className="h-4 w-4" />
  },
  CONFIRMED: {
    label: 'Bestätigt',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <CheckCircle className="h-4 w-4" />
  },
  COMPLETED: {
    label: 'Abgeschlossen',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: <CheckCircle className="h-4 w-4" />
  },
  CANCELLED: {
    label: 'Storniert',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: <XCircle className="h-4 w-4" />
  }
}

const paymentStatusLabels: Record<string, { label: string, color: string }> = {
  PENDING: {
    label: 'Ausstehend',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  },
  PAID: {
    label: 'Bezahlt',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  },
  FAILED: {
    label: 'Fehlgeschlagen',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  },
  REFUNDED: {
    label: 'Erstattet',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

export default function BookingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<DirectBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/customer/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    
    const bookingDate = new Date(booking.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (filter === 'upcoming') {
      return bookingDate >= today && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'
    }
    
    if (filter === 'past') {
      return bookingDate < today || booking.status === 'COMPLETED' || booking.status === 'CANCELLED'
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Meine Buchungen
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Übersicht aller Ihrer Direktbuchungen
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Alle ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === 'upcoming'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Anstehend ({bookings.filter(b => {
              const bookingDate = new Date(b.date)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return bookingDate >= today && b.status !== 'CANCELLED' && b.status !== 'COMPLETED'
            }).length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === 'past'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Vergangen ({bookings.filter(b => {
              const bookingDate = new Date(b.date)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return bookingDate < today || b.status === 'COMPLETED' || b.status === 'CANCELLED'
            }).length})
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Keine Buchungen gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Sie haben noch keine Buchungen vorgenommen.'
                : filter === 'upcoming'
                ? 'Sie haben keine anstehenden Buchungen.'
                : 'Sie haben keine vergangenen Buchungen.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/dashboard/customer/direct-booking')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Jetzt buchen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => router.push(`/dashboard/customer/bookings/${booking.id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {serviceTypeLabels[booking.serviceType] || booking.serviceType}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusLabels[booking.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[booking.status]?.icon}
                          {statusLabels[booking.status]?.label || booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Buchungsnr.: {booking.bookingNumber}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatPrice(booking.totalPrice)}
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${paymentStatusLabels[booking.paymentStatus]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {paymentStatusLabels[booking.paymentStatus]?.label || booking.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Termin */}
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Termin</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(booking.date)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {booking.time} Uhr
                        </p>
                      </div>
                    </div>

                    {/* Werkstatt */}
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Werkstatt</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.workshop.companyName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {booking.workshop.city}
                        </p>
                      </div>
                    </div>

                    {/* Fahrzeug */}
                    <div className="flex items-start gap-3">
                      <Car className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fahrzeug</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.vehicle.brand} {booking.vehicle.model}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {booking.vehicle.licensePlate}
                        </p>
                      </div>
                    </div>

                    {/* Dauer */}
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dauer</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.durationMinutes} Minuten
                        </p>
                        {(booking.hasBalancing || booking.hasStorage) && (
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {booking.hasBalancing && 'Wuchten'}{booking.hasBalancing && booking.hasStorage && ' + '}
                            {booking.hasStorage && 'Einlagerung'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Gebucht am: {new Date(booking.createdAt).toLocaleDateString('de-DE')}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                      Details anzeigen →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
