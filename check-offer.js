const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== OFFER DATA ===');
    const offer = await prisma.offer.findUnique({
      where: { id: 'cmky1y02b00013c0mpmyd2b0h' },
      include: { tireOptions: true }
    });
    
    console.log('Offer ID:', offer.id);
    console.log('Price:', offer.price);
    console.log('InstallationFee:', offer.installationFee);
    console.log('SelectedTireOptionIds:', offer.selectedTireOptionIds);
    console.log('\n=== TIRE OPTIONS ===');
    offer.tireOptions.forEach(opt => {
      console.log(`- ID: ${opt.id}`);
      console.log(`  Brand: ${opt.brand} ${opt.model}`);
      console.log(`  PricePerTire: ${opt.pricePerTire}`);
      console.log(`  CarTireType: ${opt.carTireType}`);
      console.log(`  Selected: ${offer.selectedTireOptionIds?.includes(opt.id)}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
