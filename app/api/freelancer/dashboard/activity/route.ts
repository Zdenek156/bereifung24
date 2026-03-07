import { NextResponse } from 'next/server'
import { getFreelancerSession } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/dashboard/activity - Last 10 activities
export async function GET() {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const workshopIds = (await prisma.workshop.findMany({
    where: { freelancerId: freelancer.id },
    select: { id: true, companyName: true }
  }))

  const workshopMap = new Map(workshopIds.map(w => [w.id, w.companyName]))
  const ids = workshopIds.map(w => w.id)

  // Recent bookings (DirectBookings = new booking system)
  const recentBookings = ids.length > 0 ? await prisma.directBooking.findMany({
    where: { workshopId: { in: ids } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, workshopId: true, createdAt: true, status: true, serviceType: true, totalPrice: true },
  }) : []

  // Recent lead activities
  const recentLeadActivities = await prisma.freelancerLeadActivity.findMany({
    where: { lead: { freelancerId: freelancer.id } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { lead: { select: { workshopName: true } } },
  })

  // Recent payouts
  const recentPayouts = await prisma.freelancerPayout.findMany({
    where: { freelancerId: freelancer.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  // Combine and sort all activities
  const activities: Array<{
    id: string
    type: 'booking' | 'lead_activity' | 'payout'
    description: string
    timestamp: Date
    icon: string
  }> = []

  const serviceTypeLabels: Record<string, string> = {
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räderwechsel',
    'MOTORCYCLE_TIRE': 'Motorradreifen',
    'TIRE_REPAIR': 'Reifenreparatur',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice',
    'BRAKE_SERVICE': 'Bremsservice',
    'BATTERY_SERVICE': 'Batterieservice',
  }

  recentBookings.forEach(b => {
    const svcLabel = serviceTypeLabels[b.serviceType] || b.serviceType
    const priceStr = b.totalPrice ? ` (${Number(b.totalPrice).toFixed(2)}€)` : ''
    activities.push({
      id: b.id,
      type: 'booking',
      description: `${svcLabel}${priceStr} bei ${workshopMap.get(b.workshopId) || 'Werkstatt'}`,
      timestamp: b.createdAt,
      icon: '📅',
    })
  })

  const activityTypeLabels: Record<string, string> = {
    'CALL': 'Anruf',
    'EMAIL': 'E-Mail',
    'VISIT': 'Besuch',
    'DEMO': 'Einführung',
    'NOTE': 'Notiz',
    'STATUS_CHANGE': 'Statusänderung',
  }

  recentLeadActivities.forEach(a => {
    const typeLabel = activityTypeLabels[a.type] || a.type
    activities.push({
      id: a.id,
      type: 'lead_activity',
      description: `${typeLabel}: ${a.lead.workshopName} - ${a.description.substring(0, 50)}`,
      timestamp: a.createdAt,
      icon: a.type === 'CALL' ? '📞' : a.type === 'EMAIL' ? '📧' : a.type === 'VISIT' ? '🏢' : '📝',
    })
  })

  const payoutStatusLabels: Record<string, string> = {
    'CALCULATED': 'Berechnet',
    'APPROVED': 'Genehmigt',
    'PAID': 'Ausgezahlt',
    'CANCELLED': 'Storniert',
  }

  recentPayouts.forEach(p => {
    const statusLabel = payoutStatusLabels[p.status] || p.status
    activities.push({
      id: p.id,
      type: 'payout',
      description: `Abrechnung ${p.period}: ${Number(p.totalCommission).toFixed(2)}€ (${statusLabel})`,
      timestamp: p.createdAt,
      icon: '💸',
    })
  })

  // Sort by timestamp desc, take 10
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return NextResponse.json({ activities: activities.slice(0, 5) })
}
