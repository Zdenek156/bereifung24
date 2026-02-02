import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { calculateDistance } from '@/lib/distanceCalculator'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const {
      date,
      time,
      serviceId = null, // Service ID wenn ausgewählt
      customDuration = null, // Manuelle Dauer wenn "Manuelle Eingabe" gewählt
      customerId = null, // Customer ID wenn von Kundendetails erstellt
      vehicleId = null, // Vehicle ID wenn Fahrzeug ausgewählt
      customerName,
      customerPhone,
      customerEmail,
      serviceDescription,
      vehicleInfo,
      notes,
      price = null
    } = body

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Datum und Uhrzeit sind erforderlich' },
        { status: 400 }
      )
    }

    // Lade Service-Daten wenn serviceId vorhanden
    let selectedService = null
    let selectedPackage = null
    let duration = 60 // Standard
    let serviceName = 'Manuell erstellter Termin'
    
    if (serviceId) {
      // serviceId Format: "workshopServiceId-packageId" oder nur "packageId" (legacy)
      const parts = serviceId.split('-')
      const packageId = parts.length === 2 ? parts[1] : serviceId
      
      selectedPackage = await prisma.servicePackage.findUnique({
        where: { id: packageId },
        include: {
          workshopService: true
        }
      })
      
      if (selectedPackage) {
        duration = selectedPackage.durationMinutes
        
        // Bestimme Service-Namen basierend auf serviceType und packageType
        const serviceTypeNames: Record<string, string> = {
          'TIRE_CHANGE': 'Reifenwechsel',
          'WHEEL_CHANGE': 'Räder umstecken',
          'TIRE_REPAIR': 'Reifenreparatur',
          'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
          'ALIGNMENT_BOTH': 'Achsvermessung + Einstellung',
          'CLIMATE_SERVICE': 'Klimaservice',
          'BRAKE_SERVICE': 'Bremsen-Service',
          'BATTERY_SERVICE': 'Batterie-Service',
          'OTHER_SERVICES': 'Sonstige Reifendienste'
        }
        
        const packageTypeNames: Record<string, string> = {
          // TIRE_CHANGE
          'two_tires': '2 Reifen wechseln',
          'four_tires': '4 Reifen wechseln',
          // TIRE_REPAIR
          'foreign_object': 'Reifenpanne / Loch (Fremdkörper)',
          'valve_damage': 'Ventilschaden',
          // MOTORCYCLE_TIRE
          'front': 'Vorderrad',
          'rear': 'Hinterrad',
          'both': 'Beide Räder',
          'front_disposal': 'Vorderrad + Entsorgung',
          'rear_disposal': 'Hinterrad + Entsorgung',
          'both_disposal': 'Beide + Entsorgung',
          // ALIGNMENT_BOTH
          'measurement_front': 'Vermessung Vorderachse',
          'measurement_rear': 'Vermessung Hinterachse',
          'measurement_both': 'Vermessung beide Achsen',
          'adjustment_front': 'Einstellung Vorderachse',
          'adjustment_rear': 'Einstellung Hinterachse',
          'adjustment_both': 'Einstellung beide Achsen',
          'full_service': 'Komplett-Service',
          // CLIMATE_SERVICE
          'check': 'Klimacheck/Inspektion',
          'basic': 'Basic Service',
          'comfort': 'Comfort Service',
          'premium': 'Premium Service',
          // BRAKE_SERVICE
          'front_pads': 'Vorderachse - Bremsbeläge',
          'front_pads_discs': 'Vorderachse - Beläge + Scheiben',
          'rear_pads': 'Hinterachse - Bremsbeläge',
          'rear_pads_discs': 'Hinterachse - Beläge + Scheiben',
          'rear_pads_discs_handbrake': 'Hinterachse - Beläge + Scheiben + Handbremse',
          // BATTERY_SERVICE
          'replacement': 'Batterie-Wechsel',
          // OTHER_SERVICES
          'rdks': 'RDKS-Service',
          'valve': 'Ventil-Wechsel',
          'storage': 'Reifen-Einlagerung',
          'tpms': 'TPMS-Programmierung'
        }
        
        const serviceTypeName = serviceTypeNames[selectedPackage.workshopService.serviceType] || selectedPackage.workshopService.serviceType
        const packageTypeName = packageTypeNames[selectedPackage.packageType] || selectedPackage.packageType
        
        serviceName = `${serviceTypeName} (${packageTypeName})`
      }
    } else if (customDuration) {
      duration = customDuration
    }

    // Hole Workshop-Daten
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        employees: {
          include: {
            employeeVacations: true,
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    // Erstelle DateTime für den Termin
    const appointmentDateTime = new Date(`${date}T${time}:00`)
    
    // Prüfe ob bereits ein Termin zu dieser Zeit existiert
    const existingAppointment = await prisma.booking.findFirst({
      where: {
        workshopId: workshop.id,
        appointmentDate: appointmentDateTime,
        appointmentTime: time,
        status: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Zu dieser Zeit ist bereits ein Termin eingetragen' },
        { status: 400 }
      )
    }

    // Bestimme Wochentag
    const dayOfWeek = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // Finde verfügbare Mitarbeiter
    const availableEmployees = workshop.employees.filter(emp => {
      // workingHours ist ein JSON-String mit Objekt
      if (!emp.workingHours) return false
      const workingHours = typeof emp.workingHours === 'string' 
        ? JSON.parse(emp.workingHours) 
        : emp.workingHours
      
      // workingHours ist ein Objekt wie { monday: { from: '08:00', to: '17:00', working: true }, ... }
      const workingHour = workingHours[dayOfWeek]
      return workingHour && workingHour.working
    })

    if (availableEmployees.length === 0) {
      return NextResponse.json(
        { error: 'Keine Mitarbeiter für diesen Tag verfügbar' },
        { status: 400 }
      )
    }

    // Wähle ersten verfügbaren Mitarbeiter
    const employee = availableEmployees[0]

    // Handle customer - use existing WorkshopCustomer if provided
    let workshopCustomer = null
    let selectedVehicle = null
    
    if (customerId) {
      // Load existing workshop customer
      workshopCustomer = await prisma.workshopCustomer.findFirst({
        where: {
          id: customerId,
          workshopId: workshop.id
        }
      })
      
      if (!workshopCustomer) {
        return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
      }
      
      // Load vehicle if provided
      if (vehicleId) {
        selectedVehicle = await prisma.workshopVehicle.findFirst({
          where: {
            id: vehicleId,
            customerId: workshopCustomer.id
          }
        })
      }
    }

    // Erstelle Terminbeschreibung für Google Calendar
    let calendarDescription = 'Werkstatt-Termin\n\n'
    
    if (workshopCustomer) {
      const custName = workshopCustomer.customerType === 'BUSINESS' && workshopCustomer.companyName
        ? workshopCustomer.companyName
        : `${workshopCustomer.firstName || ''} ${workshopCustomer.lastName || ''}`.trim()
      calendarDescription += `Kunde: ${custName}\n`
      if (workshopCustomer.email) calendarDescription += `E-Mail: ${workshopCustomer.email}\n`
      if (workshopCustomer.phone || workshopCustomer.mobile) {
        calendarDescription += `Telefon: ${workshopCustomer.phone || workshopCustomer.mobile}\n`
      }
    } else if (customerName) {
      calendarDescription += `Kunde: ${customerName}\n`
      if (customerPhone) calendarDescription += `Telefon: ${customerPhone}\n`
      if (customerEmail) calendarDescription += `E-Mail: ${customerEmail}\n`
    }
    
    if (selectedVehicle) {
      calendarDescription += `\nFahrzeug: ${selectedVehicle.manufacturer} ${selectedVehicle.model}`
      if (selectedVehicle.licensePlate) calendarDescription += ` (${selectedVehicle.licensePlate})`
      if (selectedVehicle.modelYear) calendarDescription += ` - ${selectedVehicle.modelYear}`
      calendarDescription += '\n'
    } else if (vehicleInfo) {
      calendarDescription += `Fahrzeug: ${vehicleInfo}\n`
    }
    
    if (serviceDescription) calendarDescription += `\nService: ${serviceDescription}\n`
    if (notes) calendarDescription += `\nNotizen: ${notes}\n`

    // Google Calendar Event erstellen (wenn Mitarbeiter Calendar hat)
    let googleEventId = null
    if (employee.googleCalendarId && employee.googleRefreshToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXTAUTH_URL + '/api/gcal/callback'
        )

        oauth2Client.setCredentials({
          refresh_token: employee.googleRefreshToken,
          access_token: employee.googleAccessToken,
        })

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        // Berechne End-Zeit basierend auf Dauer
        const endDateTime = new Date(appointmentDateTime)
        endDateTime.setMinutes(endDateTime.getMinutes() + duration)

        const event = await calendar.events.insert({
          calendarId: employee.googleCalendarId,
          requestBody: {
            summary: workshopCustomer 
              ? (workshopCustomer.customerType === 'BUSINESS' && workshopCustomer.companyName
                  ? workshopCustomer.companyName
                  : `${workshopCustomer.firstName || ''} ${workshopCustomer.lastName || ''}`.trim())
              : (customerName || 'Werkstatt-Termin'),
            description: calendarDescription,
            start: {
              dateTime: appointmentDateTime.toISOString(),
              timeZone: 'Europe/Berlin',
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'Europe/Berlin',
            },
          },
        })

        googleEventId = event.data.id || null
        console.log('✅ Google Calendar Event created:', googleEventId)
      } catch (calError) {
        console.error('❌ Error creating Google Calendar event:', calError)
        // Fahre trotzdem fort, auch wenn Google Calendar fehlschlägt
      }
    }

    // Erstelle einen Dummy-Customer für manuelle Termine (oder verwende bestehenden)
    // Wir suchen nach einem Customer mit dieser Email oder erstellen einen temporären
    let customer
    if (customerEmail) {
      customer = await prisma.customer.findFirst({
        where: { user: { email: customerEmail } }
      })
    }
    
    // Falls kein Customer gefunden, erstelle einen System-Customer für manuelle Termine
    if (!customer) {
      const systemUser = await prisma.user.findFirst({
        where: { email: 'system@bereifung24.de' }
      })
      
      if (systemUser) {
        customer = await prisma.customer.findFirst({
          where: { userId: systemUser.id }
        })
      }
      
      // Falls kein System-User existiert, erstelle einen
      if (!customer) {
        const newSystemUser = await prisma.user.create({
          data: {
            email: 'system@bereifung24.de',
            password: 'SYSTEM_USER_NO_LOGIN',
            firstName: 'System',
            lastName: 'Manuelle Termine',
            role: 'CUSTOMER',
            isActive: false,
            emailVerified: new Date(),
            phone: '',
            street: '',
            zipCode: '',
            city: ''
          }
        })
        
        customer = await prisma.customer.create({
          data: {
            userId: newSystemUser.id
          }
        })
      }
    }

    // Erstelle eine minimale TireRequest für manuelle Termine
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: customer.id,
        status: 'ACCEPTED',
        // Pflichtfelder für TireRequest
        season: 'ALL_SEASON',
        width: 205,
        aspectRatio: 55,
        diameter: 16,
        quantity: 4,
        zipCode: workshop.user.zipCode || workshop.zipCode || '00000',
        city: workshop.user.city || workshop.city || 'N/A',
        latitude: workshop.user.latitude,
        longitude: workshop.user.longitude,
        needByDate: appointmentDateTime,
        // Optional aber hilfreich
        additionalNotes: serviceDescription || 'Manuell erstellter Termin'
      }
    })

    // Calculate distance if coordinates available
    let distanceKm: number | undefined
    if (
      tireRequest.latitude && 
      tireRequest.longitude && 
      workshop.user.latitude && 
      workshop.user.longitude
    ) {
      distanceKm = calculateDistance(
        tireRequest.latitude,
        tireRequest.longitude,
        workshop.user.latitude,
        workshop.user.longitude
      )
    }

    // Erstelle ein minimales Offer
    const offer = await prisma.offer.create({
      data: {
        tireRequestId: tireRequest.id,
        workshopId: workshop.id,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage gültig
        status: 'ACCEPTED',
        price: selectedService?.price || 0,
        tireBrand: 'N/A',
        tireModel: serviceName,
        description: serviceDescription || serviceName,
        durationMinutes: duration,
        distanceKm: distanceKm
      }
    })

    // Erstelle Booking in der Datenbank
    const booking = await prisma.booking.create({
      data: {
        tireRequestId: tireRequest.id,
        offerId: offer.id,
        customerId: customer.id,
        workshopId: workshop.id,
        appointmentDate: appointmentDateTime,
        appointmentTime: time,
        status: 'CONFIRMED',
        employeeId: employee.id,
        googleEventId: googleEventId,
        // Speichere zusätzliche Infos in customerNotes
        customerNotes: JSON.stringify({
          manualEntry: true,
          workshopCustomerId: workshopCustomer?.id || null,
          vehicleId: selectedVehicle?.id || null,
          // Speichere immer die Kundendaten für Anzeige
          customerName: workshopCustomer 
            ? (workshopCustomer.customerType === 'BUSINESS' && workshopCustomer.companyName
                ? workshopCustomer.companyName
                : `${workshopCustomer.firstName || ''} ${workshopCustomer.lastName || ''}`.trim())
            : customerName,
          customerPhone: workshopCustomer 
            ? (workshopCustomer.phone || workshopCustomer.mobile || null)
            : customerPhone,
          customerEmail: workshopCustomer 
            ? workshopCustomer.email
            : customerEmail,
          serviceDescription,
          vehicleInfo: selectedVehicle ? null : vehicleInfo,
          internalNotes: notes,
          price: price ? parseFloat(price) : null
        })
      },
      include: {
        workshop: {
          include: {
            user: true
          }
        },
        employee: true,
        tireRequest: true
      }
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        date: date,
        time: time,
        googleEventId: googleEventId
      }
    })
    
  } catch (error) {
    console.error('Error creating manual appointment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Termins' },
      { status: 500 }
    )
  }
}
