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
    name: 'Sales CRM',
    description: 'Werkstatt-Akquise mit Google Places',
    icon: 'Target',
    adminRoute: '/admin/sales',
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
    adminRoute: '/admin/hr/applications-assignment',
    color: 'purple',
    category: 'HR',
    sortOrder: 31
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
    key: 'email-blacklist',
    name: 'E-Mail Blacklist',
    description: 'Gesperrte E-Mails verwalten und freischalten',
    icon: 'ShieldAlert',
    adminRoute: '/admin/email-blacklist',
    color: 'red',
    category: 'SUPPORT',
    sortOrder: 50.5
  },
  {
    key: 'newsletter',
    name: 'Newsletter',
    description: 'Newsletter und Updates versenden',
    icon: 'Send',
    adminRoute: '/admin/newsletter',
    color: 'green',
    category: 'SUPPORT',
    sortOrder: 51
  },
  {
    key: 'email-settings',
    name: 'E-Mail Einstellungen',
    description: 'SMTP-Konfiguration für Email-Versand',
    icon: 'Settings',
    adminRoute: '/admin/email-settings',
    color: 'purple',
    category: 'SUPPORT',
    sortOrder: 52
  },
  {
    key: 'notifications',
    name: 'Benachrichtigungen',
    description: 'Email-Empfänger für Registrierungen verwalten',
    icon: 'Bell',
    adminRoute: '/admin/notifications',
    color: 'orange',
    category: 'SUPPORT',
    sortOrder: 53
  },
  {
    key: 'kvp',
    name: 'Verbesserungsvorschläge',
    description: 'KVP-System für kontinuierliche Verbesserung',
    icon: 'Lightbulb',
    adminRoute: '/admin/kvp',
    color: 'yellow',
    category: 'SUPPORT',
    sortOrder: 54
  },
  {
    key: 'knowledge',
    name: 'Wissensdatenbank',
    description: 'Interne Dokumentation und How-To-Artikel',
    icon: 'BookOpen',
    adminRoute: '/admin/knowledge',
    color: 'indigo',
    category: 'SUPPORT',
    sortOrder: 55
  },

  // SYSTEM & ADMIN
  {
    key: 'b24-employees',
    name: 'Mitarbeiterverwaltung',
    description: 'Bereifung24 Mitarbeiter mit Zugriffsrechten',
    icon: 'UserCog',
    adminRoute: '/admin/b24-employees',
    color: 'cyan',
    category: 'GENERAL',
    sortOrder: 60
  },
  {
    key: 'territories',
    name: 'Gebietsübersicht',
    description: 'Karten, Statistiken und Marktanalyse',
    icon: 'Map',
    adminRoute: '/admin/territories',
    color: 'teal',
    category: 'GENERAL',
    sortOrder: 61
  },
  {
    key: 'co2-tracking',
    name: 'CO₂-Tracking',
    description: 'Emissions-Faktoren und Berechnungen konfigurieren',
    icon: 'Leaf',
    adminRoute: '/admin/co2-tracking',
    color: 'emerald',
    category: 'GENERAL',
    sortOrder: 62
  },
  {
    key: 'vehicles',
    name: 'Firmenfahrzeuge',
    description: 'Fahrzeugverwaltung & Fahrtenbuch',
    icon: 'Truck',
    adminRoute: '/admin/vehicles',
    color: 'cyan',
    category: 'GENERAL',
    sortOrder: 63
  },
  {
    key: 'sepa-mandates',
    name: 'SEPA-Mandate',
    description: 'GoCardless Status prüfen & synchronisieren',
    icon: 'CreditCard',
    adminRoute: '/admin/sepa-mandates',
    color: 'indigo',
    category: 'ACCOUNTING',
    sortOrder: 64
  },
  {
    key: 'cleanup',
    name: 'Datenbank Bereinigung',
    description: 'Testdaten selektiv löschen',
    icon: 'Trash2',
    adminRoute: '/admin/cleanup',
    color: 'red',
    category: 'GENERAL',
    sortOrder: 65
  },
  {
    key: 'api-settings',
    name: 'API-Einstellungen',
    description: 'GoCardless, Google & andere API-Keys verwalten',
    icon: 'Key',
    adminRoute: '/admin/api-settings',
    color: 'teal',
    category: 'GENERAL',
    sortOrder: 66
  },
  {
    key: 'server-info',
    name: 'Server-Übersicht',
    description: 'CPU, RAM, Festplatte & Performance-Metriken',
    icon: 'Server',
    adminRoute: '/admin/server-info',
    color: 'gray',
    category: 'GENERAL',
    sortOrder: 67
  },
  {
    key: 'security',
    name: 'Sicherheit & Account',
    description: 'Passwort, 2FA, Backups & Systemsicherheit',
    icon: 'Shield',
    adminRoute: '/admin/security',
    color: 'red',
    category: 'GENERAL',
    sortOrder: 68
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
