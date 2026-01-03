import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/lib/email/email-service'

// GET /api/email/messages/[uid] - Einzelne E-Mail abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uid = parseInt(params.uid)
    const folder = request.nextUrl.searchParams.get('folder') || 'INBOX'

    const emailService = new EmailService(session.user.id)
    const message = await emailService.getCachedMessage(uid, folder)

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json(message)
  } catch (error: any) {
    console.error('Error fetching message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch message' },
      { status: 500 }
    )
  }
}

// PUT /api/email/messages/[uid] - E-Mail-Flags aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uid = parseInt(params.uid)
    const body = await request.json()
    const { isRead, folder } = body

    const emailService = new EmailService(session.user.id)

    if (isRead !== undefined) {
      await emailService.markAsRead(uid, folder || 'INBOX')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update message' },
      { status: 500 }
    )
  }
}

// DELETE /api/email/messages/[uid] - E-Mail löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uid = parseInt(params.uid)
    const folder = request.nextUrl.searchParams.get('folder') || 'INBOX'

    const emailService = new EmailService(session.user.id)
    await emailService.deleteMessage(uid, folder)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    )
  }
}
