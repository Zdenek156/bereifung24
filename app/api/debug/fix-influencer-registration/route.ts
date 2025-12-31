import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * DEBUG: Fix influencer registration status
 * POST /api/debug/fix-influencer-registration
 */
export async function POST(request: NextRequest) {
  try {
    // Fix the influencer who was approved before the isRegistered fix
    const result = await prisma.influencer.updateMany({
      where: {
        email: 'zdenek156@gmail.com',
        isRegistered: false
      },
      data: {
        isRegistered: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Updated ${result.count} influencer(s)`,
      count: result.count
    })
  } catch (error) {
    console.error('Fix influencer registration error:', error)
    return NextResponse.json(
      { error: 'Failed to fix influencer' },
      { status: 500 }
    )
  }
}
