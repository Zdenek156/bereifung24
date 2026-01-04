import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/lib/email/email-service'

// POST /api/email/drafts - Entwurf speichern
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to, cc, bcc, replyTo, subject, text, html } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject' },
        { status: 400 }
      )
    }

    const emailService = new EmailService(session.user.id)
    await emailService.saveDraft({
      to,
      cc,
      bcc,
      replyTo,
      subject,
      text,
      html,
    })

    return NextResponse.json({ success: true, message: 'Draft saved' })
  } catch (error: any) {
    console.error('Error saving draft:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save draft' },
      { status: 500 }
    )
  }
}
