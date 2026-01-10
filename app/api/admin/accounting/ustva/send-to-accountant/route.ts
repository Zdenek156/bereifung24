import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SmtpService } from '@/lib/email/smtp-service'
import PDFDocument from 'pdfkit'

/**
 * POST /api/admin/accounting/ustva/send-to-accountant
 * Send UStVA report to accountant via email
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end date required' }, { status: 400 })
    }

    // Load company settings (for tax number and accountant contact)
    const companySettings = await prisma.companySettings.findFirst()
    
    if (!companySettings?.accountantEmail) {
      return NextResponse.json({ 
        error: 'Keine Steuerberater-E-Mail konfiguriert. Bitte unter "Buchhaltung → Steuerberater" einrichten.' 
      }, { status: 400 })
    }

    // Load email settings
    const emailSettings = await prisma.emailSettings.findFirst()
    
    if (!emailSettings?.smtpHost) {
      return NextResponse.json({ 
        error: 'Keine E-Mail-Einstellungen konfiguriert. Bitte unter "Admin → Email-Einstellungen" einrichten.' 
      }, { status: 400 })
    }

    // Fetch UStVA data
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const entries = await prisma.accountingEntry.findMany({
      where: {
        bookingDate: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        bookingDate: 'asc'
      }
    })

    // Calculate UStVA
    let line20_base = 0, line20_vat = 0  // 19%
    let line21_base = 0, line21_vat = 0  // 7%
    let line22_base = 0, line22_vat = 0  // Other rates
    let line23_taxFree = 0
    let line66_inputVat = 0

    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString())
      
      // Output VAT (Umsatzsteuer) - Accounts 8400, 8300
      if (entry.creditAccount === '8400') {
        line20_vat += amount  // 19% VAT
        line20_base += amount / 0.19
      } else if (entry.creditAccount === '8300') {
        line21_vat += amount  // 7% VAT
        line21_base += amount / 0.07
      }
      
      // Input VAT (Vorsteuer) - Accounts 1570, 1571, 1576
      if (['1570', '1571', '1576'].includes(entry.debitAccount)) {
        line66_inputVat += amount
      }
      
      // Tax-free sales - Account 8100
      if (entry.creditAccount === '8100') {
        line23_taxFree += amount
      }
    }

    const totalOutputVat = line20_vat + line21_vat + line22_vat
    const totalInputVat = line66_inputVat
    const difference = totalOutputVat - totalInputVat

    // Generate PDF
    const pdfBuffer = await generateUStVAPDF({
      startDate,
      endDate,
      taxNumber: companySettings.taxNumber || null,
      line20_base,
      line20_vat,
      line21_base,
      line21_vat,
      line22_base,
      line22_vat,
      line23_taxFree,
      line66_inputVat,
      totalOutputVat,
      totalInputVat,
      difference
    })

    // Prepare email
    const periodText = `${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}`
    const fileName = `UStVA_${startDate}_${endDate}.pdf`

    // Send email using SmtpService
    const smtpService = new SmtpService({
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort,
      secure: emailSettings.smtpPort === 465,
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPassword,
      },
    })

    await smtpService.sendMail({
      from: `"${companySettings.accountantName || 'Bereifung24'}" <${emailSettings.smtpUser}>`,
      to: companySettings.accountantEmail,
      subject: `UStVA - Umsatzsteuer-Voranmeldung ${periodText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Umsatzsteuer-Voranmeldung</h2>
          
          <p>Sehr geehrte Damen und Herren,</p>
          
          <p>anbei erhalten Sie die Umsatzsteuer-Voranmeldung für den folgenden Zeitraum:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Zeitraum:</strong> ${periodText}</p>
            <p style="margin: 5px 0;"><strong>Erstellt am:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
          </div>

          <p><strong>Zusammenfassung:</strong></p>
          <ul>
            <li>Summe Umsatzsteuer: ${formatCurrency(totalOutputVat)}</li>
            <li>Summe Vorsteuer: ${formatCurrency(totalInputVat)}</li>
            <li><strong>${difference >= 0 ? 'Zahllast' : 'Erstattung'}: ${formatCurrency(Math.abs(difference))}</strong></li>
          </ul>

          <p>Die vollständige UStVA finden Sie im Anhang.</p>
          
          <p>Mit freundlichen Grüßen<br>Ihr Bereifung24 Team</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">
            Diese E-Mail wurde automatisch generiert.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    return NextResponse.json({ 
      success: true, 
      message: 'UStVA erfolgreich versendet' 
    })

  } catch (error) {
    console.error('Error sending UStVA to accountant:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * Generate UStVA PDF
 */
