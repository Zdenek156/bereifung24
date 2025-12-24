import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN'
    const isEmployee = session.user.role === 'B24_EMPLOYEE'
    const isSelf = isEmployee && session.user.b24EmployeeId === params.id

    // B24_EMPLOYEE can only view themselves, ADMIN can view anyone
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        assignedWorkshops: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                city: true,
              }
            }
          }
        },
        activityLogs: {
          take: 50,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

// PUT - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, firstName, lastName, phone, position, department, isActive, permissions } = body

    // Update employee basic info
    const employee = await prisma.b24Employee.update({
      where: { id: params.id },
      data: {
        email,
        firstName,
        lastName,
        phone,
        position,
        department,
        isActive
      }
    })

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Delete existing permissions
      await prisma.b24EmployeePermission.deleteMany({
        where: { employeeId: params.id }
      })

      // Create new permissions
      if (permissions.length > 0) {
        await prisma.b24EmployeePermission.createMany({
          data: permissions.map((perm: any) => ({
            employeeId: params.id,
            resource: perm.resource,
            canRead: perm.canRead || false,
            canWrite: perm.canWrite || false,
            canDelete: perm.canDelete || false
          }))
        })
      }
    }

    // Fetch updated employee with permissions
    const updatedEmployee = await prisma.b24Employee.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        assignedWorkshops: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                city: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

// DELETE - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete employee (cascades to permissions and activity logs)
    await prisma.b24Employee.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
