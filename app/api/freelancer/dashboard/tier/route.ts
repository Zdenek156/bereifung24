import { NextResponse } from 'next/server'
import { getFreelancerSession, getTierInfo } from '@/lib/freelancer-auth'
import { prisma } from '@/lib/prisma'

// GET /api/freelancer/dashboard/tier - Current tier and progress
export async function GET() {
  const { error, freelancer } = await getFreelancerSession()
  if (error) return error
  if (!freelancer) return NextResponse.json({ error: 'Kein Freelancer-Profil' }, { status: 404 })

  const activeWorkshops = await prisma.workshop.count({
    where: { freelancerId: freelancer.id, status: 'ACTIVE' }
  })

  const tierInfo = getTierInfo(activeWorkshops)

  // Calculate progress to next tier
  let nextTier: string | null = null
  let workshopsNeeded = 0
  let progress = 0

  if (tierInfo.tier === 'STARTER') {
    nextTier = 'PRO'
    workshopsNeeded = 11 - activeWorkshops
    progress = Math.min(100, Math.round((activeWorkshops / 11) * 100))
  } else if (tierInfo.tier === 'PRO') {
    nextTier = 'EXPERT'
    workshopsNeeded = 31 - activeWorkshops
    progress = Math.min(100, Math.round(((activeWorkshops - 10) / 20) * 100))
  } else {
    nextTier = null
    workshopsNeeded = 0
    progress = 100
  }

  return NextResponse.json({
    currentTier: tierInfo.tier,
    tierLabel: tierInfo.label,
    tierColor: tierInfo.color,
    percentage: tierInfo.percentage,
    activeWorkshops,
    nextTier,
    workshopsNeeded: Math.max(0, workshopsNeeded),
    progress,
    message: nextTier
      ? `Du bist ${tierInfo.label}-Freelancer (${activeWorkshops} Werkstätten) – noch ${Math.max(0, workshopsNeeded)} Werkstätten bis ${nextTier}!`
      : `Du bist Expert-Freelancer mit ${activeWorkshops} aktiven Werkstätten! 🏆`,
  })
}
