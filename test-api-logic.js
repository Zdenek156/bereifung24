const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Testing search API logic for TIRE_CHANGE...\n')

  const serviceType = 'TIRE_CHANGE'
  const customerLat = 51.1897292
  const customerLon = 8.4656295
  const radiusKm = 25

  // Exact same query as API
  const workshops = await prisma.workshop.findMany({
    where: {
      workshopServices: {
        some: {
          serviceType: serviceType,
          isActive: true
        }
      }
    },
    include: {
      workshopServices: {
        where: {
          serviceType: serviceType,
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

  console.log(`Found ${workshops.length} workshops with TIRE_CHANGE service\n`)

  // Calculate distances
  const workshopsWithDistance = workshops.map(workshop => {
    const service = workshop.workshopServices.find(s => s.serviceType === serviceType)
    if (!service) return null

    const lat1 = customerLat
    const lon1 = customerLon
    const lat2 = workshop.latitude
    const lon2 = workshop.longitude

    if (!lat2 || !lon2) {
      console.log(`❌ ${workshop.companyName}: NO COORDINATES`)
      return null
    }

    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c

    console.log(`✅ ${workshop.companyName}:`)
    console.log(`   Status: ${workshop.status}`)
    console.log(`   Distance: ${distance.toFixed(1)} km`)
    console.log(`   Within ${radiusKm}km: ${distance <= radiusKm ? 'YES ✓' : 'NO ✗'}`)
    console.log(`   Packages: ${service.servicePackages.length}`)
    service.servicePackages.forEach(p => {
      console.log(`     - ${p.packageType}: ${p.price}€`)
    })
    console.log('')

    return {
      name: workshop.companyName,
      distance: parseFloat(distance.toFixed(1)),
      status: workshop.status,
      packages: service.servicePackages.length
    }
  }).filter(w => w !== null)

  // Filter by radius
  const inRadius = workshopsWithDistance.filter(w => w.distance <= radiusKm)
  
  console.log(`\n📊 Summary:`)
  console.log(`   Total workshops: ${workshops.length}`)
  console.log(`   With coordinates: ${workshopsWithDistance.length}`)
  console.log(`   Within ${radiusKm}km radius: ${inRadius.length}`)
  console.log(`\n   Workshops returned by API:`)
  inRadius.forEach(w => {
    console.log(`   - ${w.name} (${w.distance}km, ${w.status})`)
  })

  await prisma.$disconnect()
}

main()
