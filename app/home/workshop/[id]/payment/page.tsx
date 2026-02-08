'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Car,
  CreditCard,
  Check,
  Loader2,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const workshopId = params.id as string
  const serviceType = searchParams?.get('service') || 'WHEEL_CHANGE'
  const date = searchParams?.get('date') || ''
  const time = searchParams?.get('time') || ''
  const vehicleId = searchParams?.get('vehicleId') || ''

  const [loading, setLoading] = useState(true)
  const [workshop, setWorkshop] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)
  const [servicePricing, setServicePricing] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'paypal-installments'>('stripe')
  const [processing, setProcessing] = useState(false)

  // Service labels
  const serviceLabels: Record<string, string> = {
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_CHANGE': 'Reifenwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorradreifen',
    'ALIGNMENT_BOTH': 'Achsvermessung + Einstellung',
    'CLIMATE_SERVICE': 'Klimaservice'
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      const currentUrl = `/home/workshop/${workshopId}/payment?service=${serviceType}&date=${date}&time=${time}&vehicleId=${vehicleId}`
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
    }
  }, [session, status, router])

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      if (!session) return
      
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

        // Load service pricing
        const pricingRes = await fetch(`/api/workshop/${workshopId}/services/${serviceType}`)
        if (pricingRes.ok) {
          const data = await pricingRes.json()
          setServicePricing(data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [session, workshopId, serviceType, vehicleId])

  const handlePayment = async () => {
    if (!workshop || !vehicle || !servicePricing) return

    setProcessing(true)
    try {
      if (paymentMethod === 'stripe') {
        // Create Stripe Checkout Session
        const response = await fetch('/api/customer/direct-booking/create-stripe-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workshopId,
            vehicleId,
            serviceType,
            date,
            time,
            totalPrice: servicePricing.price || servicePricing.basePrice,
            workshopName: workshop.name,
            serviceName: serviceLabels[serviceType] || serviceType
          })
        })

        const data = await response.json()
        if (data.sessionId && data.url) {
          window.location.href = data.url
        } else {
          console.error('Stripe error:', data)
          alert('Fehler beim Erstellen der Zahlungssitzung: ' + (data.error || 'Unbekannter Fehler'))
        }
      } else if (paymentMethod === 'paypal') {
        // Create PayPal Order
        const response = await fetch('/api/customer/direct-booking/create-paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workshopId,
            vehicleId,
            serviceType,
            date,
            time,
            amount: servicePricing.price || servicePricing.basePrice,
            description: `${serviceLabels[serviceType] || serviceType} bei ${workshop.name}`,
            workshopName: workshop.name,
            customerName: session?.user?.name,
            customerEmail: session?.user?.email
          })
        })

        const data = await response.json()
        console.log('PayPal response:', data)
        if (data.orderId && data.approvalUrl) {
          window.location.href = data.approvalUrl
        } else {
          console.error('PayPal error:', data)
          alert('Fehler beim Erstellen der PayPal-Zahlung: ' + (data.error || 'Unbekannter Fehler'))
        }
      } else if (paymentMethod === 'paypal-installments') {
        // Create PayPal Installments Order
        const response = await fetch('/api/customer/direct-booking/create-paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workshopId,
            vehicleId,
            serviceType,
            date,
            time,
            amount: servicePricing.price || servicePricing.basePrice,
            description: `${serviceLabels[serviceType] || serviceType} bei ${workshop.name}`,
            workshopName: workshop.name,
            customerName: session?.user?.name,
            customerEmail: session?.user?.email,
            installments: true // Flag for PayPal Installments
          })
        })

        const data = await response.json()
        console.log('PayPal Installments response:', data)
        if (data.orderId && data.approvalUrl) {
          window.location.href = data.approvalUrl
        } else {
          console.error('PayPal Installments error:', data)
          alert('Fehler beim Erstellen der PayPal Ratenzahlung: ' + (data.error || 'Unbekannter Fehler'))
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Fehler bei der Zahlungsabwicklung')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Lade Buchungsinformationen...</p>
        </div>
      </div>
    )
  }

  if (!workshop || !vehicle || !servicePricing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Fehler beim Laden der Daten</p>
          <Link
            href={`/home/workshop/${workshopId}`}
            className="text-primary-600 hover:underline"
          >
            Zurück zur Werkstatt
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = servicePricing.price || servicePricing.basePrice || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-primary-600 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-600 text-2xl font-bold">B24</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Bereifung24</h1>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="text-white text-right hidden md:block">
                <p className="text-sm opacity-90">Angemeldet als</p>
                <p className="font-semibold">{session?.user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Buchungsübersicht</h2>

              {/* Workshop Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Werkstatt</h3>
                <div className="flex items-start gap-4">
                  {workshop.logoUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={workshop.logoUrl}
                        alt={workshop.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">{workshop.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{workshop.street}, {workshop.postalCode} {workshop.city}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Service</h3>
                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="font-bold text-lg text-primary-900">
                    {serviceLabels[serviceType] || serviceType}
                  </p>
                  {servicePricing.packageName && (
                    <p className="text-sm text-primary-700 mt-1">{servicePricing.packageName}</p>
                  )}
                </div>
              </div>

              {/* Appointment Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Termin</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{formatDate(date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{time} Uhr</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Fahrzeug</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-600">
                        {vehicle.licensePlate} • {vehicle.year}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Zahlung</h2>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Service</span>
                  <span className="font-semibold">{formatPrice(totalPrice)}</span>
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Gesamt</span>
                    <span className="text-2xl font-bold text-primary-600">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Zahlungsmethode wählen</h3>
                <div className="space-y-3">
                  {/* Stripe */}
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      processing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-3 flex-1">
                        {/* Logos Row */}
                        <div className="flex items-center gap-3">
                          <Image
                            src="/payment-logos/58482363cef1014c0b5e49c1.png"
                            alt="Visa"
                            width={60}
                            height={40}
                            className="h-6 w-auto"
                          />
                          <Image
                            src="/payment-logos/58482354cef1014c0b5e49c0.png"
                            alt="Mastercard"
                            width={60}
                            height={40}
                            className="h-7 w-auto"
                          />
                          <Image
                            src="/payment-logos/620670d4d7b91b0004122618.png"
                            alt="American Express"
                            width={60}
                            height={40}
                            className="h-6 w-auto"
                          />
                        </div>
                        {/* Text Row */}
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Kreditkarte</p>
                          <p className="text-xs text-gray-500">Visa, Mastercard, Amex</p>
                        </div>
                      </div>
                      {paymentMethod === 'stripe' && (
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* PayPal */}
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      processing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-3 flex-1">
                        {/* PayPal Logo */}
                        <div className="h-8 flex items-center">
                          <Image
                            src="/payment-logos/de-pp-logo-200px.png"
                            alt="PayPal"
                            width={200}
                            height={51}
                            style={{ width: 'auto', height: '100%', maxHeight: '2rem' }}
                          />
                        </div>
                        {/* Text */}
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">PayPal</p>
                          <p className="text-xs text-gray-500">Schnell & sicher</p>
                        </div>
                      </div>
                      {paymentMethod === 'paypal' && (
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* PayPal Ratenzahlung */}
                  <button
                    onClick={() => setPaymentMethod('paypal-installments')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'paypal-installments'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      processing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-3 flex-1">
                        {/* PayPal Ratenzahlung Logo */}
                        <div className="h-8 flex items-center">
                          <Image
                            src="/payment-logos/PayPal_Ratenzahlung_h_farbe.png"
                            alt="PayPal Ratenzahlung"
                            width={200}
                            height={60}
                            style={{ width: 'auto', height: '100%', maxHeight: '2rem' }}
                          />
                        </div>
                        />
                        {/* Text */}
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">PayPal Ratenzahlung</p>
                          <p className="text-xs text-gray-500">In bequemen Raten bezahlen</p>
                        </div>
                      </div>
                      {paymentMethod === 'paypal-installments' && (
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {paymentMethod === 'stripe' 
                      ? 'Mit Kreditkarte bezahlen' 
                      : paymentMethod === 'paypal-installments'
                      ? 'Mit PayPal Ratenzahlung bezahlen'
                      : 'Mit PayPal bezahlen'}
                  </>
                )}
              </button>

              {/* Security Note */}
              <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Ihre Zahlung wird sicher über {paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'} verarbeitet. 
                  Ihre Daten sind SSL-verschlüsselt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
