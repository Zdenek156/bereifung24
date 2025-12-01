import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all customers with their tire requests
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            street: true,
            city: true,
            zipCode: true,
          }
        },
        tireRequests: {
          select: {
            id: true,
            season: true,
            createdAt: true,
            offers: {
              select: {
                id: true,
                status: true,
              }
            }
          }
        }
      }
    });

    // Fetch all workshops with their details
    const workshops = await prisma.workshop.findMany({
      select: {
        id: true,
        companyName: true,
        isActive: true,
        gocardlessMandateStatus: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            phone: true,
            street: true,
            city: true,
            zipCode: true,
          }
        },
        offers: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          }
        }
      }
    });

    // Calculate statistics per postal code
    const postalCodeStats: Record<string, {
      zipCode: string;
      customers: number;
      workshops: number;
      requests: number;
      offers: number;
      acceptedOffers: number;
      coverage: number;
    }> = {};

    // Process customers
    customers.forEach(customer => {
      const zipCode = customer.user?.zipCode;
      if (!zipCode) return;
      
      if (!postalCodeStats[zipCode]) {
        postalCodeStats[zipCode] = {
          zipCode: zipCode,
          customers: 0,
          workshops: 0,
          requests: 0,
          offers: 0,
          acceptedOffers: 0,
          coverage: 0
        };
      }
      
      postalCodeStats[zipCode].customers++;
      postalCodeStats[zipCode].requests += customer.tireRequests.length;
      
      customer.tireRequests.forEach(request => {
        postalCodeStats[zipCode].offers += request.offers.length;
        postalCodeStats[zipCode].acceptedOffers += request.offers.filter(o => o.status === 'ACCEPTED').length;
      });
    });

    // Process workshops
    workshops.forEach(workshop => {
      const zipCode = workshop.user?.zipCode;
      if (!zipCode) return;
      
      if (!postalCodeStats[zipCode]) {
        postalCodeStats[zipCode] = {
          zipCode: zipCode,
          customers: 0,
          workshops: 0,
          requests: 0,
          offers: 0,
          acceptedOffers: 0,
          coverage: 0
        };
      }
      
      postalCodeStats[zipCode].workshops++;
    });

    // Calculate coverage (workshops / customers ratio)
    Object.values(postalCodeStats).forEach(stats => {
      if (stats.customers > 0) {
        stats.coverage = (stats.workshops / stats.customers) * 100;
      }
    });

    // Overall statistics
    const totalCustomers = customers.length;
    const totalWorkshops = workshops.length;
    const activeWorkshops = workshops.filter(w => w.isActive).length;
    const workshopsWithSepa = workshops.filter(w => w.gocardlessMandateStatus === 'active').length;
    const totalRequests = customers.reduce((sum, c) => sum + c.tireRequests.length, 0);
    const totalOffers = workshops.reduce((sum, w) => sum + w.offers.length, 0);
    const acceptedOffers = workshops.reduce((sum, w) => 
      sum + w.offers.filter(o => o.status === 'ACCEPTED').length, 0
    );
    
    // Tire season distribution
    const seasonDistribution: Record<string, number> = {};
    customers.forEach(customer => {
      customer.tireRequests.forEach(request => {
        seasonDistribution[request.season] = (seasonDistribution[request.season] || 0) + 1;
      });
    });

    return NextResponse.json({
      customers: customers.map(c => ({
        id: c.id,
        name: c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Unbekannt',
        email: c.user?.email || '',
        phone: c.user?.phone || null,
        address: c.user?.street || null,
        city: c.user?.city || null,
        zipCode: c.user?.zipCode || null,
        createdAt: c.createdAt,
        requestsCount: c.tireRequests.length,
        offersCount: c.tireRequests.reduce((sum, r) => sum + r.offers.length, 0),
        acceptedOffersCount: c.tireRequests.reduce((sum, r) => 
          sum + r.offers.filter(o => o.status === 'ACCEPTED').length, 0
        )
      })),
      workshops: workshops.map(w => ({
        id: w.id,
        name: w.companyName,
        email: w.user?.email || '',
        phone: w.user?.phone || null,
        address: w.user?.street || null,
        city: w.user?.city || null,
        zipCode: w.user?.zipCode || null,
        isActive: w.isActive,
        hasSepaMandateActive: w.gocardlessMandateStatus === 'active',
        createdAt: w.createdAt,
        offersCount: w.offers.length,
        acceptedOffersCount: w.offers.filter(o => o.status === 'ACCEPTED').length,
        totalRevenue: w.offers
          .filter(o => o.status === 'ACCEPTED')
          .reduce((sum, o) => sum + (o.totalPrice || 0), 0)
      })),
      postalCodeStats: Object.values(postalCodeStats).sort((a, b) => 
        b.requests - a.requests
      ),
      overallStats: {
        totalCustomers,
        totalWorkshops,
        activeWorkshops,
        workshopsWithSepa,
        totalRequests,
        totalOffers,
        acceptedOffers,
        conversionRate: totalOffers > 0 ? (acceptedOffers / totalOffers * 100).toFixed(2) : '0',
        averageOffersPerRequest: totalRequests > 0 ? (totalOffers / totalRequests).toFixed(2) : '0'
      },
      serviceTypeDistribution: seasonDistribution
    });

  } catch (error) {
    console.error('Error fetching territories data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch territories data' },
      { status: 500 }
    );
  }
}
