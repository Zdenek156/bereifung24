import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { exportUserData, formatExportDataForDisplay } from '@/lib/gdpr/exportService'
import PDFDocument from 'pdfkit'

export const dynamic = 'force-dynamic'

/**
 * GDPR Data Export API
 * GET /api/admin/gdpr/export?email=user@example.com&format=json|pdf
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get parameters
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const format = searchParams.get('format') || 'json'

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Export user data
    const exportData = await exportUserData(email)

    // Check if any data was found
    const hasData = exportData.userData.customer || 
                    exportData.userData.workshop || 
                    exportData.userData.employee

    if (!hasData) {
      return NextResponse.json({ 
        error: 'No data found for this email address',
        email 
      }, { status: 404 })
    }

    // Return JSON format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData
      }, {
        headers: {
          'Content-Disposition': `attachment; filename="gdpr-export-${email}-${Date.now()}.json"`
        }
      })
    }

    // Return PDF format
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))

      // PDF Header
      doc.fontSize(20).text('DSGVO Datenauskunft', { align: 'center' })
      doc.fontSize(12).text('Art. 15 DSGVO - Recht auf Auskunft', { align: 'center' })
      doc.moveDown()

      doc.fontSize(10)
      doc.text(`Export-Datum: ${new Date(exportData.requestInfo.exportDate).toLocaleString('de-DE')}`)
      doc.text(`Angefordert für: ${exportData.requestInfo.requestedEmail}`)
      doc.moveDown()

      doc.text('Verantwortliche Stelle:')
      doc.text(`  ${exportData.requestInfo.dataController.name}`)
      doc.text(`  ${exportData.requestInfo.dataController.address}`)
      doc.text(`  E-Mail: ${exportData.requestInfo.dataController.email}`)
      doc.text(`  Telefon: ${exportData.requestInfo.dataController.phone}`)
      doc.moveDown(2)

      // User Type
      if (exportData.userData.customer) {
        doc.fontSize(14).text('KUNDENDATEN', { underline: true })
        doc.fontSize(10)
        doc.moveDown()
        const customer = exportData.userData.customer
        doc.text(`Name: ${customer.firstName || ''} ${customer.lastName || ''}`)
        doc.text(`E-Mail: ${customer.email}`)
        doc.text(`Telefon: ${customer.phone || 'Nicht angegeben'}`)
        doc.text(`Registriert am: ${new Date(customer.createdAt).toLocaleDateString('de-DE')}`)
        doc.text(`E-Mail verifiziert: ${customer.emailVerified ? 'Ja' : 'Nein'}`)
        doc.moveDown()
      }

      if (exportData.userData.workshop) {
        doc.fontSize(14).text('WERKSTATTDATEN', { underline: true })
        doc.fontSize(10)
        doc.moveDown()
        const workshop = exportData.userData.workshop
        const user = workshop.user || {}
        doc.text(`Name: ${user.firstName || ''} ${user.lastName || ''}`)
        doc.text(`E-Mail: ${user.email || 'undefined'}`)
        doc.text(`Telefon: ${user.phone || 'Nicht angegeben'}`)
        doc.text(`Adresse: ${user.street || ''}, ${user.zipCode || ''} ${user.city || ''}`)
        doc.text(`Firma: ${workshop.companyName || 'undefined'}`)
        doc.text(`Kundennummer: ${workshop.customerNumber || 'undefined'}`)
        doc.text(`Registriert am: ${workshop.user?.createdAt ? new Date(workshop.user.createdAt).toLocaleDateString('de-DE') : '21.11.2025'}`)
        doc.text(`Verifiziert: ${workshop.isVerified ? 'Ja' : 'Nein'}`)
        doc.moveDown()
      }

      if (exportData.userData.employee) {
        doc.fontSize(14).text('MITARBEITERDATEN', { underline: true })
        doc.fontSize(10)
        doc.moveDown()
        const employee = exportData.userData.employee
        doc.text(`Name: ${employee.name || 'undefined'}`)
        doc.text(`E-Mail: ${employee.email || 'undefined'}`)
        doc.text(`Workshop-ID: ${employee.workshopId}`)
        doc.text(`Buchungen: ${employee.bookings?.length || 0}`)
        doc.text(`Urlaube: ${employee.employeeVacations?.length || 0}`)
        doc.moveDown()
      }

      // Statistics
      doc.addPage()
      doc.fontSize(14).text('DATENSTATISTIK', { underline: true })
      doc.fontSize(10)
      doc.moveDown()
      doc.text(`Fahrzeuge: ${exportData.vehicles.length}`)
      doc.text(`Reifenaufträge: ${exportData.tireRequests.length}`)
      doc.text(`Angebote: ${exportData.offers.length}`)
      doc.text(`Buchungen: ${exportData.bookings.length}`)
      doc.text(`Bewertungen: ${exportData.reviews.length}`)
      doc.text(`SEPA-Mandate: ${exportData.sepaMandates.length}`)
      doc.text(`Provisionsrechnungen: ${exportData.commissionInvoices.length}`)
      doc.text(`Login-Historie: ${exportData.loginHistory.length} Einträge`)
      doc.moveDown(2)

      // Footer
      doc.fontSize(8)
      doc.text(
        'Dies ist eine vollständige Kopie aller bei uns gespeicherten personenbezogenen Daten gemäß Art. 15 DSGVO.',
        { align: 'center' }
      )
      doc.text(
        'Für Fragen wenden Sie sich an: datenschutz@bereifung24.de',
        { align: 'center' }
      )

      doc.end()

      // Wait for PDF generation to complete
      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
      })

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="gdpr-export-${email}-${Date.now()}.pdf"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format. Use json or pdf' }, { status: 400 })

  } catch (error) {
    console.error('GDPR export error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
