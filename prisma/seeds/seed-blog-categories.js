const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const categories = [
  // Kunden-Kategorien (6)
  {
    slug: 'wartung-pflege',
    name: 'Wartung & Pflege',
    description: 'Tipps und Anleitungen zur richtigen Wartung und Pflege Ihrer Reifen',
    icon: '🔧',
    color: '#3B82F6',
    seoTitle: 'Reifenwartung & Pflege - Tipps für längere Lebensdauer',
    seoDescription: 'Professionelle Tipps zur Reifenwartung: Luftdruck prüfen, Profiltiefe messen, richtige Lagerung und mehr. Verlängern Sie die Lebensdauer Ihrer Reifen.',
    sortOrder: 1,
    parentId: null
  },
  {
    slug: 'saisonales',
    name: 'Saisonales',
    description: 'Alles rund um Sommer- und Winterreifen, Wechseltermine und saisonale Tipps',
    icon: '❄️',
    color: '#10B981',
    seoTitle: 'Reifenwechsel Saison - Wann von Winter auf Sommerreifen wechseln?',
    seoDescription: 'O-bis-O-Regel, gesetzliche Vorschriften und der beste Zeitpunkt für den Reifenwechsel. Winterreifen, Sommerreifen und Ganzjahresreifen im Vergleich.',
    sortOrder: 2,
    parentId: null
  },
  {
    slug: 'kosten-preise',
    name: 'Kosten & Preise',
    description: 'Transparente Informationen zu Reifenpreisen, Wechselkosten und Sparmöglichkeiten',
    icon: '💰',
    color: '#F59E0B',
    seoTitle: 'Reifenwechsel Kosten 2026 - Was kostet Reifenmontage?',
    seoDescription: 'Aktuelle Preise für Reifenwechsel, Montage, Auswuchten und Einlagerung. Vergleichen Sie Werkstattpreise und sparen Sie bei der Reifenmontage.',
    sortOrder: 3,
    parentId: null
  },
  {
    slug: 'recht-gesetz',
    name: 'Recht & Gesetz',
    description: 'Gesetzliche Vorschriften, Versicherungsfragen und rechtliche Informationen zu Reifen',
    icon: '⚖️',
    color: '#8B5CF6',
    seoTitle: 'Reifenrecht 2026 - Gesetzliche Vorschriften & Versicherung',
    seoDescription: 'Mindestprofiltiefe, Winterreifenpflicht, TÜV-Vorschriften und Versicherungsschutz. Alle rechtlichen Fragen rund um Autoreifen.',
    sortOrder: 4,
    parentId: null
  },
  {
    slug: 'fahrzeugtypen',
    name: 'Fahrzeugtypen',
    description: 'Spezielle Informationen für PKW, SUV, Transporter und Motorräder',
    icon: '🚗',
    color: '#EF4444',
    seoTitle: 'Reifen nach Fahrzeugtyp - PKW, SUV, Transporter & Motorrad',
    seoDescription: 'Welche Reifen eignen sich für Ihr Fahrzeug? Tipps für PKW, SUV, Transporter und Motorradreifen - Größen, Tragfähigkeit und Geschwindigkeitsindex.',
    sortOrder: 5,
    parentId: null
  },
  {
    slug: 'ratgeber',
    name: 'Ratgeber',
    description: 'Umfassende Ratgeber zu allen Themen rund um Reifen und Mobilität',
    icon: '📖',
    color: '#6366F1',
    seoTitle: 'Reifen-Ratgeber - Alles Wissenswerte über Autoreifen',
    seoDescription: 'Ihr umfassender Ratgeber für Autoreifen: Reifenkauf, Reifenarten, Kennzeichnung, Laufleistung und Sicherheit. Expertenwissen verständlich erklärt.',
    sortOrder: 6,
    parentId: null
  },

  // Werkstatt-Kategorien (5)
  {
    slug: 'marketing-akquise',
    name: 'Marketing & Akquise',
    description: 'Strategien zur Kundengewinnung und erfolgreiche Marketingmaßnahmen für Werkstätten',
    icon: '💼',
    color: '#EC4899',
    seoTitle: 'Werkstatt Marketing 2026 - Mehr Kunden für Ihre KFZ-Werkstatt',
    seoDescription: 'Effektive Marketingstrategien für KFZ-Werkstätten: Online-Marketing, Social Media, Google Ads und lokale Werbung. Steigern Sie Ihren Umsatz.',
    sortOrder: 7,
    parentId: null
  },
  {
    slug: 'business-optimierung',
    name: 'Business-Optimierung',
    description: 'Prozessoptimierung, Effizienzsteigerung und erfolgreiche Werkstattführung',
    icon: '📊',
    color: '#14B8A6',
    seoTitle: 'Werkstatt-Management - Prozesse optimieren & Effizienz steigern',
    seoDescription: 'Werkstatt erfolgreich führen: Prozessoptimierung, Terminplanung, Materialwirtschaft und Mitarbeiterführung. Steigern Sie Ihre Werkstatt-Effizienz.',
    sortOrder: 8,
    parentId: null
  },
  {
    slug: 'fachliches',
    name: 'Fachliches',
    description: 'Technisches Know-how, neue Technologien und Fachwissen für Profis',
    icon: '🛠️',
    color: '#F97316',
    seoTitle: 'KFZ-Fachwissen - Technik & Best Practices für Werkstätten',
    seoDescription: 'Professionelles Fachwissen für KFZ-Mechaniker: Neue Technologien, Diagnoseverfahren, Reparaturanleitungen und technische Updates.',
    sortOrder: 9,
    parentId: null
  },
  {
    slug: 'digitalisierung',
    name: 'Digitalisierung',
    description: 'Digitale Tools, Software-Lösungen und moderne Werkstatt-Technologien',
    icon: '📱',
    color: '#06B6D4',
    seoTitle: 'Digitale Werkstatt 2026 - Software & Tools für KFZ-Betriebe',
    seoDescription: 'Digitalisierung in der Werkstatt: Werkstattsoftware, digitale Terminbuchung, Online-Zahlungen und moderne Tools für effizientes Arbeiten.',
    sortOrder: 10,
    parentId: null
  },
  {
    slug: 'finanzen-recht',
    name: 'Finanzen & Recht',
    description: 'Finanzielle Themen, rechtliche Fragen und betriebswirtschaftliche Aspekte',
    icon: '💰',
    color: '#84CC16',
    seoTitle: 'Werkstatt Finanzen & Recht - Betriebswirtschaft für KFZ-Betriebe',
    seoDescription: 'Finanzmanagement und rechtliche Aspekte für Werkstätten: Preiskalkulation, Steueroptimierung, Versicherungen und gesetzliche Pflichten.',
    sortOrder: 11,
    parentId: null
  }
]

async function main() {
  console.log('🌱 Seeding blog categories...')

  for (const category of categories) {
    const created = await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    })
    console.log(`✅ Created/Updated: ${created.name} (${created.slug})`)
  }

  const count = await prisma.blogCategory.count()
  console.log(`\n✨ Seeding completed! Total categories: ${count}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
