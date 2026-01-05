import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('receipt') as File

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validierung
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/heic',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nur Bilder (JPG, PNG, HEIC) und PDFs erlaubt' },
        { status: 400 }
      )
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Datei zu groß (max. 10MB)' },
        { status: 400 }
      )
    }

    // Speicherpfad erstellen
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Eindeutiger Dateiname
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedFileName}`
    const filePath = join(uploadDir, fileName)

    // Datei speichern
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/receipts/${fileName}`

    // Optional: OCR-Extraktion hier durchführen
    // const ocrData = await extractReceiptData(buffer, file.type)

    return NextResponse.json({
      receiptUrl: fileUrl,
      fileName,
      message: 'Beleg erfolgreich hochgeladen',
    })
  } catch (error) {
    console.error('Error uploading receipt:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen des Belegs' },
      { status: 500 }
    )
  }
}
