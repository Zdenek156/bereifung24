import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    // Fetch all workshops with their data
    const workshops = await prisma.workshop.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            street: true,
            zipCode: true,
            city: true,
            latitude: true,
            longitude: true,
            createdAt: true,
          }
        },
        offers: {
          select: {
            id: true,
            status: true,
            price: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'COMPLETED']
            }
          },
          include: {
            offer: {
              select: {
                price: true
              }
            }
          }
        }
      }
    })

    // Calculate data for each workshop
    const workshopData = workshops.map(workshop => {
      const offersCount = workshop.offers.length
      const revenue = workshop.bookings.reduce((sum, booking) => {
        return sum + (booking.offer?.price || 0)
      }, 0)

      // Calculate distance from base point
      const baseLatitude = 51.1657
      const baseLongitude = 10.4515
      let distance = null
      
      if (workshop.user.latitude && workshop.user.longitude) {
        const R = 6371
        const dLat = (workshop.user.latitude - baseLatitude) * Math.PI / 180
        const dLon = (workshop.user.longitude - baseLongitude) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(baseLatitude * Math.PI / 180) * Math.cos(workshop.user.latitude * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance = Math.round(R * c)
      }

      return {
        id: workshop.id,
        companyName: workshop.companyName,
        email: workshop.user.email,
        firstName: workshop.user.firstName,
        lastName: workshop.user.lastName,
        phone: workshop.user.phone || '',
        street: workshop.user.street || '',
        zipCode: workshop.user.zipCode || '',
        city: workshop.user.city || '',
        distance: distance,
        offersCount,
        revenue,
        isVerified: workshop.isVerified,
        iban: workshop.iban || '',
        accountHolder: workshop.accountHolder || '',
        paypalEmail: workshop.paypalEmail || '',
        createdAt: workshop.user.createdAt,
      }
    })

    if (format === 'csv') {
      const csv = generateCSV(workshopData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="werkstaetten_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'txt') {
      const txt = generateTXT(workshopData)
      return new NextResponse(txt, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="werkstaetten_${new Date().toISOString().split('T')[0]}.txt"`
        }
      })
    } else if (format === 'json') {
      return NextResponse.json(workshopData)
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })

  } catch (error) {
    console.error('Error downloading workshops:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function generateCSV(data: any[]): string {
  const headers = ['ID', 'Firma', 'E-Mail', 'Vorname', 'Nachname', 'Telefon', 'Straße', 'PLZ', 'Stadt', 'Entfernung (km)', 'Angebote', 'Umsatz (EUR)', 'Status', 'IBAN', 'Kontoinhaber', 'PayPal', 'Registriert']
  const rows = data.map(workshop => [
    workshop.id,
    workshop.companyName,
    workshop.email,
    workshop.firstName,
    workshop.lastName,
    workshop.phone,
    workshop.street,
    workshop.zipCode,
    workshop.city,
    workshop.distance || '',
    workshop.offersCount,
    workshop.revenue.toFixed(2),
    workshop.isVerified ? 'Verifiziert' : 'Ausstehend',
    workshop.iban,
    workshop.accountHolder,
    workshop.paypalEmail,
    new Date(workshop.createdAt).toLocaleDateString('de-DE')
  ])

  return [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')
}

function generateTXT(data: any[]): string {
  let txt = 'WERKSTÄTTENVERWALTUNG - BEREIFUNG24\n'
  txt += '='.repeat(80) + '\n'
  txt += `Export vom: ${new Date().toLocaleString('de-DE')}\n`
  txt += `Anzahl Werkstätten: ${data.length}\n`
  txt += '='.repeat(80) + '\n\n'

  data.forEach((workshop, index) => {
    txt += `${index + 1}. ${workshop.companyName}\n`
    txt += `-`.repeat(80) + '\n'
    txt += `   Kontakt:     ${workshop.firstName} ${workshop.lastName}\n`
    txt += `   E-Mail:      ${workshop.email}\n`
    txt += `   Telefon:     ${workshop.phone || 'Nicht angegeben'}\n`
    txt += `   Adresse:     ${workshop.street ? workshop.street + ', ' : ''}${workshop.zipCode} ${workshop.city}\n`
    txt += `   Entfernung:  ${workshop.distance ? workshop.distance + ' km' : 'Nicht berechnet'}\n`
    txt += `   Angebote:    ${workshop.offersCount}\n`
    txt += `   Umsatz:      ${workshop.revenue.toFixed(2)} EUR\n`
    txt += `   Status:      ${workshop.isVerified ? 'Verifiziert' : 'Ausstehend'}\n`
    txt += `   IBAN:        ${workshop.iban || 'Nicht angegeben'}\n`
    txt += `   Kontoinhaber: ${workshop.accountHolder || 'Nicht angegeben'}\n`
    txt += `   PayPal:      ${workshop.paypalEmail || 'Nicht angegeben'}\n`
    txt += `   Registriert: ${new Date(workshop.createdAt).toLocaleDateString('de-DE')}\n`
    txt += '\n'
  })

  return txt
}
