'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  comment: string | null
  workshopResponse: string | null
  respondedAt: string | null
  createdAt: string
  customer: {
    user: {
      firstName: string
    }
  }
  booking: {
    appointmentDate: string
    tireRequest: {
      additionalNotes: string | null
    }
  }
}

interface ReviewsData {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export default function WorkshopReviews() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [starFilter, setStarFilter] = useState<number | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

    fetchReviews()
  }, [session, status, router])

  const fetchReviews = async () => {
    try {
      console.log('Fetching reviews...')
      const response = await fetch('/api/workshop/reviews')
      console.log('Response status:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Reviews data:', data)
        setReviewsData(data)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch reviews:', response.status, response.statusText, errorText)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getServiceName = (additionalNotes: string | null) => {
    if (!additionalNotes) return 'Service'
    
    // Extract service type from emoji prefix
    if (additionalNotes.includes('🔧 SONSTIGE REIFENSERVICES')) {
      return 'Sonstige Reifenservices'
    } else if (additionalNotes.includes('🔄 RÄDERWECHSEL')) {
      return 'Räderwechsel'
    } else if (additionalNotes.includes('🛞 REIFENWECHSEL')) {
      return 'Reifenwechsel'
    } else if (additionalNotes.includes('🔧 REIFENREPARATUR')) {
      return 'Reifenreparatur'
    } else if (additionalNotes.includes('🏍️ MOTORRADREIFEN')) {
      return 'Motorradreifen'
    } else if (additionalNotes.includes('📐 ACHSVERMESSUNG')) {
      return 'Achsvermessung'
    } else if (additionalNotes.includes('❄️ KLIMASERVICE')) {
      return 'Klimaservice'
    } else if (additionalNotes.includes('🔴 BREMSENSERVICE')) {
      return 'Bremsenservice'
    } else if (additionalNotes.includes('🔋 BATTERIESERVICE')) {
      return 'Batterieservice'
    }
    
    return 'Service'
  }

  const filteredReviews = reviewsData?.reviews.filter(review => 
    starFilter === null || review.rating === starFilter
  ) || []

  const handleRespondToReview = async (reviewId: string) => {
    if (!responseText.trim()) {
      alert('Bitte geben Sie eine Antwort ein')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/workshop/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: responseText }),
      })

      if (response.ok) {
        // Refresh reviews to show the new response
        await fetchReviews()
        setRespondingTo(null)
        setResponseText('')
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Speichern der Antwort')
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('Fehler beim Speichern der Antwort')
    } finally {
      setSubmitting(false)
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Kundenbewertungen</h1>
              <p className="mt-1 text-sm text-gray-600">
                Feedback von Ihren Kunden
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Rating */}
        {reviewsData && reviewsData.totalReviews > 0 && (
          <div className="bg-white rounded-lg shadow p-8 mb-6 text-center">
            <div className="mb-4">
              <p className="text-6xl font-bold text-primary-600">
                {reviewsData.averageRating.toFixed(1)}
              </p>
              <p className="text-3xl mt-2">
                {getRatingStars(Math.round(reviewsData.averageRating))}
              </p>
            </div>
            <p className="text-gray-600">
              Durchschnittliche Bewertung aus {reviewsData.totalReviews} Bewertung{reviewsData.totalReviews !== 1 ? 'en' : ''}
            </p>
          </div>
        )}

        {/* Rating Distribution */}
        {reviewsData && reviewsData.totalReviews > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Bewertungsverteilung</h2>
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviewsData.reviews.filter(r => r.rating === stars).length
              const percentage = (count / reviewsData.totalReviews) * 100
              return (
                <div key={stars} className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-600 w-12">{stars} ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-yellow-500 h-4 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Star Filter */}
        {reviewsData && reviewsData.totalReviews > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Filter nach Bewertung</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStarFilter(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  starFilter === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alle
              </button>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = reviewsData.reviews.filter(r => r.rating === stars).length
                return (
                  <button
                    key={stars}
                    onClick={() => setStarFilter(stars)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      starFilter === stars
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {stars} ⭐ ({count})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {!reviewsData || reviewsData.reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Noch keine Bewertungen</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sie haben noch keine Kundenbewertungen erhalten.
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Bewertungen mit {starFilter} Sternen</h3>
            <p className="mt-1 text-sm text-gray-500">
              Versuchen Sie einen anderen Filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-gray-900">
                        {review.customer.user.firstName}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getRatingColor(review.rating)}`}>
                      {review.rating.toFixed(1)}
                    </p>
                    <p className="text-xl">
                      {getRatingStars(review.rating)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Service:</span> {getServiceName(review.booking.tireRequest.additionalNotes)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Termin: {new Date(review.booking.appointmentDate).toLocaleDateString('de-DE')}
                  </p>
                </div>

                {review.comment && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-800">{review.comment}</p>
                  </div>
                )}

                {review.workshopResponse ? (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <p className="font-medium text-blue-900">Ihre Antwort</p>
                      <span className="text-xs text-blue-600">
                        {review.respondedAt && new Date(review.respondedAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <p className="text-blue-800">{review.workshopResponse}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Schreiben Sie Ihre Antwort..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      rows={4}
                      disabled={submitting}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondToReview(review.id)}
                        disabled={submitting}
                        className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Wird gesendet...' : 'Antwort senden'}
                      </button>
                      <button
                        onClick={() => {
                          setRespondingTo(null)
                          setResponseText('')
                        }}
                        disabled={submitting}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRespondingTo(review.id)}
                    className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Auf Bewertung antworten
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
