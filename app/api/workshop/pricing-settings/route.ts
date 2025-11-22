import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const pricingSettingsSchema = z.object({
  autoManualPricing: z.boolean(),
  autoFixedMarkup: z.number().min(0),
  autoPercentMarkup: z.number().min(0).max(100),
  autoIncludeVat: z.boolean(),
  motoManualPricing: z.boolean(),
  motoFixedMarkup: z.number().min(0),
  motoPercentMarkup: z.number().min(0).max(100),
  motoIncludeVat: z.boolean(),
  serviceManualPricing: z.boolean(),
  serviceFixedMarkup: z.number().min(0),
  servicePercentMarkup: z.number().min(0).max(100),
  serviceIncludeVat: z.boolean()
})

// GET - Hole Preiskalkulation-Einstellungen
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { pricingSettings: true }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ settings: workshop.pricingSettings })
  } catch (error) {
    console.error('Pricing settings GET error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Einstellungen' },
      { status: 500 }
    )
  }
}

// POST - Speichere oder aktualisiere Preiskalkulation-Einstellungen
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = pricingSettingsSchema.parse(body)

    // Upsert pricing settings
    const settings = await prisma.pricingSettings.upsert({
      where: { workshopId: workshop.id },
      update: validatedData,
      create: {
        workshopId: workshop.id,
        ...validatedData
      }
    })

    return NextResponse.json({ 
      message: 'Einstellungen erfolgreich gespeichert',
      settings 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Pricing settings POST error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Einstellungen' },
      { status: 500 }
    )
  }
}
