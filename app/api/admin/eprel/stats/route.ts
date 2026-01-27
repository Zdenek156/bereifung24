import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/eprel/stats
 * Get statistics about EPREL tire database
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    // Get total count
    const total = await prisma.ePRELTire.count()

    // Get count by season
    const bySeason = await prisma.ePRELTire.groupBy({
      by: ['tyreClass'],
      _count: true
    })

    // Get count by manufacturer (top 10)
    const byManufacturer = await prisma.ePRELTire.groupBy({
      by: ['supplierName'],
      _count: true,
      orderBy: {
        _count: {
          supplierName: 'desc'
        }
      },
      take: 10
    })

    // Get latest import
    const latestImport = await prisma.ePRELImport.findFirst({
      where: { status: 'SUCCESS' },
      orderBy: { completedAt: 'desc' }
    })

    return NextResponse.json({
      total,
      bySeason: bySeason.map(s => ({ season: s.tyreClass, count: s._count })),
      topManufacturers: byManufacturer.map(m => ({ name: m.supplierName, count: m._count })),
      lastImport: latestImport ? {
        date: latestImport.completedAt,
        tiresImported: latestImport.tiresImported,
        tiresUpdated: latestImport.tiresUpdated
      } : null
    })

  } catch (error) {
    console.error('Error fetching EPREL stats:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Statistiken' },
      { status: 500 }
    )
  }
}
