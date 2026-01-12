import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllApplications, getEmployeeApplications } from '@/lib/applications'

/**
 * Get accessible resources for the current user
 * Now uses the new Application-based system
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authorisiert' }, { status: 401 })
    }

    // Check if user has admin or employee role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    // ADMINs have access to everything
    if (session.user.role === 'ADMIN') {
      // Get all application keys
      const allApps = await getAllApplications()
      const accessibleResources = allApps.map(app => app.key)
      return NextResponse.json({ accessibleResources })
    }

    // B24_EMPLOYEE: Get assigned application keys
    if (session.user.role === 'B24_EMPLOYEE') {
      const applicationKeys = await getEmployeeApplications(session.user.id)
      return NextResponse.json({ accessibleResources: applicationKeys })
    }

    return NextResponse.json({ accessibleResources: [] })
  } catch (error) {
    console.error('Error in accessible-resources:', error)
    return NextResponse.json({ error: 'Internal server error', accessibleResources: [] }, { status: 500 })
  }
}

