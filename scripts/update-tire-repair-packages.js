// Script to update existing TIRE_REPAIR service package names
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateTireRepairPackages() {
  console.log('Starting TIRE_REPAIR package name updates...')

  try {
    // Update "Fremdkörper-Reparatur" to "Reifenpanne / Loch (Fremdkörper)"
    const result1 = await prisma.servicePackage.updateMany({
      where: {
        packageType: 'foreign_object',
        name: 'Fremdkörper-Reparatur'
      },
      data: {
        name: 'Reifenpanne / Loch (Fremdkörper)',
        description: 'Reparatur nach Fremdkörper (Nagel, Schraube, etc.)'
      }
    })
    console.log(`✓ Updated ${result1.count} "Fremdkörper-Reparatur" packages`)

    // Update "Ventilschaden-Reparatur" to "Ventilschaden"
    const result2 = await prisma.servicePackage.updateMany({
      where: {
        packageType: 'valve_damage',
        name: 'Ventilschaden-Reparatur'
      },
      data: {
        name: 'Ventilschaden',
        description: 'Reparatur bei defektem Ventil'
      }
    })
    console.log(`✓ Updated ${result2.count} "Ventilschaden-Reparatur" packages`)

    // Deactivate or delete "Notfall-Service" packages if they exist
    const result3 = await prisma.servicePackage.updateMany({
      where: {
        packageType: 'emergency',
        name: 'Notfall-Service'
      },
      data: {
        isActive: false
      }
    })
    console.log(`✓ Deactivated ${result3.count} "Notfall-Service" packages`)

    console.log('\n✅ All TIRE_REPAIR packages updated successfully!')
  } catch (error) {
    console.error('❌ Error updating packages:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateTireRepairPackages()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
