import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const session = await getServerSession(authOptions)
    console.log('Stats API - Session:', session ? `User: ${session.user.email}, Role: ${session.user.role}` : 'No session')

    // Get current month start and end
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    console.log('Stats API - Fetching data for month:', monthStart.toISOString(), 'to', monthEnd.toISOString())

    // Get counts
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' }
    })

    const totalWorkshops = await prisma.workshop.count()

    const totalOffers = await prisma.offer.count()

    const acceptedOffers = await prisma.offer.count({
      where: { status: 'ACCEPTED' }
    })

    // Get monthly revenue and commission from PENDING commissions
    // These are commissions that are created but not yet billed/collected
    const monthlyCommissions = await prisma.commission.findMany({
      where: {
        billingYear: now.getFullYear(),
        billingMonth: now.getMonth() + 1, // Month is 0-indexed
        status: 'PENDING' // Only pending commissions (not yet billed or collected)
      }
    })

    const monthlyRevenue = monthlyCommissions.reduce((sum, comm) => {
      return sum + Number(comm.orderTotal)
    }, 0)

    const monthlyCommission = monthlyCommissions.reduce((sum, comm) => {
      return sum + Number(comm.commissionAmount)
    }, 0)

    const result = {
      totalCustomers,
      totalWorkshops,
      totalOffers,
      acceptedOffers,
      monthlyRevenue,
      monthlyCommission
    }

    console.log('Stats API - Returning data:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
