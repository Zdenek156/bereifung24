// app/api/admin/accounting/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET: Liste aller Belege mit optionalen Filtern
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const entryId = searchParams.get('entryId')
    const unassigned = searchParams.get('unassigned') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Wenn ein spezifischer Entry abgefragt wird
    if (entryId) {
      const entry = await prisma.accountingEntry.findUnique({
        where: { id: entryId },
        select: { attachmentUrls: true }
      })

      return NextResponse.json({
        documents: entry?.attachmentUrls || []
      })
    }

    // Alle Buchungen mit/ohne Belege
    const entries = await prisma.accountingEntry.findMany({
      where: {
        ...(startDate && endDate ? {
          bookingDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {})
      },
      select: {
        id: true,
        documentNumber: true,
        description: true,
        bookingDate: true,
        amount: true,
        attachmentUrls: true,
        debitAccount: true,
        creditAccount: true
      },
      orderBy: {
        bookingDate: 'desc'
      }
    })

    // Filter nach unassigned/assigned
    const filteredEntries = unassigned 
      ? entries.filter(e => e.attachmentUrls.length === 0)
      : entries.filter(e => e.attachmentUrls.length > 0)

    // Flache Liste aller Dokumente mit Zuordnung
    const documents = filteredEntries.flatMap(entry => 
      entry.attachmentUrls.map((url: string) => ({
        url,
        fileName: path.basename(url),
        entryId: entry.id,
        documentNumber: entry.documentNumber,
        description: entry.description,
        bookingDate: entry.bookingDate,
        amount: entry.amount,
        debitAccount: entry.debitAccount,
        creditAccount: entry.creditAccount
      }))
    )

    return NextResponse.json({
      documents,
      totalEntries: filteredEntries.length,
      totalDocuments: documents.length
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST: Beleg hochladen und optional zu Buchung zuordnen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const entryId = formData.get('entryId') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validierung
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic']
    
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `Datei ${file.name} ist zu groß (max. 10MB)` },
          { status: 400 }
        )
      }
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Dateityp ${file.type} nicht erlaubt` },
          { status: 400 }
        )
      }
    }

    const uploadedUrls: string[] = []
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    // Upload-Verzeichnis erstellen
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'accounting', String(year), month)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Dateien speichern
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Eindeutiger Dateiname mit Timestamp
      const timestamp = Date.now()
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}_${originalName}`
      const filePath = path.join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)
      
      // Relativer URL-Pfad
      const fileUrl = `/uploads/accounting/${year}/${month}/${fileName}`
      uploadedUrls.push(fileUrl)
    }

    // Wenn entryId angegeben, zu Buchung hinzufügen
    if (entryId) {
      const entry = await prisma.accountingEntry.findUnique({
        where: { id: entryId },
        select: { attachmentUrls: true }
      })

      if (!entry) {
        return NextResponse.json(
          { error: 'Buchung nicht gefunden' },
          { status: 404 }
        )
      }

      const updatedUrls = [...entry.attachmentUrls, ...uploadedUrls]
      
      await prisma.accountingEntry.update({
        where: { id: entryId },
        data: { attachmentUrls: updatedUrls }
      })
    }

    return NextResponse.json({
      message: 'Dateien erfolgreich hochgeladen',
      urls: uploadedUrls,
      count: uploadedUrls.length,
      ...(entryId && { entryId })
    })

  } catch (error) {
    console.error('Error uploading documents:', error)
    return NextResponse.json(
      { error: 'Upload fehlgeschlagen' },
      { status: 500 }
    )
  }
}

// DELETE: Beleg von Buchung entfernen (Datei bleibt erhalten für Archivierung)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'B24EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryId, documentUrl } = await request.json()

    if (!entryId || !documentUrl) {
      return NextResponse.json(
        { error: 'entryId und documentUrl erforderlich' },
        { status: 400 }
      )
    }

    const entry = await prisma.accountingEntry.findUnique({
      where: { id: entryId },
      select: { attachmentUrls: true, locked: true }
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden' },
        { status: 404 }
      )
    }

    if (entry.locked) {
      return NextResponse.json(
        { error: 'Gesperrte Buchungen können nicht geändert werden' },
        { status: 403 }
      )
    }

    const updatedUrls = entry.attachmentUrls.filter((url: string) => url !== documentUrl)
    
    await prisma.accountingEntry.update({
      where: { id: entryId },
      data: { attachmentUrls: updatedUrls }
    })

    return NextResponse.json({
      message: 'Beleg erfolgreich entfernt',
      remainingDocuments: updatedUrls.length
    })

  } catch (error) {
    console.error('Error removing document:', error)
    return NextResponse.json(
      { error: 'Fehler beim Entfernen des Belegs' },
      { status: 500 }
    )
  }
}
