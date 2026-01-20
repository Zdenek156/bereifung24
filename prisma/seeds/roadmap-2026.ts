import { PrismaClient, RoadmapTaskPriority, RoadmapTaskStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Roadmap 2026 Seed Data
 * Based on: Bereifung24 GmbH - Roadmaps 2026
 */

export async function seedRoadmap2026() {
  console.log('🗺️  Seeding Roadmap 2026...')

  // Get employees
  const matthias = await prisma.b24Employee.findFirst({ where: { email: 'matthias.krott@bereifung24.de' }})
  const eduard = await prisma.b24Employee.findFirst({ where: { email: 'eduard.sommer@bereifung24.de' }})
  const zdenek = await prisma.b24Employee.findFirst({ where: { email: 'zdenek.kyzlink@bereifung24.de' }})

  if (!matthias || !eduard || !zdenek) {
    console.log('⚠️  Employees not found, skipping roadmap seed')
    return
  }

  // Create Phases
  const phase1 = await prisma.roadmapPhase.upsert({
    where: { id: 'phase-1-pre-gruendung' },
    create: {
      id: 'phase-1-pre-gruendung',
      name: 'Phase 1: Pre-Gründung',
      description: 'Vorbereitung der GmbH-Gründung, Förderanträge, Planung',
      startMonth: '2026-01',
      endMonth: '2026-02',
      order: 1,
      color: '#3B82F6',
    },
    update: {}
  })

  const phase2 = await prisma.roadmapPhase.upsert({
    where: { id: 'phase-2-gruendung' },
    create: {
      id: 'phase-2-gruendung',
      name: 'Phase 2: Gründung',
      description: 'Offizielle GmbH-Gründung, Notartermin, Handelsregister',
      startMonth: '2026-03',
      endMonth: '2026-04',
      order: 2,
      color: '#10B981',
    },
    update: {}
  })

  const phase3 = await prisma.roadmapPhase.upsert({
    where: { id: 'phase-3-launch' },
    create: {
      id: 'phase-3-launch',
      name: 'Phase 3: Launch & Growth',
      description: 'Platform-Launch, Marketing-Kampagnen, Skalierung',
      startMonth: '2026-05',
      endMonth: '2026-12',
      order: 3,
      color: '#8B5CF6',
    },
    update: {}
  })

  console.log('✅ Created 3 Roadmap Phases')

  // ============================================
  // MATTHIAS KROTT - COO & CFO
  // ============================================

  const matthiasTasks = [
    // Januar 2026
    {
      title: 'Übersicht aller Förderungen erstellen (Fristen, Anforderungen, Beträge)',
      priority: RoadmapRoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Finance',
      tags: ['Förderung', 'Planung'],
      dueDate: new Date('2026-01-31'),
    },
    {
      title: 'Kostenplan für GmbH-Gründung erstellen (Notar, Gutachten, Marke, etc.)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Finance',
      tags: ['Gründung', 'Planung'],
      dueDate: new Date('2026-01-31'),
    },
    {
      title: 'INNOVATIONSGUTSCHEIN BW beantragen (schnellste Förderung, bis 15.000€)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Finance',
      tags: ['Förderung', 'BW'],
      dueDate: new Date('2026-01-15'),
    },
    {
      title: 'Angebot für Code-Gutachten einholen (3 Sachverständige vergleichen)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Operations',
      tags: ['Gutachten', 'Angebot'],
    },
    {
      title: 'Angebot für Wortmarke beim DPMA einholen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Operations',
      tags: ['Marke', 'Legal'],
    },
    {
      title: 'Finanzmodell Q1-Q4 2026 erstellen (Kosten, Umsatz, Break-even)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Finance',
      tags: ['Planung', 'Forecast'],
    },
    {
      title: 'Businessplan-Entwurf für Förderanträge starten',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Finance',
      tags: ['Businessplan', 'Förderung'],
    },

    // Februar 2026
    {
      title: 'DIGITALISIERUNGSPRAEMIE PLUS beantragen (bis 50.000€, schnell bewilligt)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Finance',
      tags: ['Förderung', 'Digitalisierung'],
      dueDate: new Date('2026-02-15'),
    },
    {
      title: 'Code-Gutachten beauftragen und abschließen',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Operations',
      tags: ['Gutachten', 'Critical'],
      dueDate: new Date('2026-02-28'),
    },
    {
      title: 'Wortmarke "Bereifung24" beim DPMA anmelden',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Operations',
      tags: ['Marke', 'Legal'],
    },
    {
      title: 'ZIM-Antrag vorbereiten (bis 550.000€, aber aufwändiger)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Finance',
      tags: ['Förderung', 'ZIM'],
    },
    {
      title: 'KMU-INNOVATIV (BMBF) Antrag vorbereiten',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Finance',
      tags: ['Förderung', 'BMBF'],
    },
    {
      title: 'Steuerberater für GmbH finden und Gespräch führen',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Finance',
      tags: ['Steuerberater', 'Gründung'],
    },
    {
      title: 'Bankkonto-Optionen für GmbH recherchieren',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Finance',
      tags: ['Banking', 'Recherche'],
    },

    // März 2026
    {
      title: 'Gesellschaftsvertrag finalisieren (mit Anwalt)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Operations',
      tags: ['Gründung', 'Legal'],
      dueDate: new Date('2026-03-15'),
    },
    {
      title: 'Notartermin koordinieren und durchführen',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Operations',
      tags: ['Gründung', 'Notar'],
      dueDate: new Date('2026-03-20'),
    },
    {
      title: 'Stammkapital einzahlen (Mindestens 12.500€ vor Handelsregister)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Finance',
      tags: ['Gründung', 'Kapital'],
      dueDate: new Date('2026-03-25'),
    },
    {
      title: 'Handelsregistereintragung veranlassen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Operations',
      tags: ['Gründung', 'Handelsregister'],
    },
    {
      title: 'ZIM-Antrag einreichen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Finance',
      tags: ['Förderung', 'ZIM'],
    },
    {
      title: 'KMU-INNOVATIV Antrag einreichen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Finance',
      tags: ['Förderung', 'BMBF'],
    },
    {
      title: 'Geschäftskonto eröffnen',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Finance',
      tags: ['Banking', 'Gründung'],
    },
    {
      title: 'Gewerbeanmeldung durchführen',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Operations',
      tags: ['Gründung', 'Gewerbe'],
    },
    {
      title: 'DBU-Antrag prüfen (Umweltaspekt: weniger Fahrten durch Vergleich?)',
      priority: RoadmapTaskPriority.P3_LOW,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Finance',
      tags: ['Förderung', 'Umwelt'],
    },

    // April 2026
    {
      title: 'IHK-Anmeldung abschließen',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Operations',
      tags: ['Gründung', 'IHK'],
    },
    {
      title: 'Finanzamt-Anmeldung (Steuernummer, USt-ID)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Finance',
      tags: ['Gründung', 'Finanzamt'],
    },
    {
      title: 'Erste Buchhaltungs-Prozesse aufsetzen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Finance',
      tags: ['Buchhaltung', 'Prozesse'],
    },
    {
      title: 'EU LIFE PROGRAMME prüfen (Umwelt-Fokus, hohe Summen möglich)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Finance',
      tags: ['Förderung', 'EU'],
    },
    {
      title: 'Versicherungen für GmbH abschließen (Haftpflicht, Rechtsschutz)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Operations',
      tags: ['Versicherung', 'Gründung'],
    },
    {
      title: 'SEPA-Lastschrift-System für Werkstätten einrichten',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Finance',
      tags: ['SEPA', 'Payment'],
    },
    {
      title: 'EIC Accelerator recherchieren (sehr kompetitiv, aber bis 2,5 Mio€)',
      priority: RoadmapTaskPriority.P3_LOW,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Finance',
      tags: ['Förderung', 'EU'],
    },

    // Mai-Juni 2026
    {
      title: 'Monatliches Finanz-Reporting aufsetzen (KPIs: Vermittlungen, Umsatz, Kosten)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Finance',
      tags: ['Reporting', 'KPIs'],
    },
    {
      title: 'Rückmeldungen zu Förderanträgen verfolgen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Finance',
      tags: ['Förderung', 'Follow-up'],
    },
    {
      title: 'Prozess für Werkstatt-Abrechnungen optimieren (automatisieren)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Operations',
      tags: ['Prozesse', 'Automatisierung'],
    },
    {
      title: 'Vertragstemplates erstellen (Werkstatt-Partnerverträge, AGB)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Operations',
      tags: ['Legal', 'Templates'],
    },
    {
      title: 'HR-Prozesse vorbereiten (falls erstes Team-Mitglied kommt)',
      priority: RoadmapTaskPriority.P3_LOW,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Operations',
      tags: ['HR', 'Team'],
    },

    // Juli-September 2026
    {
      title: 'Cashflow-Management (Fördergelder sollten fließen)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-07',
      category: 'Finance',
      tags: ['Cashflow', 'Förderung'],
    },
    {
      title: 'Budget für Q4 planen (Marketing-Push, App-Launch)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-08',
      category: 'Finance',
      tags: ['Budget', 'Planung'],
    },
    {
      title: 'Investor-Pitch-Deck erstellen (falls Förderungen nicht reichen)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-08',
      category: 'Finance',
      tags: ['Investor', 'Pitch'],
    },
    {
      title: 'Operating Metrics Dashboard aufbauen',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Operations',
      tags: ['Dashboard', 'Metrics'],
    },
    {
      title: 'Mitarbeiter-Handbuch erstellen',
      priority: RoadmapTaskPriority.P3_LOW,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Operations',
      tags: ['HR', 'Dokumentation'],
    },

    // Oktober-Dezember 2026
    {
      title: 'Jahresabschluss vorbereiten',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-10',
      category: 'Finance',
      tags: ['Buchhaltung', 'Jahresabschluss'],
    },
    {
      title: 'Budget-Planung 2027',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-11',
      category: 'Finance',
      tags: ['Budget', 'Planung'],
    },
    {
      title: 'Zweite Förderungsrunde planen (für 2027)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-11',
      category: 'Finance',
      tags: ['Förderung', 'Planung'],
    },
    {
      title: 'Skalierungs-Strategie entwickeln (mehr Regionen?)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-12',
      category: 'Operations',
      tags: ['Skalierung', 'Strategie'],
    },
    {
      title: 'Team-Erweiterung prüfen (Customer Success, Ops Support)',
      priority: RoadmapTaskPriority.P3_LOW,
      phaseId: phase3.id,
      month: '2026-12',
      category: 'Operations',
      tags: ['HR', 'Team'],
    },
  ]

  // Create Matthias's tasks
  for (const task of matthiasTasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        assignedToId: matthias.id,
        createdById: matthias.id,
      }
    })
  }

  console.log(`✅ Created ${matthiasTasks.length} tasks for Matthias Krott`)

  // ============================================
  // EDUARD SOMMER - CMO & CCO
  // ============================================

  const eduardTasks = [
    // Januar 2026
    {
      title: 'Brand Identity finalisieren (Logo, Farben, Fonts, Voice)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Marketing',
      tags: ['Brand', 'Design'],
      dueDate: new Date('2026-01-31'),
    },
    {
      title: 'Website-Relaunch planen (neue Brand, bessere UX)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Marketing',
      tags: ['Website', 'UX'],
    },
    {
      title: 'Social Media Strategie 2026 entwickeln',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Marketing',
      tags: ['Social Media', 'Strategie'],
    },
    {
      title: 'Content-Kalender Q1 erstellen',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Marketing',
      tags: ['Content', 'Planung'],
    },
    {
      title: 'TikTok-Account aufsetzen und erste Posts',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Marketing',
      tags: ['TikTok', 'Social Media'],
    },
    {
      title: 'Influencer-Recherche starten (Automotive, Lifestyle)',
      priority: RoadmapTaskPriority.P3_LOW,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Marketing',
      tags: ['Influencer', 'Recherche'],
    },

    // Februar 2026
    {
      title: 'Website-Relaunch umsetzen (neue Brand, Mobile-First)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Marketing',
      tags: ['Website', 'Launch'],
      dueDate: new Date('2026-02-28'),
    },
    {
      title: 'Google Ads Kampagne aufsetzen (Reifen, Werkstatt)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Marketing',
      tags: ['Google Ads', 'Paid'],
    },
    {
      title: 'Meta Ads (Facebook/Instagram) Kampagne starten',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Marketing',
      tags: ['Meta Ads', 'Paid'],
    },
    {
      title: 'SEO-Strategie entwickeln (Keywords, Backlinks)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Marketing',
      tags: ['SEO', 'Strategie'],
    },
    {
      title: 'E-Mail-Marketing aufsetzen (Newsletter, Automation)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Marketing',
      tags: ['E-Mail', 'Automation'],
    },
    {
      title: 'Erste Influencer kontaktieren',
      priority: RoadmapTaskPriority.P3_LOW,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Marketing',
      tags: ['Influencer', 'Outreach'],
    },

    // März 2026
    {
      title: 'PR-Strategie entwickeln (Pressemitteilung zur Gründung)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Marketing',
      tags: ['PR', 'Gründung'],
      dueDate: new Date('2026-03-20'),
    },
    {
      title: 'Launch-Kampagne vorbereiten (Teaser, Countdown)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Marketing',
      tags: ['Launch', 'Kampagne'],
    },
    {
      title: 'Content-Kalender Q2 erstellen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Marketing',
      tags: ['Content', 'Planung'],
    },
    {
      title: 'YouTube-Channel aufsetzen (How-To, Behind the Scenes)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Marketing',
      tags: ['YouTube', 'Video'],
    },
    {
      title: 'LinkedIn-Strategie für B2B (Werkstatt-Akquise)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Marketing',
      tags: ['LinkedIn', 'B2B'],
    },

    // April 2026
    {
      title: 'Pressekit erstellen (Logos, Bilder, Fact Sheet)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Marketing',
      tags: ['PR', 'Pressekit'],
    },
    {
      title: 'Referral-Programm konzipieren (Kunden werben Kunden)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Marketing',
      tags: ['Referral', 'Growth'],
    },
    {
      title: 'Podcast-Auftritte recherchieren (Automotive, Startup)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Marketing',
      tags: ['Podcast', 'PR'],
    },
    {
      title: 'Google My Business für alle Werkstätten optimieren',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Marketing',
      tags: ['GMB', 'Local SEO'],
    },

    // Mai 2026
    {
      title: 'Launch-Event organisieren (online oder hybrid)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Marketing',
      tags: ['Launch', 'Event'],
      dueDate: new Date('2026-05-15'),
    },
    {
      title: 'Große Launch-Kampagne durchführen (alle Kanäle)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Marketing',
      tags: ['Launch', 'Kampagne'],
      dueDate: new Date('2026-05-15'),
    },
    {
      title: 'Influencer-Kooperationen finalisieren (3-5 Influencer)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Marketing',
      tags: ['Influencer', 'Kooperation'],
    },
    {
      title: 'User-Generated Content Kampagne starten',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Marketing',
      tags: ['UGC', 'Social Media'],
    },

    // Juni-Juli 2026
    {
      title: 'Content-Kalender Q3 erstellen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Marketing',
      tags: ['Content', 'Planung'],
    },
    {
      title: 'Retargeting-Kampagnen optimieren',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Marketing',
      tags: ['Retargeting', 'Ads'],
    },
    {
      title: 'Customer Success Stories sammeln (Testimonials)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Marketing',
      tags: ['Testimonials', 'Content'],
    },
    {
      title: 'Sommer-Kampagne: "Urlaubs-Check" (Reifen vor Reise)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-07',
      category: 'Marketing',
      tags: ['Kampagne', 'Saisonal'],
    },
    {
      title: 'Affiliate-Programm aufsetzen (Blogger, Vergleichsportale)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-07',
      category: 'Marketing',
      tags: ['Affiliate', 'Growth'],
    },

    // August-September 2026
    {
      title: 'Herbst-Kampagne vorbereiten (Winterreifen-Wechsel)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase3.id,
      month: '2026-08',
      category: 'Marketing',
      tags: ['Kampagne', 'Winterreifen'],
      dueDate: new Date('2026-08-31'),
    },
    {
      title: 'Content-Kalender Q4 erstellen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Marketing',
      tags: ['Content', 'Planung'],
    },
    {
      title: 'Performance-Review Q1-Q3 (ROI, CAC, LTV)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Marketing',
      tags: ['Analytics', 'Review'],
    },
    {
      title: 'Lokale Kooperationen aufbauen (Autohäuser, TÜV)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Marketing',
      tags: ['Partnerships', 'B2B'],
    },

    // Oktober-Dezember 2026 (Peak Season!)
    {
      title: 'WINTERREIFEN-KAMPAGNE: Maximale Ad-Spend Auslastung',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase3.id,
      month: '2026-10',
      category: 'Marketing',
      tags: ['Kampagne', 'Winterreifen', 'Peak'],
      dueDate: new Date('2026-10-01'),
    },
    {
      title: 'Black Friday / Cyber Monday Aktion planen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-10',
      category: 'Marketing',
      tags: ['Black Friday', 'Promo'],
    },
    {
      title: 'Weihnachts-Kampagne: "Geschenk-Gutscheine"',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-11',
      category: 'Marketing',
      tags: ['Weihnachten', 'Kampagne'],
    },
    {
      title: 'Jahresrückblick 2026 erstellen (Infografik, Video)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-12',
      category: 'Marketing',
      tags: ['Jahresrückblick', 'Content'],
    },
    {
      title: 'Marketing-Strategie 2027 entwickeln',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-12',
      category: 'Marketing',
      tags: ['Strategie', 'Planung'],
    },
    {
      title: 'Budget-Planung 2027 (Marketing)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-12',
      category: 'Marketing',
      tags: ['Budget', 'Planung'],
    },
  ]

  // Create Eduard's tasks
  for (const task of eduardTasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        assignedToId: eduard.id,
        createdById: eduard.id,
      }
    })
  }

  console.log(`✅ Created ${eduardTasks.length} tasks for Eduard Sommer`)

  // ============================================
  // ZDENEK KYZLINK - CEO & Head of Product
  // ============================================

  const zdenekTasks = [
    // Januar 2026
    {
      title: 'Product Roadmap 2026 finalisieren',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Product',
      tags: ['Roadmap', 'Strategie'],
      dueDate: new Date('2026-01-31'),
    },
    {
      title: 'Tech Stack evaluieren (Flutter, Next.js, Prisma, etc.)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Product',
      tags: ['Tech', 'Evaluation'],
    },
    {
      title: 'Mobile App Wireframes erstellen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Product',
      tags: ['App', 'Design'],
    },
    {
      title: 'User Research durchführen (Interviews mit Werkstätten)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Product',
      tags: ['Research', 'UX'],
    },
    {
      title: 'Competitive Analysis (Mobile.de, ATU, Reifen.com)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-01',
      category: 'Product',
      tags: ['Research', 'Competition'],
    },

    // Februar 2026
    {
      title: 'Mobile App Design finalisieren (UI/UX)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Product',
      tags: ['App', 'Design'],
      dueDate: new Date('2026-02-28'),
    },
    {
      title: 'Flutter Development Environment aufsetzen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Product',
      tags: ['Flutter', 'Setup'],
    },
    {
      title: 'Backend API für Mobile App planen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Product',
      tags: ['API', 'Backend'],
    },
    {
      title: 'Database Schema für App erweitern',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Product',
      tags: ['Database', 'Schema'],
    },
    {
      title: 'Push-Notification System planen (Firebase)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase1.id,
      month: '2026-02',
      category: 'Product',
      tags: ['Notifications', 'Firebase'],
    },

    // März 2026
    {
      title: 'Mobile App Development starten (MVP Features)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Product',
      tags: ['App', 'Development'],
      dueDate: new Date('2026-03-31'),
    },
    {
      title: 'API Endpoints für App implementieren',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Product',
      tags: ['API', 'Development'],
    },
    {
      title: 'Authentication System (OAuth, JWT)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Product',
      tags: ['Auth', 'Security'],
    },
    {
      title: 'Payment Integration planen (Stripe, PayPal)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Product',
      tags: ['Payment', 'Integration'],
    },
    {
      title: 'Analytics Setup (Mixpanel, Google Analytics)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-03',
      category: 'Product',
      tags: ['Analytics', 'Tracking'],
    },

    // April 2026
    {
      title: 'MVP Testing durchführen (interne Alpha)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Product',
      tags: ['Testing', 'MVP'],
      dueDate: new Date('2026-04-15'),
    },
    {
      title: 'Bug-Fixing nach Alpha-Tests',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Product',
      tags: ['Bugs', 'QA'],
    },
    {
      title: 'Beta-Tester rekrutieren (10-20 Werkstätten)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Product',
      tags: ['Beta', 'Testing'],
    },
    {
      title: 'App Store / Play Store Listing vorbereiten',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Product',
      tags: ['App Store', 'Launch'],
    },
    {
      title: 'Performance-Optimierung (Ladezeiten, Memory)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase2.id,
      month: '2026-04',
      category: 'Product',
      tags: ['Performance', 'Optimization'],
    },

    // Mai 2026
    {
      title: 'MOBILE APP BETA LAUNCH (50 Werkstätten)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Product',
      tags: ['Launch', 'Beta'],
      dueDate: new Date('2026-05-15'),
    },
    {
      title: 'Beta-Feedback sammeln und auswerten',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Product',
      tags: ['Feedback', 'UX'],
    },
    {
      title: 'Feature-Requests priorisieren',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Product',
      tags: ['Features', 'Roadmap'],
    },
    {
      title: 'Crash-Reporting Setup (Sentry)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-05',
      category: 'Product',
      tags: ['Monitoring', 'Errors'],
    },

    // Juni 2026
    {
      title: 'App Version 1.1 entwickeln (Beta-Feedback)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Product',
      tags: ['App', 'Update'],
    },
    {
      title: 'A/B Testing Framework implementieren',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Product',
      tags: ['Testing', 'Optimization'],
    },
    {
      title: 'Onboarding Flow optimieren (User Success)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Product',
      tags: ['Onboarding', 'UX'],
    },
    {
      title: 'Referral-Feature entwickeln (In-App)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-06',
      category: 'Product',
      tags: ['Feature', 'Growth'],
    },

    // Juli 2026
    {
      title: 'App Store Optimization (ASO) durchführen',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-07',
      category: 'Product',
      tags: ['ASO', 'Marketing'],
    },
    {
      title: 'Public Launch vorbereiten (150 Werkstätten)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-07',
      category: 'Product',
      tags: ['Launch', 'Planung'],
    },
    {
      title: 'Customer Support System aufbauen (In-App Chat)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-07',
      category: 'Product',
      tags: ['Support', 'Feature'],
    },
    {
      title: 'API Rate Limiting & Security Audit',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-07',
      category: 'Product',
      tags: ['Security', 'API'],
    },

    // August 2026
    {
      title: 'MOBILE APP PUBLIC LAUNCH (iOS & Android)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase3.id,
      month: '2026-08',
      category: 'Product',
      tags: ['Launch', 'Public'],
      dueDate: new Date('2026-08-15'),
    },
    {
      title: 'Launch-Monitoring (Crashes, Performance, Usage)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-08',
      category: 'Product',
      tags: ['Monitoring', 'Analytics'],
    },
    {
      title: 'Hotfixes nach Launch (Bug-Reports)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-08',
      category: 'Product',
      tags: ['Bugs', 'Support'],
    },
    {
      title: 'User-Retention Strategie entwickeln',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-08',
      category: 'Product',
      tags: ['Retention', 'Growth'],
    },

    // September 2026
    {
      title: 'Feature-Roadmap Q4 finalisieren',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Product',
      tags: ['Roadmap', 'Planung'],
    },
    {
      title: 'Loyalty-Programm konzipieren (Punkte, Rewards)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Product',
      tags: ['Feature', 'Loyalty'],
    },
    {
      title: 'Dark Mode implementieren',
      priority: RoadmapTaskPriority.P3_LOW,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Product',
      tags: ['Feature', 'UX'],
    },
    {
      title: 'Offline-Modus entwickeln (für schlechtes Netz)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-09',
      category: 'Product',
      tags: ['Feature', 'Performance'],
    },

    // Oktober-Dezember 2026
    {
      title: 'Peak Season vorbereiten (Server-Skalierung)',
      priority: RoadmapTaskPriority.P0_CRITICAL,
      phaseId: phase3.id,
      month: '2026-10',
      category: 'Product',
      tags: ['Infrastructure', 'Skalierung'],
      dueDate: new Date('2026-10-01'),
    },
    {
      title: 'Load Testing durchführen (10x Traffic simulieren)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-10',
      category: 'Product',
      tags: ['Testing', 'Performance'],
    },
    {
      title: 'Auto-Scaling Setup (AWS / Hetzner Cloud)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-10',
      category: 'Product',
      tags: ['Infrastructure', 'DevOps'],
    },
    {
      title: 'Product Analytics Dashboard (Funnel, Cohorts)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-11',
      category: 'Product',
      tags: ['Analytics', 'Dashboard'],
    },
    {
      title: 'Year-End Review: Product Metrics (MAU, Retention, NPS)',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-12',
      category: 'Product',
      tags: ['Analytics', 'Review'],
    },
    {
      title: 'Product Roadmap 2027 entwickeln',
      priority: RoadmapTaskPriority.P1_HIGH,
      phaseId: phase3.id,
      month: '2026-12',
      category: 'Product',
      tags: ['Roadmap', 'Strategie'],
    },
    {
      title: 'AI/ML Features evaluieren (Preis-Prediction, Recommendations)',
      priority: RoadmapTaskPriority.P2_MEDIUM,
      phaseId: phase3.id,
      month: '2026-12',
      category: 'Product',
      tags: ['AI', 'Innovation'],
    },
  ]

  // Create Zdenek's tasks
  for (const task of zdenekTasks) {
    await prisma.roadmapTask.create({
      data: {
        ...task,
        assignedToId: zdenek.id,
        createdById: zdenek.id,
      }
    })
  }

  console.log(`✅ Created ${zdenekTasks.length} tasks for Zdenek Kyzlink`)

  console.log('🎉 Roadmap 2026 seed completed!')
  console.log(`📊 Total tasks created: ${matthiasTasks.length + eduardTasks.length + zdenekTasks.length}`)
}
