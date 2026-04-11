import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdminOrEmployee } from '@/lib/permissions';

export async function GET() {
  try {
    const authError = await requireAdminOrEmployee();
    if (authError) return authError;

    // Fetch all customers with their direct bookings
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
            latitude: true,
            longitude: true,
          }
        },
        directBookings: {
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED', 'PAID'] }
          },
          select: {
            id: true,
            totalPrice: true,
            status: true,
          }
        }
      }
    });

    // Fetch all workshops with their direct bookings
    const workshops = await prisma.workshop.findMany({
      select: {
        id: true,
        companyName: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            phone: true,
            street: true,
            city: true,
            zipCode: true,
            latitude: true,
            longitude: true,
          }
        },
        directBookings: {
          where: {
            status: { in: ['CONFIRMED', 'COMPLETED', 'PAID'] }
          },
          select: {
            id: true,
            totalPrice: true,
            status: true,
          }
        }
      }
    });

    // Calculate statistics per postal code
    const postalCodeStats: Record<string, {
      zipCode: string;
      customers: number;
      workshops: number;
      bookings: number;
      revenue: number;
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
          bookings: 0,
          revenue: 0,
          coverage: 0
        };
      }
      
      postalCodeStats[zipCode].customers++;
      postalCodeStats[zipCode].bookings += customer.directBookings.length;
      postalCodeStats[zipCode].revenue += customer.directBookings.reduce(
        (sum, b) => sum + Number(b.totalPrice || 0), 0
      );
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
          bookings: 0,
          revenue: 0,
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
    const totalBookings = customers.reduce((sum, c) => sum + c.directBookings.length, 0);
    const totalRevenue = workshops.reduce((sum, w) => 
      sum + w.directBookings.reduce((s, b) => s + Number(b.totalPrice || 0), 0), 0
    );

    return NextResponse.json({
      customers: customers.map(c => ({
        id: c.id,
        name: c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Unbekannt',
        email: c.user?.email || '',
        phone: c.user?.phone || null,
        address: c.user?.street || null,
        city: c.user?.city || null,
        zipCode: c.user?.zipCode || null,
        latitude: c.user?.latitude || null,
        longitude: c.user?.longitude || null,
        createdAt: c.createdAt,
        bookingsCount: c.directBookings.length,
        totalRevenue: c.directBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0)
      })),
      workshops: workshops.map(w => ({
        id: w.id,
        name: w.companyName,
        email: w.user?.email || '',
        phone: w.user?.phone || null,
        address: w.user?.street || null,
        city: w.user?.city || null,
        zipCode: w.user?.zipCode || null,
        latitude: w.user?.latitude || null,
        longitude: w.user?.longitude || null,
        hasSepaMandateActive: false,
        createdAt: w.createdAt,
        bookingsCount: w.directBookings.length,
        totalRevenue: w.directBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0)
      })),
      postalCodeStats: Object.values(postalCodeStats).sort((a, b) => 
        b.bookings - a.bookings
      ),
      overallStats: {
        totalCustomers,
        totalWorkshops,
        totalBookings,
        totalRevenue: totalRevenue.toFixed(2),
      },
    });

  } catch (error) {
    console.error('Error fetching territories data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch territories data' },
      { status: 500 }
    );
  }
}
