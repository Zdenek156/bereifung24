import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Check if slug is available
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug Parameter fehlt' }, { status: 400 })
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt' 
      })
    }

    // Check if slug exists
    const existingPage = await prisma.workshopLandingPage.findUnique({
      where: { slug }
    })

    return NextResponse.json({ 
      available: !existingPage,
      slug 
    })
  } catch (error) {
    console.error('GET /api/workshop/landing-page/check-slug error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
