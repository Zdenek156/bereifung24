import { PrismaClient, AccountType } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * SKR04 - Kontenrahmen (Standardkontenrahmen)
 * Abschlussgliederung nach Bilanzgliederung
 * 
 * Kontenklassen:
 * 0xxx = Anlagevermögen
 * 1xxx = Umlaufvermögen, Aktive Rechnungsabgrenzung
 * 2xxx = Eigenkapital
 * 3xxx = Fremdkapital
 * 4xxx = Betriebliche Erträge
 * 5xxx = Betriebliche Aufwendungen für Material, Waren
 * 6xxx = Betriebliche Aufwendungen für Personal, Abschreibungen
 * 7xxx = Sonstige betriebliche Erträge
 * 8xxx = Erlöse (Umsatzerlöse)
 * 9xxx = Vortragskonten, Statistik
 */

export const skr04Accounts = [
  // ====================================
  // ANLAGEVERMÖGEN (0xxx)
  // ====================================
  {
    accountNumber: '0027',
    accountName: 'Anlagen im Bau',
    accountType: AccountType.ASSET,
    description: 'Nicht fertiggestellte Anlagen'
  },
  {
    accountNumber: '0480',
    accountName: 'Andere Fahrzeuge (Anschaffungskosten)',
    accountType: AccountType.ASSET,
    description: 'PKW, LKW, Transporter etc.'
  },
  {
    accountNumber: '0485',
    accountName: 'Andere Fahrzeuge (kumulierte Abschreibungen)',
    accountType: AccountType.ASSET,
    description: 'Abschreibungen auf Fahrzeuge'
  },
  {
    accountNumber: '0520',
    accountName: 'Betriebs- und Geschäftsausstattung (Anschaffungskosten)',
    accountType: AccountType.ASSET,
    description: 'Büromöbel, Computer, etc.'
  },
  {
    accountNumber: '0525',
    accountName: 'Betriebs- und Geschäftsausstattung (kumulierte Abschreibungen)',
    accountType: AccountType.ASSET,
    description: 'Abschreibungen BGA'
  },

  // ====================================
  // UMLAUFVERMÖGEN (1xxx)
  // ====================================
  {
    accountNumber: '1200',
    accountName: 'Bank',
    accountType: AccountType.ASSET,
    description: 'Bankguthaben'
  },
  {
    accountNumber: '1400',
    accountName: 'Forderungen aus Lieferungen und Leistungen',
    accountType: AccountType.ASSET,
    description: 'Kundenforderungen'
  },
  {
    accountNumber: '1576',
    accountName: 'Abziehbare Vorsteuer 19%',
    accountType: AccountType.ASSET,
    description: 'Vorsteuer aus Eingangsrechnungen'
  },
  {
    accountNumber: '1600',
    accountName: 'Kasse',
    accountType: AccountType.ASSET,
    description: 'Bargeld'
  },
  {
    accountNumber: '1718',
    accountName: 'Umsatzsteuer-Vorauszahlung',
    accountType: AccountType.ASSET,
    description: 'Gezahlte USt-Vorauszahlung'
  },

  // ====================================
  // EIGENKAPITAL (2xxx)
  // ====================================
  {
    accountNumber: '2000',
    accountName: 'Eigenkapital',
    accountType: AccountType.LIABILITY,
    description: 'Stammkapital'
  },
  {
    accountNumber: '2100',
    accountName: 'Gewinnvortrag/Verlustvortrag',
    accountType: AccountType.LIABILITY,
    description: 'Vortrag aus Vorjahren'
  },

  // ====================================
  // FREMDKAPITAL (3xxx)
  // ====================================
  {
    accountNumber: '3300',
    accountName: 'Verbindlichkeiten aus Lieferungen und Leistungen',
    accountType: AccountType.LIABILITY,
    description: 'Lieferantenverbindlichkeiten'
  },
  {
    accountNumber: '3806',
    accountName: 'Umsatzsteuer 19%',
    accountType: AccountType.LIABILITY,
    description: 'Umsatzsteuer-Verbindlichkeit'
  },
  {
    accountNumber: '3820',
    accountName: 'Umsatzsteuer-Vorauszahlung',
    accountType: AccountType.LIABILITY,
    description: 'Zahllast USt-Voranmeldung'
  },

  // ====================================
  // PERSONALAUFWENDUNGEN (4xxx)
  // ====================================
  {
    accountNumber: '4120',
    accountName: 'Löhne und Gehälter',
    accountType: AccountType.EXPENSE,
    description: 'Bruttolöhne und -gehälter'
  },
  {
    accountNumber: '4130',
    accountName: 'Gesetzliche soziale Aufwendungen',
    accountType: AccountType.EXPENSE,
    description: 'Arbeitgeber-Anteil SV (KV, RV, AV, PV)'
  },
  {
    accountNumber: '4138',
    accountName: 'Beiträge zur Berufsgenossenschaft',
    accountType: AccountType.EXPENSE,
    description: 'Unfallversicherung'
  },

  // ====================================
  // WERBE- UND REISEKOSTEN (4xxx)
  // ====================================
  {
    accountNumber: '4610',
    accountName: 'Werbekosten',
    accountType: AccountType.EXPENSE,
    description: 'Marketing, Werbung, Online-Ads'
  },
  {
    accountNumber: '4650',
    accountName: 'Provisionsaufwendungen',
    accountType: AccountType.EXPENSE,
    description: 'Gezahlte Provisionen (z.B. an Influencer)'
  },
  {
    accountNumber: '4670',
    accountName: 'Reisekosten Arbeitnehmer',
    accountType: AccountType.EXPENSE,
    description: 'Fahrt-, Übernachtungs-, Verpflegungskosten Mitarbeiter'
  },
  {
    accountNumber: '4671',
    accountName: 'Reisekosten Unternehmer',
    accountType: AccountType.EXPENSE,
    description: 'Reisekosten Geschäftsführer/Inhaber'
  },
  {
    accountNumber: '4673',
    accountName: 'Fahrtkosten',
    accountType: AccountType.EXPENSE,
    description: 'PKW-Kosten, Kilometergeld'
  },
  {
    accountNumber: '4676',
    accountName: 'Reisekosten Übernachtung',
    accountType: AccountType.EXPENSE,
    description: 'Hotel, Unterkunft'
  },

  // ====================================
  // SONSTIGE AUFWENDUNGEN (6xxx)
  // ====================================
  {
    accountNumber: '6200',
    accountName: 'Fremdleistungen',
    accountType: AccountType.EXPENSE,
    description: 'Externe Dienstleistungen'
  },
  {
    accountNumber: '6300',
    accountName: 'Kfz-Kosten',
    accountType: AccountType.EXPENSE,
    description: 'Treibstoff, Reparaturen, Versicherung, Steuer'
  },
  {
    accountNumber: '6320',
    accountName: 'Kfz-Versicherungen',
    accountType: AccountType.EXPENSE,
    description: 'Haftpflicht, Kasko'
  },
  {
    accountNumber: '6330',
    accountName: 'Kfz-Steuern',
    accountType: AccountType.EXPENSE,
    description: 'Kraftfahrzeugsteuer'
  },
  {
    accountNumber: '6360',
    accountName: 'Treibstoff',
    accountType: AccountType.EXPENSE,
    description: 'Benzin, Diesel'
  },
  {
    accountNumber: '6400',
    accountName: 'Werbe- und Reisekosten',
    accountType: AccountType.EXPENSE,
    description: 'Gemischte Werbe-/Reisekosten'
  },
  {
    accountNumber: '6520',
    accountName: 'Bürobedarf',
    accountType: AccountType.EXPENSE,
    description: 'Papier, Stifte, Druckerpatronen etc.'
  },
  {
    accountNumber: '6540',
    accountName: 'Telefon und Internet',
    accountType: AccountType.EXPENSE,
    description: 'Telekommunikationskosten'
  },
  {
    accountNumber: '6590',
    accountName: 'Porto und Versandkosten',
    accountType: AccountType.EXPENSE,
    description: 'Postgebühren, Kuriere'
  },
  {
    accountNumber: '6600',
    accountName: 'Abschreibungen auf Sachanlagen',
    accountType: AccountType.EXPENSE,
    description: 'AfA auf Anlagevermögen'
  },
  {
    accountNumber: '6620',
    accountName: 'Miete für Geschäftsräume',
    accountType: AccountType.EXPENSE,
    description: 'Büromiete, Lager'
  },
  {
    accountNumber: '6805',
    accountName: 'Werkzeuge und Kleingeräte (GWG)',
    accountType: AccountType.EXPENSE,
    description: 'Geringwertige Wirtschaftsgüter < 800€'
  },
  {
    accountNumber: '6820',
    accountName: 'Rechts- und Beratungskosten',
    accountType: AccountType.EXPENSE,
    description: 'Anwalt, Steuerberater'
  },
  {
    accountNumber: '6825',
    accountName: 'Buchführungskosten',
    accountType: AccountType.EXPENSE,
    description: 'Externe Buchhaltung'
  },
  {
    accountNumber: '6827',
    accountName: 'Zahlungsverkehrsgebühren',
    accountType: AccountType.EXPENSE,
    description: 'Payment-Provider-Gebühren (Stripe, PayPal etc.)'
  },
  {
    accountNumber: '6855',
    accountName: 'Geschenke',
    accountType: AccountType.EXPENSE,
    description: 'Kundengeschenke, Präsente'
  },
  {
    accountNumber: '6890',
    accountName: 'Fortbildungskosten',
    accountType: AccountType.EXPENSE,
    description: 'Schulungen, Seminare'
  },

  // ====================================
  // ERLÖSE (8xxx)
  // ====================================
  {
    accountNumber: '8120',
    accountName: 'Umsatzerlöse 19% USt',
    accountType: AccountType.REVENUE,
    description: 'Erlöse mit 19% Mehrwertsteuer'
  },
  {
    accountNumber: '8125',
    accountName: 'Umsatzerlöse 7% USt',
    accountType: AccountType.REVENUE,
    description: 'Erlöse mit ermäßigter Mehrwertsteuer'
  },
  {
    accountNumber: '8300',
    accountName: 'Erlöse sonstige Leistungen 19% USt',
    accountType: AccountType.REVENUE,
    description: 'Dienstleistungserlöse'
  },
  {
    accountNumber: '8400',
    accountName: 'Erlöse (Provisionen)',
    accountType: AccountType.REVENUE,
    description: 'Provisionseinnahmen von Werkstätten'
  },
  {
    accountNumber: '8500',
    accountName: 'Erlöse Vermittlungsleistungen',
    accountType: AccountType.REVENUE,
    description: 'Vermittlungsprovision'
  },

  // ====================================
  // SONSTIGE BETRIEBLICHE ERTRÄGE (7xxx)
  // ====================================
  {
    accountNumber: '7300',
    accountName: 'Sonstige betriebliche Erträge',
    accountType: AccountType.REVENUE,
    description: 'Verschiedene Erträge'
  }
]

export async function seedSKR04Accounts() {
  console.log('🌱 Seeding SKR04 Kontenplan...')

  let created = 0
  let skipped = 0

  for (const account of skr04Accounts) {
    try {
      const existing = await prisma.chartOfAccounts.findUnique({
        where: { accountNumber: account.accountNumber }
      })

      if (existing) {
        console.log(`  ⏭️  Konto ${account.accountNumber} existiert bereits`)
        skipped++
      } else {
        await prisma.chartOfAccounts.create({
          data: {
            ...account,
            skrType: 'SKR04'
          }
        })
        console.log(`  ✅ Konto ${account.accountNumber} - ${account.accountName}`)
        created++
      }
    } catch (error) {
      console.error(`  ❌ Fehler bei Konto ${account.accountNumber}:`, error)
    }
  }

  console.log(`\n✨ SKR04 Seed abgeschlossen: ${created} erstellt, ${skipped} übersprungen`)
}

// Kann direkt aufgerufen werden
if (require.main === module) {
  seedSKR04Accounts()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
