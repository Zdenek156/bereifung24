import { NextRequest, NextResponse } from 'next/server'

let lastNominatimRequest = 0
const NOMINATIM_DELAY = 1000 // 1 second between requests (Nominatim usage policy)

/**
 * GET /api/geocode?input=59955
 * or
 * GET /api/geocode?input=Winterberg
 * 
 * Returns: { lat: number, lon: number } or { error: string }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const input = searchParams.get('input')
    const retryCount = parseInt(searchParams.get('retry') || '0')

    if (!input) {
      return NextResponse.json(
        { error: 'Parameter "input" erforderlich' },
        { status: 400 }
      )
    }

    // Rate limiting: Wait if last request was too recent
    const now = Date.now()
    const timeSinceLastRequest = now - lastNominatimRequest
    if (timeSinceLastRequest < NOMINATIM_DELAY) {
      await new Promise(resolve => setTimeout(resolve, NOMINATIM_DELAY - timeSinceLastRequest))
    }
    lastNominatimRequest = Date.now()

    // Check if input is a postal code (5 digits) or city name
    const isPostalCode = /^\d{5}$/.test(input)
    
    let url = ''
    if (isPostalCode) {
      url = `https://nominatim.openstreetmap.org/search?format=json&country=Germany&postalcode=${input}`
    } else {
      // Search by city name
      url = `https://nominatim.openstreetmap.org/search?format=json&country=Germany&city=${encodeURIComponent(input)}`
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Bereifung24.de/1.0 (contact@bereifung24.de)'
      }
    })

    // Handle 425 (Too Early) with retry
    if (response.status === 425 && retryCount < 2) {
      console.warn(`⏱️ Nominatim 425 (Too Early), retry ${retryCount + 1}/2`)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      // Tell client to retry
      return NextResponse.json(
        { error: 'TOO_EARLY', retry: true },
        { status: 425 }
      )
    }

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`)
      return NextResponse.json(
        { error: `Nominatim API error: ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      // Sort results by importance (OSM importance score)
      // This helps prioritize larger cities when there are multiple matches
      const sorted = data.sort((a: any, b: any) => {
        const importanceA = parseFloat(a.importance || '0')
        const importanceB = parseFloat(b.importance || '0')
        return importanceB - importanceA
      })
      
      return NextResponse.json({
        lat: parseFloat(sorted[0].lat),
        lon: parseFloat(sorted[0].lon),
        displayName: sorted[0].display_name
      })
    }

    return NextResponse.json(
      { error: 'Keine Ergebnisse gefunden' },
      { status: 404 }
    )
  } catch (err) {
    console.error('Geocoding error:', err)
    return NextResponse.json(
      { error: 'Interner Server-Fehler beim Geocoding' },
      { status: 500 }
    )
  }
}
