import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'
import * as XLSX from 'xlsx'

/**
 * GET /api/admin/accounting/balance-sheet/export
 * Export balance sheet as PDF or Excel
 * Query params: year, format (pdf|excel)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
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

    const balanceSheet = await prisma.BalanceSheet.findUnique({
      where: { year: parseInt(year) }
    })

    if (!balanceSheet) {
      return NextResponse.json(
        { success: false, error: 'Balance sheet not found' },
        { status: 404 }
      )
    }

    const aktiva = balanceSheet.assets as any
    const passiva = balanceSheet.liabilities as any

    if (format === 'excel') {
      return exportToExcel(balanceSheet, aktiva, passiva)
    } else {
      return exportToPDF(balanceSheet, aktiva, passiva)
    }
  } catch (error) {
    console.error('Error exporting balance sheet:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function exportToExcel(balanceSheet: any, aktiva: any, passiva: any) {
  const wb = XLSX.utils.book_new()

  // Aktiva Sheet
  const aktivaData = [
    ['BILANZ ZUM 31.12.' + balanceSheet.year, ''],
    ['', ''],
    ['AKTIVA', 'EUR'],
    ['', ''],
    ['A. ANLAGEVERMÖGEN', ''],
    ['I. Immaterielle Vermögensgegenstände', formatNumber(aktiva.anlagevermoegen.immaterielleVermoegensgegenstaende)],
    ['II. Sachanlagen', formatNumber(aktiva.anlagevermoegen.sachanlagen)],
    ['III. Finanzanlagen', formatNumber(aktiva.anlagevermoegen.finanzanlagen)],
    ['Summe Anlagevermögen', formatNumber(aktiva.anlagevermoegen.immaterielleVermoegensgegenstaende + aktiva.anlagevermoegen.sachanlagen + aktiva.anlagevermoegen.finanzanlagen)],
    ['', ''],
    ['B. UMLAUFVERMÖGEN', ''],
    ['I. Vorräte', formatNumber(aktiva.umlaufvermoegen.vorraete)],
    ['II. Forderungen und sonstige Vermögensgegenstände', formatNumber(aktiva.umlaufvermoegen.forderungen)],
    ['III. Kassenbestand, Guthaben bei Kreditinstituten', formatNumber(aktiva.umlaufvermoegen.kasseBank)],
    ['Summe Umlaufvermögen', formatNumber(aktiva.umlaufvermoegen.vorraete + aktiva.umlaufvermoegen.forderungen + aktiva.umlaufvermoegen.kasseBank)],
    ['', ''],
    ['C. RECHNUNGSABGRENZUNGSPOSTEN', formatNumber(aktiva.rechnungsabgrenzungsposten)],
    ['', ''],
    ['SUMME AKTIVA', formatNumber(balanceSheet.totalAssets)],
    ['', ''],
    ['', ''],
    ['PASSIVA', 'EUR'],
    ['', ''],
    ['A. EIGENKAPITAL', ''],
    ['I. Gezeichnetes Kapital', formatNumber(passiva.eigenkapital.stammkapital)],
    ['II. Kapitalrücklage', formatNumber(passiva.eigenkapital.kapitalruecklage)],
    ['III. Gewinnrücklagen', formatNumber(passiva.eigenkapital.gewinnruecklagen)],
    ['IV. Gewinnvortrag/Verlustvortrag', formatNumber(passiva.eigenkapital.gewinnvortrag)],
    ['V. Jahresüberschuss/Jahresfehlbetrag', formatNumber(passiva.eigenkapital.jahresueberschuss)],
    ['Summe Eigenkapital', formatNumber(passiva.eigenkapital.stammkapital + passiva.eigenkapital.kapitalruecklage + passiva.eigenkapital.gewinnruecklagen + passiva.eigenkapital.gewinnvortrag + passiva.eigenkapital.jahresueberschuss)],
    ['', ''],
    ['B. RÜCKSTELLUNGEN', ''],
    ['1. Rückstellungen für Pensionen', formatNumber(passiva.rueckstellungen.pensionsrueckstellungen)],
    ['2. Steuerrückstellungen', formatNumber(passiva.rueckstellungen.steuerrueckstellungen)],
    ['3. Sonstige Rückstellungen', formatNumber(passiva.rueckstellungen.sonstigeRueckstellungen)],
    ['Summe Rückstellungen', formatNumber(passiva.rueckstellungen.pensionsrueckstellungen + passiva.rueckstellungen.steuerrueckstellungen + passiva.rueckstellungen.sonstigeRueckstellungen)],
    ['', ''],
    ['C. VERBINDLICHKEITEN', ''],
    ['1. Verbindlichkeiten gegenüber Kreditinstituten', formatNumber(passiva.verbindlichkeiten.verbindlichkeitenKreditinstitute)],
    ['2. Erhaltene Anzahlungen', formatNumber(passiva.verbindlichkeiten.erhalteneAnzahlungen)],
    ['3. Verbindlichkeiten aus Lieferungen und Leistungen', formatNumber(passiva.verbindlichkeiten.verbindlichkeitenLieferungenLeistungen)],
    ['4. Sonstige Verbindlichkeiten', formatNumber(passiva.verbindlichkeiten.sonstigeVerbindlichkeiten)],
    ['Summe Verbindlichkeiten', formatNumber(passiva.verbindlichkeiten.verbindlichkeitenKreditinstitute + passiva.verbindlichkeiten.erhalteneAnzahlungen + passiva.verbindlichkeiten.verbindlichkeitenLieferungenLeistungen + passiva.verbindlichkeiten.sonstigeVerbindlichkeiten)],
    ['', ''],
    ['D. RECHNUNGSABGRENZUNGSPOSTEN', formatNumber(passiva.rechnungsabgrenzungsposten)],
    ['', ''],
    ['SUMME PASSIVA', formatNumber(balanceSheet.totalLiabilities)]
  ]

  const ws = XLSX.utils.aoa_to_sheet(aktivaData)
  
  // Styling
  ws['!cols'] = [{ width: 50 }, { width: 15 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Bilanz ' + balanceSheet.year)

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Bilanz_${balanceSheet.year}.xlsx"`
    }
  })
}

function exportToPDF(balanceSheet: any, aktiva: any, passiva: any) {
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
            'Content-Disposition': `attachment; filename="Bilanz_${balanceSheet.year}.pdf"`
          }
        })
      )
    })

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('BILANZ', { align: 'center' })
    doc.fontSize(14).text(`zum 31. Dezember ${balanceSheet.year}`, { align: 'center' })
    doc.moveDown(2)

    // Aktiva Section
    doc.fontSize(16).font('Helvetica-Bold').text('AKTIVA')
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('A. ANLAGEVERMÖGEN')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, 'I. Immaterielle Vermögensgegenstände', aktiva.anlagevermoegen.immaterielleVermoegensgegenstaende)
    addLine(doc, 'II. Sachanlagen', aktiva.anlagevermoegen.sachanlagen)
    addLine(doc, 'III. Finanzanlagen', aktiva.anlagevermoegen.finanzanlagen)
    doc.font('Helvetica-Bold')
    addLine(doc, 'Summe Anlagevermögen', aktiva.anlagevermoegen.immaterielleVermoegensgegenstaende + aktiva.anlagevermoegen.sachanlagen + aktiva.anlagevermoegen.finanzanlagen)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('B. UMLAUFVERMÖGEN')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, 'I. Vorräte', aktiva.umlaufvermoegen.vorraete)
    addLine(doc, 'II. Forderungen und sonstige Vermögensgegenstände', aktiva.umlaufvermoegen.forderungen)
    addLine(doc, 'III. Kassenbestand, Guthaben bei Kreditinstituten', aktiva.umlaufvermoegen.kasseBank)
    doc.font('Helvetica-Bold')
    addLine(doc, 'Summe Umlaufvermögen', aktiva.umlaufvermoegen.vorraete + aktiva.umlaufvermoegen.forderungen + aktiva.umlaufvermoegen.kasseBank)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('C. RECHNUNGSABGRENZUNGSPOSTEN')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, '', aktiva.rechnungsabgrenzungsposten)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold')
    addLine(doc, 'SUMME AKTIVA', balanceSheet.totalAssets)
    doc.moveDown(2)

    // Passiva Section
    doc.fontSize(16).font('Helvetica-Bold').text('PASSIVA')
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('A. EIGENKAPITAL')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, 'I. Gezeichnetes Kapital', passiva.eigenkapital.stammkapital)
    addLine(doc, 'II. Kapitalrücklage', passiva.eigenkapital.kapitalruecklage)
    addLine(doc, 'III. Gewinnrücklagen', passiva.eigenkapital.gewinnruecklagen)
    addLine(doc, 'IV. Gewinnvortrag/Verlustvortrag', passiva.eigenkapital.gewinnvortrag)
    addLine(doc, 'V. Jahresüberschuss/Jahresfehlbetrag', passiva.eigenkapital.jahresueberschuss)
    doc.font('Helvetica-Bold')
    addLine(doc, 'Summe Eigenkapital', passiva.eigenkapital.stammkapital + passiva.eigenkapital.kapitalruecklage + passiva.eigenkapital.gewinnruecklagen + passiva.eigenkapital.gewinnvortrag + passiva.eigenkapital.jahresueberschuss)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('B. RÜCKSTELLUNGEN')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, '1. Rückstellungen für Pensionen', passiva.rueckstellungen.pensionsrueckstellungen)
    addLine(doc, '2. Steuerrückstellungen', passiva.rueckstellungen.steuerrueckstellungen)
    addLine(doc, '3. Sonstige Rückstellungen', passiva.rueckstellungen.sonstigeRueckstellungen)
    doc.font('Helvetica-Bold')
    addLine(doc, 'Summe Rückstellungen', passiva.rueckstellungen.pensionsrueckstellungen + passiva.rueckstellungen.steuerrueckstellungen + passiva.rueckstellungen.sonstigeRueckstellungen)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('C. VERBINDLICHKEITEN')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, '1. Verbindlichkeiten gegenüber Kreditinstituten', passiva.verbindlichkeiten.verbindlichkeitenKreditinstitute)
    addLine(doc, '2. Erhaltene Anzahlungen', passiva.verbindlichkeiten.erhalteneAnzahlungen)
    addLine(doc, '3. Verbindlichkeiten aus Lieferungen und Leistungen', passiva.verbindlichkeiten.verbindlichkeitenLieferungenLeistungen)
    addLine(doc, '4. Sonstige Verbindlichkeiten', passiva.verbindlichkeiten.sonstigeVerbindlichkeiten)
    doc.font('Helvetica-Bold')
    addLine(doc, 'Summe Verbindlichkeiten', passiva.verbindlichkeiten.verbindlichkeitenKreditinstitute + passiva.verbindlichkeiten.erhalteneAnzahlungen + passiva.verbindlichkeiten.verbindlichkeitenLieferungenLeistungen + passiva.verbindlichkeiten.sonstigeVerbindlichkeiten)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold').text('D. RECHNUNGSABGRENZUNGSPOSTEN')
    doc.fontSize(10).font('Helvetica')
    addLine(doc, '', passiva.rechnungsabgrenzungsposten)
    doc.moveDown(0.5)

    doc.fontSize(12).font('Helvetica-Bold')
    addLine(doc, 'SUMME PASSIVA', balanceSheet.totalLiabilities)

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
