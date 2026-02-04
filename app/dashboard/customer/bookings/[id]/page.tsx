'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Car, CheckCircle, Download, ArrowLeft } from 'lucide-react'

interface Booking {
  id: string
  date: string
  time: string
  serviceType: string
  status: string
  paymentStatus: string
  totalPrice: number
  basePrice: number
  balancingPrice: number | null
  storagePrice: number | null
  hasBalancing: boolean
  hasStorage: boolean
  durationMinutes: number
  paymentMethod: string
  createdAt: string
  workshop: {
    id: string
    companyName: string
    address: string
    city: string
    postalCode: string
    phone: string
    email: string
  }
  vehicle: {
    id: string
    brand: string
    model: string
    licensePlate: string
    year: number
  }
}

const serviceTypeLabels: Record<string, string> = {
  WHEEL_CHANGE: 'Räderwechsel',
  TIRE_CHANGE: 'Reifenwechsel',
  TIRE_STORAGE: 'Reifeneinlagerung',
  TIRE_HOTEL: 'Reifen-Hotel'
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/customer/direct-booking/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setBooking(data)
        } else {
          console.error('Failed to fetch booking')
        }
      } catch (error) {
        console.error('Error fetching booking:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchBooking()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Buchungsdetails...</div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Buchung nicht gefunden</h2>
          <Button onClick={() => router.push('/dashboard/customer/appointments')}>
            Zurück zur Übersicht
          </Button>
        </Card>
      </div>
    )
  }

  const bookingNumber = `DB-${booking.id.slice(-8).toUpperCase()}`
  const appointmentDate = new Date(booking.date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/customer/appointments')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Zurück zur Übersicht
      </Button>

      {/* Success Header */}
      <Card className="p-8 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-500 rounded-full p-3">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">Buchung bestätigt!</h1>
        <p className="text-center text-gray-600 mb-4">
          Ihre Buchung wurde erfolgreich abgeschlossen und bezahlt.
        </p>
        <div className="text-center">
          <span className="text-sm text-gray-500">Buchungsnummer:</span>
          <div className="text-2xl font-mono font-bold text-green-600 mt-1">
            {bookingNumber}
          </div>
        </div>
      </Card>

      {/* Appointment Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Termininformationen
        </h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-32 text-gray-600">Service:</div>
            <div className="font-semibold">{serviceTypeLabels[booking.serviceType] || booking.serviceType}</div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-32 text-gray-600">Datum:</div>
            <div className="font-semibold">{appointmentDate}</div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-32 text-gray-600">Uhrzeit:</div>
            <div className="font-semibold">{booking.time} Uhr</div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-32 text-gray-600">Dauer:</div>
            <div className="font-semibold">{booking.durationMinutes} Minuten</div>
          </div>
          {booking.hasBalancing && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mit Auswuchten
            </div>
          )}
          {booking.hasStorage && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mit Einlagerung
            </div>
          )}
        </div>
      </Card>

      {/* Workshop Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Werkstatt
        </h2>
        <div className="space-y-2">
          <div className="font-semibold text-lg">{booking.workshop.companyName}</div>
          <div className="text-gray-600">{booking.workshop.address}</div>
          <div className="text-gray-600">{booking.workshop.postalCode} {booking.workshop.city}</div>
          <div className="mt-4 space-y-1">
            <div className="text-sm">
              <span className="text-gray-600">Telefon:</span>{' '}
              <a href={`tel:${booking.workshop.phone}`} className="text-blue-600 hover:underline">
                {booking.workshop.phone}
              </a>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">E-Mail:</span>{' '}
              <a href={`mailto:${booking.workshop.email}`} className="text-blue-600 hover:underline">
                {booking.workshop.email}
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Vehicle Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Car className="h-5 w-5 mr-2 text-blue-600" />
          Fahrzeug
        </h2>
        <div className="space-y-2">
          <div className="font-semibold text-lg">
            {booking.vehicle.brand} {booking.vehicle.model}
          </div>
          <div className="text-gray-600">Kennzeichen: {booking.vehicle.licensePlate}</div>
          <div className="text-gray-600">Baujahr: {booking.vehicle.year}</div>
        </div>
      </Card>

      {/* Payment Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Zahlungsdetails</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Basispreis:</span>
            <span className="font-semibold">{booking.basePrice.toFixed(2)} €</span>
          </div>
          {booking.hasBalancing && booking.balancingPrice && (
            <div className="flex justify-between">
              <span className="text-gray-600">Auswuchten:</span>
              <span className="font-semibold">{booking.balancingPrice.toFixed(2)} €</span>
            </div>
          )}
          {booking.hasStorage && booking.storagePrice && (
            <div className="flex justify-between">
              <span className="text-gray-600">Einlagerung:</span>
              <span className="font-semibold">{booking.storagePrice.toFixed(2)} €</span>
            </div>
          )}
          <div className="pt-3 border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Gesamtbetrag:</span>
              <span className="text-2xl font-bold text-green-600">
                {booking.totalPrice.toFixed(2)} €
              </span>
            </div>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span className="text-gray-600">Zahlungsmethode:</span>
            <span className="font-semibold">
              {booking.paymentMethod === 'PAYPAL' ? 'PayPal' : booking.paymentMethod}
            </span>
          </div>
          <div className="flex items-center justify-center mt-4 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-700 font-semibold">Bereits bezahlt</span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => {
            // TODO: Add calendar export functionality
            alert('Kalenderfunktion folgt in Kürze')
          }}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Zu Kalender hinzufügen
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            // TODO: Add download receipt functionality
            alert('Download-Funktion folgt in Kürze')
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Rechnung herunterladen
        </Button>
      </div>

      {/* Email Confirmation Notice */}
      <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-center text-blue-800">
          📧 Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet.
        </p>
      </Card>
    </div>
  )
}
