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

    // Get query params
    const { searchParams } = new URL(request.url)
    const supplier = searchParams.get('supplier')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Build where clause
    const where: any = {}
    if (supplier && supplier !== 'all') {
      where.supplier = supplier
    }

    // Get total statistics from database
    const [totalCount, supplierStats, vehicleTypeStats, latestTire] = await Promise.all([
      // Total count
      prisma.tireCatalog.count({ where }),
      
      // Count by supplier
      prisma.tireCatalog.groupBy({
        by: ['supplier'],
        where,
        _count: { id: true }
      }),
      
      // Count by vehicle type
      prisma.tireCatalog.groupBy({
        by: ['vehicleType'],
        where,
        _count: { id: true }
      }),
      
      // Get latest sync date
      prisma.tireCatalog.findFirst({
        where,
        orderBy: { lastSync: 'desc' },
        select: { lastSync: true }
      })
    ])

    // Fetch limited tires for display
    const tires = await prisma.tireCatalog.findMany({
      where,
      take: limit,
      orderBy: [
        { isActive: 'desc' },
        { brand: 'asc' },
        { model: 'asc' }
      ],
      select: {
        id: true,
        supplier: true,
        articleId: true,
        ean: true,
        brand: true,
        model: true,
        width: true,
        height: true,
        diameter: true,
        season: true,
        vehicleType: true,
        loadIndex: true,
        speedIndex: true,
        runFlat: true,
        threePMSF: true,
        labelFuelEfficiency: true,
        labelWetGrip: true,
        labelNoise: true,
        isActive: true,
        lastSync: true
      }
    })

    // Transform data
    const seasonMap: { [key: string]: string } = {
      s: 'Sommer',
      w: 'Winter',
      g: 'Ganzjahr'
    }

    const transformedTires = tires.map(tire => ({
      ...tire,
      seasonLabel: seasonMap[tire.season] || tire.season,
      lastSync: tire.lastSync?.toISOString() || null
    }))

    // Build statistics
    const bySupplier: { [key: string]: number } = {}
    supplierStats.forEach(stat => {
      bySupplier[stat.supplier] = stat._count.id
    })

    const byVehicleType: { [key: string]: number } = {}
    vehicleTypeStats.forEach(stat => {
      byVehicleType[stat.vehicleType] = stat._count.id
    })

    return NextResponse.json({
      tires: transformedTires,
      stats: {
        total: totalCount,
        bySupplier,
        byVehicleType
      },
      lastSync: latestTire?.lastSync?.toISOString() || null
    })

  } catch (error) {
    console.error('Error fetching tire catalog:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    // Delete all tire catalog entries
    const result = await prisma.tireCatalog.deleteMany({})

    console.log(`[TIRE-CATALOG] Admin ${session.user.email} deleted entire catalog: ${result.count} entries`)

    return NextResponse.json({ 
      success: true,
      deleted: result.count,
      message: 'Catalog cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing tire catalog:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
