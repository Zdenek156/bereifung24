import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// POST /api/workshop/request-supplier-credentials
// Workshop requests API credentials from a supplier (e.g. TyreSystem)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        workshop: true,
      },
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Keine Werkstatt gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const { supplier, customerNumber } = body

    if (!supplier || !customerNumber) {
      return NextResponse.json({ error: 'Lieferant und Kundennummer sind erforderlich' }, { status: 400 })
    }

    // Find the supplier in SupplierManagement
    const supplierConfig = await prisma.supplierManagement.findUnique({
      where: { code: supplier },
      include: {
        emailTemplates: {
          where: {
            isActive: true,
            id: 'tmpl-tyresystem-api-zugangsdaten',
          },
        },
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    })

    if (!supplierConfig) {
      return NextResponse.json({ error: 'Lieferant nicht konfiguriert' }, { status: 404 })
    }

    // Find the template (fall back to any active template if specific one not found)
    let template = supplierConfig.emailTemplates[0]
    if (!template) {
      const anyTemplate = await prisma.supplierEmailTemplate.findFirst({
        where: {
          supplierId: supplierConfig.id,
          isActive: true,
        },
      })
      template = anyTemplate!
    }

    if (!template) {
      return NextResponse.json({ error: 'Kein E-Mail-Template für diesen Lieferanten konfiguriert' }, { status: 404 })
    }

    // Get the primary contact or supplier email
    const primaryContact = supplierConfig.contacts[0]
    const recipientEmail = primaryContact?.email || supplierConfig.email

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Keine E-Mail-Adresse für den Lieferanten hinterlegt' }, { status: 400 })
    }

    // Build placeholder replacements
    const workshop = user.workshop
    const replacements: Record<string, string> = {
      '{workshop_name}': workshop.companyName || '',
      '{workshop_email}': user.email || '',
      '{workshop_phone}': user.phone || '',
      '{workshop_contact_person}': `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      '{workshop_city}': user.city || '',
      '{workshop_zipcode}': user.zipCode || '',
      '{supplier_customer_number}': customerNumber,
      '{supplier_name}': supplierConfig.companyName || '',
      '{supplier_code}': supplierConfig.code || '',
      '{b24_contact_name}': primaryContact
        ? `${primaryContact.firstName} ${primaryContact.lastName}`
        : 'Bereifung24 Team',
      '{b24_contact_email}': primaryContact?.email || 'info@bereifung24.de',
    }

    // Replace placeholders
    let finalSubject = template.subject
    let finalBody = template.bodyHtml

    for (const [placeholder, value] of Object.entries(replacements)) {
      finalSubject = finalSubject.replaceAll(placeholder, value)
      finalBody = finalBody.replaceAll(placeholder, value)
    }

    // Wrap in HTML email layout
    const wrappedBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 640px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1e3a5f; color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
    .content { padding: 32px; }
    .info-box { background: #f0f7ff; border: 1px solid #d0e3f7; border-radius: 6px; padding: 16px 20px; margin: 16px 0; }
    .info-box h3 { margin: 0 0 8px; color: #1e3a5f; font-size: 14px; }
    .info-box code { background: #e2edf8; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    .endpoint { background: #262626; color: #4ec9b0; padding: 8px 12px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 13px; margin: 4px 0; display: block; }
    .warning { background: #fff8e1; border: 1px solid #ffd54f; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px; }
    .footer { background: #f8f9fa; border-top: 1px solid #e5e7eb; padding: 20px 32px; font-size: 12px; color: #6b7280; }
    .footer a { color: #1e3a5f; }
    table.credentials { width: 100%; border-collapse: collapse; margin: 8px 0; }
    table.credentials td { padding: 6px 10px; border: 1px solid #e5e7eb; font-size: 13px; }
    table.credentials td:first-child { background: #f8f9fa; font-weight: 600; width: 180px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bereifung24</h1>
      <p>Reifenservice-Plattform – API-Zugangsdaten Anfrage</p>
    </div>
    <div class="content">
      ${finalBody}
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch über die Bereifung24 Plattform versendet.</p>
      <p><a href="mailto:info@bereifung24.de">info@bereifung24.de</a> | <a href="https://bereifung24.de">www.bereifung24.de</a></p>
    </div>
  </div>
</body>
</html>`

    // Send the email
    const result = await sendEmail({
      to: recipientEmail,
      subject: finalSubject,
      html: wrappedBody,
      text: wrappedBody.replace(/<[^>]*>/g, ''),
    })

    console.log(`✅ [Credential Request] Workshop "${workshop.companyName}" (KD-Nr: ${customerNumber}) requested API credentials from ${supplier}. Email sent to ${recipientEmail}`)

    // Notify B24 employees who have supplier credential request notifications enabled
    try {
      const notificationRecipients = await prisma.adminNotificationSetting.findMany({
        where: { notifySupplierCredentialRequest: true }
      })

      if (notificationRecipients.length > 0) {
        const b24NotificationHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 640px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1e3a5f; color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
    .content { padding: 32px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 14px; }
    .info-table td:first-child { background: #f8f9fa; font-weight: 600; width: 200px; }
    .footer { background: #f8f9fa; border-top: 1px solid #e5e7eb; padding: 20px 32px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 TyreSystem Zugangsdaten-Anfrage</h1>
      <p>Eine Werkstatt hat API-Zugangsdaten angefordert</p>
    </div>
    <div class="content">
      <p>Folgende Werkstatt hat soeben TyreSystem API-Zugangsdaten angefordert:</p>
      <table class="info-table">
        <tr><td>Werkstatt</td><td>${workshop.companyName || 'Unbekannt'}</td></tr>
        <tr><td>Kontaktperson</td><td>${user.firstName || ''} ${user.lastName || ''}</td></tr>
        <tr><td>E-Mail</td><td>${user.email || ''}</td></tr>
        <tr><td>Telefon</td><td>${user.phone || 'Nicht angegeben'}</td></tr>
        <tr><td>PLZ / Ort</td><td>${user.zipCode || ''} ${user.city || ''}</td></tr>
        <tr><td>Kundennummer</td><td><strong>${customerNumber}</strong></td></tr>
        <tr><td>Lieferant</td><td>${supplierConfig.companyName || supplier}</td></tr>
        <tr><td>Gesendet an</td><td>${recipientEmail}</td></tr>
      </table>
      <p style="margin-top: 16px; font-size: 13px; color: #6b7280;">Die E-Mail an den Lieferanten wurde bereits automatisch versendet.</p>
    </div>
    <div class="footer">
      <p>Diese Benachrichtigung wurde automatisch über die Bereifung24 Plattform versendet.</p>
    </div>
  </div>
</body>
</html>`

        for (const recipient of notificationRecipients) {
          try {
            await sendEmail({
              to: recipient.email,
              subject: `[B24] TyreSystem Zugangsdaten-Anfrage: ${workshop.companyName || 'Werkstatt'}`,
              html: b24NotificationHtml,
              text: `TyreSystem Zugangsdaten-Anfrage\n\nWerkstatt: ${workshop.companyName}\nKontakt: ${user.firstName} ${user.lastName}\nE-Mail: ${user.email}\nKundennummer: ${customerNumber}\nLieferant: ${supplierConfig.companyName || supplier}\nGesendet an: ${recipientEmail}`,
            })
            console.log(`📧 [Credential Request] B24 notification sent to ${recipient.email}`)
          } catch (emailErr) {
            console.error(`❌ [Credential Request] Failed to notify ${recipient.email}:`, emailErr)
          }
        }
      }
    } catch (notifyErr) {
      console.error('❌ [Credential Request] B24 notification error:', notifyErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Anfrage erfolgreich gesendet',
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('❌ [Credential Request] Error:', error)
    return NextResponse.json({ error: 'Fehler beim Senden der Anfrage' }, { status: 500 })
  }
}
