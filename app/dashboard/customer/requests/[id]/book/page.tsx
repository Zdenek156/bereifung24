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

interface Offer {
  id: string
  price: number
  tireBrand: string
  tireModel: string
  description?: string
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
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('PAY_ONSITE')
  const [message, setMessage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')

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
    try {
      const employeeParam = selectedEmployee ? `&employeeId=${selectedEmployee}` : ''
      const response = await fetch(
        `/api/gcal/available-slots?workshopId=${offer.workshop.id}&date=${selectedDate}&duration=60${employeeParam}`
      )

      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      } else {
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Auto-select first employee if in employee mode and only one employee
  useEffect(() => {
    if (offer?.workshop?.calendarMode === 'employees' && 
        offer?.workshop?.employees?.length === 1) {
      setSelectedEmployee(offer.workshop.employees[0].id)
    }
  }, [offer])

  // Fetch available slots when date or employee changes
  useEffect(() => {
    if (selectedDate && offer) {
      // For employee mode, require employee selection
      if (offer.workshop.calendarMode === 'employees') {
        if (selectedEmployee) {
          fetchAvailableSlots()
        }
      } else {
        // Workshop mode doesn't need employee selection
        fetchAvailableSlots()
      }
    }
  }, [selectedDate, selectedEmployee, offer])

  const handleBooking = async () => {
    if (!selectedSlot || !offer || !request) {
      alert('Bitte wählen Sie einen Termin aus')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offer.id,
          workshopId: offer.workshop.id,
          appointmentDate: selectedSlot.start,
          appointmentEndTime: selectedSlot.end,
          paymentMethod: paymentMethod,
          customerMessage: message || undefined,
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
    return offer.workshop.paymentMethods.split(',').map(m => m.trim())
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
                  <p className="text-3xl font-bold text-primary-600">{offer.price.toFixed(2)} €</p>
                </div>
              </div>
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
              
              {/* Mitarbeiter-Auswahl (nur bei Employee Calendar Mode) */}
              {offer.workshop.calendarMode === 'employees' && offer.workshop.employees && offer.workshop.employees.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mitarbeiter auswählen
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => {
                      setSelectedEmployee(e.target.value)
                      setSelectedDate('')
                      setSelectedSlot(null)
                      setAvailableSlots([])
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Bitte wählen Sie einen Mitarbeiter</option>
                    {offer.workshop.employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
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
                    <div className="text-center py-8 text-gray-500">
                      <p>Keine verfügbaren Zeiten für dieses Datum.</p>
                      <p className="text-sm mt-2">Bitte wählen Sie ein anderes Datum.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot)}
                          disabled={!slot.available}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            !slot.available
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                              : selectedSlot === slot
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                          }`}
                        >
                          {formatTime(slot.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
            <div className="bg-white rounded-xl shadow-md p-6">
              <button
                onClick={handleBooking}
                disabled={!selectedSlot || submitting}
                className="w-full py-4 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Wird gebucht...' : 'Verbindlich buchen'}
              </button>
              <p className="text-sm text-gray-600 text-center mt-3">
                Mit der Buchung akzeptieren Sie die AGB der Werkstatt
              </p>
            </div>
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
            {offer.workshop.openingHours && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Öffnungszeiten</h2>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {offer.workshop.openingHours}
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
