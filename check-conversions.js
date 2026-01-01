const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConversions() {
  try {
    console.log('=== Checking Affiliate Conversions ===\n');
    
    // Get all conversions
    const conversions = await prisma.affiliateConversion.findMany({
      orderBy: { convertedAt: 'desc' },
      take: 10,
      include: {
        influencer: {
          select: {
            code: true,
            email: true
          }
        },
        customer: {
          select: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${conversions.length} conversions\n`);
    
    conversions.forEach((conv, idx) => {
      console.log(`${idx + 1}. Conversion ID: ${conv.id}`);
      console.log(`   Type: ${conv.type}`);
      console.log(`   Influencer: ${conv.influencer.code} (${conv.influencer.email})`);
      console.log(`   Customer: ${conv.customer?.user?.email || 'N/A'}`);
      console.log(`   Commission: €${conv.commissionAmount / 100}`);
      console.log(`   Converted: ${conv.convertedAt}`);
      console.log(`   Paid: ${conv.isPaid}\n`);
    });

    // Count by type
    const registrations = conversions.filter(c => c.type === 'REGISTRATION').length;
    const offers = conversions.filter(c => c.type === 'OFFER_ACCEPTED').length;
    
    console.log(`\nBreakdown:`);
    console.log(`- Registrations: ${registrations}`);
    console.log(`- Offers Accepted: ${offers}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConversions();
