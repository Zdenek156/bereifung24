// Programmatic SEO config for /app landing pages
// Used by: /app, /app/[slug], /app/stadt/[city], sitemap-app.xml

export const APP_STORE_URLS = {
  ios: 'https://apps.apple.com/de/app/bereifung24/id6761443270',
  android: 'https://play.google.com/store/apps/details?id=de.bereifung24.bereifung24_app',
} as const

export const APP_META = {
  name: 'Bereifung24',
  category: 'AutomotiveApplication',
  os: ['iOS', 'Android'],
  ratingValue: '4.8',
  ratingCount: '127',
  priceCurrency: 'EUR',
  price: '0',
}

export interface AppPageDefinition {
  slug: string
  type: 'feature' | 'audience' | 'platform'
  title: string // <title>
  h1: string
  metaDescription: string
  keywords: string
  intro: string
  highlights: { icon: string; title: string; text: string }[]
  steps?: { title: string; text: string }[]
  faqs: { question: string; answer: string }[]
}

export const APP_PAGES: AppPageDefinition[] = [
  // --- FEATURE PAGES ---
  {
    slug: 'reifenwechsel-buchen',
    type: 'feature',
    title: 'Reifenwechsel mit der Bereifung24 App buchen | Termin online',
    h1: 'Reifenwechsel per App buchen',
    metaDescription: 'Reifenwechsel-Termin in 60 Sekunden über die Bereifung24 App buchen. Werkstätten in deiner Nähe vergleichen, Festpreis sehen, Termin sofort bestätigt. Kostenlos für iOS und Android.',
    keywords: 'reifenwechsel app, reifenwechsel termin app, reifenwechsel online buchen, reifen app, werkstatt termin app',
    intro: 'Mit der Bereifung24 App buchst du deinen Reifenwechsel-Termin in unter einer Minute – direkt vom Smartphone. Kein Anrufen, keine Wartezeit, sofortige Terminbestätigung.',
    highlights: [
      { icon: '⚡', title: 'Termin in 60 Sekunden', text: 'Kennzeichen eingeben, Werkstatt wählen, Termin sichern.' },
      { icon: '💶', title: 'Festpreis vorab', text: 'Du siehst den Endpreis, bevor du buchst – ohne versteckte Kosten.' },
      { icon: '📍', title: 'Werkstätten in der Nähe', text: 'Live-Suche zeigt freie Termine in deiner Region.' },
      { icon: '🔔', title: 'Push-Erinnerung', text: 'Saisonale Erinnerung an Sommer-/Winterreifen.' },
    ],
    steps: [
      { title: '1. App öffnen', text: 'Bereifung24 App starten und Kennzeichen eingeben.' },
      { title: '2. Werkstatt wählen', text: 'Aus geprüften Werkstätten in deiner Nähe wählen.' },
      { title: '3. Termin buchen', text: 'Wunschtermin auswählen, Festpreis bestätigen, fertig.' },
    ],
    faqs: [
      { question: 'Was kostet die Buchung in der App?', answer: 'Die Bereifung24 App ist komplett kostenlos. Du zahlst nur den angezeigten Festpreis für den Reifenwechsel direkt in der Werkstatt oder online.' },
      { question: 'Wie schnell bekomme ich einen Termin?', answer: 'In der Regel innerhalb von 24–72 Stunden. In der Hochsaison (Oktober/April) empfehlen wir frühzeitig zu buchen.' },
      { question: 'Kann ich den Termin in der App stornieren?', answer: 'Ja, bis 24 Stunden vor dem Termin kannst du kostenlos stornieren oder umbuchen – alles direkt in der App.' },
    ],
  },
  {
    slug: 'werkstatt-finden',
    type: 'feature',
    title: 'KFZ-Werkstatt finden mit der Bereifung24 App | Karte & Bewertungen',
    h1: 'KFZ-Werkstatt in deiner Nähe finden',
    metaDescription: 'Geprüfte KFZ-Werkstätten in deiner Nähe finden – mit Karte, Bewertungen, Öffnungszeiten und Online-Buchung. Die kostenlose Bereifung24 App für iOS und Android.',
    keywords: 'werkstatt finden app, kfz werkstatt app, autowerkstatt suchen, werkstatt in der nähe, werkstatt suche app',
    intro: 'Finde geprüfte Autowerkstätten in deiner Nähe – mit echten Kundenbewertungen, Öffnungszeiten, Preisen und direkter Online-Buchung. Alles in einer App.',
    highlights: [
      { icon: '🗺️', title: 'Live-Karte', text: 'Werkstätten auf der Karte mit Entfernung und Öffnungszeiten.' },
      { icon: '⭐', title: 'Echte Bewertungen', text: 'Bewertungen von verifizierten Kunden – keine Fake-Reviews.' },
      { icon: '💰', title: 'Preisvergleich', text: 'Preise von verschiedenen Werkstätten direkt vergleichen.' },
      { icon: '📞', title: 'Direktkontakt', text: 'Anrufen oder online buchen – mit einem Tipp.' },
    ],
    faqs: [
      { question: 'Wie viele Werkstätten sind in der App?', answer: 'Über 1.500 geprüfte KFZ-Werkstätten in ganz Deutschland – von Hamburg bis München, von Stuttgart bis Berlin.' },
      { question: 'Sind die Werkstätten geprüft?', answer: 'Ja, alle Partner-Werkstätten durchlaufen ein Verifizierungsverfahren (Gewerbeschein, Versicherung, Kundenbewertungen).' },
      { question: 'Kann ich die Werkstatt direkt anrufen?', answer: 'Ja, in jeder Werkstatt-Detailseite findest du Telefonnummer, Öffnungszeiten und einen Anruf-Button.' },
    ],
  },
  {
    slug: 'reifen-kaufen',
    type: 'feature',
    title: 'Reifen kaufen per App | Bereifung24 für iOS und Android',
    h1: 'Reifen online kaufen – inklusive Montage',
    metaDescription: 'Reifen direkt in der App kaufen – inklusive Lieferung zur Werkstatt und Montage-Termin. Alle Marken, alle Größen. Kostenlose Bereifung24 App für iPhone und Android.',
    keywords: 'reifen app kaufen, reifen bestellen app, reifen online kaufen, sommerreifen app, winterreifen app',
    intro: 'Kaufe deine Reifen direkt in der Bereifung24 App – inklusive Lieferung zur Wunschwerkstatt und passenden Montage-Termin. Alles aus einer Hand.',
    highlights: [
      { icon: '🛞', title: 'Alle Marken', text: 'Continental, Michelin, Bridgestone, Goodyear und viele mehr.' },
      { icon: '📦', title: 'Lieferung zur Werkstatt', text: 'Reifen werden direkt zur Wunschwerkstatt geschickt.' },
      { icon: '🔧', title: 'Montage inklusive', text: 'Termin für Montage gleich mitbuchen – Festpreis garantiert.' },
      { icon: '🏷️', title: 'EU-Reifenlabel', text: 'Spritverbrauch, Nasshaftung, Geräusch direkt in der App.' },
    ],
    faqs: [
      { question: 'Welche Reifenmarken kann ich kaufen?', answer: 'Über 50 Reifenmarken – von Premium (Continental, Michelin, Pirelli) bis Budget (Hankook, Kumho, Nexen).' },
      { question: 'Wie lange dauert die Lieferung?', answer: 'In der Regel 2–4 Werktage zur Werkstatt. Express-Lieferung gegen Aufpreis möglich.' },
      { question: 'Kann ich Reifen und Montage in einer Buchung kaufen?', answer: 'Ja, das ist der Vorteil der App: Reifen + Werkstatt + Termin + Festpreis – alles in einer Buchung.' },
    ],
  },
  {
    slug: 'notdienst',
    type: 'feature',
    title: 'Reifen-Notdienst per App | Bereifung24 Pannenhilfe',
    h1: 'Reifen-Notdienst in deiner Nähe',
    metaDescription: 'Reifenpanne unterwegs? Mit der Bereifung24 App findest du sofort den nächsten Reifen-Notdienst und Pannenhilfe in deiner Nähe – 24/7 verfügbar.',
    keywords: 'reifen notdienst app, pannenhilfe reifen, reifenpanne app, reifen notfall, mobile reifenhilfe',
    intro: 'Bei einer Reifenpanne zählt jede Minute. Die Bereifung24 App zeigt dir sofort die nächsten Werkstätten mit Notdienst – inklusive Telefonnummer und Anfahrtszeit.',
    highlights: [
      { icon: '🆘', title: 'Sofortige Hilfe', text: 'Notdienst-Werkstätten in deiner Nähe – mit Live-Standort.' },
      { icon: '📞', title: 'Direkter Anruf', text: 'Mit einem Tipp die Werkstatt anrufen – kein Suchen, kein Warten.' },
      { icon: '🕐', title: '24/7 verfügbar', text: 'Auch nachts und am Wochenende – Notdienst-Filter aktiv.' },
      { icon: '🚗', title: 'Mobile Reifenhilfe', text: 'Manche Partner kommen direkt zum Pannenort.' },
    ],
    faqs: [
      { question: 'Was kostet ein Reifen-Notdienst?', answer: 'Notdienst-Pauschalen liegen meist zwischen 50 und 150 € (ohne Reifen/Reparatur). Genaue Preise siehst du vor dem Anruf in der App.' },
      { question: 'Funktioniert die App bei schlechtem Empfang?', answer: 'Ja, die App nutzt deinen GPS-Standort auch bei langsamem Mobilfunk – du brauchst nur eine grundlegende Datenverbindung.' },
      { question: 'Gibt es einen ADAC-ähnlichen Service?', answer: 'Bereifung24 ist ein Vermittlungsdienst zu lokalen Werkstätten – kein klassischer Pannendienst. Für Abschleppen oder Starthilfe nutze ADAC oder ACE.' },
    ],
  },
  {
    slug: 'ki-berater',
    type: 'feature',
    title: 'KI-Reifenberater Rollo in der Bereifung24 App',
    h1: 'KI-Berater für Reifen und Werkstatt',
    metaDescription: 'Welche Reifen passen zu meinem Auto? Wann brauche ich Winterreifen? Frag Rollo – den KI-Reifenberater in der Bereifung24 App. Kostenlos für iOS und Android.',
    keywords: 'reifen berater app, ki autoberater, reifen empfehlung app, welche reifen, reifen ki',
    intro: 'Rollo ist dein persönlicher KI-Reifenberater – verfügbar 24/7 in der Bereifung24 App. Frag in natürlicher Sprache, bekomm konkrete Empfehlungen.',
    highlights: [
      { icon: '🤖', title: 'KI-Beratung', text: 'Frag in natürlicher Sprache nach Reifen-Empfehlungen.' },
      { icon: '🎙️', title: 'Sprachsteuerung', text: 'Stell Fragen per Stimme – ideal beim Autofahren (Beifahrer).' },
      { icon: '🚗', title: 'Fahrzeug-spezifisch', text: 'Empfehlungen basierend auf deinem konkreten Auto.' },
      { icon: '💡', title: 'Erklärt verständlich', text: 'Reifen-Label, Profiltiefe, Sommer/Winter – einfach erklärt.' },
    ],
    faqs: [
      { question: 'Was ist Rollo?', answer: 'Rollo ist der KI-Reifenberater von Bereifung24 – ein Sprachassistent, der dir bei allen Fragen rund um Reifen, Werkstatt und Service hilft.' },
      { question: 'Kostet die KI-Beratung extra?', answer: 'Nein, Rollo ist Teil der kostenlosen Bereifung24 App. Du kannst beliebig viele Fragen stellen.' },
      { question: 'Welche Fragen versteht Rollo?', answer: 'Alles rund um Reifen: Größen, Marken, Profiltiefe, Reifenwechsel-Termin, Werkstattempfehlung, EU-Label, Spritverbrauch und vieles mehr.' },
    ],
  },
  {
    slug: 'fahrzeug-verwaltung',
    type: 'feature',
    title: 'Fahrzeug-Verwaltung in der Bereifung24 App | Auto digital',
    h1: 'Mehrere Fahrzeuge digital verwalten',
    metaDescription: 'Verwalte alle deine Fahrzeuge in der Bereifung24 App – mit Fahrzeugschein, Reifengröße, TÜV-Termin und Werkstatt-Historie. Kostenlos für iOS und Android.',
    keywords: 'fahrzeug app verwalten, auto papiere app, kfz verwaltung app, fahrzeugschein app, mein auto app',
    intro: 'Lege alle deine Fahrzeuge in der App an und behalte den Überblick über Reifengröße, TÜV-Termin, Werkstatt-Historie und Wartung – mit Push-Erinnerungen.',
    highlights: [
      { icon: '🚙', title: 'Mehrere Fahrzeuge', text: 'Auto, Zweitwagen, Motorrad – alle Fahrzeuge an einem Ort.' },
      { icon: '📅', title: 'TÜV-Erinnerung', text: 'Push-Benachrichtigung 4 Wochen vor TÜV-Ablauf.' },
      { icon: '📜', title: 'Service-Historie', text: 'Alle Werkstattbesuche und Reifenwechsel automatisch archiviert.' },
      { icon: '🛞', title: 'Reifengröße gespeichert', text: 'Bei Buchung automatisch übernommen – nie wieder suchen.' },
    ],
    faqs: [
      { question: 'Werden meine Daten sicher gespeichert?', answer: 'Ja, alle Fahrzeugdaten werden DSGVO-konform auf deutschen Servern verschlüsselt gespeichert. Du kannst sie jederzeit löschen.' },
      { question: 'Wie viele Fahrzeuge kann ich anlegen?', answer: 'Unbegrenzt. Familien-Fahrzeuge, Zweitwagen, Motorräder – alle möglich.' },
      { question: 'Kann ich die Fahrzeugdaten exportieren?', answer: 'Ja, du kannst alle Fahrzeug- und Service-Daten als PDF exportieren – ideal beim Verkauf oder Werkstatt-Wechsel.' },
    ],
  },
  {
    slug: 'dokumenten-scanner',
    type: 'feature',
    title: 'Fahrzeugschein scannen mit der Bereifung24 App',
    h1: 'Fahrzeugschein in 5 Sekunden scannen',
    metaDescription: 'Scanne deinen Fahrzeugschein einfach per Smartphone – die Bereifung24 App erkennt automatisch Marke, Modell, Reifengröße und alle wichtigen Daten.',
    keywords: 'fahrzeugschein scannen app, kfz dokumente app, zulassungsbescheinigung scannen, auto papiere scannen',
    intro: 'Kein lästiges Abtippen mehr: Scanne deinen Fahrzeugschein einmal mit der Kamera und alle relevanten Daten (Marke, Modell, Reifengröße, HSN/TSN) werden automatisch übernommen.',
    highlights: [
      { icon: '📸', title: 'Foto reicht', text: 'Fahrzeugschein abfotografieren – fertig in 5 Sekunden.' },
      { icon: '🤖', title: 'Automatische Erkennung', text: 'KI extrahiert Marke, Modell, Reifengröße, HSN/TSN automatisch.' },
      { icon: '🔒', title: 'Lokale Verarbeitung', text: 'Foto wird verschlüsselt – keine dauerhafte Speicherung der Originaldatei.' },
      { icon: '⚡', title: 'Direkte Buchung', text: 'Nach dem Scan direkt zur Reifen- oder Termin-Buchung.' },
    ],
    faqs: [
      { question: 'Welche Daten werden aus dem Schein gelesen?', answer: 'Marke, Modell, Reifengrößen (Standard und alternativ), HSN/TSN, Erstzulassung und Felgengröße.' },
      { question: 'Funktioniert das auch bei alten Fahrzeugscheinen?', answer: 'Ja, die App erkennt sowohl die alte (rosa) als auch die neue (Zulassungsbescheinigung Teil I) Version.' },
      { question: 'Wird mein Foto gespeichert?', answer: 'Nein, das Foto wird nur kurz zur Texterkennung verwendet und danach gelöscht. Nur die extrahierten Daten werden gespeichert.' },
    ],
  },

  // --- PLATFORM PAGES ---
  {
    slug: 'ios',
    type: 'platform',
    title: 'Bereifung24 für iPhone – iOS App im App Store',
    h1: 'Bereifung24 App für iPhone und iPad',
    metaDescription: 'Bereifung24 App für iOS jetzt im App Store laden. Reifenwechsel buchen, Werkstatt finden, Reifen kaufen – alles aus einer App. Kostenlos für iPhone und iPad.',
    keywords: 'bereifung24 ios, reifen app iphone, werkstatt app ios, reifenwechsel app iphone, app store reifen',
    intro: 'Die Bereifung24 App ist optimiert für iOS – mit nativer iPhone- und iPad-Unterstützung, Apple Pay, Face ID und Push-Benachrichtigungen.',
    highlights: [
      { icon: '📱', title: 'Optimiert für iPhone', text: 'Native iOS-App mit allen Apple-Features.' },
      { icon: '💳', title: 'Apple Pay Integration', text: 'Schnell und sicher mit Apple Pay bezahlen.' },
      { icon: '🔐', title: 'Face ID & Touch ID', text: 'Anmelden ohne Passwort – biometrisch geschützt.' },
      { icon: '🔔', title: 'Push-Benachrichtigungen', text: 'Erinnerungen an Termine und saisonalen Reifenwechsel.' },
    ],
    faqs: [
      { question: 'Welche iOS-Version brauche ich?', answer: 'Die App benötigt iOS 14 oder neuer. Empfohlen wird iOS 16+ für die beste Performance.' },
      { question: 'Funktioniert die App auf dem iPad?', answer: 'Ja, die App ist universell – läuft auf iPhone und iPad mit angepasstem Layout.' },
      { question: 'Kann ich mit Apple Pay bezahlen?', answer: 'Ja, Apple Pay ist vollständig integriert – schnell und sicher.' },
    ],
  },
  {
    slug: 'android',
    type: 'platform',
    title: 'Bereifung24 für Android – Play Store Download',
    h1: 'Bereifung24 App für Android-Smartphones',
    metaDescription: 'Bereifung24 App für Android jetzt im Google Play Store laden. Reifenwechsel buchen, Werkstatt finden, Reifen kaufen – kostenlos für alle Android-Smartphones.',
    keywords: 'bereifung24 android, reifen app android, werkstatt app android, reifenwechsel app android, play store reifen',
    intro: 'Die Bereifung24 App für Android läuft auf allen Smartphones ab Android 7 – mit Google Pay, Material You Design und Smartphone-Widgets.',
    highlights: [
      { icon: '🤖', title: 'Optimiert für Android', text: 'Native Android-App mit Material You Design.' },
      { icon: '💳', title: 'Google Pay', text: 'Direkt mit Google Pay bezahlen – schnell und sicher.' },
      { icon: '📲', title: 'Widgets', text: 'Schnellzugriff auf Termine direkt vom Homescreen.' },
      { icon: '🔔', title: 'Smarte Benachrichtigungen', text: 'Erinnerungen an Termine, Wartung und Saisonwechsel.' },
    ],
    faqs: [
      { question: 'Welche Android-Version brauche ich?', answer: 'Die App benötigt Android 7 (Nougat) oder neuer. Empfohlen wird Android 11+.' },
      { question: 'Funktioniert die App auf Tablets?', answer: 'Ja, die App ist auch für Android-Tablets optimiert.' },
      { question: 'Wie groß ist die App?', answer: 'Der Download umfasst etwa 35 MB – installiert ca. 80 MB.' },
    ],
  },

  // --- AUDIENCE PAGES ---
  {
    slug: 'fuer-vielfahrer',
    type: 'audience',
    title: 'Bereifung24 App für Vielfahrer und Pendler',
    h1: 'Die App für Vielfahrer und Pendler',
    metaDescription: 'Mehr als 20.000 km im Jahr? Die Bereifung24 App spart Vielfahrern Zeit – Reifenwechsel überall in Deutschland buchen, Werkstätten unterwegs finden.',
    keywords: 'reifen app vielfahrer, pendler reifen, vielfahrer werkstatt, außendienst reifen app',
    intro: 'Pendler und Vielfahrer profitieren besonders: Buche Reifenwechsel-Termine entlang deiner Pendlerroute, finde Werkstätten am Reiseziel, behalte den Service-Überblick.',
    highlights: [
      { icon: '🗺️', title: 'Bundesweites Netzwerk', text: 'Werkstätten in ganz Deutschland – auch unterwegs.' },
      { icon: '⏱️', title: 'Express-Termine', text: 'Schnelle Termine in der Mittagspause oder am Reiseziel.' },
      { icon: '📊', title: 'Profiltiefe-Tracking', text: 'Bei hoher Laufleistung wichtig: Verschleiß im Blick.' },
      { icon: '🧾', title: 'Belege für Steuer', text: 'Alle Rechnungen digital – ideal für Werbungskosten.' },
    ],
    faqs: [
      { question: 'Lohnt sich die App für 30.000+ km im Jahr?', answer: 'Auf jeden Fall: Vielfahrer brauchen häufiger Reifenwechsel und Wartung – die Push-Erinnerungen und der schnelle Werkstatt-Vergleich sparen viel Zeit.' },
      { question: 'Kann ich Belege für die Steuer exportieren?', answer: 'Ja, alle Rechnungen kannst du als PDF exportieren – ideal für die Steuererklärung als Werbungskosten.' },
    ],
  },
  {
    slug: 'fuer-familien',
    type: 'audience',
    title: 'Bereifung24 App für Familien und Familienauto',
    h1: 'Die App für Familien mit mehreren Autos',
    metaDescription: 'Mehrere Familien-Autos? Behalte Reifen, TÜV und Wartung aller Fahrzeuge im Blick – mit der kostenlosen Bereifung24 App für iOS und Android.',
    keywords: 'familienauto app, reifen familie app, mehrere autos verwalten, kfz familie',
    intro: 'Familien mit zwei oder mehr Autos verlieren leicht den Überblick. Die App verwaltet alle Fahrzeuge zentral und erinnert rechtzeitig an Reifenwechsel und TÜV.',
    highlights: [
      { icon: '🚗', title: 'Alle Familien-Autos', text: 'Verwalte beliebig viele Fahrzeuge in einem Account.' },
      { icon: '👨‍👩‍👧‍👦', title: 'Familien-Sharing', text: 'Termine mit der Familie teilen.' },
      { icon: '📅', title: 'Sammelterminierung', text: 'Mehrere Autos beim selben Termin wechseln lassen.' },
      { icon: '🔔', title: 'Geteilte Erinnerungen', text: 'TÜV- und Wartungstermine für alle.' },
    ],
    faqs: [
      { question: 'Kann ich das Familienauto und meinen Wagen gemeinsam verwalten?', answer: 'Ja, du kannst beliebig viele Fahrzeuge in einem Account anlegen – jeweils mit eigenem Service-Verlauf und Erinnerungen.' },
      { question: 'Bekomme ich Mengenrabatt für mehrere Reifenwechsel?', answer: 'Viele Werkstätten bieten Rabatte bei Sammelterminen – frag direkt in der Werkstatt-Detailansicht nach.' },
    ],
  },
  {
    slug: 'fuer-flotten',
    type: 'audience',
    title: 'Bereifung24 App für kleine Fuhrparks und Flotten',
    h1: 'Reifen-Management für kleine Flotten',
    metaDescription: 'Kleine Fuhrparks bis 20 Fahrzeuge: Verwalte Reifen, TÜV und Wartung zentral mit der Bereifung24 App. Kostenlos und einfach.',
    keywords: 'flotte reifen app, fuhrpark management app, kfz flotte, reifen flotte verwalten, kleine flotte app',
    intro: 'Für Handwerker, Außendienstler und kleine Unternehmen: Verwalte alle Firmenfahrzeuge zentral, plane Reifenwechsel saisonal, behalte die Kostenkontrolle.',
    highlights: [
      { icon: '🚐', title: 'Bis 20 Fahrzeuge', text: 'Ideal für Handwerks- und Familienbetriebe.' },
      { icon: '📊', title: 'Kostenübersicht', text: 'Alle Reifen- und Werkstattkosten zentral im Blick.' },
      { icon: '🗓️', title: 'Saisonale Planung', text: 'Sommer-/Winterwechsel für alle Fahrzeuge planen.' },
      { icon: '🧾', title: 'B2B-Rechnungen', text: 'Rechnungen mit USt-Ausweis für die Buchhaltung.' },
    ],
    faqs: [
      { question: 'Brauche ich eine spezielle B2B-Version?', answer: 'Für kleine Flotten reicht die normale App. Für größere Flotten (50+) bieten wir individuelle Lösungen.' },
      { question: 'Bekomme ich Rechnungen mit USt-Ausweis?', answer: 'Ja, alle Rechnungen sind B2B-konform mit ausgewiesener Mehrwertsteuer und Adressdaten.' },
    ],
  },
  {
    slug: 'fuer-werkstatt-kunden',
    type: 'audience',
    title: 'Bereifung24 App für Werkstatt-Stammkunden',
    h1: 'Stammkunden-App für deine Werkstatt',
    metaDescription: 'Du bist Stammkunde bei einer Bereifung24-Partnerwerkstatt? Mit der App buchst du noch schneller Termine, siehst deine Service-Historie und bekommst exklusive Angebote.',
    keywords: 'werkstatt stammkunde app, kundenbindung werkstatt, werkstatt loyalty app',
    intro: 'Als Stammkunde einer Bereifung24-Partnerwerkstatt profitierst du in der App von schnellerer Terminbuchung, vollständiger Service-Historie und exklusiven Angeboten.',
    highlights: [
      { icon: '⭐', title: 'Stammkunden-Status', text: 'Werkstätten erkennen dich automatisch als Stammkunde.' },
      { icon: '🎁', title: 'Exklusive Angebote', text: 'Sonderaktionen und Treue-Rabatte direkt in der App.' },
      { icon: '📜', title: 'Komplette Historie', text: 'Alle bisherigen Aufträge der Werkstatt einsehbar.' },
      { icon: '⚡', title: 'Schnellere Buchung', text: 'Daten vorausgefüllt – Termin in 30 Sekunden gebucht.' },
    ],
    faqs: [
      { question: 'Kostet die Stammkunden-Funktion extra?', answer: 'Nein, die App ist komplett kostenlos. Stammkunden-Status wird automatisch nach dem zweiten Auftrag bei derselben Werkstatt vergeben.' },
      { question: 'Sieht die Werkstatt meine Daten?', answer: 'Nur die für den Service notwendigen Daten (Fahrzeug, Reifengröße, Kontakt). Du bestimmst, was geteilt wird.' },
    ],
  },
]

export function getAppPageBySlug(slug: string): AppPageDefinition | undefined {
  return APP_PAGES.find(p => p.slug === slug)
}

export function getAllAppPageSlugs(): string[] {
  return APP_PAGES.map(p => p.slug)
}

export function getAppPagesByType(type: AppPageDefinition['type']): AppPageDefinition[] {
  return APP_PAGES.filter(p => p.type === type)
}
