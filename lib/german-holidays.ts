// German public holidays calculation per Bundesland
// Includes fixed holidays and movable holidays (Easter-based)

type Bundesland = 
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' 
  | 'HE' | 'MV' | 'NI' | 'NW' | 'RP' | 'SL' 
  | 'SN' | 'ST' | 'SH' | 'TH'

// PLZ ranges to Bundesland mapping
const PLZ_TO_BUNDESLAND: [number, number, Bundesland][] = [
  // Baden-Württemberg
  [68000, 68999, 'BW'], [69000, 69999, 'BW'], [70000, 76999, 'BW'],
  [77000, 79999, 'BW'], [88000, 89999, 'BW'], [97800, 97999, 'BW'],
  // Bayern
  [80000, 87999, 'BY'], [90000, 97799, 'BY'],
  // Berlin
  [10000, 14199, 'BE'],
  // Brandenburg
  [14400, 16999, 'BB'], [17200, 17299, 'BB'], [19300, 19399, 'BB'],
  [1900, 1999, 'BB'], [3000, 3299, 'BB'], [4890, 4899, 'BB'],
  [15000, 16999, 'BB'],
  // Bremen
  [27500, 27599, 'HB'], [28000, 28999, 'HB'],
  // Hamburg
  [20000, 21149, 'HH'], [22000, 22999, 'HH'],
  // Hessen
  [34000, 36399, 'HE'], [37100, 37299, 'HE'], [60000, 65999, 'HE'],
  [63000, 63699, 'HE'],
  // Mecklenburg-Vorpommern
  [17000, 17199, 'MV'], [17300, 19299, 'MV'], [23900, 23999, 'MV'],
  // Niedersachsen
  [21200, 21299, 'NI'], [26000, 27499, 'NI'], [27600, 27999, 'NI'],
  [29000, 31999, 'NI'], [37000, 37099, 'NI'], [37300, 37999, 'NI'],
  [38000, 38999, 'NI'], [48400, 48499, 'NI'], [49000, 49999, 'NI'],
  // Nordrhein-Westfalen
  [32000, 33999, 'NW'], [40000, 59999, 'NW'],
  // Rheinland-Pfalz
  [51500, 51599, 'RP'], [53000, 53999, 'RP'], [54000, 57999, 'RP'],
  [65500, 67999, 'RP'], [76700, 76899, 'RP'],
  // Saarland
  [66000, 66999, 'SL'],
  // Sachsen
  [1000, 1899, 'SN'], [2600, 2999, 'SN'], [4000, 4889, 'SN'],
  [7900, 7999, 'SN'], [8000, 9999, 'SN'],
  // Sachsen-Anhalt
  [6000, 6999, 'ST'], [38800, 38899, 'ST'], [39000, 39999, 'ST'],
  // Schleswig-Holstein
  [21300, 25999, 'SH'], [23000, 23899, 'SH'],
  // Thüringen
  [4900, 4999, 'TH'], [7300, 7899, 'TH'], [36400, 36999, 'TH'],
  [98000, 99999, 'TH'], [99000, 99999, 'TH'],
]

export function getBundeslandFromZip(zip: string): Bundesland | null {
  const plz = parseInt(zip, 10)
  if (isNaN(plz)) return null
  
  for (const [from, to, land] of PLZ_TO_BUNDESLAND) {
    if (plz >= from && plz <= to) return land
  }
  return null
}

// Calculate Easter Sunday using the Anonymous Gregorian algorithm
function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getPublicHolidays(year: number, bundesland: Bundesland): string[] {
  const easter = getEasterSunday(year)
  
  // Nationwide holidays (all Bundesländer)
  const holidays: string[] = [
    `${year}-01-01`, // Neujahr
    formatDate(addDays(easter, -2)),  // Karfreitag
    formatDate(addDays(easter, 1)),   // Ostermontag
    `${year}-05-01`, // Tag der Arbeit
    formatDate(addDays(easter, 39)),  // Christi Himmelfahrt
    formatDate(addDays(easter, 50)),  // Pfingstmontag
    `${year}-10-03`, // Tag der Deutschen Einheit
    `${year}-12-25`, // 1. Weihnachtstag
    `${year}-12-26`, // 2. Weihnachtstag
  ]
  
  // Heilige Drei Könige (6. Jan) — BW, BY, ST
  if (['BW', 'BY', 'ST'].includes(bundesland)) {
    holidays.push(`${year}-01-06`)
  }
  
  // Internationaler Frauentag (8. März) — BE, MV
  if (['BE', 'MV'].includes(bundesland)) {
    holidays.push(`${year}-03-08`)
  }
  
  // Fronleichnam — BW, BY, HE, NW, RP, SL
  if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(bundesland)) {
    holidays.push(formatDate(addDays(easter, 60)))
  }
  
  // Mariä Himmelfahrt (15. Aug) — BY (nur in Gemeinden mit überwiegend kath. Bevölkerung), SL
  if (['SL'].includes(bundesland)) {
    holidays.push(`${year}-08-15`)
  }
  
  // Weltkindertag (20. Sep) — TH
  if (['TH'].includes(bundesland)) {
    holidays.push(`${year}-09-20`)
  }
  
  // Reformationstag (31. Okt) — BB, HB, HH, MV, NI, SN, ST, SH, TH
  if (['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'].includes(bundesland)) {
    holidays.push(`${year}-10-31`)
  }
  
  // Allerheiligen (1. Nov) — BW, BY, NW, RP, SL
  if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(bundesland)) {
    holidays.push(`${year}-11-01`)
  }
  
  // Buß- und Bettag — SN only (Mittwoch vor dem 23. November)
  if (bundesland === 'SN') {
    const nov23 = new Date(year, 10, 23) // Nov 23
    const dayOfWeek = nov23.getDay()
    const wednesdayBefore = new Date(nov23)
    wednesdayBefore.setDate(nov23.getDate() - ((dayOfWeek + 4) % 7))
    holidays.push(formatDate(wednesdayBefore))
  }
  
  return holidays.sort()
}

export function isPublicHoliday(dateStr: string, bundesland: Bundesland): boolean {
  const year = parseInt(dateStr.substring(0, 4), 10)
  const holidays = getPublicHolidays(year, bundesland)
  return holidays.includes(dateStr)
}

export function isPublicHolidayByZip(dateStr: string, zip: string): boolean {
  const bundesland = getBundeslandFromZip(zip)
  if (!bundesland) return false
  return isPublicHoliday(dateStr, bundesland)
}
