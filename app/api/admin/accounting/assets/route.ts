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

    if (!session || session.user.role !== 'ADMIN') {
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

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      category,
      purchaseDate,
      purchasePrice,
      depreciationMethod,
      usefulLife,
      residualValue
    } = body

    // Map frontend categories to backend enum values
    const categoryMap: Record<string, string> = {
      'equipment': 'OTHER',
      'vehicles': 'VEHICLE',
      'furniture': 'FURNITURE',
      'software': 'SOFTWARE',
      'buildings': 'OTHER',
      'computer': 'COMPUTER'
    }

    const mappedCategory = categoryMap[category.toLowerCase()] || 'OTHER'

    // Generate asset number
    const year = new Date().getFullYear()
    const count = await prisma.asset.count() + 1
    const assetNumber = `ASS-${year}-${String(count).padStart(3, '0')}`

    // Calculate annual depreciation
    const annualDepreciation = (purchasePrice - (residualValue || 0)) / usefulLife

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
        costCenter: 'ADMINISTRATION', // Default
        status: 'ACTIVE',
        createdById: session.user.id
      }
    })

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
    return NextResponse.json(
      { success: false, error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
