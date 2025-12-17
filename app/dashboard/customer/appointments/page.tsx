'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Workshop {
  companyName: string
  street: string
  zipCode: string
  city: string
  phone: string
}

interface TireOption {
  id: string
  brand: string
  model: string
  description?: string
  name: string
  pricePerTire: number
  montagePrice: number
  carTireType?: string
}

interface Vehicle {
  make: string
  model: string
  year?: number
  licensePlate?: string
}

interface Booking {
  id: string
  appointmentDate: string
  appointmentTime: string
  estimatedDuration: number
  status: string
  workshop: Workshop
  tireRequest: {
    season: string
    width: string
    aspectRatio: string
    diameter: string
    quantity: number
    additionalNotes?: string
    vehicle?: Vehicle
  }
  selectedTireOption?: TireOption
  selectedTireOptions?: TireOption[] // NEW: For brake service with multiple packages
  review?: {
    id: string
    rating: number
    comment: string
  }
}

export default function CustomerAppointments() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [pastBookings, setPastBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  
  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'CUSTOMER') {
      router.push('/dashboard')
      return
    }

    loadBookings()
  }, [session, status, router])

  const loadBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        
        const now = new Date()
        const upcoming = data.filter((booking: Booking) => {
          const appointmentDate = new Date(booking.appointmentDate)
          return appointmentDate >= now && booking.status !== 'CANCELLED'
        })
        const past = data.filter((booking: Booking) => {
          const appointmentDate = new Date(booking.appointmentDate)
          return appointmentDate < now || booking.status === 'COMPLETED'
        })
        
        setUpcomingBookings(upcoming)
        setPastBookings(past)
      }
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReviewModal = (booking: Booking) => {
    setSelectedBooking(booking)
    if (booking.review) {
      setRating(booking.review.rating)
      setReviewComment(booking.review.comment || '')
    } else {
      setRating(0)
      setReviewComment('')
    }
    setShowReviewModal(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedBooking || rating === 0) {
      alert('Bitte geben Sie eine Bewertung ab')
      return
    }

    setSubmittingReview(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          rating,
          comment: reviewComment
        })
      })

      if (response.ok) {
        alert('Bewertung erfolgreich gespeichert!')
        setShowReviewModal(false)
        loadBookings() // Reload to show the new review
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Speichern der Bewertung')
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('Fehler beim Speichern der Bewertung')
    } finally {
      setSubmittingReview(false)
    }
  }

  const getServiceTitle = (booking: Booking) => {
    const notes = booking.tireRequest.additionalNotes || ''
    
    // Check if it's a brake service
    if (notes.includes('BREMSEN-SERVICE') || notes.includes('BREMSENWECHSEL')) {
      return 'Bremsen Service'
    }
    
    // Check other service types
    if (notes.includes('KLIMASERVICE')) return 'Klimaservice'
    if (notes.includes('ACHSVERMESSUNG')) return 'Achsvermessung'
    if (notes.includes('BATTERIEWECHSEL')) return 'Batteriewechsel'
    if (notes.includes('RÄDER UMSTECKEN')) return 'Räder umstecken'
    if (notes.includes('REIFENREPARATUR')) return 'Reifenreparatur'
    if (notes.includes('MOTORRADREIFEN') || notes.includes('🏍️')) return 'Motorradreifen'
    if (notes.includes('SONSTIGE REIFENSERVICES')) return 'Reifenservice'
    
    // Default: tire change with dimensions
    const { season, width, aspectRatio, diameter } = booking.tireRequest
    if (width === '0' || width === 0 || !width) {
      return 'Reifenservice'
    }
    return `${getSeasonLabel(season)} - ${width}/${aspectRatio} R${diameter}`
  }

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      SUMMER: 'Sommerreifen',
      WINTER: 'Winterreifen',
      ALL_SEASON: 'Ganzjahresreifen'
    }
    return labels[season] || season
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string, text: string }> = {
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', text: 'Bestätigt' },
      COMPLETED: { color: 'bg-green-100 text-green-800', text: 'Abgeschlossen' },
      CANCELLED: { color: 'bg-red-100 text-red-800', text: 'Storniert' },
      NO_SHOW: { color: 'bg-gray-100 text-gray-800', text: 'Nicht erschienen' }
    }
    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', text: status }
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>{badge.text}</span>
  }

  const getGoogleMapsUrl = (workshop: Workshop) => {
    const address = `${workshop.street}, ${workshop.zipCode} ${workshop.city}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Convert UTC to local timezone (Europe/Berlin)
    return date.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Berlin' })
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
              href="/dashboard/customer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meine Termine</h1>
              <p className="mt-1 text-sm text-gray-600">Werkstatttermine verwalten und Bewertungen abgeben</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'upcoming'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kommende Termine ({upcomingBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'past'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vergangene Termine ({pastBookings.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {activeTab === 'upcoming' && upcomingBookings.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine kommenden Termine</h3>
              <p className="text-gray-600">Sie haben aktuell keine bevorstehenden Werkstatttermine.</p>
            </div>
          )}

          {activeTab === 'past' && pastBookings.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine vergangenen Termine</h3>
              <p className="text-gray-600">Sie haben noch keine abgeschlossenen Werkstatttermine.</p>
            </div>
          )}

          {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{booking.workshop.companyName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getServiceTitle(booking)}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Date & Time */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Termin</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(booking.appointmentDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{booking.appointmentTime} Uhr (ca. {booking.estimatedDuration} Min.)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <div>
                          {booking.selectedTireOptions && booking.selectedTireOptions.length > 0 ? (
                            // Brake service with multiple packages
                            <div className="space-y-1">
                              {booking.selectedTireOptions.map((option, idx) => (
                                <div key={option.id}>
                                  {option.brand} {option.model}
                                </div>
                              ))}
                            </div>
                          ) : booking.selectedTireOption ? (
                            // Single tire option
                            <span>{booking.selectedTireOption.name}</span>
                          ) : (
                            // Fallback
                            <span>{`${booking.tireRequest.quantity} Reifen`}</span>
                          )}
                        </div>
                      </div>
                      {booking.tireRequest.vehicle && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{booking.tireRequest.vehicle.make} {booking.tireRequest.vehicle.model}{booking.tireRequest.vehicle.year ? ` (${booking.tireRequest.vehicle.year})` : ''}{booking.tireRequest.vehicle.licensePlate ? ` - ${booking.tireRequest.vehicle.licensePlate}` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Workshop Address */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Werkstatt</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p>{booking.workshop.street}</p>
                          <p>{booking.workshop.zipCode} {booking.workshop.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{booking.workshop.phone}</span>
                      </div>
                      <a
                        href={getGoogleMapsUrl(booking.workshop)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mt-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        In Google Maps öffnen
                      </a>
                    </div>
                  </div>
                </div>

                {/* Review Section for Past Bookings */}
                {activeTab === 'past' && (
                  <div className="border-t pt-4">
                    {booking.review ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Ihre Bewertung</h4>
                        <div className="flex items-center gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-5 h-5 ${star <= booking.review!.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        {booking.review.comment && (
                          <p className="text-gray-700 text-sm">{booking.review.comment}</p>
                        )}
                        <button
                          onClick={() => handleOpenReviewModal(booking)}
                          className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Bewertung bearbeiten
                        </button>
                      </div>
                    ) : booking.status === 'COMPLETED' ? (
                      <button
                        onClick={() => handleOpenReviewModal(booking)}
                        className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        Werkstatt jetzt bewerten
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Werkstatt bewerten</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedBooking.workshop.companyName}</p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Wie zufrieden waren Sie? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-10 h-10 ${
                            star <= (hoveredRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-3 text-gray-600 font-medium">
                      {rating === 0 && 'Keine Bewertung'}
                      {rating === 1 && 'Sehr unzufrieden'}
                      {rating === 2 && 'Unzufrieden'}
                      {rating === 3 && 'Zufrieden'}
                      {rating === 4 && 'Sehr zufrieden'}
                      {rating === 5 && 'Hervorragend'}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ihre Erfahrung (optional)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Beschreiben Sie Ihre Erfahrung mit der Werkstatt..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ihre Bewertung hilft anderen Kunden bei der Auswahl einer Werkstatt.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || rating === 0}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? 'Speichern...' : 'Bewertung speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
