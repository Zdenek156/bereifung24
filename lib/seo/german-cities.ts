// German cities data for programmatic SEO pages
// Each city gets a unique /werkstatt-werden/[city] page
// Organized by Bundesland for maintainability

import { BW_CITIES, type CityData as BwCityData } from './bw-cities'

export interface CityData {
  slug: string
  name: string
  state: string
  stateShort: string
  region: string
  population: number
  postalCodes: string[]
  description: string
  workshopCount: string
  carOwners: string
  nearbyCity?: string
  metaTitle: string
  metaDescription: string
  h1: string
  introText: string
  localFacts: string[]
}

// --- Generator for new cities ---

type CityType = 'capital' | 'auto' | 'metro' | 'university' | 'industrial' | 'default'

interface CityCore {
  name: string
  slug: string
  state: string
  stateShort: string
  region: string
  population: number
  postalCodes: string[]
  nearbyCity?: string
  uniqueFact: string
  cityType: string
}

function estimateWorkshops(pop: number): string {
  if (pop > 1000000) return `über ${Math.round(pop / 1200)}`
  if (pop > 500000) return `über ${Math.round(pop / 1100)}`
  if (pop > 200000) return `über ${Math.round(pop / 1000)}`
  if (pop > 100000) return `über ${Math.round(pop / 900)}`
  return `über ${Math.round(pop / 800)}`
}

function fmtCarOwners(pop: number): string {
  const n = Math.round(pop * 0.55 / 1000) * 1000
  return n >= 1000000 ? `ca. ${(n / 1000000).toFixed(1)} Mio.` : `ca. ${n.toLocaleString('de-DE')}`
}

function fmtPop(pop: number): string {
  return pop.toLocaleString('de-DE')
}

// Rotate meta titles for variety
const metaTitles = [
  (c: CityCore) => `Werkstatt registrieren ${c.name} | Bereifung24 – Kostenlose Werkstatt-Website`,
  (c: CityCore) => `KFZ-Werkstatt ${c.name} | Bereifung24 – Eigene Website & Online-Buchung`,
  (c: CityCore) => `Werkstatt-Partner ${c.name} | Bereifung24 – Jetzt kostenlos starten`,
  (c: CityCore) => `Reifenservice ${c.name} | Bereifung24 – Gratis Werkstatt-Website`,
]

const metaDescs = [
  (c: CityCore, co: string) => `KFZ-Werkstatt in ${c.name}? Registriere dich kostenlos auf Bereifung24. Eigene Werkstatt-Website, Online-Buchungssystem & automatische Reifenbestellung. ${co} Autofahrer in ${c.name}.`,
  (c: CityCore) => `Werkstatt in ${c.name}? Erhalte deine kostenlose Werkstatt-Website mit Online-Terminbuchung bei Bereifung24. Keine Grundgebühr, kein Vertrag. Jetzt registrieren.`,
  (c: CityCore, co: string) => `Werde Bereifung24 Partner in ${c.name}. Kostenlose eigene Internetseite, Online-Buchung & Reifenbestellung für deine KFZ-Werkstatt. ${co} potenzielle Kunden.`,
  (c: CityCore) => `KFZ-Werkstatt in ${c.name} registrieren – kostenlos bei Bereifung24. Eigene Website, Online-Buchungssystem, automatische Reifenlieferung. Keine Grundgebühr.`,
]

