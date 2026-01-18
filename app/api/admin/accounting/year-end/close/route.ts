import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Close Fiscal Year
 * Final step: locks the year and prevents any further modifications
 */
export async function POST(request: NextRequest) {
  console.log('[YEAR-END CLOSE] API Called')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[YEAR-END CLOSE] Session:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const year = body.year || body.fiscalYear || new Date().getFullYear()
    
    console.log('[YEAR-END CLOSE] Closing year:', year)

    // Check if balance sheet exists
    const balanceSheet = await prisma.balanceSheet.findUnique({
      where: { year }
    })

    if (!balanceSheet) {
      return NextResponse.json({
        success: false,
        error: 'Keine Bilanz für dieses Jahr gefunden. Bitte erstellen Sie zuerst die Berichte.'
      }, { status: 404 })
    }

    if (balanceSheet.locked) {
      return NextResponse.json({
        success: false,
        error: 'Geschäftsjahr ist bereits gesperrt'
      }, { status: 400 })
    }

    // Lock the balance sheet
    await prisma.balanceSheet.update({
      where: { id: balanceSheet.id },
      data: {
        locked: true,
        lockedAt: new Date()
      }
    })

    console.log('[YEAR-END CLOSE] Year closed successfully')

    return NextResponse.json({
      success: true,
      message: `Geschäftsjahr ${year} wurde erfolgreich abgeschlossen und gesperrt`,
      data: {
        year,
        lockedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[YEAR-END CLOSE] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Abschließen des Geschäftsjahres'
    }, { status: 500 })
  }
}
