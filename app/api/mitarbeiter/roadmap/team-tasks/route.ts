import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Alle Tasks aller Mitarbeiter (Team-Übersicht)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignedToId = searchParams.get('assignedToId')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const month = searchParams.get('month')
    const phaseId = searchParams.get('phaseId')

    const where: any = {}

    if (assignedToId) where.assignedToId = assignedToId
    if (priority) where.priority = priority
    if (status) where.status = status
    if (month) where.month = month
    if (phaseId) where.phaseId = phaseId

    const tasks = await prisma.roadmapTask.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true
          }
        },
        phase: {
          select: {
            id: true,
            name: true,
            color: true,
            startMonth: true,
            endMonth: true
          }
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        helpOffers: {
          include: {
            helper: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
        { order: 'asc' }
      ]
    })

    return NextResponse.json({ 
      success: true, 
      data: tasks 
    })

  } catch (error) {
    console.error('Error fetching team tasks:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch team tasks' 
    }, { status: 500 })
  }
}
