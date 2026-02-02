'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Loader2, CheckCircle } from 'lucide-react'

export default function SelectSlotPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [directBooking, setDirectBooking] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')

  useEffect(() => {
    loadDirectBooking()
  }, [params.id])

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const loadDirectBooking = async () => {
    try {
      const response = await fetch(`/api/customer/direct-booking/${params.id}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setDirectBooking(result.directBooking)
        
        // Check if already booked
        if (result.directBooking.bookingId) {
          router.push(`/dashboard/customer/bookings/${result.directBooking.bookingId}`)
          return
        }

        // Check if payment is complete
        if (result.directBooking.paymentStatus !== 'PAID') {
          setError('Zahlung noch nicht abgeschlossen')
          return
        }

        // Set default date to tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setSelectedDate(tomorrow.toISOString().split('T')[0])
      } else {
        setError(result.error || 'Buchung nicht gefunden')
      }
    } catch (err) {
      setError('Fehler beim Laden der Buchung')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async (date: string) => {
    try {
      const response = await fetch(
        `/api/customer/direct-booking/${params.id}/available-slots?date=${date}`
      )
      const result = await response.json()

      if (response.ok && result.success) {
        setAvailableSlots(result.slots || [])
      }
    } catch (err) {
      console.error('Error loading slots:', err)
    }
  }

  const handleBookSlot = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Bitte wählen Sie Datum und Uhrzeit')
      return
    }

    setBooking(true)
    setError(null)

    try {
      const response = await fetch(`/api/customer/direct-booking/${params.id}/book-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push(`/dashboard/customer/bookings/${result.bookingId}?created=true`)
      } else {
        setError(result.error || 'Fehler beim Buchen')
      }
    } catch (err) {
      setError('Fehler beim Buchen')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Lade Terminoptionen...</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2 text-red-600">Fehler</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard/customer')}>
            Zum Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (!directBooking) return null

  // Generate next 14 days
  const dates = []
  for (let i = 1; i <= 14; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    dates.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          <Calendar className="inline h-8 w-8 mr-2" />
          Termin auswählen
        </h1>
        <p className="text-gray-600">
          Wählen Sie einen passenden Termin bei {directBooking.workshop?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selection */}
        <Card className="p-6 lg:col-span-1">
          <h3 className="font-bold mb-4">📅 Datum wählen</h3>
          <div className="space-y-2">
            {dates.map((date) => (
              <button
                key={date.value}
                onClick={() => setSelectedDate(date.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedDate === date.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                {date.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Time Selection */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-bold mb-4">
            <Clock className="inline h-5 w-5 mr-1" />
            Uhrzeit wählen
          </h3>

          {!selectedDate ? (
            <div className="text-center py-12 text-gray-500">
              ← Bitte wählen Sie zuerst ein Datum
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-gray-600">
                Für dieses Datum sind leider keine Termine verfügbar.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Bitte wählen Sie ein anderes Datum.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    className={`px-4 py-3 rounded-lg border transition-colors ${
                      !slot.available
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : selectedTime === slot.time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>

              {/* Booking Summary */}
              {selectedTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-bold mb-2">Buchungsdetails:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Datum:</span>
                      <span className="font-semibold">
                        {new Date(selectedDate).toLocaleDateString('de-DE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uhrzeit:</span>
                      <span className="font-semibold">{selectedTime} Uhr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dauer:</span>
                      <span className="font-semibold">ca. {directBooking.durationMinutes} Min.</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Werkstatt:</span>
                      <span className="font-semibold">{directBooking.workshop?.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 mb-4">
                  {error}
                </div>
              )}

              <Button
                onClick={handleBookSlot}
                disabled={!selectedTime || booking}
                className="w-full"
                size="lg"
              >
                {booking ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Wird gebucht...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Termin verbindlich buchen
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-3">
                Ihre Zahlung wurde bereits verarbeitet. Der Termin wird sofort bestätigt.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
