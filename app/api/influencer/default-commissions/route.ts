import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/influencer/default-commissions
 * Get default commission rates for displaying on landing page
 */
export async function GET() {
  try {
    // Get settings from database
    let settings = await prisma.influencerSettings.findFirst()

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.influencerSettings.create({
        data: {
          defaultPer1000Views: 300,      // €3.00
          defaultPerRegistration: 1500,   // €15.00
          defaultPerAcceptedOffer: 2500   // €25.00
        }
      })
    }

    return NextResponse.json({
      commissions: {
        per1000Views: settings.defaultPer1000Views,
        perRegistration: settings.defaultPerRegistration,
        perAcceptedOffer: settings.defaultPerAcceptedOffer
      }
    })

  } catch (error) {
    console.error('[INFLUENCER] Default commissions error:', error)
    
    // Fallback to hardcoded values if DB fails
    return NextResponse.json({
      commissions: {
        per1000Views: 300,
        perRegistration: 1500,
        perAcceptedOffer: 2500
      }
    })
  }
}
