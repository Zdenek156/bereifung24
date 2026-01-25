import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

/**
 * Invoice Email Service
 * Sends monthly commission invoices to workshops
 */

interface EmailResult {
  success: boolean
  error?: string
}

/**
 * Send invoice email to workshop with PDF attachment
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<EmailResult> {
  try {
    // Get invoice with all details
    const invoice = await prisma.commissionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        workshop: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
                street: true,
                zipCode: true,
                city: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    if (!invoice.workshop.user?.email) {
      return { success: false, error: 'Workshop email not found' }
    }

    if (!invoice.pdfUrl) {
      return { success: false, error: 'PDF not generated yet' }
    }

    // Get email template
    const template = await prisma.emailTemplate.findUnique({
      where: { key: 'MONTHLY_INVOICE_WORKSHOP' }
    })

    if (!template || !template.isActive) {
      return { success: false, error: 'Email template not found or inactive' }
    }

    // Get invoice settings for email credentials
    const invoiceSettings = await prisma.invoiceSettings.findFirst()
    
    if (!invoiceSettings?.invoiceEmail || !invoiceSettings?.invoicePassword) {
      return { success: false, error: 'Invoice email credentials not configured. Please set email and password in /admin/invoices/settings' }
    }

    // Get SMTP settings from any EmailSettings (for host, port, secure)
    const emailSettings = await prisma.emailSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!emailSettings) {
      return { success: false, error: 'SMTP settings not found. Please configure email settings in /admin/email-settings' }
    }

    // Use invoice-specific credentials
    const fromEmail = invoiceSettings.invoiceEmail
    const fromName = 'Bereifung24 Rechnungsversand'

    // Format data for email
    const lineItems = invoice.lineItems as any[]
    const periodMonth = invoice.periodEnd.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    const periodStart = new Date(invoice.periodStart)
    periodStart.setDate(1)
    const periodEnd = new Date(invoice.periodEnd)
    const lastDay = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0).getDate()
    periodEnd.setDate(lastDay)

    const formatEUR = (amount: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount)
    }

    // Generate commission items HTML
    const commissionItemsHtml = lineItems.map(item => `
      <li class="commission-item">
        <span>${item.description}</span>
        <strong>${formatEUR(item.total)}</strong>
      </li>
    `).join('')

    // Replace placeholders in template
    let htmlContent = template.htmlContent
    const placeholders = {
      workshopName: invoice.workshop.companyName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt.toLocaleDateString('de-DE'),
      periodMonth,
      periodStart: periodStart.toLocaleDateString('de-DE'),
      periodEnd: periodEnd.toLocaleDateString('de-DE'),
      commissionCount: lineItems.length.toString(),
      totalAmount: formatEUR(parseFloat(invoice.totalAmount.toString())),
      sepaReference: invoice.sepaPaymentId || 'Wird bei Abbuchung mitgeteilt',
      commissionItems: commissionItemsHtml,
      invoiceUrl: `https://www.bereifung24.de${invoice.pdfUrl}`
    }

    Object.entries(placeholders).forEach(([key, value]) => {
      htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })

    let subject = template.subject
    Object.entries(placeholders).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })

    // Setup email transporter with invoice credentials
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort,
      secure: emailSettings.smtpSecure,
      auth: {
        user: invoiceSettings.invoiceEmail,  // Use invoice email
        pass: invoiceSettings.invoicePassword // Use invoice password
      }
    })

    // Get PDF file path
    const pdfPath = path.join(process.cwd(), 'public', invoice.pdfUrl)
    
    if (!fs.existsSync(pdfPath)) {
      return { success: false, error: 'PDF file not found' }
    }

    // Send email
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: invoice.workshop.user.email,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: `Rechnung_${invoice.invoiceNumber}.pdf`,
          path: pdfPath
        }
      ]
    })

    // Update invoice to mark as sent
    await prisma.commissionInvoice.update({
      where: { id: invoiceId },
      data: {
        sentAt: new Date(),
        emailSent: true
      }
    })

    return { success: true }

  } catch (error) {
    console.error('Error sending invoice email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send invoice emails to all workshops with pending invoices
 * Called monthly on 1st of month
 */
export async function sendMonthlyInvoices(year: number, month: number): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  try {
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0, 23, 59, 59)

    // Get all invoices for the period that haven't been sent
    const invoices = await prisma.commissionInvoice.findMany({
      where: {
        periodStart: {
          gte: periodStart,
          lte: periodEnd
        },
        emailSent: false
      }
    })

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const invoice of invoices) {
      const result = await sendInvoiceEmail(invoice.id)
      
      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(`${invoice.invoiceNumber}: ${result.error}`)
      }

      // Wait 1 second between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return {
      success: true,
      sent,
      failed,
      errors
    }

  } catch (error) {
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}
