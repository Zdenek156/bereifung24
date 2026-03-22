import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/coupons/validate
 * Gutscheincode validieren (für die Bezahlseite)
 * Body: { code: string, amount: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { code, amount } = await request.json()

    if (!code || !amount) {
      return NextResponse.json({ error: 'Code und Betrag sind erforderlich' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() }
    })

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Ungültiger Gutscheincode' }, { status: 200 })
    }

    // Prüfe ob aktiv
    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: 'Dieser Gutscheincode ist nicht mehr gültig' }, { status: 200 })
    }

    // Prüfe Gültigkeitszeitraum
    const now = new Date()
    if (coupon.validFrom > now) {
      return NextResponse.json({ valid: false, error: 'Dieser Gutscheincode ist noch nicht gültig' }, { status: 200 })
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json({ valid: false, error: 'Dieser Gutscheincode ist abgelaufen' }, { status: 200 })
    }

    // Prüfe maximale Nutzungen gesamt
    if (coupon.maxUsages !== null && coupon.usedCount >= coupon.maxUsages) {
      return NextResponse.json({ valid: false, error: 'Dieser Gutscheincode wurde bereits vollständig eingelöst' }, { status: 200 })
    }

    // Prüfe maximale Nutzungen pro Benutzer
    const userUsages = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        customerId: session.user.id
      }
    })
    if (userUsages >= coupon.maxUsagesPerUser) {
      return NextResponse.json({ valid: false, error: 'Du hast diesen Gutscheincode bereits verwendet' }, { status: 200 })
    }

    // Prüfe Mindestbestellwert
    if (coupon.minOrderValue !== null && amount < coupon.minOrderValue) {
      return NextResponse.json({
        valid: false,
        error: `Mindestbestellwert: ${coupon.minOrderValue.toFixed(2)} €`
      }, { status: 200 })
    }

    // Berechne Rabatt
    let discountAmount = 0
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = Math.round((amount * coupon.value / 100) * 100) / 100
      if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else {
      // FIXED
      discountAmount = Math.min(coupon.value, amount) // Rabatt kann nicht höher als Betrag sein
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type === 'PERCENTAGE' ? 'percentage' : 'fixed',
        value: coupon.value,
        discountAmount,
        costBearer: coupon.costBearer || 'PLATFORM',
        description: coupon.type === 'PERCENTAGE'
          ? `${coupon.value}% Rabatt`
          : `${coupon.value.toFixed(2)} € Rabatt`
      }
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json({ error: 'Fehler bei der Validierung' }, { status: 500 })
  }
}
