import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Get authenticated freelancer session for API routes
 * Returns freelancer data or an error response
 */
export async function getFreelancerSession() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 }), freelancer: null, session: null }
  }

  if (session.user.role !== 'FREELANCER' && session.user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 }), freelancer: null, session: null }
  }

  // For ADMIN users checking freelancer data (e.g. impersonation), we allow them through
  // but they need to specify freelancerId in query params
  let freelancerId = session.user.freelancerId

  if (!freelancerId && session.user.role === 'ADMIN') {
    return { error: null, freelancer: null, session, isAdmin: true }
  }

  if (!freelancerId) {
    return { error: NextResponse.json({ error: 'Kein Freelancer-Profil vorhanden' }, { status: 404 }), freelancer: null, session: null }
  }

  const freelancer = await prisma.freelancer.findUnique({
    where: { id: freelancerId },
    include: { user: { select: { firstName: true, lastName: true, email: true, phone: true, street: true, zipCode: true, city: true } } }
  })

  if (!freelancer) {
    return { error: NextResponse.json({ error: 'Freelancer nicht gefunden' }, { status: 404 }), freelancer: null, session: null }
  }

  if (freelancer.status !== 'ACTIVE') {
    return { error: NextResponse.json({ error: 'Freelancer-Account nicht aktiv' }, { status: 403 }), freelancer: null, session: null }
  }

  return { error: null, freelancer, session, isAdmin: false }
}

/**
 * Commission calculation logic per spec
 */
export function calculateFreelancerCommission(bookingAmount: number, tierPercentage: number) {
  const b24GrossCommission = bookingAmount * 0.069     // 6.9%
  const stripeFee = bookingAmount * 0.014 + 0.25       // 1.4% + 0.25€
  const b24NetCommission = b24GrossCommission - stripeFee
  const freelancerAmount = b24NetCommission * (tierPercentage / 100)

  return {
    bookingAmount,
    b24GrossCommission: Math.round(b24GrossCommission * 100) / 100,
    stripeFee: Math.round(stripeFee * 100) / 100,
    b24NetCommission: Math.round(b24NetCommission * 100) / 100,
    freelancerPercentage: tierPercentage,
    freelancerAmount: Math.round(freelancerAmount * 100) / 100,
  }
}

/**
 * Get tier percentage based on active workshop count
 */
export function getTierInfo(activeWorkshopCount: number): { tier: 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD', percentage: number, label: string, color: string } {
  if (activeWorkshopCount >= 31) {
    return { tier: 'GOLD', percentage: 30, label: 'Gold', color: 'text-amber-500' }
  }
  if (activeWorkshopCount >= 11) {
    return { tier: 'SILVER', percentage: 25, label: 'Silber', color: 'text-blue-500' }
  }
  if (activeWorkshopCount >= 3) {
    return { tier: 'BRONZE', percentage: 20, label: 'Bronze', color: 'text-orange-500' }
  }
  return { tier: 'STARTER', percentage: 15, label: 'Starter', color: 'text-gray-500' }
}

/**
 * Get workshop health status
 */
export function getWorkshopHealth(bookingsLastMonth: number, isProfileComplete: boolean): { status: 'green' | 'yellow' | 'red', label: string } {
  if (bookingsLastMonth >= 5 && isProfileComplete) {
    return { status: 'green', label: 'Gesund' }
  }
  if (bookingsLastMonth >= 1 || !isProfileComplete) {
    return { status: 'yellow', label: 'Achtung' }
  }
  return { status: 'red', label: 'Kritisch' }
}
