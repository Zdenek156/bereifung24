import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/cron/eprel-weekly-update
 * Weekly cron job to update EPREL tire database
 * 
 * Setup in crontab or external cron service:
 * 0 3 * * 0 curl -X POST https://bereifung24.de/api/cron/eprel-weekly-update
 * (Every Sunday at 3 AM)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'change-me-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[EPREL Cron] Starting weekly EPREL update...')

    // Trigger import by calling the import API internally
    const baseUrl = process.env.NEXTAUTH_URL || 'https://bereifung24.de'
    const response = await fetch(`${baseUrl}/api/admin/eprel/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use internal admin token or create special cron user
        'Cookie': req.headers.get('cookie') || ''
      }
    })

    if (!response.ok) {
      throw new Error(`Import API returned ${response.status}`)
    }

    const result = await response.json()

    console.log('[EPREL Cron] Import triggered successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'EPREL weekly update triggered',
      importId: result.importId
    })

  } catch (error) {
    console.error('[EPREL Cron] Error triggering weekly update:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger EPREL update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    service: 'EPREL Weekly Update Cron',
    status: 'healthy',
    schedule: 'Every Sunday at 3 AM'
  })
}
