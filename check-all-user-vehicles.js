const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find user first
    const user = await prisma.user.findUnique({
      where: { email: 'zdenek156@gmail.com' },
      select: { id: true }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User ID:', user.id);
    console.log('');
    
    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    
    if (!customer) {
      console.log('Customer not found');
      return;
    }
    
    console.log('Customer ID:', customer.id);
    console.log('');
    
    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: { customerId: customer.id },
      select: {
        id: true,
        make: true,
        model: true,
        summerTires: true,
        winterTires: true,
        allSeasonTires: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('=== ALL VEHICLES ===');
    console.log('Total vehicles:', vehicles.length);
    console.log('');
    
    vehicles.forEach((vehicle, index) => {
      console.log(`${index + 1}. ${vehicle.make} ${vehicle.model}`);
      console.log('   ID:', vehicle.id);
      
      // Parse summer tires
      if (vehicle.summerTires) {
        try {
          const s = typeof vehicle.summerTires === 'string' ? JSON.parse(vehicle.summerTires) : vehicle.summerTires;
          console.log('   ✅ Sommerreifen:', `${s.width}/${s.aspectRatio} R${s.diameter}`);
        } catch (e) {
          console.log('   ⚠️  Sommerreifen: Parse Error', vehicle.summerTires.substring(0, 50));
        }
      } else {
        console.log('   ❌ Sommerreifen: NULL');
      }
      
      // Parse winter tires
      if (vehicle.winterTires) {
        try {
          const w = typeof vehicle.winterTires === 'string' ? JSON.parse(vehicle.winterTires) : vehicle.winterTires;
          console.log('   ✅ Winterreifen:', `${w.width}/${w.aspectRatio} R${w.diameter}`);
        } catch (e) {
          console.log('   ⚠️  Winterreifen: Parse Error');
        }
      } else {
        console.log('   ❌ Winterreifen: NULL');
      }
      
      // Parse all season tires
      if (vehicle.allSeasonTires) {
        try {
          const g = typeof vehicle.allSeasonTires === 'string' ? JSON.parse(vehicle.allSeasonTires) : vehicle.allSeasonTires;
          console.log('   ✅ Ganzjahresreifen:', `${g.width}/${g.aspectRatio} R${g.diameter}`);
        } catch (e) {
          console.log('   ⚠️  Ganzjahresreifen: Parse Error');
        }
      } else {
        console.log('   ❌ Ganzjahresreifen: NULL');
      }
      
      console.log('');
    });
    
    // Focus on Skoda
    const skoda = vehicles.find(v => v.make === 'Skoda');
    if (skoda && skoda.summerTires) {
      console.log('=== SKODA SUMMER TIRES (RAW JSON) ===');
      console.log(skoda.summerTires);
      console.log('');
      
      const parsed = typeof skoda.summerTires === 'string' ? JSON.parse(skoda.summerTires) : skoda.summerTires;
      console.log('=== SKODA SUMMER TIRES (PARSED) ===');
      console.log(JSON.stringify(parsed, null, 2));
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
