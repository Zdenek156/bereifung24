'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Employee {
  id: string
  name: string
  email: string
  workingHours?: string
}

interface Workshop {
  id: string
  companyName: string
  street: string
  zipCode: string
  city: string
  phone: string
  email: string
  website?: string
  description?: string
  openingHours?: string
  latitude?: number
  longitude?: number
  paymentMethods?: string
  iban?: string
  accountHolder?: string
  paypalEmail?: string
  calendarMode?: string
  employees?: Employee[]
}

interface TireOption {
  id: string
  brand: string
  model: string
  pricePerTire: number
  montagePrice?: number
  carTireType?: string
}

interface Offer {
  id: string
  price: number
  tireBrand: string
  tireModel: string
  description?: string
  installationFee: number
  durationMinutes?: number
  balancingPrice?: number | null
  storagePrice?: number | null
  storageAvailable?: boolean | null
  customerWantsStorage?: boolean | null
  tireOptions?: TireOption[]
  selectedTireOptionIds?: string[]
  workshop: Workshop
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface TireRequest {
  id: string
  season: string
  width: number
  aspectRatio: number
  diameter: number
  quantity: number
  needByDate: string
  additionalNotes?: string
  serviceType?: string
}

export default function BookAppointmentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const requestId = params.id as string
  const offerId = searchParams.get('offerId')

  const [offer, setOffer] = useState<Offer | null>(null)
  const [request, setRequest] = useState<TireRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('PAY_ONSITE')
  const [message, setMessage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedTireOption, setSelectedTireOption] = useState<TireOption | null>(null)
  const [calendarUnavailable, setCalendarUnavailable] = useState(false)
  const [showManualBooking, setShowManualBooking] = useState(false)
  const [slotErrorMessage, setSlotErrorMessage] = useState<string>('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'CUSTOMER') {
      router.push('/login')
      return
    }

    if (!offerId) {
      alert('Kein Angebot ausgewählt')
      router.push(`/dashboard/customer/requests/${requestId}`)
      return
    }

