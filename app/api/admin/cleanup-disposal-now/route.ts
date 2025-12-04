import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Suche alle alten Disposal-Pakete...')

    // Find all disposal packages
    const packagesToDelete = await prisma.servicePackage.findMany({
      where: {
        OR: [
          { packageType: 'two_tires_disposal' },
          { packageType: 'four_tires_disposal' }
        ]
      },
      include: {
        workshopService: {
          include: {
            workshop: true
          }
        }
      }
    })

    console.log(`📦 Gefunden: ${packagesToDelete.length} alte Disposal-Pakete`)

    if (packagesToDelete.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Keine alten Pakete gefunden - alles sauber!',
        deletedCount: 0 
      })
    }

    // Delete them
    const result = await prisma.servicePackage.deleteMany({
      where: {
        id: {
          in: packagesToDelete.map(pkg => pkg.id)
        }
      }
    })

    const details = packagesToDelete.map(pkg => ({
      name: pkg.name,
      type: pkg.packageType,
      price: pkg.price,
      workshop: pkg.workshopService.workshop.companyName
    }))

    console.log(`✅ ERFOLGREICH! ${result.count} alte Disposal-Pakete gelöscht.`)

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      packages: details,
      message: `${result.count} alte Disposal-Pakete erfolgreich gelöscht!` 
    })
  } catch (error) {
    console.error('❌ Error deleting disposal packages:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete packages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
