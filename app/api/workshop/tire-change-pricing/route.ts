import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workshop/tire-change-pricing
 * Load tire change pricing by rim size for the current workshop
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    const pricing = await prisma.tireChangePricingBySize.findMany({
      where: { workshopId: workshop.id },
      orderBy: { rimSize: 'asc' }
    })

    return NextResponse.json({ pricing })
  } catch (error) {
    console.error('Error loading tire change pricing:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}

/**
 * POST /api/workshop/tire-change-pricing
 * Save/update tire change pricing by rim size
 * Body: { pricing: [{ rimSize: 13, pricePerTire: 15, durationPerTire: 15, isActive: true }, ...] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const { pricing } = body

    if (!pricing || !Array.isArray(pricing)) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
    }

    // Upsert each rim size pricing
    const results = []
    for (const entry of pricing) {
      const { rimSize, pricePerTire, durationPerTire, isActive } = entry

      if (rimSize < 13 || rimSize > 24) continue
      if (pricePerTire < 0 || durationPerTire < 0) continue

      const result = await prisma.tireChangePricingBySize.upsert({
        where: {
          workshopId_rimSize: {
            workshopId: workshop.id,
            rimSize: rimSize
          }
        },
        update: {
          pricePerTire,
          durationPerTire,
          isActive: isActive !== false
        },
        create: {
          workshopId: workshop.id,
          rimSize,
          pricePerTire,
          durationPerTire,
          isActive: isActive !== false
        }
      })
      results.push(result)
    }

    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error('Error saving tire change pricing:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
  }
}
