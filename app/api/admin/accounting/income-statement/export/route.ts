import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'
import * as XLSX from 'xlsx'

/**
 * GET /api/admin/accounting/income-statement/export
 * Export income statement as PDF or Excel
 * Query params: year, format (pdf|excel)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const format = searchParams.get('format') || 'pdf'

    if (!year) {
      return NextResponse.json(
        { success: false, error: 'Year parameter required' },
        { status: 400 }
      )
    }

    const incomeStatement = await prisma.IncomeStatement.findUnique({
      where: { year: parseInt(year) }
    })

    if (!incomeStatement) {
      return NextResponse.json(
        { success: false, error: 'Income statement not found' },
        { status: 404 }
      )
    }

    const revenue = incomeStatement.revenue as any
    const expenses = incomeStatement.expenses as any
    const financialResult = incomeStatement.financialResult as any

    if (format === 'excel') {
      return exportToExcel(incomeStatement, revenue, expenses, financialResult)
    } else {
      return exportToPDF(incomeStatement, revenue, expenses, financialResult)
    }
  } catch (error) {
    console.error('Error exporting income statement:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function exportToExcel(incomeStatement: any, revenue: any, expenses: any, financialResult: any) {
  const wb = XLSX.utils.book_new()

  const guvData = [
    ['GEWINN- UND VERLUSTRECHNUNG', ''],
    ['für das Geschäftsjahr ' + incomeStatement.year, ''],
    ['', ''],
    ['ERTRÄGE', 'EUR'],
    ['', ''],
    ['1. Umsatzerlöse', formatNumber(revenue.umsatzerloese)],
    ['2. Bestandsveränderungen', formatNumber(revenue.bestandsveraenderungen)],
    ['3. Andere aktivierte Eigenleistungen', formatNumber(revenue.andereAktivierteEigenleistungen)],
    ['4. Sonstige betriebliche Erträge', formatNumber(revenue.sonstigeBetrieblicheErtraege)],
    ['', ''],
    ['Gesamtleistung', formatNumber(revenue.umsatzerloese + revenue.bestandsveraenderungen + revenue.andereAktivierteEigenleistungen + revenue.sonstigeBetrieblicheErtraege)],
    ['', ''],
    ['AUFWENDUNGEN', ''],
    ['', ''],
    ['5. Materialaufwand', ''],
    ['   a) Aufwendungen für Roh-, Hilfs- und Betriebsstoffe', formatNumber(expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe)],
    ['   b) Aufwendungen für bezogene Leistungen', formatNumber(expenses.materialaufwand.aufwendungenBezogeneLeistungen)],
    ['   Summe Materialaufwand', formatNumber(expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe + expenses.materialaufwand.aufwendungenBezogeneLeistungen)],
    ['', ''],
    ['6. Personalaufwand', ''],
    ['   a) Löhne und Gehälter', formatNumber(expenses.personalaufwand.loehneGehaelter)],
    ['   b) Soziale Abgaben', formatNumber(expenses.personalaufwand.sozialeAbgaben)],
    ['   c) Altersversorgung', formatNumber(expenses.personalaufwand.altersversorgung)],
    ['   Summe Personalaufwand', formatNumber(expenses.personalaufwand.loehneGehaelter + expenses.personalaufwand.sozialeAbgaben + expenses.personalaufwand.altersversorgung)],
    ['', ''],
    ['7. Abschreibungen', formatNumber(expenses.abschreibungen)],
    ['', ''],
    ['8. Sonstige betriebliche Aufwendungen', formatNumber(expenses.sonstigeBetrieblicheAufwendungen)],
    ['', ''],
    ['Betriebsergebnis', formatNumber((revenue.umsatzerloese + revenue.bestandsveraenderungen + revenue.andereAktivierteEigenleistungen + revenue.sonstigeBetrieblicheErtraege) - (expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe + expenses.materialaufwand.aufwendungenBezogeneLeistungen + expenses.personalaufwand.loehneGehaelter + expenses.personalaufwand.sozialeAbgaben + expenses.personalaufwand.altersversorgung + expenses.abschreibungen + expenses.sonstigeBetrieblicheAufwendungen))],
    ['', ''],
    ['FINANZERGEBNIS', ''],
    ['', ''],
    ['9. Zinserträge', formatNumber(financialResult?.zinsertraege || 0)],
    ['10. Beteiligungserträge', formatNumber(financialResult?.beteiligungsertraege || 0)],
    ['11. Zinsen und ähnliche Aufwendungen', formatNumber(financialResult?.zinsenAehnlicheAufwendungen || 0)],
    ['', ''],
    ['Finanzergebnis', formatNumber((financialResult?.zinsertraege || 0) + (financialResult?.beteiligungsertraege || 0) - (financialResult?.zinsenAehnlicheAufwendungen || 0))],
    ['', ''],
    ['Ergebnis vor Steuern', formatNumber(incomeStatement.earningsBeforeTax)],
    ['', ''],
    ['12. Steuern vom Einkommen und vom Ertrag', formatNumber(incomeStatement.taxes)],
    ['', ''],
    ['JAHRESÜBERSCHUSS/-FEHLBETRAG', formatNumber(incomeStatement.netIncome)]
  ]

  const ws = XLSX.utils.aoa_to_sheet(guvData)
  
  // Styling
  ws['!cols'] = [{ width: 50 }, { width: 15 }]

  XLSX.utils.book_append_sheet(wb, ws, 'GuV ' + incomeStatement.year)

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GuV_${incomeStatement.year}.xlsx"`
    }
  })
}

function exportToPDF(incomeStatement: any, revenue: any, expenses: any, financialResult: any) {
  return new Promise<NextResponse>((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(
        new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="GuV_${incomeStatement.year}.pdf"`
          }
        })
      )
    })

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('GEWINN- UND VERLUSTRECHNUNG', { align: 'center' })
    doc.fontSize(14).text(`für das Geschäftsjahr ${incomeStatement.year}`, { align: 'center' })
    doc.moveDown(2)

    // Erträge Section
    doc.fontSize(16).font('Helvetica-Bold').text('ERTRÄGE')
    doc.moveDown(0.5)

    doc.fontSize(10).font('Helvetica')
    addLine(doc, '1. Umsatzerlöse', revenue.umsatzerloese)
    addLine(doc, '2. Bestandsveränderungen', revenue.bestandsveraenderungen)
    addLine(doc, '3. Andere aktivierte Eigenleistungen', revenue.andereAktivierteEigenleistungen)
    addLine(doc, '4. Sonstige betriebliche Erträge', revenue.sonstigeBetrieblicheErtraege)
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold')
    addLine(doc, 'Gesamtleistung', revenue.umsatzerloese + revenue.bestandsveraenderungen + revenue.andereAktivierteEigenleistungen + revenue.sonstigeBetrieblicheErtraege)
    doc.moveDown(1)

    // Aufwendungen Section
    doc.fontSize(16).font('Helvetica-Bold').text('AUFWENDUNGEN')
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('5. Materialaufwand')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, '   a) Aufwendungen für Roh-, Hilfs- und Betriebsstoffe', expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe)
    addLine(doc, '   b) Aufwendungen für bezogene Leistungen', expenses.materialaufwand.aufwendungenBezogeneLeistungen)
    doc.font('Helvetica-Bold')
    addLine(doc, '   Summe Materialaufwand', expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe + expenses.materialaufwand.aufwendungenBezogeneLeistungen)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('6. Personalaufwand')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, '   a) Löhne und Gehälter', expenses.personalaufwand.loehneGehaelter)
    addLine(doc, '   b) Soziale Abgaben', expenses.personalaufwand.sozialeAbgaben)
    addLine(doc, '   c) Altersversorgung', expenses.personalaufwand.altersversorgung)
    doc.font('Helvetica-Bold')
    addLine(doc, '   Summe Personalaufwand', expenses.personalaufwand.loehneGehaelter + expenses.personalaufwand.sozialeAbgaben + expenses.personalaufwand.altersversorgung)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold')
    addLine(doc, '7. Abschreibungen', expenses.abschreibungen)
    doc.moveDown(0.3)

    addLine(doc, '8. Sonstige betriebliche Aufwendungen', expenses.sonstigeBetrieblicheAufwendungen)
    doc.moveDown(0.5)

    const betriebsergebnis = (revenue.umsatzerloese + revenue.bestandsveraenderungen + revenue.andereAktivierteEigenleistungen + revenue.sonstigeBetrieblicheErtraege) - 
      (expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe + expenses.materialaufwand.aufwendungenBezogeneLeistungen + 
       expenses.personalaufwand.loehneGehaelter + expenses.personalaufwand.sozialeAbgaben + expenses.personalaufwand.altersversorgung + 
       expenses.abschreibungen + expenses.sonstigeBetrieblicheAufwendungen)
    
    addLine(doc, 'Betriebsergebnis', betriebsergebnis)
    doc.moveDown(1)

    // Finanzergebnis Section
    doc.fontSize(16).font('Helvetica-Bold').text('FINANZERGEBNIS')
    doc.moveDown(0.5)

    doc.fontSize(10).font('Helvetica')
    addLine(doc, '9. Zinserträge', financialResult?.zinsertraege || 0)
    addLine(doc, '10. Beteiligungserträge', financialResult?.beteiligungsertraege || 0)
    addLine(doc, '11. Zinsen und ähnliche Aufwendungen', financialResult?.zinsenAehnlicheAufwendungen || 0)
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold')
    addLine(doc, 'Finanzergebnis', (financialResult?.zinsertraege || 0) + (financialResult?.beteiligungsertraege || 0) - (financialResult?.zinsenAehnlicheAufwendungen || 0))
    doc.moveDown(1)

    // Ergebnis Section
    doc.fontSize(12).font('Helvetica-Bold')
    addLine(doc, 'Ergebnis vor Steuern', incomeStatement.earningsBeforeTax)
    doc.moveDown(0.5)

    doc.fontSize(10).font('Helvetica')
    addLine(doc, '12. Steuern vom Einkommen und vom Ertrag', incomeStatement.taxes)
    doc.moveDown(0.5)

    doc.fontSize(14).font('Helvetica-Bold')
    addLine(doc, 'JAHRESÜBERSCHUSS/-FEHLBETRAG', incomeStatement.netIncome)

    // Footer
    doc.moveDown(2)
    doc.fontSize(8).font('Helvetica').text(
      `Erstellt am: ${new Date().toLocaleDateString('de-DE')}`,
      { align: 'center' }
    )

    doc.end()
  })
}

function addLine(doc: PDFKit.PDFDocument, label: string, value: number) {
  const y = doc.y
  if (label) {
    doc.text(label, 50, y, { width: 350, continued: false })
  }
  doc.text(formatNumber(value), 450, y, { width: 100, align: 'right' })
  doc.moveDown(0.3)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
