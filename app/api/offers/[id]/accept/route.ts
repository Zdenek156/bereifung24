import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, offerAcceptedEmailTemplate } from '@/lib/email'

// POST - Kunde nimmt Angebot an
export async function POST(
  request: Request,
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

    // Parse optional storage selection and selected tire options
    const body = await request.json().catch(() => ({}))
    const { wantsStorage = false, selectedTireOptionIds = [] } = body

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
            }
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

    // Transaktion: Angebot annehmen, Booking erstellen und alle anderen ablehnen
    const result = await prisma.$transaction(async (tx) => {
      // Calculate final price based on selected tire options
      let finalPrice: number = offer?.installationFee || 0 // Start with installation fee
      let selectedOptionsForBooking: string[] = []
      
      // If tire options were selected, calculate based on those
      if (offer?.tireOptions && offer.tireOptions.length > 0 && selectedTireOptionIds.length > 0) {
        const selectedOptions = offer.tireOptions.filter((opt: any) => 
          selectedTireOptionIds.includes(opt.id)
        )
        
        // Calculate tire cost from selected options
        selectedOptions.forEach((option: any) => {
          const quantity = getQuantityForTireOption(option)
          finalPrice += option.pricePerTire * quantity
          selectedOptionsForBooking.push(option.id)
        })
        
        console.log('Calculating price from selected options:', {
          selectedOptions: selectedOptions.map((o: any) => ({
            id: o.id,
            brand: o.brand,
            model: o.model,
            pricePerTire: o.pricePerTire,
            quantity: getQuantityForTireOption(o)
          })),
          installationFee: offer?.installationFee,
          finalPrice
        })
      } else {
        // Fallback to offer.price if no options selected
        finalPrice = offer?.price || 0
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
          price: finalPrice
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

    // Email an Werkstatt senden
    try {
      // Prüfe ob Werkstatt Benachrichtigungen für akzeptierte Angebote aktiviert hat
      if (offer.workshop.emailNotifyOfferAccepted) {
        const tireSpecs = `${offer.tireRequest.width}/${offer.tireRequest.aspectRatio} R${offer.tireRequest.diameter}`
        const emailTemplate = offerAcceptedEmailTemplate({
          workshopName: offer.workshop.companyName,
          customerName: `${offer.tireRequest.customer.user.firstName} ${offer.tireRequest.customer.user.lastName}`,
          tireBrand: offer.tireBrand,
          tireModel: offer.tireModel,
          tireSpecs: tireSpecs,
          price: offer.price,
          customerPhone: offer.tireRequest.customer.user.phone || undefined,
          customerEmail: offer.tireRequest.customer.user.email
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
