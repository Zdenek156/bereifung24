import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { authenticateMobileRequest } from '@/lib/mobile-auth'

export interface AuthUser {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  customerId?: string
  workshopId?: string
}

/**
 * Unified auth helper for API routes.
 * Tries Bearer token first (mobile app), then falls back to NextAuth session (web).
 * Use this instead of getServerSession in routes that should work for both web and mobile.
 */
export async function getAuthUser(request?: NextRequest): Promise<AuthUser | null> {
  // 1. Try Bearer token (mobile app)
  if (request) {
    const mobileUser = authenticateMobileRequest(request)
    if (mobileUser) {
      return {
        id: mobileUser.userId,
        email: mobileUser.email,
        role: mobileUser.role,
        firstName: mobileUser.firstName,
        lastName: mobileUser.lastName,
        customerId: mobileUser.customerId,
        workshopId: mobileUser.workshopId,
      }
    }
  }

  // 2. Fall back to NextAuth session (web)
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      firstName: (session.user as any).firstName,
      lastName: (session.user as any).lastName,
      customerId: (session.user as any).customerId,
      workshopId: (session.user as any).workshopId,
    }
  }

  return null
}
