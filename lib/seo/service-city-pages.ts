// Service + City programmatic SEO pages
// Consumer-facing pages targeting searches like "Reifenwechsel Bietigheim-Bissingen"

export interface ServiceDefinition {
  slug: string
  name: string
  icon: string
  description: string
  priceRange: string
  duration: string
  searchPath: string // Path to redirect users to search
  faqs: { question: string; answer: string }[]
}

export interface ServiceCityData {
  citySlug: string
  cityName: string
  region: string
  population: number
  postalCodes: string[]
  nearbyAreas: string
  localHighlight: string
}

// --- Service Definitions ---

export const SERVICES: Record<string, ServiceDefinition> = {
  reifenwechsel: {
    slug: 'reifenwechsel',
    name: 'Reifenwechsel',
    icon: '🔧',
    description: 'Professioneller Reifenwechsel – alte Reifen demontieren, neue Reifen aufziehen, auswuchten und montieren.',
    priceRange: '15–40 € pro Reifen',
    duration: '30–60 Minuten',
    searchPath: '/suche?service=reifenwechsel',
    faqs: [
      { question: 'Was kostet ein Reifenwechsel in {city}?', answer: 'Ein Reifenwechsel in {city} kostet zwischen 15–40 € pro Reifen, je nach Größe und Werkstatt. Bei Bereifung24 findest du transparente Festpreise ohne versteckte Kosten.' },
      { question: 'Wie lange dauert ein Reifenwechsel?', answer: 'Ein kompletter Reifenwechsel (4 Reifen) dauert in der Regel 30–60 Minuten, inklusive Auswuchten und Montage.' },
      { question: 'Wann sollte ich meine Reifen wechseln?', answer: 'Reifen sollten gewechselt werden, wenn die Profiltiefe unter 3 mm liegt, das Reifenalter 6–8 Jahre übersteigt, oder sichtbare Beschädigungen vorliegen. Saisonal: Oktober (Winter) und April (Sommer).' },
      { question: 'Muss ich nach dem Reifenwechsel etwas beachten?', answer: 'Nach dem Reifenwechsel sollten Sie nach 50–100 km die Radschrauben nachziehen lassen. Bei neuen Reifen gilt eine Einfahrphase von ca. 200 km.' },
      { question: 'Kann ich bei Bereifung24 direkt einen Termin buchen?', answer: 'Ja! Wähle einfach eine Werkstatt in {city}, wähle deinen Wunschtermin und buche online. Reifen werden direkt zur Werkstatt geliefert.' },
    ],
  },
  winterreifen: {
    slug: 'winterreifen',
    name: 'Winterreifen',
    icon: '❄️',
    description: 'Winterreifen kaufen und montieren lassen – für sichere Fahrt bei Kälte, Schnee und Eis.',
    priceRange: 'ab 45 € pro Reifen (inkl. Montage)',
    duration: '45–90 Minuten',
    searchPath: '/suche?service=reifenwechsel&season=winter',
    faqs: [
      { question: 'Ab wann brauche ich Winterreifen in {city}?', answer: 'Die Faustregel lautet „von O bis O" – Oktober bis Ostern. In {city} und der Region Stuttgart empfehlen wir den Wechsel spätestens Mitte Oktober.' },
      { question: 'Was kosten Winterreifen mit Montage in {city}?', answer: 'Winterreifen mit Montage gibt es in {city} ab ca. 45 € pro Reifen. Der Preis hängt von Reifengröße, Marke und Geschwindigkeitsindex ab.' },
      { question: 'Welche Winterreifen sind für {city} empfehlenswert?', answer: 'Für {city} und Umgebung empfehlen wir Premium-Winterreifen von Continental, Michelin oder Bridgestone. Gute Mittelklasse-Alternativen sind Hankook und Kumho.' },
      { question: 'Gibt es eine Winterreifenpflicht in Deutschland?', answer: 'Ja, es gilt eine situative Winterreifenpflicht: Bei Glatteis, Schneeglätte, Schneematsch, Eis- oder Reifglätte müssen Winterreifen montiert sein. Bußgeld: 60–120 €.' },
      { question: 'Kann ich Winterreifen online bestellen und montieren lassen?', answer: 'Ja! Bei Bereifung24 wählst du deine Winterreifen online, buchst einen Termin bei einer Werkstatt in {city}, und die Reifen werden direkt dorthin geliefert.' },
    ],
  },
  sommerreifen: {
    slug: 'sommerreifen',
    name: 'Sommerreifen',
    icon: '☀️',
    description: 'Sommerreifen kaufen und montieren lassen – für optimale Haftung bei Wärme und Nässe.',
    priceRange: 'ab 40 € pro Reifen (inkl. Montage)',
    duration: '45–90 Minuten',
    searchPath: '/suche?service=reifenwechsel&season=sommer',
    faqs: [
      { question: 'Ab wann sollte ich auf Sommerreifen wechseln?', answer: 'Die Faustregel ist Ostern – wenn die Temperaturen dauerhaft über 7°C liegen. In {city} ist das meist Ende März bis Mitte April.' },
      { question: 'Was kosten Sommerreifen mit Montage in {city}?', answer: 'Sommerreifen mit Montage gibt es in {city} ab ca. 40 € pro Reifen. Premium-Marken kosten mehr, bieten aber bessere Leistung bei Nässe und kürzere Bremswege.' },
      { question: 'Welche Sommerreifen sind die besten?', answer: 'Top-Sommerreifen für die Region {city}: Continental PremiumContact 7, Michelin Primacy 4+, und Bridgestone Turanza T005. Bei Bereifung24 findest du alle Marken.' },
      { question: 'Wie lange halten Sommerreifen?', answer: 'Sommerreifen halten im Durchschnitt 40.000–60.000 km oder 4–6 Jahre. Regelmäßige Profiltiefe-Checks (Minimum 1,6 mm, empfohlen 3 mm) helfen bei der Einschätzung.' },
      { question: 'Kann ich bei Bereifung24 Sommerreifen vergleichen?', answer: 'Ja! Gib einfach deine Reifengröße ein und vergleiche Preise, Bewertungen und Verfügbarkeit. Buche direkt einen Montagetermin in {city}.' },
    ],
  },
  reifenmontage: {
    slug: 'reifenmontage',
    name: 'Reifenmontage',
    icon: '🛞',
    description: 'Professionelle Reifenmontage – inkl. Aufziehen, Auswuchten und Ventilservice.',
    priceRange: '12–35 € pro Reifen',
    duration: '30–60 Minuten',
    searchPath: '/suche?service=reifenwechsel',
    faqs: [
      { question: 'Was beinhaltet eine Reifenmontage?', answer: 'Eine professionelle Reifenmontage umfasst: Demontage des alten Reifens, Montage des neuen Reifens auf die Felge, Auswuchten, neues Ventil und Reifendruckkontrolle.' },
      { question: 'Was kostet die Reifenmontage in {city}?', answer: 'Die Reifenmontage in {city} kostet zwischen 12–35 € pro Reifen. Der Preis hängt von der Reifengröße und ob Runflat-Reifen montiert werden ab.' },
      { question: 'Kann ich eigene Reifen mitbringen?', answer: 'Ja, viele Werkstätten in {city} montieren auch mitgebrachte Reifen. Bei Bereifung24 kannst du aber auch direkt neue Reifen bestellen – die werden zur Werkstatt geliefert.' },
      { question: 'Ist Auswuchten bei der Montage dabei?', answer: 'Ja, bei den meisten Werkstätten auf Bereifung24 ist das Auswuchten im Montagepreis enthalten. Achte auf die Leistungsbeschreibung beim Buchen.' },
      { question: 'Brauche ich einen Termin für die Reifenmontage?', answer: 'Mit Bereifung24 buchst du bequem online einen Termin in {city}. So vermeidest du Wartezeiten und die Werkstatt kann sich optimal vorbereiten.' },
    ],
  },
  raederwechsel: {
    slug: 'raederwechsel',
    name: 'Räderwechsel',
    icon: '🔄',
    description: 'Räderwechsel – komplette Räder (Reifen + Felge) saisonal wechseln.',
    priceRange: '10–25 € pro Rad',
    duration: '20–40 Minuten',
    searchPath: '/suche?service=raederwechsel',
    faqs: [
      { question: 'Was ist der Unterschied zwischen Räderwechsel und Reifenwechsel?', answer: 'Beim Räderwechsel werden komplette Räder (Reifen + Felge) getauscht – z.B. Sommer- gegen Winterräder. Beim Reifenwechsel werden Reifen von der Felge demontiert und neue aufgezogen.' },
      { question: 'Was kostet ein Räderwechsel in {city}?', answer: 'Ein Räderwechsel in {city} kostet zwischen 10–25 € pro Rad, also 40–100 € für alle vier Räder. Günstiger als ein Reifenwechsel, da kein Auf-/Abziehen nötig ist.' },
      { question: 'Wie oft muss ich die Räder wechseln?', answer: 'Zweimal pro Jahr: Im Oktober auf Winterräder und im April auf Sommerräder. Die Faustregel „von O bis O" (Oktober bis Ostern) gilt.' },
      { question: 'Kann ich den Räderwechsel online buchen?', answer: 'Ja! Bei Bereifung24 findest du Werkstätten in {city}, die Räderwechsel anbieten. Wähle deinen Wunschtermin und buche in wenigen Klicks.' },
      { question: 'Werden die Radschrauben beim Wechsel nachgezogen?', answer: 'Die erste Prüfung findet direkt bei der Montage statt. Nach 50–100 km solltest du die Werkstatt nochmal aufsuchen zum Nachziehen – viele bieten das kostenlos an.' },
    ],
  },
  'reifen-einlagern': {
    slug: 'reifen-einlagern',
    name: 'Reifen einlagern',
    icon: '📦',
    description: 'Professionelle Reifeneinlagerung – sachgerechte Lagerung deiner Saisonreifen.',
    priceRange: '20–40 € pro Saison (4 Reifen)',
    duration: 'Sofort bei Räderwechsel',
    searchPath: '/suche?service=raederwechsel',
    faqs: [
      { question: 'Was kostet Reifen einlagern in {city}?', answer: 'Die Reifeneinlagerung in {city} kostet zwischen 20–40 € pro Saison für 4 Reifen oder Kompletträder. Manche Werkstätten bieten Einlagerung ab dem Räderwechsel kostenlos an.' },
      { question: 'Warum sollte ich Reifen professionell einlagern?', answer: 'Professionelle Einlagerung schützt vor UV-Strahlung, Feuchtigkeit und Verformung. Die Reifen halten länger und behalten ihre Fahreigenschaften. Ideal, wenn kein eigener Lagerplatz vorhanden ist.' },
      { question: 'Wie werden die Reifen gelagert?', answer: 'Reifen auf Felgen (Kompletträder) werden hängend oder liegend gestapelt gelagert. Reifen ohne Felge stehen aufrecht. Temperatur und Luftfeuchtigkeit werden kontrolliert.' },
      { question: 'Sind die Reifen bei Einlagerung versichert?', answer: 'Die meisten Werkstätten versichern eingelagerte Reifen gegen Diebstahl und Beschädigung. Frage bei der Buchung über Bereifung24 nach den genauen Konditionen.' },
      { question: 'Kann ich Einlagerung zusammen mit Räderwechsel buchen?', answer: 'Ja! Die meisten Werkstätten in {city} bieten Räderwechsel und Einlagerung als Kombi-Paket an. Buche beides bequem über Bereifung24.' },
    ],
  },
  reifenservice: {
    slug: 'reifenservice',
    name: 'Reifenservice',
    icon: '🏪',
    description: 'Kompletter Reifenservice – von der Beratung über Kauf bis zur Montage, alles aus einer Hand.',
    priceRange: 'je nach Service',
    duration: '30–90 Minuten',
    searchPath: '/suche',
    faqs: [
      { question: 'Was umfasst ein Reifenservice in {city}?', answer: 'Ein kompletter Reifenservice umfasst Beratung, Reifenkauf, Montage, Auswuchten, Altreifenentsorgung und optional Einlagerung. Bei Bereifung24 bekommst du alles aus einer Hand.' },
      { question: 'Wo finde ich guten Reifenservice in {city}?', answer: 'Auf Bereifung24 findest du geprüfte Werkstätten in {city} mit echten Kundenbewertungen. Vergleiche Preise und Service-Leistungen und buche direkt online.' },
      { question: 'Brauche ich einen Termin?', answer: 'Mit Bereifung24 buchst du bequem online einen festen Termin. So vermeidest du Wartezeiten und die Werkstatt kann alles vorbereiten – inklusive Reifenlieferung.' },
      { question: 'Was kostet Reifenservice in {city}?', answer: 'Die Kosten variieren je nach Service: Räderwechsel ab 10 € pro Rad, Reifenmontage ab 15 € pro Reifen, neue Reifen ab 40 € pro Stück (inkl. Montage).' },
      { question: 'Kann ich Reifen bei Bereifung24 auch kaufen?', answer: 'Ja! Wähle aus tausenden Reifen aller Marken, vergleiche Preise und lass sie direkt zu deiner Werkstatt in {city} liefern. Kauf und Montage in einem Schritt.' },
    ],
  },
  achsvermessung: {
    slug: 'achsvermessung',
    name: 'Achsvermessung',
    icon: '📐',
    description: 'Professionelle Achsvermessung – für gleichmäßigen Reifenverschleiß und sicheres Fahrverhalten.',
    priceRange: '39–89 €',
    duration: '30–45 Minuten',
    searchPath: '/suche?service=achsvermessung',
    faqs: [
      { question: 'Was ist eine Achsvermessung?', answer: 'Bei der Achsvermessung werden Spur, Sturz und Nachlauf der Räder gemessen und bei Bedarf korrigiert. So rollen die Reifen gerade und verschleißen gleichmäßig.' },
      { question: 'Wann brauche ich eine Achsvermessung?', answer: 'Eine Achsvermessung ist empfehlenswert bei: einseitigem Reifenverschleiß, Ziehen des Fahrzeugs zur Seite, nach Bordsteinrempler oder Schlagloch, und nach dem Einbau neuer Fahrwerksteile.' },
      { question: 'Was kostet eine Achsvermessung in {city}?', answer: 'Eine Achsvermessung in {city} kostet zwischen 39–89 €, je nach Werkstatt und ob beide Achsen vermessen werden (Vorder- und Hinterachse).' },
      { question: 'Wie lange dauert eine Achsvermessung?', answer: 'Eine Achsvermessung dauert ca. 30–45 Minuten. Bei Bedarf an Einstellarbeiten kann es etwas länger dauern.' },
      { question: 'Kann ich Achsvermessung über Bereifung24 buchen?', answer: 'Ja! Auf Bereifung24 findest du Werkstätten in {city}, die Achsvermessung anbieten. Buche direkt online zum Festpreis.' },
    ],
  },
  ganzjahresreifen: {
    slug: 'ganzjahresreifen',
    name: 'Ganzjahresreifen',
    icon: '🌦️',
    description: 'Ganzjahresreifen kaufen und montieren – ein Reifen für alle Jahreszeiten.',
    priceRange: 'ab 50 € pro Reifen (inkl. Montage)',
    duration: '45–90 Minuten',
    searchPath: '/suche?service=reifenwechsel&season=allseason',
    faqs: [
      { question: 'Sind Ganzjahresreifen für {city} geeignet?', answer: 'Ja, für {city} und die Region Stuttgart sind Ganzjahresreifen eine gute Option. Bei den moderaten Wintern reicht ein guter Allwetterreifen oft aus. Bei häufigen Fahrten in die Alb oder den Schwarzwald empfehlen wir echte Winterreifen.' },
      { question: 'Was kosten Ganzjahresreifen mit Montage?', answer: 'Ganzjahresreifen mit Montage gibt es in {city} ab ca. 50 € pro Reifen. Premium-Marken wie Continental AllSeasonContact 2 oder Michelin CrossClimate 2 kosten mehr, bieten aber bessere Leistung.' },
      { question: 'Sind Ganzjahresreifen im Winter erlaubt?', answer: 'Ja, sofern sie das Alpine-Symbol (3PMSF/Schneeflocke) tragen. Alle modernen Ganzjahresreifen haben dieses Symbol und erfüllen die gesetzliche Winterreifenpflicht.' },
      { question: 'Wie lange halten Ganzjahresreifen?', answer: 'Ganzjahresreifen halten ca. 30.000–50.000 km. Da sie ganzjährig gefahren werden, verschleißen sie schneller als reine Sommer- oder Winterreifen.' },
      { question: 'Kann ich Ganzjahresreifen bei Bereifung24 bestellen?', answer: 'Ja! Wähle Ganzjahresreifen in deiner Größe, vergleiche Marken und Preise, und buche direkt die Montage bei einer Werkstatt in {city}.' },
    ],
  },
  'reifen-kaufen': {
    slug: 'reifen-kaufen',
    name: 'Reifen kaufen',
    icon: '🛒',
    description: 'Reifen online kaufen und direkt zur Werkstatt liefern lassen – mit professioneller Montage.',
    priceRange: 'ab 35 € pro Reifen',
    duration: 'Lieferung in 1–3 Werktagen',
    searchPath: '/suche',
    faqs: [
      { question: 'Wo kann ich günstig Reifen kaufen in {city}?', answer: 'Bei Bereifung24 vergleichst du Reifen von über 50 Marken und findest den besten Preis. Reifen werden direkt zur Werkstatt in {city} geliefert – Montage inklusive.' },
      { question: 'Welche Reifenmarken gibt es bei Bereifung24?', answer: 'Wir bieten alle großen Marken: Continental, Michelin, Bridgestone, Dunlop, Goodyear, Pirelli, Hankook, Kumho, Nexen und viele mehr.' },
      { question: 'Wie funktioniert der Online-Reifenkauf?', answer: '1. Reifengröße eingeben, 2. Reifen auswählen, 3. Werkstatt in {city} wählen, 4. Termin buchen. Die Reifen werden direkt zur Werkstatt geliefert und montiert.' },
      { question: 'Sind die Preise inklusive Montage?', answer: 'Bei Bereifung24 siehst du den Gesamtpreis – Reifen plus Montage, Auswuchten und Ventil. Keine versteckten Kosten.' },
      { question: 'Wie schnell werden die Reifen geliefert?', answer: 'Die Lieferung zur Werkstatt in {city} dauert in der Regel 1–3 Werktage. Express-Lieferung ist bei vielen Größen möglich.' },
    ],
  },
}

