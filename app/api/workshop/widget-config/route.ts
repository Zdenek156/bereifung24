import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workshop/widget-config
 * Returns workshop ID and basic info for the widget configuration page
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      select: { id: true, companyName: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ workshopId: workshop.id, companyName: workshop.companyName })
  } catch (error) {
    console.error('Widget config error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
