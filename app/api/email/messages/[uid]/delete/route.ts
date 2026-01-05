import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/lib/email/email-service'

// DELETE /api/email/messages/[uid]/delete - E-Mail in Papierkorb verschieben oder dauerhaft löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const folder = searchParams.get('folder') || 'INBOX'
    const permanent = searchParams.get('permanent') === 'true'

    const uid = parseInt(params.uid)
    if (isNaN(uid)) {
      return NextResponse.json({ error: 'Invalid UID' }, { status: 400 })
    }

    // Check if user is B24_EMPLOYEE
    const isB24Employee = session.user?.role === 'B24_EMPLOYEE'
    const emailService = new EmailService(session.user.id, isB24Employee)

    if (permanent) {
      // Dauerhaft löschen
      await emailService.deleteMessage(uid, folder)
    } else {
      // In Papierkorb verschieben
      await emailService.moveToTrash(uid, folder)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    )
  }
}
