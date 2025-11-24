// Google Calendar API Integration
// Handles OAuth, event creation, and availability checking

import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

/**
 * Get OAuth2 Client for Calendar (separate from NextAuth login)
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/gcal/callback`
  )
}

/**
 * Generate Authorization URL for OAuth flow
 */
export function getAuthUrl(state: string) {
  const oauth2Client = getOAuth2Client()
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state, // workshopId or employeeId
    prompt: 'consent' // Force to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    const oauth2Client = getOAuth2Client()
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    
    console.log('Attempting to refresh access token...')
    const { credentials } = await oauth2Client.refreshAccessToken()
    console.log('Access token refreshed successfully')
    
    return {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken, // Keep existing if not returned
      expiry_date: credentials.expiry_date
    }
  } catch (error) {
    console.error('Failed to refresh access token:', error)
    throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get authenticated calendar client
 */
export function getCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })
  
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

/**
 * Create calendar event
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  event: {
    summary: string
    description: string
    start: string // ISO datetime
    end: string // ISO datetime
    attendees?: { email: string }[]
  }
) {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken)
    
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start,
          timeZone: 'Europe/Berlin',
        },
        end: {
          dateTime: event.end,
          timeZone: 'Europe/Berlin',
        },
        attendees: event.attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      },
    })
    
    return response.data
  } catch (error) {
    console.error('Error creating calendar event:', error)
    throw error
  }
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  eventId: string,
  event: {
    summary?: string
    description?: string
    start?: string
    end?: string
    status?: 'confirmed' | 'cancelled'
  }
) {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken)
    
    const updateData: any = {}
    
    if (event.summary) updateData.summary = event.summary
    if (event.description) updateData.description = event.description
    if (event.status) updateData.status = event.status
    
    if (event.start && event.end) {
      updateData.start = {
        dateTime: event.start,
        timeZone: 'Europe/Berlin',
      }
      updateData.end = {
        dateTime: event.end,
        timeZone: 'Europe/Berlin',
      }
    }
    
    const response = await calendar.events.patch({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: updateData,
    })
    
    return response.data
  } catch (error) {
    console.error('Error updating calendar event:', error)
    throw error
  }
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  eventId: string
) {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken)
    
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    throw error
  }
}

/**
 * Get busy time slots from calendar
 */
export async function getBusySlots(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  timeMin: string, // ISO datetime
  timeMax: string // ISO datetime
) {
  try {
    console.log('🔍 getBusySlots called:', { calendarId, timeMin, timeMax })
    const calendar = getCalendarClient(accessToken, refreshToken)
    
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin,
        timeMax: timeMax,
        timeZone: 'Europe/Berlin',
        items: [{ id: calendarId }],
      },
    })
    
    const busySlots = response.data.calendars?.[calendarId]?.busy || []
    console.log('📅 Busy slots from Google Calendar:', JSON.stringify(busySlots, null, 2))
    console.log('📊 Total busy slots found:', busySlots.length)
    return busySlots
  } catch (error) {
    console.error('❌ Error getting busy slots:', error)
    throw error
  }
}

/**
 * Generate available time slots based on working hours and busy times
 */
