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
  disposalFee: number | null
  runFlatSurcharge: number | null
  totalTirePurchasePrice: number | null
  hasBalancing: boolean
  hasStorage: boolean
  hasDisposal: boolean
  tireRunFlat: boolean
  durationMinutes: number
  paymentMethod: string
  createdAt: string
  // Invoice
  invoiceUrl: string | null
  invoiceRequestedAt: string | null
  // Tire Details
  tireBrand: string | null
  tireModel: string | null
  tireSize: string | null
  tireLoadIndex: string | null
  tireSpeedIndex: string | null
  tireQuantity: number | null
  tirePurchasePrice: number | null
  workshop: {
    id: string
    companyName: string
    user: {
      email: string
      phone: string | null
      street: string | null
      city: string | null
      zipCode: string | null
    }
  }
  vehicle: {
    id: string
    make: string
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
  const [requestingInvoice, setRequestingInvoice] = useState(false)
  const [invoiceRequested, setInvoiceRequested] = useState(false)

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

  const handleInvoiceRequest = async () => {
    if (!booking) return
    
    try {
      setRequestingInvoice(true)
      const response = await fetch(`/api/customer/direct-booking/${booking.id}/request-invoice`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setInvoiceRequested(true)
        // Update local state
        setBooking({
          ...booking,
          invoiceRequestedAt: new Date().toISOString()
        })
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Anfrage fehlgeschlagen'}`)
      }
    } catch (error) {
      console.error('Error requesting invoice:', error)
      alert('Fehler beim Anfordern der Rechnung')
    } finally {
      setRequestingInvoice(false)
    }
  }

  const handleInvoiceDownload = () => {
    if (!booking) return
    
    if (booking.invoiceUrl) {
      // Open invoice in new tab
      window.open(booking.invoiceUrl, '_blank')
    } else {
      // Request invoice if not available
      handleInvoiceRequest()
    }
  }

  const handleAddToCalendar = () => {
    if (!booking) return

    // Parse date and time
    const bookingDate = new Date(booking.date)
    const [hours, minutes] = booking.time.split(':').map(Number)
    bookingDate.setHours(hours, minutes, 0, 0)

    // Calculate end time (add duration)
    const endDate = new Date(bookingDate.getTime() + booking.durationMinutes * 60000)

    // Format dates for ICS (YYYYMMDDTHHMMSS)
    const formatICSDate = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    }

    const startDateStr = formatICSDate(bookingDate)
    const endDateStr = formatICSDate(endDate)

    // Create ICS content
    const serviceLabel = serviceTypeLabels[booking.serviceType] || booking.serviceType
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bereifung24//Booking//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${startDateStr}`,
      `DTEND:${endDateStr}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `UID:${booking.id}@bereifung24.de`,
      `SUMMARY:${serviceLabel} - ${booking.workshop.companyName}`,
      `DESCRIPTION:Buchungsnummer: ${bookingNumber}\\nFahrzeug: ${booking.vehicle.make} ${booking.vehicle.model}\\nPreis: ${booking.totalPrice.toFixed(2)} €`,
      `LOCATION:${booking.workshop.user.street || ''}, ${booking.workshop.user.zipCode || ''} ${booking.workshop.user.city || ''}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Erinnerung an Ihren Termin morgen',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    // Create download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bereifung24-termin-${bookingNumber}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return 'Unbekannt'
    switch (method) {
      case 'STRIPE':
        return 'Kreditkarte'
      case 'PAYPAL':
        return 'PayPal'
      default:
        return method
    }
  }

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
          <div className="text-gray-600">{booking.workshop.user.street || 'Keine Adresse'}</div>
          <div className="text-gray-600">{booking.workshop.user.zipCode} {booking.workshop.user.city}</div>
          <div className="mt-4 space-y-1">
            <div className="text-sm">
              <span className="text-gray-600">Telefon:</span>{' '}
              <a href={`tel:${booking.workshop.user.phone}`} className="text-blue-600 hover:underline">
                {booking.workshop.user.phone || 'Keine Telefonnummer'}
              </a>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">E-Mail:</span>{' '}
              <a href={`mailto:${booking.workshop.user.email}`} className="text-blue-600 hover:underline">
                {booking.workshop.user.email}
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
            {booking.vehicle.make} {booking.vehicle.model}
          </div>
          <div className="text-gray-600">Kennzeichen: {booking.vehicle.licensePlate}</div>
          <div className="text-gray-600">Baujahr: {booking.vehicle.year}</div>
        </div>
      </Card>

      {/* Tire Details - Only show if tires were purchased */}
      {booking.totalTirePurchasePrice && booking.totalTirePurchasePrice > 0 && (
        <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <h2 className="text-xl font-bold mb-4">Gekaufte Reifen</h2>
          <div className="space-y-3">
            {booking.tireBrand && booking.tireModel && (
              <div>
                <div className="font-semibold text-lg text-blue-900">
                  {booking.tireBrand} {booking.tireModel}
                </div>
              </div>
            )}
            {booking.tireSize && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-32 text-gray-600">Größe:</div>
                <div className="font-semibold">{booking.tireSize}</div>
              </div>
            )}
            {(booking.tireLoadIndex || booking.tireSpeedIndex) && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-32 text-gray-600">Load/Speed:</div>
                <div className="font-semibold">
                  {booking.tireLoadIndex || '-'} / {booking.tireSpeedIndex || '-'}
                </div>
              </div>
            )}
            {booking.tireQuantity && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-32 text-gray-600">Anzahl:</div>
                <div className="font-semibold">{booking.tireQuantity} Stück</div>
              </div>
            )}
            {booking.tirePurchasePrice && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-32 text-gray-600">Preis pro Reifen:</div>
                <div className="font-semibold">{booking.tirePurchasePrice.toFixed(2)} €</div>
              </div>
            )}
            {booking.tireRunFlat && (
              <div className="flex items-center text-blue-600 mt-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Runflat-Reifen
              </div>
            )}
            <div className="pt-3 mt-3 border-t border-blue-300">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Gesamt Reifen:</span>
                <span className="text-xl font-bold text-blue-700">
                  {booking.totalTirePurchasePrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Zahlungsdetails</h2>
        <div className="space-y-3">
          {booking.totalTirePurchasePrice && booking.totalTirePurchasePrice > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                {booking.tireQuantity && `${booking.tireQuantity}x `}
                {booking.tireBrand && `${booking.tireBrand} `}
                {booking.tireModel && `${booking.tireModel} `}
                {booking.tireSize}
                {booking.tireLoadIndex && booking.tireSpeedIndex && ` ${booking.tireLoadIndex}${booking.tireSpeedIndex}`}
              </span>
              <span className="font-semibold">{booking.totalTirePurchasePrice.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Reifenwechsel:</span>
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
          {booking.hasDisposal && booking.disposalFee && (
            <div className="flex justify-between">
              <span className="text-gray-600">Entsorgung:</span>
              <span className="font-semibold">{booking.disposalFee.toFixed(2)} €</span>
            </div>
          )}
          {booking.tireRunFlat && booking.runFlatSurcharge && (
            <div className="flex justify-between">
              <span className="text-gray-600">Runflat-Zuschlag:</span>
              <span className="font-semibold">{booking.runFlatSurcharge.toFixed(2)} €</span>
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
              {getPaymentMethodLabel(booking.paymentMethod)}
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
          onClick={handleAddToCalendar}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Zu Kalender hinzufügen
        </Button>
        <Button
          variant="outline"
          onClick={handleInvoiceDownload}
          disabled={requestingInvoice}
        >
          <Download className="h-4 w-4 mr-2" />
          {booking.invoiceUrl ? 'Rechnung herunterladen' : 
           requestingInvoice ? 'Anfrage wird gesendet...' : 
           'Rechnung anfordern'}
        </Button>
      </div>

      {/* Invoice Request Confirmation */}
      {(invoiceRequested || booking.invoiceRequestedAt) && !booking.invoiceUrl && (
        <Card className="p-4 mt-6 bg-orange-50 border-orange-200">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-900 mb-1">
                Werkstatt wurde informiert
              </p>
              <p className="text-sm text-orange-800">
                Die Werkstatt wurde über Ihre Rechnungsanforderung informiert und 
                wird diese in Kürze hochladen. Sie erhalten eine Benachrichtigung, 
                sobald die Rechnung verfügbar ist.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Email Confirmation Notice */}
      <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-center text-blue-800">
          📧 Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet.
        </p>
      </Card>
    </div>
  )
}
