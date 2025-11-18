'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TireHistory {
  id: string
  purchaseDate: string
  workshop: {
    companyName: string
    city: string
  }
  tireDetails: {
    season: string
    width: string
    aspectRatio: string
    diameter: string
    loadIndex?: string
    speedRating?: string
    quantity: number
  }
  vehicle?: {
    make: string
    model: string
    year: number
  }
  price?: number
  status: string
  tireRating?: {
    id: string
    rating: number
    comment?: string
    quietnessRating?: number
    gripRating?: number
    wearRating?: number
    comfortRating?: number
  }
}

export default function TireHistory() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<TireHistory[]>([])
  const [filterSeason, setFilterSeason] = useState<string>('ALL')
  
  // Rating Modal State
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TireHistory | null>(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [quietnessRating, setQuietnessRating] = useState(0)
  const [gripRating, setGripRating] = useState(0)
  const [wearRating, setWearRating] = useState(0)
  const [comfortRating, setComfortRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

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

    loadHistory()
  }, [session, status, router])

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/tire-history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Failed to load tire history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRatingModal = (item: TireHistory) => {
    setSelectedItem(item)
    if (item.tireRating) {
      setRating(item.tireRating.rating)
      setComment(item.tireRating.comment || '')
      setQuietnessRating(item.tireRating.quietnessRating || 0)
      setGripRating(item.tireRating.gripRating || 0)
      setWearRating(item.tireRating.wearRating || 0)
      setComfortRating(item.tireRating.comfortRating || 0)
    } else {
      setRating(0)
      setComment('')
      setQuietnessRating(0)
      setGripRating(0)
      setWearRating(0)
      setComfortRating(0)
    }
    setShowRatingModal(true)
  }

  const handleSubmitRating = async () => {
    if (!selectedItem || rating === 0) {
      alert('Bitte geben Sie eine Bewertung ab')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/tire-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedItem.id,
          rating,
          comment,
          quietnessRating: quietnessRating > 0 ? quietnessRating : undefined,
          gripRating: gripRating > 0 ? gripRating : undefined,
          wearRating: wearRating > 0 ? wearRating : undefined,
          comfortRating: comfortRating > 0 ? comfortRating : undefined
        })
      })

      if (response.ok) {
        alert('Reifenbewertung erfolgreich gespeichert!')
        setShowRatingModal(false)
        loadHistory() // Reload to show the new rating
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Speichern der Bewertung')
      }
    } catch (error) {
      console.error('Failed to submit tire rating:', error)
      alert('Fehler beim Speichern der Bewertung')
    } finally {
      setSubmitting(false)
    }
  }

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      SUMMER: 'Sommerreifen',
      WINTER: 'Winterreifen',
      ALL_SEASON: 'Ganzjahresreifen'
    }
    return labels[season] || season
  }

  const getSeasonIcon = (season: string) => {
    if (season === 'SUMMER') {
      return (
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        </div>
      )
    } else if (season === 'WINTER') {
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v6a1 1 0 11-2 0V3a1 1 0 011-1zm0 12a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM3.515 5.929a1 1 0 011.414 0l1.414 1.414a1 1 0 01-1.414 1.414L3.515 7.343a1 1 0 010-1.414zm9.9 7.07a1 1 0 011.414 0l1.414 1.415a1 1 0 01-1.414 1.414l-1.414-1.414a1 1 0 010-1.414zM18 10a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM5 10a1 1 0 01-1 1H2a1 1 0 110-2h2a1 1 0 011 1zm11.485-4.071a1 1 0 010 1.414l-1.414 1.414a1 1 0 11-1.414-1.414l1.414-1.414a1 1 0 011.414 0zM6.343 12.657a1 1 0 010 1.414l-1.414 1.414a1 1 0 11-1.414-1.414l1.414-1.414a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )
    } else {
      return (
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Preis nicht verfügbar'
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price)
  }

  const filteredHistory = filterSeason === 'ALL' 
    ? history 
    : history.filter(item => item.tireDetails.season === filterSeason)

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
              <h1 className="text-3xl font-bold text-gray-900">Reifenhistorie</h1>
              <p className="mt-1 text-sm text-gray-600">Übersicht aller gekauften Reifen</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterSeason('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterSeason === 'ALL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alle ({history.length})
              </button>
              <button
                onClick={() => setFilterSeason('SUMMER')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterSeason === 'SUMMER'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sommerreifen ({history.filter(h => h.tireDetails.season === 'SUMMER').length})
              </button>
              <button
                onClick={() => setFilterSeason('WINTER')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterSeason === 'WINTER'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Winterreifen ({history.filter(h => h.tireDetails.season === 'WINTER').length})
              </button>
              <button
                onClick={() => setFilterSeason('ALL_SEASON')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterSeason === 'ALL_SEASON'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ganzjahresreifen ({history.filter(h => h.tireDetails.season === 'ALL_SEASON').length})
              </button>
            </div>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Reifenhistorie</h3>
            <p className="text-gray-600 mb-4">Sie haben noch keine Reifen über unsere Plattform gekauft.</p>
            <Link
              href="/dashboard/customer/create-request"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Erste Anfrage erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getSeasonIcon(item.tireDetails.season)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {getSeasonLabel(item.tireDetails.season)}
                          </h3>
                          <p className="text-sm text-gray-600">{formatDate(item.purchaseDate)}</p>
                        </div>
                        {item.price && (
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary-600">{formatPrice(item.price)}</p>
                            <p className="text-xs text-gray-500">Gesamtpreis</p>
                          </div>
                        )}
                      </div>

                      {/* Tire Specifications */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Dimension</p>
                            <p className="font-semibold text-gray-900">
                              {item.tireDetails.width}/{item.tireDetails.aspectRatio} R{item.tireDetails.diameter}
                            </p>
                          </div>
                          {item.tireDetails.loadIndex && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tragfähigkeit</p>
                              <p className="font-semibold text-gray-900">{item.tireDetails.loadIndex}</p>
                            </div>
                          )}
                          {item.tireDetails.speedRating && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Geschwindigkeit</p>
                              <p className="font-semibold text-gray-900">{item.tireDetails.speedRating}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Anzahl</p>
                            <p className="font-semibold text-gray-900">{item.tireDetails.quantity} Reifen</p>
                          </div>
                        </div>
                      </div>

                      {/* Workshop & Vehicle Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div>
                            <p className="font-medium">{item.workshop.companyName}</p>
                            <p className="text-xs text-gray-500">{item.workshop.city}</p>
                          </div>
                        </div>
                        {item.vehicle && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <div>
                              <p className="font-medium">{item.vehicle.make} {item.vehicle.model}</p>
                              <p className="text-xs text-gray-500">Baujahr {item.vehicle.year}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tire Rating Section */}
                      <div className="border-t pt-4">
                        {item.tireRating ? (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-semibold text-gray-700">Ihre Reifenbewertung</h4>
                              <button
                                onClick={() => handleOpenRatingModal(item)}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                              >
                                Bearbeiten
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-5 h-5 ${star <= item.tireRating!.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            {item.tireRating.comment && (
                              <p className="text-gray-700 text-sm mb-2">{item.tireRating.comment}</p>
                            )}
                            {(item.tireRating.quietnessRating || item.tireRating.gripRating || item.tireRating.wearRating || item.tireRating.comfortRating) && (
                              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                {item.tireRating.quietnessRating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Lautstärke:</span>
                                    <span className="font-medium">{item.tireRating.quietnessRating}/5</span>
                                  </div>
                                )}
                                {item.tireRating.gripRating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Grip:</span>
                                    <span className="font-medium">{item.tireRating.gripRating}/5</span>
                                  </div>
                                )}
                                {item.tireRating.wearRating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Verschleiß:</span>
                                    <span className="font-medium">{item.tireRating.wearRating}/5</span>
                                  </div>
                                )}
                                {item.tireRating.comfortRating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Komfort:</span>
                                    <span className="font-medium">{item.tireRating.comfortRating}/5</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenRatingModal(item)}
                            className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Reifen bewerten
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {history.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Zusammenfassung</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Gekaufte Reifensätze</p>
                <p className="mt-1 text-2xl font-bold text-primary-600">{history.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gesamt Reifen</p>
                <p className="mt-1 text-2xl font-bold text-primary-600">
                  {history.reduce((sum, item) => sum + item.tireDetails.quantity, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Meistgekauft</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {(() => {
                    if (history.length === 0) return '-'
                    
                    const seasonCounts = history.reduce((acc, item) => {
                      acc[item.tireDetails.season] = (acc[item.tireDetails.season] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                    
                    const mostBoughtSeason = Object.keys(seasonCounts).reduce((a, b) => 
                      seasonCounts[a] > seasonCounts[b] ? a : b
                    )
                    
                    return getSeasonLabel(mostBoughtSeason).split('reifen')[0] + 'reifen'
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gesamtausgaben</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {formatPrice(history.reduce((sum, item) => sum + (item.price || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Tire Rating Modal */}
      {showRatingModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Reifen bewerten</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {getSeasonLabel(selectedItem.tireDetails.season)} - {selectedItem.tireDetails.width}/{selectedItem.tireDetails.aspectRatio} R{selectedItem.tireDetails.diameter}
                  </p>
                </div>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Gesamtbewertung <span className="text-red-500">*</span>
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

                {/* Detailed Ratings */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Detailbewertung (optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quietness */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Lautstärke/Geräusch</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setQuietnessRating(star)}
                            className="focus:outline-none"
                          >
                            <svg
                              className={`w-6 h-6 ${star <= quietnessRating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grip */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Grip/Haftung</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setGripRating(star)}
                            className="focus:outline-none"
                          >
                            <svg
                              className={`w-6 h-6 ${star <= gripRating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Wear */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Verschleiß/Haltbarkeit</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setWearRating(star)}
                            className="focus:outline-none"
                          >
                            <svg
                              className={`w-6 h-6 ${star <= wearRating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comfort */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Komfort/Fahrverhalten</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setComfortRating(star)}
                            className="focus:outline-none"
                          >
                            <svg
                              className={`w-6 h-6 ${star <= comfortRating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ihre Notizen zu den Reifen (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Beschreiben Sie Ihre Erfahrung mit diesen Reifen..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Diese Notizen sind nur für Sie sichtbar und helfen Ihnen beim nächsten Reifenkauf.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={submitting || rating === 0}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Speichern...' : 'Bewertung speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
