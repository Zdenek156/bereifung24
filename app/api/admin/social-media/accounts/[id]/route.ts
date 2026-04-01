import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import * as socialMediaService from '@/lib/social-media/socialMediaService'

// PUT /api/admin/social-media/accounts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const body = await req.json()
    // Don't overwrite token with empty string when editing other fields
    const updateData = { ...body }
    if ('accessToken' in updateData && !updateData.accessToken) {
      delete updateData.accessToken
    }
    const account = await socialMediaService.updateAccount(params.id, updateData)
    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

// DELETE /api/admin/social-media/accounts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    await socialMediaService.deleteAccount(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
