const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Roadmap 2026 seed...')

  // Get employees
  const matthias = await prisma.b24Employee.findFirst({ where: { email: 'matthias@bereifung24.de' } })
  const eduard = await prisma.b24Employee.findFirst({ where: { email: 'eduard@bereifung24.de' } })
  const zdenek = await prisma.b24Employee.findFirst({ where: { email: 'zdenek@bereifung24.de' } })
  const admin = await prisma.b24Employee.findFirst({ where: { email: 'admin@bereifung24.de' } })

  if (!matthias || !eduard || !zdenek) {
    throw new Error('Required employees not found')
  }

  // Delete existing roadmap data
  await prisma.roadmapTask.deleteMany()
  await prisma.roadmapPhase.deleteMany()
  console.log('🗑️  Cleaned existing roadmap data')

  // === PHASE 1: Pre-Gründung (Jan-Feb 2026) ===
  const phase1 = await prisma.roadmapPhase.create({
    data: {
      name: 'Phase 1: Pre-Gründung',
      description: 'Vorbereitung und rechtliche Grundlagen',
      startMonth: '2026-01',
      endMonth: '2026-02',
      order: 1,
      color: '#8B5CF6' // Purple
    }
  })
  console.log(`✅ Created Phase 1: ${phase1.name}`)

  // Matthias Q1 Tasks - Legal & Finance Setup
  const matthiasPhase1Tasks = [
    { title: 'Gesellschaftsvertrag erstellen', category: 'Legal', priority: 'P0_CRITICAL', month: '2026-01', dueDate: '2026-01-15', description: 'Notartermin vereinbaren, Gesellschaftsvertrag ausarbeiten lassen' },
    { title: 'Stammkapital 25.000€ einzahlen', category: 'Finance', priority: 'P0_CRITICAL', month: '2026-01', dueDate: '2026-01-20', description: 'Geschäftskonto eröffnen bei Postbank, Stammkapital einzahlen' },
    { title: 'Handelsregister Anmeldung', category: 'Legal', priority: 'P0_CRITICAL', month: '2026-01', dueDate: '2026-01-25', description: 'Nach Notartermin: GmbH im Handelsregister eintragen lassen' },
    { title: 'Steuerberater beauftragen', category: 'Finance', priority: 'P1_HIGH', month: '2026-01', dueDate: '2026-01-30', description: 'Kanzlei Peters & Schmidt für laufende Buchhaltung und Jahresabschluss' },
    { title: 'Geschäftsversicherungen abschließen', category: 'Finance', priority: 'P1_HIGH', month: '2026-02', dueDate: '2026-02-15', description: 'Betriebshaftpflicht, Rechtsschutz, D&O-Versicherung für Geschäftsführer' },
    { title: 'Büroräume anmieten', category: 'Operations', priority: 'P1_HIGH', month: '2026-02', dueDate: '2026-02-20', description: '120qm Büro in Stuttgart-Mitte, Gewerbemietvertrag unterzeichnen' },
    { title: 'Buchhaltungssoftware einrichten', category: 'Finance', priority: 'P2_MEDIUM', month: '2026-02', dueDate: '2026-02-28', description: 'DATEV oder lexoffice für GmbH-Buchhaltung, SKR04 Kontenrahmen' }
  ]

  // Eduard Q1 Tasks - Brand & Marketing Setup
  const eduardPhase1Tasks = [
    { title: 'Corporate Design entwickeln', category: 'Marketing', priority: 'P0_CRITICAL', month: '2026-01', dueDate: '2026-01-31', description: 'Logo, Farbschema, Schriftarten - mit Designagentur Berlin' },
    { title: 'Domain & Social Media Handles sichern', category: 'Marketing', priority: 'P0_CRITICAL', month: '2026-01', dueDate: '2026-01-10', description: 'bereifung24.de Domain, @bereifung24 Instagram/Facebook/TikTok' },
    { title: 'Geschäftsausstattung bestellen', category: 'Marketing', priority: 'P2_MEDIUM', month: '2026-02', dueDate: '2026-02-15', description: 'Visitenkarten, Briefpapier, Stempel mit neuem Corporate Design' },
    { title: 'Marketing Budget 2026 planen', category: 'Marketing', priority: 'P1_HIGH', month: '2026-02', dueDate: '2026-02-28', description: '€50k für Q1-Q2: Google Ads, Meta Ads, Influencer Kampagnen' },
    { title: 'Influencer Partnerschaften aufbauen', category: 'Marketing', priority: 'P2_MEDIUM', month: '2026-02', dueDate: '2026-02-28', description: 'Kontakt zu 5 Auto-Influencern (50k+ Follower) herstellen' }
  ]

  // Zdenek Q1 Tasks - Tech Infrastructure
  const zdenekPhase1Tasks = [
    { title: 'Hetzner Server aufsetzen', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-01', dueDate: '2026-01-15', description: 'CPX41 mit 8 vCPU, 16GB RAM, Ubuntu 24.04 LTS, PostgreSQL 16' },
    { title: 'Next.js 14 Projekt initialisieren', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-01', dueDate: '2026-01-20', description: 'TypeScript, Tailwind CSS, Prisma ORM, NextAuth.js Setup' },
    { title: 'Prisma Schema Design', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-01', dueDate: '2026-01-25', description: 'User, Workshop, Booking, Offer, Review Models mit Relations' },
    { title: 'CI/CD Pipeline einrichten', category: 'Tech', priority: 'P1_HIGH', month: '2026-02', dueDate: '2026-02-10', description: 'GitHub Actions: Test → Build → Deploy to Production mit PM2' },
    { title: 'Monitoring Setup', category: 'Tech', priority: 'P2_MEDIUM', month: '2026-02', dueDate: '2026-02-20', description: 'Sentry für Error Tracking, Uptime Robot für Availability Monitoring' },
    { title: 'Email Service Integration', category: 'Tech', priority: 'P1_HIGH', month: '2026-02', dueDate: '2026-02-28', description: 'Brevo/SendinBlue für Transaktional Emails: Buchungsbestätigungen, Receipts' }
  ]

  let order = 0
  for (const task of matthiasPhase1Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase1.id,
        assignedToId: matthias.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  for (const task of eduardPhase1Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase1.id,
        assignedToId: eduard.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  for (const task of zdenekPhase1Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase1.id,
        assignedToId: zdenek.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  console.log(`✅ Created ${order} tasks for Phase 1`)

  // === PHASE 2: Gründung & MVP (Mar-Apr 2026) ===
  const phase2 = await prisma.roadmapPhase.create({
    data: {
      name: 'Phase 2: Gründung & MVP',
      description: 'GmbH Eintragung und MVP Launch',
      startMonth: '2026-03',
      endMonth: '2026-04',
      order: 2,
      color: '#3B82F6' // Blue
    }
  })
  console.log(`✅ Created Phase 2: ${phase2.name}`)

  // Matthias Q2 Tasks - Operations & Compliance
  const matthiasPhase2Tasks = [
    { title: 'Erste Mitarbeiter einstellen', category: 'HR', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-15', description: '2 Customer Service Agents, 1 Junior Developer' },
    { title: 'Betriebsrat Gründung prüfen', category: 'HR', priority: 'P2_MEDIUM', month: '2026-03', dueDate: '2026-03-31', description: 'Ab 5 Mitarbeitern: Betriebsratswahl organisieren falls gewünscht' },
    { title: 'Datenschutz Compliance (DSGVO)', category: 'Legal', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-20', description: 'Datenschutzerklärung, AV-Verträge, DSGVO-konforme Cookie-Banner' },
    { title: 'AGB für Workshops erstellen', category: 'Legal', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-25', description: 'Rechtssichere AGB mit Anwalt ausarbeiten: Buchungen, Stornierungen, Haftung' },
    { title: 'Versicherungsschutz erweitern', category: 'Finance', priority: 'P1_HIGH', month: '2026-04', dueDate: '2026-04-15', description: 'Cyber-Versicherung, Vermögensschaden-Haftpflicht' },
    { title: 'Quartals-Buchhaltung Q1', category: 'Finance', priority: 'P1_HIGH', month: '2026-04', dueDate: '2026-04-30', description: 'UStVA abgeben, BWA erstellen lassen durch Steuerberater' }
  ]

  // Eduard Q2 Tasks - Launch Campaign
  const eduardPhase2Tasks = [
    { title: 'Launch Kampagne planen', category: 'Marketing', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-10', description: 'Go-Live Marketing: Google Ads, Meta Ads, Influencer Posts koordinieren' },
    { title: 'Pressearbeit MVP Launch', category: 'Marketing', priority: 'P1_HIGH', month: '2026-03', dueDate: '2026-03-20', description: 'Pressemitteilung an Auto Motor Sport, auto.de, regionale Medien Stuttgart' },
    { title: 'Google Ads Kampagnen starten', category: 'Marketing', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-25', description: 'Search Ads: "Reifenwechsel Stuttgart", "Werkstatt online buchen" - €2k Budget' },
    { title: 'Meta Ads Setup (Facebook/Instagram)', category: 'Marketing', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-28', description: 'Carousel Ads mit Workshop-Bildern, Targeting: 25-55 Jahre, Autobesitzer' },
    { title: 'Content Marketing starten', category: 'Marketing', priority: 'P2_MEDIUM', month: '2026-04', dueDate: '2026-04-15', description: 'Blog-Artikel: "Reifenwechsel selbst machen vs. Werkstatt", SEO-optimiert' },
    { title: 'Email Marketing Tool Setup', category: 'Marketing', priority: 'P2_MEDIUM', month: '2026-04', dueDate: '2026-04-20', description: 'Mailchimp/Brevo: Newsletter Templates, Automation Flows nach Buchung' },
    { title: 'Influencer Kampagne Q2 launchen', category: 'Marketing', priority: 'P1_HIGH', month: '2026-04', dueDate: '2026-04-30', description: '3 YouTube Videos + 10 Instagram Stories von Auto-Influencern' }
  ]

  // Zdenek Q2 Tasks - MVP Development
  const zdenekPhase2Tasks = [
    { title: 'User Authentication System', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-10', description: 'NextAuth.js mit Email/Password, Google OAuth, Magic Links' },
    { title: 'Workshop Listing & Search', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-15', description: 'Karte mit Werkstätten, Filter: PLZ, Radius, Services, Bewertungen' },
    { title: 'Booking Flow implementieren', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-20', description: 'Datumswahl, Terminauswahl, Fahrzeugdaten, Kontaktdaten, Buchungsübersicht' },
    { title: 'Payment Integration Stripe', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-03', dueDate: '2026-03-25', description: 'Kreditkarte, SEPA Lastschrift, Klarna - Payment Intent API' },
    { title: 'Email Notifications', category: 'Tech', priority: 'P1_HIGH', month: '2026-03', dueDate: '2026-03-28', description: 'Buchungsbestätigung, Erinnerung 1 Tag vorher, Rechnung nach Service' },
    { title: 'Review System', category: 'Tech', priority: 'P1_HIGH', month: '2026-04', dueDate: '2026-04-10', description: '5-Sterne Rating, Textbewertung, Foto-Upload, Moderation Queue' },
    { title: 'Admin Dashboard', category: 'Tech', priority: 'P1_HIGH', month: '2026-04', dueDate: '2026-04-15', description: 'Buchungsübersicht, Umsatz-Charts, Workshop-Management, User-Verwaltung' },
    { title: 'Mobile Responsiveness', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-04', dueDate: '2026-04-20', description: 'Alle Pages mobile-optimiert, Touch-Gesten, schnelle Ladezeiten < 2s' },
    { title: 'SEO Optimization', category: 'Tech', priority: 'P1_HIGH', month: '2026-04', dueDate: '2026-04-25', description: 'Meta Tags, Schema.org LocalBusiness Markup, Sitemap, robots.txt' },
    { title: 'MVP Launch', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-04', dueDate: '2026-04-30', description: 'Go-Live auf bereifung24.de - 20 Werkstätten live, vollständiger Buchungsflow' }
  ]

  order = 0
  for (const task of matthiasPhase2Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase2.id,
        assignedToId: matthias.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  for (const task of eduardPhase2Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase2.id,
        assignedToId: eduard.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  for (const task of zdenekPhase2Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase2.id,
        assignedToId: zdenek.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  console.log(`✅ Created ${order} tasks for Phase 2`)

  // === PHASE 3: Growth & Scale (May-Dec 2026) ===
  const phase3 = await prisma.roadmapPhase.create({
    data: {
      name: 'Phase 3: Growth & Scale',
      description: 'Skalierung auf 100+ Werkstätten und 1000+ Buchungen',
      startMonth: '2026-05',
      endMonth: '2026-12',
      order: 3,
      color: '#10B981' // Green
    }
  })
  console.log(`✅ Created Phase 3: ${phase3.name}`)

  // Matthias Q2-Q4 Tasks - Scaling Operations
  const matthiasPhase3Tasks = [
    { title: 'Expansion Stuttgart → München', category: 'Operations', priority: 'P0_CRITICAL', month: '2026-05', dueDate: '2026-05-31', description: '30 Werkstätten in München onboarden, lokales Marketing' },
    { title: 'Partnermanagement Tool', category: 'Operations', priority: 'P1_HIGH', month: '2026-05', dueDate: '2026-05-15', description: 'CRM für Workshop-Partner: Verträge, Abrechnungen, Support-Tickets' },
    { title: 'Quartals-Buchhaltung Q2', category: 'Finance', priority: 'P1_HIGH', month: '2026-07', dueDate: '2026-07-31', description: 'UStVA Q2, BWA, erste Umsätze analysieren' },
    { title: 'Expansion München → Frankfurt', category: 'Operations', priority: 'P0_CRITICAL', month: '2026-08', dueDate: '2026-08-31', description: '25 Werkstätten Frankfurt/Rhein-Main, Logistik-Planung' },
    { title: 'Team-Erweiterung Q3', category: 'HR', priority: 'P1_HIGH', month: '2026-09', dueDate: '2026-09-30', description: '2 Sales Agents für Workshop-Akquise, 1 Senior Developer' },
    { title: 'Quartals-Buchhaltung Q3', category: 'Finance', priority: 'P1_HIGH', month: '2026-10', dueDate: '2026-10-31', description: 'UStVA Q3, Cashflow-Prognose Q4, Jahresplanung 2027' },
    { title: 'Expansion Frankfurt → Hamburg', category: 'Operations', priority: 'P1_HIGH', month: '2026-11', dueDate: '2026-11-30', description: '20 Werkstätten Hamburg, Norddeutschland-Strategie' },
    { title: 'Jahresabschluss Vorbereitung', category: 'Finance', priority: 'P0_CRITICAL', month: '2026-12', dueDate: '2026-12-20', description: 'Inventur, Rückstellungen, Abschreibungen - Steuerberater Briefing' }
  ]

  // Eduard Q2-Q4 Tasks - Marketing Scale
  const eduardPhase3Tasks = [
    { title: 'Affiliate Programm Launch', category: 'Marketing', priority: 'P1_HIGH', month: '2026-05', dueDate: '2026-05-31', description: '15% Commission für Affiliates, Tracking mit UTM, Auszahlung monatlich' },
    { title: 'Referral Programm', category: 'Marketing', priority: 'P2_MEDIUM', month: '2026-06', dueDate: '2026-06-30', description: '10€ Gutschein für Empfehlung + Empfohlene, virales Wachstum' },
    { title: 'Sommer-Kampagne "Reifenwechsel"', category: 'Marketing', priority: 'P0_CRITICAL', month: '2026-06', dueDate: '2026-06-15', description: 'Winterreifen → Sommerreifen, €5k Ad Budget, 15% Discount Aktion' },
    { title: 'YouTube Channel starten', category: 'Marketing', priority: 'P2_MEDIUM', month: '2026-07', dueDate: '2026-07-31', description: 'Auto-Tipps, Werkstatt-Portraits, 2 Videos/Monat' },
    { title: 'Google Shopping Ads', category: 'Marketing', priority: 'P1_HIGH', month: '2026-08', dueDate: '2026-08-31', description: 'Product Feed für Google Shopping: Reifensets, Services als Produkte' },
    { title: 'Herbst-Kampagne "Winterreifen"', category: 'Marketing', priority: 'P0_CRITICAL', month: '2026-09', dueDate: '2026-09-15', description: 'Sommerreifen → Winterreifen, Peak-Saison, €10k Budget' },
    { title: 'TikTok Marketing Experiment', category: 'Marketing', priority: 'P2_MEDIUM', month: '2026-10', dueDate: '2026-10-31', description: 'Kurze Clips: "Reifenwechsel in 60 Sekunden", UGC-Content fördern' },
    { title: 'Black Friday Aktion', category: 'Marketing', priority: 'P1_HIGH', month: '2026-11', dueDate: '2026-11-27', description: '20% Rabatt auf alle Buchungen, Flash-Sale, Push-Notifications' },
    { title: 'Jahresrückblick Content', category: 'Marketing', priority: 'P2_MEDIUM', month: '2026-12', dueDate: '2026-12-20', description: 'Infografik: 1000+ Buchungen, 100+ Werkstätten, Best-of Social Media' }
  ]

  // Zdenek Q2-Q4 Tasks - Product Development
  const zdenekPhase3Tasks = [
    { title: 'Mobile App iOS', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-05', dueDate: '2026-05-31', description: 'React Native App: Buchungsflow, Push-Notifications, Apple Review' },
    { title: 'Mobile App Android', category: 'Tech', priority: 'P0_CRITICAL', month: '2026-06', dueDate: '2026-06-30', description: 'React Native App: Play Store Release, Android 10+ Support' },
    { title: 'Workshop Calendar Integration', category: 'Tech', priority: 'P1_HIGH', month: '2026-06', dueDate: '2026-06-15', description: 'Google Calendar Sync für Werkstätten, Termin-Blocking, Availability API' },
    { title: 'Live Chat Support', category: 'Tech', priority: 'P2_MEDIUM', month: '2026-07', dueDate: '2026-07-31', description: 'Intercom/Crisp Integration, Chatbot für FAQs, Live-Agent Escalation' },
    { title: 'Dynamic Pricing System', category: 'Tech', priority: 'P1_HIGH', month: '2026-08', dueDate: '2026-08-31', description: 'Preise nach Auslastung, Peak-Zeiten teurer, Discounts bei Low-Demand' },
    { title: 'Fleet Management Feature', category: 'Tech', priority: 'P2_MEDIUM', month: '2026-09', dueDate: '2026-09-30', description: 'Für Firmenkunden: Mehrere Fahrzeuge, Sammelrechnungen, Reporting' },
    { title: 'AI Recommendation Engine', category: 'Tech', priority: 'P2_MEDIUM', month: '2026-10', dueDate: '2026-10-31', description: 'ML-basierte Werkstatt-Empfehlung: Standort, Bewertung, Preis, Verfügbarkeit' },
    { title: 'Performance Optimization', category: 'Tech', priority: 'P1_HIGH', month: '2026-11', dueDate: '2026-11-30', description: 'CDN Integration, Image Optimization, Lazy Loading, Core Web Vitals 90+' },
    { title: 'Year-End Reporting Dashboard', category: 'Tech', priority: 'P1_HIGH', month: '2026-12', dueDate: '2026-12-15', description: 'Jahresstatistiken: Revenue, Buchungen, User-Wachstum, Top-Werkstätten' }
  ]

  order = 0
  for (const task of matthiasPhase3Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase3.id,
        assignedToId: matthias.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  for (const task of eduardPhase3Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase3.id,
        assignedToId: eduard.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  for (const task of zdenekPhase3Tasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        phaseId: phase3.id,
        assignedToId: zdenek.id,
        createdById: admin.id,
        order: order++
      }
    })
  }

  console.log(`✅ Created ${order} tasks for Phase 3`)

  // Summary
  const totalPhases = await prisma.roadmapPhase.count()
  const totalTasks = await prisma.roadmapTask.count()
  const tasksByPerson = await prisma.roadmapTask.groupBy({
    by: ['assignedToId'],
    _count: true
  })

  console.log('\n🎉 Seed completed!')
  console.log(`📊 Total: ${totalPhases} Phases, ${totalTasks} Tasks`)
  console.log('\n👥 Tasks by Person:')
  for (const stat of tasksByPerson) {
    const employee = await prisma.b24Employee.findUnique({
      where: { id: stat.assignedToId },
      select: { firstName: true, lastName: true }
    })
    console.log(`   ${employee.firstName} ${employee.lastName}: ${stat._count} tasks`)
  }
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
