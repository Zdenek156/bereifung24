const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestRegistration() {
  try {
    console.log('=== Checking Latest Customer Registration ===\n');
    
    // Get latest customer
    const latestCustomer = await prisma.customer.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            emailVerified: true
          }
        }
      }
    });

    if (latestCustomer) {
      console.log('Latest Customer:');
      console.log(`- Name: ${latestCustomer.user.firstName} ${latestCustomer.user.lastName}`);
      console.log(`- Email: ${latestCustomer.user.email}`);
      console.log(`- Registered: ${latestCustomer.user.createdAt}`);
      console.log(`- Email Verified: ${latestCustomer.user.emailVerified || 'Not yet'}\n`);
    }

    // Check for conversions
    const conversions = await prisma.affiliateConversion.findMany({
      where: {
        customerId: latestCustomer?.id
      },
      include: {
        influencer: {
          select: { code: true }
        }
      }
    });

    console.log(`Conversions for this customer: ${conversions.length}`);
    conversions.forEach(c => {
      console.log(`- Type: ${c.type}, Influencer: ${c.influencer.code}, Amount: €${c.commissionAmount / 100}`);
    });

    // Check clicks
    const clicks = await prisma.affiliateClick.findMany({
      orderBy: { clickedAt: 'desc' },
      take: 5,
      include: {
        influencer: {
          select: { code: true }
        }
      }
    });

    console.log(`\nRecent Clicks (last 5):`);
    clicks.forEach((click, idx) => {
      console.log(`${idx + 1}. Influencer: ${click.influencer.code}, CookieId: ${click.cookieId}, Created: ${click.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestRegistration();
