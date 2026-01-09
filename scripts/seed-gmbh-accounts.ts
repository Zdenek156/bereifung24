import { PrismaClient, AccountType } from '@prisma/client'

const prisma = new PrismaClient()

const gmbhAccounts = [
  // AKTIVKONTEN (Vermögen)
  // Anlagevermögen
  { accountNumber: '0100', accountName: 'Konzessionen, Schutzrechte', accountType: AccountType.ASSET, description: 'Immaterielle Vermögensgegenstände' },
  { accountNumber: '0200', accountName: 'Gebäude auf fremdem Grundstück', accountType: AccountType.ASSET, description: 'Bauten auf fremden Grundstücken' },
  { accountNumber: '0210', accountName: 'Betriebs- und Geschäftsausstattung', accountType: AccountType.ASSET, description: 'Büromöbel, Computer, etc.' },
  { accountNumber: '0220', accountName: 'Andere Anlagen, Betriebs- u. Geschäftsausstattung', accountType: AccountType.ASSET, description: 'Sonstige Ausstattung' },
  { accountNumber: '0280', accountName: 'Geleistete Anzahlungen auf Sachanlagen', accountType: AccountType.ASSET, description: 'Anzahlungen für Anlagen' },

  // Umlaufvermögen
  { accountNumber: '1000', accountName: 'Kasse', accountType: AccountType.ASSET, description: 'Bargeld in der Kasse' },
  { accountNumber: '1100', accountName: 'Postbank', accountType: AccountType.ASSET, description: 'Bankguthaben Postbank' },
  { accountNumber: '1140', accountName: 'Sparkasse', accountType: AccountType.ASSET, description: 'Bankguthaben Sparkasse' },
  { accountNumber: '1360', accountName: 'Forderungen aus Lieferungen und Leistungen', accountType: AccountType.ASSET, description: 'Kundenforderungen' },
  { accountNumber: '1370', accountName: 'Forderungen gegenüber Gesellschaftern', accountType: AccountType.ASSET, description: 'Gesellschafter-Darlehen' },
  { accountNumber: '1400', accountName: 'Sonstige Vermögensgegenstände (Forderungen)', accountType: AccountType.ASSET, description: 'Sonstige Forderungen' },
  { accountNumber: '1500', accountName: 'Geleistete Anzahlungen', accountType: AccountType.ASSET, description: 'Anzahlungen an Lieferanten' },
  { accountNumber: '1571', accountName: 'Abziehbare Vorsteuer 19%', accountType: AccountType.ASSET, description: 'Vorsteuer aus Eingangsrechnungen' },
  { accountNumber: '1575', accountName: 'Abziehbare Vorsteuer 7%', accountType: AccountType.ASSET, description: 'Vorsteuer ermäßigter Steuersatz' },

  // Rechnungsabgrenzungsposten (Aktiv)
  { accountNumber: '0980', accountName: 'Aktive Rechnungsabgrenzung', accountType: AccountType.ASSET, description: 'Vorausgezahlte Aufwendungen (z.B. Versicherungen, Miete)' },
  { accountNumber: '0985', accountName: 'Disagio', accountType: AccountType.ASSET, description: 'Damnum bei Darlehen' },

  // PASSIVKONTEN (Kapital + Schulden)
  // Eigenkapital
  { accountNumber: '2800', accountName: 'Gezeichnetes Kapital (GmbH)', accountType: AccountType.LIABILITY, description: 'Stammkapital der GmbH (mind. 25.000 EUR)' },
  { accountNumber: '2801', accountName: 'Ausstehende Einlagen', accountType: AccountType.LIABILITY, description: 'Noch nicht eingezahltes Stammkapital' },
  { accountNumber: '2850', accountName: 'Kapitalrücklage', accountType: AccountType.LIABILITY, description: 'Kapitalrücklage aus Agio' },
  { accountNumber: '2860', accountName: 'Gewinnrücklage', accountType: AccountType.LIABILITY, description: 'Thesaurierte Gewinne' },
  { accountNumber: '2870', accountName: 'Gewinnvortrag/Verlustvortrag', accountType: AccountType.LIABILITY, description: 'Vorjahresergebnis' },
  { accountNumber: '2880', accountName: 'Jahresüberschuss/Jahresfehlbetrag', accountType: AccountType.LIABILITY, description: 'Ergebnis des laufenden Geschäftsjahres' },
  { accountNumber: '2100', accountName: 'Privatentnahmen allgemein', accountType: AccountType.LIABILITY, description: 'Entnahmen durch Gesellschafter (gegen Eigenkapital)' },
  { accountNumber: '2110', accountName: 'Privateinlagen', accountType: AccountType.LIABILITY, description: 'Einlagen von Gesellschaftern' },

  // Rückstellungen
  { accountNumber: '3000', accountName: 'Rückstellungen für Pensionen', accountType: AccountType.LIABILITY, description: 'Pensionsrückstellungen' },
  { accountNumber: '3010', accountName: 'Rückstellungen für Steuern', accountType: AccountType.LIABILITY, description: 'Rückstellung für Steuernachzahlungen' },
  { accountNumber: '3020', accountName: 'Sonstige Rückstellungen', accountType: AccountType.LIABILITY, description: 'Rückstellungen für ungewisse Verbindlichkeiten' },
  { accountNumber: '3030', accountName: 'Rückstellung Urlaubsverbindlichkeiten', accountType: AccountType.LIABILITY, description: 'Rückstellung für nicht genommenen Urlaub' },
  { accountNumber: '3040', accountName: 'Rückstellung Garantieverpflichtungen', accountType: AccountType.LIABILITY, description: 'Gewährleistungsrückstellungen' },

  // Verbindlichkeiten
  { accountNumber: '3100', accountName: 'Darlehen Kreditinstitute', accountType: AccountType.LIABILITY, description: 'Bankdarlehen langfristig' },
  { accountNumber: '3110', accountName: 'Darlehen von Gesellschaftern', accountType: AccountType.LIABILITY, description: 'Gesellschafter-Darlehen' },
  { accountNumber: '3150', accountName: 'Verbindlichkeiten aus Lieferungen und Leistungen', accountType: AccountType.LIABILITY, description: 'Lieferantenverbindlichkeiten' },
  { accountNumber: '3200', accountName: 'Erhaltene Anzahlungen', accountType: AccountType.LIABILITY, description: 'Anzahlungen von Kunden' },
  { accountNumber: '3400', accountName: 'Verbindlichkeiten gegenüber Gesellschaftern', accountType: AccountType.LIABILITY, description: 'Sonstige Verbindlichkeiten Gesellschafter' },
  { accountNumber: '3500', accountName: 'Verbindlichkeiten aus Steuern', accountType: AccountType.LIABILITY, description: 'Umsatzsteuer-Zahllast, Lohnsteuer' },
  { accountNumber: '3550', accountName: 'Verbindlichkeiten Sozialversicherung', accountType: AccountType.LIABILITY, description: 'SV-Beiträge an Krankenkasse' },

  // Rechnungsabgrenzungsposten (Passiv)
  { accountNumber: '3900', accountName: 'Passive Rechnungsabgrenzung', accountType: AccountType.LIABILITY, description: 'Im Voraus erhaltene Erlöse (z.B. Vorauszahlungen Kunden)' },

  // AUFWANDSKONTEN
  // Personalkosten
  { accountNumber: '4100', accountName: 'Löhne und Gehälter GmbH', accountType: AccountType.EXPENSE, description: 'Bruttogehälter aller Mitarbeiter' },
  { accountNumber: '4110', accountName: 'Geschäftsführergehälter', accountType: AccountType.EXPENSE, description: 'Gehalt Geschäftsführer' },
  { accountNumber: '4138', accountName: 'Gesetzliche Sozialaufwendungen', accountType: AccountType.EXPENSE, description: 'Arbeitgeberanteile SV' },
  { accountNumber: '4140', accountName: 'Freiwillige soziale Aufwendungen', accountType: AccountType.EXPENSE, description: 'Vermögenswirksame Leistungen, etc.' },

  // Abschreibungen
  { accountNumber: '6220', accountName: 'Abschreibungen auf Sachanlagen', accountType: AccountType.EXPENSE, description: 'Planmäßige Abschreibungen' },
  { accountNumber: '6230', accountName: 'Abschreibungen auf immaterielle Vermögensgegenstände', accountType: AccountType.EXPENSE, description: 'Abschreibung Software, Lizenzen' },
  { accountNumber: '6260', accountName: 'Abschreibungen auf Finanzanlagen', accountType: AccountType.EXPENSE, description: 'Abschreibung Beteiligungen' },

  // Zinsen und Finanzaufwendungen
  { accountNumber: '6500', accountName: 'Zinsaufwendungen für Kredite', accountType: AccountType.EXPENSE, description: 'Darlehenszinsen' },
  { accountNumber: '6510', accountName: 'Zinsaufwendungen sonstige', accountType: AccountType.EXPENSE, description: 'Sonstige Zinsen' },
  { accountNumber: '6600', accountName: 'Verluste aus Abgang Anlagevermögen', accountType: AccountType.EXPENSE, description: 'Buchverluste bei Verkauf/Verschrottung' },

  // Steuern (nicht Ertragsteuern)
  { accountNumber: '6640', accountName: 'Grundsteuer', accountType: AccountType.EXPENSE, description: 'Grundsteuer Betriebsgrundstück' },
  { accountNumber: '6645', accountName: 'Kfz-Steuer', accountType: AccountType.EXPENSE, description: 'Kraftfahrzeugsteuer' },
  { accountNumber: '6650', accountName: 'Sonstige Steuern', accountType: AccountType.EXPENSE, description: 'Gewerbesteuer, etc.' },

  // Rückstellungen
  { accountNumber: '6850', accountName: 'Zuführung zu Rückstellungen', accountType: AccountType.EXPENSE, description: 'Bildung von Rückstellungen' },

  // Außerordentliche Aufwendungen
  { accountNumber: '6960', accountName: 'Periodenfremde Aufwendungen', accountType: AccountType.EXPENSE, description: 'Nachträgliche Rechnungen Vorjahr' },
  { accountNumber: '6970', accountName: 'Außerordentliche Aufwendungen', accountType: AccountType.EXPENSE, description: 'Einmalige außerordentliche Kosten' },

  // ERTRAGSKONTEN
  // Erlöse
  { accountNumber: '8100', accountName: 'Erlöse 19% USt', accountType: AccountType.REVENUE, description: 'Umsatzerlöse Normalsteuersatz' },
  { accountNumber: '8125', accountName: 'Erlöse 7% USt', accountType: AccountType.REVENUE, description: 'Umsatzerlöse ermäßigter Steuersatz' },
  { accountNumber: '8150', accountName: 'Erlöse steuerfrei', accountType: AccountType.REVENUE, description: 'Steuerfreie Umsätze' },

  // Bestandsveränderungen
  { accountNumber: '8200', accountName: 'Bestandsveränderungen unfertige Leistungen', accountType: AccountType.REVENUE, description: 'Wertänderung halbfertige Arbeiten' },
  { accountNumber: '8210', accountName: 'Bestandsveränderungen fertige Erzeugnisse', accountType: AccountType.REVENUE, description: 'Wertänderung Lagerbestand' },

  // Sonstige betriebliche Erträge
  { accountNumber: '8600', accountName: 'Erlöse aus Anlageabgang', accountType: AccountType.REVENUE, description: 'Gewinne aus Verkauf Anlagevermögen' },
  { accountNumber: '8610', accountName: 'Erträge aus Auflösung von Rückstellungen', accountType: AccountType.REVENUE, description: 'Nicht benötigte Rückstellungen' },
  { accountNumber: '8620', accountName: 'Zinserträge', accountType: AccountType.REVENUE, description: 'Bankzinsen' },
  { accountNumber: '8630', accountName: 'Mieterträge', accountType: AccountType.REVENUE, description: 'Mieteinnahmen' },
  { accountNumber: '8640', accountName: 'Versicherungserstattungen', accountType: AccountType.REVENUE, description: 'Erstattungen Versicherungen' },
  { accountNumber: '8650', accountName: 'Erträge aus Zuschreibungen', accountType: AccountType.REVENUE, description: 'Wertaufholungen' },

  // Außerordentliche Erträge
  { accountNumber: '8960', accountName: 'Periodenfremde Erträge', accountType: AccountType.REVENUE, description: 'Nachträgliche Gutschriften Vorjahr' },
  { accountNumber: '8970', accountName: 'Außerordentliche Erträge', accountType: AccountType.REVENUE, description: 'Einmalige außerordentliche Einnahmen' },

  // ABSCHLUSSKONTEN
  { accountNumber: '9000', accountName: 'Saldenvortragskonten', accountType: AccountType.REVENUE, description: 'Eröffnungsbilanzkonten' },
  { accountNumber: '9008', accountName: 'Gewinn- und Verlustkonto', accountType: AccountType.REVENUE, description: 'GuV-Konto zum Abschließen der Erfolgskonten' },
  { accountNumber: '9009', accountName: 'Schlussbilanzkonto', accountType: AccountType.REVENUE, description: 'Schlussbilanz zum Jahresende' },

  // ERTRAGSTEUERN
  { accountNumber: '7300', accountName: 'Körperschaftsteuer', accountType: AccountType.EXPENSE, description: 'KSt für GmbH (15%)' },
  { accountNumber: '7310', accountName: 'Solidaritätszuschlag', accountType: AccountType.EXPENSE, description: 'SolZ auf Körperschaftsteuer (5,5%)' },
  { accountNumber: '7320', accountName: 'Gewerbesteuer', accountType: AccountType.EXPENSE, description: 'Gewerbesteuer (abhängig von Hebesatz)' },
]

async function main() {
  console.log('🏦 GmbH-Kontenplan wird in Datenbank eingefügt...')
  
  let created = 0
  let skipped = 0
  
  for (const account of gmbhAccounts) {
    try {
      await prisma.chartOfAccounts.create({
        data: account
      })
      created++
      console.log(`✅ ${account.accountNumber} - ${account.accountName}`)
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation (account already exists)
        skipped++
        console.log(`⏭️  ${account.accountNumber} - ${account.accountName} (existiert bereits)`)
      } else {
        console.error(`❌ ${account.accountNumber} - ${account.accountName}:`, error.message)
      }
    }
  }
  
  console.log(`\n📊 Zusammenfassung:`)
  console.log(`   Neu erstellt: ${created}`)
  console.log(`   Übersprungen: ${skipped}`)
  console.log(`   Gesamt: ${gmbhAccounts.length}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
