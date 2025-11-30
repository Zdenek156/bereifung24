import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get workshop's landing page
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Get workshop for current user
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: {
        landingPage: true
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ landingPage: workshop.landingPage })
  } catch (error) {
    console.error('GET /api/workshop/landing-page error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// POST - Create landing page
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { user: true, landingPage: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    if (workshop.landingPage) {
      return NextResponse.json({ error: 'Landing Page existiert bereits' }, { status: 400 })
    }

    const body = await request.json()
    const { slug } = body

    // Validate slug format
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ 
        error: 'Ungültiger Slug. Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt.' 
      }, { status: 400 })
    }

    // Check if slug is already taken
    const existingPage = await prisma.workshopLandingPage.findUnique({
      where: { slug }
    })

    if (existingPage) {
      return NextResponse.json({ error: 'Dieser Slug ist bereits vergeben' }, { status: 400 })
    }

    // Generate default content
    const defaultHeroHeadline = `Willkommen bei ${workshop.companyName}`
    const defaultHeroSubline = 'Ihr zuverlässiger Partner für Reifenwechsel und Autowerkstatt-Services'
    const defaultAboutTitle = 'Über uns'
    const defaultAboutText = workshop.description || 'Ihre professionelle Autowerkstatt mit langjähriger Erfahrung.'
    const defaultMetaTitle = `${workshop.companyName} - Autowerkstatt & Reifenservice`
    const defaultMetaDescription = `${workshop.companyName}: Professioneller Reifenwechsel, Räderwechsel und Autowerkstatt-Services. Jetzt online Termin buchen!`

    // Create landing page
    const landingPage = await prisma.workshopLandingPage.create({
      data: {
        workshopId: workshop.id,
        slug,
        isActive: false, // Start as inactive
        heroHeadline: defaultHeroHeadline,
        heroSubline: defaultHeroSubline,
        aboutTitle: defaultAboutTitle,
        aboutText: defaultAboutText,
        metaTitle: defaultMetaTitle,
        metaDescription: defaultMetaDescription,
        template: 'modern',
        primaryColor: '#2563eb',
        accentColor: '#10b981'
      }
    })

    return NextResponse.json({ landingPage }, { status: 201 })
  } catch (error) {
    console.error('POST /api/workshop/landing-page error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// PATCH - Update landing page
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { landingPage: true }
    })

    if (!workshop || !workshop.landingPage) {
      return NextResponse.json({ error: 'Landing Page nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    const { workshopId, createdAt, viewCount, lastViewedAt, ...updateData } = body

    // Update landing page
    const updatedPage = await prisma.workshopLandingPage.update({
      where: { id: workshop.landingPage.id },
      data: updateData
    })

    return NextResponse.json({ landingPage: updatedPage })
  } catch (error) {
    console.error('PATCH /api/workshop/landing-page error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// DELETE - Delete landing page
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { landingPage: true }
    })

    if (!workshop || !workshop.landingPage) {
      return NextResponse.json({ error: 'Landing Page nicht gefunden' }, { status: 404 })
    }

    await prisma.workshopLandingPage.delete({
      where: { id: workshop.landingPage.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/workshop/landing-page error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
