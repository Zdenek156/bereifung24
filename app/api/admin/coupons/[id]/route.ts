import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/coupons/[id]
 * Einzelnen Gutschein mit Nutzungshistorie laden
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        usages: {
          orderBy: { redeemedAt: 'desc' },
          take: 50
        },
        _count: {
          select: { usages: true }
        }
      }
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Gutschein nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Gutscheins' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/coupons/[id]
 * Gutschein bearbeiten
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Prüfe ob Gutschein existiert
    const existing = await prisma.coupon.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Gutschein nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob neuer Code bereits existiert (bei Änderung)
    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
      if (duplicate) {
        return NextResponse.json({ error: 'Dieser Gutscheincode existiert bereits' }, { status: 409 })
      }
    }

    const updateData: any = {}
    if (code !== undefined) updateData.code = code.toUpperCase().trim()
    if (description !== undefined) updateData.description = description || null
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = parseFloat(value)
    if (minOrderValue !== undefined) updateData.minOrderValue = minOrderValue ? parseFloat(minOrderValue) : null
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null
    if (maxUsages !== undefined) updateData.maxUsages = maxUsages ? parseInt(maxUsages) : null
    if (maxUsagesPerUser !== undefined) updateData.maxUsagesPerUser = parseInt(maxUsagesPerUser)
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom)
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (isActive !== undefined) updateData.isActive = isActive
    if (costBearer !== undefined) updateData.costBearer = costBearer

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Gutscheins' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/coupons/[id]
 * Gutschein löschen
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: { _count: { select: { usages: true } } }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Gutschein nicht gefunden' }, { status: 404 })
    }

    // Wenn Gutschein bereits verwendet wurde, nur deaktivieren statt löschen
    if (existing._count.usages > 0) {
      await prisma.coupon.update({
        where: { id: params.id },
        data: { isActive: false }
      })
      return NextResponse.json({ message: 'Gutschein wurde deaktiviert (bereits verwendet)', deactivated: true })
    }

    await prisma.coupon.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Gutschein gelöscht' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Gutscheins' }, { status: 500 })
  }
}
