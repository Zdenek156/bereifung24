const { prisma } = require('./lib/prisma');

(async () => {
  try {
    // Get workshop
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Luxus24' },
      select: { id: true, companyName: true }
    });
    
    if (!workshop) {
      console.log('Workshop not found');
      await prisma.$disconnect();
      return;
    }
    
    console.log('Workshop:', workshop.companyName, '(ID:', workshop.id, ')');
    console.log('\n=== FRONT: 245/35 R21 ===');
    
    // Front tires - using nested relation query
    const frontTires = await prisma.tire.findMany({
      where: {
        width: 245,
        aspectRatio: 35,
        diameter: 21,
        season: 's',
        workshopTires: {
          some: {
            workshopId: workshop.id
          }
        }
      },
      select: {
        brand: true,
        model: true,
        season: true,
        workshopTires: {
          where: {
            workshopId: workshop.id
          },
          select: {
            pricePerTire: true
          }
        }
      },
      take: 10
    });
    
    const frontTiresFlat = frontTires.map(t => ({
      brand: t.brand,
      model: t.model,
      pricePerTire: t.workshopTires[0]?.pricePerTire || 0
    })).sort((a, b) => a.pricePerTire - b.pricePerTire);
    
    frontTiresFlat.forEach(t => {
      console.log(`- ${t.brand} ${t.model} (${t.pricePerTire}€)`);
    });
    
    console.log('\n=== REAR: 275/30 R21 ===');
    
    // Rear tires - using nested relation query
    const rearTires = await prisma.tire.findMany({
      where: {
        width: 275,
        aspectRatio: 30,
        diameter: 21,
        season: 's',
        workshopTires: {
          some: {
            workshopId: workshop.id
          }
        }
      },
      select: {
        brand: true,
        model: true,
        season: true,
        workshopTires: {
          where: {
            workshopId: workshop.id
          },
          select: {
            pricePerTire: true
          }
        }
      },
      take: 10
    });
    
    const rearTiresFlat = rearTires.map(t => ({
      brand: t.brand,
      model: t.model,
      pricePerTire: t.workshopTires[0]?.pricePerTire || 0
    })).sort((a, b) => a.pricePerTire - b.pricePerTire);
    
    rearTiresFlat.forEach(t => {
      console.log(`- ${t.brand} ${t.model} (${t.pricePerTire}€)`);
    });
    
    // Check for matching brands
    const frontBrands = [...new Set(frontTiresFlat.map(t => t.brand.toLowerCase()))];
    const rearBrands = [...new Set(rearTiresFlat.map(t => t.brand.toLowerCase()))];
    const matching = frontBrands.filter(b => rearBrands.includes(b));
    
    console.log('\n=== MATCHING BRANDS ===');
    if (matching.length > 0) {
      console.log('Found matching brands:', matching);
      
      // Show matching combinations
      for (const brand of matching) {
        const frontMatch = frontTiresFlat.find(t => t.brand.toLowerCase() === brand);
        const rearMatch = rearTiresFlat.find(t => t.brand.toLowerCase() === brand);
        console.log(`\n${brand.toUpperCase()}:`);
        console.log(`  Front: ${frontMatch.model} (${frontMatch.pricePerTire}€)`);
        console.log(`  Rear: ${rearMatch.model} (${rearMatch.pricePerTire}€)`);
        console.log(`  Total: ${(frontMatch.pricePerTire * 2 + rearMatch.pricePerTire * 2).toFixed(2)}€`);
      }
    } else {
      console.log('❌ NO MATCHING BRANDS FOUND');
      console.log('Front brands:', frontBrands);
      console.log('Rear brands:', rearBrands);
    }
    
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
