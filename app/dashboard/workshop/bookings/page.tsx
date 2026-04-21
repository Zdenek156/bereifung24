'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Car, User, Package, CheckCircle, AlertCircle } from 'lucide-react'

interface Booking {
  id: string
  serviceType: string
  serviceSubtype: string | null
  date: string
  time: string
  status: string
  paymentStatus: string
  totalPrice: number
  workshopPayout: number | null
  platformCommission: number | null
  basePrice: number
  balancingPrice: number | null
  storagePrice: number | null
  disposalFee: number | null
  runFlatSurcharge: number | null
  totalTirePurchasePrice: number | null
  hasBalancing: boolean
  hasStorage: boolean
  hasWashing: boolean
  hasDisposal: boolean
  tireRunFlat: boolean
  washingPrice: number | null
  durationMinutes: number
  paymentMethod: string
  // Invoice
  invoiceUrl: string | null
  invoiceUploadedAt: string | null
  invoiceRequestedAt: string | null
  // Tire details
  tireBrand: string | null
  tireModel: string | null
  tireSize: string | null
  tireLoadIndex: string | null
  tireSpeedIndex: string | null
  tireQuantity: number | null
  tirePurchasePrice: number | null
  createdAt: string
  paidAt: string | null
  customer: {
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
      phone: string | null
      street: string | null
      city: string | null
      zipCode: string | null
    }
  }
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    licensePlate: string | null
  }
  // Storage
  storageLocation: string | null
  fromStorageBookingId: string | null
  customerNotes: string | null
  review: {
    id: string
    rating: number
    comment: string | null
    createdAt: string
  } | null
}

const serviceTypeLabels: Record<string, string> = {
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_CHANGE: 'Reifenwechsel',
  TIRE_STORAGE: 'Reifeneinlagerung',
  TIRE_HOTEL: 'Reifen-Hotel',
  TIRE_REPAIR: 'Reifenreparatur',
  MOTORCYCLE_TIRE: 'Motorradreifen',
  ALIGNMENT_BOTH: 'Achsvermessung',
  CLIMATE_SERVICE: 'Klimaservice'
}

const subtypeLabels: Record<string, string> = {
  'foreign_object': 'Fremdkörper-Entfernung',
  'valve_damage': 'Ventilschaden',
  'basic': 'Basis',
  'comfort': 'Komfort',
  'premium': 'Premium',
  'check': 'Prüfung',
  'measurement_front': 'Vermessung Vorderachse',
  'measurement_rear': 'Vermessung Hinterachse',
  'measurement_both': 'Vermessung beide Achsen',
  'adjustment_front': 'Einstellung Vorderachse',
  'adjustment_rear': 'Einstellung Hinterachse',
  'adjustment_both': 'Einstellung beide Achsen',
  'full_service': 'Komplett-Service'
}

function getServiceDisplayName(serviceType: string, serviceSubtype: string | null | undefined): string {
  const base = serviceTypeLabels[serviceType] || serviceType
  if (serviceSubtype && subtypeLabels[serviceSubtype]) {
    return `${base} - ${subtypeLabels[serviceSubtype]}`
  }
  return base
}

const statusLabels: Record<string, string> = {
  RESERVED: 'Reserviert',
  CONFIRMED: 'Bestätigt',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Storniert'
}

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'upcoming' | 'past'
type SortOption = 'date-asc' | 'date-desc' | 'created-desc' | 'created-asc' | 'price-asc' | 'price-desc'

const timeFilterLabels: Record<TimeFilter, string> = {
  all: 'Alle',
  upcoming: 'Kommende',
  today: 'Heute',
  week: 'Diese Woche',
  month: 'Dieser Monat',
  past: 'Abgelaufen'
}

const sortLabels: Record<SortOption, string> = {
  'date-asc': 'Termin ↑ nächste zuerst',
  'date-desc': 'Termin ↓ älteste zuerst',
  'created-desc': 'Buchungsdatum ↓ neueste',
  'created-asc': 'Buchungsdatum ↑ älteste',
  'price-desc': 'Preis ↓ höchste zuerst',
  'price-asc': 'Preis ↑ niedrigste zuerst'
}

