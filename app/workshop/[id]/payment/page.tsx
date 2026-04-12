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
  const fromStorageBookingId = searchParams?.get('fromStorageBookingId') || ''

  const [loading, setLoading] = useState(true)
  const [bookingData, setBookingData] = useState<any>(null)
  const [workshop, setWorkshop] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'klarna' | 'amazon_pay' | 'eps' | 'ideal_wero' | 'paypal' | null>(null)
  
  // Customer notes state
  const [customerNotes, setCustomerNotes] = useState('')
  
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
    'MOTORCYCLE_TIRE': 'Motorradreifenmontage',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice'
  }

  // Alignment package subtype labels
  const alignmentSubtypeLabels: Record<string, string> = {
    'measurement_front': 'Vermessung Vorderachse',
    'measurement_rear': 'Vermessung Hinterachse',
    'measurement_both': 'Vermessung beide Achsen',
    'adjustment_front': 'Einstellung Vorderachse',
    'adjustment_rear': 'Einstellung Hinterachse',
    'adjustment_both': 'Einstellung beide Achsen',
    'full_service': 'Komplett-Service',
  }

  // Get service display name (with subtype for TIRE_REPAIR, ALIGNMENT_BOTH, CLIMATE_SERVICE)
  const getServiceDisplayName = () => {
    if (!bookingData) return ''
    const type = bookingData.service?.type
    const subtype = bookingData.service?.subtype
    if (type === 'TIRE_REPAIR' && subtype) {
      const subtypeLabels: Record<string, string> = {
        'foreign_object': 'Fremdkörper-Entfernung',
        'valve_damage': 'Ventilschaden-Reparatur',
      }
      return subtypeLabels[subtype] || serviceLabels[type] || type
    }
    if (type === 'ALIGNMENT_BOTH' && subtype && alignmentSubtypeLabels[subtype]) {
      return `Achsvermessung (${alignmentSubtypeLabels[subtype]})`
    }
    if (type === 'CLIMATE_SERVICE' && subtype) {
      const climateLabels: Record<string, string> = {
        'check': 'Klimacheck',
        'basic': 'Basic Service',
        'comfort': 'Comfort Service',
        'premium': 'Premium Service',
      }
      if (climateLabels[subtype]) return `Klimaservice (${climateLabels[subtype]})`
    }
    return serviceLabels[type] || type
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

  const handlePayment = async (method: 'card' | 'klarna' | 'amazon_pay' | 'eps' | 'ideal_wero' | 'paypal') => {
    if (!workshop || !bookingData) return

    setProcessing(true)
    try {
      // DEBUG: Log tire booking data
      console.log('[PAYMENT] Tire booking data:', {
        hasTireBooking: !!bookingData.tireBooking,
        isMixedTires: bookingData.tireBooking?.isMixedTires,
        selectedTire: bookingData.tireBooking?.selectedTire,
        selectedFrontTire: bookingData.tireBooking?.selectedFrontTire,
        selectedRearTire: bookingData.tireBooking?.selectedRearTire,
        tireDimensionsFront: bookingData.tireBooking?.tireDimensionsFront,
        tireDimensionsRear: bookingData.tireBooking?.tireDimensionsRear
      })

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
          balancingPrice: bookingData.additionalServices?.find((s: any) => s.type === 'BALANCING')?.price || 0,
          storagePrice: bookingData.additionalServices?.find((s: any) => s.type === 'STORAGE')?.price || 0,
          washingPrice: bookingData.additionalServices?.find((s: any) => s.type === 'WASHING')?.price || 0,
          disposalFee: bookingData.pricing.disposalPrice || bookingData.tireBooking?.disposalPrice || 0,
          runFlatSurcharge: bookingData.pricing.runflatPrice || bookingData.tireBooking?.runflatPrice || 0,
          hasBalancing: bookingData.additionalServices?.some((s: any) => s.type === 'BALANCING') || false,
          hasStorage: bookingData.additionalServices?.some((s: any) => s.type === 'STORAGE') || false,
          hasWashing: bookingData.additionalServices?.some((s: any) => s.type === 'WASHING') || false,
          hasDisposal: (bookingData.service.type === 'TIRE_CHANGE' || bookingData.service.type === 'MOTORCYCLE_TIRE') ? (bookingData.tireBooking?.hasDisposal || false) : false,
          totalPrice: bookingData.pricing.totalPrice,
          // Storage: explicit link from TireStorageCard or bookingData
          ...(fromStorageBookingId && { fromStorageBookingId }),
          // Base service duration from workshop (actual package duration, NOT hardcoded 60)
          baseDuration: bookingData.service?.baseDuration || 60,
          // Additional services data (Klimaservice, Achsvermessung, etc.) - excluding BALANCING/STORAGE which have dedicated fields
          additionalServicesData: bookingData.additionalServices?.filter((s: any) => s.type !== 'BALANCING' && s.type !== 'STORAGE' && s.type !== 'WASHING').map((s: any) => ({
            name: s.serviceName || s.name,
            packageName: s.packageName || '',
            price: s.price || 0,
            duration: s.duration || 0,
            type: s.type || '',
            packageType: s.packageType || ''
          })) || [],
          // Service subtype (e.g. 'foreign_object', 'valve_damage' for TIRE_REPAIR)
          serviceSubtype: bookingData.service?.subtype || null,
          // TIRE DATA - Standard tires OR mixed tires
          ...(bookingData.tireBooking?.selectedTire && {
            tireBrand: bookingData.tireBooking.selectedTire.brand || '',
            tireModel: bookingData.tireBooking.selectedTire.model || '',
            tireSize: bookingData.tireBooking.tireDimensions 
              ? `${bookingData.tireBooking.tireDimensions.width}/${bookingData.tireBooking.tireDimensions.height} R${bookingData.tireBooking.tireDimensions.diameter}`
              : (bookingData.tireBooking.selectedTire.dimension || ''),
            tireLoadIndex: bookingData.tireBooking.tireDimensions?.loadIndex || bookingData.tireBooking.selectedTire.loadIndex || '',
            tireSpeedIndex: bookingData.tireBooking.tireDimensions?.speedIndex || bookingData.tireBooking.selectedTire.speedIndex || '',
            tireEAN: bookingData.tireBooking.selectedTire.ean || '',
            tireArticleId: bookingData.tireBooking.selectedTire.articleId || bookingData.tireBooking.selectedTire.article_id || '',
            tireQuantity: bookingData.tireBooking.tireCount || 4,
            tirePurchasePrice: bookingData.tireBooking.selectedTire.pricePerTire || bookingData.tireBooking.selectedTire.totalPrice / (bookingData.tireBooking.tireCount || 4) || 0,  // VK-Preis (für Kunde)
            totalTirePurchasePrice: bookingData.tireBooking.selectedTire.totalPrice || (bookingData.tireBooking.selectedTire.pricePerTire || 0) * (bookingData.tireBooking.tireCount || 4),
            supplierPurchasePrice: bookingData.tireBooking.selectedTire.purchasePrice || bookingData.tireBooking.selectedTire.price || 0,  // Echter EK vom Lieferanten (direkt auf Objekt)
            supplierTotalPurchasePrice: (bookingData.tireBooking.selectedTire.purchasePrice || bookingData.tireBooking.selectedTire.price || 0) * (bookingData.tireBooking.tireCount || 4),
            tireRunFlat: bookingData.tireBooking.selectedTire.runflat || bookingData.tireBooking.selectedTire.isRunFlat || false,
            tire3PMSF: bookingData.tireBooking.selectedTire.winter || bookingData.tireBooking.selectedTire.is3PMSF || false,
          }),
          // MIXED TIRES - Front tire
          ...(bookingData.tireBooking?.isMixedTires && bookingData.tireBooking?.selectedFrontTire && {
            tireBrandFront: bookingData.tireBooking.selectedFrontTire.tire?.brand || '',
            tireModelFront: bookingData.tireBooking.selectedFrontTire.tire?.model || '',
            tireSizeFront: bookingData.tireBooking.tireDimensionsFront
              ? (typeof bookingData.tireBooking.tireDimensionsFront === 'string'
                  ? bookingData.tireBooking.tireDimensionsFront
                  : `${bookingData.tireBooking.tireDimensionsFront.width}/${bookingData.tireBooking.tireDimensionsFront.height} R${bookingData.tireBooking.tireDimensionsFront.diameter}`)
              : (bookingData.tireBooking.selectedFrontTire.tire?.width && bookingData.tireBooking.selectedFrontTire.tire?.diameter
                  ? `${bookingData.tireBooking.selectedFrontTire.tire.width}/${bookingData.tireBooking.selectedFrontTire.tire.height || '00'} ${bookingData.tireBooking.selectedFrontTire.tire.construction || 'R'}${bookingData.tireBooking.selectedFrontTire.tire.diameter}`
                  : (bookingData.tireBooking.selectedFrontTire.tire?.dimension || '')),
            tireLoadIndexFront: (typeof bookingData.tireBooking.tireDimensionsFront !== 'string' && bookingData.tireBooking.tireDimensionsFront?.loadIndex) || bookingData.tireBooking.selectedFrontTire.tire?.loadIndex || '',
            tireSpeedIndexFront: (typeof bookingData.tireBooking.tireDimensionsFront !== 'string' && bookingData.tireBooking.tireDimensionsFront?.speedIndex) || bookingData.tireBooking.selectedFrontTire.tire?.speedIndex || '',
            tireEANFront: bookingData.tireBooking.selectedFrontTire.tire?.ean || '',
            tireArticleIdFront: bookingData.tireBooking.selectedFrontTire.tire?.articleId || bookingData.tireBooking.selectedFrontTire.tire?.article_id || bookingData.tireBooking.selectedFrontTire.tire?.articleNumber || '',
            tireQuantityFront: bookingData.tireBooking.selectedFrontTire.quantity || (bookingData.service?.type === 'MOTORCYCLE_TIRE' ? 1 : 2),
            tirePurchasePriceFront: bookingData.tireBooking.selectedFrontTire.pricePerTire || 0, // VK-Preis (für Kunde)
            totalTirePurchasePriceFront: bookingData.tireBooking.selectedFrontTire.totalPrice || 0, // Gesamt-VK
            supplierPurchasePriceFront: bookingData.tireBooking.selectedFrontTire.tire?.purchasePrice || bookingData.tireBooking.selectedFrontTire.tire?.price || 0, // Echter EK vom Lieferanten
            supplierTotalPurchasePriceFront: (bookingData.tireBooking.selectedFrontTire.tire?.purchasePrice || bookingData.tireBooking.selectedFrontTire.tire?.price || 0) * (bookingData.tireBooking.selectedFrontTire.quantity || 2), // Gesamt echter EK
            tireRunFlatFront: bookingData.tireBooking.selectedFrontTire.tire?.runflat || false,
            tire3PMSFFront: bookingData.tireBooking.selectedFrontTire.tire?.winter || false,
          }),
          // MIXED TIRES - Rear tire
          ...(bookingData.tireBooking?.isMixedTires && bookingData.tireBooking?.selectedRearTire && {
            tireBrandRear: bookingData.tireBooking.selectedRearTire.tire?.brand || '',
            tireModelRear: bookingData.tireBooking.selectedRearTire.tire?.model || '',
            tireSizeRear: bookingData.tireBooking.tireDimensionsRear
              ? (typeof bookingData.tireBooking.tireDimensionsRear === 'string'
                  ? bookingData.tireBooking.tireDimensionsRear
                  : `${bookingData.tireBooking.tireDimensionsRear.width}/${bookingData.tireBooking.tireDimensionsRear.height} R${bookingData.tireBooking.tireDimensionsRear.diameter}`)
              : (bookingData.tireBooking.selectedRearTire.tire?.width && bookingData.tireBooking.selectedRearTire.tire?.diameter
                  ? `${bookingData.tireBooking.selectedRearTire.tire.width}/${bookingData.tireBooking.selectedRearTire.tire.height || '00'} ${bookingData.tireBooking.selectedRearTire.tire.construction || 'R'}${bookingData.tireBooking.selectedRearTire.tire.diameter}`
                  : (bookingData.tireBooking.selectedRearTire.tire?.dimension || '')),
            tireLoadIndexRear: (typeof bookingData.tireBooking.tireDimensionsRear !== 'string' && bookingData.tireBooking.tireDimensionsRear?.loadIndex) || bookingData.tireBooking.selectedRearTire.tire?.loadIndex || '',
            tireSpeedIndexRear: (typeof bookingData.tireBooking.tireDimensionsRear !== 'string' && bookingData.tireBooking.tireDimensionsRear?.speedIndex) || bookingData.tireBooking.selectedRearTire.tire?.speedIndex || '',
            tireEANRear: bookingData.tireBooking.selectedRearTire.tire?.ean || '',
            tireArticleIdRear: bookingData.tireBooking.selectedRearTire.tire?.articleId || bookingData.tireBooking.selectedRearTire.tire?.article_id || bookingData.tireBooking.selectedRearTire.tire?.articleNumber || '',
            tireQuantityRear: bookingData.tireBooking.selectedRearTire.quantity || (bookingData.service?.type === 'MOTORCYCLE_TIRE' ? 1 : 2),
            tirePurchasePriceRear: bookingData.tireBooking.selectedRearTire.pricePerTire || 0, // VK-Preis (für Kunde)
            totalTirePurchasePriceRear: bookingData.tireBooking.selectedRearTire.totalPrice || 0, // Gesamt-VK
            supplierPurchasePriceRear: bookingData.tireBooking.selectedRearTire.tire?.purchasePrice || bookingData.tireBooking.selectedRearTire.tire?.price || 0, // Echter EK vom Lieferanten
            supplierTotalPurchasePriceRear: (bookingData.tireBooking.selectedRearTire.tire?.purchasePrice || bookingData.tireBooking.selectedRearTire.tire?.price || 0) * (bookingData.tireBooking.selectedRearTire.quantity || 2), // Gesamt echter EK
            tireRunFlatRear: bookingData.tireBooking.selectedRearTire.tire?.runflat || false,
            tire3PMSFRear: bookingData.tireBooking.selectedRearTire.tire?.winter || false,
          }),
          // Customer notes
          ...(customerNotes.trim() && { customerNotes: customerNotes.trim().slice(0, 500) }),
        })
      })

      const reserveData = await reserveResponse.json()
      
      if (!reserveResponse.ok) {
        alert(reserveData.error || 'Fehler bei der Reservierung. Der Termin könnte bereits gebucht sein.')
        return
      }

      console.log('[PAYMENT] Reservation created:', reserveData.reservationId, 'expires at:', reserveData.expiresAt)
      
      // STEP 2: Proceed with payment via STRIPE
      // ALL PAYMENT METHODS now run through Stripe (card, sofort, amazon_pay, klarna, paypal)
      {
        // Stripe Checkout Session for all payment methods
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
            paymentMethodType: method === 'ideal_wero' ? 'ideal' : method,
            totalPrice: bookingData.pricing.totalPrice,
            basePrice: bookingData.pricing.basePrice || bookingData.pricing.servicePrice || bookingData.pricing.totalPrice,
            balancingPrice: bookingData.pricing.balancingPrice || 0,
            storagePrice: bookingData.pricing.storagePrice || 0,
            disposalFee: bookingData.pricing.disposalPrice || bookingData.pricing.disposalFee || 0,
            runFlatSurcharge: bookingData.pricing.runflatPrice || bookingData.pricing.runFlatSurcharge || 0,
            hasBalancing: bookingData.additionalServices?.some((s: any) => s.type === 'BALANCING') || false,
            hasStorage: bookingData.additionalServices?.some((s: any) => s.type === 'STORAGE') || false,
            hasDisposal: (bookingData.service.type === 'TIRE_CHANGE' || bookingData.service.type === 'MOTORCYCLE_TIRE') ? (bookingData.tireBooking?.hasDisposal || bookingData.additionalServices?.some((s: any) => s.type === 'DISPOSAL') || false) : false,
            workshopName: workshop.name,
            serviceName: getServiceDisplayName(),
          vehicleInfo: `${bookingData.vehicle.make} ${bookingData.vehicle.model}`,
            // TIRE DATA - Standard tires
            ...(bookingData.tireBooking?.selectedTire && {
              tireBrand: bookingData.tireBooking.selectedTire.brand || '',
              tireModel: bookingData.tireBooking.selectedTire.model || '',
              tireSize: bookingData.tireBooking.tireDimensions 
                ? `${bookingData.tireBooking.tireDimensions.width}/${bookingData.tireBooking.tireDimensions.height} R${bookingData.tireBooking.tireDimensions.diameter}`
                : (bookingData.tireBooking.selectedTire.dimension || ''),
              tireLoadIndex: bookingData.tireBooking.tireDimensions?.loadIndex || bookingData.tireBooking.selectedTire.loadIndex || '',
              tireSpeedIndex: bookingData.tireBooking.tireDimensions?.speedIndex || bookingData.tireBooking.selectedTire.speedIndex || '',
              tireEAN: bookingData.tireBooking.selectedTire.ean || '',
              tireArticleId: bookingData.tireBooking.selectedTire.articleId || bookingData.tireBooking.selectedTire.article_id || bookingData.tireBooking.selectedTire.articleNumber || '',
              tireQuantity: bookingData.tireBooking.tireCount || 4,
              tirePurchasePrice: bookingData.tireBooking.selectedTire.pricePerTire || bookingData.tireBooking.selectedTire.totalPrice / (bookingData.tireBooking.tireCount || 4) || 0,  // VK-Preis
              totalTirePurchasePrice: bookingData.tireBooking.selectedTire.totalPrice || (bookingData.tireBooking.selectedTire.pricePerTire || 0) * (bookingData.tireBooking.tireCount || 4),
              supplierPurchasePrice: bookingData.tireBooking.selectedTire.purchasePrice || bookingData.tireBooking.selectedTire.price || 0,  // Echter EK vom Lieferanten (direkt auf Objekt)
              supplierTotalPurchasePrice: (bookingData.tireBooking.selectedTire.purchasePrice || bookingData.tireBooking.selectedTire.price || 0) * (bookingData.tireBooking.tireCount || 4),
              tireRunFlat: bookingData.tireBooking.selectedTire.runflat || bookingData.tireBooking.selectedTire.isRunFlat || false,
              tire3PMSF: bookingData.tireBooking.selectedTire.winter || bookingData.tireBooking.selectedTire.is3PMSF || false,
            }),
            // MIXED TIRES - Front tire
            ...(bookingData.tireBooking?.isMixedTires && bookingData.tireBooking?.selectedFrontTire && {
              tireBrandFront: bookingData.tireBooking.selectedFrontTire.tire?.brand || '',
              tireModelFront: bookingData.tireBooking.selectedFrontTire.tire?.model || '',
              tireSizeFront: bookingData.tireBooking.tireDimensionsFront
                ? (typeof bookingData.tireBooking.tireDimensionsFront === 'string'
                    ? bookingData.tireBooking.tireDimensionsFront
                    : `${bookingData.tireBooking.tireDimensionsFront.width}/${bookingData.tireBooking.tireDimensionsFront.height} R${bookingData.tireBooking.tireDimensionsFront.diameter}`)
                : (bookingData.tireBooking.selectedFrontTire.tire?.width && bookingData.tireBooking.selectedFrontTire.tire?.diameter
                    ? `${bookingData.tireBooking.selectedFrontTire.tire.width}/${bookingData.tireBooking.selectedFrontTire.tire.height || '00'} ${bookingData.tireBooking.selectedFrontTire.tire.construction || 'R'}${bookingData.tireBooking.selectedFrontTire.tire.diameter}`
                    : (bookingData.tireBooking.selectedFrontTire.tire?.dimension || '')),
              tireLoadIndexFront: (typeof bookingData.tireBooking.tireDimensionsFront !== 'string' && bookingData.tireBooking.tireDimensionsFront?.loadIndex) || bookingData.tireBooking.selectedFrontTire.tire?.loadIndex || '',
              tireSpeedIndexFront: (typeof bookingData.tireBooking.tireDimensionsFront !== 'string' && bookingData.tireBooking.tireDimensionsFront?.speedIndex) || bookingData.tireBooking.selectedFrontTire.tire?.speedIndex || '',
              tireEANFront: bookingData.tireBooking.selectedFrontTire.tire?.ean || '',
              tireArticleIdFront: bookingData.tireBooking.selectedFrontTire.tire?.articleId || bookingData.tireBooking.selectedFrontTire.tire?.article_id || bookingData.tireBooking.selectedFrontTire.tire?.articleNumber || '',
              tireQuantityFront: bookingData.tireBooking.selectedFrontTire.quantity || 2,
              tirePurchasePriceFront: bookingData.tireBooking.selectedFrontTire.pricePerTire || 0,
              totalTirePurchasePriceFront: bookingData.tireBooking.selectedFrontTire.totalPrice || 0,
              supplierPurchasePriceFront: bookingData.tireBooking.selectedFrontTire.tire?.purchasePrice || bookingData.tireBooking.selectedFrontTire.tire?.price || 0,
              supplierTotalPurchasePriceFront: (bookingData.tireBooking.selectedFrontTire.tire?.purchasePrice || bookingData.tireBooking.selectedFrontTire.tire?.price || 0) * (bookingData.tireBooking.selectedFrontTire.quantity || 2),
              tireRunFlatFront: bookingData.tireBooking.selectedFrontTire.tire?.runflat || false,
              tire3PMSFFront: bookingData.tireBooking.selectedFrontTire.tire?.winter || false,
            }),
            // MIXED TIRES - Rear tire
            ...(bookingData.tireBooking?.isMixedTires && bookingData.tireBooking?.selectedRearTire && {
              tireBrandRear: bookingData.tireBooking.selectedRearTire.tire?.brand || '',
              tireModelRear: bookingData.tireBooking.selectedRearTire.tire?.model || '',
              tireSizeRear: bookingData.tireBooking.tireDimensionsRear
                ? (typeof bookingData.tireBooking.tireDimensionsRear === 'string'
                    ? bookingData.tireBooking.tireDimensionsRear
                    : `${bookingData.tireBooking.tireDimensionsRear.width}/${bookingData.tireBooking.tireDimensionsRear.height} R${bookingData.tireBooking.tireDimensionsRear.diameter}`)
                : (bookingData.tireBooking.selectedRearTire.tire?.width && bookingData.tireBooking.selectedRearTire.tire?.diameter
                    ? `${bookingData.tireBooking.selectedRearTire.tire.width}/${bookingData.tireBooking.selectedRearTire.tire.height || '00'} ${bookingData.tireBooking.selectedRearTire.tire.construction || 'R'}${bookingData.tireBooking.selectedRearTire.tire.diameter}`
                    : (bookingData.tireBooking.selectedRearTire.tire?.dimension || '')),
              tireLoadIndexRear: (typeof bookingData.tireBooking.tireDimensionsRear !== 'string' && bookingData.tireBooking.tireDimensionsRear?.loadIndex) || bookingData.tireBooking.selectedRearTire.tire?.loadIndex || '',
              tireSpeedIndexRear: (typeof bookingData.tireBooking.tireDimensionsRear !== 'string' && bookingData.tireBooking.tireDimensionsRear?.speedIndex) || bookingData.tireBooking.selectedRearTire.tire?.speedIndex || '',
              tireEANRear: bookingData.tireBooking.selectedRearTire.tire?.ean || '',
              tireArticleIdRear: bookingData.tireBooking.selectedRearTire.tire?.articleId || bookingData.tireBooking.selectedRearTire.tire?.article_id || bookingData.tireBooking.selectedRearTire.tire?.articleNumber || '',
              tireQuantityRear: bookingData.tireBooking.selectedRearTire.quantity || 2,
              tirePurchasePriceRear: bookingData.tireBooking.selectedRearTire.pricePerTire || 0,
              totalTirePurchasePriceRear: bookingData.tireBooking.selectedRearTire.totalPrice || 0,
              supplierPurchasePriceRear: bookingData.tireBooking.selectedRearTire.tire?.purchasePrice || bookingData.tireBooking.selectedRearTire.tire?.price || 0,
              supplierTotalPurchasePriceRear: (bookingData.tireBooking.selectedRearTire.tire?.purchasePrice || bookingData.tireBooking.selectedRearTire.tire?.price || 0) * (bookingData.tireBooking.selectedRearTire.quantity || 2),
              tireRunFlatRear: bookingData.tireBooking.selectedRearTire.tire?.runflat || false,
              tire3PMSFRear: bookingData.tireBooking.selectedRearTire.tire?.winter || false,
            }),
            paymentMethodType: method === 'ideal_wero' ? 'ideal' : method,
            reservationId: reserveData.reservationId,
            // Customer notes
            ...(customerNotes.trim() && { customerNotes: customerNotes.trim().slice(0, 500) }),
            // Coupon data (if applied)
            ...(appliedCoupon && {
              couponId: appliedCoupon.id,
              couponCode: appliedCoupon.code,
              discountAmount: discount,
              originalPrice: subtotal,
              costBearer: appliedCoupon.costBearer || 'PLATFORM',
            }),
            // Override totalPrice if coupon applied
            ...(appliedCoupon && { totalPrice: totalPrice }),
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
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, amount: bookingData.pricing.totalPrice })
      })
      const data = await response.json()

      if (data.valid && data.coupon) {
        setAppliedCoupon({
          id: data.coupon.id,
          code: data.coupon.code,
          type: data.coupon.type,
          value: data.coupon.value,
          discountAmount: data.coupon.discountAmount,
          description: data.coupon.description,
          costBearer: data.coupon.costBearer || 'PLATFORM'
        })
        setCouponError('')
      } else {
        setCouponError(data.error || 'Ungültiger Gutscheincode')
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
    ? appliedCoupon.discountAmount || (
        appliedCoupon.type === 'percentage' 
          ? Math.round(subtotal * (appliedCoupon.value / 100))
          : appliedCoupon.value
      )
    : 0
  const totalPrice = subtotal - discount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-primary-600 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src="/logos/B24_Logo_weiss.png" alt="Bereifung24" width={160} height={40} className="h-10 w-auto object-contain" />
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
                        alt={`Werkstatt ${bookingData.workshop.name} in ${bookingData.workshop.city}`}
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
                  {/* Hauptservice */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-lg text-primary-900">
                      {bookingData.service.type === 'MOTORCYCLE_TIRE'
                        ? `Motorradreifenmontage${bookingData.tireBooking?.isMixedTires ? ' (Vorder- & Hinterreifen)' : ''}`
                        : bookingData.service.type === 'TIRE_CHANGE' && bookingData.tireBooking?.tireCount
                          ? `Reifenwechsel für ${bookingData.tireBooking.tireCount} Reifen`
                          : getServiceDisplayName()
                      }
                    </p>
                    <p className="font-semibold text-primary-900">
                      {formatPrice(bookingData.pricing.servicePrice)}
                    </p>
                  </div>

                  {/* Entsorgung */}
                  {bookingData.tireBooking?.hasDisposal && (bookingData.pricing.disposalPrice || bookingData.tireBooking?.disposalPrice || 0) > 0 && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-primary-800">+ Reifenentsorgung</span>
                      <span className="font-medium text-primary-900">{formatPrice(bookingData.pricing.disposalPrice || bookingData.tireBooking?.disposalPrice || 0)}</span>
                    </div>
                  )}

                  {/* Runflat-Zuschlag */}
                  {bookingData.tireBooking?.hasRunflat && (bookingData.pricing.runflatPrice || bookingData.tireBooking?.runflatPrice || 0) > 0 && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-primary-800">+ Runflat-Zuschlag</span>
                      <span className="font-medium text-primary-900">{formatPrice(bookingData.pricing.runflatPrice || bookingData.tireBooking?.runflatPrice || 0)}</span>
                    </div>
                  )}

                  {/* Zusatzleistungen */}
                  {bookingData.additionalServices && bookingData.additionalServices.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-primary-200">
                      <p className="text-sm font-medium text-primary-800 mb-2">Zusatzleistungen:</p>
                      {bookingData.additionalServices.map((service: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm text-primary-700 mb-1">
                          <span>{((service.serviceName || service.name || service.packageName) || '').replace(/^Mit /, '')}{service.packageName && service.packageName !== (service.serviceName || service.name) ? ` (${service.packageName})` : ''}</span>
                          <span className="font-medium">{formatPrice(service.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tire Info (for TIRE_CHANGE and MOTORCYCLE_TIRE services, including mixed tires) */}
              {(bookingData.service.type === 'TIRE_CHANGE' || bookingData.service.type === 'MOTORCYCLE_TIRE') && (bookingData.tireBooking?.selectedTire || bookingData.tireBooking?.selectedFrontTire || bookingData.tireBooking?.selectedRearTire) && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Reifen</h3>
                  
                  {/* Check if mixed tires (front and rear) */}
                  {bookingData.tireBooking?.isMixedTires && (bookingData.tireBooking?.selectedFrontTire || bookingData.tireBooking?.selectedRearTire) ? (
                    <div className="space-y-3">
                      {/* Front Tires */}
                      {bookingData.tireBooking?.selectedFrontTire && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs text-primary-600 font-medium mb-1">
                                🔹 Vorderachse
                              </p>
                              <p className="font-bold text-gray-900">
                                {bookingData.tireBooking.selectedFrontTire.quantity || (bookingData.service.type === 'MOTORCYCLE_TIRE' ? 1 : 2)}× {bookingData.tireBooking.selectedFrontTire.tire?.brand || bookingData.tireBooking.selectedFrontTire.brand}
                                {(bookingData.tireBooking.selectedFrontTire.tire?.model || bookingData.tireBooking.selectedFrontTire.model) && ` ${bookingData.tireBooking.selectedFrontTire.tire?.model || bookingData.tireBooking.selectedFrontTire.model}`}
                                {/* Dimension */}
                                {(bookingData.tireBooking.tireDimensionsFront || bookingData.tireBooking.selectedFrontTire.dimension) && (
                                  <span>
                                    {' '}
                                    {bookingData.tireBooking.tireDimensionsFront 
                                      ? (typeof bookingData.tireBooking.tireDimensionsFront === 'string'
                                          ? bookingData.tireBooking.tireDimensionsFront
                                          : `${bookingData.tireBooking.tireDimensionsFront.width}/${bookingData.tireBooking.tireDimensionsFront.height} R${bookingData.tireBooking.tireDimensionsFront.diameter}`)
                                      : bookingData.tireBooking.selectedFrontTire.dimension
                                    }
                                  </span>
                                )}
                                {/* Load and Speed Index */}
                                {((typeof bookingData.tireBooking.tireDimensionsFront !== 'string' && bookingData.tireBooking.tireDimensionsFront?.loadIndex) || bookingData.tireBooking.selectedFrontTire.tire?.loadIndex || bookingData.tireBooking.selectedFrontTire.loadIndex ||
                                  (typeof bookingData.tireBooking.tireDimensionsFront !== 'string' && bookingData.tireBooking.tireDimensionsFront?.speedIndex) || bookingData.tireBooking.selectedFrontTire.tire?.speedIndex || bookingData.tireBooking.selectedFrontTire.speedIndex) && (
                                  <span>
                                    {' '}
                                    {(typeof bookingData.tireBooking.tireDimensionsFront !== 'string' && bookingData.tireBooking.tireDimensionsFront?.loadIndex) || bookingData.tireBooking.selectedFrontTire.tire?.loadIndex || bookingData.tireBooking.selectedFrontTire.loadIndex || ''}
                                    {(typeof bookingData.tireBooking.tireDimensionsFront !== 'string' && bookingData.tireBooking.tireDimensionsFront?.speedIndex) || bookingData.tireBooking.selectedFrontTire.tire?.speedIndex || bookingData.tireBooking.selectedFrontTire.speedIndex || ''}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {bookingData.tireBooking.selectedFrontTire.quantity || (bookingData.service.type === 'MOTORCYCLE_TIRE' ? 1 : 2)}× à {formatPrice(bookingData.tireBooking.selectedFrontTire.pricePerTire || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Rear Tires */}
                      {bookingData.tireBooking?.selectedRearTire && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs text-primary-600 font-medium mb-1">
                                🔸 Hinterachse
                              </p>
                              <p className="font-bold text-gray-900">
                                {bookingData.tireBooking.selectedRearTire.quantity || (bookingData.service.type === 'MOTORCYCLE_TIRE' ? 1 : 2)}× {bookingData.tireBooking.selectedRearTire.tire?.brand || bookingData.tireBooking.selectedRearTire.brand}
                                {(bookingData.tireBooking.selectedRearTire.tire?.model || bookingData.tireBooking.selectedRearTire.model) && ` ${bookingData.tireBooking.selectedRearTire.tire?.model || bookingData.tireBooking.selectedRearTire.model}`}
                                {/* Dimension */}
                                {(bookingData.tireBooking.tireDimensionsRear || bookingData.tireBooking.selectedRearTire.dimension) && (
                                  <span>
                                    {' '}
                                    {bookingData.tireBooking.tireDimensionsRear 
                                      ? (typeof bookingData.tireBooking.tireDimensionsRear === 'string'
                                          ? bookingData.tireBooking.tireDimensionsRear
                                          : `${bookingData.tireBooking.tireDimensionsRear.width}/${bookingData.tireBooking.tireDimensionsRear.height} R${bookingData.tireBooking.tireDimensionsRear.diameter}`)
                                      : bookingData.tireBooking.selectedRearTire.dimension
                                    }
                                  </span>
                                )}
                                {/* Load and Speed Index */}
                                {((typeof bookingData.tireBooking.tireDimensionsRear !== 'string' && bookingData.tireBooking.tireDimensionsRear?.loadIndex) || bookingData.tireBooking.selectedRearTire.tire?.loadIndex || bookingData.tireBooking.selectedRearTire.loadIndex ||
                                  (typeof bookingData.tireBooking.tireDimensionsRear !== 'string' && bookingData.tireBooking.tireDimensionsRear?.speedIndex) || bookingData.tireBooking.selectedRearTire.tire?.speedIndex || bookingData.tireBooking.selectedRearTire.speedIndex) && (
                                  <span>
                                    {' '}
                                    {(typeof bookingData.tireBooking.tireDimensionsRear !== 'string' && bookingData.tireBooking.tireDimensionsRear?.loadIndex) || bookingData.tireBooking.selectedRearTire.tire?.loadIndex || bookingData.tireBooking.selectedRearTire.loadIndex || ''}
                                    {(typeof bookingData.tireBooking.tireDimensionsRear !== 'string' && bookingData.tireBooking.tireDimensionsRear?.speedIndex) || bookingData.tireBooking.selectedRearTire.tire?.speedIndex || bookingData.tireBooking.selectedRearTire.speedIndex || ''}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {bookingData.tireBooking.selectedRearTire.quantity || (bookingData.service.type === 'MOTORCYCLE_TIRE' ? 1 : 2)}× à {formatPrice(bookingData.tireBooking.selectedRearTire.pricePerTire || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Total Price for Mixed Tires */}
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-primary-900">Reifen Gesamt</span>
                          <span className="font-bold text-lg text-primary-900">{formatPrice(bookingData.pricing.tirePrice)}</span>
                        </div>
                      </div>
                    </div>
                  ) : bookingData.tireBooking?.selectedTire && (
                    /* Standard tires (not mixed) */
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
                  )}
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
                      {bookingData.service.type === 'MOTORCYCLE_TIRE'
                        ? 'Motorradreifenmontage'
                        : bookingData.service.type === 'TIRE_CHANGE' && bookingData.tireBooking?.tireCount
                          ? `Reifenwechsel für ${bookingData.tireBooking.tireCount} Reifen`
                          : getServiceDisplayName()
                      }
                    </span>
                    <span className="font-semibold">{formatPrice(bookingData.pricing.servicePrice)}</span>
                  </div>
                  
                  {/* Additional Services */}
                  {bookingData.additionalServices && bookingData.additionalServices.length > 0 && (
                    bookingData.additionalServices.map((service: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{(() => { const sn = (service.serviceName || service.name || '').replace(/^Mit /, ''); const pn = service.packageName; return pn && pn !== sn ? `${sn} (${pn})` : sn; })()}</span>
                        <span className="font-medium">{formatPrice(service.price)}</span>
                      </div>
                    ))
                  )}
                  
                  {/* Tire Price - For TIRE_CHANGE and MOTORCYCLE_TIRE (including mixed tires) */}
                  {(bookingData.service.type === 'TIRE_CHANGE' || bookingData.service.type === 'MOTORCYCLE_TIRE') && (bookingData.tireBooking?.selectedTire || bookingData.tireBooking?.selectedFrontTire || bookingData.tireBooking?.selectedRearTire) && bookingData.pricing.tirePrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {bookingData.tireBooking.tireCount || bookingData.tireBooking.selectedTire?.quantity || 4}× Reifen
                      </span>
                      <span className="font-semibold">{formatPrice(bookingData.pricing.tirePrice)}</span>
                    </div>
                  )}
                  
                  {/* Disposal Fee - Check both locations for backwards compatibility */}
                  {bookingData.tireBooking?.hasDisposal && (bookingData.pricing.disposalPrice || bookingData.tireBooking?.disposalPrice || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">+ Reifenentsorgung</span>
                      <span className="font-semibold">{formatPrice(bookingData.pricing.disposalPrice || bookingData.tireBooking?.disposalPrice || 0)}</span>
                    </div>
                  )}
                  
                  {/* Runflat Surcharge - Check both locations for backwards compatibility */}
                  {bookingData.tireBooking?.hasRunflat && (bookingData.pricing.runflatPrice || bookingData.tireBooking?.runflatPrice || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">+ Runflat-Zuschlag</span>
                      <span className="font-semibold">{formatPrice(bookingData.pricing.runflatPrice || bookingData.tireBooking?.runflatPrice || 0)}</span>
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
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Image src="/logos/mastercard.png" alt="Mastercard" width={40} height={28} className="h-7 w-auto" />
                          <Image src="/logos/visa.png" alt="Visa" width={40} height={28} className="h-5 w-auto" />
                          <Image src="/logos/amex.png" alt="Amex" width={40} height={28} className="h-5 w-auto" />
                        </div>
                        <span className="font-semibold text-gray-900">Kreditkarte</span>
                      </div>
                      {selectedPaymentMethod === 'card' && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>

                  {/* Klarna */}
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
                      <div className="flex items-center gap-3">
                        <Image src="/payment-logos/klarna-logo.png" alt="Klarna" width={60} height={28} className="h-7 w-auto" />
                        <span className="font-semibold text-gray-900">Klarna</span>
                      </div>
                      {selectedPaymentMethod === 'klarna' && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                  )}

                  {/* iDEAL / Wero */}
                  <button
                    onClick={() => setSelectedPaymentMethod('ideal_wero')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentMethod === 'ideal_wero'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image src="/payment-logos/ideal-wero.png" alt="iDEAL / Wero" width={40} height={28} className="h-6 w-auto" />
                        <span className="font-semibold text-gray-900">iDEAL | Wero</span>
                      </div>
                      {selectedPaymentMethod === 'ideal_wero' && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>

                  {/* EPS */}
                  <button
                    onClick={() => setSelectedPaymentMethod('eps')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentMethod === 'eps'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image src="/payment-logos/eps.png" alt="EPS" width={40} height={28} className="h-6 w-auto" />
                        <span className="font-semibold text-gray-900">EPS</span>
                      </div>
                      {selectedPaymentMethod === 'eps' && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>

                  {/* Amazon Pay */}
                  <button
                    onClick={() => setSelectedPaymentMethod('amazon_pay')}
                    disabled={processing}
                    className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPaymentMethod === 'amazon_pay'
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image src="/payment-logos/amazonpay-logo.png" alt="Amazon Pay" width={60} height={28} className="h-6 w-auto" />
                        <span className="font-semibold text-gray-900">Amazon Pay</span>
                      </div>
                      {selectedPaymentMethod === 'amazon_pay' && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>

                  {/* Google Pay */}
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
                      <div className="flex items-center gap-3">
                        <Image src="/payment-logos/google-pay.png" alt="Google Pay" width={40} height={28} className="h-6 w-auto" />
                        <span className="font-semibold text-gray-900">Google Pay</span>
                      </div>
                      <p className="text-xs text-gray-500">via Kreditkarte</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Customer Notes */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nachricht an die Werkstatt <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={3}
                  placeholder="z.B. Felgenschloss liegt im Kofferraum, Bitte Reifendruck prüfen..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{customerNotes.length}/500</p>
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
