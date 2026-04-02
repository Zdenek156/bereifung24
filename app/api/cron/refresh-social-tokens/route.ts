import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'social-media-token-refresh',
    description: 'Refreshes Instagram, Facebook & Threads tokens before they expire (60-day tokens)',
  })
}

// POST: Refresh social media tokens nearing expiry
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Token Refresh] Starting social media token refresh...')

    const now = new Date()
    // Refresh tokens expiring within the next 7 days
    const threshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const accounts = await prisma.socialMediaAccount.findMany({
      where: {
        isActive: true,
        accessToken: { not: null },
        OR: [
          { tokenExpiresAt: { lt: threshold } },
          { tokenExpiresAt: null },
        ],
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        accessToken: true,
        tokenExpiresAt: true,
      },
    })

    console.log(`[Token Refresh] Found ${accounts.length} accounts to check`)

    // Load Meta App credentials from DB for Facebook token refresh
    const metaSecrets = await prisma.adminApiSetting.findMany({
      where: { key: { in: ['META_APP_ID', 'META_APP_SECRET'] } },
      select: { key: true, value: true },
    })
    const metaAppId = metaSecrets.find(s => s.key === 'META_APP_ID')?.value || ''
    const metaAppSecret = metaSecrets.find(s => s.key === 'META_APP_SECRET')?.value || ''

    const results: Array<{ account: string; platform: string; status: string; expiresAt?: string }> = []

    for (const account of accounts) {
      // Only refresh Meta platform tokens (Instagram, Facebook, Threads)
      const token = account.accessToken || ''
      const isMetaToken = token.startsWith('IGAAg') || token.startsWith('EAAW') || token.startsWith('THAA')
      
      if (!isMetaToken) {
        results.push({
          account: account.accountName || account.id,
          platform: account.platform,
          status: 'skipped - not a Meta platform token',
        })
        continue
      }

      try {
        console.log(`[Token Refresh] Refreshing ${account.platform}: ${account.accountName}`)

        // Determine the correct refresh endpoint per token type
        let refreshUrl: string
        if (token.startsWith('IGAAg')) {
          // Instagram Business Login API tokens
          refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
        } else if (token.startsWith('EAAW')) {
          // Facebook Page tokens - use Graph API
          refreshUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${token}`
        } else if (token.startsWith('THAA')) {
          // Threads tokens - use Threads API refresh
          refreshUrl = `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${token}`
        } else {
          continue
        }
        const res = await fetch(refreshUrl)
        const data = await res.json()

        if (data.access_token) {
          const expiresIn = data.expires_in
          const expiresAt = expiresIn
            ? new Date(Date.now() + expiresIn * 1000)
            : null

          await prisma.socialMediaAccount.update({
            where: { id: account.id },
            data: {
              accessToken: data.access_token,
              tokenExpiresAt: expiresAt,
            },
          })

          const expiresStr = expiresAt
            ? expiresAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'unknown'

          console.log(`[Token Refresh] ✅ ${account.accountName} refreshed, expires: ${expiresStr}`)
          results.push({
            account: account.accountName || account.id,
            platform: account.platform,
            status: 'refreshed',
            expiresAt: expiresStr,
          })
        } else {
          const errorMsg = data.error?.message || 'Unknown error'
          console.error(`[Token Refresh] ❌ ${account.accountName}: ${errorMsg}`)
          results.push({
            account: account.accountName || account.id,
            platform: account.platform,
            status: `failed: ${errorMsg}`,
          })
        }
      } catch (error: any) {
        console.error(`[Token Refresh] ❌ ${account.accountName}:`, error.message)
        results.push({
          account: account.accountName || account.id,
          platform: account.platform,
          status: `error: ${error.message}`,
        })
      }
    }

    const summary = {
      total: results.length,
      refreshed: results.filter(r => r.status === 'refreshed').length,
      skipped: results.filter(r => r.status.startsWith('skipped')).length,
      failed: results.filter(r => r.status.startsWith('failed') || r.status.startsWith('error')).length,
    }

    console.log(`[Token Refresh] Done: ${summary.refreshed} refreshed, ${summary.skipped} skipped, ${summary.failed} failed`)

    return NextResponse.json({ success: true, summary, results })
  } catch (error: any) {
    console.error('[Token Refresh] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
