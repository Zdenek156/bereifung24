import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSalesUser } from '@/lib/sales-auth';
import bcrypt from 'bcryptjs';

/**
 * POST /api/sales/prospects/[id]/convert
 * Convert a prospect into an active workshop
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get prospect by googlePlaceId (since route param is googlePlaceId)
    const prospect = await prisma.prospectWorkshop.findUnique({
      where: { googlePlaceId: params.id }
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    // Check if already converted
    if (prospect.convertedToWorkshopId) {
      return NextResponse.json(
        { error: 'Prospect already converted', workshopId: prospect.convertedToWorkshopId },
        { status: 400 }
      );
    }

    // Get request body for email
    const body = await request.json();
    const { email } = body;

    // Use prospect email or provided email
    const workshopEmail = email || prospect.email;

    if (!workshopEmail) {
      return NextResponse.json(
        { error: 'Email address required for workshop creation' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: workshopEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address already in use' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate unique customer number
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const customerNumber = `WS-${dateStr}-${randomStr}`;

    // Create workshop user
    const user = await prisma.user.create({
      data: {
        email: workshopEmail,
        password: hashedPassword,
        role: 'WORKSHOP',
        isVerified: false, // Requires email verification
        city: prospect.city,
        postalCode: prospect.postalCode
      }
    });

    // Create workshop
    const workshop = await prisma.workshop.create({
      data: {
        userId: user.id,
        customerNumber,
        companyName: prospect.name,
        website: prospect.website,
        
        // Initial verification status
        isVerified: false,
        
        // Email notifications (all enabled by default)
        emailNotifyRequests: true,
        emailNotifyOfferAccepted: true,
        emailNotifyBookings: true,
        emailNotifyReviews: true,
        emailNotifyReminders: true,
        emailNotifyCommissions: true
      }
    });

    // Update prospect with conversion info
    await prisma.prospectWorkshop.update({
      where: { id: prospect.id },
      data: {
        status: 'CONVERTED',
        convertedToWorkshopId: workshop.id,
        convertedAt: new Date()
      }
    });

    // Create interaction log
    await prisma.prospectInteraction.create({
      data: {
        prospectId: prospect.id,
        type: 'NOTE',
        notes: `Prospect converted to Workshop (ID: ${workshop.id}, Customer: ${customerNumber})`,
        createdById: employee.id,
        channel: 'SYSTEM'
      }
    });

    // TODO: Send welcome email with credentials

    return NextResponse.json({
      success: true,
      workshop: {
        id: workshop.id,
        customerNumber: customerNumber,
        companyName: workshop.companyName,
        email: user.email
      },
      tempPassword // Send temp password (should be sent via email in production)
    });
  } catch (error) {
    console.error('Error converting prospect:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
