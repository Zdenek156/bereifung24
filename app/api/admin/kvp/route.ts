import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

// GET - List all improvement suggestions
export async function GET(request: NextRequest) {
  try {
    // Check permission - requires 'kvp' read access
    const permissionError = await requirePermission('kvp', 'read')
    if (permissionError) return permissionError

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')

    const suggestions = await prisma.improvementSuggestion.findMany({
      where: {
        ...(status && { status }),
        ...(category && { category }),
        ...(priority && { priority })
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error fetching improvement suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}

// POST - Create new improvement suggestion
export async function POST(request: NextRequest) {
  try {
    // Check permission - requires 'kvp' write access
    const permissionError = await requirePermission('kvp', 'write')
    if (permissionError) return permissionError

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get employee ID - for ADMIN users, we need to find or create a B24Employee entry
    let employeeId = session.user.b24EmployeeId
    
    if (!employeeId && session.user.role === 'ADMIN') {
      // For admins without B24Employee entry, create one
      const adminEmployee = await prisma.b24Employee.findFirst({
        where: { userId: session.user.id }
      })
      
      if (adminEmployee) {
        employeeId = adminEmployee.id
      } else {
        // Create B24Employee for admin
        const newEmployee = await prisma.b24Employee.create({
          data: {
            userId: session.user.id,
            firstName: session.user.name?.split(' ')[0] || 'Admin',
            lastName: session.user.name?.split(' ').slice(1).join(' ') || 'User',
            email: session.user.email || ''
          }
        })
        employeeId = newEmployee.id
      }
    }
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Unauthorized - No employee profile found' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      priority,
      estimatedEffort,
      plannedDate
    } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    const suggestion = await prisma.improvementSuggestion.create({
      data: {
        title,
        description,
        category,
        priority: priority || 'MEDIUM',
        estimatedEffort,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        submittedById: employeeId,
        status: 'NEW'
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // TODO: Send notification to admins/reviewers

    return NextResponse.json(suggestion, { status: 201 })
  } catch (error) {
    console.error('Error creating improvement suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    )
  }
}
