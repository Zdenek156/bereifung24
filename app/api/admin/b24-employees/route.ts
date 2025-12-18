import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

// GET - List all B24 employees
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employees = await prisma.b24Employee.findMany({
      include: {
        permissions: true,
        assignedWorkshops: {
          select: {
            id: true,
            companyName: true,
            city: true,
          }
        },
        _count: {
          select: {
            assignedWorkshops: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, firstName, lastName, phone, position, department, permissions } = body

    // Check if email already exists
    const existingEmployee = await prisma.b24Employee.findUnique({
      where: { email }
    })

    if (existingEmployee) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Generate setup token for password creation
    const setupToken = randomBytes(32).toString('hex')
    const setupTokenExpiry = new Date()
    setupTokenExpiry.setHours(setupTokenExpiry.getHours() + 24) // Token valid for 24 hours

    // Create employee
    const employee = await prisma.b24Employee.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        position,
        department,
        setupToken,
        setupTokenExpiry,
        password: null, // Will be set when they use the setup link
        isActive: true,
        emailVerified: false
      }
    })

    // Create permissions if provided
    if (permissions && Array.isArray(permissions)) {
      await prisma.b24EmployeePermission.createMany({
        data: permissions.map((perm: any) => ({
          employeeId: employee.id,
          resource: perm.resource,
          canRead: perm.canRead || false,
          canWrite: perm.canWrite || false,
          canDelete: perm.canDelete || false
        }))
      })
    }

    // TODO: Send setup email with token
    // await sendEmployeeSetupEmail(employee.email, employee.firstName, setupToken)

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