export default function WorkshopBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('workshop-bookings-timeFilter') as TimeFilter) || 'all'
    }
    return 'all'
  })
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('workshop-bookings-sortOption') as SortOption) || 'date-asc'
    }
    return 'date-asc'
  })
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [uploadingInvoice, setUploadingInvoice] = useState<string | null>(null)
  const [editingStorageId, setEditingStorageId] = useState<string | null>(null)
  const [storageLocationValue, setStorageLocationValue] = useState('')
  const [savingStorage, setSavingStorage] = useState(false)

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

    fetchBookings()
  }, [session, status, router])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workshop/bookings')
      // Defensive: filter out bookings missing customer or vehicle (data integrity issue)
      // to prevent client-side TypeError when accessing booking.customer.user.firstName
      
      if (response.ok) {
        const data = await response.json()
        const safeBookings = (data.bookings || []).filter((b: any) => b && b.customer && b.customer.user && b.vehicle)
        setBookings(safeBookings)
      } else {
        console.error('Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceUpload = async (bookingId: string, file: File) => {
    try {
      setUploadingInvoice(bookingId)
      
      const formData = new FormData()
      formData.append('invoice', file)
      
      const response = await fetch(`/api/workshop/bookings/${bookingId}/upload-invoice`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('Rechnung erfolgreich hochgeladen!')
        // Refresh bookings to show updated invoice status
        fetchBookings()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Upload fehlgeschlagen'}`)
      }
    } catch (error) {
      console.error('Error uploading invoice:', error)
      alert('Fehler beim Hochladen der Rechnung')
    } finally {
      setUploadingInvoice(null)
    }
  }

  const handleSaveStorageLocation = async (bookingId: string) => {
    try {
      setSavingStorage(true)
      const response = await fetch(`/api/workshop/bookings/${bookingId}/storage-location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageLocation: storageLocationValue.trim() })
      })
      if (response.ok) {
        // Update local state
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, storageLocation: storageLocationValue.trim() || null } : b))
        setEditingStorageId(null)
        setStorageLocationValue('')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Speichern fehlgeschlagen'}`)
      }
    } catch (error) {
      console.error('Error saving storage location:', error)
      alert('Fehler beim Speichern des Lagerorts')
    } finally {
      setSavingStorage(false)
    }
  }

  // Time-based filtering
  const filteredBookings = bookings.filter(b => {
    if (timeFilter === 'all') return true
    const bookingDate = new Date(b.date)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (timeFilter === 'upcoming') {
      return bookingDate >= today
    }
    if (timeFilter === 'past') {
      return bookingDate < today
    }
    if (timeFilter === 'today') {
      return bookingDate >= today && bookingDate < new Date(today.getTime() + 86400000)
    }
    if (timeFilter === 'week') {
      const dayOfWeek = now.getDay() || 7 // Mon=1...Sun=7
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - (dayOfWeek - 1))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      return bookingDate >= weekStart && bookingDate < weekEnd
    }
    if (timeFilter === 'month') {
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()
    }
    return true
  })

  // Persist filter & sort to localStorage
  useEffect(() => {
    localStorage.setItem('workshop-bookings-timeFilter', timeFilter)
  }, [timeFilter])
  useEffect(() => {
    localStorage.setItem('workshop-bookings-sortOption', sortOption)
  }, [sortOption])

  // Helper: parse booking date + time into timestamp
  const getBookingTimestamp = (b: Booking) => {
    const dateStr = b.date.slice(0, 10) // "2026-03-10T00:00:00.000Z" → "2026-03-10"
    return new Date(`${dateStr}T${b.time}`).getTime()
  }

  // Sort filtered bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    switch (sortOption) {
      case 'date-asc': {
        // "Nächste zuerst": future appointments first (closest upcoming), then past (most recent past first)
        const now = Date.now()
        const da = getBookingTimestamp(a)
        const db = getBookingTimestamp(b)
        const aFuture = da >= now
        const bFuture = db >= now
        if (aFuture && !bFuture) return -1
        if (!aFuture && bFuture) return 1
        if (aFuture && bFuture) return da - db
        return db - da
      }
      case 'date-desc': {
        return getBookingTimestamp(b) - getBookingTimestamp(a)
      }
      case 'created-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'created-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'price-desc':
        return b.totalPrice - a.totalPrice
      case 'price-asc':
        return a.totalPrice - b.totalPrice
      default:
        return 0
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Buchungen...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Buchungen</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Übersicht aller Direktbuchungen Ihrer Werkstatt</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* Time Filter Pills + Sort */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {(Object.keys(timeFilterLabels) as TimeFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setTimeFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              timeFilter === key
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            {timeFilterLabels[key]}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
          >
            {(Object.keys(sortLabels) as SortOption[]).map((key) => (
              <option key={key} value={key}>{sortLabels[key]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Buchungen:</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{sortedBookings.length}</span>
        </div>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Umsatz:</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {sortedBookings
              .filter(b => b.paymentStatus === 'PAID')
              .reduce((sum, b) => sum + b.totalPrice, 0)
              .toFixed(2)} €
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Bewertungen:</span>
          <span className="text-sm font-bold text-yellow-600">{sortedBookings.filter(b => b.review).length}</span>
        </div>
      </div>

      {/* Bookings List */}
      {sortedBookings.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <h3 className="text-sm font-semibold mb-1">Keine Buchungen gefunden</h3>
          <p className="text-xs text-gray-500">
            {timeFilter === 'all' 
              ? 'Es wurden noch keine Buchungen getätigt.' 
              : `Keine Buchungen für "${timeFilterLabels[timeFilter]}".`}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedBookings.map((booking) => {
            const isCancelled = booking.status === 'CANCELLED'
            const borderColor = isCancelled ? 'border-l-red-500' : 'border-l-primary-500'

            return (
            <div
              key={booking.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${borderColor} overflow-hidden hover:shadow-md transition-shadow`}
            >
              {/* Compact Main Row */}
              <div
                className="px-4 py-3 cursor-pointer"
                onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
              >
                {/* Top row: Service + Status + Price */}
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {getServiceDisplayName(booking.serviceType, booking.serviceSubtype)}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono shrink-0">#{booking.id.slice(-7).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{booking.totalPrice.toFixed(2)} €</span>
                    {isCancelled ? (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Storniert</span>
                    ) : (
                      <span className="text-[11px] font-medium text-green-600 dark:text-green-400">✓</span>
                    )}
                  </div>
                </div>

                {/* Bottom row: Date | Customer | Vehicle */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(booking.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}, {booking.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {booking.customer.user.firstName} {booking.customer.user.lastName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {booking.vehicle.make} {booking.vehicle.model}
                    {booking.vehicle.licensePlate && <span className="text-gray-400"> · {booking.vehicle.licensePlate}</span>}
                  </span>
                  {booking.paymentMethod && (
                    <span className="text-gray-400">
                      {booking.paymentMethod === 'STRIPE' ? 'Kreditkarte' : booking.paymentMethod}
                    </span>
                  )}
                  {booking.fromStorageBookingId && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium">
                      📦 Eingelagerte Reifen
                    </span>
                  )}
                  {booking.hasStorage && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-medium">
                      📦 {booking.storageLocation ? `Lager: ${booking.storageLocation}` : 'Einlagerung'}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-gray-400">
                    {expandedBooking === booking.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

                {/* Expanded Details */}
                {expandedBooking === booking.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-4">
                    {/* Full info grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Termin</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(booking.date)}</div>
                        <div className="text-xs text-gray-500">{booking.time} Uhr ({booking.durationMinutes} Min.)</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Kunde</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.customer.user.firstName} {booking.customer.user.lastName}</div>
                        <div className="text-xs text-gray-500">{booking.customer.user.email}</div>
                        {booking.customer.user.phone && <div className="text-xs text-gray-500">{booking.customer.user.phone}</div>}
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Fahrzeug</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.vehicle.make} {booking.vehicle.model}</div>
                        <div className="text-xs text-gray-500">{booking.vehicle.licensePlate || 'Kein Kennzeichen'} · {booking.vehicle.year}</div>
                      </div>
                    </div>
                    {/* Customer Notes */}
                    {booking.customerNotes && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5">📝</span>
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              Nachricht vom Kunden
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                              {booking.customerNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Info Banner: Customer has stored tires at this workshop */}
                    {booking.fromStorageBookingId && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              Reifen aus Einlagerung
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                              Der Kunde hat eingelagerte Reifen bei Ihnen. Bitte die entsprechenden Reifen für den Termin bereitstellen.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Storage Location (Lagerort) for hasStorage bookings */}
                    {booking.hasStorage && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5">📦</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-1">Lagerort</div>
                            {editingStorageId === booking.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={storageLocationValue}
                                  onChange={(e) => setStorageLocationValue(e.target.value)}
                                  placeholder="z.B. Regal 3, Fach B"
                                  className="flex-1 text-sm border border-orange-300 dark:border-orange-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  autoFocus
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveStorageLocation(booking.id) }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveStorageLocation(booking.id)}
                                  disabled={savingStorage}
                                  className="text-xs px-2 py-1 h-7 bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  {savingStorage ? '...' : '✓'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setEditingStorageId(null); setStorageLocationValue('') }}
                                  className="text-xs px-2 py-1 h-7"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {booking.storageLocation || <span className="text-gray-400 italic">Noch nicht vergeben</span>}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingStorageId(booking.id)
                                    setStorageLocationValue(booking.storageLocation || '')
                                  }}
                                  className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:underline"
                                >
                                  {booking.storageLocation ? 'Ändern' : 'Eintragen'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {booking.totalTirePurchasePrice && booking.totalTirePurchasePrice > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Reifeninformationen</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {booking.tireBrand && (
                            <div>
                              <span className="text-gray-600">Marke:</span>
                              <span className="ml-2 font-medium">{booking.tireBrand}</span>
                            </div>
                          )}
                          {booking.tireModel && (
                            <div>
                              <span className="text-gray-600">Modell:</span>
                              <span className="ml-2 font-medium">{booking.tireModel}</span>
                            </div>
                          )}
                          {booking.tireSize && (
                            <div>
                              <span className="text-gray-600">Größe:</span>
                              <span className="ml-2 font-medium">{booking.tireSize}</span>
                            </div>
                          )}
                          {(booking.tireLoadIndex || booking.tireSpeedIndex) && (
                            <div>
                              <span className="text-gray-600">Load/Speed:</span>
                              <span className="ml-2 font-medium">
                                {booking.tireLoadIndex || '-'} / {booking.tireSpeedIndex || '-'}
                              </span>
                            </div>
                          )}
                          {booking.tireQuantity && (
                            <div>
                              <span className="text-gray-600">Anzahl:</span>
                              <span className="ml-2 font-medium">{booking.tireQuantity} Stück</span>
                            </div>
                          )}
                          {booking.tirePurchasePrice && (
                            <div>
                              <span className="text-gray-600">Preis pro Reifen:</span>
                              <span className="ml-2 font-medium">{booking.tirePurchasePrice.toFixed(2)} €</span>
                            </div>
                          )}
                          {booking.totalTirePurchasePrice && (
                            <div>
                              <span className="text-gray-600">Gesamt Reifen:</span>
                              <span className="ml-2 font-medium">{booking.totalTirePurchasePrice.toFixed(2)} €</span>
                            </div>
                          )}
                          {booking.tireRunFlat && (
                            <div className="col-span-2 text-blue-600 font-medium">
                              ✓ Runflat-Reifen
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div>
                      <h4 className="font-semibold mb-3">Preisaufschlüsselung</h4>
                      <div className="space-y-2 text-sm">
                        {booking.totalTirePurchasePrice && booking.totalTirePurchasePrice > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reifen:</span>
                            <span className="font-medium">{booking.totalTirePurchasePrice.toFixed(2)} €</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Montage/Service:</span>
                          <span className="font-medium">{booking.basePrice.toFixed(2)} €</span>
                        </div>
                        {booking.hasBalancing && booking.balancingPrice && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Auswuchten:</span>
                            <span className="font-medium">{booking.balancingPrice.toFixed(2)} €</span>
                          </div>
                        )}
                        {booking.hasStorage && booking.storagePrice && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Einlagerung:</span>
                            <span className="font-medium">{booking.storagePrice.toFixed(2)} €</span>
                          </div>
                        )}
                        {booking.hasDisposal && booking.disposalFee && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Entsorgung:</span>
                            <span className="font-medium">{booking.disposalFee.toFixed(2)} €</span>
                          </div>
                        )}
                        {booking.hasWashing && booking.washingPrice && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Räder waschen:</span>
                            <span className="font-medium">{booking.washingPrice.toFixed(2)} €</span>
                          </div>
                        )}
                        {booking.runFlatSurcharge && Number(booking.runFlatSurcharge) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Runflat-Zuschlag:</span>
                            <span className="font-medium">{booking.runFlatSurcharge.toFixed(2)} €</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t font-semibold">
                          <span>Gesamt:</span>
                          <span className="text-green-600">{booking.totalPrice.toFixed(2)} €</span>
                        </div>
                        {booking.workshopPayout !== null && (
                          <div className="flex justify-between pt-2 border-t border-primary-200 mt-2">
                            <span className="text-primary-700 dark:text-primary-400 font-semibold">Ihre Auszahlung:</span>
                            <span className="text-primary-600 font-bold">{booking.workshopPayout.toFixed(2)} €</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Address */}
                    {(booking.customer.user.street || booking.customer.user.city) && (
                      <div>
                        <h4 className="font-semibold mb-2">Kundenadresse</h4>
                        <div className="text-sm text-gray-600">
                          {booking.customer.user.street && <div>{booking.customer.user.street}</div>}
                          {(booking.customer.user.zipCode || booking.customer.user.city) && (
                            <div>
                              {booking.customer.user.zipCode} {booking.customer.user.city}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Invoice Upload */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Rechnung</h4>
                      {booking.invoiceUrl ? (
                        <div className="space-y-2">
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="font-medium">Rechnung hochgeladen</span>
                          </div>
                          <a 
                            href={booking.invoiceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block text-blue-600 hover:underline text-sm"
                          >
                            Rechnung anzeigen
                          </a>
                          {booking.invoiceUploadedAt && (
                            <div className="text-xs text-gray-500">
                              Hochgeladen: {formatDateTime(booking.invoiceUploadedAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {booking.invoiceRequestedAt && (
                            <div className="flex items-center text-orange-600 mb-2">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">
                                Kunde hat Rechnung angefordert am {formatDateTime(booking.invoiceRequestedAt)}
                              </span>
                            </div>
                          )}
                          <div>
                            <label className="block">
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleInvoiceUpload(booking.id, file)
                                  }
                                }}
                                disabled={uploadingInvoice === booking.id}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const input = document.querySelector(`input[type="file"]`) as HTMLInputElement
                                  input?.click()
                                }}
                                disabled={uploadingInvoice === booking.id}
                                className="w-full"
                              >
                                {uploadingInvoice === booking.id ? 'Lädt hoch...' : 'Rechnung hochladen (PDF)'}
                              </Button>
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Max. 5MB, nur PDF-Dateien
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Review */}
                    {booking.review && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Bewertung</h4>
                        <div className="flex items-center mb-2">
                          <span className="text-yellow-500 text-lg mr-2">★</span>
                          <span className="font-medium">{booking.review.rating} / 5</span>
                        </div>
                        {booking.review.comment && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">{booking.review.comment}</p>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          {formatDateTime(booking.review.createdAt)}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Erstellt: {formatDateTime(booking.createdAt)}</div>
                      {booking.paidAt && <div>Bezahlt: {formatDateTime(booking.paidAt)}</div>}
                    </div>
                  </div>
                )}
            </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
