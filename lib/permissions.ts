import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Simple admin check - for routes that should only be accessed by true ADMINs
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    )
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Check if user is ADMIN or B24_EMPLOYEE (any employee, regardless of permissions)
 * Useful for admin pages that all employees should see
 */
export async function requireAdminOrEmployee(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    )
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
    return NextResponse.json(
      { error: 'Staff access required' },
      { status: 403 }
    )
  }

  return null
}
