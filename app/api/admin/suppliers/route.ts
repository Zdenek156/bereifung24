import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/suppliers - Get all supplier configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suppliers = await prisma.supplierConfig.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('❌ [API] Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// POST /api/admin/suppliers - Create new supplier configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, csvDownloadUrl, csvFormat, apiEndpoint, description } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    // Check if supplier code already exists
    const existing = await prisma.supplierConfig.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Supplier with this code already exists' },
        { status: 409 }
      );
    }

    const supplier = await prisma.supplierConfig.create({
      data: {
        code: code.toUpperCase(),
        name,
        csvDownloadUrl: csvDownloadUrl || null,
        csvFormat: csvFormat || null,
        apiEndpoint: apiEndpoint || null,
        description: description || null,
        isActive: true,
      },
    });

    console.log(`✅ [API] Supplier created: ${supplier.code} (${supplier.name})`);

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('❌ [API] Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
