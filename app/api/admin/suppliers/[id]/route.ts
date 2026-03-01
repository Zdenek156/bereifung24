import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/suppliers/[id] - Get single supplier
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplier = await prisma.supplierConfig.findUnique({
      where: { id: params.id },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('❌ [API] Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/suppliers/[id] - Update supplier configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, csvDownloadUrl, csvFormat, apiEndpoint, apiEnabled, isActive, description } = body;

    const supplier = await prisma.supplierConfig.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        csvDownloadUrl: csvDownloadUrl !== undefined ? csvDownloadUrl : undefined,
        csvFormat: csvFormat !== undefined ? csvFormat : undefined,
        apiEndpoint: apiEndpoint !== undefined ? apiEndpoint : undefined,
        apiEnabled: apiEnabled !== undefined ? apiEnabled : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    console.log(`✅ [API] Supplier updated: ${supplier.code} (${supplier.name})`);

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('❌ [API] Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/suppliers/[id] - Delete supplier configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if supplier has catalog entries
    const catalogCount = await prisma.tireCatalog.count({
      where: { supplier: params.id },
    });

    if (catalogCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete supplier with ${catalogCount} catalog entries. Delete catalog entries first.` },
        { status: 409 }
      );
    }

    await prisma.supplierConfig.delete({
      where: { id: params.id },
    });

    console.log(`✅ [API] Supplier deleted: ${params.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [API] Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
