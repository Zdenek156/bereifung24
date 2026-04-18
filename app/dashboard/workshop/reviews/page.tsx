'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

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
  booking?: {
    appointmentDate: string
    tireRequest: {
      additionalNotes: string | null
    }
  } | null
  directBooking?: {
    date: Date
    serviceType: string
  } | null
}

interface ReviewsData {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'

export default function WorkshopReviews() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [starFilter, setStarFilter] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }
    if (session.user.role !== 'WORKSHOP') { router.push('/dashboard'); return }
    fetchReviews()
  }, [session, status, router])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/workshop/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviewsData(data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRatingBg = (rating: number) => {
    if (rating >= 4) return 'bg-green-50 border-green-200'
    if (rating >= 3) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getServiceName = (review: Review) => {
    if (review.directBooking?.serviceType) {
      const map: Record<string, string> = {
        'WHEEL_CHANGE': 'Räderwechsel', 'TIRE_CHANGE': 'Reifenwechsel',
        'TIRE_REPAIR': 'Reifenreparatur', 'MOTORCYCLE_TIRE': 'Motorradreifen',
        'ALIGNMENT_BOTH': 'Achsvermessung', 'CLIMATE_SERVICE': 'Klimaservice'
      }
      return map[review.directBooking.serviceType] || 'Service'
    }
    const notes = review.booking?.tireRequest?.additionalNotes
    if (!notes) return 'Service'
    if (notes.includes('🔧 SONSTIGE REIFENSERVICES')) return 'Sonstige Reifenservices'
    if (notes.includes('🔄 RÄDERWECHSEL')) return 'Räderwechsel'
    if (notes.includes('🛞 REIFENWECHSEL')) return 'Reifenwechsel'
    if (notes.includes('🔧 REIFENREPARATUR')) return 'Reifenreparatur'
    if (notes.includes('🏍️ MOTORRADREIFEN')) return 'Motorradreifen'
    if (notes.includes('📐 ACHSVERMESSUNG')) return 'Achsvermessung'
    if (notes.includes('❄️ KLIMASERVICE')) return 'Klimaservice'
    if (notes.includes('🔴 BREMSENSERVICE')) return 'Bremsenservice'
    if (notes.includes('🔋 BATTERIESERVICE')) return 'Batterieservice'
    return 'Service'
  }

  const getServiceIcon = (review: Review) => {
    const name = getServiceName(review)
    const icons: Record<string, string> = {
      'Räderwechsel': '🔄', 'Reifenwechsel': '🛞', 'Reifenreparatur': '🔧',
      'Motorradreifen': '🏍️', 'Achsvermessung': '📐', 'Klimaservice': '❄️',
      'Bremsenservice': '🔴', 'Batterieservice': '🔋', 'Sonstige Reifenservices': '🔧'
    }
    return icons[name] || '🔧'
  }

  const getAppointmentDate = (review: Review) => {
    if (review.directBooking?.date) return new Date(review.directBooking.date).toLocaleDateString('de-DE')
    if (review.booking?.appointmentDate) return new Date(review.booking.appointmentDate).toLocaleDateString('de-DE')
    return 'Unbekannt'
  }

  const getRelativeTime = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Heute'
    if (diffDays === 1) return 'Gestern'
    if (diffDays < 7) return `vor ${diffDays} Tagen`
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wo.`
    if (diffDays < 365) return `vor ${Math.floor(diffDays / 30)} Mon.`
    return `vor ${Math.floor(diffDays / 365)} J.`
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ]
    const idx = name.charCodeAt(0) % colors.length
    return colors[idx]
  }

  // Computed stats
  const respondedCount = useMemo(() => 
    reviewsData?.reviews.filter(r => r.workshopResponse).length || 0
  , [reviewsData])

  const unansweredCount = useMemo(() => 
    (reviewsData?.totalReviews || 0) - respondedCount
  , [reviewsData, respondedCount])

  const responseRate = useMemo(() => {
    if (!reviewsData || reviewsData.totalReviews === 0) return 0
    return Math.round((respondedCount / reviewsData.totalReviews) * 100)
  }, [reviewsData, respondedCount])

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviewsData?.reviews.forEach(r => { counts[r.rating] = (counts[r.rating] || 0) + 1 })
    return counts
  }, [reviewsData])

  // Filtered + sorted reviews
  const filteredReviews = useMemo(() => {
    let reviews = reviewsData?.reviews.filter(r => starFilter === null || r.rating === starFilter) || []
    switch (sortBy) {
      case 'newest': return [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'oldest': return [...reviews].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'highest': return [...reviews].sort((a, b) => b.rating - a.rating)
      case 'lowest': return [...reviews].sort((a, b) => a.rating - b.rating)
      default: return reviews
    }
  }, [reviewsData, starFilter, sortBy])

  const handleRespondToReview = async (reviewId: string) => {
    if (!responseText.trim()) { alert('Bitte geben Sie eine Antwort ein'); return }
    setSubmitting(true)
    try {
      const response = await fetch(`/api/workshop/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText }),
      })
      if (response.ok) {
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

  // Star rendering with SVG
  const StarIcon = ({ filled, half, size = 16 }: { filled?: boolean; half?: boolean; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={filled ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )

  const RatingStars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <StarIcon key={i} filled={i <= rating} size={size} />
      ))}
    </div>
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kundenbewertungen</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Feedback von Ihren Kunden</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* ── Stats Dashboard: Rating + Distribution + Metrics in one card ── */}
        {reviewsData && reviewsData.totalReviews > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 md:gap-6 items-center">
              
              {/* Left: Average Rating */}
              <div className="flex flex-col items-center md:items-center gap-1 md:pr-6 md:border-r border-gray-200 dark:border-gray-700">
                <span className="text-4xl font-bold text-primary-600">{reviewsData.averageRating.toFixed(1)}</span>
                <RatingStars rating={Math.round(reviewsData.averageRating)} size={18} />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {reviewsData.totalReviews} Bewertung{reviewsData.totalReviews !== 1 ? 'en' : ''}
                </span>
              </div>

              {/* Center: Mini Distribution Bars */}
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = ratingCounts[stars]
                  const pct = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-4 text-right">{stars}</span>
                      <StarIcon filled size={12} />
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${stars >= 4 ? 'bg-green-400' : stars === 3 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-5 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>

              {/* Right: Stats Badges */}
              <div className="flex md:flex-col gap-3 md:gap-2 md:pl-6 md:border-l border-gray-200 dark:border-gray-700 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{responseRate}%</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Antwortrate</p>
                  </div>
                </div>
                {unansweredCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-orange-600">{unansweredCount}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Offen</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{respondedCount}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Beantwortet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Filter & Sort Bar ── */}
        {reviewsData && reviewsData.totalReviews > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Star Filter Pills */}
            <button
              onClick={() => setStarFilter(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                starFilter === null
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              Alle ({reviewsData.totalReviews})
            </button>
            {[5, 4, 3, 2, 1].map(stars => {
              const count = ratingCounts[stars]
              return (
                <button
                  key={stars}
                  onClick={() => setStarFilter(starFilter === stars ? null : stars)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
                    starFilter === stars
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  {stars} <StarIcon filled size={11} /> <span className="text-gray-400 dark:text-gray-500">({count})</span>
                </button>
              )
            })}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="highest">Beste zuerst</option>
              <option value="lowest">Schlechteste zuerst</option>
            </select>
          </div>
        )}

        {/* ── Review Cards ── */}
        {!reviewsData || reviewsData.reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Noch keine Bewertungen</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sie haben noch keine Kundenbewertungen erhalten.</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Keine Bewertungen mit {starFilter} Sternen</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Versuchen Sie einen anderen Filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Card Header: Avatar + Name + Date + Rating */}
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full ${getAvatarColor(review.customer?.user?.firstName || 'Kunde')} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-bold">{getInitials(review.customer?.user?.firstName || 'Kunde')}</span>
                  </div>
                  {/* Name + Date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{review.customer?.user?.firstName || 'Ehem. Kunde'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {getServiceIcon(review)} {getServiceName(review)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                      <span>{new Date(review.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>·</span>
                      <span>{getRelativeTime(review.createdAt)}</span>
                      <span>·</span>
                      <span>Termin: {getAppointmentDate(review)}</span>
                    </div>
                  </div>
                  {/* Rating Badge */}
                  <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg border ${getRatingBg(review.rating)} flex-shrink-0`}>
                    <span className={`text-lg font-bold leading-none ${getRatingColor(review.rating)}`}>{review.rating.toFixed(1)}</span>
                    <RatingStars rating={review.rating} size={11} />
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="px-4 pb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-12">{review.comment}</p>
                  </div>
                )}

                {/* Workshop Response */}
                {review.workshopResponse && (
                  <div className="mx-4 mb-3 ml-12 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Ihre Antwort</span>
                      {review.respondedAt && (
                        <span className="text-[10px] text-blue-400">· {new Date(review.respondedAt).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">{review.workshopResponse}</p>
                  </div>
                )}

                {/* Response Form or Button */}
                {!review.workshopResponse && (
                  respondingTo === review.id ? (
                    <div className="px-4 pb-3 pl-12">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Ihre Antwort auf diese Bewertung..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400"
                        rows={3}
                        disabled={submitting}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleRespondToReview(review.id)}
                          disabled={submitting}
                          className="px-4 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                          {submitting ? 'Senden...' : '✓ Antwort senden'}
                        </button>
                        <button
                          onClick={() => { setRespondingTo(null); setResponseText('') }}
                          disabled={submitting}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-3 pl-12">
                      <button
                        onClick={() => setRespondingTo(review.id)}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        Antworten
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
