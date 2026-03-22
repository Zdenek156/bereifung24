import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// POST /api/workshop/card-image - Upload card image
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Nur Werkstätten können ein Card-Foto hochladen' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('cardImage') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Nur JPG, PNG und WebP Dateien sind erlaubt' 
      }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Datei ist zu groß. Maximal 5MB erlaubt.' 
      }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'card-images')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const ext = path.extname(file.name)
    const slugName = (workshop.companyName || 'werkstatt')
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const slugCity = (workshop.city || '')
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const filename = `werkstatt-${slugName}${slugCity ? `-${slugCity}` : ''}-card-${Date.now()}${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Delete old card image if exists
    if (workshop.cardImageUrl) {
      const oldFilename = workshop.cardImageUrl.split('/').pop()
      if (oldFilename) {
        const oldFilepath = path.join(uploadsDir, oldFilename)
        try {
          if (existsSync(oldFilepath)) {
            await unlink(oldFilepath)
          }
        } catch (error) {
          console.error('Error deleting old card image:', error)
        }
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const cardImageUrl = `/uploads/card-images/${filename}`
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: { cardImageUrl }
    })

    return NextResponse.json({ 
      success: true,
      cardImageUrl 
    })

  } catch (error) {
    console.error('Card image upload error:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Hochladen des Card-Fotos' 
    }, { status: 500 })
  }
}

// DELETE /api/workshop/card-image - Delete card image
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    if (!workshop.cardImageUrl) {
      return NextResponse.json({ error: 'Kein Card-Foto vorhanden' }, { status: 400 })
    }

    const filename = workshop.cardImageUrl.split('/').pop()
    if (filename) {
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'card-images', filename)
      try {
        if (existsSync(filepath)) {
          await unlink(filepath)
        }
      } catch (error) {
        console.error('Error deleting card image file:', error)
      }
    }

    await prisma.workshop.update({
      where: { id: workshop.id },
      data: { cardImageUrl: null }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Card image delete error:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Löschen des Card-Fotos' 
    }, { status: 500 })
  }
}
