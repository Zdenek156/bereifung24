import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/coupons/[id]/toggle
 * Gutschein aktivieren/deaktivieren
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.coupon.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Gutschein nicht gefunden' }, { status: 404 })
    }

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: { isActive: !existing.isActive }
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error toggling coupon:', error)
    return NextResponse.json({ error: 'Fehler beim Ändern des Status' }, { status: 500 })
  }
}
