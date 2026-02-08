const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLuxus24WheelChange() {
  try {
    console.log('🔍 Checking Luxus24 WHEEL_CHANGE configuration...\n')
    
    // Find Luxus24 workshop
    const workshop = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Luxus24',
          mode: 'insensitive'
        }
      }
    })
    
    if (!workshop) {
      console.log('❌ Workshop "Luxus24" not found!')
      return
    }
    
    console.log('✅ Workshop found:', workshop.companyName)
    console.log('   ID:', workshop.id)
    console.log('   City:', workshop.city)
    console.log('')
    
    // Get WHEEL_CHANGE service
    const service = await prisma.workshopService.findFirst({
      where: {
        workshopId: workshop.id,
        serviceType: 'WHEEL_CHANGE'
      },
      include: {
        servicePackages: true
      }
    })
    
    if (!service) {
      console.log('❌ WHEEL_CHANGE service not found for this workshop!')
      return
    }
    
    console.log('📋 WHEEL_CHANGE Service Configuration:')
    console.log('   Service ID:', service.id)
    console.log('   Is Active:', service.isActive)
    console.log('   Allows Direct Booking:', service.allowsDirectBooking)
    console.log('   Base Price:', service.basePrice)
    console.log('   Base Duration:', service.durationMinutes, 'min')
    console.log('')
    
    console.log('💰 Legacy Fields (old system):')
    console.log('   balancingPrice:', service.balancingPrice)
    console.log('   balancingMinutes:', service.balancingMinutes)
    console.log('   storagePrice:', service.storagePrice)
    console.log('   storageAvailable:', service.storageAvailable)
    console.log('')
    
    console.log('📦 Service Packages (new system):')
    if (service.servicePackages.length === 0) {
      console.log('   ⚠️  No packages configured!')
    } else {
      service.servicePackages.forEach((pkg, index) => {
        console.log(`\n   Package ${index + 1}:`)
        console.log('   - ID:', pkg.id)
        console.log('   - Type:', pkg.packageType)
        console.log('   - Name:', pkg.name)
        console.log('   - Price:', pkg.price)
        console.log('   - Duration:', pkg.durationMinutes, 'min')
        console.log('   - Is Active:', pkg.isActive)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🎯 ANALYSIS:')
    console.log('='.repeat(60))
    
    // Analyze what's configured
    const hasBasicPackage = service.servicePackages.some(p => p.packageType === 'basic' && p.isActive)
    const hasBalancingPackage = service.servicePackages.some(p => p.packageType === 'with_balancing' && p.isActive)
    const hasStoragePackage = service.servicePackages.some(p => p.packageType === 'with_storage' && p.isActive)
    
    console.log('\n📊 Package Analysis:')
    console.log('   - Has "basic" package:', hasBasicPackage ? '✅ YES' : '❌ NO')
    console.log('   - Has "with_balancing" package:', hasBalancingPackage ? '✅ YES' : '❌ NO')
    console.log('   - Has "with_storage" package:', hasStoragePackage ? '✅ YES' : '❌ NO')
    
    console.log('\n🔧 Legacy Fields:')
    console.log('   - Has balancingPrice:', service.balancingPrice ? '✅ YES (' + service.balancingPrice + '€)' : '❌ NO')
    console.log('   - Has storagePrice:', service.storagePrice ? '✅ YES (' + service.storagePrice + '€)' : '❌ NO')
    
    console.log('\n📝 EXPECTED BEHAVIOR:')
    console.log('   When searching with filter:')
    console.log('   - "Basis-Räderwechsel": Should show workshop if has "basic" package')
    console.log('   - "Mit Auswuchten": Should show workshop if has "with_balancing" package OR ("basic" + balancingPrice)')
    console.log('   - "Mit Einlagerung": Should show workshop if has "with_storage" package OR storagePrice set')
    
    console.log('\n🐛 POTENTIAL ISSUES:')
    if (!hasBasicPackage && !hasBalancingPackage && !hasStoragePackage) {
      console.log('   ⚠️  Workshop has NO packages configured! This is the PROBLEM!')
      console.log('   ⚠️  The workshop only uses legacy fields (basePrice, balancingPrice, etc.)')
      console.log('   ⚠️  The new filter system expects ServicePackage entries!')
    }
    
    if (hasBasicPackage && service.balancingPrice && !hasBalancingPackage) {
      console.log('   ℹ️  Workshop has "basic" package + legacy balancingPrice')
      console.log('   ℹ️  Filter "Mit Auswuchten" should work (due to API fix)')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLuxus24WheelChange()
