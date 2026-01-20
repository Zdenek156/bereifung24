import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// POST - Hilfe anbieten
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const body = await request.json()
    const { taskId, message } = body

    // Check if help already offered
    const existing = await prisma.roadmapTaskHelpOffer.findUnique({
      where: {
        taskId_helperId: {
          taskId,
          helperId: currentEmployee.id
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Already offered help' }, { status: 400 })
    }

    const helpOffer = await prisma.roadmapTaskHelpOffer.create({
      data: {
        taskId,
        helperId: currentEmployee.id,
        message,
        status: 'OFFERED'
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: helpOffer 
    })

  } catch (error) {
    console.error('Error offering help:', error)
    return NextResponse.json({ error: 'Failed to offer help' }, { status: 500 })
  }
}

// GET - Meine Hilfsangebote
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    const offers = await prisma.roadmapTaskHelpOffer.findMany({
      where: {
        helperId: currentEmployee!.id
      },
      include: {
        task: {
          include: {
            assignedTo: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ success: true, data: offers })

  } catch (error) {
    console.error('Error fetching help offers:', error)
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }
}
