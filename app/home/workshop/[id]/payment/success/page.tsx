'use client'

import { useState, useEffect } from 'react'
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
  const sessionId = searchParams?.get('session_id') || ''
  const serviceType = searchParams?.get('service') || ''
  const date = searchParams?.get('date') || ''
  const time = searchParams?.get('time') || ''
  const vehicleId = searchParams?.get('vehicleId') || ''

  const [loading, setLoading] = useState(true)
  const [bookingCreated, setBookingCreated] = useState(false)
  const [workshop, setWorkshop] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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

    const verifyAndCreateBooking = async () => {
      try {
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

        // Verify payment if session_id is present (Stripe)
        if (sessionId) {
          const verifyRes = await fetch('/api/customer/direct-booking/verify-stripe-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          })

          if (!verifyRes.ok) {
            throw new Error('Zahlung konnte nicht verifiziert werden')
          }
        }

        // Create booking
        const bookingRes = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workshopId,
            vehicleId,
            serviceType,
            date,
            time,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paymentMethod: sessionId ? 'STRIPE' : 'PAYPAL'
          })
        })

        if (!bookingRes.ok) {
          const errorData = await bookingRes.json()
          throw new Error(errorData.error || 'Fehler beim Erstellen der Buchung')
        }

        setBookingCreated(true)
      } catch (err: any) {
        console.error('Error creating booking:', err)
        setError(err.message || 'Ein Fehler ist aufgetreten')
      } finally {
        setLoading(false)
      }
    }

    verifyAndCreateBooking()
  }, [session, status, sessionId, workshopId, vehicleId, serviceType, date, time, router])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const dateObj = new Date(dateStr)
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
            href={`/home/workshop/${workshopId}`}
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
          </div>
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
          <Link
            href="/home"
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-semibold"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
