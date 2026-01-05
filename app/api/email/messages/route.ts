import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/lib/email/email-service'

// GET /api/email/messages - E-Mails aus Cache abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const folder = searchParams.get('folder') || 'INBOX'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Check if user is B24_EMPLOYEE
    const isB24Employee = session.user?.role === 'B24_EMPLOYEE'
    const emailService = new EmailService(session.user.id, isB24Employee)
    
    // Check if email settings exist
    const hasSettings = await emailService.hasSettings()
    if (!hasSettings) {
      return NextResponse.json({ messages: [], needsConfiguration: true })
    }

    const messages = await emailService.getCachedMessages(folder, limit)

    return NextResponse.json({ messages, needsConfiguration: false })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/email/messages - Neue E-Mail senden
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to, cc, bcc, replyTo, subject, text, html, attachments } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject' },
        { status: 400 }
      )
    }

    // Check if user is B24_EMPLOYEE
    const isB24Employee = session.user?.role === 'B24_EMPLOYEE'
    const emailService = new EmailService(session.user.id, isB24Employee)
    await emailService.sendEmail({
      to,
      cc,
      bcc,
      replyTo,
      subject,
      text,
      html,
      attachments,
    })

    return NextResponse.json({ success: true, message: 'Email sent' })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
