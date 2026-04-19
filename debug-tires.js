const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Check vehicles
  const vehicles = await p.vehicle.findMany({ take: 5, orderBy: { updatedAt: 'desc' } })
  for (const v of vehicles) {
    console.log('Vehicle:', v.make, v.model, '| type:', v.vehicleType)
    const specs = v.summerTires || v.winterTires || v.allSeasonTires
    if (specs) {
      const parsed = typeof specs === 'string' ? JSON.parse(specs) : specs
      console.log('  Parsed specs:', JSON.stringify(parsed).substring(0, 300))
      const size = parsed.width && parsed.aspectRatio && parsed.diameter
        ? `${parsed.width}/${parsed.aspectRatio} R${parsed.diameter}` : 'N/A'
      const rearSize = parsed.hasDifferentSizes && parsed.rearWidth
        ? `${parsed.rearWidth}/${parsed.rearAspectRatio} R${parsed.rearDiameter}` : 'N/A'
      console.log('  Front size:', size, '| Rear size:', rearSize)
      console.log('  LoadIndex:', parsed.loadIndex, '| SpeedRating:', parsed.speedRating)
      
      // Try to find tires for this size
      if (size !== 'N/A') {
        const parts = size.match(/(\d+)\/(\d+)\s*R(\d+)/)
        if (parts) {
          const count = await p.tireCatalog.count({
            where: { width: parts[1], height: parts[2], diameter: parts[3], isActive: true }
          })
          const branded = await p.tireCatalog.count({
            where: { width: parts[1], height: parts[2], diameter: parts[3], isActive: true,
              brand: { in: ['Continental', 'Michelin', 'Bridgestone', 'Goodyear', 'Pirelli', 'Dunlop', 'Hankook'] }
            }
          })
          console.log(`  Tires for ${size}: total=${count}, branded=${branded}`)
          const samples = await p.tireCatalog.findMany({
            where: { width: parts[1], height: parts[2], diameter: parts[3], isActive: true },
            take: 5
          })
          samples.forEach(t => console.log(`    ${t.brand} ${t.model} | LI:${t.loadIndex} SI:${t.speedIndex}`))
        }
      }
      if (rearSize !== 'N/A') {
        const parts = rearSize.match(/(\d+)\/(\d+)\s*R(\d+)/)
        if (parts) {
          const count = await p.tireCatalog.count({
            where: { width: parts[1], height: parts[2], diameter: parts[3], isActive: true }
          })
          console.log(`  Tires for rear ${rearSize}: total=${count}`)
        }
      }
    } else {
      console.log('  No tire specs found')
    }
  }

  // General catalog stats
  const total = await p.tireCatalog.count()
  const active = await p.tireCatalog.count({ where: { isActive: true } })
  console.log('\nTireCatalog: total=' + total + ', active=' + active)
  
  await p.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
