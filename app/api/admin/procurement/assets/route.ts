import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all assets
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assets = await prisma.asset.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        order: {
          select: {
            orderNumber: true
          }
        }
      },
      orderBy: {
        acquisitionDate: 'desc'
      }
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new asset
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      acquisitionCost,
      acquisitionDate,
      usefulLife,
      costCenter,
      location,
      serialNumber,
      manufacturer,
      model,
      status
    } = body

    // Validate required fields
    if (!name || !category || !acquisitionCost || !acquisitionDate || !usefulLife || !costCenter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate asset number
    const year = new Date().getFullYear()
    const lastAsset = await prisma.asset.findFirst({
      where: {
        assetNumber: {
          startsWith: `ASS-${year}-`
        }
      },
      orderBy: {
        assetNumber: 'desc'
      }
    })

    let nextNumber = 1
    if (lastAsset) {
      const lastNumber = parseInt(lastAsset.assetNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    const assetNumber = `ASS-${year}-${nextNumber.toString().padStart(3, '0')}`

    // Calculate depreciation
    const annualDepreciation = acquisitionCost / usefulLife
    const bookValue = acquisitionCost // Initial book value equals acquisition cost

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        assetNumber,
        name,
        description: description || null,
        category,
        acquisitionCost,
        acquisitionDate: new Date(acquisitionDate),
        usefulLife,
        afaMethod: 'LINEAR',
        annualDepreciation,
        bookValue,
        fullyDepreciated: false,
        costCenter,
        location: location || null,
        serialNumber: serialNumber || null,
        manufacturer: manufacturer || null,
        model: model || null,
        status: status || 'ACTIVE',
        createdById: session.user.id
      }
    })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update asset
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      category,
      acquisitionCost,
      acquisitionDate,
      usefulLife,
      costCenter,
      location,
      serialNumber,
      manufacturer,
      model,
      status
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })
    }

    // Recalculate depreciation if relevant fields changed
    const annualDepreciation = acquisitionCost / usefulLife
    
    // For updating book value, we would need to calculate based on time elapsed
    // For now, we'll keep the existing logic simple
    const asset = await prisma.asset.findUnique({
      where: { id }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Calculate new book value if acquisition cost or useful life changed
    let bookValue = asset.bookValue
    if (acquisitionCost !== asset.acquisitionCost || usefulLife !== asset.usefulLife) {
      const yearsElapsed = (new Date().getTime() - new Date(acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      bookValue = Math.max(0, acquisitionCost - (annualDepreciation * yearsElapsed))
    }

    const fullyDepreciated = bookValue <= 0

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        description: description || null,
        category,
        acquisitionCost,
        acquisitionDate: new Date(acquisitionDate),
        usefulLife,
        annualDepreciation,
        bookValue,
        fullyDepreciated,
        costCenter,
        location: location || null,
        serialNumber: serialNumber || null,
        manufacturer: manufacturer || null,
        model: model || null,
        status
      }
    })

    return NextResponse.json({ asset: updatedAsset })
  } catch (error) {
    console.error('Error updating asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete asset
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })
    }

    await prisma.asset.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
