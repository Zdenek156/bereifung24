const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAffiliateDebug() {
  try {
    console.log('=== Affiliate Tracking Debug ===\n');
    
    // Check influencer
    const influencer = await prisma.influencer.findUnique({
      where: { code: 'TURBOGA53' },
      select: {
        id: true,
        code: true,
        email: true,
        isActive: true,
        commissionPerCustomerRegistration: true
      }
    });

    console.log('1. Influencer Check:');
    if (influencer) {
      console.log(`   ✓ Code: ${influencer.code}`);
      console.log(`   ✓ Email: ${influencer.email}`);
      console.log(`   ✓ Active: ${influencer.isActive}`);
      console.log(`   ✓ Commission: €${influencer.commissionPerCustomerRegistration / 100}`);
    } else {
      console.log('   ✗ Influencer not found!\n');
      return;
    }

    // Check clicks
    const clicks = await prisma.affiliateClick.findMany({
      where: { influencerId: influencer.id },
      orderBy: { clickedAt: 'desc' },
      take: 5
    });

    console.log(`\n2. Recent Clicks: ${clicks.length}`);
    clicks.forEach((click, idx) => {
      console.log(`   ${idx + 1}. CookieId: ${click.cookieId}`);
      console.log(`      Clicked at: ${click.clickedAt}`);
      console.log(`      IP: ${click.ipAddress}`);
    });

    // Check conversions
    const conversions = await prisma.affiliateConversion.findMany({
      where: { influencerId: influencer.id },
      orderBy: { convertedAt: 'desc' },
      include: {
        customer: {
          include: {
            user: {
              select: { email: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    console.log(`\n3. Conversions: ${conversions.length}`);
    conversions.forEach((conv, idx) => {
      console.log(`   ${idx + 1}. Type: ${conv.type}`);
      console.log(`      Customer: ${conv.customer?.user?.email || 'N/A'}`);
      console.log(`      Amount: €${conv.commissionAmount / 100}`);
      console.log(`      Converted: ${conv.convertedAt}`);
      console.log(`      CookieId: ${conv.cookieId}`);
    });

    // Check latest customer
    const latestCustomer = await prisma.customer.findFirst({
      where: {
        user: { email: 'info@stylo-app.de' }
      },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
            emailVerified: true
          }
        }
      }
    });

    if (latestCustomer) {
      console.log(`\n4. Latest Test Customer:`);
      console.log(`   Email: ${latestCustomer.user.email}`);
      console.log(`   Registered: ${latestCustomer.user.createdAt}`);
      console.log(`   Email Verified: ${latestCustomer.user.emailVerified || 'No'}`);
      
      // Check if conversion exists for this customer
      const customerConversion = await prisma.affiliateConversion.findFirst({
        where: {
          customerId: latestCustomer.id,
          type: 'REGISTRATION'
        }
      });
      
      console.log(`   Has Conversion: ${customerConversion ? 'YES ✓' : 'NO ✗'}`);
    }

    // Check if there's a matching click for the test customer
    if (latestCustomer && clicks.length > 0) {
      console.log(`\n5. Debug Info:`);
      console.log(`   Latest click cookieId: ${clicks[0]?.cookieId}`);
      console.log(`   Customer registered: ${latestCustomer.user.createdAt}`);
      console.log(`   Latest click time: ${clicks[0]?.clickedAt}`);
      
      const clickBeforeReg = clicks.find(c => new Date(c.clickedAt) < new Date(latestCustomer.user.createdAt));
      console.log(`   Click before registration: ${clickBeforeReg ? 'YES ✓' : 'NO ✗'}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAffiliateDebug();
