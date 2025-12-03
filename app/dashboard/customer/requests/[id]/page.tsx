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
  carTireType?: 'ALL_FOUR' | 'FRONT_TWO' | 'REAR_TWO'
  motorcycleTireType?: 'FRONT' | 'REAR' | 'BOTH'
}

interface WorkshopService {
  basePrice: number
  basePrice4: number | null
  disposalFee: number | null
  durationMinutes: number
  durationMinutes4: number | null
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
  durationMinutes?: number | null
  balancingPrice?: number | null
  storagePrice?: number | null
  storageAvailable?: boolean | null
  customerWantsStorage?: boolean | null
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
  vehicle?: {
    id: string
    make: string
    model: string
    year: number
  }
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
        // Load workshop services for all offers
        await fetchWorkshopServices(data.request.offers)
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

  const fetchWorkshopServices = async (offers: Offer[]) => {
    const services: Record<string, WorkshopService> = {}
    
    for (const offer of offers) {
      try {
        const response = await fetch(`/api/workshop/${offer.workshopId}/services/TIRE_CHANGE`)
        if (response.ok) {
          const data = await response.json()
          services[offer.workshopId] = data
        }
      } catch (error) {
        console.error(`Error fetching services for workshop ${offer.workshopId}:`, error)
      }
    }
    
    setWorkshopServices(services)
  }

  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [wantsBalancing, setWantsBalancing] = useState(false)
  const [wantsStorage, setWantsStorage] = useState(false)
  const [selectedTireOptionIds, setSelectedTireOptionIds] = useState<string[]>([])
  const [workshopServices, setWorkshopServices] = useState<Record<string, WorkshopService>>({})

  const handleAcceptOffer = (offerId: string, defaultTireOptionId?: string) => {
    const offer = request?.offers.find(o => o.id === offerId)
    setSelectedOfferId(offerId)
    setShowAcceptModal(true)
    setAcceptTerms(false)
    setWantsBalancing(false)
    setWantsStorage(false)
    // Pre-select first option or provided option (including virtual options)
    if (offer) {
      const displayOptions = getDisplayOptions(offer)
      if (displayOptions.length > 0) {
        setSelectedTireOptionIds(defaultTireOptionId ? [defaultTireOptionId] : [displayOptions[0].id])
      } else {
        setSelectedTireOptionIds([])
      }
    } else {
      setSelectedTireOptionIds([])
    }
  }
  
  // Toggle tire option selection
  const toggleTireOption = (optionId: string, option: TireOption, offerId: string) => {
    // Set the selected offer ID so we know which offer this belongs to
    setSelectedOfferId(offerId)
    
    setSelectedTireOptionIds(prev => {
      // For car tires, check compatibility
      if (option.carTireType) {
        const currentOffer = request?.offers.find(o => o.id === offerId)
        const displayOptions = currentOffer ? getDisplayOptions(currentOffer) : []
        const currentlySelected = prev.map(id => 
          displayOptions.find(opt => opt.id === id)
        ).filter(Boolean) as TireOption[]
        
        if (prev.includes(optionId)) {
          // Remove option
          return prev.filter(id => id !== optionId)
        } else {
          // Check if we can add this option
          const totalQuantityIfAdded = currentlySelected.reduce((sum, opt) => sum + getQuantityForTireOption(opt), 0) + getQuantityForTireOption(option)
          
          if (totalQuantityIfAdded > 4) {
            alert('Sie können maximal 4 Reifen auswählen')
            return prev
          }
          
          // Check for conflicts (can't have ALL_FOUR with anything else)
          if (option.carTireType === 'ALL_FOUR' && currentlySelected.length > 0) {
            alert('Alle 4 Reifen kann nicht mit anderen Optionen kombiniert werden')
            return prev
          }
          if (currentlySelected.some(opt => opt.carTireType === 'ALL_FOUR')) {
            alert('Bitte entfernen Sie zuerst die "Alle 4 Reifen" Option')
            return prev
          }
          
          return [...prev, optionId]
        }
      }
      
      // For motorcycle or single option
      return prev.includes(optionId) ? prev.filter(id => id !== optionId) : [optionId]
    })
  }

