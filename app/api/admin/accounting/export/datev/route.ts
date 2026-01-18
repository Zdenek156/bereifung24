import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * DATEV CSV Export - EXTF 510/700 Format
 * Dokumentation: https://www.datev.de/web/de/datev-shop/material/handbuecher/
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const onlyLocked = searchParams.get('onlyLocked') === 'true'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end date required' }, { status: 400 })
    }

    // Fetch accounting entries
    const entries = await prisma.accountingEntry.findMany({
      where: {
        bookingDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        ...(onlyLocked ? { locked: true } : {})
      },
      include: {
        debitAccountDetails: true,
        creditAccountDetails: true
      },
      orderBy: {
        bookingDate: 'asc'
      }
    })

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No entries found for the selected period' }, { status: 404 })
    }

    // Generate DATEV CSV
    const csv = generateDatevCSV(entries, startDate, endDate)

    // Create filename
    const filename = `DATEV_Export_${startDate}_${endDate}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('DATEV export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function generateDatevCSV(entries: any[], startDate: string, endDate: string): string {
  const lines: string[] = []

  // Header row 1: Format definition
  lines.push('"EXTF";"510";"21";"Buchungsstapel";"7.00"')

  // Header row 2: Company info and period
  const company = {
    berater: '1000', // Beraternummer (placeholder)
    mandant: '1', // Mandantennummer (placeholder)
    wirtschaftsjahr: new Date(startDate).getFullYear().toString(),
    sachkontenlänge: '4',
    datumVon: formatDatevDate(new Date(startDate)),
    datumBis: formatDatevDate(new Date(endDate)),
    bezeichnung: 'Bereifung24 Export',
    diktatkürzel: 'RE',
    buchungstyp: '1', // 1=Finanzbuchhaltung
    rechnungslegungszweck: '0'
  }

  lines.push([
    `"${company.berater}"`,
    `"${company.mandant}"`,
    `"${company.wirtschaftsjahr}"`,
    `"${company.sachkontenlänge}"`,
    `"${company.datumVon}"`,
    `"${company.datumBis}"`,
    `"${company.bezeichnung}"`,
    `"${company.diktatkürzel}"`,
    `"${company.buchungstyp}"`,
    `"${company.rechnungslegungszweck}"`
  ].join(';'))

  // Header row 3: Column headers
  lines.push([
    '"Umsatz (ohne Soll/Haben-Kz)"',
    '"Soll/Haben-Kennzeichen"',
    '"WKZ Umsatz"',
    '"Kurs"',
    '"Basis-Umsatz"',
    '"WKZ Basis-Umsatz"',
    '"Konto"',
    '"Gegenkonto (ohne BU-Schlüssel)"',
    '"BU-Schlüssel"',
    '"Belegdatum"',
    '"Belegfeld 1"',
    '"Belegfeld 2"',
    '"Skonto"',
    '"Buchungstext"',
    '"Postensperre"',
    '"Diverse Adressnummer"',
    '"Geschäftspartnerbank"',
    '"Sachverhalt"',
    '"Zinssperre"',
    '"Beleglink"',
    '"Beleginfo - Art 1"',
    '"Beleginfo - Inhalt 1"',
    '"Beleginfo - Art 2"',
    '"Beleginfo - Inhalt 2"',
    '"Beleginfo - Art 3"',
    '"Beleginfo - Inhalt 3"',
    '"Beleginfo - Art 4"',
    '"Beleginfo - Inhalt 4"',
    '"Beleginfo - Art 5"',
    '"Beleginfo - Inhalt 5"',
    '"Beleginfo - Art 6"',
    '"Beleginfo - Inhalt 6"',
    '"Beleginfo - Art 7"',
    '"Beleginfo - Inhalt 7"',
    '"Beleginfo - Art 8"',
    '"Beleginfo - Inhalt 8"',
    '"KOST1 - Kostenstelle"',
    '"KOST2 - Kostenstelle"',
    '"Kost-Menge"',
    '"EU-Land u. UStID"',
    '"EU-Steuersatz"',
    '"Abw. Versteuerungsart"',
    '"Sachverhalt L+L"',
    '"Funktionsergänzung L+L"',
    '"BU 49 Hauptfunktionstyp"',
    '"BU 49 Hauptfunktionsnummer"',
    '"BU 49 Funktionsergänzung"',
    '"Zusatzinformation - Art 1"',
    '"Zusatzinformation - Inhalt 1"',
    '"Zusatzinformation - Art 2"',
    '"Zusatzinformation - Inhalt 2"',
    '"Zusatzinformation - Art 3"',
    '"Zusatzinformation - Inhalt 3"',
    '"Zusatzinformation - Art 4"',
    '"Zusatzinformation - Inhalt 4"',
    '"Zusatzinformation - Art 5"',
    '"Zusatzinformation - Inhalt 5"',
    '"Zusatzinformation - Art 6"',
    '"Zusatzinformation - Inhalt 6"',
    '"Zusatzinformation - Art 7"',
    '"Zusatzinformation - Inhalt 7"',
    '"Zusatzinformation - Art 8"',
    '"Zusatzinformation - Inhalt 8"',
    '"Zusatzinformation - Art 9"',
    '"Zusatzinformation - Inhalt 9"',
    '"Zusatzinformation - Art 10"',
    '"Zusatzinformation - Inhalt 10"',
    '"Zusatzinformation - Art 11"',
    '"Zusatzinformation - Inhalt 11"',
    '"Zusatzinformation - Art 12"',
    '"Zusatzinformation - Inhalt 12"',
    '"Zusatzinformation - Art 13"',
    '"Zusatzinformation - Inhalt 13"',
    '"Zusatzinformation - Art 14"',
    '"Zusatzinformation - Inhalt 14"',
    '"Zusatzinformation - Art 15"',
    '"Zusatzinformation - Inhalt 15"',
    '"Zusatzinformation - Art 16"',
    '"Zusatzinformation - Inhalt 16"',
    '"Zusatzinformation - Art 17"',
    '"Zusatzinformation - Inhalt 17"',
    '"Zusatzinformation - Art 18"',
    '"Zusatzinformation - Inhalt 18"',
    '"Zusatzinformation - Art 19"',
    '"Zusatzinformation - Inhalt 19"',
    '"Zusatzinformation - Art 20"',
    '"Zusatzinformation - Inhalt 20"',
    '"Stück"',
    '"Gewicht"',
    '"Zahlweise"',
    '"Forderungsart"',
    '"Veranlagungsjahr"',
    '"Zugeordnete Fälligkeit"',
    '"Skontotyp"',
    '"Auftragsnummer"',
    '"Buchungstyp"',
    '"Ust-Schlüssel (Anzahlungen)"',
    '"EU-Land (Anzahlungen)"',
    '"Sachverhalt L+L (Anzahlungen)"',
    '"EU-Steuersatz (Anzahlungen)"',
    '"Erlöskonto (Anzahlungen)"',
    '"Herkunft-Kz"',
    '"Buchungs-GUID"',
    '"KOST-Datum"',
    '"SEPA-Mandatsreferenz"',
    '"Skontosperre"',
    '"Gesellschaftername"',
    '"Beteiligtennummer"',
    '"Identifikationsnummer"',
    '"Zeichnernummer"',
    '"Postensperre bis"',
    '"Bezeichnung SoBil-Sachverhalt"',
    '"Kennzeichen SoBil-Buchung"',
    '"Festschreibung"',
    '"Leistungsdatum"',
    '"Datum Zuord. Steuerperiode"'
  ].join(';'))

  // Data rows
  for (const entry of entries) {
    // Convert amount to DATEV format (positive, cents)
    const amount = Math.abs(entry.amount).toFixed(2)

    // Determine Soll/Haben indicator
    // S = Soll (Debit), H = Haben (Credit)
    const sollHaben = 'S' // Standard booking on debit side

    // Format booking date
    const belegdatum = formatDatevDate(new Date(entry.bookingDate))

    // Clean description for DATEV (remove special characters)
    const buchungstext = cleanDatevText(entry.description)

    // Get account numbers (4-digit format)
    const sollKonto = padAccountNumber(entry.debitAccount)
    const habenKonto = padAccountNumber(entry.creditAccount)

    // Tax key (BU-Schlüssel) - default empty, needs manual mapping
    const buSchluessel = ''

    // Document number
    const belegfeld1 = entry.entryNumber || ''

    // Create data row with essential columns
    const row = [
      `"${amount}"`, // Umsatz
      `"${sollHaben}"`, // Soll/Haben
      '"EUR"', // WKZ Umsatz
      '""', // Kurs
      '""', // Basis-Umsatz
      '""', // WKZ Basis-Umsatz
      `"${sollKonto}"`, // Konto (Soll)
      `"${habenKonto}"`, // Gegenkonto (Haben)
      `"${buSchluessel}"`, // BU-Schlüssel
      `"${belegdatum}"`, // Belegdatum
      `"${belegfeld1}"`, // Belegfeld 1 (Belegnummer)
      '""', // Belegfeld 2
      '""', // Skonto
      `"${buchungstext}"`, // Buchungstext
      '""' // Postensperre
    ]

    // Fill remaining columns with empty values (total 116 columns required)
    while (row.length < 116) {
      row.push('""')
    }

    lines.push(row.join(';'))
  }

  // Add UTF-8 BOM for proper encoding
  return '\uFEFF' + lines.join('\r\n')
}

function formatDatevDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}${month}${year}`
}

function cleanDatevText(text: string): string {
  // Remove special characters, max 60 chars
  return text
    .replace(/[;"]/g, '')
    .replace(/\r?\n/g, ' ')
    .substring(0, 60)
    .trim()
}

function padAccountNumber(accountNumber: string): string {
  // Pad account number to 4 digits
  return accountNumber.padStart(4, '0')
}
