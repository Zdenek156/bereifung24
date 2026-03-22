import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/coupons/usages
 * Nutzungshistorie aller Gutscheine
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const couponId = searchParams.get('couponId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (couponId) {
      where.couponId = couponId
    }

    const [usages, total] = await Promise.all([
      prisma.couponUsage.findMany({
        where,
        include: {
          coupon: {
            select: { code: true, type: true, value: true }
          }
        },
        orderBy: { redeemedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.couponUsage.count({ where })
    ])

    // Lade Kundennamen separat (weil customerId eine userId ist, kein Customer-FK)
    const userIds = [...new Set(usages.filter(u => u.customerId).map(u => u.customerId!))]
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    }) : []
    const userMap = new Map(users.map(u => [u.id, u]))

    const enrichedUsages = usages.map(u => ({
      ...u,
      customer: u.customerId ? userMap.get(u.customerId) || null : null
    }))

    return NextResponse.json({
      usages: enrichedUsages,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching coupon usages:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Nutzungshistorie' }, { status: 500 })
  }
}
