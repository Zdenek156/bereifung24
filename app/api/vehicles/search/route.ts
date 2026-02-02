import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Vehicle Search API
 * Search for vehicles by make, model, and year
 * Uses NHTSA (US Government) vPIC API - FREE, no API key required!
 * API Docs: https://vpic.nhtsa.dot.gov/api/
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const make = searchParams.get('make')
    const model = searchParams.get('model')
    const year = searchParams.get('year')

    if (!make) {
      return NextResponse.json(
        { error: 'Make parameter is required' },
        { status: 400 }
      )
    }

    // Call NHTSA API (FREE, no API key needed!)
    // If year is provided, use GetModelsForMakeYear endpoint
    // Otherwise, use GetModelsForMake endpoint
    let apiUrl: string
    
    if (year) {
      apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
    } else {
      apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`
    }

    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.Results || data.Results.length === 0) {
      return NextResponse.json([])
    }

    // Transform results
    let vehicles = data.Results.map((vehicle: any) => {
      // Parse year from Model_Name if available (e.g., \"Accord 2020\")
      let modelYear = year ? parseInt(year) : null
      
      return {
        make: vehicle.Make_Name || make,
        model: vehicle.Model_Name || '',
        year: modelYear,
        makeId: vehicle.Make_ID || null,
        modelId: vehicle.Model_ID || null
      }
    })

    // Filter by model name if provided
    if (model) {
      const modelLower = model.toLowerCase()
      vehicles = vehicles.filter((v: any) => 
        v.model.toLowerCase().includes(modelLower)
      )
    }

    // Remove duplicates based on make + model
    const uniqueVehicles = vehicles.filter((vehicle: any, index: number, self: any[]) => {
      return index === self.findIndex((v: any) => (
        v.make === vehicle.make &&
        v.model === vehicle.model
      ))
    })

    // Limit to 50 results
    return NextResponse.json(uniqueVehicles.slice(0, 50))
  } catch (error) {
    console.error('Vehicle search error:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Fahrzeugsuche' },
      { status: 500 }
    )
  }
}
