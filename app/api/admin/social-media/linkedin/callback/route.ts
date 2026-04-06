import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/social-media/linkedin/callback?code=xxx&state=bereifung24
// Exchanges LinkedIn OAuth code for access token and creates/updates account
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const errorDescription = req.nextUrl.searchParams.get('error_description')
  const baseUrl = 'https://bereifung24.de'

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/social-media?linkedin_error=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/social-media?linkedin_error=Kein%20Code%20erhalten', baseUrl)
    )
  }

  try {
    // Load LinkedIn credentials from API settings
    const [clientIdSetting, clientSecretSetting] = await Promise.all([
      prisma.adminApiSetting.findFirst({ where: { key: 'LINKEDIN_CLIENT_ID' } }),
      prisma.adminApiSetting.findFirst({ where: { key: 'LINKEDIN_CLIENT_SECRET' } }),
    ])

    const clientId = clientIdSetting?.value
    const clientSecret = clientSecretSetting?.value

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/admin/social-media?linkedin_error=LinkedIn%20Client-ID%20oder%20Secret%20nicht%20konfiguriert.%20Bitte%20in%20API-Einstellungen%20eintragen.', baseUrl)
      )
    }

    // Exchange code for access token
    const redirectUri = `${baseUrl}/api/admin/social-media/linkedin/callback`

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[LinkedIn OAuth] Token error:', tokenData)
      return NextResponse.redirect(
        new URL(`/admin/social-media?linkedin_error=${encodeURIComponent(tokenData.error_description || tokenData.error || 'Token-Austausch fehlgeschlagen')}`, baseUrl)
      )
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token || null
    const expiresIn = tokenData.expires_in // seconds (usually 5184000 = 60 days)

    // Try to get organization admin info (for posting as company page)
    let organizationId: string | null = null
    let organizationName: string | null = null
    let profileName = 'LinkedIn'
    let profileSub: string | null = null

    // First try userinfo (works if openid scope is available)
    try {
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        profileName = profileData.name || profileData.given_name || 'LinkedIn'
        profileSub = profileData.sub
      }
    } catch (e) {
      console.log('[LinkedIn OAuth] userinfo not available (no openid scope)')
    }

    try {
      // Use REST API with versioned headers for org lookup
      const orgResponse = await fetch(
        'https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'LinkedIn-Version': '202504',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      )

      console.log('[LinkedIn OAuth] Org lookup status:', orgResponse.status)
      const orgData = await orgResponse.json()
      console.log('[LinkedIn OAuth] Org lookup response:', JSON.stringify(orgData).substring(0, 500))

      if (orgResponse.ok && orgData.elements?.length > 0) {
        const firstOrg = orgData.elements[0]
        // Extract org ID from URN: urn:li:organization:12345 -> 12345
        const orgUrn = firstOrg.organization || firstOrg.organizationalTarget
        organizationId = orgUrn?.replace('urn:li:organization:', '') || null

        // Fetch organization name
        if (organizationId) {
          try {
            const nameRes = await fetch(
              `https://api.linkedin.com/rest/organizations/${organizationId}?fields=localizedName,vanityName`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'LinkedIn-Version': '202504',
                  'X-Restli-Protocol-Version': '2.0.0',
                },
              }
            )
            if (nameRes.ok) {
              const nameData = await nameRes.json()
              organizationName = nameData.localizedName || null
              console.log('[LinkedIn OAuth] Organization found:', organizationName, '(ID:', organizationId, ')')
            }
          } catch (e) {
            console.log('[LinkedIn OAuth] Could not fetch org name:', e)
          }
        }
      } else {
        console.log('[LinkedIn OAuth] No organizations found, will use personal profile')
      }
    } catch (e) {
      console.log('[LinkedIn OAuth] Could not fetch organizations (scope may be missing):', e)
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + (expiresIn || 5184000) * 1000)

    // Use organization if available, otherwise personal profile
    const pageId = organizationId || profileSub || 'unknown'
    const accountName = organizationName 
      ? `Bereifung24 LinkedIn (${organizationName})`
      : profileSub 
        ? `Bereifung24 LinkedIn (${profileName})`
        : 'Bereifung24 LinkedIn'

    // Check if LinkedIn account already exists
    const existingAccount = await prisma.socialMediaAccount.findFirst({
      where: { platform: 'LINKEDIN' },
    })

    if (existingAccount) {
      // Update existing account
      await prisma.socialMediaAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken,
          refreshToken,
          pageId: pageId || existingAccount.pageId,
          accountName,
          tokenExpiresAt,
          isActive: true,
        },
      })
    } else {
      // Create new account
      await prisma.socialMediaAccount.create({
        data: {
          platform: 'LINKEDIN',
          accountName,
          pageId: pageId || '',
          accessToken,
          refreshToken,
          tokenExpiresAt,
          isActive: true,
        },
      })
    }

    console.log(`[LinkedIn OAuth] Account connected: ${accountName}, pageId: ${pageId}, expires: ${tokenExpiresAt.toISOString()}`)

    return NextResponse.redirect(
      new URL(`/admin/social-media?linkedin_success=${encodeURIComponent(accountName + ' verbunden!')}`, baseUrl)
    )
  } catch (error: any) {
    console.error('[LinkedIn OAuth] Error:', error)
    return NextResponse.redirect(
      new URL(`/admin/social-media?linkedin_error=${encodeURIComponent(error.message || 'Unbekannter Fehler')}`, baseUrl)
    )
  }
}
