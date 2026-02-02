'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Loader2 } from 'lucide-react'

export default function DirectBookingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [directBooking, setDirectBooking] = useState<any>(null)

  const sessionId = searchParams?.get('session_id')
  const directBookingId = searchParams?.get('direct_booking_id')

  useEffect(() => {
    if (!sessionId || !directBookingId) {
      setError('Fehlende Parameter')
      setLoading(false)
      return
    }

    verifyPayment()
  }, [sessionId, directBookingId])

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/customer/direct-booking/${directBookingId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setDirectBooking(result.directBooking)
      } else {
        setError(result.error || 'Zahlung konnte nicht verifiziert werden')
      }
    } catch (err) {
      setError('Fehler bei der Verifizierung')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-2xl font-bold mb-2">Zahlung wird überprüft...</h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment.</p>
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
          <Button onClick={() => router.push('/dashboard/customer/direct-booking/wheel-change')}>
            Zurück
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="p-12 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-2">Zahlung erfolgreich!</h1>
        <p className="text-gray-600 mb-8">
          Ihre Zahlung über <strong>{directBooking?.totalPrice} €</strong> wurde erfolgreich verarbeitet.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-bold text-lg mb-4">📋 Zusammenfassung</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Werkstatt:</span>
              <span className="font-semibold">{directBooking?.workshop?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Service:</span>
              <span className="font-semibold">Räderwechsel</span>
            </div>
            {directBooking?.hasBalancing && (
              <div className="flex justify-between">
                <span>Wuchten:</span>
                <span className="font-semibold">✓ Ja</span>
              </div>
            )}
            {directBooking?.hasStorage && (
              <div className="flex justify-between">
                <span>Einlagerung:</span>
                <span className="font-semibold">✓ Ja</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="font-bold">Gesamtpreis:</span>
              <span className="font-bold">{directBooking?.totalPrice} €</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-lg font-semibold mb-4">
            ✅ Jetzt können Sie Ihren Wunschtermin auswählen!
          </p>
          
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => router.push(`/dashboard/customer/direct-booking/${directBookingId}/select-slot`)}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Termin auswählen
          </Button>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/dashboard/customer')}
          >
            Später auswählen
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Sie können den Termin auch später in Ihrem Dashboard auswählen.
        </p>
      </Card>
    </div>
  )
}
