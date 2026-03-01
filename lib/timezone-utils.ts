/**
 * Timezone Utilities for Europe/Berlin
 * 
 * Handles DST (Daylight Saving Time) calculations and conversions
 * between Berlin local time and UTC for accurate appointment scheduling.
 */

/**
 * Calculate if a date is in DST (Daylight Saving Time) for Europe/Berlin
 * 
 * DST Rules:
 * - Starts: Last Sunday of March at 02:00 (becomes 03:00)
 * - Ends: Last Sunday of October at 03:00 (becomes 02:00)
 * 
 * @param date The date to check (can be Date object or components)
 * @returns true if date is in DST period, false otherwise
 */
export function isDSTInBerlin(date: Date): boolean
export function isDSTInBerlin(year: number, month: number, day: number): boolean
export function isDSTInBerlin(dateOrYear: Date | number, month?: number, day?: number): boolean {
  let year: number, monthNum: number, dayNum: number
  
  if (dateOrYear instanceof Date) {
    year = dateOrYear.getFullYear()
    monthNum = dateOrYear.getMonth() + 1 // 1-12
    dayNum = dateOrYear.getDate()
  } else {
    year = dateOrYear
    monthNum = month!
    dayNum = day!
  }
  
  // Helper: Get the last Sunday of a month
  const getLastSunday = (y: number, m: number): number => {
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const lastDate = new Date(Date.UTC(y, m - 1, lastDay))
    const dayOfWeek = lastDate.getUTCDay()
    return lastDay - dayOfWeek
  }
  
  const lastSundayMarch = getLastSunday(year, 3) // March
  const lastSundayOctober = getLastSunday(year, 10) // October
  
  // Check if date is in DST period
  if (monthNum > 3 && monthNum < 10) {
    // April to September: always DST
    return true
  } else if (monthNum === 3) {
    // March: DST starts on last Sunday at 02:00
    // If day >= last Sunday, we're in DST
    return dayNum >= lastSundayMarch
  } else if (monthNum === 10) {
    // October: DST ends on last Sunday at 03:00
    // If day < last Sunday, still in DST
    return dayNum < lastSundayOctober
  }
  
  // November to February: no DST
  return false
}

/**
 * Get Berlin timezone offset for a specific date
 * 
 * @param date The date to check
 * @returns UTC offset in hours (1 for winter, 2 for summer)
 */
export function getBerlinOffset(date: Date): number {
  return isDSTInBerlin(date) ? 2 : 1
}

/**
 * Create a Date object from Berlin local time components
 * 
 * Converts Berlin local date/time to UTC Date object accounting for DST.
 * Example: 2026-03-20 12:00 Berlin (UTC+1) → 2026-03-20T11:00:00.000Z
 * 
 * @param year Year (e.g., 2026)
 * @param month Month 1-12 (e.g., 3 for March)
 * @param day Day of month (e.g., 20)
 * @param hour Hour 0-23 (e.g., 12)
 * @param minute Minute 0-59 (e.g., 0)
 * @returns Date object in UTC
 */
export function createBerlinDate(
  year: number, 
  month: number, 
  day: number, 
  hour: number = 0, 
  minute: number = 0
): Date {
  const isDST = isDSTInBerlin(year, month, day)
  const offset = isDST ? '+02:00' : '+01:00'
  
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${offset}`
  
  return new Date(isoString)
}

/**
 * Format a Date object to Berlin local time string
 * 
 * @param date Date object (in UTC)
 * @returns Time string in HH:MM format (Berlin local time)
 */
export function toBerlinTimeString(date: Date): string {
  const offset = getBerlinOffset(date)
  const berlinTime = new Date(date.getTime() + offset * 60 * 60 * 1000)
  
  const hours = berlinTime.getUTCHours().toString().padStart(2, '0')
  const minutes = berlinTime.getUTCMinutes().toString().padStart(2, '0')
  
  return `${hours}:${minutes}`
}

/**
 * Parse date string (YYYY-MM-DD) to UTC midnight
 * 
 * Used for storing dates in DB without timezone conversion.
 * User selects "2026-03-20" → Store as "2026-03-20T00:00:00.000Z"
 * 
 * @param dateString Date in YYYY-MM-DD format
 * @returns Date object at UTC midnight
 */
export function parseDateUTCMidnight(dateString: string): Date {
  return new Date(`${dateString}T00:00:00Z`)
}
