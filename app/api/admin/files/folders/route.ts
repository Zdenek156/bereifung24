import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

// POST - Create folder
export async function POST(request: NextRequest) {
  try {
    const permissionError = await requirePermission('files', 'write')
    if (permissionError) return permissionError

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get or find employee ID
    let employeeId = session.user.b24EmployeeId
    if (!employeeId && session.user.role === 'ADMIN') {
      // Admin without b24EmployeeId - find or create B24Employee
      const employee = await prisma.b24Employee.findUnique({
        where: { email: session.user.email! }
      })
      if (employee) {
        employeeId = employee.id
      } else {
        return NextResponse.json(
          { error: 'Admin employee profile not found. Please re-login.' },
          { status: 401 }
        )
      }
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee profile required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, parentId } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Check if folder with same name exists in parent
    const existingFolder = await prisma.fileFolder.findFirst({
      where: {
        name: name.trim(),
        parentId: parentId || null
      }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 400 }
      )
    }

    const folder = await prisma.fileFolder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        createdById: employeeId
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}
