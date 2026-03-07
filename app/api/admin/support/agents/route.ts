import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/support/agents
 * Get list of B24 employees and admins who can be assigned to tickets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [internalUsers, activeEmployees] = await Promise.all([
      prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: ['ADMIN', 'B24_EMPLOYEE'] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      }),
      prisma.b24Employee.findMany({
        where: {
          isActive: true,
          status: { in: ['ACTIVE', 'PROBATION'] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }),
    ])

    const internalUserEmails = new Set(internalUsers.map(user => user.email.toLowerCase()))

    const employeeOnlyAgents = activeEmployees
      .filter(employee => !internalUserEmails.has(employee.email.toLowerCase()))
      .map(employee => ({
        ...employee,
        role: 'B24_EMPLOYEE',
      }))

    const agents = [...internalUsers, ...employeeOnlyAgents].sort((a, b) => {
      const roleOrder = (role: string) => (role === 'ADMIN' ? 0 : 1)
      const roleDiff = roleOrder(a.role) - roleOrder(b.role)
      if (roleDiff !== 0) return roleDiff
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'de')
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
