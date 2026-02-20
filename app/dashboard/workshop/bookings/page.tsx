'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Car, User, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Booking {
  id: string
  serviceType: string
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
  hasDisposal: boolean
  tireRunFlat: boolean
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
  TIRE_HOTEL: 'Reifen-Hotel'
}

const statusLabels: Record<string, string> = {
  RESERVED: 'Reserviert',
  CONFIRMED: 'Bestätigt',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Storniert'
}

const statusColors: Record<string, string> = {
  RESERVED: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Ausstehend',
  PAID: 'Bezahlt',
  FAILED: 'Fehlgeschlagen',
  REFUNDED: 'Erstattet'
}

export default function WorkshopBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'RESERVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [uploadingInvoice, setUploadingInvoice] = useState<string | null>(null)

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
  }, [session, status, router, filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const url = filter === 'all' 
        ? '/api/workshop/bookings' 
        : `/api/workshop/bookings?status=${filter.toLowerCase()}`
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
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

  const filteredBookings = bookings

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'RESERVED':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Clock className="h-5 w-5 text-blue-600" />
    }
  }

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
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Buchungen</h1>
        <p className="text-gray-600">Übersicht aller Direktbuchungen Ihrer Werkstatt</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Alle ({bookings.length})
        </Button>
        <Button
          variant={filter === 'RESERVED' ? 'default' : 'outline'}
          onClick={() => setFilter('RESERVED')}
          size="sm"
        >
          Reserviert ({bookings.filter(b => b.status === 'RESERVED').length})
        </Button>
        <Button
          variant={filter === 'CONFIRMED' ? 'default' : 'outline'}
          onClick={() => setFilter('CONFIRMED')}
          size="sm"
        >
          Bestätigt ({bookings.filter(b => b.status === 'CONFIRMED').length})
        </Button>
        <Button
          variant={filter === 'COMPLETED' ? 'default' : 'outline'}
          onClick={() => setFilter('COMPLETED')}
          size="sm"
        >
          Abgeschlossen ({bookings.filter(b => b.status === 'COMPLETED').length})
        </Button>
        <Button
          variant={filter === 'CANCELLED' ? 'default' : 'outline'}
          onClick={() => setFilter('CANCELLED')}
          size="sm"
        >
          Storniert ({bookings.filter(b => b.status === 'CANCELLED').length})
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Gesamt Buchungen</div>
          <div className="text-2xl font-bold">{bookings.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Bezahlt</div>
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.paymentStatus === 'PAID').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Gesamtumsatz</div>
          <div className="text-2xl font-bold text-blue-600">
            {bookings
              .filter(b => b.paymentStatus === 'PAID')
              .reduce((sum, b) => sum + b.totalPrice, 0)
              .toFixed(2)} €
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">Bewertungen</div>
          <div className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.review).length}
          </div>
        </Card>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Keine Buchungen gefunden</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Es wurden noch keine Buchungen getätigt.' 
              : `Keine Buchungen mit Status "${statusLabels[filter]}".`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(booking.status)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {serviceTypeLabels[booking.serviceType] || booking.serviceType}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Buchung #{booking.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                    {booking.paymentStatus === 'PAID' && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        ✓ Bezahlt
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Date & Time */}
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Termin</div>
                      <div className="font-medium">{formatDate(booking.date)}</div>
                      <div className="text-sm text-gray-600">{booking.time} Uhr ({booking.durationMinutes} Min.)</div>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Kunde</div>
                      <div className="font-medium">
                        {booking.customer.user.firstName} {booking.customer.user.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{booking.customer.user.email}</div>
                      {booking.customer.user.phone && (
                        <div className="text-sm text-gray-600">{booking.customer.user.phone}</div>
                      )}
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-start space-x-3">
                    <Car className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Fahrzeug</div>
                      <div className="font-medium">
                        {booking.vehicle.make} {booking.vehicle.model}
                      </div>
                      <div className="text-sm text-gray-600">
                        {booking.vehicle.licensePlate || 'Kein Kennzeichen'} • {booking.vehicle.year}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Gesamtpreis:</span>
                    <span className="text-xl font-bold text-green-600">{booking.totalPrice.toFixed(2)} €</span>
                  </div>
                  {booking.workshopPayout !== null && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ihre Auszahlung:</span>
                      <span className="text-lg font-bold text-primary-600">{booking.workshopPayout.toFixed(2)} €</span>
                    </div>
                  )}
                  {booking.paymentMethod && (
                    <div className="text-sm text-gray-600 mt-2">
                      Zahlungsmethode: {booking.paymentMethod === 'STRIPE' ? 'Kreditkarte' : booking.paymentMethod}
                    </div>
                  )}
                </div>

                {/* Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                  className="w-full"
                >
                  {expandedBooking === booking.id ? 'Weniger anzeigen' : 'Details anzeigen'}
                </Button>

                {/* Expanded Details */}
                {expandedBooking === booking.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Tire Information */}
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
                        {booking.tireRunFlat && booking.runFlatSurcharge && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Runflat-Zuschlag:</span>
                            <span className="font-medium">{booking.runFlatSurcharge.toFixed(2)} €</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t font-semibold">
                          <span>Gesamt:</span>
                          <span className="text-green-600">{booking.totalPrice.toFixed(2)} €</span>
                        </div>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
