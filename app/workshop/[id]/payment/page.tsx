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
  const date = searchParams?.get('date') || ''
  const time = searchParams?.get('time') || ''
  const vehicleId = searchParams?.get('vehicleId') || ''

  const [loading, setLoading] = useState(true)
  const [bookingData, setBookingData] = useState<any>(null)
  const [workshop, setWorkshop] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'klarna' | 'bank-transfer' | 'paypal' | 'paypal-installments' | null>(null)
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  
  // VAT state
  const [isSmallBusiness, setIsSmallBusiness] = useState(false)
  const [isBusinessCustomer, setIsBusinessCustomer] = useState(false)

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
      const currentUrl = `/workshop/${workshopId}/payment?date=${date}&time=${time}&vehicleId=${vehicleId}`
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`)
    }
  }, [session, status, router, workshopId, date, time, vehicleId])

  // Load booking data from sessionStorage and workshop from API
  useEffect(() => {
    const loadData = async () => {
      if (!session) return
      
      try {
        setLoading(true)

        // Load booking data from sessionStorage
        const savedBookingData = sessionStorage.getItem('bookingData')
        let parsedBookingData = null
        
        if (savedBookingData) {
          parsedBookingData = JSON.parse(savedBookingData)
          console.log('📦 [PAYMENT] Loaded booking data from sessionStorage:', parsedBookingData)
        } else {
          console.warn('[PAYMENT] No booking data found in sessionStorage!')
        }

        // Load workshop details from API for payment provider settings
        const workshopRes = await fetch(`/api/workshops/${workshopId}`)
        if (workshopRes.ok) {
          const data = await workshopRes.json()
          setWorkshop(data.workshop)
          
          // Check if workshop is small business (Kleinunternehmer)
          if (data.workshop.taxMode === 'KLEINUNTERNEHMER') {
            setIsSmallBusiness(true)
          }
        }
        
        // Load vehicle details if missing in bookingData
        if (parsedBookingData && vehicleId && !parsedBookingData.vehicle) {
          console.log('🚗 [PAYMENT] Loading vehicle data from API...')
          try {
            const vehiclesRes = await fetch('/api/customer/vehicles')
            if (vehiclesRes.ok) {
              const vehiclesData = await vehiclesRes.json()
              const selectedVehicle = vehiclesData.vehicles?.find((v: any) => v.id === vehicleId)
              if (selectedVehicle) {
                parsedBookingData.vehicle = {
                  id: selectedVehicle.id,
                  make: selectedVehicle.make,
                  model: selectedVehicle.model,
                  year: selectedVehicle.year,
                  licensePlate: selectedVehicle.licensePlate,
                }
                console.log('✅ [PAYMENT] Vehicle loaded:', parsedBookingData.vehicle)
              }
            }
          } catch (error) {
            console.error('Error loading vehicle:', error)
          }
        }
        
        setBookingData(parsedBookingData)
        
        // Check if user is business customer
        if (session?.user?.id) {
          try {
            const userRes = await fetch(`/api/user/profile`)
            if (userRes.ok) {
              const userData = await userRes.json()
              if (userData.customerType === 'BUSINESS') {
                setIsBusinessCustomer(true)
              }
            }
          } catch (error) {
            console.error('Error checking business customer:', error)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [session, workshopId, vehicleId])

  const handlePayment = async (method: 'card' | 'klarna' | 'bank-transfer' | 'paypal' | 'paypal-installments') => {
    if (!workshop || !bookingData) return

    setProcessing(true)
    try {
      // STEP 1: Create reservation first (blocks slot for 10 minutes during payment)
      console.log('[PAYMENT] Creating reservation before payment...')
      const reserveResponse = await fetch('/api/customer/direct-booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId,
          vehicleId: bookingData.vehicle.id,
          serviceType: bookingData.service.type,
          date,
          time,
          basePrice: bookingData.pricing.servicePrice,
          balancingPrice: 0,
          storagePrice: 0,
          hasBalancing: false,
          hasStorage: false,
          totalPrice: bookingData.pricing.totalPrice
        })
      })

      const reserveData = await reserveResponse.json()
      
      if (!reserveResponse.ok) {
        alert(reserveData.error || 'Fehler bei der Reservierung. Der Termin könnte bereits gebucht sein.')
        return
      }

      console.log('[PAYMENT] Reservation created:', reserveData.reservationId, 'expires at:', reserveData.expiresAt)
      
      // STEP 2: Proceed with payment
      // PayPal Installments (Ratenzahlung) - noch über separate PayPal API
      if (method === 'paypal-installments') {
        // Create PayPal Order with installments
        const response = await fetch('/api/customer/direct-booking/create-paypal-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workshopId,
            vehicleId: bookingData.vehicle.id,
            serviceType: bookingData.service.type,
            date,
            time,
            amount: bookingData.pricing.totalPrice,
            description: `${serviceLabels[bookingData.service.type] || bookingData.service.type} bei ${workshop.name}`,
            workshopName: workshop.name,
            customerName: session?.user?.name,
            customerEmail: session?.user?.email,
            installments: true,
            reservationId: reserveData.reservationId
          })
        })

        const data = await response.json()
        if (data.orderId && data.approvalUrl) {
          window.location.href = data.approvalUrl
        } else {
          console.error('PayPal error:', data)
          alert('Fehler beim Erstellen der PayPal-Zahlung: ' + (data.error || 'Unbekannter Fehler'))
        }
      } else {
        // ALL OTHER PAYMENT METHODS via STRIPE (card, klarna, bank-transfer, paypal)
        // PayPal (regular) now runs through Stripe for unified commission tracking (6.9%)
        const response = await fetch('/api/customer/direct-booking/create-stripe-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workshopId,
            vehicleId: bookingData.vehicle.id,
            serviceType: bookingData.service.type,
            date,
            time,
            totalPrice: bookingData.pricing.totalPrice,
            workshopName: workshop.name,
            serviceName: serviceLabels[bookingData.service.type] || bookingData.service.type,
            paymentMethodType: method === 'bank-transfer' ? 'customer_balance' : method, // 'card', 'klarna', 'paypal', or 'customer_balance'
            reservationId: reserveData.reservationId
          })
        })

        const data = await response.json()
        if (data.sessionId && data.url) {
          window.location.href = data.url
        } else {
          console.error('Stripe error:', data)
          alert('Fehler beim Erstellen der Zahlungssitzung: ' + (data.error || 'Unbekannter Fehler'))
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
    // Parse date in local timezone to avoid timezone offset issues
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
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

  // Validate and apply coupon code
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Bitte gib einen Gutscheincode ein')
      return
    }

    setIsValidatingCoupon(true)
    setCouponError('')

    try {
      // TODO: Replace with real API call when coupon system is implemented
      // const response = await fetch('/api/coupons/validate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code: couponCode, amount: bookingData.pricing.totalPrice })
      // })
      // const data = await response.json()
      
      // Mock validation for now (remove this when API is ready)
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API delay
      
      // Mock: Accept codes that start with "SAVE"
      if (couponCode.toUpperCase().startsWith('SAVE')) {
        const mockDiscount = couponCode.toUpperCase() === 'SAVE10' ? 10 : 
                           couponCode.toUpperCase() === 'SAVE20' ? 20 : 5
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          type: 'percentage',
          value: mockDiscount,
          description: `${mockDiscount}% Rabatt`
        })
        setCouponError('')
      } else {
        setCouponError('Ungültiger Gutscheincode')
        setAppliedCoupon(null)
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError('Fehler bei der Validierung. Bitte versuche es erneut.')
      setAppliedCoupon(null)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const getTaxLabel = () => {
    if (isSmallBusiness) {
      return 'gemäß §19 UStG wird die MwSt. nicht ausgewiesen'
    }
    if (isBusinessCustomer) {
      return 'zzgl. MwSt.'
    }
    return 'inkl. MwSt.'
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

  if (!workshop || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Fehler beim Laden der Buchungsdaten</p>
          <Link
            href={`/workshop/${workshopId}`}
            className="text-primary-600 hover:underline"
          >
            Zurück zur Werkstatt
          </Link>
        </div>
      </div>
    )
  }

  // Calculate total price with coupon discount
  const subtotal = bookingData.pricing.totalPrice
  const discount = appliedCoupon 
    ? appliedCoupon.type === 'percentage' 
      ? Math.round(subtotal * (appliedCoupon.value / 100))
      : appliedCoupon.value
    : 0
  const totalPrice = subtotal - discount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-primary-600 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
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
                        alt={bookingData.workshop.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900">{bookingData.workshop.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{bookingData.workshop.city} • {bookingData.workshop.distance.toFixed(1)} km entfernt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Service</h3>
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-lg text-primary-900">
                      {bookingData.service.type === 'TIRE_CHANGE' && bookingData.tireBooking?.tireCount
                        ? `Reifenwechsel für ${bookingData.tireBooking.tireCount} Reifen`
                        : serviceLabels[bookingData.service.type] || bookingData.service.type
                      }
                    </p>
                    <p className="font-semibold text-primary-900">
                      {formatPrice(bookingData.pricing.servicePrice)}
                    </p>
                  </div>
                  
                  {/* Additional Services */}
                  {bookingData.additionalServices && bookingData.additionalServices.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-primary-200">
                      <p className="text-sm font-medium text-primary-800 mb-2">Zusatzleistungen:</p>
                      {bookingData.additionalServices.map((service: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm text-primary-700 mb-1">
                          <span>+ {service.serviceName || service.name || service.packageName}</span>
                          <span className="font-medium">{formatPrice(service.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tire Info (only for TIRE_CHANGE service) */}
              {bookingData.service.type === 'TIRE_CHANGE' && bookingData.tireBooking?.selectedTire && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Reifen</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-primary-600 font-medium mb-1">
                          {bookingData.tireBooking.selectedTire.label}
                        </p>
                        <p className="font-bold text-gray-900">
                          {bookingData.tireBooking.tireCount && `${bookingData.tireBooking.tireCount}× `}
                          {bookingData.tireBooking.selectedTire.brand}
                          {bookingData.tireBooking.selectedTire.model && ` ${bookingData.tireBooking.selectedTire.model}`}
                          {/* Dimension */}
                          {(bookingData.tireBooking.tireDimensions || bookingData.tireBooking.selectedTire.dimension) && (
                            <span>
                              {' '}
                              {bookingData.tireBooking.tireDimensions 
                                ? `${bookingData.tireBooking.tireDimensions.width}/${bookingData.tireBooking.tireDimensions.height} R${bookingData.tireBooking.tireDimensions.diameter}`
                                : bookingData.tireBooking.selectedTire.dimension
                              }
                            </span>
                          )}
                          {/* Load and Speed Index */}
                          {((bookingData.tireBooking.tireDimensions?.loadIndex || bookingData.tireBooking.selectedTire.loadIndex) ||
                            (bookingData.tireBooking.tireDimensions?.speedIndex || bookingData.tireBooking.selectedTire.speedIndex)) && (
                            <span>
                              {' '}
                              {bookingData.tireBooking.tireDimensions?.loadIndex || bookingData.tireBooking.selectedTire.loadIndex || ''}
                              {bookingData.tireBooking.tireDimensions?.speedIndex || bookingData.tireBooking.selectedTire.speedIndex || ''}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {bookingData.tireBooking.selectedTire.quantity || 4}× à {formatPrice(bookingData.tireBooking.selectedTire.pricePerTire || 0)}
                        </p>
                      </div>
                      <p className="font-bold text-lg text-gray-900">
                        {formatPrice(bookingData.pricing.tirePrice)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  {bookingData.vehicle ? (
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {bookingData.vehicle.make} {bookingData.vehicle.model}
                        </p>
                        <p className="text-sm text-gray-600">
                          {bookingData.vehicle.licensePlate} • {bookingData.vehicle.year}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p>Kein Fahrzeug ausgewählt</p>
                    </div>
                  )}
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
                <div className="space-y-2">
                  {/* Service Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {bookingData.service.type === 'TIRE_CHANGE' && bookingData.tireBooking?.tireCount
                        ? `Reifenwechsel für ${bookingData.tireBooking.tireCount} Reifen`
                        : serviceLabels[bookingData.service.type] || bookingData.service.type
                      }
                    </span>
                    <span className="font-semibold">{formatPrice(bookingData.pricing.servicePrice)}</span>
                  </div>
                  
                  {/* Additional Services */}
                  {bookingData.additionalServices && bookingData.additionalServices.length > 0 && (
                    bookingData.additionalServices.map((service: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">+ {service.serviceName || service.name || service.packageName}</span>
                        <span className="font-medium">{formatPrice(service.price)}</span>
                      </div>
                    ))
                  )}
                  
                  {/* Tire Price - Only for TIRE_CHANGE */}
                  {bookingData.service.type === 'TIRE_CHANGE' && bookingData.tireBooking?.selectedTire && bookingData.pricing.tirePrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {bookingData.tireBooking.selectedTire.quantity || 4}× Reifen
                      </span>
                      <span className="font-semibold">{formatPrice(bookingData.pricing.tirePrice)}</span>
                    </div>
                  )}
                </div>
                
                {/* Subtotal (if coupon applied) */}
                {appliedCoupon && (
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Zwischensumme</span>
                      <span className="text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                )}
                
                {/* Discount */}
                {appliedCoupon && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600 font-medium">Rabatt ({appliedCoupon.description})</span>
                      <span className="text-green-600 font-semibold">-{formatPrice(discount)}</span>
                    </div>
                  </div>
                )}
                
                <div className={`${appliedCoupon ? 'mt-2' : 'border-t border-gray-200 mt-3'} pt-3`}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Gesamt</span>
                    <span className="text-2xl font-bold text-primary-600">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{getTaxLabel()}</p>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Gutscheincode einlösen
                </h3>
                
                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase())
                          setCouponError('')
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
                        placeholder="Code eingeben..."
                        disabled={isValidatingCoupon}
                        className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase"
                      />
                      <button
                        onClick={validateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm whitespace-nowrap shrink-0"
                      >
                        {isValidatingCoupon ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Prüfen...</span>
                          </>
                        ) : (
                          'Einlösen'
                        )}
                      </button>
                    </div>
                    
                    {couponError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {couponError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">{appliedCoupon.code}</p>
                          <p className="text-xs text-green-700">{appliedCoupon.description} angewendet</p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-green-700 hover:text-green-900 underline"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Zahlungsmethode wählen</h3>
                <div className="space-y-3">
                  {/* Credit Card */}
                  <button
                    onClick={() => setSelectedPaymentMethod('card')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentMethod === 'card'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Image src="/payment-logos/58482363cef1014c0b5e49c1.png" alt="Visa" width={50} height={32} className="h-5 w-auto" />
                          <Image src="/payment-logos/58482354cef1014c0b5e49c0.png" alt="Mastercard" width={50} height={32} className="h-6 w-auto" />
                          <Image src="/payment-logos/620670d4d7b91b0004122618.png" alt="Amex" width={50} height={32} className="h-5 w-auto" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Kreditkarte</p>
                          <p className="text-xs text-gray-500">Visa, Mastercard, Amex</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPaymentMethod === 'card' && (
                          <Check className="w-5 h-5 text-primary-600" />
                        )}
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </button>

                  {/* Bank Transfer (Vorkasse) */}
                  <button
                    onClick={() => setSelectedPaymentMethod('bank-transfer')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentMethod === 'bank-transfer'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Banküberweisung</p>
                          <p className="text-xs text-gray-500">Vorkasse - Zahlung per Überweisung</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPaymentMethod === 'bank-transfer' && (
                          <Check className="w-5 h-5 text-primary-600" />
                        )}
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Klarna - Only show if workshop has Stripe fully enabled */}
                  {workshop.stripeEnabled && (
                  <button
                    onClick={() => setSelectedPaymentMethod('klarna')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentMethod === 'klarna'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Klarna</p>
                          <p className="text-xs text-gray-500">Jetzt kaufen, später bezahlen</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPaymentMethod === 'klarna' && (
                          <Check className="w-5 h-5 text-primary-600" />
                        )}
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  )}

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">oder</span>
                    </div>
                  </div>

                  {/* PayPal */}
                  <button
                    onClick={() => setSelectedPaymentMethod('paypal')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentMethod === 'paypal'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="h-7 flex items-center">
                          <Image
                            src="/payment-logos/de-pp-logo-200px.png"
                            alt="PayPal"
                            width={120}
                            height={31}
                            style={{ width: 'auto', height: '100%', maxHeight: '1.75rem' }}
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-gray-500">Schnell & sicher via Stripe</p>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'paypal' && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>

                  {/* PayPal Ratenzahlung */}
                  <button
                    onClick={() => setSelectedPaymentMethod('paypal-installments')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentMethod === 'paypal-installments'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="h-7 flex items-center">
                          <Image
                            src="/payment-logos/PayPal_Ratenzahlung_h_farbe.png"
                            alt="PayPal Ratenzahlung"
                            width={140}
                            height={42}
                            style={{ width: 'auto', height: '100%', maxHeight: '1.75rem' }}
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-gray-500">In bequemen Raten bezahlen</p>
                        </div>
                      </div>
                      {selectedPaymentMethod === 'paypal-installments' && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Terms acceptance notice */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Mit der Buchung akzeptieren Sie unsere{' '}
                  <a href="/agb" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                    AGB
                  </a>
                  {' '}und{' '}
                  <a href="/datenschutz" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                    Datenschutzerklärung
                  </a>
                  .
                </p>
              </div>

              {/* Pay Button */}
              <button
                onClick={() => selectedPaymentMethod && handlePayment(selectedPaymentMethod)}
                disabled={!selectedPaymentMethod || processing}
                className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-colors shadow-lg hover:shadow-xl disabled:shadow-none mb-4"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Zahlung wird vorbereitet...
                  </span>
                ) : selectedPaymentMethod ? (
                  `Jetzt bezahlen – ${formatPrice(totalPrice)}`
                ) : (
                  'Zahlungsmethode wählen'
                )}
              </button>

              {/* Security Note */}
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Ihre Zahlung wird sicher verschlüsselt verarbeitet. Alle Transaktionen sind durch SSL/TLS geschützt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
