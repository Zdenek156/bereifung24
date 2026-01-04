import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fahrten & Fahrzeuge abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.b24EmployeeId

    // Alle Firmenfahrzeuge
    const vehicles = await prisma.companyVehicle.findMany({
      where: { isActive: true },
      include: {
        assignedTo: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { licensePlate: 'asc' }
    })

    // Fahrten des Mitarbeiters (letzte 30 Tage)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const trips = await prisma.tripEntry.findMany({
      where: {
        employeeId,
        date: { gte: thirtyDaysAgo }
      },
      include: {
        vehicle: {
          select: {
            licensePlate: true,
            make: true,
            model: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Monatsstatistik
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthTrips = await prisma.tripEntry.findMany({
      where: {
        employeeId,
        date: { gte: currentMonth }
      }
    })

    const monthKm = monthTrips.reduce((sum, t) => sum + t.distanceKm, 0)
    const businessKm = monthTrips.filter(t => t.tripType === 'BUSINESS').reduce((sum, t) => sum + t.distanceKm, 0)

    return NextResponse.json({
      vehicles,
      trips,
      stats: {
        monthKm,
        businessKm,
        tripCount: monthTrips.length
      }
    })
  } catch (error) {
    console.error('Error fetching trip data:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Daten' },
      { status: 500 }
    )
  }
}

// POST - Neue Fahrt eintragen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.b24EmployeeId
    const body = await request.json()
    const { 
      vehicleId, 
      date, 
      startKm, 
      endKm, 
      startLocation, 
      endLocation, 
      purpose, 
      tripType,
      customerName,
      projectName,
      notes 
    } = body

    // Validierung
    if (!vehicleId || !date || !startKm || !endKm || !startLocation || !endLocation || !purpose) {
      return NextResponse.json(
        { error: 'Pflichtfelder fehlen' },
        { status: 400 }
      )
    }

    // Konvertiere zu Zahlen
    const startKmInt = parseInt(startKm)
    const endKmInt = parseInt(endKm)

    if (isNaN(startKmInt) || isNaN(endKmInt)) {
      return NextResponse.json(
        { error: 'KM-Werte müssen Zahlen sein' },
        { status: 400 }
      )
    }

    if (endKmInt <= startKmInt) {
      return NextResponse.json(
        { error: 'End-KM muss größer als Start-KM sein' },
        { status: 400 }
      )
    }

    const distanceKm = endKmInt - startKmInt

    // Erstelle Fahrt
    const trip = await prisma.tripEntry.create({
      data: {
        employeeId,
        vehicleId,
        date: new Date(date),
        startKm: startKmInt,
        endKm: endKmInt,
        distanceKm,
        startLocation,
        endLocation,
        purpose,
        tripType: tripType || 'BUSINESS',
        customerName,
        projectName,
        notes
      },
      include: {
        vehicle: {
          select: {
            licensePlate: true,
            make: true,
            model: true
          }
        }
      }
    })

    // Update Fahrzeug-Kilometerstand
    await prisma.companyVehicle.update({
      where: { id: vehicleId },
      data: { currentKm: endKmInt }
    })

    return NextResponse.json({
      success: true,
      trip
    })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Fahrt' },
      { status: 500 }
    )
  }
}
