import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Tire Pricing By Size API
 * Manages pricing per rim size (13-23")
 * 
 * GET    /api/workshop/tire-pricing - Get all tire pricing by size
 * POST   /api/workshop/tire-pricing - Create or update tire pricing
 * DELETE /api/workshop/tire-pricing - Delete tire pricing
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: {
        tirePricingBySizes: {
          orderBy: [{ vehicleType: 'asc' }, { rimSize: 'asc' }],
        },
      },
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: workshop.tirePricingBySizes,
    })
  } catch (error) {
    console.error('Error fetching tire pricing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tire pricing' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const body = await request.json()
    const { rimSize, vehicleType, fixedMarkup, percentMarkup, includeVat } = body

    // Validation
    if (!rimSize || !vehicleType) {
      return NextResponse.json(
        { error: 'rimSize and vehicleType are required' },
        { status: 400 }
      )
    }

    if (rimSize < 13 || rimSize > 23) {
      return NextResponse.json(
        { error: 'rimSize must be between 13 and 23' },
        { status: 400 }
      )
    }

    if (!['AUTO', 'MOTO'].includes(vehicleType)) {
      return NextResponse.json(
        { error: 'vehicleType must be AUTO or MOTO' },
        { status: 400 }
      )
    }

    // Upsert tire pricing
    const tirePricing = await prisma.tirePricingBySize.upsert({
      where: {
        workshopId_rimSize_vehicleType: {
          workshopId: workshop.id,
          rimSize: parseInt(rimSize),
          vehicleType,
        },
      },
      update: {
        fixedMarkup: parseFloat(fixedMarkup) || 0,
        percentMarkup: parseFloat(percentMarkup) || 0,
        includeVat: includeVat || false,
      },
      create: {
        workshopId: workshop.id,
        rimSize: parseInt(rimSize),
        vehicleType,
        fixedMarkup: parseFloat(fixedMarkup) || 0,
        percentMarkup: parseFloat(percentMarkup) || 0,
        includeVat: includeVat || false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Tire pricing saved',
      data: tirePricing,
    })
  } catch (error) {
    console.error('Error saving tire pricing:', error)
    return NextResponse.json(
      { error: 'Failed to save tire pricing' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const rimSize = searchParams.get('rimSize')
    const vehicleType = searchParams.get('vehicleType')

    if (!rimSize || !vehicleType) {
      return NextResponse.json(
        { error: 'rimSize and vehicleType are required' },
        { status: 400 }
      )
    }

    await prisma.tirePricingBySize.delete({
      where: {
        workshopId_rimSize_vehicleType: {
          workshopId: workshop.id,
          rimSize: parseInt(rimSize),
          vehicleType,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Tire pricing deleted',
    })
  } catch (error) {
    console.error('Error deleting tire pricing:', error)
    return NextResponse.json(
      { error: 'Failed to delete tire pricing' },
      { status: 500 }
    )
  }
}