    fetchOfferDetails()
  }, [session, status, router, requestId, offerId])

  useEffect(() => {
    if (selectedDate && offer) {
      fetchAvailableSlots()
    }
  }, [selectedDate, offer])

  const fetchOfferDetails = async () => {
    try {
      const [offerResponse, requestResponse] = await Promise.all([
        fetch(`/api/offers/${offerId}`),
        fetch(`/api/tire-requests/${requestId}`)
      ])

      if (offerResponse.ok && requestResponse.ok) {
        const offerData = await offerResponse.json()
        const requestData = await requestResponse.json()
        
        setOffer(offerData.offer)
        setRequest(requestData.request)
        
        // Setze erste TireOption als Default
        if (offerData.offer.tireOptions && offerData.offer.tireOptions.length > 0) {
          setSelectedTireOption(offerData.offer.tireOptions[0])
        }
      } else {
        alert('Fehler beim Laden der Details')
        router.push(`/dashboard/customer/requests/${requestId}`)
      }
    } catch (error) {
      console.error('Error fetching details:', error)
      alert('Fehler beim Laden der Details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!offer) return

    setLoadingSlots(true)
    setSlotErrorMessage('')
    try {
      const duration = offer.durationMinutes || 60
      const response = await fetch(
        `/api/gcal/available-slots?workshopId=${offer.workshop.id}&date=${selectedDate}&duration=${duration}`
      )

      if (response.ok) {
        const data = await response.json()
        const slots = data.availableSlots || data.slots || []
        setAvailableSlots(slots)
        setCalendarUnavailable(false)
        
        if (slots.length === 0 && data.message) {
          setSlotErrorMessage(data.message)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }))
        console.error('Failed to fetch slots:', errorData)
        
        if (response.status === 400 || response.status === 401) {
          setCalendarUnavailable(true)
          setSlotErrorMessage(errorData.message || 'Kalender nicht verfügbar')
        } else {
          setSlotErrorMessage(errorData.message || errorData.error || 'Fehler beim Laden der Zeiten')
        }
        
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
      setSlotErrorMessage('Fehler beim Laden der verfügbaren Zeiten')
    } finally {
      setLoadingSlots(false)
    }
  }

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && offer) {
      fetchAvailableSlots()
    }
  }, [selectedDate, offer])

  const handleBooking = async () => {
    if (!selectedSlot || !offer || !request || !selectedDate) {
      alert('Bitte wählen Sie einen Termin aus')
      return
    }

    setSubmitting(true)
    try {
      // Create ISO datetime strings
      const [hours, minutes] = selectedSlot.split(':')
      const appointmentStart = new Date(selectedDate)
      appointmentStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const durationMinutes = offer.durationMinutes || 60
      const appointmentEnd = new Date(appointmentStart)
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + durationMinutes)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          workshopId: offer.workshop.id,
          appointmentDate: appointmentStart.toISOString(),
          appointmentEndTime: appointmentEnd.toISOString(),
          paymentMethod: paymentMethod,
          customerMessage: message || undefined,
          selectedTireOptionId: selectedTireOption?.id,
        }),
      })

      if (response.ok) {
        alert('Termin erfolgreich gebucht!')
        router.push('/dashboard/customer/appointments')
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler bei der Buchung')
      }
    } catch (error) {
      console.error('Error booking:', error)
      alert('Fehler bei der Buchung')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualBooking = () => {
    setShowManualBooking(true)
  }

  const confirmManualBooking = () => {
    alert('Vielen Dank! Bitte rufen Sie die Werkstatt an, um Ihren Termin zu vereinbaren.')
    router.push('/dashboard/customer/requests')
  }

  // Helper function to detect service type from notes
  const getServiceType = () => {
    if (!request) {
      return 'UNKNOWN'
    }
    
    // Use serviceType field if available (and not UNKNOWN)
    if (request.serviceType && request.serviceType !== 'UNKNOWN') {
      return request.serviceType
    }
    
    if (request.width !== 0 || request.aspectRatio !== 0 || request.diameter !== 0) {
      return 'TIRE_CHANGE' // Regular tire change
    }
    
    const notes = request.additionalNotes || ''
    if (notes.includes('KLIMASERVICE')) return 'CLIMATE'
    if (notes.includes('ACHSVERMESSUNG')) return 'ALIGNMENT'
    if (notes.includes('BREMSEN-SERVICE') || notes.includes('BREMSENWECHSEL')) return 'BRAKE_SERVICE'
    if (notes.includes('BATTERIEWECHSEL')) return 'BATTERY'
    if (notes.includes('RÄDER UMSTECKEN')) return 'WHEEL_CHANGE'
    if (notes.includes('REIFENREPARATUR') || notes.includes('🔧 REPARATUR')) return 'REPAIR'
    if (notes.includes('MOTORRADREIFEN') || notes.includes('🏍️')) return 'MOTORCYCLE'
    if (notes.includes('SONSTIGE REIFENSERVICES')) return 'OTHER_SERVICES'
    
    return 'UNKNOWN'
  }

  const getServiceIcon = () => {
    const type = getServiceType()
    switch (type) {
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
    const type = getServiceType()
    switch (type) {
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

  const getMapUrl = () => {
    if (!offer?.workshop) return ''
    const address = `${offer.workshop.street}, ${offer.workshop.zipCode} ${offer.workshop.city}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  const getDirectionsUrl = () => {
    if (!offer?.workshop.latitude || !offer?.workshop.longitude) return getMapUrl()
    return `https://www.google.com/maps/dir/?api=1&destination=${offer.workshop.latitude},${offer.workshop.longitude}`
  }

  const formatDistance = () => {
    // TODO: Calculate distance from customer location
    return 'N/A'
  }

  const getPaymentMethods = () => {
    if (!offer?.workshop.paymentMethods) return ['Barzahlung', 'EC-Karte', 'Kreditkarte']
    
    try {
      const methods = JSON.parse(offer.workshop.paymentMethods)
      const labels: { [key: string]: string } = {
        cash: 'Barzahlung',
        ecCard: 'EC-Karte',
        creditCard: 'Kreditkarte',
        bankTransfer: 'Banküberweisung',
        bankTransferIban: 'Banküberweisung',
        paypal: 'PayPal',
        paypalEmail: 'PayPal'
      }
      
      return Object.keys(methods)
        .filter(key => methods[key] === true || methods[key] === 'true')
        .map(key => labels[key] || key)
        .filter(Boolean)
    } catch (e) {
      // Fallback wenn es kein JSON ist, versuche kommagetrennt
      return offer.workshop.paymentMethods.split(',').map(m => m.trim()).filter(Boolean)
    }
  }

  const formatOpeningHours = () => {
    if (!offer?.workshop.openingHours) return []
    
    try {
      const hours = JSON.parse(offer.workshop.openingHours)
      const dayLabels: { [key: string]: string } = {
        monday: 'Montag',
        tuesday: 'Dienstag',
        wednesday: 'Mittwoch',
        thursday: 'Donnerstag',
        friday: 'Freitag',
        saturday: 'Samstag',
        sunday: 'Sonntag'
      }
      
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      return days.map(day => {
        const dayData = hours[day]
        if (!dayData) return null
        
        return {
          label: dayLabels[day],
          hours: dayData.closed ? 'Geschlossen' : `${dayData.from} - ${dayData.to}`
        }
      }).filter(Boolean)
    } catch (e) {
      return []
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3) // 3 Monate in die Zukunft
    return maxDate.toISOString().split('T')[0]
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!offer || !request) {
    return null
  }

  // Calculate actual total price based on selected tire options
  const calculateActualPrice = (): number => {
    const serviceType = getServiceType()
    const isBrakeService = serviceType === 'BRAKE_SERVICE'
    
    // If no tire options or none selected, use original offer price
    if (!offer.tireOptions || offer.tireOptions.length === 0 || !offer.selectedTireOptionIds || offer.selectedTireOptionIds.length === 0) {
      return offer.price
    }
    
    const selectedOptions = offer.tireOptions.filter(opt => 
      offer.selectedTireOptionIds!.includes(opt.id)
    )
    
    if (isBrakeService) {
      // For brake service: sum parts + montage costs
      let totalParts = 0
      let totalMontage = 0
      
      selectedOptions.forEach(option => {
        totalParts += option.pricePerTire
        totalMontage += (option as any).montagePrice || 0
      })
      
      return parseFloat((totalParts + totalMontage).toFixed(2))
    }
    
    // For other services with options
    let total = 0
    selectedOptions.forEach(option => {
      total += option.pricePerTire
    })
    
    return parseFloat(total.toFixed(2))
  }

  const actualPrice = calculateActualPrice()
  const tireSpecs = `${request.width}/${request.aspectRatio} R${request.diameter}`

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/customer/requests/${requestId}`}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center inline-flex"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Anfrage
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Termin buchen</h1>
          <p className="text-gray-600">
            Buchen Sie Ihren Termin bei {offer.workshop.companyName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Linke Spalte: Terminauswahl */}
          <div className="lg:col-span-2 space-y-6">
            {/* Angebots-Übersicht */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ihr Angebot</h2>
              {getServiceType() !== 'TIRE_CHANGE' ? (
                // Service request (wheel change, repair, etc.)
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{getServiceIcon()}</span>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{getServiceTitle()}</p>
                    </div>
                  </div>
                  {/* Show selected brake packages if available */}
                  {getServiceType() === 'BRAKES' && offer.tireOptions && offer.selectedTireOptionIds && offer.selectedTireOptionIds.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Ausgewählte Bremsenpakete:</p>
                      <div className="space-y-2">
                        {offer.tireOptions
                          .filter(opt => offer.selectedTireOptionIds!.includes(opt.id))
                          .map(option => {
                            const axleLabel = option.carTireType === 'FRONT_TWO' ? 'Vorderachse' : 'Hinterachse'
                            const montageCost = (option as any).montagePrice || 0
                            return (
                              <div key={option.id} className="text-sm text-gray-700">
                                <div className="font-medium">{option.brand} {axleLabel}</div>
                                <div className="text-xs text-gray-600">
                                  Teile: {option.pricePerTire.toFixed(2)} € + Montage: {montageCost.toFixed(2)} € = {(option.pricePerTire + montageCost).toFixed(2)} €
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                  {request.additionalNotes && getServiceType() !== 'BRAKES' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{request.additionalNotes}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Gesamtpreis</p>
                    <p className="text-3xl font-bold text-primary-600">{actualPrice.toFixed(2)} €</p>
                  </div>
                </div>
              ) : (
                // Regular tire change
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Reifengröße</p>
                    <p className="font-semibold">{tireSpecs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Menge</p>
                    <p className="font-semibold">{request.quantity} Reifen</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Marke</p>
                    <p className="font-semibold">{offer.tireBrand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Modell</p>
                    <p className="font-semibold">{offer.tireModel}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Preis (inkl. Montage)</p>
                    <p className="text-3xl font-bold text-primary-600">{actualPrice.toFixed(2)} €</p>
                  </div>
                </div>
              )}
            </div>

            {/* Zahlungsmethode */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Zahlungsmethode</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="PAY_ONSITE"
                    checked={paymentMethod === 'PAY_ONSITE'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div className="ml-3">
                    <p className="font-semibold">Zahlung vor Ort</p>
                    <p className="text-sm text-gray-600">
                      Bezahlen Sie direkt in der Werkstatt ({getPaymentMethods().join(', ')})
                    </p>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors opacity-50">
                  <input
                    type="radio"
                    name="payment"
                    value="PAY_ONLINE"
                    disabled
                    className="w-4 h-4 text-primary-600"
                  />
                  <div className="ml-3">
                    <p className="font-semibold">Online-Zahlung</p>
                    <p className="text-sm text-gray-600">Demnächst verfügbar</p>
                  </div>
                </label>
              </div>

              {/* Payment Details Box */}
              {paymentMethod === 'PAY_ONSITE' && offer?.workshop && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Zahlungsinformationen
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Verfügbare Zahlungsmethoden:</span> {getPaymentMethods().join(', ')}
                    </p>
                    {offer.workshop.iban && (
                      <div className="pt-2 border-t border-blue-200">
                        <p className="font-medium text-gray-900 mb-1">Bankverbindung für Vorabüberweisung:</p>
                        <p className="text-gray-700">IBAN: {offer.workshop.iban}</p>
                        {offer.workshop.accountHolder && (
                          <p className="text-gray-700">Kontoinhaber: {offer.workshop.accountHolder}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          Die genaue Rechnungsnummer mit Verwendungszweck erhalten Sie von der Werkstatt.
                        </p>
                      </div>
                    )}
                    {offer.workshop.paypalEmail && (
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-gray-700">
                          <span className="font-medium">PayPal:</span> {offer.workshop.paypalEmail}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Die genaue Rechnungsnummer erhalten Sie von der Werkstatt.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Terminauswahl */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Termin auswählen</h2>
              
              {calendarUnavailable ? (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
                  <div className="flex items-start mb-4">
                    <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Online-Terminbuchung derzeit nicht verfügbar
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Die automatische Terminbuchung ist aktuell nicht möglich. Bitte rufen Sie die Werkstatt direkt an, um einen Termin zu vereinbaren.
                      </p>
                    </div>
                  </div>

                  {offer && (
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-gray-900 mb-3">Werkstatt Kontaktdaten:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-semibold">{offer.workshop.companyName}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a href={`tel:${offer.workshop.phone}`} className="text-primary-600 font-bold text-lg hover:text-primary-700">
                            {offer.workshop.phone}
                          </a>
                        </div>

                        {offer.workshop.email && (
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href={`mailto:${offer.workshop.email}`} className="text-primary-600 hover:text-primary-700">
                              {offer.workshop.email}
                            </a>
                          </div>
                        )}

                        {offer.workshop.street && (
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-gray-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                              <div>{offer.workshop.street}</div>
                              <div>{offer.workshop.zipCode} {offer.workshop.city}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={confirmManualBooking}
                    className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors"
                  >
                    Verstanden - Ich rufe die Werkstatt an
                  </button>
                  <p className="text-sm text-gray-600 text-center mt-3">
                    Erwähnen Sie beim Anruf Ihren Buchungs-Code: <strong className="font-mono text-lg">{request?.id?.slice(-4).toUpperCase()}</strong>
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wählen Sie ein Datum
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value)
                        setSelectedSlot(null)
                      }}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verfügbare Zeiten
                  </label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 text-center">
                      <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-900 font-semibold mb-2">
                        {slotErrorMessage || 'Keine verfügbaren Zeiten für dieses Datum'}
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        {slotErrorMessage.includes('Urlaub') || slotErrorMessage.includes('geschlossen') 
                          ? 'Die Werkstatt ist an diesem Tag nicht verfügbar.' 
                          : 'Die Werkstatt hat möglicherweise geschlossen oder alle Termine sind bereits vergeben.'}
                      </p>
                      <p className="text-sm text-primary-600 font-medium">
                        Bitte wählen Sie ein anderes Datum oder rufen Sie die Werkstatt direkt an.
                      </p>
                      {offer && (
                        <a 
                          href={`tel:${offer.workshop.phone}`}
                          className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                        >
                          <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {offer.workshop.phone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedSlot === slot
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                  )}
                </>
              )}
            </div>

            {/* Nachricht an Werkstatt */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Nachricht an die Werkstatt (optional)
              </h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Haben Sie besondere Wünsche oder Anmerkungen?"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Buchungs-Button */}
            {!calendarUnavailable && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot || submitting}
                  className="w-full py-4 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Termin wird bestätigt...' : 'Termin bestätigen'}
                </button>
                <p className="text-sm text-gray-600 text-center mt-3">
                  Mit der Terminbestätigung akzeptieren Sie die AGB der Werkstatt
                </p>
              </div>
            )}
          </div>

          {/* Rechte Spalte: Werkstatt-Informationen */}
          <div className="space-y-6">
            {/* Werkstatt-Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Werkstatt</h2>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {offer.workshop.companyName}
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p>{offer.workshop.street}</p>
                    <p>{offer.workshop.zipCode} {offer.workshop.city}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${offer.workshop.phone}`} className="text-primary-600 hover:underline">
                    {offer.workshop.phone}
                  </a>
                </div>

                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${offer.workshop.email}`} className="text-primary-600 hover:underline">
                    {offer.workshop.email}
                  </a>
                </div>

                {offer.workshop.website && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a href={offer.workshop.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Karte & Anfahrt */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Anfahrt</h2>
              
              <div className="mb-4">
                <a
                  href={getMapUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative hover:opacity-90 transition-opacity">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(offer.workshop.street + ', ' + offer.workshop.zipCode + ' ' + offer.workshop.city)}&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </a>
              </div>

              <div className="space-y-2">
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-primary-600 text-white text-center rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Route berechnen
                </a>
                <a
                  href={getMapUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 border-2 border-primary-600 text-primary-600 text-center rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  In Google Maps öffnen
                </a>
              </div>
            </div>

            {/* Öffnungszeiten */}
            {offer.workshop.openingHours && formatOpeningHours().length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Öffnungszeiten
                </h2>
                <div className="space-y-2">
                  {formatOpeningHours().map((day: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{day.label}:</span>
                      <span className="text-gray-600">{day.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Beschreibung */}
            {offer.workshop.description && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Über die Werkstatt</h2>
                <p className="text-sm text-gray-700">
                  {offer.workshop.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
