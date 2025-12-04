import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'WORKSHOP')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop ID for the current user
    let workshopId = null
    if (session.user.role === 'WORKSHOP') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { workshop: true }
      })
      workshopId = user?.workshop?.id
    }

    // Find all disposal packages to delete
    const packagesToDelete = await prisma.servicePackage.findMany({
      where: {
        packageType: {
          in: ['two_tires_disposal', 'four_tires_disposal']
        },
        ...(workshopId && {
          workshopService: {
            workshopId: workshopId
          }
        })
      },
      include: {
        workshopService: {
          include: {
            workshop: true
          }
        }
      }
    })

    // Delete them
    const result = await prisma.servicePackage.deleteMany({
      where: {
        id: {
          in: packagesToDelete.map(pkg => pkg.id)
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      packages: packagesToDelete.map(pkg => ({
        name: pkg.name,
        type: pkg.packageType,
        price: pkg.price,
        workshop: pkg.workshopService.workshop.companyName
      })),
      message: `${result.count} alte Disposal-Pakete gelöscht` 
    })
  } catch (error) {
    console.error('Error deleting disposal packages:', error)
    return NextResponse.json({ error: 'Failed to delete packages' }, { status: 500 })
  }
}
