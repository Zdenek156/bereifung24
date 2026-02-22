'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Check, Loader2, Calendar, Clock, MapPin, Car } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const workshopId = params.id as string
  const sessionId = searchParams?.get('session_id') || '' // Stripe session ID
  const paypalToken = searchParams?.get('token') || '' // PayPal order ID
  const serviceType = searchParams?.get('service') || ''
  const date = searchParams?.get('date') || ''
  const time = searchParams?.get('time') || ''
  const vehicleId = searchParams?.get('vehicleId') || ''
  const reservationId = searchParams?.get('reservationId') || '' // NEW: Reservation ID from payment flow

  const [loading, setLoading] = useState(true)
  const [bookingCreated, setBookingCreated] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  const [workshop, setWorkshop] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const bookingInProgress = useRef(false) // Prevent duplicate booking creation

  // Service labels
  const serviceLabels: Record<string, string> = {
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_CHANGE': 'Reifenwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorradreifen',
    'ALIGNMENT_BOTH': 'Achsvermessung + Einstellung',
    'CLIMATE_SERVICE': 'Klimaservice'
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`)
      return
    }

    // Prevent duplicate booking creation
    if (bookingInProgress.current || bookingCreated) {
      return
    }

    const verifyAndCreateBooking = async () => {
      try {
        bookingInProgress.current = true // Set flag to prevent duplicate calls
        setLoading(true)

        // Load workshop details
        const workshopRes = await fetch(`/api/workshops/${workshopId}`)
        if (workshopRes.ok) {
          const data = await workshopRes.json()
          setWorkshop(data.workshop)
        }

        // Load vehicle details
        const vehicleRes = await fetch(`/api/customer/vehicles`)
        if (vehicleRes.ok) {
          const data = await vehicleRes.json()
          const foundVehicle = data.vehicles?.find((v: any) => v.id === vehicleId)
          setVehicle(foundVehicle)
        }

        // Check if booking already exists (skip reservation check on reload)
        const cachedBookingData = sessionStorage.getItem(`booking_data_${reservationId}`)
        if (cachedBookingData) {
          console.log('[SUCCESS] Booking already created, loading from cache')
          try {
            const bookingData = JSON.parse(cachedBookingData)
            setBooking(bookingData)
            setBookingCreated(true)
            setLoading(false)
            return
          } catch (parseError) {
            console.warn('[SUCCESS] Failed to parse cached booking data:', parseError)
            // Clear invalid cache and continue with normal flow
            sessionStorage.removeItem(`booking_data_${reservationId}`)
          }
        }

        // If no cached data but already marked as created, show error (something went wrong)
        if (bookingCreated) {
          throw new Error('Buchung wurde bereits erstellt, aber Details konnten nicht geladen werden. Bitte kontaktieren Sie den Support.')
        }

        // Verify reservation before creating booking (required for all payments now)
        if (!reservationId) {
          throw new Error('Keine Reservierungs-ID gefunden. Bitte kontaktieren Sie den Support.')
        }

        console.log('[SUCCESS] Verifying reservation:', reservationId)
        
        // Fetch and verify reservation
        const reservationRes = await fetch(`/api/customer/direct-booking/reservation/${reservationId}`)
        
        if (!reservationRes.ok) {
          const reservationError = await reservationRes.json()
          if (reservationRes.status === 410) {
            // 410 Gone = Reservation expired
            throw new Error('Ihre Reservierung ist abgelaufen (über 10 Minuten). Bitte buchen Sie den Termin erneut.')
          } else if (reservationRes.status === 404) {
            throw new Error('Reservierung nicht gefunden. Der Termin wurde möglicherweise bereits gebucht.')
          } else {
            throw new Error(reservationError.error || 'Fehler beim Überprüfen der Reservierung')
          }
        }

        const reservationData = await reservationRes.json()
        const reservation = reservationData.reservation

        console.log('[SUCCESS] Reservation verified:', reservation)

        // Validate reservation status
        if (reservation.status !== 'RESERVED') {
          throw new Error('Diese Reservierung wurde bereits verwendet oder storniert.')
        }

        // PAYPAL: Capture order before creating booking
        if (paypalToken) {
          console.log('[SUCCESS] Capturing PayPal order:', paypalToken)
          
          const captureRes = await fetch('/api/customer/direct-booking/capture-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: paypalToken })
          })

          if (!captureRes.ok) {
            const captureError = await captureRes.json()
            throw new Error(captureError.error || 'PayPal-Zahlung konnte nicht erfasst werden')
          }

          const captureData = await captureRes.json()
          console.log('[SUCCESS] PayPal order captured:', captureData)
        }

        // Use reservation data for booking (authoritative source)
        // The reservation.date from DB is stored as UTC timestamp
        // We need to convert it to Europe/Berlin timezone to get the correct date
        const reservationDate = new Date(reservation.date)
        
        // Convert to Berlin timezone and extract date components
        const berlinDateStr = reservationDate.toLocaleString('de-DE', {
          timeZone: 'Europe/Berlin',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
        
        // Parse DD.MM.YYYY format to YYYY-MM-DD
        const [day, month, year] = berlinDateStr.split(/[.\s]/).filter(Boolean)
        const dateStr = `${year}-${month}-${day}`
        
        const bookingData = {
          workshopId: reservation.workshopId,
          vehicleId: reservation.vehicleId,
          serviceType: reservation.serviceType,
          date: dateStr, // Use Berlin timezone date
          time: reservation.time,
          paymentStatus: 'PAID',
          paymentMethod: sessionId ? 'STRIPE' : 'PAYPAL',
          paymentId: sessionId || paypalToken, // Store payment reference
          sendEmails: true,
          createCalendarEvent: true,
          reservationId: reservation.id // Pass the reservation ID to update it
        }

        // Create booking with all post-payment actions (new direct booking API)
        const bookingRes = await fetch('/api/bookings/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        })

        if (!bookingRes.ok) {
          const errorData = await bookingRes.json()
          
          // Special handling for slot conflict (409)
          if (bookingRes.status === 409) {
            throw new Error('Dieser Termin wurde bereits von einem anderen Kunden gebucht. Bitte wählen Sie einen anderen Termin.')
          }
          
          throw new Error(errorData.error || 'Fehler beim Erstellen der Buchung')
        }

        const finalBookingData = await bookingRes.json()
        console.log('[SUCCESS] Booking created with calendar event and emails sent:', finalBookingData)

        // Store complete booking data to prevent re-creation on page reload
        if (finalBookingData.booking && reservationId) {
          sessionStorage.setItem(`booking_data_${reservationId}`, JSON.stringify(finalBookingData.booking))
        }
        
        setBooking(finalBookingData.booking)

        // NO LONGER DELETE reservation - it was already converted to CONFIRMED booking
        // The /api/bookings/direct route updates the reservation status to CONFIRMED
        // Deleting it here would remove the confirmed booking from the database!
        console.log('[SUCCESS] Reservation converted to confirmed booking:', reservationId)

        setBookingCreated(true)
      } catch (err: any) {
        console.error('[SUCCESS] Error creating booking:', err)
        setError(err.message || 'Ein Fehler ist aufgetreten')
        bookingInProgress.current = false // Reset flag on error
      } finally {
        setLoading(false)
      }
    }

    verifyAndCreateBooking()
  }, [session, status, sessionId, workshopId, vehicleId, serviceType, date, time, router, reservationId, bookingCreated])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    // Parse date components without timezone conversion to preserve the selected date
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day) // Create date in local timezone
    return dateObj.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verarbeite Zahlung und erstelle Buchung...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Fehler aufgetreten</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/workshop/${workshopId}`}
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Zurück zur Werkstatt
          </Link>
        </div>
      </div>
    )
  }

  if (!bookingCreated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Erstelle Buchung...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Zahlung erfolgreich!
        </h1>
        <p className="text-lg text-gray-600 text-center mb-8">
          Ihre Buchung wurde bestätigt und die Werkstatt wurde benachrichtigt.
        </p>

        {/* Booking Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Buchungsdetails</h2>
          
          <div className="space-y-4">
            {/* Workshop */}
            {workshop && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{workshop.name}</p>
                  <p className="text-sm text-gray-600">
                    {workshop.street}, {workshop.postalCode} {workshop.city}
                  </p>
                </div>
              </div>
            )}

            {/* Service */}
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Service</p>
                <p className="text-sm text-gray-600">{serviceLabels[serviceType] || serviceType}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Termin</p>
                <p className="text-sm text-gray-600">{formatDate(date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Uhrzeit</p>
                <p className="text-sm text-gray-600">{time} Uhr</p>
              </div>
            </div>

            {/* Vehicle */}
            {vehicle && (
              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Fahrzeug</p>
                  <p className="text-sm text-gray-600">
                    {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                  </p>
                </div>
              </div>
            )}

            {/* Tire Details - Mixed Tires (Mischbereifung) */}
            {booking?.tireData?.isMixedTires && (
              <>
                {/* Front Tires */}
                {booking.tireData.front && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth={2}/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M2 12h20"/>
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Reifen Vorne</p>
                      <p className="text-sm text-gray-600">
                        {booking.tireData.front.brand} {booking.tireData.front.model}<br />
                        Größe: {booking.tireData.front.size} {booking.tireData.front.loadIndex}{booking.tireData.front.speedIndex}<br />
                        Menge: {booking.tireData.front.quantity || 2} Stück
                        {booking.tireData.front.runflat && <><br /><span className="text-red-600 font-semibold">⚡ RunFlat-Reifen</span></>}
                        {booking.tireData.front.winter && <><br /><span className="text-blue-600 font-semibold">❄️ Winterreifen (3PMSF)</span></>}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Rear Tires */}
                {booking.tireData.rear && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth={2}/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M2 12h20"/>
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Reifen Hinten</p>
                      <p className="text-sm text-gray-600">
                        {booking.tireData.rear.brand} {booking.tireData.rear.model}<br />
                        Größe: {booking.tireData.rear.size} {booking.tireData.rear.loadIndex}{booking.tireData.rear.speedIndex}<br />
                        Menge: {booking.tireData.rear.quantity || 2} Stück
                        {booking.tireData.rear.runflat && <><br /><span className="text-red-600 font-semibold">⚡ RunFlat-Reifen</span></>}
                        {booking.tireData.rear.winter && <><br /><span className="text-blue-600 font-semibold">❄️ Winterreifen (3PMSF)</span></>}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tire Details - Standard (Single Type) */}
            {!booking?.tireData?.isMixedTires && booking?.tireBrand && booking?.tireModel && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={2}/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M2 12h20"/>
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Reifen</p>
                  <p className="text-sm text-gray-600">
                    {booking.tireBrand} {booking.tireModel}<br />
                    Größe: {booking.tireSize} {booking.tireLoadIndex}{booking.tireSpeedIndex}<br />
                    Menge: {booking.tireQuantity || 4} Stück
                    {booking.tireRunFlat && <><br /><span className="text-red-600 font-semibold">⚡ RunFlat-Reifen</span></>}
                    {booking.tire3PMSF && <><br /><span className="text-blue-600 font-semibold">❄️ Winterreifen (3PMSF)</span></>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review Reminder */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">💬 Ihre Meinung ist wichtig!</h3>
          <p className="text-sm text-blue-800 mb-3">
            Nach Ihrem Termin können Sie die Werkstatt bewerten. Ihre Bewertung hilft anderen Kunden bei der Entscheidung für die richtige Werkstatt.
          </p>
          <p className="text-xs text-blue-700">
            Sie erhalten nach dem Termin eine Erinnerung zur Bewertung per E-Mail.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-primary-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-primary-900 mb-2">Was passiert jetzt?</h3>
          <ul className="space-y-2 text-sm text-primary-800">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-0.5">•</span>
              <span>Sie erhalten eine Bestätigungs-E-Mail mit allen Details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-0.5">•</span>
              <span>Die Werkstatt wurde über Ihre Buchung informiert</span>
            </li>
            {(booking?.tireBrand || booking?.tireData?.isMixedTires) && (
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>Die Werkstatt bestellt Ihre Reifen beim Lieferanten</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-0.5">•</span>
              <span>Sie können Ihre Buchung im Dashboard verwalten</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard/customer/bookings"
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors text-center font-semibold"
          >
            Zu meinen Buchungen
          </Link>
          <button
            onClick={() => {
              // Clear sessionStorage before navigating to homepage
              sessionStorage.clear()
              router.push('/')
            }}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-semibold cursor-pointer"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}
