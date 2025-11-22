import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Berechne Verkaufspreis basierend auf Einkaufspreis und Settings
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
      where: { userId: session.user.id },
      include: { pricingSettings: true }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    const { costPrice, category } = await request.json()

    if (typeof costPrice !== 'number' || costPrice <= 0) {
      return NextResponse.json(
        { error: 'Ungültiger Einkaufspreis' },
        { status: 400 }
      )
    }

    if (!['auto', 'moto', 'service'].includes(category)) {
      return NextResponse.json(
        { error: 'Ungültige Kategorie' },
        { status: 400 }
      )
    }

    const settings = workshop.pricingSettings

    // Wenn keine Settings oder manuelle Preiseingabe, Einkaufspreis zurückgeben
    if (!settings) {
      return NextResponse.json({ sellingPrice: costPrice, isManual: true })
    }

    let isManual: boolean
    let fixedMarkup: number
    let percentMarkup: number
    let includeVat: boolean

    switch (category) {
      case 'auto':
        isManual = settings.autoManualPricing
        fixedMarkup = settings.autoFixedMarkup
        percentMarkup = settings.autoPercentMarkup
        includeVat = settings.autoIncludeVat
        break
      case 'moto':
        isManual = settings.motoManualPricing
        fixedMarkup = settings.motoFixedMarkup
        percentMarkup = settings.motoPercentMarkup
        includeVat = settings.motoIncludeVat
        break
      case 'service':
        isManual = settings.serviceManualPricing
        fixedMarkup = settings.serviceFixedMarkup
        percentMarkup = settings.servicePercentMarkup
        includeVat = settings.serviceIncludeVat
        break
      default:
        return NextResponse.json({ sellingPrice: costPrice, isManual: true })
    }

    if (isManual) {
      return NextResponse.json({ sellingPrice: costPrice, isManual: true })
    }

    // Berechnung: (Einkaufspreis + Fester Aufschlag) * (1 + Prozent/100) * (1.19 wenn MwSt.)
    let sellingPrice = costPrice + fixedMarkup
    sellingPrice = sellingPrice * (1 + percentMarkup / 100)
    
    if (includeVat) {
      sellingPrice = sellingPrice * 1.19
    }

    return NextResponse.json({ 
      sellingPrice: parseFloat(sellingPrice.toFixed(2)), 
      isManual: false,
      calculation: {
        costPrice,
        fixedMarkup,
        percentMarkup,
        includeVat,
        result: parseFloat(sellingPrice.toFixed(2))
      }
    })

  } catch (error) {
    console.error('Calculate price error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Preisberechnung' },
      { status: 500 }
    )
  }
}
