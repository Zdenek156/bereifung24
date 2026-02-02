import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

/**
 * GET /api/admin/tire-requests/export
 * Export tire requests as Excel or CSV
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel' // excel, csv
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause (same as main route)
    const where: any = {}

    if (status && status !== 'ALL') {
      if (status === 'EXPIRED') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        where.needByDate = { lt: today }
        where.status = { in: ['PENDING', 'OPEN', 'QUOTED'] }
      } else {
        where.status = status
      }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Fetch all matching requests
    const tireRequests = await prisma.tireRequest.findMany({
      where,
      include: {
        customer: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true
          }
        },
        offers: {
          select: {
            id: true,
            price: true,
            workshop: {
              select: {
                companyName: true
              }
            }
          }
        },
        booking: {
          select: {
            appointmentDate: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format data for export
    const exportData = tireRequests.map((req) => ({
      'Anfrage ID': req.id,
      'Erstellt am': req.createdAt.toLocaleDateString('de-DE'),
      'Benötigt bis': req.needByDate.toLocaleDateString('de-DE'),
      'Status': req.status,
      'Kunde Name': `${req.customer.user.firstName} ${req.customer.user.lastName}`,
      'Kunde Email': req.customer.user.email,
      'Kunde Telefon': req.customer.user.phone || '-',
      'Service': 'Reifenwechsel',
      'Fahrzeug': req.vehicle ? `${req.vehicle.make} ${req.vehicle.model} (${req.vehicle.year})` : 'Nicht angegeben',
      'PLZ': req.zipCode,
      'Stadt': req.city || '-',
      'Saison': req.season,
      'Reifengröße': `${req.width}/${req.aspectRatio} R${req.diameter}`,
      'Anzahl': req.quantity,
      'Bevorzugte Marken': req.preferredBrands || '-',
      'Angebote Anzahl': req.offers.length,
      'Günstigstes Angebot': req.offers.length > 0 
        ? `${Math.min(...req.offers.map(o => parseFloat(o.price.toString())))} €` 
        : '-',
      'Teurstes Angebot': req.offers.length > 0 
        ? `${Math.max(...req.offers.map(o => parseFloat(o.price.toString())))} €` 
        : '-',
      'Buchung vorhanden': req.booking ? 'Ja' : 'Nein',
      'Buchungsdatum': req.booking?.appointmentDate ? req.booking.appointmentDate.toLocaleDateString('de-DE') : '-',
      'Notizen': req.additionalNotes || '-'
    }))

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Anfragen')

    // Generate file
    let buffer: Buffer
    let filename: string
    let contentType: string

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws)
      buffer = Buffer.from(csv, 'utf-8')
      filename = `anfragen-export-${new Date().toISOString().split('T')[0]}.csv`
      contentType = 'text/csv'
    } else {
      buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
      filename = `anfragen-export-${new Date().toISOString().split('T')[0]}.xlsx`
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error exporting tire requests:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
