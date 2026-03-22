import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/coupons/redeem
 * Gutschein einlösen (nach erfolgreicher Buchung)
 * Body: { couponId: string, bookingId?: string, originalAmount: number, discountAmount: number, finalAmount: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { couponId, bookingId, originalAmount, discountAmount, finalAmount } = await request.json()

    if (!couponId || originalAmount === undefined || discountAmount === undefined || finalAmount === undefined) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
    }

    // Prüfe ob Gutschein existiert und gültig ist
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } })
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'Ungültiger Gutschein' }, { status: 400 })
    }

    // Prüfe ob maximale Nutzungen überschritten
    if (coupon.maxUsages !== null && coupon.usedCount >= coupon.maxUsages) {
      return NextResponse.json({ error: 'Gutschein wurde bereits vollständig eingelöst' }, { status: 400 })
    }

    // Erstelle Usage und aktualisiere Counter in einer Transaktion
    const result = await prisma.$transaction(async (tx) => {
      const usage = await tx.couponUsage.create({
        data: {
          couponId,
          customerId: session.user.id,
          bookingId: bookingId || null,
          originalAmount,
          discountAmount,
          finalAmount,
        }
      })

      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } }
      })

      return usage
    })

    return NextResponse.json({ success: true, usage: result })
  } catch (error) {
    console.error('Error redeeming coupon:', error)
    return NextResponse.json({ error: 'Fehler beim Einlösen des Gutscheins' }, { status: 500 })
  }
}
