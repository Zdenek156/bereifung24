import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/coupons
 * Liste aller Gutscheine mit optionalen Filtern
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, inactive, expired, all
    const search = searchParams.get('search')
    const type = searchParams.get('type') // PERCENTAGE, FIXED

    const where: any = {}

    if (status === 'active') {
      where.isActive = true
      where.OR = [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    } else if (status === 'inactive') {
      where.isActive = false
    } else if (status === 'expired') {
      where.validUntil = { lt: new Date() }
    }

    if (type && type !== 'ALL') {
      where.type = type
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }
      ]
    }

    const coupons = await prisma.coupon.findMany({
      where,
      include: {
        _count: {
          select: { usages: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Stats
    const totalCoupons = await prisma.coupon.count()
    const activeCoupons = await prisma.coupon.count({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      }
    })
    const totalUsages = await prisma.couponUsage.count()
    const totalDiscount = await prisma.couponUsage.aggregate({
      _sum: { discountAmount: true }
    })

    return NextResponse.json({
      coupons,
      stats: {
        totalCoupons,
        activeCoupons,
        totalUsages,
        totalDiscountGiven: totalDiscount._sum.discountAmount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Gutscheine' }, { status: 500 })
  }
}

/**
 * POST /api/admin/coupons
 * Neuen Gutschein erstellen
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      code,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      maxUsages,
      maxUsagesPerUser,
      validFrom,
      validUntil,
      isActive,
      costBearer
    } = body

    // Validierung
    if (!code || !type || value === undefined || value === null) {
      return NextResponse.json({ error: 'Code, Typ und Wert sind Pflichtfelder' }, { status: 400 })
    }

    if (!['PERCENTAGE', 'FIXED'].includes(type)) {
      return NextResponse.json({ error: 'Ungültiger Typ. Erlaubt: PERCENTAGE, FIXED' }, { status: 400 })
    }

    if (value <= 0) {
      return NextResponse.json({ error: 'Wert muss größer als 0 sein' }, { status: 400 })
    }

    if (type === 'PERCENTAGE' && value > 100) {
      return NextResponse.json({ error: 'Prozentwert darf nicht über 100% sein' }, { status: 400 })
    }

    // Prüfe ob Code bereits existiert
    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Dieser Gutscheincode existiert bereits' }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || null,
        type,
        value: parseFloat(value),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        maxUsages: maxUsages ? parseInt(maxUsages) : null,
        maxUsagesPerUser: maxUsagesPerUser ? parseInt(maxUsagesPerUser) : 1,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== undefined ? isActive : true,
        costBearer: costBearer || 'PLATFORM',
        createdById: session.user.id,
      }
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Gutscheins' }, { status: 500 })
  }
}
