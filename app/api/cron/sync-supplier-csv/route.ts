import { NextRequest, NextResponse } from 'next/server'
import { syncAllCSVSuppliers } from '@/lib/services/csvSupplierService'

/**
 * CSV Supplier Cron Job API
 * 
 * GET /api/cron/sync-supplier-csv - Sync all active CSV suppliers (hourly)
 * 
 * This endpoint should be called by a cron service (e.g., GitHub Actions, Vercel Cron, or external cron job)
 * Recommended schedule: Every hour (0 * * * *)
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting CSV supplier sync...')
    
    const results = await syncAllCSVSuppliers()

    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results.map(r => ({
        workshop: r.workshopId,
        supplier: r.supplier,
        status: r.success ? 'success' : 'error',
        imported: r.imported,
        updated: r.updated,
        error: r.error,
      })),
    }

    console.log('[CRON] CSV sync completed:', summary)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('[CRON] CSV sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
