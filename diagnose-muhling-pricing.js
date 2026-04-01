const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find workshop "Reifenservice Mühling"
  const workshop = await prisma.workshop.findFirst({
    where: { companyName: { contains: 'hling' } },
    select: {
      id: true,
      companyName: true,
      taxMode: true,
      workshopServices: {
        where: { serviceType: 'TIRE_CHANGE' },
        select: {
          id: true,
          serviceType: true,
          basePrice: true,
          durationMinutes: true,
          mountingOnlySurcharge: true,
          disposalFee: true,
          runFlatSurcharge: true,
          acceptsMountingOnly: true,
          servicePackages: {
            select: {
              id: true,
              packageType: true,
              name: true,
              price: true,
              durationMinutes: true,
              isActive: true,
            }
          }
        }
      },
      tireChangePricing: {
        select: {
          id: true,
          rimSize: true,
          pricePerTire: true,
          durationPerTire: true,
        },
        orderBy: { rimSize: 'asc' }
      }
    }
  })

  if (!workshop) {
    console.log('Workshop nicht gefunden!')
    return
  }

  console.log('=== WERKSTATT ===')
  console.log(`Name: ${workshop.companyName}`)
  console.log(`ID: ${workshop.id}`)
  console.log(`Tax Mode: ${workshop.taxMode}`)
  
  console.log('\n=== TIRE_CHANGE SERVICE ===')
  if (workshop.workshopServices.length === 0) {
    console.log('Kein TIRE_CHANGE Service gefunden!')
  } else {
    const svc = workshop.workshopServices[0]
    console.log(`Service ID: ${svc.id}`)
    console.log(`Base Price: ${svc.basePrice}€`)
    console.log(`Duration: ${svc.durationMinutes} min`)
    console.log(`Mounting Only Surcharge: ${svc.mountingOnlySurcharge}€ (pro Reifen)`)
    console.log(`Disposal Fee: ${svc.disposalFee}€ (pro Reifen)`)
    console.log(`RunFlat Surcharge: ${svc.runFlatSurcharge}€`)
    console.log(`Accepts Mounting Only: ${svc.acceptsMountingOnly}`)
    
    console.log('\n=== SERVICE PACKAGES ===')
    if (svc.servicePackages.length === 0) {
      console.log('Keine Service Packages')
    } else {
      svc.servicePackages.forEach(pkg => {
        console.log(`  ${pkg.packageType}: ${pkg.name} → ${pkg.price}€ (${pkg.durationMinutes}min) [active: ${pkg.isActive}]`)
      })
    }
  }

  console.log('\n=== TIRE CHANGE PRICING (Felgengrößen) ===')
  if (workshop.tireChangePricing.length === 0) {
    console.log('Keine Felgengrößen-Preise hinterlegt')
  } else {
    workshop.tireChangePricing.forEach(p => {
      console.log(`  ${p.rimSize}" → ${p.pricePerTire}€/Reifen (${p.durationPerTire}min/Reifen)`)
    })
  }

  // Berechnung für "Nur Montage" mit 4 Reifen, 17" Felge
  console.log('\n=== BERECHNUNG "Nur Montage" (4 Reifen, 17") ===')
  const svc2 = workshop.workshopServices[0]
  if (svc2) {
    const rimSize = 17
    const tireCount = 4
    const pricing = workshop.tireChangePricing.find(p => p.rimSize === rimSize)
    
    if (pricing) {
      const baseMontage = Number(pricing.pricePerTire) * tireCount
      const mountSurcharge = svc2.mountingOnlySurcharge ? Number(svc2.mountingOnlySurcharge) * tireCount : 0
      const disposalFee = svc2.disposalFee ? Number(svc2.disposalFee) * tireCount : 0
      
      console.log(`Montage: ${pricing.pricePerTire}€/Reifen × ${tireCount} = ${baseMontage}€`)
      console.log(`Mounting-Only Zuschlag: ${svc2.mountingOnlySurcharge || 0}€/Reifen × ${tireCount} = ${mountSurcharge}€`)
      console.log(`Entsorgung: ${svc2.disposalFee || 0}€/Reifen × ${tireCount} = ${disposalFee}€`)
      console.log(`---`)
      console.log(`Montage + Zuschlag: ${baseMontage + mountSurcharge}€`)
      console.log(`Montage + Zuschlag + Entsorgung: ${baseMontage + mountSurcharge + disposalFee}€`)
    } else {
      console.log(`Keine Preise für ${rimSize}" hinterlegt`)
      console.log(`Fallback auf basePrice: ${svc2.basePrice}€`)
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)
