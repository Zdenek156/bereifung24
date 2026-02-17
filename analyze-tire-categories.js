const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzeTireCategories() {
  try {
    const workshopId = 'cml3g7rxd000ckeyn9ypqgg65' // Luxus24
    
    // Get tires that match the exact dimensions
    const allTires = await prisma.workshopInventory.findMany({
      where: {
        workshopId: workshopId,
        width: '235',
        height: '35',
        diameter: '19',
        stock: { gte: 4 }
      },
      select: {
        brand: true,
        model: true,
        loadIndex: true,
        speedIndex: true,
        labelFuelEfficiency: true,
        labelWetGrip: true,
        labelNoise: true,
        season: true,
        price: true
      },
      orderBy: {
        price: 'asc'
      }
    })
    
    console.log(`\n📊 Total tires matching: ${allTires.length}`)
    
    // Simulate Load/Speed Index filtering (example: 91Y requirement)
    const SPEED_INDEX_ORDER = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'ZR']
    const minLoadIndex = 91 // Example from screenshot
    const minSpeedIndex = 'Y' // Example from screenshot
    
    const filteredTires = allTires.filter(tire => {
      // Load index filter
      if (tire.loadIndex) {
        const match = tire.loadIndex.match(/(\d+)/)
        if (match) {
          const tireLoad = parseInt(match[1])
          if (!isNaN(tireLoad) && tireLoad < minLoadIndex) {
            return false
          }
        }
      }
      
      // Speed index filter
      if (tire.speedIndex && minSpeedIndex) {
        const tireSpeedIdx = SPEED_INDEX_ORDER.indexOf(tire.speedIndex)
        const minSpeedIdx = SPEED_INDEX_ORDER.indexOf(minSpeedIndex)
        if (tireSpeedIdx !== -1 && minSpeedIdx !== -1 && tireSpeedIdx < minSpeedIdx) {
          return false
        }
      }
      
      return true
    })
    
    console.log(`✅ After Load/Speed filter (≥91Y): ${filteredTires.length}`)
    console.log(`❌ Filtered out: ${allTires.length - filteredTires.length}`)
    
    // Categorize using the same logic as frontend
    const premiumBrands = ['Michelin', 'Continental', 'Goodyear', 'Bridgestone', 'Pirelli', 'Dunlop']
    
    function getTireQualityCategory(tire) {
      // Premium brand override
      if (premiumBrands.some(brand => tire.brand?.toLowerCase().includes(brand.toLowerCase()))) {
        return 'premium'
      }
      
      const fuelEff = tire.labelFuelEfficiency
      const wetGrip = tire.labelWetGrip
      const noise = tire.labelNoise
      
      // No labels? Default to quality
      if (!fuelEff && !wetGrip && !noise) return 'quality'
      
      const categories = []
      
      // Fuel efficiency
      if (fuelEff) {
        if (['A', 'B'].includes(fuelEff.toUpperCase())) categories.push('premium')
        else if (['C', 'D'].includes(fuelEff.toUpperCase())) categories.push('quality')
        else categories.push('budget')
      }
      
      // Wet grip
      if (wetGrip) {
        if (['A', 'B'].includes(wetGrip.toUpperCase())) categories.push('premium')
        else if (['C', 'D'].includes(wetGrip.toUpperCase())) categories.push('quality')
        else categories.push('budget')
      }
      
      // Noise
      if (noise) {
        if (noise <= 68) categories.push('premium')
        else if (noise <= 71) categories.push('quality')
        else categories.push('budget')
      }
      
      if (categories.length === 0) return 'quality'
      
      const premiumCount = categories.filter(c => c === 'premium').length
      const qualityCount = categories.filter(c => c === 'quality').length
      const budgetCount = categories.filter(c => c === 'budget').length
      
      if (premiumCount >= 2 || (premiumCount >= 1 && categories.length === 1)) return 'premium'
      if (budgetCount >= 2 || (budgetCount >= 1 && categories.length === 1)) return 'budget'
      if (qualityCount >= 1) return 'quality'
      
      return 'quality'
    }
    
    // Categorize all filtered tires
    const categorized = {
      premium: [],
      quality: [],
      budget: []
    }
    
    filteredTires.forEach(tire => {
      const category = getTireQualityCategory(tire)
      categorized[category].push(tire)
    })
    
    console.log(`\n🏷️  Category Distribution:`)
    console.log(`⭐ Premium: ${categorized.premium.length}`)
    console.log(`✓  Quality: ${categorized.quality.length}`)
    console.log(`💰 Budget: ${categorized.budget.length}`)
    
    // Show budget tires if any
    if (categorized.budget.length > 0) {
      console.log(`\n💰 Budget Tires (${categorized.budget.length}):`)
      categorized.budget.slice(0, 5).forEach(tire => {
        console.log(`  • ${tire.brand} ${tire.model}`)
        console.log(`    EU Labels: Fuel=${tire.labelFuelEfficiency || 'N/A'} | Wet=${tire.labelWetGrip || 'N/A'} | Noise=${tire.labelNoise || 'N/A'}`)
        console.log(`    Price: €${tire.price}`)
      })
    } else {
      console.log(`\n❌ No budget tires found after filtering!`)
      console.log(`\nReason: Budget tires typically have:`)
      console.log(`- Lower load indices (often <91)`)
      console.log(`- Lower speed ratings (often <Y)`)
      console.log(`- These get filtered out by safety requirements`)
    }
    
    // Show quality tires sample
    console.log(`\n✓  Quality Tires (${categorized.quality.length}) - Sample:`)
    categorized.quality.slice(0, 3).forEach(tire => {
      console.log(`  • ${tire.brand} ${tire.model}`)
      console.log(`    EU Labels: Fuel=${tire.labelFuelEfficiency || 'N/A'} | Wet=${tire.labelWetGrip || 'N/A'} | Noise=${tire.labelNoise || 'N/A'}`)
      console.log(`    Price: €${tire.price}`)
    })
    
    // Show premium tires sample
    console.log(`\n⭐ Premium Tires (${categorized.premium.length}) - Sample:`)
    categorized.premium.slice(0, 3).forEach(tire => {
      console.log(`  • ${tire.brand} ${tire.model}`)
      console.log(`    EU Labels: Fuel=${tire.labelFuelEfficiency || 'N/A'} | Wet=${tire.labelWetGrip || 'N/A'} | Noise=${tire.labelNoise || 'N/A'}`)
      console.log(`    Price: €${tire.price}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeTireCategories()