const introTemplates: Record<CityType, (c: CityCore, co: string, ps: string) => string> = {
  capital: (c, co) => `${c.name} als Landeshauptstadt von ${c.state} ist ein zentraler Verkehrs- und Wirtschaftsknotenpunkt. ${c.uniqueFact} Mit Bereifung24 erhältst du als Werkstatt kostenlos deine eigene Internetseite – Kunden buchen online und Reifen werden direkt zu dir geliefert.`,
  auto: (c, co) => `${c.name} ist untrennbar mit der Automobilindustrie verbunden – ${c.uniqueFact.charAt(0).toLowerCase() + c.uniqueFact.slice(1)} Bei ${co} Autofahrern in der Region ist der Bedarf an Reifenservice enorm. Registriere dich bei Bereifung24 und erhalte kostenlos deine professionelle Werkstatt-Website mit Online-Buchung.`,
  metro: (c, co, ps) => `${c.name} als Großstadt mit über ${ps} Einwohnern bietet Werkstätten enormes Potenzial. ${c.uniqueFact} Bei Bereifung24 bekommst du eine kostenlose eigene Werkstatt-Website, auf der Kunden direkt online Termine buchen und Reifen bestellen können.`,
  university: (c) => `${c.name} als Universitätsstadt hat eine junge, digital-affine Bevölkerung, die Services am liebsten online bucht. ${c.uniqueFact} Mit Bereifung24 bietest du genau das: Eine eigene kostenlose Werkstatt-Website mit Online-Terminbuchung und Reifenbestellung.`,
  industrial: (c, co) => `${c.name} im ${c.region} ist ein wichtiger Wirtschaftsstandort mit starkem Verkehrsaufkommen. ${c.uniqueFact} Mit Bereifung24 erhältst du kostenlos deine eigene Werkstatt-Internetseite – inklusive Online-Buchungssystem und automatischer Reifenbestellung.`,
  default: (c, co) => `In ${c.name} (${c.state}) gibt es ${co} Autofahrer, die regelmäßig Reifenservice brauchen. ${c.uniqueFact} Bereifung24 bietet dir als Werkstatt eine kostenlose eigene Website mit Online-Buchung und Reifenbestellservice – ohne Grundgebühr und ohne Vertrag.`,
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function generate(c: CityCore): CityData {
  const ws = estimateWorkshops(c.population)
  const co = fmtCarOwners(c.population)
  const ps = fmtPop(c.population)
  const h = hashStr(c.slug)
  const carCount = (Math.round(c.population * 0.55 / 1000) * 1000).toLocaleString('de-DE')

  return {
    slug: c.slug,
    name: c.name,
    state: c.state,
    stateShort: c.stateShort,
    region: c.region,
    population: c.population,
    postalCodes: c.postalCodes,
    description: `${c.region} mit über ${ps} Einwohnern`,
    workshopCount: ws,
    carOwners: co,
    nearbyCity: c.nearbyCity,
    metaTitle: metaTitles[h % metaTitles.length](c),
    metaDescription: metaDescs[h % metaDescs.length](c, co),
    h1: `Werkstatt registrieren in ${c.name}`,
    introText: (introTemplates[c.cityType as CityType] || introTemplates.default)(c, co, ps),
    localFacts: [
      `Über ${carCount} zugelassene Fahrzeuge in ${c.name}`,
      `${ws} KFZ-Werkstätten in der Region ${c.region}`,
      c.nearbyCity ? `Starker Pendlerverkehr aus ${c.nearbyCity} und Umgebung` : `Wichtiger Verkehrsknotenpunkt in ${c.state}`,
      c.uniqueFact,
    ],
  }
}

// --- Extend existing BW cities with state info ---

const BW_WITH_STATE: CityData[] = BW_CITIES.map(c => ({
  ...c,
  state: 'Baden-Württemberg',
  stateShort: 'BW',
}))

// --- Bayern ---
const BAYERN: CityData[] = [
  { name: 'München', slug: 'muenchen', state: 'Bayern', stateShort: 'BY', region: 'Oberbayern', population: 1472000, postalCodes: ['80331', '80333', '80335', '80469', '80539', '80636', '80797', '80999', '81369', '81541', '81667', '81739'], nearbyCity: 'Augsburg, Rosenheim und Freising', uniqueFact: 'Als BMW-Hauptsitz und Automobilmetropole hat München mit die höchste PKW-Dichte aller deutschen Großstädte.', cityType: 'auto' },
  { name: 'Nürnberg', slug: 'nuernberg', state: 'Bayern', stateShort: 'BY', region: 'Mittelfranken', population: 518370, postalCodes: ['90402', '90403', '90408', '90409', '90411', '90419', '90425', '90429', '90431', '90439', '90449', '90459', '90461', '90469', '90471', '90473', '90478', '90480', '90482', '90489', '90491'], nearbyCity: 'Fürth, Erlangen und Schwabach', uniqueFact: 'Nürnberg ist einer der größten Logistik-Knotenpunkte Süddeutschlands mit enormem Schwerlastverkehr auf der A3, A6 und A9.', cityType: 'metro' },
  { name: 'Augsburg', slug: 'augsburg', state: 'Bayern', stateShort: 'BY', region: 'Schwaben', population: 296582, postalCodes: ['86150', '86152', '86153', '86154', '86156', '86157', '86159', '86161', '86163', '86165', '86167', '86169', '86179', '86199'], nearbyCity: 'München und Ulm', uniqueFact: 'Augsburg liegt an der Achse München–Stuttgart und hat ein wachsendes Pendleraufkommen entlang der A8.', cityType: 'default' },
  { name: 'Regensburg', slug: 'regensburg', state: 'Bayern', stateShort: 'BY', region: 'Oberpfalz', population: 153094, postalCodes: ['93047', '93049', '93051', '93053', '93055', '93057', '93059'], nearbyCity: 'Ingolstadt und Landshut', uniqueFact: 'Das BMW-Werk Regensburg produziert über 1.000 Fahrzeuge täglich – die automobile Infrastruktur ist entsprechend stark.', cityType: 'auto' },
  { name: 'Ingolstadt', slug: 'ingolstadt', state: 'Bayern', stateShort: 'BY', region: 'Oberbayern', population: 140120, postalCodes: ['85049', '85051', '85053', '85055', '85057'], nearbyCity: 'München, Nürnberg und Regensburg', uniqueFact: 'Als Hauptsitz von Audi ist Ingolstadt Deutschlands Auto-Stadt par excellence mit extrem hoher Fahrzeugdichte.', cityType: 'auto' },
  { name: 'Würzburg', slug: 'wuerzburg', state: 'Bayern', stateShort: 'BY', region: 'Unterfranken', population: 127934, postalCodes: ['97070', '97072', '97074', '97076', '97078', '97080', '97082', '97084'], nearbyCity: 'Schweinfurt und Aschaffenburg', uniqueFact: 'Würzburg liegt am Schnittpunkt der A3 und A7 – zwei der meistbefahrenen Autobahnen Deutschlands.', cityType: 'university' },
  { name: 'Fürth', slug: 'fuerth', state: 'Bayern', stateShort: 'BY', region: 'Mittelfranken', population: 130000, postalCodes: ['90762', '90763', '90765', '90766', '90768'], nearbyCity: 'Nürnberg und Erlangen', uniqueFact: 'Fürth bildet zusammen mit Nürnberg und Erlangen das Städtedreieck – über 1 Million Einwohner im Einzugsgebiet.', cityType: 'industrial' },
  { name: 'Erlangen', slug: 'erlangen', state: 'Bayern', stateShort: 'BY', region: 'Mittelfranken', population: 112528, postalCodes: ['91052', '91054', '91056', '91058'], nearbyCity: 'Nürnberg und Fürth', uniqueFact: 'Erlangen als Siemens-Standort hat eine überdurchschnittlich hohe Kaufkraft und PKW-Dichte.', cityType: 'university' },
  { name: 'Bamberg', slug: 'bamberg', state: 'Bayern', stateShort: 'BY', region: 'Oberfranken', population: 77592, postalCodes: ['96047', '96049', '96050', '96052'], nearbyCity: 'Nürnberg und Bayreuth', uniqueFact: 'Bamberg als UNESCO-Weltkulturerbe zieht jährlich Millionen Touristen an – viele davon mit dem Auto.', cityType: 'default' },
  { name: 'Rosenheim', slug: 'rosenheim', state: 'Bayern', stateShort: 'BY', region: 'Oberbayern', population: 64000, postalCodes: ['83022', '83024', '83026'], nearbyCity: 'München und Salzburg', uniqueFact: 'Rosenheim am Tor zu den Alpen hat einen besonders hohen Winterreifen-Bedarf durch die alpine Lage.', cityType: 'default' },
  { name: 'Landshut', slug: 'landshut', state: 'Bayern', stateShort: 'BY', region: 'Niederbayern', population: 73065, postalCodes: ['84028', '84030', '84032', '84034'], nearbyCity: 'München und Regensburg', uniqueFact: 'Das BMW-Werk Landshut ist einer der größten Arbeitgeber der Region – die PKW-Dichte ist überdurchschnittlich hoch.', cityType: 'auto' },
  { name: 'Kempten', slug: 'kempten', state: 'Bayern', stateShort: 'BY', region: 'Allgäu', population: 69400, postalCodes: ['87435', '87437', '87439'], nearbyCity: 'Memmingen und Kaufbeuren', uniqueFact: 'Kempten im Allgäu hat einen überdurchschnittlich hohen SUV- und Allradanteil wegen der alpinen Straßenverhältnisse.', cityType: 'default' },
].map(generate)

// --- Nordrhein-Westfalen ---
const NRW: CityData[] = [
  { name: 'Köln', slug: 'koeln', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Rheinland', population: 1084795, postalCodes: ['50667', '50668', '50670', '50672', '50674', '50676', '50677', '50678', '50679', '50682', '50733', '50735', '50737', '50739', '50823', '50825', '50827', '50829', '50858', '50859', '50931', '50933', '50935', '50937', '50939', '50968', '50969', '50996', '50997', '50999', '51061', '51063', '51065', '51067', '51069', '51103', '51105', '51107', '51109'], nearbyCity: 'Bonn, Düsseldorf und Leverkusen', uniqueFact: 'Köln ist die viertgrößte Stadt Deutschlands mit dem meistbefahrenen Autobahnkreuz Europas (Kreuz Köln-Ost).', cityType: 'metro' },
  { name: 'Düsseldorf', slug: 'duesseldorf', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Niederrhein', population: 620523, postalCodes: ['40210', '40211', '40212', '40213', '40215', '40217', '40219', '40221', '40223', '40225', '40227', '40229', '40231', '40233', '40235', '40237', '40239'], nearbyCity: 'Köln, Duisburg und Wuppertal', uniqueFact: 'Düsseldorf hat die höchste PKW-Dichte aller NRW-Städte und ist Deutschlands Mode- und Wirtschaftshauptstadt.', cityType: 'capital' },
  { name: 'Dortmund', slug: 'dortmund', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Ruhrgebiet', population: 588250, postalCodes: ['44122', '44123', '44127', '44128', '44135', '44137', '44139', '44141', '44143', '44145', '44147', '44149'], nearbyCity: 'Bochum, Essen und Hagen', uniqueFact: 'Dortmund hat sich vom Stahl- zum Logistikzentrum gewandelt – enormes Pendler- und Transportaufkommen.', cityType: 'industrial' },
  { name: 'Essen', slug: 'essen', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Ruhrgebiet', population: 583109, postalCodes: ['45127', '45128', '45130', '45131', '45133', '45134', '45136', '45138', '45139', '45141', '45143', '45144'], nearbyCity: 'Duisburg, Bochum und Mülheim', uniqueFact: 'Essen als Zentrum des Ruhrgebiets verbindet 5 Millionen Menschen – der größte Ballungsraum Deutschlands.', cityType: 'metro' },
  { name: 'Duisburg', slug: 'duisburg', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Ruhrgebiet', population: 498686, postalCodes: ['47051', '47053', '47055', '47057', '47058', '47059'], nearbyCity: 'Düsseldorf und Oberhausen', uniqueFact: 'Duisburg hat den größten Binnenhafen der Welt – der Schwerlast- und Logistikverkehr ist enorm.', cityType: 'industrial' },
  { name: 'Bochum', slug: 'bochum', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Ruhrgebiet', population: 365587, postalCodes: ['44787', '44789', '44791', '44793', '44795', '44797', '44799', '44801', '44803'], nearbyCity: 'Dortmund, Essen und Herne', uniqueFact: 'Bochum war jahrzehntelang Opel-Standort und hat eine tief verwurzelte Automobiltradition.', cityType: 'auto' },
  { name: 'Wuppertal', slug: 'wuppertal', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Bergisches Land', population: 355004, postalCodes: ['42103', '42105', '42107', '42109', '42111', '42113', '42115', '42117', '42119'], nearbyCity: 'Düsseldorf, Köln und Solingen', uniqueFact: 'Wuppertals hügelige Topografie im Bergischen Land sorgt für überdurchschnittlichen Reifen- und Bremsenverschleiß.', cityType: 'default' },
  { name: 'Bielefeld', slug: 'bielefeld', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Ostwestfalen-Lippe', population: 334195, postalCodes: ['33602', '33604', '33605', '33607', '33609', '33611', '33613', '33615', '33617', '33619'], nearbyCity: 'Paderborn, Gütersloh und Herford', uniqueFact: 'Bielefeld ist das Wirtschaftszentrum von Ostwestfalen-Lippe mit über 500.000 Menschen im direkten Einzugsgebiet.', cityType: 'default' },
  { name: 'Bonn', slug: 'bonn', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Rhein-Sieg', population: 330579, postalCodes: ['53111', '53113', '53115', '53117', '53119', '53121', '53123', '53125', '53127', '53129'], nearbyCity: 'Köln, Siegburg und Bad Godesberg', uniqueFact: 'Bonn als ehemalige Bundeshauptstadt hat weiterhin viele Bundesbehörden – die Pendlerquote ist überdurchschnittlich.', cityType: 'default' },
  { name: 'Münster', slug: 'muenster', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Münsterland', population: 316403, postalCodes: ['48143', '48145', '48147', '48149', '48151', '48153', '48155', '48157', '48159', '48161'], nearbyCity: 'Osnabrück, Hamm und Bielefeld', uniqueFact: 'Münster gilt als Fahrradstadt, hat aber dennoch über 170.000 zugelassene PKW – diese brauchen zuverlässigen Reifenservice.', cityType: 'university' },
  { name: 'Aachen', slug: 'aachen', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Städteregion Aachen', population: 249070, postalCodes: ['52062', '52064', '52066', '52068', '52070', '52072', '52074'], nearbyCity: 'Köln, Maastricht (NL) und Lüttich (BE)', uniqueFact: 'Aachen als Dreiländereck-Stadt hat hohen Transitverkehr zwischen Deutschland, Belgien und den Niederlanden.', cityType: 'university' },
  { name: 'Krefeld', slug: 'krefeld', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Niederrhein', population: 228580, postalCodes: ['47798', '47799', '47800', '47802', '47803', '47804', '47805', '47807', '47809'], nearbyCity: 'Düsseldorf, Duisburg und Mönchengladbach', uniqueFact: 'Krefeld als „Samt- und Seidenstadt" hat eine starke Industriebasis und hohes Pendleraufkommen zum Niederrhein.', cityType: 'industrial' },
  { name: 'Mönchengladbach', slug: 'moenchengladbach', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Niederrhein', population: 261454, postalCodes: ['41061', '41063', '41065', '41066', '41068', '41069'], nearbyCity: 'Düsseldorf, Krefeld und Aachen', uniqueFact: 'Mönchengladbach profitiert von seiner Lage zwischen Düsseldorf und der niederländischen Grenze – viel Durchgangsverkehr.', cityType: 'default' },
  { name: 'Leverkusen', slug: 'leverkusen', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Rheinland', population: 163729, postalCodes: ['51371', '51373', '51375', '51377', '51379', '51381'], nearbyCity: 'Köln und Düsseldorf', uniqueFact: 'Leverkusen liegt am Autobahnkreuz Leverkusen (A1/A3) – einem der verkehrsreichsten Knotenpunkte in NRW.', cityType: 'industrial' },
  { name: 'Paderborn', slug: 'paderborn', state: 'Nordrhein-Westfalen', stateShort: 'NW', region: 'Ostwestfalen-Lippe', population: 153000, postalCodes: ['33098', '33100', '33102', '33104', '33106'], nearbyCity: 'Bielefeld, Kassel und Hamm', uniqueFact: 'Paderborn als IT-Standort und Universitätsstadt kombiniert junge Bevölkerung mit hoher Wirtschaftskraft.', cityType: 'university' },
].map(generate)

// --- Niedersachsen ---
const NIEDERSACHSEN: CityData[] = [
  { name: 'Hannover', slug: 'hannover', state: 'Niedersachsen', stateShort: 'NI', region: 'Region Hannover', population: 535061, postalCodes: ['30159', '30161', '30163', '30165', '30167', '30169', '30171', '30173', '30175', '30177', '30179', '30419', '30449', '30451', '30453', '30455', '30457', '30459', '30519', '30521', '30539', '30559', '30625', '30627', '30629', '30655', '30657', '30659'], nearbyCity: 'Braunschweig, Hildesheim und Celle', uniqueFact: 'Hannover als Messestadt mit der größten Messeanlage der Welt ist ein Verkehrsknotenpunkt ersten Ranges.', cityType: 'capital' },
  { name: 'Braunschweig', slug: 'braunschweig', state: 'Niedersachsen', stateShort: 'NI', region: 'Braunschweig-Wolfsburg', population: 249406, postalCodes: ['38100', '38102', '38104', '38106', '38108', '38110', '38112', '38114', '38116', '38118', '38120', '38122', '38124', '38126'], nearbyCity: 'Wolfsburg, Hannover und Salzgitter', uniqueFact: 'Braunschweig beherbergt das älteste Automobilinstitut Deutschlands und ist Sitz der Physikalisch-Technischen Bundesanstalt.', cityType: 'university' },
  { name: 'Oldenburg', slug: 'oldenburg', state: 'Niedersachsen', stateShort: 'NI', region: 'Weser-Ems', population: 170389, postalCodes: ['26121', '26122', '26123', '26125', '26127', '26129', '26131', '26133', '26135'], nearbyCity: 'Bremen und Osnabrück', uniqueFact: 'Oldenburg ist das wirtschaftliche Zentrum des Nordwestens mit starker Pendlerverbindung nach Bremen.', cityType: 'default' },
  { name: 'Osnabrück', slug: 'osnabrueck', state: 'Niedersachsen', stateShort: 'NI', region: 'Osnabrücker Land', population: 165251, postalCodes: ['49074', '49076', '49078', '49080', '49082', '49084', '49086'], nearbyCity: 'Münster, Bielefeld und Oldenburg', uniqueFact: 'Osnabrück liegt an der A1 – der wichtigsten Nord-Süd-Verbindung Norddeutschlands – mit starkem Transitverkehr.', cityType: 'default' },
  { name: 'Wolfsburg', slug: 'wolfsburg', state: 'Niedersachsen', stateShort: 'NI', region: 'Braunschweig-Wolfsburg', population: 124151, postalCodes: ['38440', '38442', '38444', '38446', '38448'], nearbyCity: 'Braunschweig und Hannover', uniqueFact: 'Als Heimat von Volkswagen ist Wolfsburg die Autostadt Deutschlands schlechthin – die PKW-Dichte ist die höchste bundesweit.', cityType: 'auto' },
  { name: 'Göttingen', slug: 'goettingen', state: 'Niedersachsen', stateShort: 'NI', region: 'Südniedersachsen', population: 119801, postalCodes: ['37073', '37075', '37077', '37079', '37081', '37083', '37085'], nearbyCity: 'Kassel, Hannover und Braunschweig', uniqueFact: 'Göttingen als Elite-Universitätsstadt hat eine hohe Akademikerquote und damit überdurchschnittliche Kaufkraft.', cityType: 'university' },
  { name: 'Hildesheim', slug: 'hildesheim', state: 'Niedersachsen', stateShort: 'NI', region: 'Region Hannover/Hildesheim', population: 102200, postalCodes: ['31134', '31135', '31137', '31139', '31141'], nearbyCity: 'Hannover und Braunschweig', uniqueFact: 'Hildesheim als UNESCO-Welterbestadt liegt strategisch zwischen Hannover und dem Harz – viel Pendlerverkehr.', cityType: 'default' },
  { name: 'Salzgitter', slug: 'salzgitter', state: 'Niedersachsen', stateShort: 'NI', region: 'Braunschweig-Wolfsburg', population: 105200, postalCodes: ['38226', '38228', '38229', '38239'], nearbyCity: 'Braunschweig und Wolfsburg', uniqueFact: 'Salzgitter ist ein wichtiger Industriestandort mit dem Salzgitter-Konzern und Volkswagen-Zulieferern in der Region.', cityType: 'industrial' },
].map(generate)

// --- Hessen ---
const HESSEN: CityData[] = [
  { name: 'Frankfurt am Main', slug: 'frankfurt-am-main', state: 'Hessen', stateShort: 'HE', region: 'Rhein-Main-Gebiet', population: 753056, postalCodes: ['60306', '60308', '60310', '60311', '60313', '60314', '60316', '60318', '60320', '60322', '60323', '60325', '60326', '60327', '60329', '60385', '60386', '60388', '60389', '60431', '60433', '60435', '60437', '60438', '60439'], nearbyCity: 'Offenbach, Wiesbaden, Darmstadt und Mainz', uniqueFact: 'Frankfurt als Finanzmetropole und Verkehrsdrehscheibe hat mit dem Frankfurter Kreuz Europas meistbefahrenes Autobahnkreuz.', cityType: 'metro' },
  { name: 'Wiesbaden', slug: 'wiesbaden', state: 'Hessen', stateShort: 'HE', region: 'Rhein-Main-Gebiet', population: 278474, postalCodes: ['65183', '65185', '65187', '65189', '65191', '65193', '65195', '65197', '65199'], nearbyCity: 'Frankfurt, Mainz und Darmstadt', uniqueFact: 'Wiesbaden als Hessens Landeshauptstadt hat die höchste Kaufkraft pro Einwohner im Rhein-Main-Gebiet.', cityType: 'capital' },
  { name: 'Kassel', slug: 'kassel', state: 'Hessen', stateShort: 'HE', region: 'Nordhessen', population: 201585, postalCodes: ['34117', '34119', '34121', '34123', '34125', '34127', '34128', '34130', '34131', '34132', '34134'], nearbyCity: 'Göttingen, Paderborn und Marburg', uniqueFact: 'Kassel liegt an der Achse Hannover–Frankfurt und ist Knotenpunkt der A7, A44 und A49 – starker Durchgangsverkehr.', cityType: 'default' },
  { name: 'Darmstadt', slug: 'darmstadt', state: 'Hessen', stateShort: 'HE', region: 'Rhein-Main-Gebiet', population: 160000, postalCodes: ['64283', '64285', '64287', '64289', '64291', '64293', '64295', '64297'], nearbyCity: 'Frankfurt und Heidelberg', uniqueFact: 'Darmstadt als „Wissenschaftsstadt" beherbergt ESA, GSI und die TU Darmstadt – hohe Akademikerquote und Kaufkraft.', cityType: 'university' },
  { name: 'Offenbach am Main', slug: 'offenbach', state: 'Hessen', stateShort: 'HE', region: 'Rhein-Main-Gebiet', population: 128000, postalCodes: ['63065', '63067', '63069', '63071', '63073', '63075'], nearbyCity: 'Frankfurt', uniqueFact: 'Offenbach grenzt direkt an Frankfurt und ist eine der am dichtesten besiedelten Städte Hessens – enormes Pendleraufkommen.', cityType: 'industrial' },
  { name: 'Gießen', slug: 'giessen', state: 'Hessen', stateShort: 'HE', region: 'Mittelhessen', population: 90000, postalCodes: ['35390', '35392', '35394', '35396'], nearbyCity: 'Marburg und Wetzlar', uniqueFact: 'Gießen ist Mittelhessens größte Stadt mit zwei Universitäten und einem wachsenden Einzugsgebiet bis Wetzlar und Limburg.', cityType: 'university' },
  { name: 'Marburg', slug: 'marburg', state: 'Hessen', stateShort: 'HE', region: 'Mittelhessen', population: 77000, postalCodes: ['35037', '35039', '35041', '35043'], nearbyCity: 'Gießen und Kassel', uniqueFact: 'Marburg als älteste protestantische Universitätsstadt hat eine junge, technikbegeisterte Bevölkerung.', cityType: 'university' },
  { name: 'Fulda', slug: 'fulda', state: 'Hessen', stateShort: 'HE', region: 'Osthessen', population: 69000, postalCodes: ['36037', '36039', '36041', '36043'], nearbyCity: 'Kassel und Würzburg', uniqueFact: 'Fulda liegt an der A7 und ist das Zentrum Osthessens – Autos aus dem gesamten Umland kommen hierher zum Service.', cityType: 'default' },
].map(generate)

// --- Sachsen ---
const SACHSEN: CityData[] = [
  { name: 'Leipzig', slug: 'leipzig', state: 'Sachsen', stateShort: 'SN', region: 'Westsachsen', population: 597493, postalCodes: ['04103', '04105', '04107', '04109', '04129', '04155', '04157', '04159', '04177', '04179', '04205', '04207', '04209', '04229', '04249', '04275', '04277', '04279', '04289', '04299', '04315', '04317', '04347'], nearbyCity: 'Halle und Dresden', uniqueFact: 'Leipzig wächst am schnellsten aller deutschen Großstädte und hat BMW- und Porsche-Werke in der Region.', cityType: 'auto' },
  { name: 'Dresden', slug: 'dresden', state: 'Sachsen', stateShort: 'SN', region: 'Ostsachsen', population: 556227, postalCodes: ['01067', '01069', '01097', '01099', '01109', '01127', '01129', '01139', '01157', '01159', '01169', '01187', '01189', '01217', '01219', '01237', '01239', '01257', '01259', '01277', '01279', '01307', '01309', '01326', '01328'], nearbyCity: 'Leipzig, Chemnitz und Meißen', uniqueFact: 'In der Gläsernen Manufaktur produziert VW den ID.3 – Dresden ist Sachsens Automobilhauptstadt.', cityType: 'capital' },
  { name: 'Chemnitz', slug: 'chemnitz', state: 'Sachsen', stateShort: 'SN', region: 'Südwestsachsen', population: 244400, postalCodes: ['09111', '09112', '09113', '09116', '09117', '09119', '09120', '09122', '09123', '09125', '09126', '09127', '09128', '09130', '09131'], nearbyCity: 'Dresden, Leipzig und Zwickau', uniqueFact: 'Chemnitz ist das industrielle Herz Sachsens mit VW-Motorenwerk und starker Zuliefererindustrie.', cityType: 'industrial' },
  { name: 'Zwickau', slug: 'zwickau', state: 'Sachsen', stateShort: 'SN', region: 'Westsachsen', population: 88000, postalCodes: ['08056', '08058', '08060', '08062', '08064'], nearbyCity: 'Chemnitz und Plauen', uniqueFact: 'Zwickau ist ein traditionsreicher Automobilstandort – hier werden VW ID.4 und ID.5 produziert.', cityType: 'auto' },
  { name: 'Plauen', slug: 'plauen', state: 'Sachsen', stateShort: 'SN', region: 'Vogtland', population: 65000, postalCodes: ['08523', '08525', '08527', '08529'], nearbyCity: 'Zwickau und Chemnitz', uniqueFact: 'Plauen im Vogtland ist Zentrum einer ländlichen Region – Werkstätten haben ein großes Einzugsgebiet.', cityType: 'default' },
].map(generate)

// --- Rheinland-Pfalz ---
const RHEINLAND_PFALZ: CityData[] = [
  { name: 'Mainz', slug: 'mainz', state: 'Rheinland-Pfalz', stateShort: 'RP', region: 'Rheinhessen', population: 218578, postalCodes: ['55116', '55118', '55120', '55122', '55124', '55126', '55127', '55128', '55129', '55130', '55131'], nearbyCity: 'Wiesbaden, Frankfurt und Darmstadt', uniqueFact: 'Mainz als Landeshauptstadt liegt direkt gegenüber von Wiesbaden – der Pendlerverkehr über den Rhein ist enorm.', cityType: 'capital' },
  { name: 'Ludwigshafen', slug: 'ludwigshafen', state: 'Rheinland-Pfalz', stateShort: 'RP', region: 'Rhein-Neckar', population: 172200, postalCodes: ['67059', '67061', '67063', '67065', '67067', '67069', '67071'], nearbyCity: 'Mannheim, Heidelberg und Speyer', uniqueFact: 'Ludwigshafen als BASF-Standort hat starken Industrieverkehr und eine enge Pendlerverbindung zu Mannheim.', cityType: 'industrial' },
  { name: 'Koblenz', slug: 'koblenz', state: 'Rheinland-Pfalz', stateShort: 'RP', region: 'Mittelrhein', population: 114052, postalCodes: ['56068', '56070', '56072', '56073', '56075', '56076', '56077'], nearbyCity: 'Bonn, Mainz und Trier', uniqueFact: 'Koblenz am Deutschen Eck liegt an der Kreuzung von Rhein und Mosel – touristischer Verkehr und A48/A61-Durchgangsverkehr.', cityType: 'default' },
  { name: 'Trier', slug: 'trier', state: 'Rheinland-Pfalz', stateShort: 'RP', region: 'Mosel-Region', population: 111000, postalCodes: ['54290', '54292', '54293', '54294', '54295', '54296'], nearbyCity: 'Luxemburg, Saarbrücken und Koblenz', uniqueFact: 'Trier als älteste Stadt Deutschlands liegt nahe der luxemburgischen Grenze – viel Grenzpendelverkehr.', cityType: 'university' },
  { name: 'Kaiserslautern', slug: 'kaiserslautern', state: 'Rheinland-Pfalz', stateShort: 'RP', region: 'Westpfalz', population: 100030, postalCodes: ['67655', '67657', '67659', '67661', '67663'], nearbyCity: 'Saarbrücken, Mannheim und Mainz', uniqueFact: 'Kaiserslautern hat durch die US-Militärbasis Ramstein ein internationales Umfeld mit hohem Fahrzeugaufkommen.', cityType: 'default' },
  { name: 'Worms', slug: 'worms', state: 'Rheinland-Pfalz', stateShort: 'RP', region: 'Rheinhessen', population: 83000, postalCodes: ['67547', '67549', '67550', '67551'], nearbyCity: 'Mannheim, Mainz und Ludwigshafen', uniqueFact: 'Worms liegt strategisch an der A61 zwischen dem Rhein-Main-Gebiet und der Pfalz – viel Durchgangsverkehr.', cityType: 'default' },
].map(generate)

// --- Schleswig-Holstein ---
const SCHLESWIG_HOLSTEIN: CityData[] = [
  { name: 'Kiel', slug: 'kiel', state: 'Schleswig-Holstein', stateShort: 'SH', region: 'Kieler Förde', population: 247548, postalCodes: ['24103', '24105', '24106', '24107', '24109', '24111', '24113', '24114', '24116', '24118'], nearbyCity: 'Hamburg, Neumünster und Lübeck', uniqueFact: 'Kiel als Landeshauptstadt und Marinestandort ist gleichzeitig der wichtigste Fährhafen nach Skandinavien.', cityType: 'capital' },
  { name: 'Lübeck', slug: 'luebeck', state: 'Schleswig-Holstein', stateShort: 'SH', region: 'Lübecker Bucht', population: 217198, postalCodes: ['23552', '23554', '23556', '23558', '23560', '23562', '23564', '23566', '23568', '23569', '23570'], nearbyCity: 'Hamburg und Kiel', uniqueFact: 'Lübeck als UNESCO-Welterbestadt und Tor nach Skandinavien hat starken Fähr- und Transitverkehr.', cityType: 'default' },
  { name: 'Flensburg', slug: 'flensburg', state: 'Schleswig-Holstein', stateShort: 'SH', region: 'Flensburger Förde', population: 90164, postalCodes: ['24937', '24939', '24941', '24943', '24944'], nearbyCity: 'Kiel und die dänische Grenze', uniqueFact: 'Flensburg ist Sitz des Kraftfahrt-Bundesamtes – die Stadt, die ganz Deutschland mit dem Autofahren verbindet.', cityType: 'default' },
  { name: 'Neumünster', slug: 'neumuenster', state: 'Schleswig-Holstein', stateShort: 'SH', region: 'Mittelholstein', population: 80196, postalCodes: ['24534', '24536', '24537', '24539'], nearbyCity: 'Hamburg und Kiel', uniqueFact: 'Neumünster liegt zentral an der A7 zwischen Hamburg und Kiel – ein natürlicher Haltepunkt für Reifenservice.', cityType: 'default' },
].map(generate)

// --- Thüringen ---
const THUERINGEN: CityData[] = [
  { name: 'Erfurt', slug: 'erfurt', state: 'Thüringen', stateShort: 'TH', region: 'Mittelthüringen', population: 214417, postalCodes: ['99084', '99085', '99086', '99087', '99089', '99091', '99092', '99094', '99096', '99097', '99098', '99099'], nearbyCity: 'Weimar, Jena und Gotha', uniqueFact: 'Erfurt als Landeshauptstadt Thüringens liegt am Schnittpunkt der A4 und A71 – ein zentraler Verkehrsknotenpunkt.', cityType: 'capital' },
  { name: 'Jena', slug: 'jena', state: 'Thüringen', stateShort: 'TH', region: 'Ostthüringen', population: 112000, postalCodes: ['07743', '07745', '07747', '07749'], nearbyCity: 'Erfurt, Weimar und Gera', uniqueFact: 'Jena als Hightech-Standort mit Carl Zeiss und Schott hat eine der höchsten Wirtschaftswachstumsraten Ostdeutschlands.', cityType: 'university' },
  { name: 'Gera', slug: 'gera', state: 'Thüringen', stateShort: 'TH', region: 'Ostthüringen', population: 93000, postalCodes: ['07545', '07546', '07548', '07549', '07551', '07552'], nearbyCity: 'Jena, Leipzig und Chemnitz', uniqueFact: 'Gera ist das Zentrum Ostthüringens mit einem großen ländlichen Einzugsgebiet, in dem PKW unverzichtbar sind.', cityType: 'default' },
  { name: 'Weimar', slug: 'weimar', state: 'Thüringen', stateShort: 'TH', region: 'Mittelthüringen', population: 66000, postalCodes: ['99423', '99425', '99427', '99428'], nearbyCity: 'Erfurt und Jena', uniqueFact: 'Weimar als Kulturstadt zieht jährlich über 3 Millionen Besucher an – viele davon mit dem PKW.', cityType: 'university' },
].map(generate)

// --- Brandenburg ---
const BRANDENBURG: CityData[] = [
  { name: 'Potsdam', slug: 'potsdam', state: 'Brandenburg', stateShort: 'BB', region: 'Berlin-Brandenburg', population: 180334, postalCodes: ['14467', '14469', '14471', '14473', '14476', '14478', '14480', '14482'], nearbyCity: 'Berlin', uniqueFact: 'Potsdam als Landeshauptstadt grenzt direkt an Berlin und gehört zu den am schnellsten wachsenden Städten Deutschlands.', cityType: 'capital' },
  { name: 'Cottbus', slug: 'cottbus', state: 'Brandenburg', stateShort: 'BB', region: 'Lausitz', population: 100219, postalCodes: ['03042', '03044', '03046', '03048', '03050', '03051', '03052', '03053', '03054', '03055'], nearbyCity: 'Berlin und Dresden', uniqueFact: 'Cottbus als Zentrum der Lausitz wandelt sich durch den Strukturwandel – neue Ansiedlungen bringen mehr Verkehr.', cityType: 'default' },
  { name: 'Brandenburg an der Havel', slug: 'brandenburg-an-der-havel', state: 'Brandenburg', stateShort: 'BB', region: 'Havelland', population: 72124, postalCodes: ['14770', '14772', '14774', '14776'], nearbyCity: 'Potsdam und Berlin', uniqueFact: 'Brandenburg an der Havel ist das historische Zentrum der Mark Brandenburg und Verkehrsknotenpunkt zwischen Berlin und Magdeburg.', cityType: 'default' },
  { name: 'Frankfurt (Oder)', slug: 'frankfurt-oder', state: 'Brandenburg', stateShort: 'BB', region: 'Oderland', population: 58000, postalCodes: ['15230', '15232', '15234', '15236'], nearbyCity: 'Berlin und Polen (Słubice)', uniqueFact: 'Frankfurt (Oder) liegt direkt an der polnischen Grenze – der Grenzverkehr und Transithandel ist ein Wirtschaftsfaktor.', cityType: 'default' },
].map(generate)

// --- Sachsen-Anhalt ---
const SACHSEN_ANHALT: CityData[] = [
  { name: 'Halle (Saale)', slug: 'halle-saale', state: 'Sachsen-Anhalt', stateShort: 'ST', region: 'Mitteldeutschland', population: 238762, postalCodes: ['06108', '06110', '06112', '06114', '06116', '06118', '06120', '06122', '06124', '06126', '06128', '06130', '06132'], nearbyCity: 'Leipzig und Magdeburg', uniqueFact: 'Halle (Saale) bildet mit Leipzig einen Doppel-Ballungsraum mit über 1 Million Einwohnern.', cityType: 'default' },
  { name: 'Magdeburg', slug: 'magdeburg', state: 'Sachsen-Anhalt', stateShort: 'ST', region: 'Sachsen-Anhalt', population: 236235, postalCodes: ['39104', '39106', '39108', '39110', '39112', '39114', '39116', '39118', '39120', '39122', '39124', '39126', '39128', '39130'], nearbyCity: 'Braunschweig, Hannover und Berlin', uniqueFact: 'Magdeburg als Landeshauptstadt liegt an der A2 – Deutschlands wichtigster Ost-West-Autobahn.', cityType: 'capital' },
  { name: 'Dessau-Roßlau', slug: 'dessau-rosslau', state: 'Sachsen-Anhalt', stateShort: 'ST', region: 'Mitteldeutschland', population: 81000, postalCodes: ['06842', '06844', '06846', '06849'], nearbyCity: 'Halle, Leipzig und Magdeburg', uniqueFact: 'Dessau-Roßlau als Bauhaus-Stadt hat historische Bedeutung und liegt zentral zwischen Halle und Magdeburg.', cityType: 'default' },
].map(generate)

// --- Mecklenburg-Vorpommern ---
const MECK_POMM: CityData[] = [
  { name: 'Rostock', slug: 'rostock', state: 'Mecklenburg-Vorpommern', stateShort: 'MV', region: 'Ostseeküste', population: 209191, postalCodes: ['18055', '18057', '18059', '18069', '18106', '18107', '18109', '18119', '18146', '18147'], nearbyCity: 'Schwerin, Wismar und Stralsund', uniqueFact: 'Rostock als größte Stadt an der deutschen Ostseeküste hat den wichtigsten Fährhafen nach Skandinavien.', cityType: 'metro' },
  { name: 'Schwerin', slug: 'schwerin', state: 'Mecklenburg-Vorpommern', stateShort: 'MV', region: 'Westmecklenburg', population: 96000, postalCodes: ['19053', '19055', '19057', '19059', '19061', '19063'], nearbyCity: 'Rostock, Hamburg und Lübeck', uniqueFact: 'Schwerin als kleinste Landeshauptstadt Deutschlands hat ein überraschend großes Einzugsgebiet im ländlichen Mecklenburg.', cityType: 'capital' },
  { name: 'Neubrandenburg', slug: 'neubrandenburg', state: 'Mecklenburg-Vorpommern', stateShort: 'MV', region: 'Mecklenburgische Seenplatte', population: 64000, postalCodes: ['17033', '17034', '17036'], nearbyCity: 'Rostock und Berlin', uniqueFact: 'Neubrandenburg ist Zentrum der Mecklenburgischen Seenplatte – in der Region ist das Auto das wichtigste Verkehrsmittel.', cityType: 'default' },
  { name: 'Stralsund', slug: 'stralsund', state: 'Mecklenburg-Vorpommern', stateShort: 'MV', region: 'Vorpommern', population: 59000, postalCodes: ['18435', '18437', '18439'], nearbyCity: 'Rostock und Greifswald', uniqueFact: 'Stralsund als Tor zur Insel Rügen hat besonders im Sommer enormen touristischen Verkehr.', cityType: 'default' },
].map(generate)

// --- Saarland ---
const SAARLAND: CityData[] = [
  { name: 'Saarbrücken', slug: 'saarbruecken', state: 'Saarland', stateShort: 'SL', region: 'Saarland', population: 180000, postalCodes: ['66111', '66113', '66115', '66117', '66119', '66121', '66123', '66125', '66126', '66127', '66128', '66129', '66130', '66131', '66132', '66133'], nearbyCity: 'Trier, Kaiserslautern und Metz (FR)', uniqueFact: 'Saarbrücken an der französischen Grenze hat starken Grenzpendelverkehr und ist das wirtschaftliche Zentrum des Saarlandes.', cityType: 'capital' },
  { name: 'Neunkirchen', slug: 'neunkirchen-saar', state: 'Saarland', stateShort: 'SL', region: 'Saarland', population: 47000, postalCodes: ['66538', '66539', '66540'], nearbyCity: 'Saarbrücken und Homburg', uniqueFact: 'Neunkirchen ist die zweitgrößte Stadt des Saarlandes und ein wichtiger Industriestandort mit starkem Pendlerverkehr.', cityType: 'industrial' },
].map(generate)

// --- Berlin ---
const BERLIN: CityData[] = [
  { name: 'Berlin', slug: 'berlin', state: 'Berlin', stateShort: 'BE', region: 'Berlin-Brandenburg', population: 3644826, postalCodes: ['10115', '10117', '10119', '10178', '10179', '10243', '10245', '10247', '10249', '10315', '10317', '10318', '10319', '10365', '10367', '10369', '10405', '10407', '10409', '10435', '10437', '10439', '10551', '10553', '10555', '10557', '10559', '10585', '10587', '10589', '10623', '10625', '10627', '10629', '10707', '10709', '10711', '10713', '10715', '10717', '10719', '10777', '10779', '10781', '10783', '10785', '10787', '10789', '10823', '10825', '10827', '10829', '10961', '10963', '10965', '10967', '10969', '10997', '10999'], nearbyCity: 'Potsdam und dem brandenburgischen Umland', uniqueFact: 'Berlin ist mit über 3,6 Millionen Einwohnern die größte Stadt Deutschlands und hat ca. 1,2 Millionen zugelassene PKW.', cityType: 'metro' },
].map(generate)

// --- Hamburg ---
const HAMBURG: CityData[] = [
  { name: 'Hamburg', slug: 'hamburg', state: 'Hamburg', stateShort: 'HH', region: 'Metropolregion Hamburg', population: 1853935, postalCodes: ['20095', '20097', '20099', '20144', '20146', '20148', '20149', '20249', '20251', '20253', '20255', '20257', '20259', '20354', '20355', '20357', '20359', '20457', '20459', '20535', '20537', '20539', '21029', '21031', '21033', '21035', '21037', '21039', '21073', '21075', '21077', '21079', '21107', '21109', '21129', '21147', '21149', '22041', '22043', '22045', '22047', '22049', '22081', '22083', '22085', '22087', '22089'], nearbyCity: 'Lübeck, Kiel und Bremen', uniqueFact: 'Hamburg ist die zweitgrößte Stadt Deutschlands und der wichtigste Hafenstandort – der Logistik- und Pendlerverkehr ist enorm.', cityType: 'metro' },
].map(generate)

// --- Bremen ---
const BREMEN: CityData[] = [
  { name: 'Bremen', slug: 'bremen', state: 'Bremen', stateShort: 'HB', region: 'Weser-Region', population: 567559, postalCodes: ['28195', '28197', '28199', '28201', '28203', '28205', '28207', '28209', '28211', '28213', '28215', '28217', '28219', '28237', '28239', '28259', '28277', '28279', '28307', '28309', '28325', '28327', '28329', '28355', '28357', '28359'], nearbyCity: 'Oldenburg, Hamburg und Hannover', uniqueFact: 'Bremen als Hafenstadt und Mercedes-Benz-Standort hat eine starke automobile Wirtschaft und Pendlerinfrastruktur.', cityType: 'auto' },
  { name: 'Bremerhaven', slug: 'bremerhaven', state: 'Bremen', stateShort: 'HB', region: 'Weser-Nordsee', population: 114025, postalCodes: ['27568', '27570', '27572', '27574', '27576', '27578', '27580'], nearbyCity: 'Bremen und Cuxhaven', uniqueFact: 'Bremerhaven hat den größten Autoumschlaghafen Europas – über 2 Millionen Fahrzeuge werden hier jährlich verschifft.', cityType: 'auto' },
].map(generate)

// === Combined Export ===

export const ALL_CITIES: CityData[] = [
  ...BW_WITH_STATE,
  ...BAYERN,
  ...NRW,
  ...NIEDERSACHSEN,
  ...HESSEN,
  ...SACHSEN,
  ...RHEINLAND_PFALZ,
  ...SCHLESWIG_HOLSTEIN,
  ...THUERINGEN,
  ...BRANDENBURG,
  ...SACHSEN_ANHALT,
  ...MECK_POMM,
  ...SAARLAND,
  ...BERLIN,
  ...HAMBURG,
  ...BREMEN,
]

// Helper functions
export function getAllCitySlugs(): string[] {
  return ALL_CITIES.map(c => c.slug)
}

export function getCityBySlug(slug: string): CityData | undefined {
  return ALL_CITIES.find(c => c.slug === slug)
}

export function getCitiesByState(state: string): CityData[] {
  return ALL_CITIES.filter(c => c.state === state).sort((a, b) => b.population - a.population)
}

export function getCitiesInSameState(slug: string): CityData[] {
  const city = getCityBySlug(slug)
  if (!city) return []
  return ALL_CITIES.filter(c => c.state === city.state && c.slug !== slug).sort((a, b) => b.population - a.population)
}

export function getAllStates(): { name: string; short: string; count: number }[] {
  const states = new Map<string, { name: string; short: string; count: number }>()
  for (const c of ALL_CITIES) {
    const existing = states.get(c.state)
    if (existing) {
      existing.count++
    } else {
      states.set(c.state, { name: c.state, short: c.stateShort, count: 1 })
    }
  }
  return Array.from(states.values()).sort((a, b) => b.count - a.count)
}

export const TOTAL_CITIES = ALL_CITIES.length
