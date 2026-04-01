// Baden-Württemberg city data for programmatic SEO pages
// Each city gets a unique /werkstatt-werden/[city] page

export interface CityData {
  slug: string
  name: string
  region: string
  population: number
  postalCodes: string[]
  description: string
  workshopCount: string // estimated KFZ workshops
  carOwners: string // estimated car owners
  nearbyCity?: string
  metaTitle: string
  metaDescription: string
  h1: string
  introText: string
  localFacts: string[]
}

export const BW_CITIES: CityData[] = [
  {
    slug: 'stuttgart',
    name: 'Stuttgart',
    region: 'Region Stuttgart',
    population: 635911,
    postalCodes: ['70173', '70174', '70176', '70178', '70180', '70182', '70184', '70186', '70188', '70190', '70191', '70192', '70193', '70195', '70197', '70199', '70327', '70329', '70372', '70374', '70376', '70378', '70435', '70437', '70439', '70469', '70499', '70563', '70565', '70567', '70569', '70597', '70599', '70619', '70629'],
    description: 'Landeshauptstadt mit über 635.000 Einwohnern und Automobilstandort Nr. 1',
    workshopCount: 'über 800',
    carOwners: 'ca. 350.000',
    metaTitle: 'Werkstatt registrieren Stuttgart | Bereifung24 - Kunden online gewinnen',
    metaDescription: 'KFZ-Werkstatt in Stuttgart? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, eigene Landingpage, automatische Reifenbestellung. Über 350.000 Autofahrer in Stuttgart warten.',
    h1: 'Werkstatt registrieren in Stuttgart',
    introText: 'Stuttgart ist Deutschlands Automobilhauptstadt – mit Mercedes-Benz, Porsche und über 350.000 zugelassenen Fahrzeugen. Als KFZ-Werkstatt in Stuttgart profitierst du von einer enormen Nachfrage nach Reifenservice. Mit Bereifung24 erreichst du diese Kunden digital, ohne Werbekosten.',
    localFacts: [
      'Über 350.000 zugelassene Fahrzeuge in Stuttgart',
      'Mehr als 800 KFZ-Werkstätten in der Region Stuttgart',
      'Hohe Nachfrage durch Pendler aus dem Umland (Esslingen, Ludwigsburg, Böblingen)',
      'Stuttgart hat mit die höchste PKW-Dichte in Baden-Württemberg'
    ]
  },
  {
    slug: 'karlsruhe',
    name: 'Karlsruhe',
    region: 'TechnologieRegion Karlsruhe',
    population: 313092,
    postalCodes: ['76131', '76133', '76135', '76137', '76139', '76149', '76185', '76187', '76189', '76199', '76227', '76228', '76229'],
    description: 'Technologiestadt mit über 313.000 Einwohnern',
    workshopCount: 'über 350',
    carOwners: 'ca. 170.000',
    metaTitle: 'Werkstatt registrieren Karlsruhe | Bereifung24 - Jetzt kostenlos starten',
    metaDescription: 'KFZ-Werkstatt in Karlsruhe? Werde Partner bei Bereifung24. Online-Terminbuchung, eigene Werkstatt-Website & automatische Reifenlieferung. 170.000 Autofahrer in Karlsruhe.',
    h1: 'Werkstatt registrieren in Karlsruhe',
    introText: 'Karlsruhe als TechnologieRegion setzt auf digitale Lösungen – auch im KFZ-Bereich. Mit über 170.000 Autofahrern und einer starken Pendler-Infrastruktur bietet Karlsruhe enormes Potenzial für Werkstätten, die ihre Auslastung digital steigern wollen.',
    localFacts: [
      'Über 170.000 zugelassene Fahrzeuge in Karlsruhe',
      'TechnologieRegion mit hoher Innovationsbereitschaft',
      'Starker Pendlerverkehr aus Pforzheim, Bruchsal und Rastatt',
      'Wachsende Stadt mit steigender Fahrzeugdichte'
    ]
  },
  {
    slug: 'mannheim',
    name: 'Mannheim',
    region: 'Rhein-Neckar-Metropolregion',
    population: 311831,
    postalCodes: ['68159', '68161', '68163', '68165', '68167', '68169', '68199', '68219', '68229', '68239', '68259', '68305', '68307', '68309'],
    description: 'Wirtschaftsmetropole in der Rhein-Neckar-Region',
    workshopCount: 'über 320',
    carOwners: 'ca. 165.000',
    metaTitle: 'Werkstatt registrieren Mannheim | Bereifung24 - Online Kunden gewinnen',
    metaDescription: 'KFZ-Werkstatt in Mannheim? Registriere dich kostenlos auf Bereifung24. Online-Buchungen, eigene Landingpage, automatische Reifenbestellung. Keine Grundgebühr.',
    h1: 'Werkstatt registrieren in Mannheim',
    introText: 'Mannheim als Zentrum der Rhein-Neckar-Metropolregion verbindet drei Bundesländer. Mit über 165.000 Autofahrern und starkem Pendlerverkehr aus Ludwigshafen, Heidelberg und der gesamten Region bietet Mannheim ideale Voraussetzungen für digitale Werkstatt-Services.',
    localFacts: [
      'Über 165.000 zugelassene Fahrzeuge in Mannheim',
      'Zentrum der Rhein-Neckar-Metropolregion (2,4 Mio. Einwohner)',
      'Starker Pendlerverkehr über die Landesgrenzen hinaus',
      'Wichtiger Logistik- und Verkehrsknotenpunkt'
    ]
  },
  {
    slug: 'freiburg',
    name: 'Freiburg',
    region: 'Breisgau',
    population: 236140,
    postalCodes: ['79098', '79100', '79102', '79104', '79106', '79108', '79110', '79111', '79112', '79114', '79115', '79117'],
    description: 'Universitätsstadt im Breisgau mit über 236.000 Einwohnern',
    workshopCount: 'über 220',
    carOwners: 'ca. 110.000',
    metaTitle: 'Werkstatt registrieren Freiburg | Bereifung24 - Kostenlos starten',
    metaDescription: 'KFZ-Werkstatt in Freiburg? Werde Partner bei Bereifung24. Online-Terminbuchung, eigene Werkstatt-Website, automatische Reifenlieferung. Keine Grundgebühr, keine Vertragslaufzeit.',
    h1: 'Werkstatt registrieren in Freiburg',
    introText: 'Freiburg im Breisgau ist eine wachsende Stadt mit starkem Umlandverkehr. Trotz hoher Radfahrerquote gibt es über 110.000 Autofahrer, die regelmäßig Reifenservice benötigen – besonders im Winter durch die Nähe zum Schwarzwald.',
    localFacts: [
      'Über 110.000 zugelassene Fahrzeuge in Freiburg',
      'Starke Wintersaison durch Schwarzwald-Nähe (Winterreifen-Pflicht)',
      'Wachsende Stadt mit steigender Fahrzeugdichte',
      'Einzugsgebiet bis zum Kaiserstuhl und Markgräflerland'
    ]
  },
  {
    slug: 'heidelberg',
    name: 'Heidelberg',
    region: 'Rhein-Neckar',
    population: 162273,
    postalCodes: ['69115', '69117', '69118', '69120', '69121', '69123', '69124', '69126'],
    description: 'Universitätsstadt mit über 162.000 Einwohnern',
    workshopCount: 'über 160',
    carOwners: 'ca. 80.000',
    metaTitle: 'Werkstatt registrieren Heidelberg | Bereifung24 - Digitale Kunden',
    metaDescription: 'KFZ-Werkstatt in Heidelberg? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, automatische Reifenbestellung. 80.000 Autofahrer in Heidelberg.',
    h1: 'Werkstatt registrieren in Heidelberg',
    introText: 'Heidelberg mit seiner renommierten Universität und starken Wirtschaft bietet über 80.000 Autofahrern Bedarf an professionellem Reifenservice. Als Werkstatt in Heidelberg erreichst du über Bereifung24 auch Kunden aus Mannheim, Weinheim und dem gesamten Rhein-Neckar-Raum.',
    localFacts: [
      'Über 80.000 zugelassene Fahrzeuge in Heidelberg',
      'Teil der Rhein-Neckar-Metropolregion',
      'Hoher Anteil an Premium-Fahrzeugen',
      'Starker Tourismus-Verkehr ganzjährig'
    ]
  },
  {
    slug: 'ulm',
    name: 'Ulm',
    region: 'Region Donau-Iller',
    population: 128928,
    postalCodes: ['89073', '89075', '89077', '89079', '89081'],
    description: 'Donaustadt an der bayerischen Grenze',
    workshopCount: 'über 140',
    carOwners: 'ca. 70.000',
    metaTitle: 'Werkstatt registrieren Ulm | Bereifung24 - Online Kunden gewinnen',
    metaDescription: 'KFZ-Werkstatt in Ulm? Werde Partner bei Bereifung24. Online-Terminbuchung, eigene Werkstatt-Seite, automatische Reifenlieferung. Kostenlos und ohne Vertrag.',
    h1: 'Werkstatt registrieren in Ulm',
    introText: 'Ulm an der Donau ist ein wichtiger Verkehrsknotenpunkt zwischen Baden-Württemberg und Bayern. Mit der Doppelstadt Ulm/Neu-Ulm erreichst du über 70.000 Autofahrer – und durch die Lage an der A8 zusätzlich starken Durchgangsverkehr.',
    localFacts: [
      'Über 70.000 zugelassene Fahrzeuge in Ulm',
      'Doppelstadt Ulm/Neu-Ulm = erweitertes Einzugsgebiet',
      'Wichtiger Verkehrsknotenpunkt an der A8',
      'Science City mit wachsender Wirtschaft und Bevölkerung'
    ]
  },
  {
    slug: 'heilbronn',
    name: 'Heilbronn',
    region: 'Region Heilbronn-Franken',
    population: 128334,
    postalCodes: ['74072', '74074', '74076', '74078', '74080', '74081'],
    description: 'Wirtschaftsstandort mit über 128.000 Einwohnern',
    workshopCount: 'über 150',
    carOwners: 'ca. 75.000',
    metaTitle: 'Werkstatt registrieren Heilbronn | Bereifung24 - Jetzt kostenlos',
    metaDescription: 'KFZ-Werkstatt in Heilbronn? Registriere dich kostenlos auf Bereifung24. Online-Buchungen, eigene Landingpage, automatische Reifenbestellung. 75.000 Autofahrer warten.',
    h1: 'Werkstatt registrieren in Heilbronn',
    introText: 'Heilbronn ist ein starker Wirtschaftsstandort mit hoher Fahrzeugdichte. Über 75.000 Autofahrer in der Stadt und ein großes Einzugsgebiet bis Neckarsulm, Weinsberg und Öhringen machen Heilbronn zum idealen Standort für digitale Werkstatt-Services.',
    localFacts: [
      'Über 75.000 zugelassene Fahrzeuge in Heilbronn',
      'Starker Wirtschaftsstandort mit Audi-Werk Neckarsulm in der Nähe',
      'Großes ländliches Einzugsgebiet',
      'Hohe PKW-Abhängigkeit im Pendlerverkehr'
    ]
  },
  {
    slug: 'pforzheim',
    name: 'Pforzheim',
    region: 'Nordschwarzwald',
    population: 128218,
    postalCodes: ['75172', '75173', '75175', '75177', '75179', '75180', '75181'],
    description: 'Goldstadt am Rand des Schwarzwalds',
    workshopCount: 'über 130',
    carOwners: 'ca. 70.000',
    metaTitle: 'Werkstatt registrieren Pforzheim | Bereifung24 - Kostenlos starten',
    metaDescription: 'KFZ-Werkstatt in Pforzheim? Werde Partner bei Bereifung24. Online-Terminbuchung, eigene Werkstatt-Website. 70.000 Autofahrer in Pforzheim und dem Enzkreis.',
    h1: 'Werkstatt registrieren in Pforzheim',
    introText: 'Pforzheim am Eingang des Schwarzwalds verbindet Industrie mit Natur. Über 70.000 Autofahrer in der Stadt und der gesamte Enzkreis als Einzugsgebiet bieten enormes Potenzial – besonders in der Winterreifen-Saison durch die Schwarzwald-Nähe.',
    localFacts: [
      'Über 70.000 zugelassene Fahrzeuge in Pforzheim',
      'Schwarzwald-Nähe = starke Winterreifen-Nachfrage',
      'Großer Enzkreis als ländliches Einzugsgebiet',
      'Gute Anbindung an A8 Richtung Stuttgart und Karlsruhe'
    ]
  },
  {
    slug: 'reutlingen',
    name: 'Reutlingen',
    region: 'Schwäbische Alb',
    population: 116456,
    postalCodes: ['72760', '72762', '72764', '72766', '72768', '72770'],
    description: 'Größte Stadt an der Schwäbischen Alb',
    workshopCount: 'über 120',
    carOwners: 'ca. 65.000',
    metaTitle: 'Werkstatt registrieren Reutlingen | Bereifung24 - Online Buchungen',
    metaDescription: 'KFZ-Werkstatt in Reutlingen? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, automatische Reifenbestellung. Werkstätten an der Schwäbischen Alb.',
    h1: 'Werkstatt registrieren in Reutlingen',
    introText: 'Reutlingen als größte Stadt an der Schwäbischen Alb ist bekannt für hohe Fahrzeugdichte und starken Pendlerverkehr Richtung Stuttgart. Über 65.000 Autofahrer und die Winterreifen-Pflicht auf der Alb machen Reutlingen zum perfekten Markt für digitalen Reifenservice.',
    localFacts: [
      'Über 65.000 zugelassene Fahrzeuge in Reutlingen',
      'Schwäbische Alb = Winterreifen-Pflicht-Region',
      'Starker Pendlerverkehr nach Stuttgart',
      'Enge Verbindung mit Nachbarstadt Tübingen'
    ]
  },
  {
    slug: 'esslingen',
    name: 'Esslingen am Neckar',
    region: 'Region Stuttgart',
    population: 94484,
    postalCodes: ['73728', '73730', '73732', '73733', '73734'],
    description: 'Industriestadt direkt neben Stuttgart',
    workshopCount: 'über 100',
    carOwners: 'ca. 55.000',
    metaTitle: 'Werkstatt registrieren Esslingen | Bereifung24 - Jetzt starten',
    metaDescription: 'KFZ-Werkstatt in Esslingen am Neckar? Werde Partner bei Bereifung24. Online-Buchungen, eigene Landingpage, automatische Reifenlieferung. Kostenlos und ohne Vertrag.',
    h1: 'Werkstatt registrieren in Esslingen am Neckar',
    introText: 'Esslingen am Neckar profitiert von der direkten Nachbarschaft zu Stuttgart. Mit über 55.000 Autofahrern und der starken Industriebasis (Daimler, Festo, Eberspächer) bietet Esslingen hohe Nachfrage nach professionellem Reifenservice.',
    localFacts: [
      'Über 55.000 zugelassene Fahrzeuge in Esslingen',
      'Starke Industriestadt mit vielen Firmenwagen',
      'Direkt an Stuttgart angrenzend',
      'Wichtiger Standort für Automobilzulieferer'
    ]
  },
  {
    slug: 'ludwigsburg',
    name: 'Ludwigsburg',
    region: 'Region Stuttgart',
    population: 94595,
    postalCodes: ['71634', '71636', '71638', '71640', '71642'],
    description: 'Barockstadt im Stuttgarter Speckgürtel',
    workshopCount: 'über 110',
    carOwners: 'ca. 55.000',
    metaTitle: 'Werkstatt registrieren Ludwigsburg | Bereifung24 - Mehr Kunden',
    metaDescription: 'KFZ-Werkstatt in Ludwigsburg? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, automatische Reifenbestellung. 55.000 Autofahrer in Ludwigsburg.',
    h1: 'Werkstatt registrieren in Ludwigsburg',
    introText: 'Ludwigsburg liegt im Herzen der wirtschaftsstärksten Region Deutschlands. Mit über 55.000 Autofahrern, dem Porsche-Entwicklungszentrum in Weissach und der Nähe zu Stuttgart profitierst du als Werkstatt von einer hohen Premium-Fahrzeugdichte.',
    localFacts: [
      'Über 55.000 zugelassene Fahrzeuge in Ludwigsburg',
      'Porsche Entwicklungszentrum Weissach in der Nähe',
      'Hoher Anteil an Premium- und Sportwagen',
      'Starker Pendlerverkehr nach Stuttgart'
    ]
  },
  {
    slug: 'tuebingen',
    name: 'Tübingen',
    region: 'Schwäbische Alb',
    population: 91877,
    postalCodes: ['72070', '72072', '72074', '72076'],
    description: 'Universitätsstadt am Neckar',
    workshopCount: 'über 80',
    carOwners: 'ca. 45.000',
    metaTitle: 'Werkstatt registrieren Tübingen | Bereifung24 - Digital durchstarten',
    metaDescription: 'KFZ-Werkstatt in Tübingen? Werde Partner bei Bereifung24. Online-Buchungssystem, eigene Werkstatt-Seite. 45.000 Autofahrer in Tübingen und Umgebung.',
    h1: 'Werkstatt registrieren in Tübingen',
    introText: 'Tübingen als renommierte Universitätsstadt am Neckar bietet über 45.000 Autofahrer. In Verbindung mit der Nachbarstadt Reutlingen und dem ländlichen Umland ergibt sich ein attraktives Einzugsgebiet für Werkstätten.',
    localFacts: [
      'Über 45.000 zugelassene Fahrzeuge in Tübingen',
      'Universitätsstadt mit hohem Anteil an jungen Autofahrern',
      'Gemeinsames Einzugsgebiet mit Reutlingen',
      'Schwäbische Alb als Winterreifen-Region'
    ]
  },
  {
    slug: 'konstanz',
    name: 'Konstanz',
    region: 'Bodensee',
    population: 85726,
    postalCodes: ['78462', '78464', '78465', '78467'],
    description: 'Größte Stadt am Bodensee',
    workshopCount: 'über 80',
    carOwners: 'ca. 45.000',
    metaTitle: 'Werkstatt registrieren Konstanz | Bereifung24 - Bodensee-Region',
    metaDescription: 'KFZ-Werkstatt in Konstanz? Registriere dich kostenlos auf Bereifung24. Online-Buchungen, eigene Landingpage. Die Bodensee-Region braucht Reifenservice.',
    h1: 'Werkstatt registrieren in Konstanz',
    introText: 'Konstanz als größte Stadt am Bodensee ist ein wichtiger Verkehrsknotenpunkt. Mit Grenzverkehr zur Schweiz, Tourismus und über 45.000 lokalen Autofahrern bietet die Bodensee-Region stabiles Potenzial für Werkstätten.',
    localFacts: [
      'Über 45.000 zugelassene Fahrzeuge in Konstanz',
      'Grenzverkehr zur Schweiz mit zusätzlichem Potenzial',
      'Starker Tourismus-Verkehr am Bodensee',
      'Winterreifen-Saison durch Bodensee-Klima besonders wichtig'
    ]
  },
  {
    slug: 'sindelfingen',
    name: 'Sindelfingen',
    region: 'Region Stuttgart',
    population: 64832,
    postalCodes: ['71063', '71065', '71067', '71069'],
    description: 'Mercedes-Benz Standort im Landkreis Böblingen',
    workshopCount: 'über 70',
    carOwners: 'ca. 40.000',
    metaTitle: 'Werkstatt registrieren Sindelfingen | Bereifung24 - Mercedes-Stadt',
    metaDescription: 'KFZ-Werkstatt in Sindelfingen? Werde Partner bei Bereifung24. Die Mercedes-Stadt braucht Reifenservice. Online-Buchungen, automatische Reifenbestellung.',
    h1: 'Werkstatt registrieren in Sindelfingen',
    introText: 'Sindelfingen ist Heimat des größten Mercedes-Benz Werks weltweit. Mit einer extrem hohen Fahrzeug- und Premium-PKW-Dichte ist die Nachfrage nach qualitativem Reifenservice überdurchschnittlich. Über Bereifung24 erreichst du diese Kunden direkt.',
    localFacts: [
      'Größtes Mercedes-Benz Werk weltweit mit über 35.000 Mitarbeitern',
      'Extrem hohe Premium-Fahrzeugdichte',
      'Über 40.000 zugelassene Fahrzeuge',
      'Starker Pendlerverkehr in der gesamten Region Böblingen'
    ]
  },
  {
    slug: 'boeblingen',
    name: 'Böblingen',
    region: 'Region Stuttgart',
    population: 51838,
    postalCodes: ['71032', '71034'],
    description: 'IT-Standort neben Sindelfingen',
    workshopCount: 'über 60',
    carOwners: 'ca. 30.000',
    metaTitle: 'Werkstatt registrieren Böblingen | Bereifung24 - Jetzt digital',
    metaDescription: 'KFZ-Werkstatt in Böblingen? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, eigene Werkstatt-Seite. Böblingen/Sindelfingen Region.',
    h1: 'Werkstatt registrieren in Böblingen',
    introText: 'Böblingen als Zwillingsstadt von Sindelfingen profitiert von der starken Automobilindustrie und dem IT-Cluster. Über 30.000 Autofahrer und die Doppelstadt-Dynamik bieten Werkstätten ein solides Kundenpotenzial.',
    localFacts: [
      'Über 30.000 zugelassene Fahrzeuge in Böblingen',
      'Zwillingsstadt mit Sindelfingen (gemeinsam über 70.000 Fahrzeuge)',
      'Starker IT-Standort (IBM, HP)',
      'Hoher Anteil an Firmenfahrzeugen'
    ]
  },
  {
    slug: 'goeppingen',
    name: 'Göppingen',
    region: 'Filstal',
    population: 59344,
    postalCodes: ['73033', '73035', '73037'],
    description: 'Industriestadt im Filstal',
    workshopCount: 'über 65',
    carOwners: 'ca. 35.000',
    metaTitle: 'Werkstatt registrieren Göppingen | Bereifung24 - Filstal-Region',
    metaDescription: 'KFZ-Werkstatt in Göppingen? Werde Partner bei Bereifung24. Online-Buchungen, automatische Reifenbestellung. Die Filstal-Region braucht digitalen Reifenservice.',
    h1: 'Werkstatt registrieren in Göppingen',
    introText: 'Göppingen im Filstal ist ein bedeutender Industriestandort zwischen Stuttgart und Ulm. Mit über 35.000 Autofahrern und starkem Pendlerverkehr entlang der A8 bietet Göppingen stabiles Potenzial für Werkstätten.',
    localFacts: [
      'Über 35.000 zugelassene Fahrzeuge in Göppingen',
      'Starker Industriestandort (Schuler, WMF)',
      'Pendlerverkehr entlang der A8 Stuttgart-Ulm',
      'Ländliches Einzugsgebiet im gesamten Filstal'
    ]
  },
  {
    slug: 'waiblingen',
    name: 'Waiblingen',
    region: 'Rems-Murr-Kreis',
    population: 55908,
    postalCodes: ['71332', '71334', '71336'],
    description: 'Kreisstadt des Rems-Murr-Kreises',
    workshopCount: 'über 60',
    carOwners: 'ca. 35.000',
    metaTitle: 'Werkstatt registrieren Waiblingen | Bereifung24 - Rems-Murr',
    metaDescription: 'KFZ-Werkstatt in Waiblingen? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, eigene Landingpage. Rems-Murr-Kreis mit über 400.000 Einwohnern.',
    h1: 'Werkstatt registrieren in Waiblingen',
    introText: 'Waiblingen als Kreisstadt des Rems-Murr-Kreises liegt im wirtschaftsstarken Stuttgarter Umland. Der gesamte Rems-Murr-Kreis mit über 400.000 Einwohnern bietet ein riesiges Einzugsgebiet für Werkstätten.',
    localFacts: [
      'Über 35.000 zugelassene Fahrzeuge in Waiblingen',
      'Kreisstadt des Rems-Murr-Kreises (über 400.000 Einwohner)',
      'Stihl-Hauptsitz in Waiblingen',
      'Enge Anbindung an Stuttgart über S-Bahn und B14'
    ]
  },
  {
    slug: 'villingen-schwenningen',
    name: 'Villingen-Schwenningen',
    region: 'Schwarzwald-Baar',
    population: 86064,
    postalCodes: ['78048', '78050', '78052', '78054', '78056'],
    description: 'Doppelstadt im Schwarzwald-Baar-Kreis',
    workshopCount: 'über 90',
    carOwners: 'ca. 50.000',
    metaTitle: 'Werkstatt registrieren Villingen-Schwenningen | Bereifung24',
    metaDescription: 'KFZ-Werkstatt in Villingen-Schwenningen? Werde Partner bei Bereifung24. Schwarzwald-Region mit hoher Winterreifen-Nachfrage. Kostenlos und ohne Vertrag.',
    h1: 'Werkstatt registrieren in Villingen-Schwenningen',
    introText: 'Villingen-Schwenningen im Schwarzwald-Baar-Kreis ist die größte Stadt im Schwarzwald. Mit über 50.000 Autofahrern und der extremen Winterreifen-Nachfrage durch die Höhenlage bieten sich hier beste Voraussetzungen für digitalen Reifenservice.',
    localFacts: [
      'Über 50.000 zugelassene Fahrzeuge in Villingen-Schwenningen',
      'Größte Stadt im Schwarzwald',
      'Höhenlage = extrem hohe Winterreifen-Nachfrage',
      'Großes ländliches Einzugsgebiet im gesamten Schwarzwald-Baar-Kreis'
    ]
  },
  {
    slug: 'offenburg',
    name: 'Offenburg',
    region: 'Ortenaukreis',
    population: 62103,
    postalCodes: ['77652', '77654', '77656'],
    description: 'Zentrum des Ortenaukreises',
    workshopCount: 'über 70',
    carOwners: 'ca. 35.000',
    metaTitle: 'Werkstatt registrieren Offenburg | Bereifung24 - Ortenau-Region',
    metaDescription: 'KFZ-Werkstatt in Offenburg? Registriere dich kostenlos auf Bereifung24. Online-Buchungen, automatische Reifenbestellung. Ortenaukreis mit über 400.000 Einwohnern.',
    h1: 'Werkstatt registrieren in Offenburg',
    introText: 'Offenburg als Zentrum des Ortenaukreises bietet mit über 400.000 Einwohnern im Landkreis ein enormes Einzugsgebiet. Die Lage zwischen Schwarzwald und Rheinebene bringt starken Winterreifen-Bedarf und ganzjährige Nachfrage.',
    localFacts: [
      'Über 35.000 zugelassene Fahrzeuge in Offenburg',
      'Zentrum des Ortenaukreises (über 400.000 Einwohner)',
      'Grenzregion zu Frankreich mit Zusatz-Potenzial',
      'Schwarzwald-Nähe = starke Winterreifen-Nachfrage'
    ]
  },
  {
    slug: 'aalen',
    name: 'Aalen',
    region: 'Ostalb',
    population: 68907,
    postalCodes: ['73430', '73431', '73432', '73433', '73434'],
    description: 'Größte Stadt der Ostalb',
    workshopCount: 'über 75',
    carOwners: 'ca. 40.000',
    metaTitle: 'Werkstatt registrieren Aalen | Bereifung24 - Ostalb-Region',
    metaDescription: 'KFZ-Werkstatt in Aalen? Werde Partner bei Bereifung24. Online-Terminbuchung, eigene Werkstatt-Website. Ostalb-Region mit starkem Reifenservice-Bedarf.',
    h1: 'Werkstatt registrieren in Aalen',
    introText: 'Aalen als größte Stadt der Ostalb liegt strategisch zwischen Stuttgart und Nürnberg. Mit über 40.000 Autofahrern und einem großen ländlichen Einzugsgebiet bietet die Ostalb-Region starkes Potenzial für digitale Werkstatt-Services.',
    localFacts: [
      'Über 40.000 zugelassene Fahrzeuge in Aalen',
      'Größte Stadt im Ostalbkreis',
      'Stark von PKW abhängige Region (wenig ÖPNV)',
      'Wichtiger Standort für Carl Zeiss und Voith'
    ]
  },
  {
    slug: 'bietigheim-bissingen',
    name: 'Bietigheim-Bissingen',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 43500,
    postalCodes: ['74321', '74322'],
    description: 'Große Kreisstadt im Landkreis Ludwigsburg an der Enz',
    workshopCount: 'über 50',
    carOwners: 'ca. 25.000',
    metaTitle: 'Werkstatt registrieren Bietigheim-Bissingen | Bereifung24 - Jetzt starten',
    metaDescription: 'KFZ-Werkstatt in Bietigheim-Bissingen? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, eigene Werkstatt-Website, automatische Reifenbestellung. 25.000 Autofahrer warten.',
    h1: 'Werkstatt registrieren in Bietigheim-Bissingen',
    introText: 'Bietigheim-Bissingen im Landkreis Ludwigsburg liegt strategisch zwischen Stuttgart und Heilbronn an der A81. Mit dem Dürr-Konzern als größtem Arbeitgeber und einer starken Pendlerinfrastruktur bietet die Große Kreisstadt über 25.000 Autofahrern Bedarf an professionellem Reifenservice.',
    localFacts: [
      'Über 25.000 zugelassene Fahrzeuge in Bietigheim-Bissingen',
      'Hauptsitz des Dürr-Konzerns (Automobilzulieferer)',
      'Starker Pendlerverkehr entlang der A81 (Stuttgart–Heilbronn)',
      'Historische Altstadt mit Fachwerkhäusern an der Enz'
    ]
  },
  {
    slug: 'freiberg-am-neckar',
    name: 'Freiberg am Neckar',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 16000,
    postalCodes: ['71691'],
    description: 'Stadt am Neckar im Landkreis Ludwigsburg',
    workshopCount: 'über 15',
    carOwners: 'ca. 9.000',
    metaTitle: 'Werkstatt registrieren Freiberg am Neckar | Bereifung24',
    metaDescription: 'KFZ-Werkstatt in Freiberg am Neckar? Werde Partner bei Bereifung24. Online-Buchungen, eigene Werkstatt-Website. Direkt bei Ludwigsburg und Bietigheim-Bissingen.',
    h1: 'Werkstatt registrieren in Freiberg am Neckar',
    introText: 'Freiberg am Neckar liegt ideal zwischen Ludwigsburg und Bietigheim-Bissingen. Mit über 9.000 Autofahrern und starkem Pendlerverkehr in die umliegenden Städte bietet Freiberg gutes Potenzial für digitalen Reifenservice.',
    localFacts: [
      'Über 9.000 zugelassene Fahrzeuge in Freiberg am Neckar',
      'Direkte Nachbarstadt von Bietigheim-Bissingen',
      'Starker Pendlerverkehr nach Stuttgart und Ludwigsburg',
      'Wachsende Wohngemeinde mit hoher Fahrzeugdichte'
    ]
  },
  {
    slug: 'marbach-am-neckar',
    name: 'Marbach am Neckar',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 16200,
    postalCodes: ['71672'],
    description: 'Schillerstadt am Neckar',
    workshopCount: 'über 15',
    carOwners: 'ca. 9.000',
    metaTitle: 'Werkstatt registrieren Marbach am Neckar | Bereifung24',
    metaDescription: 'KFZ-Werkstatt in Marbach am Neckar? Registriere dich kostenlos auf Bereifung24. Die Schillerstadt braucht digitalen Reifenservice. Keine Grundgebühr.',
    h1: 'Werkstatt registrieren in Marbach am Neckar',
    introText: 'Marbach am Neckar, die Schillerstadt, liegt nur wenige Kilometer von Bietigheim-Bissingen entfernt. Mit einem wachsenden Einzugsgebiet im Bottwartal und über 9.000 Autofahrern lohnt sich digitaler Reifenservice.',
    localFacts: [
      'Über 9.000 zugelassene Fahrzeuge in Marbach',
      'Schillerstadt mit starkem Tourismus-Verkehr',
      'Einzugsgebiet im gesamten Bottwartal',
      'Gute Anbindung an B27 Richtung Stuttgart'
    ]
  },
  {
    slug: 'sachsenheim',
    name: 'Sachsenheim',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 18500,
    postalCodes: ['74343'],
    description: 'Stadt westlich von Bietigheim-Bissingen',
    workshopCount: 'über 20',
    carOwners: 'ca. 11.000',
    metaTitle: 'Werkstatt registrieren Sachsenheim | Bereifung24 - Kostenlos',
    metaDescription: 'KFZ-Werkstatt in Sachsenheim? Werde Partner bei Bereifung24. Online-Buchungssystem, eigene Werkstatt-Website. Im Herzen des Landkreises Ludwigsburg.',
    h1: 'Werkstatt registrieren in Sachsenheim',
    introText: 'Sachsenheim liegt westlich von Bietigheim-Bissingen und bedient ein ländliches Einzugsgebiet bis Vaihingen an der Enz. Über 11.000 Autofahrer sind auf den PKW angewiesen – perfektes Potenzial für digitalen Reifenservice.',
    localFacts: [
      'Über 11.000 zugelassene Fahrzeuge in Sachsenheim',
      'Ländliches Einzugsgebiet mit hoher PKW-Abhängigkeit',
      'Direkte Nachbarstadt von Bietigheim-Bissingen',
      'Motorsport-Tradition durch Sachsenring-Nähe'
    ]
  },
  {
    slug: 'kornwestheim',
    name: 'Kornwestheim',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 34000,
    postalCodes: ['70806'],
    description: 'Salamander-Stadt zwischen Stuttgart und Ludwigsburg',
    workshopCount: 'über 35',
    carOwners: 'ca. 20.000',
    metaTitle: 'Werkstatt registrieren Kornwestheim | Bereifung24 - Jetzt starten',
    metaDescription: 'KFZ-Werkstatt in Kornwestheim? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, eigene Werkstatt-Website. 20.000 Autofahrer in Kornwestheim.',
    h1: 'Werkstatt registrieren in Kornwestheim',
    introText: 'Kornwestheim liegt direkt zwischen Stuttgart und Ludwigsburg und profitiert von enormem Pendlerverkehr. Mit über 20.000 Autofahrern und dem Salamander-Areal als wachsendem Wirtschaftsstandort bietet Kornwestheim ideale Bedingungen für Reifenservice.',
    localFacts: [
      'Über 20.000 zugelassene Fahrzeuge in Kornwestheim',
      'Direkt zwischen Stuttgart und Ludwigsburg gelegen',
      'Starker Pendlerverkehr in beide Richtungen',
      'Wachsender Wirtschaftsstandort mit Salamander-Areal'
    ]
  },
  {
    slug: 'remseck-am-neckar',
    name: 'Remseck am Neckar',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 27000,
    postalCodes: ['71686'],
    description: 'Wachsende Stadt an der Remsmündung',
    workshopCount: 'über 25',
    carOwners: 'ca. 16.000',
    metaTitle: 'Werkstatt registrieren Remseck am Neckar | Bereifung24',
    metaDescription: 'KFZ-Werkstatt in Remseck am Neckar? Werde Partner bei Bereifung24. Online-Buchungen, eigene Werkstatt-Website. Wachsende Stadt im Landkreis Ludwigsburg.',
    h1: 'Werkstatt registrieren in Remseck am Neckar',
    introText: 'Remseck am Neckar ist eine der am schnellsten wachsenden Städte im Landkreis Ludwigsburg. Mit über 16.000 Autofahrern und der Lage zwischen Stuttgart und Ludwigsburg bietet Remseck starkes Kundenpotenzial für Werkstätten.',
    localFacts: [
      'Über 16.000 zugelassene Fahrzeuge in Remseck',
      'Schnell wachsende Stadt mit steigender Fahrzeugdichte',
      'Zwischen Stuttgart und Ludwigsburg gelegen',
      'Starker Pendlerverkehr über B27 und Neckarbrücken'
    ]
  },
  {
    slug: 'vaihingen-an-der-enz',
    name: 'Vaihingen an der Enz',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 29000,
    postalCodes: ['71665'],
    description: 'Große Kreisstadt an der Enz',
    workshopCount: 'über 30',
    carOwners: 'ca. 17.000',
    metaTitle: 'Werkstatt registrieren Vaihingen an der Enz | Bereifung24',
    metaDescription: 'KFZ-Werkstatt in Vaihingen an der Enz? Registriere dich kostenlos auf Bereifung24. Große Kreisstadt mit 17.000 Autofahrern. Online-Buchungssystem inklusive.',
    h1: 'Werkstatt registrieren in Vaihingen an der Enz',
    introText: 'Vaihingen an der Enz ist eine Große Kreisstadt westlich von Bietigheim-Bissingen. Mit über 17.000 Autofahrern und einem großen ländlichen Einzugsgebiet im Enztal bietet Vaihingen stabiles Potenzial für digitalen Reifenservice.',
    localFacts: [
      'Über 17.000 zugelassene Fahrzeuge in Vaihingen',
      'Große Kreisstadt mit breitem Einzugsgebiet im Enztal',
      'Gute Anbindung an A81 und B10',
      'Ländliche Region mit hoher PKW-Abhängigkeit'
    ]
  },
  {
    slug: 'fellbach',
    name: 'Fellbach',
    region: 'Region Stuttgart / Rems-Murr-Kreis',
    population: 46000,
    postalCodes: ['70734', '70736'],
    description: 'Große Kreisstadt direkt an Stuttgart angrenzend',
    workshopCount: 'über 50',
    carOwners: 'ca. 27.000',
    metaTitle: 'Werkstatt registrieren Fellbach | Bereifung24 - Mehr Kunden',
    metaDescription: 'KFZ-Werkstatt in Fellbach? Werde Partner bei Bereifung24. Direkt an Stuttgart gelegen, 27.000 Autofahrer. Online-Buchungen und eigene Werkstatt-Website.',
    h1: 'Werkstatt registrieren in Fellbach',
    introText: 'Fellbach grenzt direkt an Stuttgart und ist eine der wohlhabendsten Städte der Region. Mit über 27.000 Autofahrern und einer hohen Premium-Fahrzeugdichte bietet Fellbach exzellentes Potenzial für Werkstätten.',
    localFacts: [
      'Über 27.000 zugelassene Fahrzeuge in Fellbach',
      'Direkt an Stuttgart angrenzend',
      'Hohe Kaufkraft und Premium-Fahrzeugdichte',
      'Starker Pendlerverkehr über B14 nach Stuttgart'
    ]
  },
  {
    slug: 'leonberg',
    name: 'Leonberg',
    region: 'Region Stuttgart / Landkreis Böblingen',
    population: 49000,
    postalCodes: ['71229'],
    description: 'Große Kreisstadt mit Bosch-Standort',
    workshopCount: 'über 55',
    carOwners: 'ca. 29.000',
    metaTitle: 'Werkstatt registrieren Leonberg | Bereifung24 - Jetzt starten',
    metaDescription: 'KFZ-Werkstatt in Leonberg? Registriere dich kostenlos auf Bereifung24. Bosch-Standort mit 29.000 Autofahrern. Online-Buchungssystem und eigene Website.',
    h1: 'Werkstatt registrieren in Leonberg',
    introText: 'Leonberg im Landkreis Böblingen ist Sitz der Bosch-Geschäftsführung und Autobahnknotenpunkt an A8 und A81. Mit über 29.000 Autofahrern und einer hohen Firmenwagen-Dichte bietet Leonberg starkes Potenzial für Reifenservice.',
    localFacts: [
      'Über 29.000 zugelassene Fahrzeuge in Leonberg',
      'Bosch-Hauptsitz und Automobilzulieferer-Standort',
      'Autobahnkreuz Leonberg (A8/A81) – enormer Verkehr',
      'Hoher Anteil an Firmen- und Dienstwagen'
    ]
  },
  {
    slug: 'backnang',
    name: 'Backnang',
    region: 'Rems-Murr-Kreis',
    population: 37000,
    postalCodes: ['71522'],
    description: 'Kreisstadt im Rems-Murr-Kreis',
    workshopCount: 'über 40',
    carOwners: 'ca. 22.000',
    metaTitle: 'Werkstatt registrieren Backnang | Bereifung24 - Online Kunden',
    metaDescription: 'KFZ-Werkstatt in Backnang? Werde Partner bei Bereifung24. Rems-Murr-Kreis mit starkem Pendlerverkehr. Online-Buchungen und eigene Werkstatt-Website.',
    h1: 'Werkstatt registrieren in Backnang',
    introText: 'Backnang im Rems-Murr-Kreis ist Zentrum eines großen ländlichen Einzugsgebiets. Mit über 22.000 Autofahrern und starkem Pendlerverkehr Richtung Stuttgart bietet Backnang ideale Bedingungen für digitalen Reifenservice.',
    localFacts: [
      'Über 22.000 zugelassene Fahrzeuge in Backnang',
      'Zentrum des oberen Murrtals mit großem Einzugsgebiet',
      'Starker Pendlerverkehr nach Stuttgart über B14',
      'Ländliche Region mit hoher PKW-Abhängigkeit'
    ]
  },
  {
    slug: 'winnenden',
    name: 'Winnenden',
    region: 'Rems-Murr-Kreis',
    population: 29000,
    postalCodes: ['71364'],
    description: 'Stadt im Rems-Murr-Kreis',
    workshopCount: 'über 30',
    carOwners: 'ca. 17.000',
    metaTitle: 'Werkstatt registrieren Winnenden | Bereifung24 - Kostenlos',
    metaDescription: 'KFZ-Werkstatt in Winnenden? Registriere dich kostenlos auf Bereifung24. Online-Buchungssystem, eigene Werkstatt-Website. Rems-Murr-Kreis digital.',
    h1: 'Werkstatt registrieren in Winnenden',
    introText: 'Winnenden im Rems-Murr-Kreis mit Unternehmen wie Kärcher in der Nähe hat eine starke wirtschaftliche Basis. Über 17.000 Autofahrer und das wachsende Umland bieten gutes Potenzial für Werkstätten.',
    localFacts: [
      'Über 17.000 zugelassene Fahrzeuge in Winnenden',
      'Kärcher-Hauptsitz in der Nachbargemeinde Winnenden',
      'Wachsende Stadt im Stuttgarter Speckgürtel',
      'Gute Anbindung über B14 und S-Bahn'
    ]
  },
  {
    slug: 'muehlacker',
    name: 'Mühlacker',
    region: 'Enzkreis',
    population: 26000,
    postalCodes: ['75417'],
    description: 'Senderstadt im Enzkreis',
    workshopCount: 'über 25',
    carOwners: 'ca. 15.000',
    metaTitle: 'Werkstatt registrieren Mühlacker | Bereifung24 - Enzkreis',
    metaDescription: 'KFZ-Werkstatt in Mühlacker? Werde Partner bei Bereifung24. Online-Buchungen, eigene Werkstatt-Website. Enzkreis mit starkem Pendlerverkehr.',
    h1: 'Werkstatt registrieren in Mühlacker',
    introText: 'Mühlacker als größte Stadt im Enzkreis liegt an der Bahnstrecke Stuttgart–Karlsruhe. Mit über 15.000 Autofahrern und einem breiten Einzugsgebiet Richtung Pforzheim bietet Mühlacker gutes Werkstatt-Potenzial.',
    localFacts: [
      'Über 15.000 zugelassene Fahrzeuge in Mühlacker',
      'Größte Stadt im Enzkreis',
      'Gute Anbindung zwischen Stuttgart und Karlsruhe',
      'Ländliches Einzugsgebiet mit hoher PKW-Dichte'
    ]
  },
  {
    slug: 'ditzingen',
    name: 'Ditzingen',
    region: 'Region Stuttgart / Landkreis Ludwigsburg',
    population: 25000,
    postalCodes: ['71254'],
    description: 'Trumpf-Standort bei Stuttgart',
    workshopCount: 'über 25',
    carOwners: 'ca. 15.000',
    metaTitle: 'Werkstatt registrieren Ditzingen | Bereifung24 - Jetzt digital',
    metaDescription: 'KFZ-Werkstatt in Ditzingen? Registriere dich kostenlos auf Bereifung24. Trumpf-Standort mit 15.000 Autofahrern. Online-Buchungssystem inklusive.',
    h1: 'Werkstatt registrieren in Ditzingen',
    introText: 'Ditzingen im Landkreis Ludwigsburg ist Hauptsitz des Technologiekonzerns Trumpf und liegt direkt an der A81. Mit über 15.000 Autofahrern und einer hohen Firmenwagen-Quote bietet Ditzingen attraktives Werkstatt-Potenzial.',
    localFacts: [
      'Über 15.000 zugelassene Fahrzeuge in Ditzingen',
      'Trumpf-Hauptsitz – High-Tech-Standort',
      'Direkt an der A81 gelegen',
      'Hoher Anteil an Premium- und Firmenwagen'
    ]
  },
  {
    slug: 'kirchheim-unter-teck',
    name: 'Kirchheim unter Teck',
    region: 'Region Stuttgart / Landkreis Esslingen',
    population: 41000,
    postalCodes: ['73230'],
    description: 'Große Kreisstadt am Fuß der Schwäbischen Alb',
    workshopCount: 'über 45',
    carOwners: 'ca. 24.000',
    metaTitle: 'Werkstatt registrieren Kirchheim unter Teck | Bereifung24',
    metaDescription: 'KFZ-Werkstatt in Kirchheim unter Teck? Werde Partner bei Bereifung24. Große Kreisstadt mit 24.000 Autofahrern. Kostenlos und ohne Vertrag.',
    h1: 'Werkstatt registrieren in Kirchheim unter Teck',
    introText: 'Kirchheim unter Teck liegt am Fuß der Schwäbischen Alb und ist Zentrum des südlichen Landkreises Esslingen. Mit über 24.000 Autofahrern und starkem Winterreifen-Bedarf durch die Alb-Nähe bietet Kirchheim ideale Bedingungen für Werkstätten.',
    localFacts: [
      'Über 24.000 zugelassene Fahrzeuge in Kirchheim unter Teck',
      'Große Kreisstadt am Fuß der Schwäbischen Alb',
      'Winterreifen-Hotspot durch Alb-Anbindung',
      'Starker Pendlerverkehr nach Stuttgart und Esslingen'
    ]
  },
  {
    slug: 'nuertingen',
    name: 'Nürtingen',
    region: 'Region Stuttgart / Landkreis Esslingen',
    population: 41000,
    postalCodes: ['72622'],
    description: 'Große Kreisstadt am Neckar',
    workshopCount: 'über 45',
    carOwners: 'ca. 24.000',
    metaTitle: 'Werkstatt registrieren Nürtingen | Bereifung24 - Neckartal',
    metaDescription: 'KFZ-Werkstatt in Nürtingen? Registriere dich kostenlos auf Bereifung24. Große Kreisstadt mit 24.000 Autofahrern. Online-Buchungen und eigene Website.',
    h1: 'Werkstatt registrieren in Nürtingen',
    introText: 'Nürtingen am Neckar ist die größte Stadt im südlichen Landkreis Esslingen. Mit über 24.000 Autofahrern und einem breiten Einzugsgebiet bis zur Schwäbischen Alb bietet Nürtingen starkes Werkstatt-Potenzial.',
    localFacts: [
      'Über 24.000 zugelassene Fahrzeuge in Nürtingen',
      'Größte Stadt im südlichen Landkreis Esslingen',
      'Starker Pendlerverkehr nach Stuttgart über B27/B313',
      'Hochschulstadt mit wachsender Bevölkerung'
    ]
  }
]

// Get all city slugs for generateStaticParams
export function getAllCitySlugs(): string[] {
  return BW_CITIES.map(city => city.slug)
}

// Get city data by slug
export function getCityBySlug(slug: string): CityData | undefined {
  return BW_CITIES.find(city => city.slug === slug)
}
