import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/assets
 * Get all fixed assets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const assets = await prisma.asset.findMany({
      orderBy: {
        acquisitionDate: 'desc'
      }
    })

    // Map to frontend format
    const mappedAssets = assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      purchaseDate: asset.acquisitionDate.toISOString(),
      purchasePrice: asset.acquisitionCost,
      depreciationMethod: asset.afaMethod.toLowerCase(),
      usefulLife: asset.usefulLife,
      residualValue: 0, // Not in current model
      currentValue: asset.bookValue,
      accumulatedDepreciation: asset.acquisitionCost - asset.bookValue,
      status: asset.status.toLowerCase()
    }))

    return NextResponse.json(mappedAssets)
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/accounting/assets
 * Create a new asset
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Received asset creation request:', body)

    const {
      name,
      category,
      purchaseDate,
      purchasePrice,
      depreciationMethod,
      usefulLife,
      residualValue
    } = body

    // Validate required fields
    if (!name || !category || !purchaseDate || !purchasePrice || !usefulLife) {
      console.error('Missing required fields:', { name, category, purchaseDate, purchasePrice, usefulLife })
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Map frontend categories to backend enum values
    const categoryMap: Record<string, string> = {
      'equipment': 'OTHER',
      'vehicles': 'VEHICLE',
      'furniture': 'FURNITURE',
      'software': 'SOFTWARE',
      'buildings': 'OTHER',
      'computer': 'COMPUTER',
      'betriebs- und geschäftsausstattung': 'OTHER',
      'fuhrpark': 'VEHICLE',
      'büromöbel': 'FURNITURE'
    }

    const mappedCategory = categoryMap[category.toLowerCase()] || 'OTHER'
    console.log('Mapped category:', category, '->', mappedCategory)

    // Generate asset number
    const year = new Date().getFullYear()
    const count = await prisma.asset.count() + 1
    const assetNumber = `ASS-${year}-${String(count).padStart(3, '0')}`

    // Calculate annual depreciation
    const annualDepreciation = (purchasePrice - (residualValue || 0)) / usefulLife

    console.log('Creating asset with data:', {
      assetNumber,
      name,
      category: mappedCategory,
      acquisitionCost: purchasePrice,
      usefulLife,
      userId: session.user.id
    })

    const asset = await prisma.asset.create({
      data: {
        assetNumber,
        name,
        category: mappedCategory,
        acquisitionCost: purchasePrice,
        acquisitionDate: new Date(purchaseDate),
        usefulLife,
        afaMethod: depreciationMethod.toUpperCase() === 'LINEAR' ? 'LINEAR' : 'DEGRESSIV',
        annualDepreciation,
        bookValue: purchasePrice,
        costCenter: 'ALLGEMEIN', // Changed from ADMINISTRATION to ALLGEMEIN (valid enum value)
        status: 'ACTIVE',
        createdById: session.user.id
      }
    })

    console.log('Asset created successfully:', asset.id)

    return NextResponse.json({
      success: true,
      data: {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        purchaseDate: asset.acquisitionDate.toISOString(),
        purchasePrice: asset.acquisitionCost,
        depreciationMethod: asset.afaMethod.toLowerCase(),
        usefulLife: asset.usefulLife,
        residualValue: 0,
        currentValue: asset.bookValue,
        accumulatedDepreciation: 0,
        status: asset.status.toLowerCase()
      }
    })
  } catch (error) {
    console.error('Error creating asset:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create asset',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
