import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Async helper function to process tire catalog updates
 */
async function runTireCatalogUpdate(
  suppliers: Array<{
    id: string
    code: string
    name: string
    csvDownloadUrl: string | null
  }>
) {
  console.log(`[CRON] Background import started for ${suppliers.length} supplier(s)`)

  for (const supplier of suppliers) {
    try {
      console.log(`[CRON] Downloading CSV for ${supplier.name} (${supplier.code})...`)

      const csvResponse = await fetch(supplier.csvDownloadUrl!, {
        headers: {
          'User-Agent': 'Bereifung24-TireCatalog/1.0',
        },
      })

      if (!csvResponse.ok) {
        throw new Error(`HTTP ${csvResponse.status}: ${csvResponse.statusText}`)
      }

      const csvContent = await csvResponse.text()

      if (!csvContent || csvContent.trim().length === 0) {
        throw new Error('Empty CSV response')
      }

      console.log(`[CRON] Downloaded ${csvContent.length} bytes for ${supplier.code}`)

      const importResponse = await fetch('http://localhost:3000/api/admin/tire-catalog/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-internal': 'true',
        },
        body: JSON.stringify({
          supplierCode: supplier.code,
          csvContent,
        }),
      })

      if (!importResponse.ok) {
        const error = await importResponse.json()
        throw new Error(error.error || `Import failed with status ${importResponse.status}`)
      }

      const importResult = await importResponse.json()

      console.log(
        `[CRON] ✓ ${supplier.code}: ${importResult.stats.imported} imported, ${importResult.stats.updated} updated`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[CRON] ✗ Failed to update ${supplier.code}:`, errorMessage)
    }
  }

  console.log('[CRON] Background import completed')
}

/**
 * GET /api/cron/update-tire-catalogs
 * Automatic tire catalog update via CSV download links
 * 
 * Schedule:
 * - Weekly: 0 3 * * 0 (Every Sunday at 3 AM)
 * - Monthly: 0 3 1 * * (1st day of month at 3 AM)
 * 
 * Setup via crontab or external service:
 * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *   https://bereifung24.de/api/cron/update-tire-catalogs
 */

export async function POST(request: NextRequest) {
  try {
    // Check if this is a manual trigger from admin UI
    const isManualTrigger = request.headers.get('x-manual-trigger') === 'true'

    if (isManualTrigger) {
      // Verify admin session for manual triggers
      const session = await getServerSession(authOptions)
      if (!session?.user || session.user.role !== 'ADMIN') {
        console.warn('[CRON] Unauthorized manual trigger attempt')
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        )
      }
      console.log(`[CRON] Manual trigger by admin: ${session.user.email}`)

      // For manual triggers, start the process and return immediately
      // to avoid gateway timeout (504)
      const suppliers = await prisma.supplierConfig.findMany({
        where: {
          isActive: true,
          csvDownloadUrl: {
            not: null,
            not: '',
          },
        },
        select: {
          id: true,
          code: true,
          name: true,
          csvDownloadUrl: true,
        },
      })

      if (suppliers.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Keine Lieferanten mit CSV-URLs konfiguriert',
          summary: {
            total: 0,
            success: 0,
            failed: 0,
            results: [],
          },
        })
      }

      // Start the import process asynchronously (don't await)
      runTireCatalogUpdate(suppliers).catch(error => {
        console.error('[CRON] Background import error:', error)
      })

      // Return immediately with 202 Accepted
      return NextResponse.json(
        {
          success: true,
          message: `Import gestartet für ${suppliers.length} Lieferant(en). Dies kann mehrere Minuten dauern.`,
          summary: {
            total: suppliers.length,
            success: 0,
            failed: 0,
            results: suppliers.map(s => ({
              supplier: s.code,
              name: s.name,
              status: 'processing',
            })),
          },
        },
        { status: 202 }
      )
    } else {
      // Verify cron authorization for automated triggers
      const authHeader = request.headers.get('authorization')
      const expectedToken = process.env.CRON_SECRET || 'change-me-in-production'

      if (authHeader !== `Bearer ${expectedToken}`) {
        console.warn('[CRON] Unauthorized tire catalog update attempt')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      console.log('[CRON] Automated trigger')
    }

    // For automated cron triggers, run synchronously
    console.log('[CRON] Starting automatic tire catalog updates...')

    // Get all active suppliers with CSV download URLs
    const suppliers = await prisma.supplierConfig.findMany({
      where: {
        isActive: true,
        csvDownloadUrl: {
          not: null,
          not: '',
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        csvDownloadUrl: true,
      },
    })

    if (suppliers.length === 0) {
      console.log('[CRON] No suppliers with CSV download URLs found')
      return NextResponse.json({
        success: true,
        message: 'No suppliers configured for auto-update',
        updated: 0,
      })
    }

    console.log(`[CRON] Found ${suppliers.length} supplier(s) with CSV URLs`)

    const results = []

    // Process each supplier
    for (const supplier of suppliers) {
      try {
        console.log(`[CRON] Downloading CSV for ${supplier.name} (${supplier.code})...`)

        // Download CSV from URL
        const csvResponse = await fetch(supplier.csvDownloadUrl!, {
          headers: {
            'User-Agent': 'Bereifung24-TireCatalog/1.0',
          },
        })

        if (!csvResponse.ok) {
          throw new Error(`HTTP ${csvResponse.status}: ${csvResponse.statusText}`)
        }

        const csvContent = await csvResponse.text()

        if (!csvContent || csvContent.trim().length === 0) {
          throw new Error('Empty CSV response')
        }

        console.log(`[CRON] Downloaded ${csvContent.length} bytes for ${supplier.code}`)

        // Import CSV data via internal API (use localhost for internal calls)
        const importResponse = await fetch('http://localhost:3000/api/admin/tire-catalog/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Internal API call - bypass auth for cron
            'x-cron-internal': 'true',
          },
          body: JSON.stringify({
            supplierCode: supplier.code,
            csvContent,
          }),
        })

        if (!importResponse.ok) {
          const error = await importResponse.json()
          throw new Error(error.error || `Import failed with status ${importResponse.status}`)
        }

        const importResult = await importResponse.json()

        results.push({
          supplier: supplier.code,
          name: supplier.name,
          success: true,
          stats: importResult.stats,
        })

        console.log(
          `[CRON] ✓ ${supplier.code}: ${importResult.stats.imported} imported, ${importResult.stats.updated} updated`
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[CRON] ✗ Failed to update ${supplier.code}:`, errorMessage)

        results.push({
          supplier: supplier.code,
          name: supplier.name,
          success: false,
          error: errorMessage,
        })
      }
    }

    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    }

    console.log('[CRON] Tire catalog update completed:', summary)

    return NextResponse.json({
      success: true,
      message: 'Tire catalog update completed',
      summary,
    })
  } catch (error) {
    console.error('[CRON] Fatal error in tire catalog update:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET for health check and manual trigger info
export async function GET() {
  const supplierCount = await prisma.supplierConfig.count({
    where: {
      isActive: true,
      csvDownloadUrl: {
        not: null,
        not: '',
      },
    },
  })

  return NextResponse.json({
    service: 'Tire Catalog Auto-Update',
    status: 'healthy',
    suppliersConfigured: supplierCount,
    schedule: {
      weekly: '0 3 * * 0 (Every Sunday at 3 AM)',
      monthly: '0 3 1 * * (1st day of month at 3 AM)',
    },
    usage: 'POST with Authorization: Bearer YOUR_CRON_SECRET',
  })
}
