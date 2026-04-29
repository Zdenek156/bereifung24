import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildVehicleSnapshot } from '@/lib/vehicle-snapshot'

/**
 * POST /api/customer/direct-booking/reserve
 * Reserve a time slot temporarily (10 minutes) during payment
 * 
 * Body:
 * {
 *   workshopId: string,
 *   vehicleId: string,
 *   serviceType: string,
 *   date: string (YYYY-MM-DD),
 *   time: string (HH:MM),
 *   hasBalancing: boolean,
 *   hasStorage: boolean,
 *   totalPrice: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      workshopId,
      vehicleId,
      serviceType,
      date,
      time,
      basePrice,
      balancingPrice,
      storagePrice,
      washingPrice,
      disposalFee,
      runFlatSurcharge,
      hasBalancing,
      hasStorage,
      hasWashing,
      hasDisposal,
      totalPrice,
      // Additional services data (Klimaservice, Achsvermessung, etc.)
      additionalServicesData,
      // Service subtype (e.g. 'foreign_object', 'valve_damage' for TIRE_REPAIR)
      serviceSubtype,
      // Base service duration from workshop service package
      baseDuration,
      // Standard Tire data
      tireBrand,
      tireModel,
      tireSize,
      tireLoadIndex,
      tireSpeedIndex,
      tireEAN,
      tireArticleId,
      tireQuantity,
      tirePurchasePrice,            // VK-Preis (für Standard-Reifen)
      totalTirePurchasePrice,       // Gesamt-VK (für Standard-Reifen)
      supplierPurchasePrice,        // Echter EK vom Lieferanten (Standard-Reifen)
      supplierTotalPurchasePrice,   // Gesamt echter EK (Standard-Reifen)
      tireRunFlat,
      tire3PMSF,
      // Mixed Tires - Front
      tireBrandFront,
      tireModelFront,
      tireSizeFront,
      tireLoadIndexFront,
      tireSpeedIndexFront,
      tireEANFront,
      tireArticleIdFront,
      tireQuantityFront,
      tirePurchasePriceFront,      // VK-Preis pro Reifen
      totalTirePurchasePriceFront,  // Gesamt-VK
      supplierPurchasePriceFront,   // Echter EK vom Lieferanten
      supplierTotalPurchasePriceFront, // Gesamt echter EK
      tireRunFlatFront,
      tire3PMSFFront,
      // Mixed Tires - Rear
      tireBrandRear,
      tireModelRear,
      tireSizeRear,
      tireLoadIndexRear,
      tireSpeedIndexRear,
      tireEANRear,
      tireArticleIdRear,
      tireQuantityRear,
      tirePurchasePriceRear,        // VK-Preis pro Reifen
      totalTirePurchasePriceRear,   // Gesamt-VK
      supplierPurchasePriceRear,    // Echter EK vom Lieferanten
      supplierTotalPurchasePriceRear,  // Gesamt echter EK
      tireRunFlatRear,
      tire3PMSFRear,
      // Storage: explicit link from TireStorageCard
      fromStorageBookingId: explicitFromStorageBookingId,
      // Customer notes
      customerNotes
    } = body

    // Check if mixed tires
    const hasMixedTires = !!(tireBrandFront || tireBrandRear)
    console.log('[RESERVE] Tire data received:', {
      hasStandardTires: !!tireBrand,
      hasMixedTires,
      tireBrand,
      tireBrandFront,
      tireBrandRear
    })

    if (!workshopId || !vehicleId || !serviceType || !date || !time || totalPrice === undefined) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      )
    }

    // Validate user has complete profile (address required for booking)
    const bookingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { street: true, zipCode: true, city: true }
    })
    if (!bookingUser || !bookingUser.street?.trim() || !bookingUser.zipCode?.trim() || !bookingUser.city?.trim()) {
      console.log('[RESERVE] ❌ Incomplete profile - missing address')
      return NextResponse.json(
        { error: 'Bitte vervollständigen Sie Ihr Profil (Adresse) bevor Sie buchen können.' },
        { status: 400 }
      )
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if slot is still available
    // WORKAROUND: @db.Date fields don't support direct equality in Prisma
    const dateOnly = date // Already in YYYY-MM-DD format from frontend
    
    // FIRST: Delete expired reservations (older than 10 minutes)
    const now = new Date()
    const deleteResult = await prisma.directBooking.deleteMany({
      where: {
        status: 'RESERVED',
        reservedUntil: {
          lt: now // Less than now = expired
        }
      }
    })

    console.log(`🧹 [RESERVE] Deleted ${deleteResult.count} expired reservations`)
    
    // SECOND: Delete user's own RESERVED bookings for this exact time slot
    // This allows users to retry payment if they cancelled the previous attempt
    const userExistingReservation = await prisma.directBooking.findMany({
      where: {
        customerId: customer.id,
        workshopId,
        status: 'RESERVED'
      },
      select: {
        id: true,
        date: true,
        time: true
      }
    })
    
    const userReservationToDelete = userExistingReservation.find(booking => {
      const bookingDateStr = `${booking.date.getFullYear()}-${String(booking.date.getMonth() + 1).padStart(2, '0')}-${String(booking.date.getDate()).padStart(2, '0')}`
      return bookingDateStr === dateOnly && booking.time === time
    })
    
    if (userReservationToDelete) {
      await prisma.directBooking.delete({
        where: { id: userReservationToDelete.id }
      })
      console.log(`♻️ [RESERVE] Deleted user's previous reservation for retry: ${userReservationToDelete.id}`)
    }
    
    // THEN: Fetch all bookings for this workshop and filter in code
    // NOTE: Can't use status: { in: [...] } because Prisma doesn't support it for String fields
    const allBookings = await prisma.directBooking.findMany({
      where: {
        workshopId
      },
      select: {
        id: true,
        date: true,
        time: true,
        status: true,
        reservedUntil: true
      }
    })
    
    // Filter for matching date, time AND active status (RESERVED or CONFIRMED)
    // For RESERVED status, also check if not expired
    const existingReservation = allBookings.find(booking => {
      // Format date in Europe/Berlin timezone for comparison
      const bookingDateStr = `${booking.date.getFullYear()}-${String(booking.date.getMonth() + 1).padStart(2, '0')}-${String(booking.date.getDate()).padStart(2, '0')}`
      
      if (bookingDateStr !== dateOnly || booking.time !== time) {
        return false // Different date or time
      }
      
      if (booking.status === 'CONFIRMED') {
        return true // Confirmed bookings always block the slot
      }
      
      if (booking.status === 'RESERVED') {
        // Check if reservation is still valid (not expired)
        return booking.reservedUntil && booking.reservedUntil > now
      }
      
      return false
    })

    if (existingReservation) {
      console.log('[RESERVE] Slot already taken:', { date: dateOnly, time, status: existingReservation.status })
      return NextResponse.json(
        { error: 'Dieser Termin wurde gerade gebucht. Bitte wählen Sie einen anderen.' },
        { status: 409 }
      )
    }

    // Auto-detect stored tires: If customer books WHEEL_CHANGE at a workshop where they have stored tires
    // IMPORTANT: Must match vehicleId to prevent cross-vehicle detection
    // (e.g. Mercedes tires should NOT auto-link when booking for Skoda)
    // Skip for TIRE_CHANGE "Nur Montage" (no tire purchase) — customer brings own tires
    let fromStorageBookingId = explicitFromStorageBookingId || null
    const hasTirePurchaseData = !!(tireBrand || (body.hasMixedTires && (body.tireBrandFront || body.tireBrandRear)))
    const shouldCheckStorage = serviceType === 'WHEEL_CHANGE' || (serviceType === 'TIRE_CHANGE' && hasTirePurchaseData)
    if (!fromStorageBookingId && shouldCheckStorage) {
      try {
        const storageBooking = await prisma.directBooking.findFirst({
          where: {
            customerId: customer.id,
            workshopId,
            vehicleId, // Only match tires stored for the SAME vehicle
            hasStorage: true,
            status: { in: ['COMPLETED', 'CONFIRMED'] }
          },
          orderBy: { date: 'desc' },
          select: { id: true }
        })
        if (storageBooking) {
          fromStorageBookingId = storageBooking.id
          console.log('📦 [RESERVE] Auto-detected stored tires for same vehicle:', fromStorageBookingId)
        }
      } catch (err) {
        console.error('[RESERVE] Error checking stored tires:', err)
      }
    }

    // Look up balancingMinutes from the workshop service for duration calculation
    let balancingMinutesPerWheel = 0
    if (hasBalancing && serviceType === 'WHEEL_CHANGE') {
      try {
        const workshopService = await prisma.workshopService.findFirst({
          where: { workshopId, serviceType },
          select: { balancingMinutes: true }
        })
        if (workshopService?.balancingMinutes) {
          balancingMinutesPerWheel = workshopService.balancingMinutes
          console.log(`⏱️ [RESERVE] Balancing time: ${balancingMinutesPerWheel} min/wheel × ${tireQuantity || 4} wheels = ${balancingMinutesPerWheel * (tireQuantity || 4)} min`)
        }
      } catch (err) {
        console.error('[RESERVE] Error looking up balancingMinutes:', err)
      }
    }

    // Create temporary reservation (expires in 10 minutes)
    // 
    // IMPORTANT: date field stores the booking date as YYYY-MM-DD without timezone conversion
    // User selects "2026-03-13" → Store as UTC timestamp "2026-03-13T00:00:00Z"
    // This way the DATE always matches what user selected, regardless of timezone
    // The appointmentDateTime (date + time) will handle Berlin timezone conversion separately
    const berlinMidnight = new Date(`${dateOnly}T00:00:00Z`) // Parse as UTC midnight
    
    console.log('[RESERVE] Date storage:', {
      user_selected: dateOnly,
      stored_utc: berlinMidnight.toISOString(),
      will_display_as: berlinMidnight.toISOString().split('T')[0]
    })
    
    const vehicleSnapshot = await buildVehicleSnapshot(vehicleId)

    const reservation = await prisma.directBooking.create({
      data: {
        customerId: customer.id,
        workshopId,
        vehicleId,
        ...(vehicleSnapshot ? { vehicleSnapshot } : {}),
        serviceType,
        serviceSubtype: serviceSubtype || null,
        additionalServicesData: additionalServicesData && additionalServicesData.length > 0 ? additionalServicesData : null,
        date: berlinMidnight,
        time,
        durationMinutes: (() => {
          let dur = baseDuration || 60 // Use actual workshop service duration
          // Add balancing time (per wheel × number of wheels) for WHEEL_CHANGE
          if (hasBalancing && balancingMinutesPerWheel > 0) {
            dur += balancingMinutesPerWheel * (tireQuantity || 4)
          }
          if (additionalServicesData && Array.isArray(additionalServicesData)) {
            for (const svc of additionalServicesData) {
              dur += (svc.duration || 0)
            }
          }
          return dur
        })(),
        basePrice: basePrice || 0,
        balancingPrice: balancingPrice || 0,
        storagePrice: storagePrice || 0,
        washingPrice: washingPrice || 0,
        disposalFee: disposalFee || 0,
        runFlatSurcharge: runFlatSurcharge || 0,
        hasBalancing: hasBalancing || false,
        hasStorage: hasStorage || false,
        hasWashing: hasWashing || false,
        hasDisposal: (hasDisposal && (serviceType === 'TIRE_CHANGE' || serviceType === 'MOTORCYCLE_TIRE')) || false,
        totalPrice,
        // Save tire data in standard fields (works for standard tires AND front tire of mixed tires)
        tireBrand: hasMixedTires ? (tireBrandFront || null) : (tireBrand || null),
        tireModel: hasMixedTires ? (tireModelFront || null) : (tireModel || null),
        tireSize: hasMixedTires ? (tireSizeFront || null) : (tireSize || null),
        tireLoadIndex: hasMixedTires ? (tireLoadIndexFront || null) : (tireLoadIndex || null),
        tireSpeedIndex: hasMixedTires ? (tireSpeedIndexFront || null) : (tireSpeedIndex || null),
        tireEAN: hasMixedTires ? (tireEANFront || null) : (tireEAN || null),
        tireArticleId: hasMixedTires ? (tireArticleIdFront || null) : (tireArticleId || null),
        tireQuantity: hasMixedTires ? (tireQuantityFront || null) : (tireQuantity || null),
        tirePurchasePrice: hasMixedTires ? (tirePurchasePriceFront || null) : (tirePurchasePrice || null),
        totalTirePurchasePrice: hasMixedTires 
          ? ((tirePurchasePriceFront || 0) * (tireQuantityFront || 2) + (tirePurchasePriceRear || 0) * (tireQuantityRear || 2))
          : (totalTirePurchasePrice || null),
        tireRunFlat: hasMixedTires ? (tireRunFlatFront || false) : (tireRunFlat || false),
        tire3PMSF: hasMixedTires ? (tire3PMSFFront || false) : (tire3PMSF || false),
        // Save complete tire data in JSON field for mixed tires or additional tire info
        tireData: hasMixedTires ? {
          isMixedTires: true,
          front: {
            brand: tireBrandFront,
            model: tireModelFront,
            size: tireSizeFront,
            loadIndex: tireLoadIndexFront,
            speedIndex: tireSpeedIndexFront,
            ean: tireEANFront,
            articleId: tireArticleIdFront,
            quantity: tireQuantityFront || 2,
            purchasePrice: tirePurchasePriceFront,       // VK-Preis (für Kunde)
            totalPrice: totalTirePurchasePriceFront,     // Gesamt-VK
            supplierPrice: supplierPurchasePriceFront,   // Echter EK vom Lieferanten
            supplierTotal: supplierTotalPurchasePriceFront, // Gesamt echter EK
            runFlat: tireRunFlatFront || false,
            threePMSF: tire3PMSFFront || false
          },
          rear: {
            brand: tireBrandRear,
            model: tireModelRear,
            size: tireSizeRear,
            loadIndex: tireLoadIndexRear,
            speedIndex: tireSpeedIndexRear,
            ean: tireEANRear,
            articleId: tireArticleIdRear,
            quantity: tireQuantityRear || 2,
            purchasePrice: tirePurchasePriceRear,        // VK-Preis (für Kunde)
            totalPrice: totalTirePurchasePriceRear,      // Gesamt-VK
            supplierPrice: supplierPurchasePriceRear,    // Echter EK vom Lieferanten
            supplierTotal: supplierTotalPurchasePriceRear,  // Gesamt echter EK
            runFlat: tireRunFlatRear || false,
            threePMSF: tire3PMSFRear || false
          }
        } : (tireEAN ? {
          isMixedTires: false,
          brand: tireBrand,
          model: tireModel,
          size: tireSize,
          loadIndex: tireLoadIndex,
          speedIndex: tireSpeedIndex,
          ean: tireEAN,
          articleId: tireArticleId,
          quantity: tireQuantity || 4,
          purchasePrice: tirePurchasePrice,           // VK-Preis (für Kunde)
          totalPrice: totalTirePurchasePrice,         // Gesamt-VK
          supplierPrice: supplierPurchasePrice,       // Echter EK vom Lieferanten
          supplierTotal: supplierTotalPurchasePrice,  // Gesamt echter EK
          runFlat: tireRunFlat || false,
          threePMSF: tire3PMSF || false
        } : null),
        status: 'RESERVED',
        reservedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        paymentStatus: 'PENDING',
        fromStorageBookingId,
        customerNotes: customerNotes ? String(customerNotes).slice(0, 500) : null
      }
    })

    console.log('✅ [RESERVE] Reservation created:', reservation.id, '| Expires in 10 min')

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      expiresAt: reservation.reservedUntil
    })

  } catch (error) {
    console.error('Error reserving slot:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Reservierung' },
      { status: 500 }
    )
  }
}
