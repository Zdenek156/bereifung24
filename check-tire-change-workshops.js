const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking workshops for TIRE_CHANGE service...\n')

    // Check which workshops have TIRE_CHANGE with packages
    const workshops = await prisma.workshop.findMany({
      where: {
        workshopServices: {
          some: {
            serviceType: 'TIRE_CHANGE',
            isActive: true
          }
        }
      },
      include: {
        workshopServices: {
          where: {
            serviceType: 'TIRE_CHANGE',
            isActive: true
          },
          include: {
            servicePackages: {
              where: {
                isActive: true
              }
            }
          }
        },
        user: {
          select: {
            street: true,
            zipCode: true,
            city: true
          }
        }
      }
    })

    console.log(`Found ${workshops.length} workshops with TIRE_CHANGE:\n`)

    workshops.forEach((w, idx) => {
      console.log(`${idx + 1}. ${w.companyName}`)
      console.log(`   Status: ${w.status}`)
      console.log(`   Coordinates: ${w.latitude}, ${w.longitude}`)
      console.log(`   Address: ${w.user.street}, ${w.user.zipCode} ${w.user.city}`)
      console.log(`   Services: ${w.workshopServices.length}`)
      
      w.workshopServices.forEach(s => {
        console.log(`   - ${s.serviceType}: ${s.servicePackages.length} packages`)
        s.servicePackages.forEach(p => {
          console.log(`     * ${p.name}: ${p.price}€ (${p.packageType})`)
        })
      })
      console.log('')
    })

    // Calculate distance from customer location (Winterberg)
    const customerLat = 51.1897292
    const customerLon = 8.4656295

    console.log('\n📍 Distances from customer (Winterberg):')
    workshops.forEach(w => {
      if (w.latitude && w.longitude) {
        const R = 6371
        const lat1 = customerLat
        const lon1 = customerLon
        const lat2 = w.latitude
        const lon2 = w.longitude
        
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c
        
        console.log(`   ${w.companyName}: ${Math.round(distance * 10) / 10} km`)
      } else {
        console.log(`   ${w.companyName}: NO COORDINATES`)
      }
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
