import { NextRequest, NextResponse } from 'next/server'
import { syncOutreachInbox } from '@/lib/sales/outreachInbox'

// POST mit Bearer Token (CRON_SECRET) → IMAP-Sync
// GET → Health-Check
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: 'sales-outreach-inbox-sync',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
  })
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization') || ''
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const result = await syncOutreachInbox()
  return NextResponse.json({ success: true, ...result })
}