async function generateUStVAPDF(data: {
  startDate: string
  endDate: string
  taxNumber: string | null
  line20_base: number
  line20_vat: number
  line21_base: number
  line21_vat: number
  line22_base: number
  line22_vat: number
  line23_taxFree: number
  line66_inputVat: number
  totalOutputVat: number
  totalInputVat: number
  difference: number
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    })

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Bereifung24 GmbH', { align: 'center' })
    if (data.taxNumber) {
      doc.fontSize(8).font('Helvetica').text(`Steuernummer: ${data.taxNumber}`, { align: 'center' })
    }
    doc.moveDown()
    
    doc.fontSize(16).font('Helvetica-Bold').text('Umsatzsteuer-Voranmeldung (UStVA)', { align: 'center' })
    doc.fontSize(10).font('Helvetica')
      .text(`Zeitraum: ${new Date(data.startDate).toLocaleDateString('de-DE')} - ${new Date(data.endDate).toLocaleDateString('de-DE')}`, { align: 'center' })
    
    doc.moveDown(2)

    // Umsatzsteuer Section
    doc.fontSize(12).font('Helvetica-Bold').text('Umsatzsteuer (zu zahlende Steuer)')
    doc.moveDown(0.5)
    
    // Line 20 - 19%
    doc.fontSize(10).font('Helvetica-Bold').text('Zeile 20: Umsatzsteuerpflichtige Umsätze zu 19%')
    doc.font('Helvetica')
    doc.text(`Bemessungsgrundlage (netto): ${formatCurrency(data.line20_base)}`, { indent: 20 })
    doc.font('Helvetica-Bold').text(`Umsatzsteuer 19%: ${formatCurrency(data.line20_vat)}`, { indent: 20 })
    doc.moveDown(0.5)

    // Line 21 - 7%
    doc.font('Helvetica-Bold').text('Zeile 21: Umsatzsteuerpflichtige Umsätze zu 7%')
    doc.font('Helvetica')
    doc.text(`Bemessungsgrundlage (netto): ${formatCurrency(data.line21_base)}`, { indent: 20 })
    doc.font('Helvetica-Bold').text(`Umsatzsteuer 7%: ${formatCurrency(data.line21_vat)}`, { indent: 20 })
    doc.moveDown(0.5)

    if (data.line22_vat > 0) {
      doc.font('Helvetica-Bold').text('Zeile 22: Andere Steuersätze')
      doc.font('Helvetica')
      doc.text(`Bemessungsgrundlage (netto): ${formatCurrency(data.line22_base)}`, { indent: 20 })
      doc.font('Helvetica-Bold').text(`Umsatzsteuer: ${formatCurrency(data.line22_vat)}`, { indent: 20 })
      doc.moveDown(0.5)
    }

    doc.moveDown(0.5)
    doc.fontSize(12).font('Helvetica-Bold').text(`Summe Umsatzsteuer: ${formatCurrency(data.totalOutputVat)}`)
    doc.moveDown(1.5)

    // Vorsteuer Section
    doc.fontSize(12).font('Helvetica-Bold').text('Vorsteuer (abziehbare Steuer)')
    doc.moveDown(0.5)
    
    doc.fontSize(10).font('Helvetica-Bold').text('Zeile 66: Vorsteuer aus Eingangsleistungen')
    doc.font('Helvetica').text(`${formatCurrency(data.line66_inputVat)}`, { indent: 20 })
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text(`Summe Vorsteuer: ${formatCurrency(data.totalInputVat)}`)
    doc.moveDown(1.5)

    // Steuerfreie Umsätze
    if (data.line23_taxFree > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Steuerfreie Umsätze')
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica').text(`Zeile 23: ${formatCurrency(data.line23_taxFree)}`)
      doc.moveDown(1.5)
    }

    // Final result
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(1)
    
    doc.fontSize(14).font('Helvetica-Bold')
      .text(data.difference >= 0 ? 'Umsatzsteuer-Zahllast:' : 'Vorsteuer-Erstattung:', 50, doc.y)
    doc.fontSize(16)
      .text(formatCurrency(Math.abs(data.difference)), 350, doc.y - 16, { align: 'right' })
    
    doc.moveDown(1)
    doc.fontSize(10).font('Helvetica')
      .text(data.difference >= 0 ? '➡️ An das Finanzamt zu zahlen' : '⬅️ Vom Finanzamt zu erstatten', { align: 'center' })

    // Footer
    doc.fontSize(8).font('Helvetica')
      .text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`, 
        50, 
        doc.page.height - 50, 
        { align: 'center' }
      )

    doc.end()
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}
