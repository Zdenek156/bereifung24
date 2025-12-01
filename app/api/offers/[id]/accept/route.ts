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

    // Parse optional storage selection
    const body = await request.json().catch(() => ({}))
    const { wantsStorage = false } = body

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

    // Transaktion: Angebot annehmen, Booking erstellen und alle anderen ablehnen
    const result = await prisma.$transaction(async (tx) => {
      // Calculate final price (balancing already included in offer price, add storage if selected)
      let finalPrice = offer.price
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
          wantsBalancing: offer.customerWantsBalancing || false,
          wantsStorage: wantsStorage
        }
      })

      // Berechne und erstelle Commission sofort
      const commissionRate = 4.9 // 4,9% Provision
      const orderTotal = finalPrice
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
