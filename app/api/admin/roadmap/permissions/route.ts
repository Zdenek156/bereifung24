import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Hole alle Mitarbeiter mit Roadmap-Berechtigungen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Nur für Admin oder Geschäftsführer
    const currentEmployee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { role: true, position: true }
    })

    const isAdmin = session.user.email === 'admin@bereifung24.de'
    const isCEO = currentEmployee?.position === 'Geschäftsführer'

    if (!isAdmin && !isCEO) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Hole alle Mitarbeiter mit Roadmap-Zugriff
    const employees = await prisma.b24Employee.findMany({
      where: {
        employeeApplications: {
          some: {
            applicationKey: 'roadmap'
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        employeeApplications: {
          where: {
            applicationKey: 'roadmap'
          },
          select: {
            canCreateTasks: true,
            canEditTasks: true
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    })

    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      position: emp.position,
      canCreateTasks: emp.employeeApplications[0]?.canCreateTasks || false,
      canEditTasks: emp.employeeApplications[0]?.canEditTasks || false,
      isCEO: emp.position === 'Geschäftsführer'
    }))

    return NextResponse.json({ 
      success: true, 
      data: formattedEmployees 
    })

  } catch (error) {
    console.error('Error fetching roadmap permissions:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch permissions' 
    }, { status: 500 })
  }
}

// PATCH - Update Berechtigungen für einen Mitarbeiter
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Nur für Admin oder Geschäftsführer
    const currentEmployee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { role: true, position: true }
    })

    const isAdmin = session.user.email === 'admin@bereifung24.de'
    const isCEO = currentEmployee?.position === 'Geschäftsführer'

    if (!isAdmin && !isCEO) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { employeeId, canCreateTasks, canEditTasks } = body

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    // Update Permissions
    await prisma.b24EmployeeApplication.update({
      where: {
        employeeId_applicationKey: {
          employeeId,
          applicationKey: 'roadmap'
        }
      },
      data: {
        canCreateTasks: canCreateTasks || false,
        canEditTasks: canEditTasks || false
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Berechtigungen aktualisiert' 
    })

  } catch (error) {
    console.error('Error updating roadmap permissions:', error)
    return NextResponse.json({ 
      error: 'Failed to update permissions' 
    }, { status: 500 })
  }
}
