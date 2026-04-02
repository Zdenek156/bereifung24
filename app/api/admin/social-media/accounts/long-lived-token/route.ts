import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const { shortLivedToken, platform, accountId } = await req.json()

    // If accountId is provided, fetch the stored token from the database
    let tokenToExchange = shortLivedToken
    if (!tokenToExchange && accountId) {
      const account = await prisma.socialMediaAccount.findUnique({ where: { id: accountId } })
      if (!account || !account.accessToken) {
        return NextResponse.json({ error: 'Account nicht gefunden oder kein Token gespeichert' }, { status: 400 })
      }
      tokenToExchange = account.accessToken
    }

    if (!tokenToExchange) {
      return NextResponse.json({ error: 'Kein Token angegeben' }, { status: 400 })
    }

    if (platform !== 'FACEBOOK' && platform !== 'INSTAGRAM' && platform !== 'THREADS' && platform !== 'LINKEDIN') {
      return NextResponse.json({ error: 'Long-Lived Token wird nur für Facebook, Instagram, Threads und LinkedIn unterstützt' }, { status: 400 })
    }

    // Detect if this is an Instagram Business Login API token (starts with "IGAAg")
    const isInstagramToken = tokenToExchange.startsWith('IGAAg')

    if (isInstagramToken) {
      // ============================================
      // INSTAGRAM / THREADS - Token Refresh
      // Tokens from Meta Dashboard are ALREADY long-lived.
      // Use ig_refresh_token to extend validity by another 60 days.
      // Falls back to ig_exchange_token for short-lived tokens.
      // ============================================

      // Step 1: Try refresh first (for already long-lived tokens)
      const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${tokenToExchange}`
      const refreshRes = await fetch(refreshUrl)
      const refreshData = await refreshRes.json()

      if (refreshData.access_token) {
        // Refresh succeeded - token was already long-lived
        const refreshedToken = refreshData.access_token
        const expiresIn = refreshData.expires_in // ~5184000 = 60 days

        const expiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : null

        if (accountId) {
          await prisma.socialMediaAccount.update({
            where: { id: accountId },
            data: {
              accessToken: refreshedToken,
              tokenExpiresAt: expiresAt,
            },
          })
        }

        return NextResponse.json({
          longLivedToken: refreshedToken,
          expiresAt: expiresAt
            ? expiresAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'Unbekannt',
          expiresIn: expiresIn ? `${Math.round(expiresIn / 86400)} Tage` : 'Unbekannt',
          type: 'instagram_long_lived_token',
          info: 'Token wurde um weitere 60 Tage verlängert.',
          saved: !!accountId,
        })
      }

      // Step 2: Fallback to exchange (for short-lived tokens)
      const igAppSecretSetting = await prisma.adminApiSetting.findFirst({
        where: { key: 'INSTAGRAM_APP_SECRET' }
      })
      const metaAppSecretSetting = !igAppSecretSetting?.value
        ? await prisma.adminApiSetting.findFirst({ where: { key: 'META_APP_SECRET' } })
        : null

      const igSecret = igAppSecretSetting?.value || metaAppSecretSetting?.value

      if (!igSecret) {
        return NextResponse.json({
          error: 'Token-Refresh fehlgeschlagen und kein INSTAGRAM_APP_SECRET für Token-Exchange hinterlegt.'
        }, { status: 400 })
      }

      const exchangeUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${igSecret}&access_token=${tokenToExchange}`
      const exchangeRes = await fetch(exchangeUrl)
      const exchangeData = await exchangeRes.json()

      if (exchangeData.error) {
        return NextResponse.json({
          error: `Instagram Token-Austausch fehlgeschlagen: ${exchangeData.error.message}`
        }, { status: 400 })
      }

      const longLivedIgToken = exchangeData.access_token
      const igExpiresIn = exchangeData.expires_in

      const igExpiresAt = igExpiresIn
        ? new Date(Date.now() + igExpiresIn * 1000)
        : null

      if (accountId) {
        await prisma.socialMediaAccount.update({
          where: { id: accountId },
          data: {
            accessToken: longLivedIgToken,
            tokenExpiresAt: igExpiresAt,
          },
        })
      }

      return NextResponse.json({
        longLivedToken: longLivedIgToken,
        expiresAt: igExpiresAt
          ? igExpiresAt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : 'Unbekannt',
        expiresIn: igExpiresIn ? `${Math.round(igExpiresIn / 86400)} Tage` : 'Unbekannt',
        type: 'instagram_long_lived_token',
        info: 'Instagram Long-Lived Token (ca. 60 Tage gültig).',
        saved: !!accountId,
      })
    }

    // ============================================
    // FACEBOOK / Legacy - Long-Lived Token
    // Uses graph.facebook.com with fb_exchange_token
    // ============================================
    const [appIdSetting, appSecretSetting] = await Promise.all([
      prisma.adminApiSetting.findFirst({ where: { key: 'META_APP_ID' } }),
      prisma.adminApiSetting.findFirst({ where: { key: 'META_APP_SECRET' } }),
    ])

    if (!appIdSetting?.value || !appSecretSetting?.value) {
      return NextResponse.json({
        error: 'META_APP_ID und META_APP_SECRET müssen in den API-Einstellungen hinterlegt sein.\n\nGehe zu: Admin → API-Einstellungen\nErstelle: META_APP_ID = deine App-ID (z.B. 1611247256762915)\nErstelle: META_APP_SECRET = dein App-Geheimnis'
      }, { status: 400 })
    }

    // Step 1: Exchange short-lived token for long-lived user token
    const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appIdSetting.value}&client_secret=${appSecretSetting.value}&fb_exchange_token=${tokenToExchange}`

    const exchangeRes = await fetch(exchangeUrl)
    const exchangeData = await exchangeRes.json()

    if (exchangeData.error) {
      return NextResponse.json({
        error: `Token-Austausch fehlgeschlagen: ${exchangeData.error.message}`
      }, { status: 400 })
    }

    const longLivedUserToken = exchangeData.access_token
    const expiresIn = exchangeData.expires_in // seconds

    // Step 2: Get Page Access Token (which never expires when derived from a long-lived user token)
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedUserToken}`)
    const pagesData = await pagesRes.json()

    if (pagesData.data && pagesData.data.length > 0) {
      // Return the page access token (never-expiring)
      const page = pagesData.data[0]
      return NextResponse.json({
        longLivedToken: page.access_token,
        pageId: page.id,
        pageName: page.name,
        expiresAt: 'Nie (Page Access Token läuft nicht ab)',
        type: 'page_access_token',
        info: 'Dieser Page Access Token läuft NICHT ab, solange die App-Berechtigungen bestehen.'
      })
    }

    // Fallback: Return the long-lived user token if no pages found
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null

    return NextResponse.json({
      longLivedToken: longLivedUserToken,
      expiresAt: expiresAt
        ? new Date(expiresAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'Unbekannt',
      type: 'user_access_token',
      info: 'Long-Lived User Token (ca. 60 Tage gültig). Für einen nie ablaufenden Token, stelle sicher dass Page-Zugriff gewährt ist.'
    })
  } catch (error) {
    console.error('Error converting token:', error)
    return NextResponse.json({ error: 'Fehler bei der Token-Konvertierung' }, { status: 500 })
  }
}
