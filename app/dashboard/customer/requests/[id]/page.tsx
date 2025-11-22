'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface TireOption {
  id: string
  brand: string
  model: string
  pricePerTire: number
}

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
  installationFee: number
  tireOptions?: TireOption[]
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

  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)

  const handleAcceptOffer = (offerId: string) => {
    setSelectedOfferId(offerId)
    setShowAcceptModal(true)
    setAcceptTerms(false)
  }

  const confirmAcceptOffer = async () => {
    if (!acceptTerms) {
      alert('Bitte bestätigen Sie die Vertragsbedingungen')
      return
    }

    if (!selectedOfferId) return

    setAcceptingOfferId(selectedOfferId)
    try {
      const response = await fetch(`/api/offers/${selectedOfferId}/accept`, {
        method: 'POST',
      })

      if (response.ok) {
        setShowAcceptModal(false)
        alert('Angebot erfolgreich angenommen! Sie werden zur Terminbuchung weitergeleitet.')
        router.push(`/dashboard/customer/requests/${requestId}/book?offerId=${selectedOfferId}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Annehmen des Angebots')
      }
    } catch (error) {
      console.error('Error accepting offer:', error)
      alert('Fehler beim Annehmen des Angebots')
    } finally {
      setAcceptingOfferId(null)
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
    <>
      {/* Vertragsbedingungen Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Angebot annehmen</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Wichtiger Hinweis:</strong> Mit der Annahme dieses Angebots gehen Sie einen verbindlichen Vertrag direkt mit der Werkstatt ein.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Vertragsbedingungen</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Der Vertrag kommt direkt zwischen Ihnen und der Werkstatt zustande</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Bereifung24 fungiert ausschließlich als Vermittlungsplattform</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Die Werkstatt ist für die Erfüllung der Leistung verantwortlich</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Alle anderen Angebote für diese Anfrage werden automatisch abgelehnt</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Nach der Annahme können Sie einen Termin mit der Werkstatt vereinbaren</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span>Bei Problemen oder Fragen wenden Sie sich bitte direkt an die Werkstatt</span>
                  </li>
                </ul>
              </div>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Ich bestätige, dass ich die Vertragsbedingungen gelesen habe und verstehe, dass der Vertrag direkt zwischen mir und der Werkstatt zustande kommt. Bereifung24 ist nur Vermittler und keine Vertragspartei.
                </span>
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                disabled={acceptingOfferId !== null}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmAcceptOffer}
                disabled={!acceptTerms || acceptingOfferId !== null}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {acceptingOfferId ? 'Wird angenommen...' : 'Angebot verbindlich annehmen'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      {offer.tireOptions && offer.tireOptions.length > 0 ? (
                        <>
                          <p className="text-xs text-gray-600 mb-3">Verfügbare Optionen:</p>
                          <div className="space-y-3">
                            {offer.tireOptions.map((option, idx) => {
                              const optionTotalPrice = (option.pricePerTire * request.quantity) + offer.installationFee
                              return (
                                <div key={option.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{option.brand} {option.model}</p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {option.pricePerTire.toFixed(2)} € pro Reifen × {request.quantity} = {(option.pricePerTire * request.quantity).toFixed(2)} €
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        + Montage: {offer.installationFee.toFixed(2)} €
                                      </p>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className="text-lg font-bold text-primary-600">
                                        {optionTotalPrice.toFixed(2)} €
                                      </p>
                                      <p className="text-xs text-gray-500">Gesamt</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      ) : (
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
                      )}
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
    </>
  )
}