  const confirmAcceptOffer = async () => {
    if (!acceptTerms) {
      alert('Bitte bestätigen Sie die Vertragsbedingungen')
      return
    }

    if (!selectedOfferId) return
    
    const offer = request?.offers.find(o => o.id === selectedOfferId)
    if (offer && offer.tireOptions && offer.tireOptions.length > 0 && selectedTireOptionIds.length === 0) {
      alert('Bitte wählen Sie mindestens eine Reifenoption aus')
      return
    }

    setAcceptingOfferId(selectedOfferId)
    try {
      // Filter out virtual IDs (those starting with the offer ID)
      const realTireOptionIds = selectedTireOptionIds.filter(id => !id.startsWith(`${selectedOfferId}-`))
      
      const response = await fetch(`/api/offers/${selectedOfferId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wantsStorage,
          selectedTireOptionIds: realTireOptionIds.length > 0 ? realTireOptionIds : undefined,
          // For virtual options, send quantity info
          selectedQuantity: selectedTireOptionIds.length > 0 ? (() => {
            const offer = request?.offers.find(o => o.id === selectedOfferId)
            if (offer) {
              const displayOptions = getDisplayOptions(offer)
              const selectedOptions = displayOptions.filter(opt => selectedTireOptionIds.includes(opt.id))
              return selectedOptions.reduce((sum, opt) => sum + getQuantityForTireOption(opt), 0)
            }
            return request?.quantity || 4
          })() : undefined
        })
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

  // Helper function to calculate quantity based on tire type
  const getQuantityForTireOption = (option: TireOption): number => {
    if (option.carTireType) {
      switch (option.carTireType) {
        case 'ALL_FOUR': return 4
        case 'FRONT_TWO': return 2
        case 'REAR_TWO': return 2
        default: return 4
      }
    }
    if (option.motorcycleTireType) {
      switch (option.motorcycleTireType) {
        case 'BOTH': return 2
        case 'FRONT': return 1
        case 'REAR': return 1
        default: return 2
      }
    }
    return 4
  }

  // Calculate installation fee and duration based on selected tires
  const calculateInstallationFeeAndDuration = (offer: Offer, selectedQuantity: number): { fee: number, duration: number } => {
    const service = workshopServices[offer.workshopId]
    if (!service) {
      return { fee: offer.installationFee, duration: offer.durationMinutes || 60 }
    }

    const hasDisposal = request?.additionalNotes?.includes('Altreifenentsorgung gewünscht')
    let fee = 0
    let duration = 0

    if (selectedQuantity <= 2) {
      fee = service.basePrice
      duration = service.durationMinutes
    } else {
      fee = service.basePrice4 || service.basePrice
      duration = service.durationMinutes4 || service.durationMinutes
    }

    // Add disposal fee if requested
    if (hasDisposal && service.disposalFee) {
      fee += service.disposalFee * selectedQuantity
    }

    return { fee, duration }
  }

  // Get display options for an offer (real or virtual)
  const getDisplayOptions = (offer: Offer): TireOption[] => {
    if (offer.tireOptions && offer.tireOptions.length > 0) {
      return offer.tireOptions
    }

    // For offers without tireOptions, don't create virtual options
    // User should accept the complete offer as-is
    return []
  }

  // Calculate selected total with dynamic installation fee
  const calculateSelectedTotal = (offer: Offer): { totalPrice: number; totalQuantity: number; installationFee: number; duration: number; tiresTotal: number } => {
    const displayOptions = getDisplayOptions(offer)
    
    // If no display options (simple offer without tire options), use offer data directly
    if (displayOptions.length === 0) {
      // If installationFee is 0, calculate from workshop service
      let installationFee = offer.installationFee
      let duration = offer.durationMinutes || 60
      
      if (installationFee === 0 || installationFee === null) {
        const { fee, duration: calcDuration } = calculateInstallationFeeAndDuration(offer, request?.quantity || 4)
        installationFee = fee
        duration = calcDuration
      }
      
      const tiresTotal = offer.price - installationFee
      return {
        totalQuantity: request?.quantity || 4,
        tiresTotal,
        installationFee,
        duration,
        totalPrice: tiresTotal + installationFee
      }
    }
    
    const selectedOptions = displayOptions.filter(opt => selectedTireOptionIds.includes(opt.id))
    let totalQuantity = 0
    let tiresTotal = 0

    selectedOptions.forEach(option => {
      const qty = getQuantityForTireOption(option)
      totalQuantity += qty
      tiresTotal += option.pricePerTire * qty
    })

    const { fee, duration } = calculateInstallationFeeAndDuration(offer, totalQuantity)
    
    return {
      totalQuantity,
      tiresTotal,
      installationFee: fee,
      duration,
      totalPrice: tiresTotal + fee
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

  // Helper function to detect service type from notes
  const getServiceType = () => {
    const notes = request.additionalNotes || ''
    
    // Check for motorcycle first (before checking dimensions)
    if (notes.includes('MOTORRADREIFEN') || notes.includes('🏍️')) return 'MOTORCYCLE'
    
    // Then check for regular tire change
    if (request.width !== 0 || request.aspectRatio !== 0 || request.diameter !== 0) {
      return 'TIRE_CHANGE' // Regular tire change
    }
    
    // Other services - check by keywords
    if (notes.includes('KLIMASERVICE')) return 'CLIMATE'
    if (notes.includes('ACHSVERMESSUNG')) return 'ALIGNMENT'
    if (notes.includes('BREMSENWECHSEL')) return 'BRAKES'
    if (notes.includes('BATTERIEWECHSEL')) return 'BATTERY'
    if (notes.includes('RÄDER UMSTECKEN')) return 'WHEEL_CHANGE'
    if (notes.includes('REIFENREPARATUR') || notes.includes('🔧 REPARATUR')) return 'REPAIR'
    if (notes.includes('SONSTIGE REIFENSERVICES')) return 'OTHER_SERVICES'
    
    return 'UNKNOWN'
  }

  const serviceType = getServiceType()

  const getServiceIcon = () => {
    switch (serviceType) {
      case 'CLIMATE': return '❄️'
      case 'ALIGNMENT': return '📐'
      case 'BRAKES': return '🔴'
      case 'BATTERY': return '🔋'
      case 'WHEEL_CHANGE': return '🔄'
      case 'REPAIR': return '🔧'
      case 'MOTORCYCLE': return '🏍️'
      case 'OTHER_SERVICES': return '🔧'
      default: return '🚗'
    }
  }

  const getServiceTitle = () => {
    switch (serviceType) {
      case 'CLIMATE': return 'Klimaservice'
      case 'ALIGNMENT': return 'Achsvermessung'
      case 'BRAKES': return 'Bremsenwechsel'
      case 'BATTERY': return 'Batteriewechsel'
      case 'WHEEL_CHANGE': return 'Räder umstecken'
      case 'REPAIR': return 'Reifenreparatur'
      case 'MOTORCYCLE': return 'Motorradreifen'
      case 'OTHER_SERVICES': return 'Reifenservice'
      case 'TIRE_CHANGE': return 'Reifenwechsel'
      default: return 'Service'
    }
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

  // Check if an offer has been accepted
  const acceptedOffer = request.offers.find(offer => offer.status === 'ACCEPTED')
  
  // If no accepted offer, show all valid pending offers
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
              {/* Show selected tire options summary */}
              {selectedOfferId && request.offers.find(o => o.id === selectedOfferId) && 
               selectedTireOptionIds.length > 0 && (
                <div className="border-2 border-primary-300 rounded-lg p-4 bg-primary-50">
                  <h3 className="font-semibold text-gray-900 mb-3">Ihre gewählten Reifen:</h3>
                  <div className="space-y-2 text-sm">
                    {request.offers.find(o => o.id === selectedOfferId)!.tireOptions!
                      .filter(opt => selectedTireOptionIds.includes(opt.id))
                      .map(option => {
                        const qty = getQuantityForTireOption(option)
                        return (
                          <div key={option.id} className="flex justify-between text-gray-700 bg-white p-2 rounded">
                            <span>• {option.brand} {option.model} ({qty} Stück)</span>
                            <span className="font-semibold">{(option.pricePerTire * qty).toFixed(2)} €</span>
                          </div>
                        )
                      })}
                    {(() => {
                      const offer = request.offers.find(o => o.id === selectedOfferId)!
                      const calculation = calculateSelectedTotal(offer)
                      const hasDisposal = request.additionalNotes?.includes('Altreifenentsorgung gewünscht')
                      return (
                        <>
                          <div className="flex justify-between pt-2 border-t border-primary-300">
                            <span className="font-medium">
                              Montagekosten ({calculation.totalQuantity} Reifen)
                              {hasDisposal && ' + Entsorgung'}
                            </span>
                            <span className="font-semibold">
                              {calculation.installationFee.toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 pt-1">
                            <span>⏱️ Dauer</span>
                            <span>{calculation.duration} Minuten</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold text-primary-600 pt-2 border-t-2 border-primary-400">
                            <span>Gesamtpreis</span>
                            <span>
                              {calculation.totalPrice.toFixed(2)} €
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            ✓ Gesamt: {calculation.totalQuantity} Reifen
                            {hasDisposal && ' ✓ inkl. Altreifenentsorgung'}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
              
              {/* Optional Services for Wheel Change */}
              {selectedOfferId && request.offers.find(o => o.id === selectedOfferId) && 
               request.width === 0 && request.aspectRatio === 0 && request.diameter === 0 && 
               request.offers.find(o => o.id === selectedOfferId)?.storageAvailable && 
               request.offers.find(o => o.id === selectedOfferId)?.storagePrice && 
               request.offers.find(o => o.id === selectedOfferId)!.storagePrice! > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsStorage}
                      onChange={(e) => setWantsStorage(e.target.checked)}
                      className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">Einlagerung hinzufügen</span>
                        <span className="text-lg font-bold text-primary-600">
                          +{request.offers.find(o => o.id === selectedOfferId)!.storagePrice!.toFixed(2)} €
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Preis pro Saison - Die Werkstatt lagert Ihre Räder sicher ein
                      </p>
                    </div>
                  </label>
                </div>
              )}

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
                    <span>Alle anderen Angebote für diese Anfrage werden automatisch abgelehnt und die Werkstätten werden informiert</span>
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
                {serviceType !== 'TIRE_CHANGE' && serviceType !== 'MOTORCYCLE' ? (
                  // Service request (wheel change, repair, etc.)
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Service</p>
                      <p className="text-2xl font-bold text-primary-600">{getServiceIcon()} {getServiceTitle()}</p>
                    </div>

                    {request.additionalNotes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Service-Details</p>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{request.additionalNotes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  // Regular tire request or motorcycle
                  <>
                    {request.vehicle && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Fahrzeug</p>
                        <p className="text-lg font-semibold">🚗 {request.vehicle.make} {request.vehicle.model} ({request.vehicle.year})</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Reifentyp</p>
                      <p className="text-lg font-semibold">{getSeasonText(request.season)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Dimension</p>
                      {serviceType === 'MOTORCYCLE' && request.additionalNotes ? (
                        // Motorradreifen: Extrahiere beide Dimensionen aus additionalNotes
                        (() => {
                          const frontMatch = request.additionalNotes.match(/Vorderreifen:\s*(\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?)/)
                          const rearMatch = request.additionalNotes.match(/Hinterreifen:\s*(\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?)/)
                          
                          return (
                            <div className="space-y-2">
                              {frontMatch && (
                                <p className="text-lg font-bold text-primary-600">
                                  🏍️ Vorne: {frontMatch[1]}
                                </p>
                              )}
                              {rearMatch && (
                                <p className="text-lg font-bold text-primary-600">
                                  🏍️ Hinten: {rearMatch[1]}
                                </p>
                              )}
                              {!frontMatch && !rearMatch && (
                                <p className="text-2xl font-bold text-primary-600">
                                  {request.width}/{request.aspectRatio} R{request.diameter}
                                  {request.loadIndex && ` ${request.loadIndex}`}
                                  {request.speedRating && ` ${request.speedRating}`}
                                </p>
                              )}
                            </div>
                          )
                        })()
                      ) : (
                        // Normale Autoreifen - check for mixed tires
                        (() => {
                          const frontMatch = request.additionalNotes?.match(/Vorderachse: (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
                          const rearMatch = request.additionalNotes?.match(/Hinterachse: (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
                          
                          if (frontMatch && rearMatch) {
                            return (
                              <div className="space-y-2">
                                <p className="text-lg font-bold text-primary-600">
                                  Vorne: {frontMatch[1]}/{frontMatch[2]} R{frontMatch[3]}
                                  {frontMatch[4] && ` ${frontMatch[4]}`}
                                  {frontMatch[5] && ` ${frontMatch[5]}`}
                                </p>
                                <p className="text-lg font-bold text-primary-600">
                                  Hinten: {rearMatch[1]}/{rearMatch[2]} R{rearMatch[3]}
                                  {rearMatch[4] && ` ${rearMatch[4]}`}
                                  {rearMatch[5] && ` ${rearMatch[5]}`}
                                </p>
                              </div>
                            )
                          }
                          
                          return (
                            <p className="text-2xl font-bold text-primary-600">
                              {request.width}/{request.aspectRatio} R{request.diameter}
                              {request.loadIndex && ` ${request.loadIndex}`}
                              {request.speedRating && ` ${request.speedRating}`}
                            </p>
                          )
                        })()
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
                        {request.additionalNotes?.includes('Altreifenentsorgung gewünscht') && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            ♻️ Altreifenentsorgung
                          </span>
                        )}
                      </div>
                    </div>

                    {request.preferredBrands && request.preferredBrands.trim() !== '' && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Bevorzugte Hersteller</p>
                        <p className="text-sm">{request.preferredBrands}</p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Standort</p>
                  <p className="text-sm">PLZ {request.zipCode} ({request.radiusKm} km Umkreis)</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Benötigt bis</p>
                  <p className="text-sm font-semibold">{formatDate(request.needByDate)}</p>
                </div>

                {request.additionalNotes && request.width !== 0 && (() => {
                  // Filter out structured data from additionalNotes
                  let userNotes = request.additionalNotes
                    .replace(/Vorderachse: \d+\/\d+ R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
                    .replace(/Hinterachse: \d+\/\d+ R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
                    .replace(/Vorderreifen:\s*\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
                    .replace(/Hinterreifen:\s*\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
                    .replace(/Altreifenentsorgung gewünscht\n?/g, '')
                    .trim()
                  
                  if (userNotes) {
                    return (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Zusätzliche Hinweise</p>
                        <p className="text-sm whitespace-pre-line">{userNotes}</p>
                      </div>
                    )
                  }
                  return null
                })()}

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Erstellt am {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Offers List or Accepted Offer Details */}
          <div className="lg:col-span-2">
            {acceptedOffer ? (
              // Show accepted offer details
              <>
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-4xl">✓</span>
                    <h2 className="text-3xl font-bold text-green-600">
                      Angebot angenommen
                    </h2>
                  </div>
                  <p className="text-gray-600">Hier sind die Details Ihres angenommenen Angebots</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-400 mb-6">
                  {/* Workshop Info */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Werkstatt</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Name</p>
                        <p className="font-semibold text-lg">{acceptedOffer.workshop.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Telefon</p>
                        <p className="font-semibold text-lg">{acceptedOffer.workshop.phone}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Adresse</p>
                        <p className="font-semibold">
                          {acceptedOffer.workshop.street}<br />
                          {acceptedOffer.workshop.zipCode} {acceptedOffer.workshop.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Service/Tire Details */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {serviceType !== 'TIRE_CHANGE' ? 'Service-Details' : 'Reifen'}
                    </h3>
                    {serviceType !== 'TIRE_CHANGE' ? (
                      // Service details
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-2xl mb-2">{getServiceIcon()}</p>
                        <p className="font-semibold text-lg text-gray-900 mb-2">{getServiceTitle()}</p>
                        {request.additionalNotes && (
                          <p className="text-sm text-gray-700 whitespace-pre-line mt-3">{request.additionalNotes}</p>
                        )}
                      </div>
                    ) : acceptedOffer.tireOptions && acceptedOffer.tireOptions.length > 0 ? (
                      <div className="space-y-3">
                        {acceptedOffer.tireOptions.map((option) => (
                          <div key={option.id} className="bg-gray-50 rounded-lg p-4">
                            <p className="font-semibold text-lg text-gray-900 mb-2">
                              {option.brand} {option.model}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Preis pro Reifen</p>
                                <p className="font-semibold">{option.pricePerTire.toFixed(2)} €</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Anzahl</p>
                                <p className="font-semibold">{request.quantity} Reifen</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-semibold text-lg text-gray-900 mb-2">
                          {acceptedOffer.tireBrand} {acceptedOffer.tireModel}
                        </p>
                        <p className="text-sm text-gray-600">
                          Dimension: {request.width}/{request.aspectRatio} R{request.diameter}
                        </p>
                        <p className="text-sm text-gray-600">Anzahl: {request.quantity} Reifen</p>
                      </div>
                    )}
                    {acceptedOffer.description && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">{acceptedOffer.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Kosten</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {acceptedOffer.tireOptions && acceptedOffer.tireOptions.length > 0 ? (
                        <>
                          {acceptedOffer.tireOptions.map((option, idx) => (
                            <div key={option.id} className="flex justify-between text-sm">
                              <span className="text-gray-700">{option.brand} {option.model} ({request.quantity}x)</span>
                              <span className="font-semibold">{(option.pricePerTire * request.quantity).toFixed(2)} €</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Reifen ({request.quantity}x)</span>
                          <span className="font-semibold">{(acceptedOffer.price - acceptedOffer.installationFee).toFixed(2)} €</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Montagekosten</span>
                        <span className="font-semibold">{acceptedOffer.installationFee.toFixed(2)} €</span>
                      </div>
                      <div className="pt-2 border-t border-gray-300 flex justify-between">
                        <span className="text-lg font-bold text-gray-900">Gesamtpreis</span>
                        <span className="text-2xl font-bold text-primary-600">{acceptedOffer.price.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Info */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Termin</h3>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                      <div className="flex items-start">
                        <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900 mb-2">
                            Terminvereinbarung erforderlich
                          </p>
                          <p className="text-sm text-blue-800 mb-3">
                            Bitte vereinbaren Sie telefonisch einen Termin mit der Werkstatt.
                          </p>
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Telefonnummer:</strong> {acceptedOffer.workshop.phone}
                            </p>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Ihr Buchungscode:</strong>
                            </p>
                            <div className="bg-gray-900 text-white px-4 py-3 rounded-lg font-mono text-2xl text-center tracking-wider">
                              {request.id.slice(-4).toUpperCase()}
                            </div>
                            <p className="text-xs text-gray-600 mt-2 text-center">
                              Bitte geben Sie diesen Code bei der Terminvereinbarung an
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={`/dashboard/customer/requests/${requestId}/book?offerId=${acceptedOffer.id}`}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
                  >
                    Termin online buchen
                  </Link>
                  <Link
                    href="/dashboard/customer/requests"
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                  >
                    Zurück zur Übersicht
                  </Link>
                </div>
              </>
            ) : (
              // Show all available offers
              <>
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
                      {(() => {
                        const displayOptions = getDisplayOptions(offer)

                        // If no tire options, show simple tire info with price breakdown
                        if (displayOptions.length === 0) {
                          const calculation = calculateSelectedTotal(offer)
                          const hasDisposal = request.additionalNotes?.includes('Altreifenentsorgung gewünscht')
                          return (
                            <div>
                              <p className="font-semibold text-lg text-gray-900 mb-2">
                                {offer.tireBrand} {offer.tireModel}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">Alle {request.quantity} Reifen</p>
                              
                              {/* Price breakdown */}
                              <div className="mt-4 pt-4 border-t-2 border-gray-300 bg-primary-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Preisübersicht:</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between text-gray-700">
                                    <span>Reifen ({calculation.totalQuantity} Stück)</span>
                                    <span className="font-semibold">{calculation.tiresTotal.toFixed(2)} €</span>
                                  </div>
                                  <div className="flex justify-between text-gray-700 pt-2 border-t border-gray-300">
                                    <span>
                                      Montagekosten ({calculation.totalQuantity} Reifen)
                                      {hasDisposal && ' + Entsorgung'}
                                    </span>
                                    <span className="font-semibold">{calculation.installationFee.toFixed(2)} €</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-600">
                                    <span>⏱️ Dauer</span>
                                    <span>{calculation.duration} Minuten</span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold text-primary-600 pt-2 border-t-2 border-primary-300">
                                    <span>Gesamtpreis</span>
                                    <span>{calculation.totalPrice.toFixed(2)} €</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return (
                        <>
                          <p className="text-xs text-gray-600 mb-3">Wählen Sie die gewünschten Reifen:</p>
                          <div className="space-y-3">
                            {displayOptions.map((option, idx) => {
                              const quantity = getQuantityForTireOption(option)
                              const optionTirePrice = option.pricePerTire * quantity
                              const tireTypeLabel = option.carTireType === 'ALL_FOUR' ? '🚗 Alle 4 Reifen' :
                                                   option.carTireType === 'FRONT_TWO' ? '🚗 2 Vorderreifen' :
                                                   option.carTireType === 'REAR_TWO' ? '🚗 2 Hinterreifen' :
                                                   option.motorcycleTireType === 'BOTH' ? '🏍️ Beide Reifen' :
                                                   option.motorcycleTireType === 'FRONT' ? '🏍️ Vorderreifen' :
                                                   option.motorcycleTireType === 'REAR' ? '🏍️ Hinterreifen' :
                                                   `${quantity} Reifen`
                              
                              return (
                                <div key={option.id} className="bg-white rounded-lg p-3 border-2 border-gray-200 hover:border-primary-300 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedTireOptionIds.includes(option.id)}
                                      onChange={() => toggleTireOption(option.id, option, offer.id)}
                                      className="mt-1 h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
                                      id={`option-${option.id}`}
                                    />
                                    <label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="font-semibold text-gray-900">{option.brand} {option.model}</p>
                                          <p className="text-xs text-blue-600 font-medium mt-1">{tireTypeLabel}</p>
                                          <p className="text-xs text-gray-600 mt-1">
                                            {option.pricePerTire.toFixed(2)} € pro Reifen × {quantity} = {optionTirePrice.toFixed(2)} €
                                          </p>
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="text-lg font-bold text-primary-600">
                                            {optionTirePrice.toFixed(2)} €
                                          </p>
                                          <p className="text-xs text-gray-500">{quantity} Stück</p>
                                        </div>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Show calculated total if options are selected OR if no options (simple offer) */}
                          {((selectedTireOptionIds.length > 0 && selectedOfferId === offer.id) || displayOptions.length === 0) && (() => {
                            const calculation = calculateSelectedTotal(offer)
                            const hasDisposal = request.additionalNotes?.includes('Altreifenentsorgung gewünscht')
                            return (
                            <div className="mt-4 pt-4 border-t-2 border-gray-300 bg-primary-50 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">Ihre Auswahl:</h4>
                              <div className="space-y-2 text-sm">
                                {displayOptions.filter(opt => selectedTireOptionIds.includes(opt.id)).map(option => {
                                  const qty = getQuantityForTireOption(option)
                                  return (
                                    <div key={option.id} className="flex justify-between text-gray-700">
                                      <span>• {option.brand} {option.model} ({qty} Stück)</span>
                                      <span className="font-semibold">{(option.pricePerTire * qty).toFixed(2)} €</span>
                                    </div>
                                  )
                                })}
                                <div className="flex justify-between text-gray-700 pt-2 border-t border-gray-300">
                                  <span>
                                    Montagekosten ({calculation.totalQuantity} Reifen)
                                    {hasDisposal && ' + Entsorgung'}
                                  </span>
                                  <span className="font-semibold">{calculation.installationFee.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>⏱️ Dauer</span>
                                  <span>{calculation.duration} Minuten</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-primary-600 pt-2 border-t-2 border-primary-300">
                                  <span>Gesamtpreis</span>
                                  <span>{calculation.totalPrice.toFixed(2)} €</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-2">
                                  ✓ Gesamt: {calculation.totalQuantity} Reifen
                                  {hasDisposal && ' ✓ inkl. Altreifenentsorgung'}
                                </p>
                              </div>
                            </div>
                            )
                          })()}
                        </>
                        )
                      })()}
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
                      {offer.status === 'ACCEPTED' ? (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                          ✓ Angenommen
                        </span>
                      ) : offer.status === 'DECLINED' ? (
                        <span className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold">
                          Abgelehnt
                        </span>
                      ) : (request.status === 'PENDING' || request.status === 'QUOTED') && offer.status === 'PENDING' ? (
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          disabled={getDisplayOptions(offer).length > 0 && selectedTireOptionIds.length === 0}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {getDisplayOptions(offer).length > 0 && selectedTireOptionIds.length === 0 ? 
                            'Bitte Reifen wählen' : 'Angebot annehmen'}
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                          Nicht verfügbar
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
