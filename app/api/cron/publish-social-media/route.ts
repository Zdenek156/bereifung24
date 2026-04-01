import { NextRequest, NextResponse } from 'next/server'
import { publishScheduledPosts } from '@/lib/social-media/publishingService'

// GET: Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'social-media-publisher',
    description: 'Publishes scheduled social media posts',
  })
}

// POST: Trigger scheduled post publishing
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Social Media Cron] Starting scheduled post publishing...')
    const results = await publishScheduledPosts()

    const summary = {
      total: results.length,
      published: results.filter((r) => r.overallStatus === 'PUBLISHED').length,
      failed: results.filter((r) => r.overallStatus === 'FAILED').length,
    }

    console.log(
      `[Social Media Cron] Done: ${summary.published}/${summary.total} published, ${summary.failed} failed`
    )

    return NextResponse.json({ success: true, summary, results })
  } catch (error: any) {
    console.error('[Social Media Cron] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Cron job failed' },
      { status: 500 }
    )
  }
}
