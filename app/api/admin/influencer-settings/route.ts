import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch influencer settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create settings (there should only be one row)
    let settings = await prisma.influencerSettings.findFirst()

    if (!settings) {
      // Create default settings
      settings = await prisma.influencerSettings.create({
        data: {
          defaultPer1000Views: 300,      // €3.00
          defaultPerRegistration: 1500,   // €15.00
          defaultPerAcceptedOffer: 2500   // €25.00
        }
      })
    }

    return NextResponse.json({
      settings: {
        defaultPer1000Views: settings.defaultPer1000Views,
        defaultPerRegistration: settings.defaultPerRegistration,
        defaultPerAcceptedOffer: settings.defaultPerAcceptedOffer
      }
    })

  } catch (error) {
    console.error('Influencer settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - Update influencer settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { defaultPer1000Views, defaultPerRegistration, defaultPerAcceptedOffer } = body

    // Get or create settings
    let settings = await prisma.influencerSettings.findFirst()

    if (!settings) {
      settings = await prisma.influencerSettings.create({
        data: {
          defaultPer1000Views,
          defaultPerRegistration,
          defaultPerAcceptedOffer
        }
      })
    } else {
      settings = await prisma.influencerSettings.update({
        where: { id: settings.id },
        data: {
          defaultPer1000Views,
          defaultPerRegistration,
          defaultPerAcceptedOffer
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings: {
        defaultPer1000Views: settings.defaultPer1000Views,
        defaultPerRegistration: settings.defaultPerRegistration,
        defaultPerAcceptedOffer: settings.defaultPerAcceptedOffer
      }
    })

  } catch (error) {
    console.error('Influencer settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
