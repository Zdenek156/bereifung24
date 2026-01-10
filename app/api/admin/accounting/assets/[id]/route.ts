import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/accounting/assets/[id]
 * Get a single asset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const asset = await prisma.asset.findUnique({
      where: { id: params.id }
    })

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }

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
        accumulatedDepreciation: asset.acquisitionCost - asset.bookValue,
        status: asset.status.toLowerCase()
      }
    })
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/accounting/assets/[id]
 * Update an asset
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const annualDepreciation = (purchasePrice - (residualValue || 0)) / usefulLife

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        name,
        category: mappedCategory,
        acquisitionCost: purchasePrice,
        acquisitionDate: new Date(purchaseDate),
        usefulLife,
        afaMethod: depreciationMethod.toUpperCase() === 'LINEAR' ? 'LINEAR' : 'DEGRESSIV',
        annualDepreciation
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
        accumulatedDepreciation: asset.acquisitionCost - asset.bookValue,
        status: asset.status.toLowerCase()
      }
    })
  } catch (error) {
    console.error('Error updating asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/accounting/assets/[id]
 * Delete an asset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.asset.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
