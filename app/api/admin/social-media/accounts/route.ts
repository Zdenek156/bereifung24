import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import * as socialMediaService from '@/lib/social-media/socialMediaService'

// GET /api/admin/social-media/accounts
export async function GET() {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const accounts = await socialMediaService.getAccounts()
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

// POST /api/admin/social-media/accounts
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    const { platform, accountName, pageId, accessToken, refreshToken, tokenExpiresAt } = body

    if (!platform || !accountName) {
      return NextResponse.json(
        { error: 'platform and accountName are required' },
        { status: 400 }
      )
    }

    const account = await socialMediaService.createAccount({
      platform,
      accountName,
      pageId,
      accessToken,
      refreshToken,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
