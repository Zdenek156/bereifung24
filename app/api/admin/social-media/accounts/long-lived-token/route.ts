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

    if (platform !== 'FACEBOOK' && platform !== 'INSTAGRAM' && platform !== 'THREADS') {
      return NextResponse.json({ error: 'Long-Lived Token wird nur für Facebook/Instagram/Threads unterstützt' }, { status: 400 })
    }

    // Get Meta App credentials from adminApiSetting
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
