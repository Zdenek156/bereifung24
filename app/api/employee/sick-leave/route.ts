import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET - Krankmeldungen abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.b24EmployeeId

    const sickLeaves = await prisma.sickLeave.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' }
    })

    return NextResponse.json({ sickLeaves })
  } catch (error) {
    console.error('Error fetching sick leaves:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Krankmeldungen' },
      { status: 500 }
    )
  }
}

// POST - Neue Krankmeldung erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.b24EmployeeId
    const formData = await request.formData()
    
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string | null
    const expectedReturnDate = formData.get('expectedReturnDate') as string | null
    const notes = formData.get('notes') as string | null
    const certificate = formData.get('certificate') as File | null

    if (!startDate) {
      return NextResponse.json(
        { error: 'Startdatum erforderlich' },
        { status: 400 }
      )
    }

    let certificateUrl: string | null = null

    // AU-Bescheinigung hochladen (wenn vorhanden)
    if (certificate) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'sick-certificates')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const timestamp = Date.now()
      const fileExtension = certificate.name.split('.').pop()
      const fileName = `${employeeId}-${timestamp}.${fileExtension}`
      const filePath = join(uploadsDir, fileName)

      const bytes = await certificate.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      certificateUrl = `/uploads/sick-certificates/${fileName}`
    }

    // Erstelle Krankmeldung
    const sickLeave = await prisma.sickLeave.create({
      data: {
        employeeId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        certificateUrl,
        certificateUploadedAt: certificateUrl ? new Date() : null,
        certificateRequired: true,
        notes,
        notifiedAt: new Date()
      }
    })

    // TODO: Benachrichtigung an HR senden

    return NextResponse.json({
      success: true,
      sickLeave
    })
  } catch (error) {
    console.error('Error creating sick leave:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Krankmeldung' },
      { status: 500 }
    )
  }
}
