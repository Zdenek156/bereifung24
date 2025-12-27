import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const procurementRequest = await prisma.procurementRequest.findUnique({
      where: { id: params.id },
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
        supplier: true,
        order: {
          include: {
            supplier: true,
            items: true
          }
        },
        investmentItem: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!procurementRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(procurementRequest)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}

// PATCH - Update request (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, rejectionReason } = body

    const existing = await prisma.procurementRequest.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      const updated = await prisma.procurementRequest.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedById: session.user.id,
          approvedAt: new Date()
        },
        include: {
          requestedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          approvedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          supplier: true
        }
      })

      return NextResponse.json(updated)
    } else if (action === 'reject') {
      const updated = await prisma.procurementRequest.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          approvedById: session.user.id,
          approvedAt: new Date(),
          rejectionReason
        },
        include: {
          requestedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          approvedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

// DELETE - Delete request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.procurementRequest.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}
