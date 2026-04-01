import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import {
  verifyFacebookToken,
  verifyInstagramToken,
  verifyThreadsToken,
} from '@/lib/social-media/publishingService'

// POST /api/admin/social-media/accounts/verify
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const { platform, pageId, accessToken } = await req.json()

    if (!pageId || !accessToken) {
      return NextResponse.json(
        { error: 'Page-ID und Access Token sind erforderlich' },
        { status: 400 }
      )
    }

    let result

    switch (platform) {
      case 'FACEBOOK':
        result = await verifyFacebookToken(pageId, accessToken)
        break
      case 'INSTAGRAM':
        result = await verifyInstagramToken(pageId, accessToken)
        break
      case 'THREADS':
        result = await verifyThreadsToken(pageId, accessToken)
        break
      default:
        return NextResponse.json(
          { error: `Verifizierung für ${platform} nicht verfügbar` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error verifying account:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler bei der Verifizierung' },
      { status: 500 }
    )
  }
}
