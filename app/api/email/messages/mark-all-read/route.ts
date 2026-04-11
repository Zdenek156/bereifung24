import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/lib/email/email-service'

// POST /api/email/messages/mark-all-read - Alle E-Mails als gelesen markieren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { folder } = body

    const isB24Employee = session.user?.role === 'B24_EMPLOYEE'
    const emailService = new EmailService(session.user.id, isB24Employee)

    const count = await emailService.markAllAsRead(folder || 'INBOX')

    return NextResponse.json({ success: true, markedAsRead: count })
  } catch (error: any) {
    console.error('Error marking all as read:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark all as read' },
      { status: 500 }
    )
  }
}
