import { createEvent, EventAttributes } from 'ics'
import { format, addMinutes, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export interface CalendarEventData {
  bookingId: string
  serviceName: string
  serviceDescription?: string
  workshopName: string
  workshopAddress: string
  workshopPhone?: string
  workshopEmail?: string
  date: Date
  time: string // Format: "HH:MM"
  durationMinutes: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerNotes?: string
}

/**
 * Generate ICS calendar file for booking appointment
 * Returns ICS file content as string or null on error
 */
export function generateICSFile(data: CalendarEventData): string | null {
  try {
    // Parse time string (e.g., "14:30")
    const [hours, minutes] = data.time.split(':').map(Number)
    
    // Create start date
    const startDate = new Date(data.date)
    startDate.setHours(hours, minutes, 0, 0)
    
    // Calculate end date
    const endDate = addMinutes(startDate, data.durationMinutes)
    
    // Build description
    let description = `Buchungsnummer: #${data.bookingId.substring(0, 8).toUpperCase()}\\n\\n`
    description += `Service: ${data.serviceName}\\n`
    description += `Werkstatt: ${data.workshopName}\\n`
    description += `Adresse: ${data.workshopAddress}\\n`
    
    if (data.workshopPhone) {
      description += `Telefon: ${data.workshopPhone}\\n`
    }
    
    if (data.serviceDescription) {
      description += `\\n${data.serviceDescription}\\n`
    }
    
    if (data.customerNotes) {
      description += `\\nIhre Nachricht: ${data.customerNotes}\\n`
    }
    
    description += `\\n---\\nGebucht über Bereifung24.de`
    
    // Create event
    const event: EventAttributes = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1, // JS months are 0-indexed
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes()
      ],
      end: [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes()
      ],
      title: `${data.serviceName} - ${data.workshopName}`,
      description: description,
      location: `${data.workshopName}, ${data.workshopAddress}`,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { 
        name: data.workshopName, 
        email: data.workshopEmail || 'noreply@bereifung24.de' 
      },
      attendees: [
        { 
          name: data.customerName, 
          email: data.customerEmail, 
          rsvp: true, 
          partstat: 'ACCEPTED',
          role: 'REQ-PARTICIPANT' 
        }
      ],
      // Reminders
      alarms: [
        { 
          action: 'display', 
          trigger: { hours: 24, before: true }, 
          description: `Erinnerung: ${data.serviceName} morgen um ${data.time} Uhr` 
        },
        { 
          action: 'display', 
          trigger: { hours: 1, before: true }, 
          description: `Termin in 1 Stunde: ${data.serviceName} bei ${data.workshopName}` 
        }
      ]
    }
    
    const { error, value } = createEvent(event)
    
    if (error) {
      console.error('❌ ICS generation error:', error)
      return null
    }
    
    return value || null
  } catch (error) {
    console.error('❌ Error generating ICS file:', error)
    return null
  }
}

/**
 * Helper function to format service type to German
 */
export function getServiceLabel(serviceType: string): string {
  const labels: Record<string, string> = {
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_CHANGE': 'Reifenwechsel',
    'TIRE_MOUNT': 'Reifenmontage',
    'TIRE_STORAGE': 'Reifeneinlagerung',
    'WHEEL_ALIGNMENT': 'Achsvermessung',
    'TIRE_REPAIR': 'Reifenreparatur'
  }
  
  return labels[serviceType] || serviceType
}
