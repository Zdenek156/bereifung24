import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// POST - Convert Prospect to Workshop
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'b24_employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get prospect
    const prospect = await prisma.prospectWorkshop.findUnique({
      where: { id: params.id }
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    if (prospect.convertedToWorkshopId) {
      return NextResponse.json(
        { error: 'Prospect already converted' },
        { status: 400 }
      );
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create workshop
    const workshop = await prisma.workshop.create({
      data: {
        name: prospect.name,
        email,
        password: hashedPassword,
        phone: prospect.phone || '',
        address: prospect.address,
        city: prospect.city,
        postalCode: prospect.postalCode,
        website: prospect.website,
        // Transfer pricing data
        baseInstallationPrice: 0,
        pricePerTire: 0,
        // Set initial status
        isActive: true,
        // Link back to prospect
        prospectSource: {
          connect: { id: params.id }
        }
      }
    });

    // Update prospect status
    await prisma.prospectWorkshop.update({
      where: { id: params.id },
      data: {
        status: 'WON',
        convertedToWorkshopId: workshop.id
      }
    });

    // Create final interaction
    await prisma.prospectInteraction.create({
      data: {
        prospectId: params.id,
        type: 'CONTRACT',
        notes: `Erfolgreich zu Werkstatt konvertiert (ID: ${workshop.id})`,
        outcome: 'SUCCESS',
        channel: 'SYSTEM',
        createdById: session.user.id
      }
    });

    return NextResponse.json({ 
      success: true,
      workshop: {
        id: workshop.id,
        name: workshop.name,
        email: workshop.email
      }
    });
  } catch (error) {
    console.error('Error converting prospect:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
