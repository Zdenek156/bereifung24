import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and B24_EMPLOYEE can access
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const applicationId = searchParams.get('applicationId')

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    // Admins have access to everything
    if (session.user.role === 'ADMIN') {
      return NextResponse.json({ hasAccess: true })
    }

    // Check if employee has this application
    const employee = await prisma.b24Employee.findUnique({
      where: { userId: session.user.id },
      include: {
        applications: {
          where: { applicationId: parseInt(applicationId) }
        }
      }
    })

    if (!employee || employee.applications.length === 0) {
      return NextResponse.json({ error: 'No access to this application' }, { status: 403 })
    }

    return NextResponse.json({ hasAccess: true })
  } catch (error) {
    console.error('Error checking application permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
