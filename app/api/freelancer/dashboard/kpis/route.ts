import { NextRequest, NextResponse } from 'next/server'
import { getFreelancerSession, getTierInfo } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/dashboard/kpis
export async function GET() {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Get workshops assigned to this freelancer
  const workshops = await prisma.workshop.findMany({
    where: { freelancerId: freelancer.id },
    select: { 
      id: true, 
      status: true,
      companyName: true,
    }
  })

  const workshopIds = workshops.map(w => w.id)
  const activeWorkshops = workshops.filter(w => w.status === 'ACTIVE')

  // Bookings this month (DirectBookings = new booking system)
  const bookingsThisMonth = workshopIds.length > 0 ? await prisma.directBooking.count({
    where: {
      workshopId: { in: workshopIds },
      createdAt: { gte: startOfMonth },
      status: { not: 'CANCELLED' },
    }
  }) : 0

  // Bookings last month
  const bookingsLastMonth = workshopIds.length > 0 ? await prisma.directBooking.count({
    where: {
      workshopId: { in: workshopIds },
      createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      status: { not: 'CANCELLED' },
    }
  }) : 0

  // Commission this month
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastPeriod = `${startOfLastMonth.getFullYear()}-${String(startOfLastMonth.getMonth() + 1).padStart(2, '0')}`

  const commissionsThisMonth = await prisma.freelancerCommission.aggregate({
    where: { freelancerId: freelancer.id, period: currentPeriod },
    _sum: { freelancerAmount: true },
  })

  const commissionsLastMonth = await prisma.freelancerCommission.aggregate({
    where: { freelancerId: freelancer.id, period: lastPeriod },
    _sum: { freelancerAmount: true },
  })

  const commissionThisMonth = Number(commissionsThisMonth._sum.freelancerAmount || 0)
  const commissionLastMonth = Number(commissionsLastMonth._sum.freelancerAmount || 0)
  const commissionChange = commissionLastMonth > 0
    ? Math.round(((commissionThisMonth - commissionLastMonth) / commissionLastMonth) * 100)
    : commissionThisMonth > 0 ? 100 : 0

  // Open leads (not yet onboarded, not lost)
  const openLeads = await prisma.freelancerLead.count({
    where: {
      freelancerId: freelancer.id,
      status: { notIn: ['ONBOARDED', 'LOST'] },
    }
  })

  // Conversion rate (all time)
  const totalLeads = await prisma.freelancerLead.count({
    where: { freelancerId: freelancer.id }
  })
  const convertedLeads = await prisma.freelancerLead.count({
    where: { freelancerId: freelancer.id, status: 'ONBOARDED' }
  })
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

  // Tier info
  const tierInfo = getTierInfo(activeWorkshops.length)

  return NextResponse.json({
    commissionThisMonth,
    commissionChange,
    activeWorkshopCount: activeWorkshops.length,
    totalWorkshopCount: workshops.length,
    bookingsThisMonth,
    bookingsChange: bookingsLastMonth > 0
      ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100)
      : bookingsThisMonth > 0 ? 100 : 0,
    openLeads,
    conversionRate,
    tier: tierInfo,
  })
}
