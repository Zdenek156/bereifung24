import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, offerAcceptedEmailTemplate } from '@/lib/email'
import { calculateCO2ForRequest } from '@/lib/co2Calculator'

// POST - Kunde nimmt Angebot an
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Parse optional storage selection, selected tire options, and quantity
    const body = await request.json().catch(() => ({}))
    const { wantsStorage = false, selectedTireOptionIds = [], selectedQuantity } = body

    // Hole das Angebot mit allen Relations
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        tireRequest: {
          include: {
            customer: {
              include: {
                user: true
              }
            },
            vehicle: true
          }
        },
        tireOptions: true,
        workshop: {
          select: {
            id: true,
            companyName: true,
            emailNotifyOfferAccepted: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob das Angebot zum Kunden gehört
    if (offer.tireRequest.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert für dieses Angebot' },
        { status: 403 }
      )
    }

    // Prüfe ob Angebot noch gültig ist
    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Dieses Angebot kann nicht mehr angenommen werden' },
        { status: 400 }
      )
    }

    if (new Date(offer.validUntil) < new Date()) {
      return NextResponse.json(
        { error: 'Dieses Angebot ist abgelaufen' },
        { status: 400 }
      )
    }

    // Prüfe ob bereits ein Angebot angenommen wurde
    const existingAcceptedOffer = await prisma.offer.findFirst({
      where: {
        tireRequestId: offer.tireRequestId,
        status: 'ACCEPTED'
      }
    })

    if (existingAcceptedOffer) {
      return NextResponse.json(
        { error: 'Sie haben bereits ein Angebot für diese Anfrage angenommen' },
        { status: 400 }
      )
    }

    // Helper function to calculate quantity based on tire type
    const getQuantityForTireOption = (tireOption: any): number => {
      if (tireOption.carTireType) {
        switch (tireOption.carTireType) {
          case 'ALL_FOUR': return 4
          case 'FRONT_TWO': return 2
          case 'REAR_TWO': return 2
          default: return 4
        }
      }
      if (tireOption.motorcycleTireType) {
        switch (tireOption.motorcycleTireType) {
          case 'BOTH': return 2
          case 'FRONT': return 1
          case 'REAR': return 1
          default: return 2
        }
      }
      return offer?.tireRequest.quantity || 4
    }

    // Determine service type from additionalNotes
    const isBrakeService = offer?.tireRequest.additionalNotes?.includes('BREMSEN-SERVICE')
    const isBatteryService = offer?.tireRequest.additionalNotes?.includes('BATTERIE-SERVICE')
    const isOtherService = offer?.tireRequest.additionalNotes?.includes('🔧 SONSTIGE REIFENSERVICES')
    const isServiceRequest = isBrakeService || isBatteryService || isOtherService

    // Transaktion: Angebot annehmen, Booking erstellen und alle anderen ablehnen
    const result = await prisma.$transaction(async (tx) => {
      // Calculate final price based on selected tire options
      let finalPrice: number = 0
      let selectedOptionsForBooking: string[] = []
      let totalQuantity = 0
      
      // For service requests (Brake, Battery, Other), the price is just the sum of selected packages
      if (isServiceRequest && offer?.tireOptions && offer.tireOptions.length > 0 && selectedTireOptionIds.length > 0) {
        const selectedOptions = offer.tireOptions.filter((opt: any) => 
          selectedTireOptionIds.includes(opt.id)
        )
        
        // Sum up the package prices (pricePerTire is actually the full package price for services)
        selectedOptions.forEach((option: any) => {
          finalPrice += option.pricePerTire
          selectedOptionsForBooking.push(option.id)
        })
        
        // For service requests, installationFee is NOT added separately - it's already in the package prices
        
        console.log('Calculating price for service request:', {
          serviceType: isBrakeService ? 'BRAKE' : isBatteryService ? 'BATTERY' : 'OTHER',
          selectedPackages: selectedOptions.map((o: any) => ({
            id: o.id,
            name: `${o.brand} ${o.model}`,
            price: o.pricePerTire
          })),
          finalPrice
        })
      } else if (offer?.tireOptions && offer.tireOptions.length > 0 && selectedTireOptionIds.length > 0) {
        const selectedOptions = offer.tireOptions.filter((opt: any) => 
          selectedTireOptionIds.includes(opt.id)
        )
        
        // Calculate tire cost and total quantity from selected options
        selectedOptions.forEach((option: any) => {
          const quantity = getQuantityForTireOption(option)
          totalQuantity += quantity
          finalPrice += option.pricePerTire * quantity
          selectedOptionsForBooking.push(option.id)
        })
        
        // Get workshop service to calculate dynamic installation fee
        const workshopService = await tx.workshopService.findFirst({
          where: {
            workshopId: offer.workshopId,
            serviceType: 'TIRE_CHANGE',
            isActive: true
          }
        })
        
        // Calculate installation fee based on quantity
        let installationFee = offer?.installationFee || 0
        if (workshopService) {
          if (totalQuantity === 2) {
            // 2 Reifen: "2 Reifen wechseln" Paket
            installationFee = workshopService.basePrice
          } else if (totalQuantity === 4) {
            // 4 Reifen: "4 Reifen wechseln" Paket
            installationFee = workshopService.basePrice4 || workshopService.basePrice
          } else {
            // Fallback für andere Mengen
            installationFee = workshopService.basePrice
          }
          
          // Add disposal fee if requested
          const hasDisposal = offer?.tireRequest.additionalNotes?.includes('Altreifenentsorgung gewünscht')
          if (hasDisposal && workshopService.disposalFee) {
            installationFee += workshopService.disposalFee * totalQuantity
          }
          
          // Add runflat surcharge if requested
          const hasRunflat = offer?.tireRequest.isRunflat
          if (hasRunflat && workshopService.runFlatSurcharge) {
            installationFee += workshopService.runFlatSurcharge * totalQuantity
          }
        }
        
        finalPrice += installationFee
        
        console.log('Calculating price from selected options:', {
          selectedOptions: selectedOptions.map((o: any) => ({
            id: o.id,
            brand: o.brand,
            model: o.model,
            pricePerTire: o.pricePerTire,
            quantity: getQuantityForTireOption(o)
          })),
          totalQuantity,
          installationFee,
          finalPrice
        })
      } else if (selectedQuantity) {
        // Virtual options selected (offers without explicit tireOptions)
        // Calculate price based on quantity
        totalQuantity = selectedQuantity
        const pricePerTire = (offer?.price - (offer?.installationFee || 0)) / (offer?.tireRequest.quantity || 4)
        finalPrice = pricePerTire * totalQuantity
        
        // Get workshop service to calculate dynamic installation fee
        const workshopService = await tx.workshopService.findFirst({
          where: {
            workshopId: offer.workshopId,
            serviceType: 'TIRE_CHANGE',
            isActive: true
          }
        })
        
        // Calculate installation fee based on quantity
        let installationFee = offer?.installationFee || 0
        if (workshopService) {
          if (totalQuantity === 2) {
            // 2 Reifen: "2 Reifen wechseln" Paket
            installationFee = workshopService.basePrice
          } else if (totalQuantity === 4) {
            // 4 Reifen: "4 Reifen wechseln" Paket
            installationFee = workshopService.basePrice4 || workshopService.basePrice
          } else {
            // Fallback für andere Mengen
            installationFee = workshopService.basePrice
          }
          
          // Add disposal fee if requested
          const hasDisposal = offer?.tireRequest.additionalNotes?.includes('Altreifenentsorgung gewünscht')
          if (hasDisposal && workshopService.disposalFee) {
            installationFee += workshopService.disposalFee * totalQuantity
          }
          
          // Add runflat surcharge if requested
          const hasRunflat = offer?.tireRequest.isRunflat
          if (hasRunflat && workshopService.runFlatSurcharge) {
            installationFee += workshopService.runFlatSurcharge * totalQuantity
          }
        }
        
        finalPrice += installationFee
        
        console.log('Calculating price for virtual options:', {
          selectedQuantity: totalQuantity,
          pricePerTire,
          installationFee,
          finalPrice
        })
      } else {
        // Fallback to offer.price if no options selected
        finalPrice = offer?.price || 0
        totalQuantity = offer?.tireRequest.quantity || 4
      }
      
      // Add storage if selected
      if (wantsStorage) {
        const offerWithPrices = await tx.offer.findUnique({
          where: { id: params.id },
          select: { storagePrice: true }
        })
        if (offerWithPrices?.storagePrice) {
          finalPrice += Number(offerWithPrices.storagePrice)
        }
      }

      // Aktualisiere das angenommene Angebot
      const acceptedOffer = await tx.offer.update({
        where: { id: params.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          customerWantsStorage: wantsStorage,
          price: finalPrice,
          selectedTireOptionIds: selectedOptionsForBooking
        },
        include: {
          tireOptions: true
        }
      })

      // Erstelle Booking sofort (Termin kann später vereinbart werden)
      const booking = await tx.booking.create({
        data: {
          customerId: customer.id,
          workshopId: offer.workshopId,
          offerId: offer.id,
          tireRequestId: offer.tireRequestId,
          status: 'PENDING', // Wird zu CONFIRMED sobald Termin vereinbart
          appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Platzhalter: +7 Tage
          appointmentTime: '00:00', // Platzhalter
          wantsBalancing: offer.customerWantsBalancing || false,
          wantsStorage: wantsStorage,
          // Store first selected option ID if available
          selectedTireOptionId: selectedOptionsForBooking.length > 0 ? selectedOptionsForBooking[0] : null
        }
      })

      // Berechne und erstelle Commission sofort
      const commissionRate = 4.9 // 4,9% Provision
      const orderTotal: number = finalPrice
      const commissionAmount = (orderTotal * commissionRate) / 100
      
      // Berechne Netto/Brutto für Rechnung
      const taxRate = 19.0
      const grossAmount = commissionAmount
      const netAmount = grossAmount / (1 + taxRate / 100)
      const taxAmount = grossAmount - netAmount

      // Bestimme Abrechnungszeitraum (aktueller Monat)
      const now = new Date()
      const billingMonth = now.getMonth() + 1
      const billingYear = now.getFullYear()
      
      // Berechne Billing Period (Monatserster bis Monatsletzter)
      const billingPeriodStart = new Date(billingYear, billingMonth - 1, 1)
      const billingPeriodEnd = new Date(billingYear, billingMonth, 0, 23, 59, 59, 999)

      await tx.commission.create({
        data: {
          bookingId: booking.id,
          workshopId: offer.workshopId,
          orderTotal: orderTotal,
          commissionRate: commissionRate,
          commissionAmount: commissionAmount,
          taxRate: taxRate,
          taxAmount: taxAmount,
          netAmount: netAmount,
          grossAmount: grossAmount,
          billingPeriodStart: billingPeriodStart,
          billingPeriodEnd: billingPeriodEnd,
          billingMonth: billingMonth,
          billingYear: billingYear,
          status: 'PENDING' // PENDING -> BILLED -> COLLECTED
        }
      })

      // Lehne alle anderen Angebote ab (damit Werkstätten sehen können dass Kunde anderes Angebot gewählt hat)
      await tx.offer.updateMany({
        where: {
          tireRequestId: offer.tireRequestId,
          id: { not: params.id },
          status: 'PENDING'
        },
        data: {
          status: 'DECLINED',
          declinedAt: new Date()
        }
      })

      // Aktualisiere TireRequest Status
      await tx.tireRequest.update({
        where: { id: offer.tireRequestId },
        data: {
          status: 'ACCEPTED'
        }
      })

      return acceptedOffer
    })

    // Calculate and save CO2 after offer acceptance
    try {
      console.log(`🌱 Calculating CO2 savings for accepted offer (request: ${offer.tireRequestId})`)
      await calculateCO2ForRequest(offer.tireRequestId)
      console.log(`✅ CO2 savings calculated and saved`)
    } catch (co2Error) {
      console.error('CO2 calculation failed:', co2Error)
      // Continue even if CO2 calculation fails
    }

    // Track affiliate conversion if ref code exists
    const affiliateRef = request.cookies.get('b24_affiliate_ref')?.value
    const cookieId = request.cookies.get('b24_cookie_id')?.value
    
    if (affiliateRef && cookieId) {
      try {
        const influencer = await prisma.influencer.findUnique({
          where: { code: affiliateRef },
          select: {
            id: true,
            isActive: true,
            commissionPerCustomerFirstOffer: true
          }
        })

        if (influencer && influencer.isActive) {
          // Check for duplicate conversion
          const existingConversion = await prisma.affiliateConversion.findFirst({
            where: {
              influencerId: influencer.id,
              cookieId: cookieId,
              type: 'ACCEPTED_OFFER',
              offerId: offer.id
            }
          })
          
          if (!existingConversion) {
            const commissionAmount = influencer.commissionPerCustomerFirstOffer
            
            await prisma.affiliateConversion.create({
              data: {
                influencerId: influencer.id,
                cookieId: cookieId,
                customerId: customer.id,
                type: 'ACCEPTED_OFFER',
                tireRequestId: offer.tireRequestId,
                offerId: offer.id,
                commissionAmount: commissionAmount,
                isPaid: false
              }
            })
            
            console.log(`[AFFILIATE] ✓ Offer acceptance conversion tracked: ${affiliateRef} - €${commissionAmount / 100}`)
          } else {
            console.log(`[AFFILIATE] Duplicate conversion prevented: ${affiliateRef}`)
          }
        }
      } catch (conversionError) {
        console.error('[AFFILIATE] Error tracking conversion:', conversionError)
        // Don't fail offer acceptance if conversion tracking fails
      }
    }

    // Email an Werkstatt senden
    try {
      // Prüfe ob Werkstatt Benachrichtigungen für akzeptierte Angebote aktiviert hat
      if (offer.workshop.emailNotifyOfferAccepted) {
        const tireSpecs = `${offer.tireRequest.width}/${offer.tireRequest.aspectRatio} R${offer.tireRequest.diameter}`
        
        // Determine service type and extract details
        let serviceType: 'TIRE' | 'BRAKE' | 'BATTERY' | 'OTHER' = 'TIRE'
        let serviceDetails = ''
        
        if (offer.tireRequest.additionalNotes) {
          if (offer.tireRequest.additionalNotes.includes('BREMSEN-SERVICE')) {
            serviceType = 'BRAKE'
          } else if (offer.tireRequest.additionalNotes.includes('BATTERIE-SERVICE')) {
            serviceType = 'BATTERY'
          } else if (offer.tireRequest.additionalNotes.includes('🔧 SONSTIGE REIFENSERVICES')) {
            serviceType = 'OTHER'
          }
          
          // Extract service details from notes
          if (serviceType !== 'TIRE') {
            const notesLines = offer.tireRequest.additionalNotes.split('\n')
            serviceDetails = notesLines.filter(line => 
              line && !line.includes('SERVICE') && !line.startsWith('Zusätzliche Hinweise')
            ).join(' ').trim()
          }
        }
        
        // Get vehicle info if available
        let vehicleInfo = ''
        if (offer.tireRequest.vehicle) {
          vehicleInfo = `${offer.tireRequest.vehicle.make} ${offer.tireRequest.vehicle.model} (${offer.tireRequest.vehicle.year})`
        }
        
        const emailTemplate = offerAcceptedEmailTemplate({
          workshopName: offer.workshop.companyName,
          customerName: `${offer.tireRequest.customer.user.firstName} ${offer.tireRequest.customer.user.lastName}`,
          tireBrand: offer.tireBrand,
          tireModel: offer.tireModel,
          tireSpecs: tireSpecs,
          price: offer.price,
          customerPhone: offer.tireRequest.customer.user.phone || undefined,
          customerEmail: offer.tireRequest.customer.user.email,
          customerStreet: offer.tireRequest.customer.user.street || undefined,
          customerZipCode: offer.tireRequest.customer.user.zipCode || undefined,
          customerCity: offer.tireRequest.customer.user.city || undefined,
          vehicleInfo: vehicleInfo || undefined,
          serviceType,
          serviceDetails: serviceDetails || undefined,
          additionalNotes: offer.tireRequest.additionalNotes || undefined
        })

        await sendEmail({
          to: offer.workshop.user.email,
          ...emailTemplate
        })
        console.log(`📧 Offer accepted email sent to workshop: ${offer.workshop.user.email}`)
      } else {
        console.log(`⏭️  Workshop ${offer.workshopId} has disabled offer accepted notifications`)
      }
    } catch (emailError) {
      console.error('Email konnte nicht gesendet werden:', emailError)
      // Weiter ausführen, auch wenn Email fehlschlägt
    }

    return NextResponse.json({
      message: 'Angebot erfolgreich angenommen',
      offer: result
    })

  } catch (error) {
    console.error('Offer acceptance error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Annehmen des Angebots' },
      { status: 500 }
    )
  }
}
