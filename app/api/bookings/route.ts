import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, bookingConfirmationCustomerEmailTemplate, bookingConfirmationWorkshopEmailTemplate } from '@/lib/email'
import { getBusySlots, generateAvailableSlots } from '@/lib/google-calendar'

// GET /api/bookings - Get all bookings for current customer
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Get customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    // Get all bookings with related data
    const bookings = await prisma.booking.findMany({
      where: { customerId: customer.id },
      include: {
        workshop: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                street: true,
                zipCode: true,
                city: true,
              }
            }
          }
        },
        tireRequest: {
          select: {
            season: true,
            width: true,
            aspectRatio: true,
            diameter: true,
            quantity: true,
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      }
    })

    // Format response
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      appointmentDate: booking.appointmentDate.toISOString(),
      appointmentTime: booking.appointmentTime,
      estimatedDuration: booking.estimatedDuration,
      status: booking.status,
      workshop: {
        companyName: booking.workshop.companyName,
        street: booking.workshop.user.street || '',
        zipCode: booking.workshop.user.zipCode || '',
        city: booking.workshop.user.city || '',
        phone: booking.workshop.user.phone || '',
      },
      tireRequest: {
        season: booking.tireRequest.season,
        width: booking.tireRequest.width,
        aspectRatio: booking.tireRequest.aspectRatio,
        diameter: booking.tireRequest.diameter,
        quantity: booking.tireRequest.quantity,
      },
      review: booking.review ? {
        id: booking.review.id,
        rating: booking.review.rating,
        comment: booking.review.comment,
      } : null
    }))

    return NextResponse.json(formattedBookings)
  } catch (error) {
    console.error('Bookings GET error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Termine' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create a new booking
export async function POST(req: NextRequest) {
  try {
    console.log('=== BOOKING POST REQUEST START ===')
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? `User ID: ${session.user?.id}` : 'No session')
    
    if (!session?.user?.id) {
      console.log('ERROR: Not authenticated')
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    })
    console.log('Customer:', customer ? `ID: ${customer.id}` : 'Not found')

    if (!customer) {
      console.log('ERROR: Customer not found')
      return NextResponse.json(
        { error: 'Kunde nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const {
      offerId,
      workshopId,
      appointmentDate,
      appointmentEndTime,
      paymentMethod,
      customerMessage,
      selectedTireOptionId,
    } = body

    // Validate required fields
    if (!offerId || !workshopId || !appointmentDate) {
      console.log('ERROR: Missing required fields', { offerId, workshopId, appointmentDate })
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }
    console.log('Required fields validated')

    // Get offer and verify it's accepted
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        tireRequest: true,
        tireOptions: true
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    if (offer.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Angebot wurde nicht angenommen' },
        { status: 400 }
      )
    }

    if (offer.tireRequest.customerId !== customer.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    // Check if booking already exists for this offer
    const existingBooking = await prisma.booking.findFirst({
      where: {
        tireRequestId: offer.tireRequestId
      }
    })

    // If a PENDING booking exists, update it instead of creating a new one
    if (existingBooking && existingBooking.status === 'PENDING') {
      console.log(`Updating existing PENDING booking ${existingBooking.id} for request ${offer.tireRequestId}`)
      
      // Calculate duration
      let estimatedDuration = 60
      if (appointmentEndTime) {
        const start = new Date(appointmentDate)
        const end = new Date(appointmentEndTime)
        estimatedDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
      }
      
      const updatedBooking = await prisma.booking.update({
        where: { id: existingBooking.id },
        data: {
          appointmentDate: new Date(appointmentDate),
          appointmentTime,
          estimatedDuration,
          selectedTireOptionId,
          customerNotes
        },
        include: {
          workshop: true,
          customer: {
            include: {
              user: true
            }
          },
          tireRequest: true,
          offer: true
        }
      })
      
      return NextResponse.json(updatedBooking, { status: 200 })
    }
    
    // If CONFIRMED or COMPLETED booking exists, don't allow overwriting
    if (existingBooking) {
      return NextResponse.json(
        { error: 'Für diese Anfrage existiert bereits eine bestätigte Buchung' },
        { status: 400 }
      )
    }

    // Calculate duration (default 60 minutes)
    let estimatedDuration = 60
    if (appointmentEndTime) {
      const start = new Date(appointmentDate)
      const end = new Date(appointmentEndTime)
      estimatedDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    }

    // Fetch complete offer with all relations for emails
    const completeOffer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        tireRequest: {
          include: {
            customer: {
              include: {
                user: true
              }
            },
            vehicle: true // Include vehicle information
          }
        },
        workshop: {
          select: {
            id: true,
            companyName: true,
            emailNotifyBookings: true, // Include notification preference
            googleAccessToken: true,
            googleRefreshToken: true,
            googleCalendarId: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                street: true,
                zipCode: true,
                city: true
              }
            }
          }
        },
        tireOptions: true
      }
    })

    if (!completeOffer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Determine selected tire option
    let selectedTireOption = null
    if (selectedTireOptionId && offer.tireOptions) {
      selectedTireOption = offer.tireOptions.find(opt => opt.id === selectedTireOptionId)
    }
    // Fallback to first option if not specified
    if (!selectedTireOption && offer.tireOptions && offer.tireOptions.length > 0) {
      selectedTireOption = offer.tireOptions[0]
    }

    // ====== RACE CONDITION PREVENTION ======
    // Re-check slot availability right before booking to prevent double-booking
    console.log('🔒 Checking slot availability before booking...')
    
    const appointmentDateObj = new Date(appointmentDate)
    const requestedTime = appointmentDateObj.toTimeString().substring(0, 5) // e.g., "14:00"
    const dateOnly = appointmentDateObj.toISOString().split('T')[0] // YYYY-MM-DD
    
    // Get workshop with calendar info
    const workshopForCheck = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: {
        id: true,
        calendarMode: true,
        openingHours: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        employees: {
          select: {
            id: true,
            name: true,
            workingHours: true,
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true,
            employeeVacations: {
              where: {
                startDate: { lte: appointmentDateObj },
                endDate: { gte: appointmentDateObj }
              }
            }
          }
        }
      }
    })

    if (!workshopForCheck) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if slot is still available
    let isSlotAvailable = false
    
    if (workshopForCheck.calendarMode === 'EMPLOYEE') {
      // Employee calendar mode - check all employee calendars
      const dayOfWeek = appointmentDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      
      const availableEmployees = workshopForCheck.employees.filter(emp => {
        if (!emp.googleCalendarId || !emp.googleRefreshToken) return false
        if (emp.employeeVacations && emp.employeeVacations.length > 0) return false
        
        if (emp.workingHours) {
          try {
            const hours = JSON.parse(emp.workingHours)
            const dayHours = hours[dayOfWeek]
            if (!dayHours || !dayHours.working) return false
          } catch (e) {
            return false
          }
        }
        return true
      })

      if (availableEmployees.length === 0) {
        return NextResponse.json(
          { 
            error: 'Keine Mitarbeiter verfügbar',
            message: 'Für diesen Zeitpunkt sind keine Mitarbeiter mit Kalender verfügbar.'
          },
          { status: 409 }
        )
      }

      // Check availability for all employees
      for (const employee of availableEmployees) {
        try {
          // Get busy slots from Google Calendar
          const calendarBusySlots = await getBusySlots(
            employee.googleAccessToken!,
            employee.googleRefreshToken!,
            employee.googleCalendarId!,
            `${dateOnly}T00:00:00`,
            `${dateOnly}T23:59:59`
          )

          // Get DB bookings for this employee
          const dbBookings = await prisma.booking.findMany({
            where: {
              workshopId: workshopId,
              appointmentDate: {
                gte: new Date(`${dateOnly}T00:00:00`),
                lte: new Date(`${dateOnly}T23:59:59`)
              },
              status: { in: ['CONFIRMED', 'COMPLETED'] }
            },
            select: {
              appointmentDate: true,
              estimatedDuration: true
            }
          })

          const dbBusySlots = dbBookings.map(booking => ({
            start: booking.appointmentDate.toISOString(),
            end: new Date(booking.appointmentDate.getTime() + booking.estimatedDuration * 60000).toISOString()
          }))

          // Combine all busy slots
          const allBusySlots = [
            ...calendarBusySlots.map(s => ({ start: s.start as string, end: s.end as string })),
            ...dbBusySlots
          ]

          // Get working hours for this employee
          const workingHours = employee.workingHours ? JSON.parse(employee.workingHours)[dayOfWeek] : null
          if (!workingHours || !workingHours.working) continue

          // Generate available slots
          const availableSlots = generateAvailableSlots(
            appointmentDateObj,
            workingHours,
            allBusySlots,
            estimatedDuration
          )

          // Check if requested time is in available slots
          if (availableSlots.includes(requestedTime)) {
            isSlotAvailable = true
            console.log(`✅ Slot ${requestedTime} is available with employee ${employee.name}`)
            break
          }
        } catch (error) {
          console.error(`Error checking employee ${employee.id}:`, error)
          continue
        }
      }
    } else {
      // Workshop calendar mode
      if (!workshopForCheck.googleCalendarId || !workshopForCheck.googleRefreshToken) {
        // No calendar connected, just check DB bookings
        const conflicts = await prisma.booking.findMany({
          where: {
            workshopId: workshopId,
            appointmentDate: appointmentDateObj,
            status: { in: ['CONFIRMED', 'COMPLETED'] }
          }
        })
        
        isSlotAvailable = conflicts.length === 0
      } else {
        // Check Google Calendar + DB
        const calendarBusySlots = await getBusySlots(
          workshopForCheck.googleAccessToken!,
          workshopForCheck.googleRefreshToken!,
          workshopForCheck.googleCalendarId,
          `${dateOnly}T00:00:00`,
          `${dateOnly}T23:59:59`
        )

        const dbBookings = await prisma.booking.findMany({
          where: {
            workshopId: workshopId,
            appointmentDate: {
              gte: new Date(`${dateOnly}T00:00:00`),
              lte: new Date(`${dateOnly}T23:59:59`)
            },
            status: { in: ['CONFIRMED', 'COMPLETED'] }
          },
          select: {
            appointmentDate: true,
            estimatedDuration: true
          }
        })

        const dbBusySlots = dbBookings.map(booking => ({
          start: booking.appointmentDate.toISOString(),
          end: new Date(booking.appointmentDate.getTime() + booking.estimatedDuration * 60000).toISOString()
        }))

        const allBusySlots = [
          ...calendarBusySlots.map(s => ({ start: s.start as string, end: s.end as string })),
          ...dbBusySlots
        ]

        // Get working hours
        const dayOfWeek = appointmentDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        const workingHours = workshopForCheck.openingHours ? JSON.parse(workshopForCheck.openingHours)[dayOfWeek] : null
        
        if (!workingHours || !workingHours.working) {
          return NextResponse.json(
            { 
              error: 'Werkstatt geschlossen',
              message: 'Die Werkstatt ist an diesem Tag geschlossen.'
            },
            { status: 409 }
          )
        }

        const availableSlots = generateAvailableSlots(
          appointmentDateObj,
          workingHours,
          allBusySlots,
          estimatedDuration
        )

        isSlotAvailable = availableSlots.includes(requestedTime)
      }
    }

    // If slot is not available, return conflict error
    if (!isSlotAvailable) {
      console.log(`❌ Slot ${requestedTime} is no longer available - booking prevented!`)
      return NextResponse.json(
        { 
          error: 'Termin nicht mehr verfügbar',
          message: 'Der gewählte Termin wurde in der Zwischenzeit von einem anderen Kunden gebucht. Bitte wählen Sie einen anderen Zeitpunkt.',
          code: 'SLOT_NO_LONGER_AVAILABLE'
        },
        { status: 409 } // 409 Conflict
      )
    }

    console.log(`✅ Slot ${requestedTime} is still available - proceeding with booking`)
    // ====== END RACE CONDITION PREVENTION ======

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        workshopId: workshopId,
        offerId: offerId,
        tireRequestId: offer.tireRequestId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime: new Date(appointmentDate).toTimeString().substring(0, 5),
        estimatedDuration: estimatedDuration,
        status: 'CONFIRMED',
        paymentMethod: paymentMethod || 'PAY_ONSITE',
        customerNotes: customerMessage,
        selectedTireOptionId: selectedTireOption?.id,
      },
      include: {
        workshop: {
          include: {
            user: true
          }
        },
        tireRequest: true
      }
    })

    // Update tire request status
    await prisma.tireRequest.update({
      where: { id: offer.tireRequestId },
      data: { status: 'BOOKED' }
    })

    // Prepare data for emails
    const tireSize = `${completeOffer.tireRequest.width}/${completeOffer.tireRequest.aspectRatio} R${completeOffer.tireRequest.diameter}`
    const appointmentDateFormatted = new Date(appointmentDate).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const appointmentTimeFormatted = new Date(appointmentDate).toTimeString().substring(0, 5)

    // Send confirmation email to customer
    try {
      const customerEmailData = bookingConfirmationCustomerEmailTemplate({
        customerName: `${completeOffer.tireRequest.customer.user.firstName} ${completeOffer.tireRequest.customer.user.lastName}`,
        workshopName: completeOffer.workshop.companyName,
        workshopAddress: `${completeOffer.workshop.user.street}, ${completeOffer.workshop.user.zipCode} ${completeOffer.workshop.user.city}`,
        workshopPhone: completeOffer.workshop.user.phone || 'Nicht angegeben',
        workshopEmail: completeOffer.workshop.user.email,
        appointmentDate: appointmentDateFormatted,
        appointmentTime: appointmentTimeFormatted,
        tireBrand: completeOffer.tireBrand,
        tireModel: completeOffer.tireModel,
        tireSize: tireSize,
        totalPrice: completeOffer.price,
        paymentMethod: paymentMethod || 'PAY_ONSITE',
        bookingId: booking.id,
        customerNotes: customerMessage
      })

      await sendEmail({
        to: completeOffer.tireRequest.customer.user.email,
        subject: customerEmailData.subject,
        html: customerEmailData.html
      })
    } catch (emailError) {
      console.error('Failed to send customer confirmation email:', emailError)
      // Continue even if email fails
    }

    // Send notification email to workshop
    try {
      // Prüfe ob Werkstatt Benachrichtigungen für neue Buchungen aktiviert hat
      if (completeOffer.workshop.emailNotifyBookings) {
        // Use selected tire option or fallback to main offer data
        const tireBrand = selectedTireOption?.brand || completeOffer.tireBrand
        const tireModel = selectedTireOption?.model || completeOffer.tireModel
        
        const workshopEmailData = bookingConfirmationWorkshopEmailTemplate({
          workshopName: completeOffer.workshop.companyName,
          customerName: `${completeOffer.tireRequest.customer.user.firstName} ${completeOffer.tireRequest.customer.user.lastName}`,
          customerPhone: completeOffer.tireRequest.customer.user.phone || 'Nicht angegeben',
          customerEmail: completeOffer.tireRequest.customer.user.email,
          customerAddress: `${completeOffer.tireRequest.customer.user.street || ''}, ${completeOffer.tireRequest.customer.user.zipCode || ''} ${completeOffer.tireRequest.customer.user.city || ''}`,
          appointmentDate: appointmentDateFormatted,
          appointmentTime: appointmentTimeFormatted,
          tireBrand: tireBrand,
          tireModel: tireModel,
          tireSize: tireSize,
          quantity: completeOffer.tireRequest.quantity,
          totalPrice: completeOffer.price,
          paymentMethod: paymentMethod || 'PAY_ONSITE',
          bookingId: booking.id,
          customerNotes: customerMessage
        })

        await sendEmail({
          to: completeOffer.workshop.user.email,
          subject: workshopEmailData.subject,
          html: workshopEmailData.html
        })
        console.log(`📧 Booking confirmation email sent to workshop: ${completeOffer.workshop.user.email}`)
      } else {
        console.log(`⏭️  Workshop ${completeOffer.workshopId} has disabled booking notifications`)
      }
    } catch (emailError) {
      console.error('Failed to send workshop notification email:', emailError)
      // Continue even if email fails
    }

    // Create Google Calendar event - INTELLIGENT FALLBACK: Workshop first, then employees
    let calendarEventId = null
    const appointmentStart = new Date(appointmentDate)
    const appointmentEnd = new Date(appointmentStart.getTime() + estimatedDuration * 60000)
    const tireBrand = selectedTireOption?.brand || completeOffer.tireBrand
    const tireModel = selectedTireOption?.model || completeOffer.tireModel
    
    // Build customer address with city (not email)
    const customerStreet = completeOffer.tireRequest.customer.user.street || ''
    const customerZip = completeOffer.tireRequest.customer.user.zipCode || ''
    const customerCity = completeOffer.tireRequest.customer.user.city || ''
    // Format: "Street, PLZ City" (no comma between PLZ and city)
    const addressParts = []
    if (customerStreet) addressParts.push(customerStreet)
    const zipCity = [customerZip, customerCity].filter(Boolean).join(' ')
    if (zipCity) addressParts.push(zipCity)
    const customerAddress = addressParts.join(', ')
    
    // Build vehicle info if available
    let vehicleInfo = ''
    if (completeOffer.tireRequest.vehicle) {
      const v = completeOffer.tireRequest.vehicle
      vehicleInfo = `\nFahrzeug: ${v.make} ${v.model}${v.year ? ` (${v.year})` : ''}${v.licensePlate ? ` - ${v.licensePlate}` : ''}`
    }
    
    const eventDetails = {
      summary: `Reifenwechsel - ${completeOffer.tireRequest.customer.user.firstName} ${completeOffer.tireRequest.customer.user.lastName}`,
      description: `Reifenwechsel mit ${tireBrand} ${tireModel}\n\nKunde: ${completeOffer.tireRequest.customer.user.firstName} ${completeOffer.tireRequest.customer.user.lastName}\nAdresse: ${customerAddress}\nTelefon: ${completeOffer.tireRequest.customer.user.phone || 'Nicht angegeben'}\nEmail: ${completeOffer.tireRequest.customer.user.email}${vehicleInfo}\n\nReifen: ${tireSize}\nMenge: ${completeOffer.tireRequest.quantity}\nGesamtpreis: ${completeOffer.price.toFixed(2)} €\n\n${customerMessage ? `Hinweise vom Kunden:\n${customerMessage}` : ''}`,
      start: appointmentStart.toISOString(),
      end: appointmentEnd.toISOString(),
      attendees: [{ email: completeOffer.tireRequest.customer.user.email }]
    }
    
    const workshopHasCalendar = !!(
      completeOffer.workshop.googleAccessToken && 
      completeOffer.workshop.googleRefreshToken && 
      completeOffer.workshop.googleCalendarId
    )
    
    if (workshopHasCalendar) {
      // Priority 1: Use workshop calendar
      console.log('Creating event in workshop calendar')
      try {
        const { createCalendarEvent } = await import('@/lib/google-calendar')
        const calendarEvent = await createCalendarEvent(
          completeOffer.workshop.googleAccessToken!,
          completeOffer.workshop.googleRefreshToken!,
          completeOffer.workshop.googleCalendarId!,
          eventDetails
        )
        
        calendarEventId = calendarEvent.id || null
        
        if (calendarEventId) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: calendarEventId }
          })
          console.log('✓ Event created in workshop calendar:', calendarEventId)
        }
      } catch (calendarError) {
        console.error('Failed to create workshop calendar event:', calendarError)
      }
    } else {
      // Priority 2: Use employee calendar (find first available employee with calendar on that day)
      console.log('Workshop calendar not connected, trying employee calendars...')
      try {
        const employees = await prisma.employee.findMany({
          where: {
            workshopId: workshopId,
            googleAccessToken: { not: null },
            googleRefreshToken: { not: null },
            googleCalendarId: { not: null }
          }
        })
        
        const dayOfWeek = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        
        // Find first employee working on this day
        for (const employee of employees) {
          if (!employee.workingHours) continue
          
          try {
            const hours = JSON.parse(employee.workingHours)
            const dayHours = hours[dayOfWeek]
            
            if (dayHours && dayHours.working && employee.googleAccessToken && employee.googleRefreshToken && employee.googleCalendarId) {
              const { createCalendarEvent } = await import('@/lib/google-calendar')
              const calendarEvent = await createCalendarEvent(
                employee.googleAccessToken,
                employee.googleRefreshToken,
                employee.googleCalendarId,
                eventDetails
              )
              
              calendarEventId = calendarEvent.id || null
              
              if (calendarEventId) {
                await prisma.booking.update({
                  where: { id: booking.id },
                  data: { 
                    googleEventId: calendarEventId,
                    employeeId: employee.id // Link booking to employee
                  }
                })
                console.log(`✓ Event created in employee calendar (${employee.name}):`, calendarEventId)
                break // Stop after first successful calendar event creation
              }
            }
          } catch (empError) {
            console.error(`Failed to create event for employee ${employee.id}:`, empError)
            continue
          }
        }
        
        if (!calendarEventId) {
          console.log('⚠ No employee calendar available, booking saved without calendar sync')
        }
      } catch (employeeError) {
        console.error('Failed to create employee calendar event:', employeeError)
      }
    }

    return NextResponse.json({
      message: 'Buchung erfolgreich erstellt',
      booking: {
        id: booking.id,
        appointmentDate: booking.appointmentDate.toISOString(),
        appointmentTime: booking.appointmentTime,
        status: booking.status,
        googleEventId: calendarEventId
      }
    })

  } catch (error) {
    console.error('=== BOOKING CREATION ERROR ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Buchung', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
