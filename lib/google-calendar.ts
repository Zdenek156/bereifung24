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
    `${process.env.NEXTAUTH_URL}/api/calendar/callback`
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
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
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
    return busySlots
  } catch (error) {
    console.error('Error getting busy slots:', error)
    throw error
  }
}

/**
 * Generate available time slots based on working hours and busy times
 */
export function generateAvailableSlots(
  date: Date,
  workingHours: { from: string, to: string, working: boolean },
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
  
  // Create start and end datetime
  const startTime = new Date(date)
  startTime.setHours(fromHour, fromMinute, 0, 0)
  
  const endTime = new Date(date)
  endTime.setHours(toHour, toMinute, 0, 0)
  
  // Generate slots
  let currentTime = new Date(startTime)
  
  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime)
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)
    
    // Check if slot is free (not overlapping with busy times)
    const isFree = !busySlots.some(busy => {
      const busyStart = new Date(busy.start)
      const busyEnd = new Date(busy.end)
      
      return (
        (currentTime >= busyStart && currentTime < busyEnd) ||
        (slotEnd > busyStart && slotEnd <= busyEnd) ||
        (currentTime <= busyStart && slotEnd >= busyEnd)
      )
    })
    
    if (isFree && slotEnd <= endTime) {
      // Format time as HH:MM
      const hours = currentTime.getHours().toString().padStart(2, '0')
      const minutes = currentTime.getMinutes().toString().padStart(2, '0')
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
