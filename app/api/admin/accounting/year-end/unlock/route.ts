import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Unlock Year-End Closing
 * Unlocks the fiscal year for modifications (for testing/corrections)
 */
export async function POST(request: NextRequest) {
  console.log('[YEAR-END UNLOCK] API Called')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[YEAR-END UNLOCK] Session:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const year = body.year || new Date().getFullYear()
    
    console.log('[YEAR-END UNLOCK] Unlocking year:', year)

    // Check if balance sheet exists
    const balanceSheet = await prisma.balanceSheet.findUnique({
      where: { year }
    })

    if (!balanceSheet) {
      return NextResponse.json({
        success: false,
        error: 'Keine Bilanz für dieses Jahr gefunden'
      }, { status: 404 })
    }

    if (!balanceSheet.locked) {
      return NextResponse.json({
        success: false,
        error: 'Geschäftsjahr ist nicht gesperrt'
      }, { status: 400 })
    }

    // Unlock the balance sheet
    await prisma.balanceSheet.update({
      where: { id: balanceSheet.id },
      data: {
        locked: false,
        lockedAt: null
      }
    })

    console.log('[YEAR-END UNLOCK] Year unlocked successfully')

    return NextResponse.json({
      success: true,
      message: `Geschäftsjahr ${year} wurde entsperrt`
    })
  } catch (error) {
    console.error('[YEAR-END UNLOCK] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Entsperren des Geschäftsjahres'
    }, { status: 500 })
  }
}
