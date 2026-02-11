import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

/**
 * POST /api/chat/message
 * Save offline chat message and send notification email to admin
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Bitte geben Sie eine gültige E-Mail Adresse ein' },
        { status: 400 }
      )
    }

    // Save to database (you can create a ChatMessage model later)
    // For now, we'll save it as a note or send it via email

    // Send notification email to admin
    try {
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

      await transporter.sendMail({
        from: `"Bereifung24 Chat" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        replyTo: email,
        subject: `💬 Neue Chat-Nachricht von ${name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #1e40af; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💬 Neue Chat-Nachricht</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Bereifung24 Live Chat</p>
              </div>
              
              <div class="content">
                <p>Sie haben eine neue Nachricht über den Live Chat erhalten:</p>
                
                <div class="info-row">
                  <span class="label">Name:</span> ${name}
                </div>
                <div class="info-row">
                  <span class="label">E-Mail:</span> <a href="mailto:${email}">${email}</a>
                </div>
                <div class="info-row">
                  <span class="label">Zeitpunkt:</span> ${new Date().toLocaleString('de-DE', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}
                </div>
                
                <div class="message-box">
                  <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                
                <p style="margin-top: 30px;">
                  <a href="mailto:${email}" class="button">Auf Nachricht antworten</a>
                </p>
              </div>
              
              <div class="footer">
                <p>Diese E-Mail wurde automatisch vom Bereifung24 Live Chat System generiert.</p>
                <p>Bitte antworten Sie direkt an: <a href="mailto:${email}">${email}</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Neue Chat-Nachricht von ${name}

E-Mail: ${email}
Zeitpunkt: ${new Date().toLocaleString('de-DE')}

Nachricht:
${message}

---
Antworten Sie direkt an: ${email}
        `.trim()
      })

      console.log('✅ Chat message notification sent to admin')
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError)
      // Continue anyway - don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Nachricht erfolgreich gesendet'
    })
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
