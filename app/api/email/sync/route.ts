import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/lib/email/email-service'

// POST /api/email/sync - E-Mails mit IMAP-Server synchronisieren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { folder, limit } = body

    const emailService = new EmailService(session.user.id)
    await emailService.syncMessages(folder || 'INBOX', limit)

    return NextResponse.json({ success: true, message: 'Sync completed' })
  } catch (error: any) {
    console.error('Error syncing messages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync messages' },
      { status: 500 }
    )
  }
}
