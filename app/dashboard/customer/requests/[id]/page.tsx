'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Offer {
  id: string
  workshopId: string
  price: number
  tireBrand: string
  tireModel: string
  description?: string
  validUntil: string
  status: string
  createdAt: string
  workshop: {
    companyName: string
    street: string
    zipCode: string
    city: string
    phone: string
  }
}

interface TireRequest {
  id: string
  season: string
  width: number
  aspectRatio: number
  diameter: number
  loadIndex?: number
  speedRating?: string
  isRunflat: boolean
  quantity: number
  preferredBrands?: string
  additionalNotes?: string
  status: string
  needByDate: string
  zipCode: string
  radiusKm: number
  createdAt: string
  offers: Offer[]
}

export default function RequestDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  
  const [request, setRequest] = useState<TireRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'CUSTOMER') {
      router.push('/login')
      return
    }

    fetchRequestDetail()
  }, [session, status, router, requestId])

  const fetchRequestDetail = async () => {
    try {
      const response = await fetch(`/api/tire-requests/${requestId}`)
      const data = await response.json()
      
      if (response.ok) {
        setRequest(data.request)
      } else {
        alert('Anfrage nicht gefunden')
        router.push('/dashboard/customer/requests')
      }
    } catch (error) {
      console.error('Error fetching request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOffer = async (offerId: string) => {
    if (!confirm('Möchten Sie dieses Angebot wirklich annehmen?')) return

    try {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        alert('Angebot erfolgreich angenommen! Sie werden zur Terminbuchung weitergeleitet.')
        router.push(`/dashboard/customer/requests/${requestId}/book?offerId=${offerId}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Annehmen des Angebots')
      }
    } catch (error) {
      console.error('Error accepting offer:', error)
      alert('Fehler beim Annehmen des Angebots')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!request) {
    return null
  }

  const getSeasonText = (season: string) => {
    const texts = {
      SUMMER: 'Sommerreifen',
      WINTER: 'Winterreifen',
      ALL_SEASON: 'Allwetterreifen',
    }
    return texts[season as keyof typeof texts] || season
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filter out expired offers
  const now = new Date()
  const validOffers = request.offers.filter(offer => {
    const validUntil = new Date(offer.validUntil)
    return validUntil > now && offer.status === 'PENDING'
  })

  const sortedOffers = [...validOffers].sort((a, b) => a.price - b.price)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/customer/requests"
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center inline-flex"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zu meinen Anfragen
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Anfrage-Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ihre Anfrage</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reifentyp</p>
                  <p className="text-lg font-semibold">{getSeasonText(request.season)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Dimension</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {request.width}/{request.aspectRatio} R{request.diameter}
                  </p>
                  {(request.loadIndex || request.speedRating) && (
                    <p className="text-sm text-gray-600">
                      {request.loadIndex && `Tragfähigkeit: ${request.loadIndex}`}
                      {request.loadIndex && request.speedRating && ' • '}
                      {request.speedRating && `Geschwindigkeit: ${request.speedRating}`}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Eigenschaften</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      {request.quantity} Reifen
                    </span>
                    {request.isRunflat && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Runflat
                      </span>
                    )}
                  </div>
                </div>

                {request.preferredBrands && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bevorzugte Hersteller</p>
                    <p className="text-sm">{request.preferredBrands}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Standort</p>
                  <p className="text-sm">PLZ {request.zipCode} ({request.radiusKm} km Umkreis)</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Benötigt bis</p>
                  <p className="text-sm font-semibold">{formatDate(request.needByDate)}</p>
                </div>

                {request.additionalNotes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Zusätzliche Hinweise</p>
                    <p className="text-sm">{request.additionalNotes}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Erstellt am {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Offers List */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Erhaltene Angebote ({sortedOffers.length})
              </h2>
              <p className="text-gray-600 mt-1">Sortiert nach Preis (günstigste zuerst)</p>
            </div>

            {sortedOffers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Noch keine Angebote</h3>
                <p className="text-gray-600">
                  Werkstätten in Ihrer Nähe wurden benachrichtigt. Sie erhalten bald Angebote.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedOffers.map((offer, index) => (
                  <div
                    key={offer.id}
                    className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                      index === 0 ? 'border-green-400' : 'border-transparent'
                    }`}
                  >
                    {index === 0 && (
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          🏆 Bestes Angebot
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {offer.workshop.companyName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {offer.workshop.street}, {offer.workshop.zipCode} {offer.workshop.city}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tel: {offer.workshop.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary-600">
                          {offer.price.toFixed(2)} €
                        </div>
                        <p className="text-xs text-gray-500">inkl. Montage</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Reifen-Hersteller</p>
                          <p className="font-semibold">{offer.tireBrand}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Modell</p>
                          <p className="font-semibold">{offer.tireModel}</p>
                        </div>
                      </div>
                      {offer.description && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-700">{offer.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Gültig bis {formatDate(offer.validUntil)}
                      </div>
                      {offer.status === 'PENDING' && request.status === 'PENDING' ? (
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                        >
                          Angebot annehmen
                        </button>
                      ) : offer.status === 'ACCEPTED' ? (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                          ✓ Angenommen
                        </span>
                      ) : (
                        <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                          {offer.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
