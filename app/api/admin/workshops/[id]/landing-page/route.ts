import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'
import fs from 'fs'
import path from 'path'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id },
      include: { landingPage: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    if (!workshop.landingPage) {
      return NextResponse.json({ error: 'Keine Landing Page vorhanden' }, { status: 404 })
    }

    // Delete hero image file if it exists
    if (workshop.landingPage.heroImage) {
      const imagePath = path.join(process.cwd(), 'public', workshop.landingPage.heroImage)
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath)
        }
      } catch (e) {
        console.warn('Could not delete hero image file:', e)
      }
    }

    await prisma.workshopLandingPage.delete({
      where: { id: workshop.landingPage.id }
    })

    return NextResponse.json({ success: true, message: 'Landing Page gelöscht' })

  } catch (error) {
    console.error('Landing page delete error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Landing Page' }, { status: 500 })
  }
}
