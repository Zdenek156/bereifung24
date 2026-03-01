import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, getEmailSettings } from '@/lib/email'
import nodemailer from 'nodemailer'

/**
 * POST /api/admin/support/[id]/reply
 * Send email reply to customer (available to both ADMIN and B24_EMPLOYEE)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { replyText } = await request.json()

    if (!replyText?.trim()) {
      return NextResponse.json({ error: 'Antworttext darf nicht leer sein' }, { status: 400 })
    }

    const ticket = await prisma.chatMessage.findUnique({
      where: { id: params.id },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket nicht gefunden' }, { status: 404 })
    }

    const senderName = session.user.name || session.user.email || 'Bereifung24 Support'

    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:20px}
.header{background:linear-gradient(135deg,#2563eb,#1e40af);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center}
.header h1{margin:0;font-size:22px}
.content{background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-top:none}
.reply-box{background:white;padding:20px;border-radius:8px;border-left:4px solid #2563eb;margin:20px 0;white-space:pre-wrap}
.original-box{background:#f3f4f6;padding:15px;border-radius:8px;margin:20px 0;font-size:13px;color:#6b7280}
.footer{text-align:center;padding:20px;color:#6b7280;font-size:12px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px}
</style></head><body>
<div class="container">
  <div class="header"><h1>🔧 Bereifung24 Support</h1><p style="margin:8px 0 0 0;opacity:.9;font-size:14px">Antwort auf Ihre Anfrage</p></div>
  <div class="content">
    <p>Hallo ${ticket.name},</p>
    <p>vielen Dank für Ihre Nachricht. Hier ist unsere Antwort:</p>
    <div class="reply-box">${replyText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    <div class="original-box"><strong>Ihre ursprüngliche Nachricht:</strong><br><em>${ticket.message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</em></div>
    <p style="font-size:13px;color:#6b7280">Mit freundlichen Grüßen,<br><strong>${senderName}</strong><br>Bereifung24 Support-Team</p>
  </div>
  <div class="footer"><p>Bei weiteren Fragen erreichen Sie uns über den Chat auf <a href="https://bereifung24.de">bereifung24.de</a>.</p></div>
</div>
</body></html>`

    const textBody = `Hallo ${ticket.name},\n\n${replyText}\n\n---\nIhre ursprüngliche Nachricht:\n${ticket.message}\n\nMit freundlichen Grüßen,\n${senderName}\nBereifung24 Support-Team`

    // Load support-specific credentials if configured
    const invoiceSettings = await prisma.invoiceSettings.findUnique({
      where: { id: 'default-settings' },
      select: { supportEmail: true, supportPassword: true },
    })

    if (invoiceSettings?.supportEmail && invoiceSettings?.supportPassword) {
      // Use dedicated support credentials with global SMTP server settings
      const globalConfig = await getEmailSettings()
      const transporter = nodemailer.createTransport({
        host: globalConfig.host,
        port: globalConfig.port,
        secure: globalConfig.port === 465,
        auth: {
          user: invoiceSettings.supportEmail,
          pass: invoiceSettings.supportPassword,
        },
      })
      await transporter.sendMail({
        from: `"Bereifung24 Support" <${invoiceSettings.supportEmail}>`,
        to: ticket.email,
        replyTo: invoiceSettings.supportEmail,
        subject: `Re: Ihre Anfrage bei Bereifung24`,
        html: htmlBody,
        text: textBody,
      })
    } else {
      // Fallback: use globally configured sendEmail (reads from email_settings table)
      await sendEmail({
        to: ticket.email,
        subject: `Re: Ihre Anfrage bei Bereifung24`,
        html: htmlBody,
        text: textBody,
      })
    }

    // Update ticket in DB
    const updatedTicket = await prisma.chatMessage.update({
      where: { id: params.id },
      data: {
        status: 'REPLIED',
        reply: replyText,
        repliedAt: new Date(),
        repliedBy: session.user.id,
      },
    })

    console.log(`✅ Reply sent to ${ticket.email} for ticket ${params.id} by ${senderName}`)

    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch (error) {
    console.error('Error sending reply:', error)
    return NextResponse.json({ error: 'Fehler beim Senden der Antwort' }, { status: 500 })
  }
}
