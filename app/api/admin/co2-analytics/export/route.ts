import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

/**
 * GET /api/admin/co2-analytics/export
 * Generates a professional CO2 Sustainability Report PDF
 * For: Förderstellen, IHK, Wirtschaftsförderung, Banken, Partner
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'B24_EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // ─── Fetch all analytics data ───

    const tireRequestStats: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) FILTER (WHERE "savedCO2Grams" IS NOT NULL) as calculated_count,
        COUNT(*) as total_count,
        COALESCE(SUM("savedCO2Grams"), 0) as total_co2_grams,
        COALESCE(AVG("savedCO2Grams") FILTER (WHERE "savedCO2Grams" IS NOT NULL), 0) as avg_co2_grams,
        COALESCE(AVG("workshopsNotified") FILTER (WHERE "workshopsNotified" IS NOT NULL), 0) as avg_workshops
      FROM tire_requests
    `)

    const bookingStats: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status IN ('COMPLETED', 'CONFIRMED', 'RESERVED')) as active_bookings
      FROM direct_bookings
    `)

    const monthlyBookings: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as bookings
      FROM direct_bookings
      WHERE status IN ('COMPLETED', 'CONFIRMED', 'RESERVED')
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `)

    const fuelTypeDistribution: any[] = await prisma.$queryRawUnsafe(`
      SELECT "fuelType", COUNT(*) as count
      FROM vehicles WHERE "fuelType" != 'UNKNOWN'
      GROUP BY "fuelType" ORDER BY count DESC
    `)

    const settings = await prisma.cO2Settings.findFirst()

    // ─── Calculate values ───

    const AVG_WORKSHOP_DISTANCE_KM = 8
    const FALLBACK_CO2_PER_KM = 150
    const workshopsToCompare = settings?.workshopsToCompare ?? 3

    const activeBookings = Number(bookingStats[0]?.active_bookings ?? 0)
    const tripsAvoided = activeBookings * (workshopsToCompare - 1)
    const kmSavedBookings = tripsAvoided * AVG_WORKSHOP_DISTANCE_KM * 2
    const co2SavedBookingsGrams = kmSavedBookings * FALLBACK_CO2_PER_KM

    const totalCO2FromRequests = Number(tireRequestStats[0]?.total_co2_grams ?? 0)
    const totalCO2Grams = totalCO2FromRequests + co2SavedBookingsGrams
    const totalCO2Kg = totalCO2Grams / 1000

    const avgFuelPer100km = 7.4
    const totalKmSaved = kmSavedBookings + (Number(tireRequestStats[0]?.calculated_count ?? 0) * AVG_WORKSHOP_DISTANCE_KM * workshopsToCompare * 2)
    const fuelSavedLiters = (totalKmSaved * avgFuelPer100km) / 100
    const avgFuelPrice = Number(settings?.dieselPricePerLiter ?? 1.65)
    const moneySaved = fuelSavedLiters * avgFuelPrice

    const overview = {
      totalCO2Kg: Math.round(totalCO2Kg * 100) / 100,
      totalKmSaved: Math.round(totalKmSaved),
      totalTripsAvoided: tripsAvoided + Number(tireRequestStats[0]?.calculated_count ?? 0),
      fuelSavedLiters: Math.round(fuelSavedLiters * 10) / 10,
      moneySaved: Math.round(moneySaved * 100) / 100,
    }

    const comparisons = {
      equivalentTrees: Math.round(totalCO2Kg / 22 * 10) / 10,
      equivalentCarKm: Math.round(totalCO2Grams / FALLBACK_CO2_PER_KM),
      equivalentFlights: Math.round(totalCO2Kg / 230 * 10) / 10,
    }

    const counts = {
      directBookingsActive: activeBookings,
      directBookingsTotal: Number(bookingStats[0]?.total_bookings ?? 0),
    }

    const co2PerBooking = (workshopsToCompare - 1) * AVG_WORKSHOP_DISTANCE_KM * 2 * FALLBACK_CO2_PER_KM / 1000

    const monthlyBook = monthlyBookings.map(m => {
      const bookings = Number(m.bookings)
      return {
        month: m.month,
        bookings,
        co2Kg: Math.round(bookings * co2PerBooking * 100) / 100,
      }
    })

    const fuelDist = fuelTypeDistribution.map(f => ({
      fuelType: f.fuelType,
      count: Number(f.count),
    }))

    // ─── Generate PDF ───

    const now = new Date()
    const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return new Promise<NextResponse>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true })
      const chunks: Buffer[] = []

      doc.on('data', (chunk: any) => chunks.push(chunk))
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="Bereifung24_CO2_Nachhaltigkeitsbericht_${now.toISOString().slice(0, 10)}.pdf"`,
            },
          })
        )
      })
      doc.on('error', reject)

      const PAGE_WIDTH = 595.28 - 100
      const GREEN = '#16a34a'
      const DARK = '#111827'
      const GRAY = '#6b7280'

      // ── Load logo ──
      let logoBuffer: Buffer | null = null
      try {
        const logoPath = path.join(process.cwd(), 'public', 'B24 Logo transparent.png')
        if (fs.existsSync(logoPath)) {
          logoBuffer = fs.readFileSync(logoPath)
        }
      } catch (e) {
        // Logo not available
      }

      // ════════════════════════════════════════════════════
      // PAGE 1: COVER & KEY METRICS
      // ════════════════════════════════════════════════════

      if (logoBuffer) {
        doc.image(logoBuffer, 50, 40, { width: 160 })
        doc.y = 130
      } else {
        doc.y = 80
      }

      doc.fontSize(26).font('Helvetica-Bold').fillColor(GREEN)
        .text('CO2-Nachhaltigkeitsbericht', { align: 'center' })
      doc.moveDown(0.3)
      doc.fontSize(13).font('Helvetica').fillColor(GRAY)
        .text('Bereifung24 - Digitale Plattform f\u00FCr Reifenservices', { align: 'center' })
      doc.moveDown(0.3)
      doc.fontSize(11).fillColor(GRAY)
        .text('Erstellt am ' + dateStr, { align: 'center' })

      doc.moveDown(1.2)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(GREEN).lineWidth(2).stroke()
      doc.moveDown(1.5)

      // ── Executive Summary Box ──
      const summaryY = doc.y
      doc.rect(50, summaryY, PAGE_WIDTH, 95).fill('#ecfdf5')
      doc.fillColor(DARK)
      doc.fontSize(13).font('Helvetica-Bold')
        .text('Zusammenfassung', 70, summaryY + 12)
      doc.fontSize(9.5).font('Helvetica').fillColor('#374151')
        .text(
          'Durch die Nutzung der Bereifung24-Plattform wurden bisher insgesamt ' + formatCO2(overview.totalCO2Kg) + ' CO2 eingespart. ' +
          'Das entspricht der j\u00E4hrlichen CO2-Absorption von ' + comparisons.equivalentTrees + ' B\u00E4umen oder ' + comparisons.equivalentCarKm.toLocaleString('de-DE') + ' km Autofahrt. ' +
          'Insgesamt wurden ' + overview.totalTripsAvoided.toLocaleString('de-DE') + ' unn\u00F6tige Fahrten zu Werkst\u00E4tten vermieden und ' +
          overview.fuelSavedLiters.toLocaleString('de-DE') + ' Liter Kraftstoff eingespart. ' +
          'Die Berechnung basiert auf echten Fahrzeugdaten und GPS-Entfernungen der Nutzer.',
          70, summaryY + 30,
          { width: PAGE_WIDTH - 40, lineGap: 3 }
        )
      doc.y = summaryY + 108

      // ── 4 KPI Cards ──
      doc.fontSize(15).font('Helvetica-Bold').fillColor(DARK)
        .text('Kernindikatoren (KPIs)', 50)
      doc.moveDown(0.6)

      const kpiStartY = doc.y
      const kpiWidth = (PAGE_WIDTH - 30) / 2
      const kpiHeight = 65
      const kpis = [
        { label: 'CO2 eingespart', value: formatCO2(overview.totalCO2Kg), sub: 'Durch vermiedene Werkstattfahrten' },
        { label: 'Kilometer eingespart', value: overview.totalKmSaved.toLocaleString('de-DE') + ' km', sub: overview.totalTripsAvoided.toLocaleString('de-DE') + ' Fahrten vermieden' },
        { label: 'Kraftstoff eingespart', value: overview.fuelSavedLiters.toLocaleString('de-DE') + ' Liter', sub: overview.moneySaved.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' EUR Ersparnis' },
        { label: 'Direktbuchungen', value: counts.directBookingsActive.toLocaleString('de-DE') + ' aktiv', sub: counts.directBookingsTotal.toLocaleString('de-DE') + ' Buchungen gesamt' },
      ]

      kpis.forEach((kpi, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = 50 + col * (kpiWidth + 10)
        const y = kpiStartY + row * (kpiHeight + 10)

        doc.rect(x, y, kpiWidth, kpiHeight).fill('#f0fdf4')
        doc.fillColor(GREEN).fontSize(9).font('Helvetica')
          .text(kpi.label, x + 15, y + 10, { width: kpiWidth - 30 })
        doc.fillColor(DARK).fontSize(17).font('Helvetica-Bold')
          .text(kpi.value, x + 15, y + 24, { width: kpiWidth - 30 })
        doc.fillColor(GRAY).fontSize(8).font('Helvetica')
          .text(kpi.sub, x + 15, y + 47, { width: kpiWidth - 30 })
      })

      doc.y = kpiStartY + 2 * (kpiHeight + 10) + 15

      // ── Umwelt-Vergleiche ──
      doc.fontSize(15).font('Helvetica-Bold').fillColor(DARK)
        .text('Umwelt-\u00C4quivalenzen', 50)
      doc.moveDown(0.4)
      doc.fontSize(10).font('Helvetica').fillColor(GRAY)
        .text('Die eingesparten CO2-Emissionen entsprechen:')
      doc.moveDown(0.5)

      const eqItems = [
        { color: '#16a34a', text: comparisons.equivalentTrees + ' B\u00E4ume', desc: 'J\u00E4hrliche CO2-Absorption (1 Baum = ca. 22 kg CO2/Jahr)' },
        { color: '#2563eb', text: comparisons.equivalentCarKm.toLocaleString('de-DE') + ' km', desc: 'Vermiedene Autofahrt (ca. 150 g CO2/km)' },
        { color: '#7c3aed', text: comparisons.equivalentFlights + ' Fl\u00FCge', desc: 'Frankfurt - Mallorca (ca. 230 kg CO2 pro Passagier)' },
        { color: '#ca8a04', text: overview.moneySaved.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' EUR', desc: 'Eingesparte Kraftstoffkosten f\u00FCr Verbraucher' },
      ]

      eqItems.forEach(item => {
        const y = doc.y
        doc.circle(68, y + 5, 5).fill(item.color)
        doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold')
          .text(item.text, 82, y)
        doc.fontSize(9).font('Helvetica').fillColor(GRAY)
          .text(item.desc, 82, y + 14)
        doc.y = y + 30
      })

      // ════════════════════════════════════════════════════
      // PAGE 2: TRENDS & DATA
      // ════════════════════════════════════════════════════
      doc.addPage()

      doc.fontSize(15).font('Helvetica-Bold').fillColor(DARK)
        .text('Monatliche Entwicklung (CO2-Einsparungen)', 50)
      doc.moveDown(0.3)
      doc.fontSize(9).font('Helvetica').fillColor(GRAY)
        .text('Letzte 12 Monate - basierend auf Direktbuchungen')
      doc.moveDown(0.8)

      const sortedMonths = monthlyBook.sort((a, b) => a.month.localeCompare(b.month))

      // Table (3 columns: Monat, CO2, Buchungen)
      const tableX = 50
      const colWidths = [150, 150, 145]
      const headers = ['Monat', 'CO2 (kg)', 'Buchungen']
      let tableY = doc.y

      doc.rect(tableX, tableY, PAGE_WIDTH, 22).fill('#166534')
      headers.forEach((h, i) => {
        const x = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
          .text(h, x + 8, tableY + 6, { width: colWidths[i] - 16 })
      })
      tableY += 22

      let totalMonthBookings = 0
      let totalMonthCO2 = 0

      sortedMonths.forEach((entry, idx) => {
        if (idx % 2 === 0) {
          doc.rect(tableX, tableY, PAGE_WIDTH, 20).fill('#f9fafb')
        }

        const monthLabel = formatMonth(entry.month)
        const vals = [monthLabel, entry.co2Kg.toFixed(2), entry.bookings.toString()]
        vals.forEach((v, i) => {
          const x = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
          doc.fillColor(DARK).fontSize(9).font('Helvetica')
            .text(v, x + 8, tableY + 5, { width: colWidths[i] - 16 })
        })

        totalMonthBookings += entry.bookings
        totalMonthCO2 += entry.co2Kg
        tableY += 20
      })

      // Total Row
      doc.rect(tableX, tableY, PAGE_WIDTH, 22).fill('#ecfdf5')
      const totals = ['Gesamt', totalMonthCO2.toFixed(2), totalMonthBookings.toString()]
      totals.forEach((v, i) => {
        const x = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
        doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold')
          .text(v, x + 8, tableY + 6, { width: colWidths[i] - 16 })
      })
      tableY += 30
      doc.y = tableY

      // ── Bar Chart Visualization ──
      if (sortedMonths.length > 0) {
        doc.moveDown(0.5)
        doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK)
          .text('Buchungen pro Monat', 50)
        doc.moveDown(0.5)

        const chartX = 80
        const chartWidth = PAGE_WIDTH - 60
        const chartHeight = 100
        const chartY = doc.y
        const maxBookings = Math.max(...sortedMonths.map(d => d.bookings), 1)
        const barWidth = Math.min(30, (chartWidth - 20) / sortedMonths.length - 4)

        doc.moveTo(chartX, chartY).lineTo(chartX, chartY + chartHeight).strokeColor('#d1d5db').lineWidth(0.5).stroke()
        doc.moveTo(chartX, chartY + chartHeight).lineTo(chartX + chartWidth, chartY + chartHeight).stroke()

        sortedMonths.forEach((data, i) => {
          const barHeight = (data.bookings / maxBookings) * (chartHeight - 10)
          const x = chartX + 15 + i * ((chartWidth - 20) / sortedMonths.length)
          const y = chartY + chartHeight - barHeight

          doc.rect(x, y, barWidth, barHeight).fill(GREEN)

          doc.fillColor(GRAY).fontSize(6).font('Helvetica')
            .text(data.month.slice(5), x - 2, chartY + chartHeight + 3, { width: barWidth + 4, align: 'center' })

          if (data.bookings > 0) {
            doc.fillColor(DARK).fontSize(6).font('Helvetica')
              .text(data.bookings.toString(), x - 4, y - 10, { width: barWidth + 8, align: 'center' })
          }
        })

        doc.y = chartY + chartHeight + 25
      }

      // ── Fahrzeugverteilung ──
      if (fuelDist.length > 0) {
        doc.moveDown(1)
        doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK)
          .text('Registrierte Fahrzeuge nach Kraftstofftyp', 50)
        doc.moveDown(0.5)

        const fuelLabels: Record<string, string> = {
          PETROL: 'Benzin', DIESEL: 'Diesel', ELECTRIC: 'Elektro',
          HYBRID_PETROL: 'Hybrid (Benzin)', HYBRID_DIESEL: 'Hybrid (Diesel)',
          LPG: 'Autogas (LPG)', CNG: 'Erdgas (CNG)', HYDROGEN: 'Wasserstoff',
        }

        const totalVehicles = fuelDist.reduce((sum, f) => sum + f.count, 0)

        fuelDist.forEach(f => {
          const y = doc.y
          const label = fuelLabels[f.fuelType] || f.fuelType
          const pct = totalVehicles > 0 ? ((f.count / totalVehicles) * 100).toFixed(1) : '0'
          const barW = totalVehicles > 0 ? (f.count / totalVehicles) * (PAGE_WIDTH - 200) : 0

          doc.fontSize(9).font('Helvetica').fillColor(DARK)
            .text(label, 70, y, { width: 120 })
          doc.rect(195, y + 2, barW, 10).fill(GREEN)
          doc.fontSize(8).fillColor(GRAY)
            .text(f.count + ' (' + pct + '%)', 200 + barW + 5, y + 1)
          doc.y = y + 18
        })
      }

      // ════════════════════════════════════════════════════
      // PAGE 3: METHODOLOGY
      // ════════════════════════════════════════════════════
      doc.addPage()

      doc.fontSize(15).font('Helvetica-Bold').fillColor(DARK)
        .text('Berechnungsmethodik', 50)
      doc.moveDown(0.5)

      const methodSections = [
        {
          title: '1. CO2-Einsparung durch digitale Werkstattsuche',
          text: 'Bereifung24 ist eine digitale Plattform, die Kunden mit zertifizierten Reifenservice-Werkst\u00E4tten verbindet. ' +
            'Ohne die Plattform m\u00FCssten Kunden durchschnittlich ' + workshopsToCompare + ' Werkst\u00E4tten pers\u00F6nlich aufsuchen, ' +
            'um Preise und Verf\u00FCgbarkeit zu vergleichen. Durch die Online-Suche werden diese Fahrten \u00FCberfl\u00FCssig.',
        },
        {
          title: '2. Berechnungsgrundlagen (echte Fahrzeugdaten)',
          text: 'Die CO2-Berechnung basiert auf echten, individuellen Fahrzeugdaten der Nutzer:\n' +
            '- Tats\u00E4chlicher Kraftstofftyp des registrierten Fahrzeugs (Benzin, Diesel, Elektro, Hybrid, LPG, CNG)\n' +
            '- Realer Kraftstoffverbrauch des Fahrzeugs (L/100km bzw. kWh/100km)\n' +
            '- Echte Entfernung zwischen Kundenstandort und Werkstatt (via GPS/Geocoding)\n' +
            '- Nur bei fehlenden Fahrzeugdaten wird ein Fallback-Wert von ' + FALLBACK_CO2_PER_KM + ' g CO2/km verwendet (PKW-Durchschnitt Deutschland)',
        },
        {
          title: '3. Datenquellen',
          text: '- Direktbuchungen \u00FCber die Plattform (vermiedene Vergleichsfahrten)\n' +
            '- Fahrzeugdaten der registrierten Nutzer (Kraftstofftyp, Verbrauch)\n' +
            '- GPS-basierte Entfernungsberechnung zu den jeweiligen Werkst\u00E4tten',
        },
        {
          title: '4. Vergleichswerte (Quellen)',
          text: '- CO2-Absorption eines Baumes: ca. 22 kg CO2/Jahr (Umweltbundesamt)\n' +
            '- CO2 pro PKW-km: ca. 150 g (Kraftfahrt-Bundesamt, Durchschnitt Neuzulassungen)\n' +
            '- Flug Frankfurt-Mallorca: ca. 230 kg CO2 pro Passagier (atmosfair)',
        },
        {
          title: '5. Digitalisierungseffekt',
          text: 'Die Plattform digitalisiert den Preisvergleich und die Terminbuchung f\u00FCr Reifenservices. ' +
            'Dies reduziert nicht nur CO2-Emissionen, sondern auch:\n' +
            '- Zeitaufwand f\u00FCr Endverbraucher (ca. 2-3 Stunden Ersparnis pro Service)\n' +
            '- Verwaltungsaufwand f\u00FCr Werkst\u00E4tten (automatisierte Angebotserstellung)\n' +
            '- Papierverbrauch (digitale Kommunikation statt Papierangebote)\n' +
            'Bereifung24 leistet damit einen messbaren Beitrag zur Verkehrswende und Digitalisierung im Handwerk.',
        },
      ]

      methodSections.forEach(section => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK)
          .text(section.title, 50)
        doc.moveDown(0.3)
        doc.fontSize(9).font('Helvetica').fillColor('#374151')
          .text(section.text, 50, doc.y, { width: PAGE_WIDTH, lineGap: 2 })
        doc.moveDown(1)
      })

      // ── Disclaimer ──
      if (doc.y > 650) doc.addPage()
      doc.moveDown(0.5)
      const disclaimerY = doc.y
      doc.rect(50, disclaimerY, PAGE_WIDTH, 50).fill('#fefce8')
      doc.fillColor('#92400e').fontSize(8).font('Helvetica-Bold')
        .text('Hinweis', 65, disclaimerY + 10)
      doc.fillColor('#92400e').fontSize(7.5).font('Helvetica')
        .text(
          'Die CO2-Berechnungen basieren auf echten Fahrzeugdaten und GPS-basierten Entfernungen der Nutzer. ' +
          'Nur bei fehlenden Fahrzeugdaten werden wissenschaftlich anerkannte Durchschnittswerte als Fallback verwendet. ' +
          'Dieser Bericht dient zur Information und Dokumentation der \u00F6kologischen Wirkung der Plattform.',
          65, disclaimerY + 22,
          { width: PAGE_WIDTH - 30, lineGap: 2 }
        )
      doc.y = disclaimerY + 60

      // ── Signature Block ──
      if (doc.y > 700) {
        doc.addPage()
        doc.y = 80
      }
      doc.moveDown(2)
      const sigY = doc.y

      doc.moveTo(50, sigY).lineTo(250, sigY).strokeColor('#d1d5db').lineWidth(0.5).stroke()
      doc.moveTo(300, sigY).lineTo(500, sigY).stroke()

      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
        .text('Ort, Datum', 50, sigY + 5, { lineBreak: false })
      doc.text('Unterschrift Gesch\u00E4ftsf\u00FChrung', 300, sigY + 5, { lineBreak: false })

      // ── Footer on all pages ──
      const pages = doc.bufferedPageRange()
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i)
        // Disable margins so footer text at y=785+ doesn't trigger new pages
        ;(doc as any).page.margins = { top: 0, bottom: 0, left: 0, right: 0 }

        doc.moveTo(50, 780).lineTo(545, 780).strokeColor('#e5e7eb').lineWidth(0.5).stroke()

        doc.fillColor(GRAY).fontSize(7).font('Helvetica')
          .text('Bereifung24 | Digitale Plattform f\u00FCr Reifenservices', 50, 785, { lineBreak: false })
        doc.text('Seite ' + (i + 1) + ' von ' + pages.count, 50, 785, { align: 'right', width: PAGE_WIDTH, lineBreak: false })

        doc.fillColor('#9ca3af').fontSize(6)
          .text('Vertraulich - Nur f\u00FCr den internen Gebrauch und autorisierte Dritte bestimmt.', 50, 798, { align: 'center', width: PAGE_WIDTH, lineBreak: false })
      }

      doc.end()
    }) as Promise<NextResponse>
  } catch (error) {
    console.error('Error generating CO2 report PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatCO2(kg: number): string {
  if (kg >= 1000) return (kg / 1000).toFixed(2) + ' Tonnen'
  return kg.toFixed(2) + ' kg'
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const months = ['Jan', 'Feb', 'M\u00E4r', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  return months[parseInt(m) - 1] + ' ' + year
}
