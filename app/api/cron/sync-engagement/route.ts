import { NextRequest, NextResponse } from 'next/server'
import { syncEngagement } from '@/lib/social-media/engagementSyncService'

// GET: Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'social-media-engagement-sync',
    description: 'Syncs engagement metrics (likes, comments, shares, reach, impressions) from social media platforms',
  })
}

// POST: Trigger engagement sync
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Engagement Cron] Starting engagement sync...')
    const result = await syncEngagement()
    console.log(`[Engagement Cron] Done: ${result.updated}/${result.total} updated, ${result.errors} errors`)

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[Engagement Cron] Error:', error)
    return NextResponse.json({ error: error.message || 'Engagement sync failed' }, { status: 500 })
  }
}
