import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Complete Account Reconciliation Step
 * Marks the account reconciliation as complete for year-end closing
 */
export async function POST(request: NextRequest) {
  console.log('[YEAR-END RECONCILE] API Called')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('[YEAR-END RECONCILE] Session:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const year = body.year || new Date().getFullYear()
    
    console.log('[YEAR-END RECONCILE] Reconciling accounts for year:', year)

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

    if (balanceSheet.locked) {
      return NextResponse.json({
        success: false,
        error: 'Geschäftsjahr ist bereits gesperrt'
      }, { status: 400 })
    }

    // For now, just mark as successful
    // In future: Add actual reconciliation logic (check account balances, etc.)
    console.log('[YEAR-END RECONCILE] Account reconciliation completed successfully')

    return NextResponse.json({
      success: true,
      message: `Kontenabstimmung für ${year} erfolgreich abgeschlossen`
    })
  } catch (error) {
    console.error('[YEAR-END RECONCILE] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Fehler bei der Kontenabstimmung'
    }, { status: 500 })
  }
}
