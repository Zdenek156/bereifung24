import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate stats
    const [
      totalTires,
      tiresBySeason,
      tiresBySupplier,
      lastSyncRecord
    ] = await Promise.all([
      prisma.tireCatalog.count({ where: { isActive: true } }),
      prisma.tireCatalog.groupBy({
        by: ['season'],
        where: { isActive: true },
        _count: true
      }),
      prisma.tireCatalog.groupBy({
        by: ['supplier'],
        where: { isActive: true },
        _count: true
      }),
      prisma.tireCatalog.findFirst({
        where: { lastSync: { not: null } },
        orderBy: { lastSync: 'desc' },
        select: { lastSync: true }
      })
    ])

    const seasonCount = {
      s: tiresBySeason.find(t => t.season === 's')?._count || 0,
      w: tiresBySeason.find(t => t.season === 'w')?._count || 0,
      g: tiresBySeason.find(t => t.season === 'g')?._count || 0
    }

    const supplierCount: { [key: string]: number } = {}
    tiresBySupplier.forEach(item => {
      supplierCount[item.supplier] = item._count
    })

    const activeSuppliers = Object.keys(supplierCount)

    return NextResponse.json({
      totalTires,
      activeSuppliers,
      lastSync: lastSyncRecord?.lastSync?.toISOString() || null,
      tiresBySupplier: supplierCount,
      tiresBySeason: seasonCount
    })

  } catch (error) {
    console.error('Error fetching tire catalog stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
