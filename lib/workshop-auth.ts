import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { authenticateMobileRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

interface WorkshopAuth {
  userId: string
  workshopId: string
}

/**
 * Dual-auth helper: accepts both mobile Bearer tokens and web sessions.
 * Returns { userId, workshopId } or null if unauthorized.
 */
export async function authenticateWorkshopRequest(
  request: NextRequest
): Promise<WorkshopAuth | null> {
  // 1. Try mobile Bearer token first
  const mobilePayload = authenticateMobileRequest(request)
  if (mobilePayload) {
    if (mobilePayload.role !== 'WORKSHOP' || !mobilePayload.workshopId) {
      return null
    }
    return {
      userId: mobilePayload.userId,
      workshopId: mobilePayload.workshopId,
    }
  }

  // 2. Fall back to web session
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'WORKSHOP') {
    return null
  }

  const workshop = await prisma.workshop.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!workshop) return null

  return {
    userId: session.user.id,
    workshopId: workshop.id,
  }
}
