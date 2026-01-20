import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        position: true,
        employeeApplications: {
          where: { applicationKey: 'roadmap' },
          select: {
            canCreateTasks: true,
            canEditTasks: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const isCEO = employee.position === 'Geschäftsführer'
    const permissions = employee.employeeApplications[0]

    return NextResponse.json({
      success: true,
      data: {
        canCreateTasks: permissions?.canCreateTasks || isCEO,
        canEditTasks: permissions?.canEditTasks || isCEO,
        isCEO
      }
    })

  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
  }
}
