import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Get list of car manufacturers
 * Common German car brands
 */

const COMMON_MAKES = [
  'Audi',
  'BMW',
  'Mercedes-Benz',
  'Volkswagen',
  'Opel',
  'Porsche',
  'Ford',
  'Toyota',
  'Honda',
  'Nissan',
  'Mazda',
  'Hyundai',
  'Kia',
  'Skoda',
  'Seat',
  'Renault',
  'Peugeot',
  'Citroen',
  'Fiat',
  'Volvo',
  'Tesla',
  'Chevrolet',
  'Dodge',
  'Jeep',
  'Land Rover',
  'Jaguar',
  'Mini',
  'Smart',
  'Alfa Romeo',
  'Aston Martin',
  'Bentley',
  'Bugatti',
  'Cadillac',
  'Chrysler',
  'Dacia',
  'Ferrari',
  'Lamborghini',
  'Lexus',
  'Maserati',
  'McLaren',
  'Mitsubishi',
  'Rolls-Royce',
  'Subaru',
  'Suzuki'
].sort()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    return NextResponse.json({ makes: COMMON_MAKES })
  } catch (error) {
    console.error('Error fetching makes:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Hersteller' },
      { status: 500 }
    )
  }
}
