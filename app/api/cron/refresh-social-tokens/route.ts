import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'social-media-token-refresh',
    description: 'Refreshes Instagram, Facebook, Threads & LinkedIn tokens before they expire',
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
        refreshToken: true,
        tokenExpiresAt: true,
      },
    })

    console.log(`[Token Refresh] Found ${accounts.length} accounts to check`)

    // Load Meta App credentials from DB for Facebook token refresh
    const apiSecrets = await prisma.adminApiSetting.findMany({
      where: { key: { in: ['META_APP_ID', 'META_APP_SECRET', 'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'] } },
      select: { key: true, value: true },
    })
    const metaAppId = apiSecrets.find(s => s.key === 'META_APP_ID')?.value || ''
    const metaAppSecret = apiSecrets.find(s => s.key === 'META_APP_SECRET')?.value || ''
    const linkedinClientId = apiSecrets.find(s => s.key === 'LINKEDIN_CLIENT_ID')?.value || ''
    const linkedinClientSecret = apiSecrets.find(s => s.key === 'LINKEDIN_CLIENT_SECRET')?.value || ''

    const results: Array<{ account: string; platform: string; status: string; expiresAt?: string }> = []

    for (const account of accounts) {
      const token = account.accessToken || ''

      // Handle LinkedIn refresh separately (uses refresh_token grant)
      if (account.platform === 'LINKEDIN') {
        if (!account.refreshToken) {
          results.push({
            account: account.accountName || account.id,
            platform: account.platform,
            status: 'skipped - no refresh token (re-authenticate with LinkedIn to get one)',
          })
          continue
        }

        if (!linkedinClientId || !linkedinClientSecret) {
          results.push({
            account: account.accountName || account.id,
            platform: account.platform,
            status: 'skipped - LinkedIn Client-ID/Secret nicht konfiguriert',
          })
          continue
        }

        try {
          console.log(`[Token Refresh] Refreshing LINKEDIN: ${account.accountName}`)
          const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: account.refreshToken,
              client_id: linkedinClientId,
              client_secret: linkedinClientSecret,
            }).toString(),
          })
          const data = await res.json()

          if (data.access_token) {
            const expiresAt = data.expires_in
              ? new Date(Date.now() + data.expires_in * 1000)
              : null

            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || account.refreshToken,
                tokenExpiresAt: expiresAt,
              },
            })

            const expiresStr = expiresAt?.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) || 'unknown'
            console.log(`[Token Refresh] ✅ ${account.accountName} refreshed, expires: ${expiresStr}`)
            results.push({ account: account.accountName || account.id, platform: account.platform, status: 'refreshed', expiresAt: expiresStr })
          } else {
            const errorMsg = data.error_description || data.error || 'Unknown error'
            console.error(`[Token Refresh] ❌ ${account.accountName}: ${errorMsg}`)
            results.push({ account: account.accountName || account.id, platform: account.platform, status: `failed: ${errorMsg}` })
          }
        } catch (error: any) {
          console.error(`[Token Refresh] ❌ ${account.accountName}:`, error.message)
          results.push({ account: account.accountName || account.id, platform: account.platform, status: `error: ${error.message}` })
        }
        continue
      }

      // Meta platform tokens (Instagram, Facebook, Threads)
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
