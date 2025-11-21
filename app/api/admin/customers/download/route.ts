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

    // Fetch all customers with their data
    const customers = await prisma.customer.findMany({
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
            isActive: true,
            createdAt: true,
          }
        },
        tireRequests: {
          include: {
            booking: {
              include: {
                offer: {
                  select: {
                    price: true
                  }
                }
              },
              where: {
                status: {
                  in: ['CONFIRMED', 'COMPLETED']
                }
              }
            }
          }
        }
      }
    })

    // Calculate data for each customer
    const customerData = customers.map(customer => {
      const requestCount = customer.tireRequests.length
      const totalSpent = customer.tireRequests.reduce((sum, req) => {
        const booking = req.booking
        if (booking && booking.offer) {
          return sum + booking.offer.price
        }
        return sum
      }, 0)

      // Calculate distance from base point (Dresden area)
      const baseLatitude = 51.1657
      const baseLongitude = 10.4515
      let distance = null
      
      if (customer.user.latitude && customer.user.longitude) {
        const R = 6371 // Earth's radius in km
        const dLat = (customer.user.latitude - baseLatitude) * Math.PI / 180
        const dLon = (customer.user.longitude - baseLongitude) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(baseLatitude * Math.PI / 180) * Math.cos(customer.user.latitude * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance = Math.round(R * c)
      }

      return {
        id: customer.id,
        email: customer.user.email,
        firstName: customer.user.firstName,
        lastName: customer.user.lastName,
        phone: customer.user.phone || '',
        street: customer.user.street || '',
        zipCode: customer.user.zipCode || '',
        city: customer.user.city || '',
        distance: distance,
        requestCount,
        totalSpent,
        isActive: customer.user.isActive,
        createdAt: customer.user.createdAt,
      }
    })

    if (format === 'csv') {
      const csv = generateCSV(customerData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kunden_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'txt') {
      const txt = generateTXT(customerData)
      return new NextResponse(txt, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="kunden_${new Date().toISOString().split('T')[0]}.txt"`
        }
      })
    } else if (format === 'json') {
      return NextResponse.json(customerData)
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })

  } catch (error) {
    console.error('Error downloading customers:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function generateCSV(data: any[]): string {
  const headers = ['ID', 'E-Mail', 'Vorname', 'Nachname', 'Telefon', 'Straße', 'PLZ', 'Stadt', 'Entfernung (km)', 'Anfragen', 'Umsatz (EUR)', 'Status', 'Registriert']
  const rows = data.map(customer => [
    customer.id,
    customer.email,
    customer.firstName,
    customer.lastName,
    customer.phone,
    customer.street,
    customer.zipCode,
    customer.city,
    customer.distance || '',
    customer.requestCount,
    customer.totalSpent.toFixed(2),
    customer.isActive ? 'Aktiv' : 'Inaktiv',
    new Date(customer.createdAt).toLocaleDateString('de-DE')
  ])

  return [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')
}

function generateTXT(data: any[]): string {
  let txt = 'KUNDENVERWALTUNG - BEREIFUNG24\n'
  txt += '='.repeat(80) + '\n'
  txt += `Export vom: ${new Date().toLocaleString('de-DE')}\n`
  txt += `Anzahl Kunden: ${data.length}\n`
  txt += '='.repeat(80) + '\n\n'

  data.forEach((customer, index) => {
    txt += `${index + 1}. ${customer.firstName} ${customer.lastName}\n`
    txt += `-`.repeat(80) + '\n'
    txt += `   E-Mail:      ${customer.email}\n`
    txt += `   Telefon:     ${customer.phone || 'Nicht angegeben'}\n`
    txt += `   Adresse:     ${customer.street ? customer.street + ', ' : ''}${customer.zipCode} ${customer.city}\n`
    txt += `   Entfernung:  ${customer.distance ? customer.distance + ' km' : 'Nicht berechnet'}\n`
    txt += `   Anfragen:    ${customer.requestCount}\n`
    txt += `   Umsatz:      ${customer.totalSpent.toFixed(2)} EUR\n`
    txt += `   Status:      ${customer.isActive ? 'Aktiv' : 'Inaktiv'}\n`
    txt += `   Registriert: ${new Date(customer.createdAt).toLocaleDateString('de-DE')}\n`
    txt += '\n'
  })

  return txt
}
