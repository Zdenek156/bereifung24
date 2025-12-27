import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateRequestNumber } from '@/lib/procurement-utils'

// GET - List all procurement requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const costCenter = searchParams.get('costCenter')
    const category = searchParams.get('category')

    const where: any = {}
    if (status) where.status = status
    if (costCenter) where.costCenter = costCenter
    if (category) where.category = category

    const requests = await prisma.procurementRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

// POST - Create new procurement request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      estimatedPrice,
      urgency,
      costCenter,
      supplierId,
      supplierName
    } = body

    // Validation
    if (!title || !category || !estimatedPrice || !costCenter) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique request number
    let requestNumber = generateRequestNumber()
    let exists = await prisma.procurementRequest.findUnique({
      where: { requestNumber }
    })
    
    while (exists) {
      requestNumber = generateRequestNumber()
      exists = await prisma.procurementRequest.findUnique({
        where: { requestNumber }
      })
    }

    // Auto-approve requests under 250€ for ADMIN users
    const autoApprove = session.user.role === 'ADMIN' && estimatedPrice < 250
    
    const procurementRequest = await prisma.procurementRequest.create({
      data: {
        requestNumber,
        title,
        description,
        category,
        estimatedPrice: parseFloat(estimatedPrice),
        urgency: urgency || 'NORMAL',
        costCenter,
        supplierId: supplierId || null,
        supplierName: supplierName || null,
        requestedById: session.user.id,
        status: autoApprove ? 'APPROVED' : 'PENDING',
        approvedById: autoApprove ? session.user.id : null,
        approvedAt: autoApprove ? new Date() : null
      },
      include: {
        requestedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        supplier: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(procurementRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