// --- City Definitions (for service pages) ---

export const SERVICE_CITIES: ServiceCityData[] = [
  {
    citySlug: 'bietigheim-bissingen',
    cityName: 'Bietigheim-Bissingen',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 43500,
    postalCodes: ['74321', '74322'],
    nearbyAreas: 'Ludwigsburg, Sachsenheim, Freiberg am Neckar, Tamm und Ingersheim',
    localHighlight: 'Die Große Kreisstadt liegt strategisch an der A81 zwischen Stuttgart und Heilbronn und ist Hauptsitz des Dürr-Konzerns.',
  },
  {
    citySlug: 'stuttgart',
    cityName: 'Stuttgart',
    region: 'Landeshauptstadt Baden-Württemberg',
    population: 635911,
    postalCodes: ['70173', '70174', '70176', '70178', '70180', '70182', '70184', '70186', '70188', '70190', '70191', '70192', '70193', '70195', '70197', '70199', '70327', '70329', '70372', '70374', '70376', '70378', '70435', '70437', '70439', '70469', '70499', '70563', '70565', '70567', '70569', '70597', '70599', '70619', '70629'],
    nearbyAreas: 'Esslingen, Ludwigsburg, Böblingen, Sindelfingen, Fellbach und Waiblingen',
    localHighlight: 'Die Landeshauptstadt Baden-Württembergs ist Sitz von Porsche und Mercedes-Benz und eines der wichtigsten Automobilzentren Europas.',
  },
]

// --- Helper Functions ---

export function getAllServiceSlugs(): string[] {
  return Object.keys(SERVICES)
}

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return SERVICES[slug]
}

export function getAllServiceCitySlugs(): string[] {
  return SERVICE_CITIES.map(c => c.citySlug)
}

export function getServiceCityBySlug(slug: string): ServiceCityData | undefined {
  return SERVICE_CITIES.find(c => c.citySlug === slug)
}

export function getServiceCityFaqs(service: ServiceDefinition, city: ServiceCityData): { question: string; answer: string }[] {
  return service.faqs.map(faq => ({
    question: faq.question.replace(/\{city\}/g, city.cityName),
    answer: faq.answer.replace(/\{city\}/g, city.cityName),
  }))
}

// All combinations for sitemaps
export function getAllServiceCityPaths(): { service: string; city: string }[] {
  const paths: { service: string; city: string }[] = []
  for (const serviceSlug of Object.keys(SERVICES)) {
    for (const city of SERVICE_CITIES) {
      paths.push({ service: serviceSlug, city: city.citySlug })
    }
  }
  return paths
}
