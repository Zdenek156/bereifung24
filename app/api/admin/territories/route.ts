import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

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
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        zipCode: true,
        createdAt: true,
        tireRequests: {
          select: {
            id: true,
            serviceType: true,
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
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        zipCode: true,
        isActive: true,
        gocardlessMandateStatus: true,
        createdAt: true,
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
      if (!customer.zipCode) return;
      
      if (!postalCodeStats[customer.zipCode]) {
        postalCodeStats[customer.zipCode] = {
          zipCode: customer.zipCode,
          customers: 0,
          workshops: 0,
          requests: 0,
          offers: 0,
          acceptedOffers: 0,
          coverage: 0
        };
      }
      
      postalCodeStats[customer.zipCode].customers++;
      postalCodeStats[customer.zipCode].requests += customer.tireRequests.length;
      
      customer.tireRequests.forEach(request => {
        postalCodeStats[customer.zipCode].offers += request.offers.length;
        postalCodeStats[customer.zipCode].acceptedOffers += request.offers.filter(o => o.status === 'ACCEPTED').length;
      });
    });

    // Process workshops
    workshops.forEach(workshop => {
      if (!workshop.zipCode) return;
      
      if (!postalCodeStats[workshop.zipCode]) {
        postalCodeStats[workshop.zipCode] = {
          zipCode: workshop.zipCode,
          customers: 0,
          workshops: 0,
          requests: 0,
          offers: 0,
          acceptedOffers: 0,
          coverage: 0
        };
      }
      
      postalCodeStats[workshop.zipCode].workshops++;
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
    
    // Service type distribution
    const serviceTypes: Record<string, number> = {};
    customers.forEach(customer => {
      customer.tireRequests.forEach(request => {
        serviceTypes[request.serviceType] = (serviceTypes[request.serviceType] || 0) + 1;
      });
    });

    return NextResponse.json({
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        zipCode: c.zipCode,
        createdAt: c.createdAt,
        requestsCount: c.tireRequests.length,
        offersCount: c.tireRequests.reduce((sum, r) => sum + r.offers.length, 0),
        acceptedOffersCount: c.tireRequests.reduce((sum, r) => 
          sum + r.offers.filter(o => o.status === 'ACCEPTED').length, 0
        )
      })),
      workshops: workshops.map(w => ({
        id: w.id,
        name: w.name,
        email: w.email,
        phone: w.phone,
        address: w.address,
        city: w.city,
        zipCode: w.zipCode,
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
      serviceTypeDistribution: serviceTypes
    });

  } catch (error) {
    console.error('Error fetching territories data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch territories data' },
      { status: 500 }
    );
  }
}
