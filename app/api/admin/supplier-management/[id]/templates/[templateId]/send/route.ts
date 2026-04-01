import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// POST /api/admin/supplier-management/[id]/templates/[templateId]/send
// Send an email template to a specific recipient
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipientEmail, recipientName, workshopId, customValues } = body

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Empfänger-E-Mail ist erforderlich' }, { status: 400 })
    }

    // Fetch template
    const template = await prisma.supplierEmailTemplate.findUnique({
      where: { id: params.templateId },
      include: {
        supplier: true,
      },
    })

    if (!template || template.supplierId !== params.id) {
      return NextResponse.json({ error: 'Template nicht gefunden' }, { status: 404 })
    }

    // Fetch workshop data if workshopId is provided
    let workshopData: any = null
    let supplierConnection: any = null

    if (workshopId) {
      workshopData = await prisma.workshop.findUnique({
        where: { id: workshopId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              city: true,
              zipCode: true,
            },
          },
        },
      })

      // Get the workshop's supplier connection for customer number
      supplierConnection = await prisma.workshopSupplier.findFirst({
        where: {
          workshopId,
          supplier: template.supplier.code,
        },
      })
    }

    // Fetch supplier contacts for B24 contact info
    const primaryContact = await prisma.supplierContact.findFirst({
      where: {
        supplierId: params.id,
        isPrimary: true,
      },
    })

    // Build placeholder replacements
    const replacements: Record<string, string> = {
      '{workshop_name}': workshopData?.companyName || customValues?.workshop_name || '',
      '{workshop_email}': workshopData?.user?.email || customValues?.workshop_email || '',
      '{workshop_phone}': workshopData?.user?.phone || customValues?.workshop_phone || '',
      '{workshop_contact_person}': workshopData?.user
        ? `${workshopData.user.firstName || ''} ${workshopData.user.lastName || ''}`.trim()
        : customValues?.workshop_contact_person || '',
      '{workshop_city}': workshopData?.user?.city || customValues?.workshop_city || '',
      '{workshop_zipcode}': workshopData?.user?.zipCode || customValues?.workshop_zipcode || '',
      '{supplier_customer_number}': supplierConnection?.usernameEncrypted
        ? '(siehe Zugangsdaten)'
        : customValues?.supplier_customer_number || '',
      '{supplier_name}': template.supplier.companyName || '',
      '{supplier_code}': template.supplier.code || '',
      '{b24_contact_name}': primaryContact
        ? `${primaryContact.firstName} ${primaryContact.lastName}`
        : 'Bereifung24 Team',
      '{b24_contact_email}': primaryContact?.email || 'info@bereifung24.de',
      '{referral_code}': customValues?.referral_code || '',
      '{registration_url}': customValues?.registration_url || '',
      // Custom values override
      ...Object.fromEntries(
        Object.entries(customValues || {}).map(([k, v]) => [`{${k}}`, v as string])
      ),
    }

    // Replace placeholders in subject and body
    let finalSubject = template.subject
    let finalBody = template.bodyHtml

    for (const [placeholder, value] of Object.entries(replacements)) {
      finalSubject = finalSubject.replaceAll(placeholder, value)
      finalBody = finalBody.replaceAll(placeholder, value)
    }

    // Wrap in professional HTML email layout if not already wrapped
    if (!finalBody.includes('<html')) {
      finalBody = `<!DOCTYPE html>
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
      <p>Reifenservice-Plattform – Lieferanten-Anbindung</p>
    </div>
    <div class="content">
      ${finalBody}
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde über die Bereifung24 Lieferantenverwaltung versendet.</p>
      <p>Bei Fragen: <a href="mailto:info@bereifung24.de">info@bereifung24.de</a> | <a href="https://bereifung24.de">www.bereifung24.de</a></p>
    </div>
  </div>
</body>
</html>`
    }

    // Send the email
    const result = await sendEmail({
      to: recipientEmail,
      subject: finalSubject,
      html: finalBody,
      text: finalBody.replace(/<[^>]*>/g, ''), // Strip HTML for plaintext
    })

    console.log(`✅ [Supplier Email] Template "${template.name}" sent to ${recipientEmail} by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipientEmail,
      templateName: template.name,
    })
  } catch (error) {
    console.error('❌ [Supplier Email] Send error:', error)
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
  }
}
