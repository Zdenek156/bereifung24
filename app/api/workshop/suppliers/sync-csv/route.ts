import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncSupplierCSV } from '@/lib/services/csvSupplierService'

/**
 * CSV Supplier Sync API
 * 
 * POST /api/workshop/suppliers/sync-csv - Sync CSV supplier inventory
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get workshop
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Workshop not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { supplierId } = body

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    // Start CSV sync in background (don't wait for completion to avoid timeout)
    setImmediate(async () => {
      try {
        await syncSupplierCSV(workshop.id, supplierId)
        console.log(`[CSV-SYNC] Background sync completed for supplier ${supplierId}`)
      } catch (error) {
        console.error(`[CSV-SYNC] Background sync failed for supplier ${supplierId}:`, error)
      }
    })

    // Return immediately (sync runs in background)
    return NextResponse.json({
      success: true,
      message: 'CSV-Synchronisierung gestartet (läuft im Hintergrund)',
      note: 'Die Synchronisierung läuft jetzt im Hintergrund und kann einige Minuten dauern. Status wird automatisch aktualisiert.',
    })
  } catch (error) {
    console.error('CSV sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
