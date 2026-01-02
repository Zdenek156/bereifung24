import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * GET /api/influencer/payments
 * Get payment history for logged-in influencer
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('influencer_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as any
    const influencerId = decoded.influencerId

    const payments = await prisma.affiliatePayment.findMany({
      where: { influencerId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ payments })

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 })
    }
    
    console.error('[INFLUENCER] Get payments error:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
}

/**
 * POST /api/influencer/payments
 * Request a new payment (influencer requests payout of unpaid commissions)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('influencer_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const decoded = verify(token, JWT_SECRET) as any
    const influencerId = decoded.influencerId

    // Get influencer with unpaid conversions
    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        conversions: {
          where: { isPaid: false }
        }
      }
    })

    if (!influencer) {
      return NextResponse.json({ error: 'Influencer nicht gefunden' }, { status: 404 })
    }

    // Validate payment info exists
    if (!influencer.paymentMethod) {
      return NextResponse.json(
        { error: 'Bitte vervollständigen Sie zuerst Ihre Zahlungsinformationen in Ihrem Profil' },
        { status: 400 }
      )
    }

    if (influencer.paymentMethod === 'BANK_TRANSFER' && (!influencer.iban || !influencer.accountHolder)) {
      return NextResponse.json(
        { error: 'Bitte vervollständigen Sie Ihre Bankdaten im Profil' },
        { status: 400 }
      )
    }

    if (influencer.paymentMethod === 'PAYPAL' && !influencer.paypalEmail) {
      return NextResponse.json(
        { error: 'Bitte vervollständigen Sie Ihre PayPal E-Mail im Profil' },
        { status: 400 }
      )
    }

    // Calculate amounts by type
    let clicksAmount = 0
    let registrationsAmount = 0
    let offersAmount = 0
    let totalClicks = 0
    let totalRegistrations = 0
    let totalOffers = 0

    influencer.conversions.forEach(conv => {
      switch (conv.type) {
        case 'PAGE_VIEW':
          totalClicks++
          break
        case 'REGISTRATION':
          registrationsAmount += influencer.commissionPerRegistration
          totalRegistrations++
          break
        case 'ACCEPTED_OFFER':
          offersAmount += influencer.commissionPerAcceptedOffer
          totalOffers++
          break
        case 'WORKSHOP_REGISTRATION':
          registrationsAmount += influencer.commissionPerWorkshopRegistration
          totalRegistrations++
          break
      }
    })

    // Calculate clicks amount: commission per 1000 views (CPM model)
    clicksAmount = Math.floor((totalClicks / 1000) * influencer.commissionPer1000Views)

    const totalAmount = clicksAmount + registrationsAmount + offersAmount

    // Check minimum payout amount (e.g., 50 EUR = 5000 cents)
    const MINIMUM_PAYOUT = 5000
    if (totalAmount < MINIMUM_PAYOUT) {
      return NextResponse.json(
        { 
          error: `Mindestbetrag für Auszahlung nicht erreicht. Sie benötigen mindestens €${(MINIMUM_PAYOUT / 100).toFixed(2)}, haben aber nur €${(totalAmount / 100).toFixed(2)}.`,
          currentAmount: totalAmount,
          minimumAmount: MINIMUM_PAYOUT
        },
        { status: 400 }
      )
    }

    // Check if there's already a pending payment request
    const existingPendingPayment = await prisma.affiliatePayment.findFirst({
      where: {
        influencerId,
        status: 'PENDING'
      }
    })

    if (existingPendingPayment) {
      return NextResponse.json(
        { error: 'Sie haben bereits eine ausstehende Auszahlungsanfrage' },
        { status: 400 }
      )
    }

    // Calculate period (from first to last unpaid conversion)
    const conversionDates = influencer.conversions.map(c => new Date(c.convertedAt))
    const periodStart = conversionDates.length > 0 
      ? new Date(Math.min(...conversionDates.map(d => d.getTime())))
      : new Date()
    const periodEnd = new Date()

    // Create payment request
    const payment = await prisma.affiliatePayment.create({
      data: {
        influencerId,
        periodStart,
        periodEnd,
        totalAmount,
        clicksAmount,
        registrationsAmount,
        offersAmount,
        totalClicks,
        totalRegistrations,
        totalOffers,
        status: 'PENDING',
        paymentMethod: influencer.paymentMethod,
        paymentReference: influencer.paymentMethod === 'BANK_TRANSFER' 
          ? `IBAN: ${influencer.iban}, Inhaber: ${influencer.accountHolder}`
          : `PayPal: ${influencer.paypalEmail}`
      }
    })

    return NextResponse.json({
      message: 'Auszahlungsanfrage erfolgreich erstellt',
      payment: {
        id: payment.id,
        amount: payment.totalAmount,
        status: payment.status,
        requestedAt: payment.createdAt
      }
    })

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 })
    }
    
    console.error('[INFLUENCER] Create payment request error:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
}
