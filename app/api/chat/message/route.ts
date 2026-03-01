import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

/**
 * POST /api/chat/message
 * Save chat message as support ticket, notify admin, confirm to customer with ticket number
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json()

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Bitte füllen Sie alle Felder aus' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Bitte geben Sie eine gültige E-Mail Adresse ein' },
        { status: 400 }
      )
    }

    // Get next ticket number atomically via PostgreSQL sequence
    const seqResult = await prisma.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval('chat_ticket_seq') AS nextval
    `
    const ticketNumber = Number(seqResult[0].nextval)
    const ticketId = `T-${String(ticketNumber).padStart(4, '0')}`

    // Save to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chatMessage = await (prisma.chatMessage as any).create({
      data: {
        name,
        email,
        message,
        status: 'NEW',
        ticketNumber,
      },
    })

    console.log(`✅ Support ticket ${ticketId} (${chatMessage.id}) created for ${email}`)

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const adminEmail = process.env.ADMIN_EMAIL || 'info@bereifung24.de'
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'info@bereifung24.de'

    // ── 1. Admin-Benachrichtigungsmail ────────────────────────────────
    try {
      await transporter.sendMail({
        from: `"Bereifung24 Chat" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        replyTo: email,
        subject: `💬 [${ticketId}] Neue Support-Anfrage von ${name}`,
        html: `
          <!DOCTYPE html><html><head><meta charset="utf-8">
          <style>
            body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
            .container{max-width:600px;margin:0 auto;padding:20px}
            .header{background:linear-gradient(135deg,#2563eb,#1e40af);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center}
            .content{background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-top:none}
            .msg-box{background:white;padding:20px;border-radius:8px;border-left:4px solid #2563eb;margin:20px 0}
            .footer{text-align:center;padding:15px;color:#6b7280;font-size:12px;border:1px solid #e5e7eb;border-top:none}
            .button{display:inline-block;background:#2563eb;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;margin-top:15px}
          </style></head><body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0">💬 Neue Support-Anfrage</h1>
              <p style="margin:8px 0 0 0;opacity:.9">Ticket: <strong>${ticketId}</strong></p>
            </div>
            <div class="content">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Eingang:</strong> ${new Date().toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' })}</p>
              <div class="msg-box"><p style="margin:0;white-space:pre-wrap">${message}</p></div>
              <a href="https://bereifung24.de/admin/support" class="button">Ticket öffnen →</a>
            </div>
            <div class="footer">Ticket ${ticketId} · Bereifung24 Support</div>
          </div></body></html>
        `,
        text: `Neue Support-Anfrage ${ticketId}\nVon: ${name} <${email}>\n\n${message}`,
      })
      console.log('✅ Admin notification sent')
    } catch (err) {
      console.error('❌ Admin email failed:', err)
    }

    // ── 2. Kunden-Bestätigungsmail ────────────────────────────────────
    try {
      // Try to load custom template from DB
      const dbTemplate = await prisma.emailTemplate.findUnique({
        where: { key: 'SUPPORT_TICKET_CONFIRMATION' },
      })

      let htmlContent: string
      let subjectLine: string

      if (dbTemplate?.isActive) {
        const replacePlaceholders = (text: string) =>
          text
            .replace(/\{\{customerName\}\}/g, name)
            .replace(/\{\{ticketNumber\}\}/g, ticketId)
            .replace(/\{\{message\}\}/g, message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
            .replace(/\{\{supportEmail\}\}/g, supportEmail)
            .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }))

        htmlContent = replacePlaceholders(dbTemplate.htmlContent)
        subjectLine = replacePlaceholders(dbTemplate.subject)
      } else {
        subjectLine = `Ihre Anfrage bei Bereifung24 – Ticket ${ticketId}`
        htmlContent = `
          <!DOCTYPE html><html><head><meta charset="utf-8">
          <style>
            body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
            .container{max-width:600px;margin:0 auto;padding:20px}
            .header{background:linear-gradient(135deg,#2563eb,#1e40af);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center}
            .content{background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-top:none}
            .ticket-box{background:white;border:2px solid #2563eb;border-radius:12px;padding:20px;text-align:center;margin:20px 0}
            .ticket-num{font-size:30px;font-weight:bold;color:#2563eb;letter-spacing:3px}
            .msg-box{background:#f3f4f6;padding:15px;border-radius:8px;font-size:13px;color:#6b7280;margin:20px 0}
            .footer{text-align:center;padding:15px;color:#9ca3af;font-size:11px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px}
          </style></head><body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;font-size:22px">🔧 Bereifung24 Support</h1>
              <p style="margin:8px 0 0 0;opacity:.9;font-size:14px">Wir haben Ihre Anfrage erhalten</p>
            </div>
            <div class="content">
              <p>Hallo <strong>${name}</strong>,</p>
              <p>vielen Dank für Ihre Nachricht! Wir haben Ihre Anfrage erhalten und werden sie so schnell wie möglich bearbeiten.</p>
              <div class="ticket-box">
                <p style="margin:0 0 5px 0;font-size:13px;color:#6b7280">Ihre Ticketnummer</p>
                <div class="ticket-num">${ticketId}</div>
                <p style="margin:8px 0 0 0;font-size:12px;color:#9ca3af">Bitte geben Sie diese Nummer bei Rückfragen an</p>
              </div>
              <div class="msg-box">
                <strong style="color:#374151">Ihre Nachricht:</strong><br>
                <em>${message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</em>
              </div>
              <p>Wir melden uns in der Regel innerhalb von <strong>24 Stunden</strong> bei Ihnen.</p>
              <p>Bei dringenden Fragen erreichen Sie uns unter: <a href="mailto:${supportEmail}">${supportEmail}</a></p>
              <p style="margin-top:20px">Mit freundlichen Grüßen,<br><strong>Ihr Bereifung24 Support-Team</strong></p>
            </div>
            <div class="footer">
              Bereifung24 · <a href="https://bereifung24.de" style="color:#9ca3af">bereifung24.de</a><br>
              Ticket ${ticketId} · ${new Date().toLocaleDateString('de-DE')}
            </div>
          </div></body></html>
        `
      }

      await transporter.sendMail({
        from: `"Bereifung24 Support" <${process.env.SMTP_USER}>`,
        to: email,
        replyTo: supportEmail,
        subject: subjectLine,
        html: htmlContent,
        text: `Hallo ${name},\n\nIhre Anfrage ist bei uns eingegangen. Ticketnummer: ${ticketId}\n\nWir melden uns so schnell wie möglich.\n\nIhre Nachricht:\n${message}\n\nBereifung24 Support-Team`,
      })
      console.log(`✅ Confirmation email sent to ${email} (${ticketId})`)
    } catch (err) {
      console.error('❌ Customer confirmation email failed:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Nachricht erfolgreich gesendet',
      ticketId,
    })
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
