/**
 * Seed Script for Applications
 * Creates default applications for the new application-based access control system
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultApplications = [
  // GENERAL
  {
    key: 'customers',
    name: 'Kundenverwaltung',
    description: 'Verwalte Kundenaccounts, Buchungen und Anfragen',
    icon: 'Users',
    adminRoute: '/admin/customers',
    color: 'blue',
    category: 'GENERAL',
    sortOrder: 1
  },
  {
    key: 'workshops',
    name: 'Werkstattverwaltung',
    description: 'Verwalte Werkstätten, Mitgliedschaften und Provisionen',
    icon: 'Wrench',
    adminRoute: '/admin/workshops',
    color: 'orange',
    category: 'GENERAL',
    sortOrder: 2
  },
  {
    key: 'analytics',
    name: 'Analytics & Berichte',
    description: 'Dashboard, Statistiken und Reports',
    icon: 'BarChart3',
    adminRoute: '/admin/analytics',
    color: 'purple',
    category: 'GENERAL',
    sortOrder: 3
  },
  {
    key: 'influencers',
    name: 'Influencer-Marketing',
    description: 'Verwalte Influencer-Bewerbungen und Provisionen',
    icon: 'Star',
    adminRoute: '/admin/influencer-applications',
    color: 'pink',
    category: 'SALES',
    sortOrder: 4
  },
  {
    key: 'affiliates',
    name: 'Affiliate-Verwaltung',
    description: 'Verwalte Affiliate-Partner und Tracking',
    icon: 'Link',
    adminRoute: '/admin/affiliates',
    color: 'green',
    category: 'SALES',
    sortOrder: 5
  },

  // SALES & CRM
  {
    key: 'sales',
    name: 'CRM & Vertrieb',
    description: 'Prospect-Management, Leads und Sales Pipeline',
    icon: 'Target',
    adminRoute: '/admin/sales/prospects',
    color: 'blue',
    category: 'SALES',
    sortOrder: 10
  },

  // ACCOUNTING
  {
    key: 'buchhaltung',
    name: 'Buchhaltung',
    description: 'Bilanz, GuV, Buchungen und Jahresabschluss',
    icon: 'Calculator',
    adminRoute: '/admin/buchhaltung',
    color: 'green',
    category: 'ACCOUNTING',
    sortOrder: 20
  },
  {
    key: 'commissions',
    name: 'Provisionsabrechnung',
    description: 'Werkstatt-Provisionen und Auszahlungen',
    icon: 'Coins',
    adminRoute: '/admin/commissions',
    color: 'yellow',
    category: 'ACCOUNTING',
    sortOrder: 21
  },
  {
    key: 'billing',
    name: 'Rechnungsverwaltung',
    description: 'Rechnungen, SEPA-Mandate und Zahlungen',
    icon: 'FileText',
    adminRoute: '/admin/billing',
    color: 'indigo',
    category: 'ACCOUNTING',
    sortOrder: 22
  },

  // HR
  {
    key: 'hr',
    name: 'Personalverwaltung',
    description: 'Mitarbeiter, Verträge, Urlaubsverwaltung',
    icon: 'Users',
    adminRoute: '/admin/hr',
    color: 'blue',
    category: 'HR',
    sortOrder: 30
  },
  {
    key: 'applications',
    name: 'Anwendungsverwaltung',
    description: 'Zuweisen von Anwendungen zu Mitarbeitern',
    icon: 'Grid',
    adminRoute: '/admin/applications',
    color: 'purple',
    category: 'HR',
    sortOrder: 31
  },
  {
    key: 'recruitment',
    name: 'Recruiting',
    description: 'Stellenanzeigen und Bewerbermanagement',
    icon: 'UserPlus',
    adminRoute: '/admin/recruitment',
    color: 'cyan',
    category: 'HR',
    sortOrder: 32
  },
  {
    key: 'payroll',
    name: 'Lohnabrechnung',
    description: 'Gehaltsabrechnungen und Lohnsteuer',
    icon: 'CreditCard',
    adminRoute: '/admin/payroll',
    color: 'green',
    category: 'HR',
    sortOrder: 33
  },

  // OPERATIONS
  {
    key: 'procurement',
    name: 'Einkauf & Beschaffung',
    description: 'Bestellungen, Lieferanten, Anlagenverwaltung',
    icon: 'ShoppingCart',
    adminRoute: '/admin/procurement',
    color: 'orange',
    category: 'GENERAL',
    sortOrder: 40
  },
  {
    key: 'files',
    name: 'Dokumentenverwaltung',
    description: 'Dateien, Ordner und Dokumentenarchiv',
    icon: 'FolderOpen',
    adminRoute: '/admin/files',
    color: 'gray',
    category: 'GENERAL',
    sortOrder: 41
  },
  {
    key: 'fleet',
    name: 'Fuhrparkverwaltung',
    description: 'Firmenfahrzeuge, Fahrten und Tankbelege',
    icon: 'Car',
    adminRoute: '/admin/fleet',
    color: 'red',
    category: 'GENERAL',
    sortOrder: 42
  },

  // SUPPORT & COMMUNICATION
  {
    key: 'email-templates',
    name: 'E-Mail-Vorlagen',
    description: 'Verwalte E-Mail-Templates und Massenmails',
    icon: 'Mail',
    adminRoute: '/admin/email-templates',
    color: 'blue',
    category: 'SUPPORT',
    sortOrder: 50
  },
  {
    key: 'kvp',
    name: 'Verbesserungsvorschläge',
    description: 'KVP-System für kontinuierliche Verbesserung',
    icon: 'Lightbulb',
    adminRoute: '/admin/kvp',
    color: 'yellow',
    category: 'SUPPORT',
    sortOrder: 51
  },
  {
    key: 'knowledge',
    name: 'Wissensdatenbank',
    description: 'Interne Dokumentation und How-To-Artikel',
    icon: 'BookOpen',
    adminRoute: '/admin/knowledge',
    color: 'indigo',
    category: 'SUPPORT',
    sortOrder: 52
  },

  // SETTINGS
  {
    key: 'settings',
    name: 'Einstellungen',
    description: 'Systemeinstellungen und Konfiguration',
    icon: 'Settings',
    adminRoute: '/admin/settings',
    color: 'gray',
    category: 'GENERAL',
    sortOrder: 100
  }
]

async function main() {
  console.log('🌱 Seeding applications...')

  for (const app of defaultApplications) {
    const result = await prisma.application.upsert({
      where: { key: app.key },
      update: {
        name: app.name,
        description: app.description,
        icon: app.icon,
        adminRoute: app.adminRoute,
        color: app.color,
        category: app.category,
        sortOrder: app.sortOrder
      },
      create: app
    })
    console.log(`✅ ${result.key}: ${result.name}`)
  }

  console.log(`\n✨ Successfully seeded ${defaultApplications.length} applications!`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding applications:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