export function generateAvailableSlots(
  date: Date,
  workingHours: { from: string, to: string, working: boolean, breakFrom?: string, breakTo?: string },
  busySlots: Array<{ start: string, end: string }>,
  slotDuration: number = 60 // minutes
): string[] {
  if (!workingHours.working) {
    return []
  }
  
  const availableSlots: string[] = []
  
  // Parse working hours
  const [fromHour, fromMinute] = workingHours.from.split(':').map(Number)
  const [toHour, toMinute] = workingHours.to.split(':').map(Number)
  
  // CRITICAL FIX: Extract timezone from busy slots and use it
  // Create start and end datetime in UTC
  // Google Calendar returns times with timezone offset like "2025-12-05T10:00:00+01:00"
  // new Date() automatically converts these to UTC when parsing
  // So we need to create our slots in UTC as well, matching the local time
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  
  // CRITICAL FIX: Working hours are in LOCAL timezone
  // Google Calendar: "10:00+01:00" = 10:00 Vienna time = 09:00 UTC
  // Working hours "10:00" = 10:00 Vienna time = 09:00 UTC
  // 
  // The problem: Date.UTC() creates times in UTC, not local time!
  // Date.UTC(2025, 11, 5, 10, 0) = "2025-12-05T10:00:00Z" (10:00 UTC)
  // But we need "2025-12-05T10:00:00+01:00" (10:00 local = 09:00 UTC)
  //
  // Solution: Extract timezone offset and adjust working hours
  let timezoneOffset = 0 // in minutes
  if (busySlots.length > 0 && busySlots[0].start) {
    const match = busySlots[0].start.match(/([+-]\d{2}):(\d{2})$/)
    if (match) {
      const hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      timezoneOffset = hours * 60 + (hours < 0 ? -minutes : minutes)
    }
  }
  
  // Create times in UTC
  const startTime = new Date(Date.UTC(year, month, day, fromHour, fromMinute, 0, 0))
  const endTime = new Date(Date.UTC(year, month, day, toHour, toMinute, 0, 0))
  
  // Convert to local timezone by subtracting offset
  // Example: 10:00 UTC - 60min = 09:00 UTC (which represents 10:00+01:00)
  startTime.setMinutes(startTime.getMinutes() - timezoneOffset)
  endTime.setMinutes(endTime.getMinutes() - timezoneOffset)
  
  // Parse break times if present
  let breakStart: Date | null = null
  let breakEnd: Date | null = null
  
  if (workingHours.breakFrom && workingHours.breakTo) {
    const [breakFromHour, breakFromMinute] = workingHours.breakFrom.split(':').map(Number)
    const [breakToHour, breakToMinute] = workingHours.breakTo.split(':').map(Number)
    
    breakStart = new Date(Date.UTC(year, month, day, breakFromHour, breakFromMinute, 0, 0))
    breakEnd = new Date(Date.UTC(year, month, day, breakToHour, breakToMinute, 0, 0))
    // Apply same timezone adjustment
    breakStart.setMinutes(breakStart.getMinutes() - timezoneOffset)
    breakEnd.setMinutes(breakEnd.getMinutes() - timezoneOffset)
  }
  
  // Generate slots
  let currentTime = new Date(startTime)
  
  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime)
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)
    
    // Check if slot is free (not overlapping with busy times)
    // Two intervals overlap if: slotStart < busyEnd AND slotEnd > busyStart
    const isFree = !busySlots.some(busy => {
      const busyStart = new Date(busy.start)
      const busyEnd = new Date(busy.end)
      
      // Convert to timestamps for reliable comparison
      const slotStartMs = currentTime.getTime()
      const slotEndMs = slotEnd.getTime()
      const busyStartMs = busyStart.getTime()
      const busyEndMs = busyEnd.getTime()
      
      // Overlap occurs if slot starts before busy ends AND slot ends after busy starts
      const overlaps = slotStartMs < busyEndMs && slotEndMs > busyStartMs
      
      return overlaps
    })
    
    // Check if slot is during break time
    const isInBreak = breakStart && breakEnd && (
      (currentTime >= breakStart && currentTime < breakEnd) ||
      (slotEnd > breakStart && slotEnd <= breakEnd) ||
      (currentTime <= breakStart && slotEnd >= breakEnd)
    )
    
    if (isFree && !isInBreak && slotEnd <= endTime) {
      // Convert back to local time for display
      // currentTime is in UTC adjusted for timezone
      // Add the offset back to show local time to user
      const localTime = new Date(currentTime)
      localTime.setMinutes(localTime.getMinutes() + timezoneOffset)
      
      const hours = localTime.getHours().toString().padStart(2, '0')
      const minutes = localTime.getMinutes().toString().padStart(2, '0')
      availableSlots.push(`${hours}:${minutes}`)
    }
    
    // Move to next slot
    currentTime.setMinutes(currentTime.getMinutes() + slotDuration)
  }
  
  return availableSlots
}

/**
 * Get primary calendar ID
 */
export async function getPrimaryCalendarId(
  accessToken: string,
  refreshToken: string
): Promise<string> {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken)
    
    const response = await calendar.calendarList.list()
    const primaryCalendar = response.data.items?.find(cal => cal.primary)
    
    return primaryCalendar?.id || 'primary'
  } catch (error) {
    console.error('Error getting primary calendar:', error)
    return 'primary'
  }
}
