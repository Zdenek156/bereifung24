import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

/**
 * GET /api/admin/co2-analytics/export
 * Generates a professional CO₂ Sustainability Report PDF
 * For: Förderstellen, IHK, Wirtschaftsförderung, Banken, Partner
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'B24_EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // ─── Fetch all analytics data (same logic as co2-analytics route) ───

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

    const monthlyTrend: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COUNT(*) FILTER (WHERE "savedCO2Grams" IS NOT NULL) as requests_with_co2,
        COALESCE(SUM("savedCO2Grams"), 0) as co2_grams
      FROM tire_requests
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
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
      totalCO2FromRequestsKg: Math.round(totalCO2FromRequests / 1000 * 100) / 100,
      totalCO2FromBookingsKg: Math.round(co2SavedBookingsGrams / 1000 * 100) / 100,
      totalKmSaved: Math.round(totalKmSaved),
      totalTripsAvoided: tripsAvoided + Number(tireRequestStats[0]?.calculated_count ?? 0),
      fuelSavedLiters: Math.round(fuelSavedLiters * 10) / 10,
      moneySaved: Math.round(moneySaved * 100) / 100,
    }

    const comparisons = {
      equivalentTrees: Math.round(totalCO2Kg / 22 * 10) / 10,
      equivalentCarKm: Math.round(totalCO2Grams / FALLBACK_CO2_PER_KM),
      equivalentFlights: Math.round(totalCO2Kg / 230 * 10) / 10,
      equivalentPhoneCharges: Math.round(totalCO2Grams / 8),
    }

    const counts = {
      tireRequestsTotal: Number(tireRequestStats[0]?.total_count ?? 0),
      tireRequestsWithCO2: Number(tireRequestStats[0]?.calculated_count ?? 0),
      avgCO2PerRequest: Math.round(Number(tireRequestStats[0]?.avg_co2_grams ?? 0)),
      directBookingsActive: activeBookings,
      directBookingsTotal: Number(bookingStats[0]?.total_bookings ?? 0),
    }

    const monthly = monthlyTrend.map(m => ({
      month: m.month,
      co2Kg: Math.round(Number(m.co2_grams) / 1000 * 100) / 100,
      requests: Number(m.requests_with_co2),
    }))

    const monthlyBook = monthlyBookings.map(m => ({
      month: m.month,
      bookings: Number(m.bookings),
    }))

    const fuelDist = fuelTypeDistribution.map(f => ({
      fuelType: f.fuelType,
      count: Number(f.count),
    }))

    // ─── Generate PDF ───

    const now = new Date()
    const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const generatedBy = session.user.name || session.user.email || 'System'

    return new Promise<NextResponse>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
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

      const PAGE_WIDTH = 595.28 - 100 // A4 width minus margins
      const GREEN = '#16a34a'
      const DARK = '#111827'
      const GRAY = '#6b7280'
      const LIGHT_GREEN = '#f0fdf4'

      // ── Try to load logo ──
      let logoBuffer: Buffer | null = null
      try {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png')
        if (fs.existsSync(logoPath)) {
          logoBuffer = fs.readFileSync(logoPath)
        }
      } catch (e) {
        // Logo not available, continue without
      }

      // ════════════════════════════════════════════════════
      // PAGE 1: COVER & KEY METRICS
      // ════════════════════════════════════════════════════

      // Logo
      if (logoBuffer) {
        doc.image(logoBuffer, 50, 40, { width: 150 })
        doc.moveDown(4)
      } else {
        doc.moveDown(1)
      }

      // Title Block
      doc.y = 130
      doc.fontSize(28).font('Helvetica-Bold').fillColor(GREEN)
        .text('CO₂-Nachhaltigkeitsbericht', { align: 'center' })
      doc.moveDown(0.3)
      doc.fontSize(14).font('Helvetica').fillColor(GRAY)
        .text('Bereifung24 GmbH – Digitale Plattform für Reifenservices', { align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(11).fillColor(GRAY)
        .text(`Erstellt am ${dateStr}`, { align: 'center' })

      // Horizontal Line
      doc.moveDown(1.5)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(GREEN).lineWidth(2).stroke()
      doc.moveDown(2)

      // ── Executive Summary Box ──
      const summaryY = doc.y
      doc.rect(50, summaryY, PAGE_WIDTH, 100).fill('#ecfdf5')
      doc.fillColor(DARK)
      doc.fontSize(14).font('Helvetica-Bold')
        .text('Zusammenfassung', 70, summaryY + 15)
      doc.fontSize(10).font('Helvetica').fillColor('#374151')
        .text(
          `Durch die Nutzung der Bereifung24-Plattform wurden bisher insgesamt ${formatCO2(overview.totalCO2Kg)} CO₂ eingespart. ` +
          `Das entspricht der jährlichen CO₂-Absorption von ${comparisons.equivalentTrees} Bäumen oder ${comparisons.equivalentCarKm.toLocaleString('de-DE')} km Autofahrt. ` +
          `Insgesamt wurden ${overview.totalTripsAvoided.toLocaleString('de-DE')} unnötige Fahrten zu Werkstätten vermieden und ` +
          `${overview.fuelSavedLiters.toLocaleString('de-DE')} Liter Kraftstoff eingespart.`,
          70, summaryY + 38,
          { width: PAGE_WIDTH - 40, lineGap: 3 }
        )
      doc.y = summaryY + 115

      // ── 4 KPI Cards ──
      doc.moveDown(1)
      doc.fontSize(16).font('Helvetica-Bold').fillColor(DARK)
        .text('Kernindikatoren (KPIs)', 50)
      doc.moveDown(0.8)

      const kpiStartY = doc.y
      const kpiWidth = (PAGE_WIDTH - 30) / 2
      const kpiHeight = 70
      const kpis = [
        { label: 'CO₂ eingespart', value: formatCO2(overview.totalCO2Kg), sub: `Ø ${counts.avgCO2PerRequest} g/Anfrage` },
        { label: 'Kilometer eingespart', value: `${overview.totalKmSaved.toLocaleString('de-DE')} km`, sub: `${overview.totalTripsAvoided.toLocaleString('de-DE')} Fahrten vermieden` },
        { label: 'Kraftstoff eingespart', value: `${overview.fuelSavedLiters.toLocaleString('de-DE')} Liter`, sub: `${overview.moneySaved.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € Ersparnis` },
        { label: 'Plattform-Nutzung', value: `${counts.tireRequestsTotal.toLocaleString('de-DE')} Anfragen`, sub: `${counts.directBookingsActive.toLocaleString('de-DE')} Direktbuchungen` },
      ]

      kpis.forEach((kpi, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = 50 + col * (kpiWidth + 10)
        const y = kpiStartY + row * (kpiHeight + 10)

        doc.rect(x, y, kpiWidth, kpiHeight).fill('#f0fdf4')
        doc.fillColor(GREEN).fontSize(9).font('Helvetica')
          .text(kpi.label, x + 15, y + 12, { width: kpiWidth - 30 })
        doc.fillColor(DARK).fontSize(18).font('Helvetica-Bold')
          .text(kpi.value, x + 15, y + 26, { width: kpiWidth - 30 })
        doc.fillColor(GRAY).fontSize(8).font('Helvetica')
          .text(kpi.sub, x + 15, y + 50, { width: kpiWidth - 30 })
      })

      doc.y = kpiStartY + 2 * (kpiHeight + 10) + 20

      // ── Umwelt-Vergleiche ──
      doc.fontSize(16).font('Helvetica-Bold').fillColor(DARK)
        .text('Umwelt-Äquivalenzen', 50)
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica').fillColor(GRAY)
        .text('Die eingesparten CO₂-Emissionen entsprechen:')
      doc.moveDown(0.5)

      const eqItems = [
        { icon: '🌳', text: `${comparisons.equivalentTrees} Bäume`, desc: 'jährliche CO₂-Absorption (1 Baum ≈ 22 kg CO₂/Jahr)' },
        { icon: '🚗', text: `${comparisons.equivalentCarKm.toLocaleString('de-DE')} km`, desc: 'Autofahrt (Ø 150 g CO₂/km)' },
        { icon: '✈️', text: `${comparisons.equivalentFlights} Flüge`, desc: 'Frankfurt – Mallorca (≈ 230 kg CO₂)' },
        { icon: '💰', text: `${overview.moneySaved.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, desc: 'eingesparte Kraftstoffkosten für Verbraucher' },
      ]

      eqItems.forEach(item => {
        const y = doc.y
        doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK)
          .text(`${item.icon}  ${item.text}`, 70, y)
        doc.fontSize(9).font('Helvetica').fillColor(GRAY)
          .text(item.desc, 70, y + 14)
        doc.y = y + 30
      })

      // ════════════════════════════════════════════════════
      // PAGE 2: TRENDS & METHODOLOGY
      // ════════════════════════════════════════════════════
      doc.addPage()

      // ── Monatlicher Trend (Tabelle) ──
      doc.fontSize(16).font('Helvetica-Bold').fillColor(DARK)
        .text('Monatliche Entwicklung (CO₂-Einsparungen)', 50)
      doc.moveDown(0.3)
      doc.fontSize(9).font('Helvetica').fillColor(GRAY)
        .text('Letzte 12 Monate – basierend auf Reifenservice-Anfragen und Direktbuchungen')
      doc.moveDown(0.8)

      // Merge monthly data
      const monthMap = new Map<string, { co2Kg: number, requests: number, bookings: number }>()
      monthly.forEach(m => {
        monthMap.set(m.month, { co2Kg: m.co2Kg, requests: m.requests, bookings: 0 })
      })
      monthlyBook.forEach(m => {
        const existing = monthMap.get(m.month) || { co2Kg: 0, requests: 0, bookings: 0 }
        existing.bookings = m.bookings
        monthMap.set(m.month, existing)
      })

      const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

      // Table Header
      const tableX = 50
      const colWidths = [100, 100, 120, 120]
      const headers = ['Monat', 'CO₂ (kg)', 'Anfragen', 'Buchungen']
      let tableY = doc.y

      doc.rect(tableX, tableY, PAGE_WIDTH, 22).fill('#166534')
      headers.forEach((h, i) => {
        const x = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
          .text(h, x + 8, tableY + 6, { width: colWidths[i] - 16 })
      })
      tableY += 22

      // Table Rows
      let totalMonthCO2 = 0
      let totalMonthRequests = 0
      let totalMonthBookings = 0

      sortedMonths.forEach((entry, idx) => {
        const [month, data] = entry
        const isEven = idx % 2 === 0
        if (isEven) {
          doc.rect(tableX, tableY, PAGE_WIDTH, 20).fill('#f9fafb')
        }

        const monthLabel = formatMonth(month)
        const vals = [monthLabel, data.co2Kg.toFixed(2), data.requests.toString(), data.bookings.toString()]
        vals.forEach((v, i) => {
          const x = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
          doc.fillColor(DARK).fontSize(9).font('Helvetica')
            .text(v, x + 8, tableY + 5, { width: colWidths[i] - 16 })
        })

        totalMonthCO2 += data.co2Kg
        totalMonthRequests += data.requests
        totalMonthBookings += data.bookings
        tableY += 20
      })

      // Total Row
      doc.rect(tableX, tableY, PAGE_WIDTH, 22).fill('#ecfdf5')
      const totals = ['Gesamt', totalMonthCO2.toFixed(2), totalMonthRequests.toString(), totalMonthBookings.toString()]
      totals.forEach((v, i) => {
        const x = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
        doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold')
          .text(v, x + 8, tableY + 6, { width: colWidths[i] - 16 })
      })
      tableY += 30
      doc.y = tableY

      // ── Bar Chart Visualization (simplified) ──
      if (sortedMonths.length > 0) {
        doc.moveDown(0.5)
        doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK)
          .text('CO₂-Einsparungen pro Monat (kg)', 50)
        doc.moveDown(0.5)

        const chartX = 80
        const chartWidth = PAGE_WIDTH - 60
        const chartHeight = 100
        const chartY = doc.y
        const maxCO2 = Math.max(...sortedMonths.map(([, d]) => d.co2Kg), 1)
        const barWidth = Math.min(30, (chartWidth - 20) / sortedMonths.length - 4)

        // Y-axis
        doc.moveTo(chartX, chartY).lineTo(chartX, chartY + chartHeight).strokeColor('#d1d5db').lineWidth(0.5).stroke()
        // X-axis
        doc.moveTo(chartX, chartY + chartHeight).lineTo(chartX + chartWidth, chartY + chartHeight).stroke()

        sortedMonths.forEach(([month, data], i) => {
          const barHeight = (data.co2Kg / maxCO2) * (chartHeight - 10)
          const x = chartX + 15 + i * ((chartWidth - 20) / sortedMonths.length)
          const y = chartY + chartHeight - barHeight

          doc.rect(x, y, barWidth, barHeight).fill(GREEN)

          // Month label (short)
          doc.fillColor(GRAY).fontSize(6).font('Helvetica')
            .text(month.slice(5), x - 2, chartY + chartHeight + 3, { width: barWidth + 4, align: 'center' })

          // Value on top
          if (data.co2Kg > 0) {
            doc.fillColor(DARK).fontSize(6).font('Helvetica')
              .text(data.co2Kg.toFixed(1), x - 4, y - 10, { width: barWidth + 8, align: 'center' })
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
            .text(`${f.count} (${pct}%)`, 200 + barW + 5, y + 1)
          doc.y = y + 18
        })
      }

      // ════════════════════════════════════════════════════
      // PAGE 3: METHODOLOGY & FOOTER
      // ════════════════════════════════════════════════════
      doc.addPage()

      doc.fontSize(16).font('Helvetica-Bold').fillColor(DARK)
        .text('Berechnungsmethodik', 50)
      doc.moveDown(0.5)

      doc.fontSize(10).font('Helvetica').fillColor('#374151')

      const methodSections = [
        {
          title: '1. CO₂-Einsparung durch digitale Werkstattsuche',
          text: `Bereifung24 ist eine digitale Plattform, die Kunden mit zertifizierten Reifenservice-Werkstätten verbindet. ` +
            `Ohne die Plattform müssten Kunden durchschnittlich ${workshopsToCompare} Werkstätten persönlich aufsuchen, ` +
            `um Preise und Verfügbarkeit zu vergleichen. Durch die Online-Suche werden diese Fahrten überflüssig.`,
        },
        {
          title: '2. Berechnungsgrundlagen',
          text: `• Durchschnittliche Entfernung zur Werkstatt: ${AVG_WORKSHOP_DISTANCE_KM} km (einfache Strecke)\n` +
            `• Durchschnittliche CO₂-Emission: ${FALLBACK_CO2_PER_KM} g/km (PKW-Durchschnitt Deutschland)\n` +
            `• Vermiedene Fahrten pro Anfrage: ${workshopsToCompare - 1} (von ${workshopsToCompare} auf 1 Werkstattbesuch)\n` +
            `• Durchschnittlicher Kraftstoffverbrauch: ${avgFuelPer100km} L/100km\n` +
            `• Durchschnittlicher Kraftstoffpreis: ${avgFuelPrice.toFixed(2)} €/L`,
        },
        {
          title: '3. Datenquellen',
          text: `• Reifenservice-Anfragen mit individueller CO₂-Berechnung (fahrzeugspezifisch)\n` +
            `• Direktbuchungen über die Plattform (vermiedene Vergleichsfahrten)\n` +
            `• Fahrzeugdaten der registrierten Nutzer (Kraftstofftyp, Verbrauch)\n` +
            `• Konfigurierbare Systemparameter (verifiziert durch Administrationsteam)`,
        },
        {
          title: '4. Vergleichswerte (Quellen)',
          text: `• CO₂-Absorption eines Baumes: ~22 kg CO₂/Jahr (Umweltbundesamt)\n` +
            `• CO₂ pro PKW-km: ~150 g (Kraftfahrt-Bundesamt, Durchschnitt Neuzulassungen)\n` +
            `• Flug Frankfurt–Mallorca: ~230 kg CO₂ pro Passagier (atmosfair)\n` +
            `• Smartphone-Ladung: ~8 g CO₂ (durchschnittlicher Strommix Deutschland)`,
        },
        {
          title: '5. Digitalisierungseffekt',
          text: `Die Plattform digitalisiert den Preisvergleich und die Terminbuchung für Reifenservices. ` +
            `Dies reduziert nicht nur CO₂-Emissionen, sondern auch:\n` +
            `• Zeitaufwand für Endverbraucher (Ø 2-3 Stunden Ersparnis pro Service)\n` +
            `• Verwaltungsaufwand für Werkstätten (automatisierte Angebotserstellung)\n` +
            `• Papierverbrauch (digitale Kommunikation statt Papierangebote)\n` +
            `Bereifung24 GmbH leistet damit einen messbaren Beitrag zur Verkehrswende und Digitalisierung im Handwerk.`,
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
      doc.moveDown(1)
      const disclaimerY = doc.y
      doc.rect(50, disclaimerY, PAGE_WIDTH, 50).fill('#fefce8')
      doc.fillColor('#92400e').fontSize(8).font('Helvetica-Bold')
        .text('Hinweis', 65, disclaimerY + 10)
      doc.fillColor('#92400e').fontSize(7.5).font('Helvetica')
        .text(
          'Die CO₂-Berechnungen basieren auf Durchschnittswerten und wissenschaftlich anerkannten Quellen. ' +
          'Individuelle Einsparungen können je nach Fahrzeug, Entfernung und Fahrverhalten variieren. ' +
          'Dieser Bericht dient zur Information und Dokumentation der ökologischen Wirkung der Plattform.',
          65, disclaimerY + 22,
          { width: PAGE_WIDTH - 30, lineGap: 2 }
        )

      // ── Signature Block ──
      doc.moveDown(4)
      const sigY = Math.max(doc.y, 650) // Ensure enough space at bottom

      doc.moveTo(50, sigY).lineTo(250, sigY).strokeColor('#d1d5db').lineWidth(0.5).stroke()
      doc.moveTo(300, sigY).lineTo(500, sigY).stroke()

      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
        .text('Ort, Datum', 50, sigY + 5)
        .text('Unterschrift Geschäftsführung', 300, sigY + 5)

      // ── Footer on all pages ──
      const pages = doc.bufferedPageRange()
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i)

        // Footer line
        doc.moveTo(50, 780).lineTo(545, 780).strokeColor('#e5e7eb').lineWidth(0.5).stroke()

        // Company info
        doc.fillColor(GRAY).fontSize(7).font('Helvetica')
          .text('Bereifung24 GmbH | Digitale Plattform für Reifenservices', 50, 785)
          .text(`Seite ${i + 1} von ${pages.count}`, 50, 785, { align: 'right', width: PAGE_WIDTH })

        // Confidentiality
        doc.fillColor('#9ca3af').fontSize(6)
          .text('Vertraulich – Nur für den internen Gebrauch und autorisierte Dritte bestimmt.', 50, 798, { align: 'center', width: PAGE_WIDTH })
      }

      doc.end()
    }) as Promise<NextResponse>
  } catch (error) {
    console.error('Error generating CO2 report PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatCO2(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} Tonnen`
  return `${kg.toFixed(2)} kg`
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  return `${months[parseInt(m) - 1]} ${year}`
}
