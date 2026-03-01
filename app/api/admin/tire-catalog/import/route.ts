import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseCSV, mapTyreSystemCSV } from '@/lib/utils/csvParser';

interface ImportStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// POST /api/admin/tire-catalog/import - Import tires from CSV
export async function POST(request: NextRequest) {
  try {
    // Check if this is an internal cron call
    const isCronInternal = request.headers.get('x-cron-internal') === 'true';
    let userId: string | null = null;

    // For normal requests, require admin session
    if (!isCronInternal) {
      const session = await getServerSession(authOptions);

      if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = session.user.id;
    } else {
      console.log('🤖 [IMPORT] Internal cron job request detected');
      userId = 'cron-system'; // System user for cron imports
    }

    const body = await request.json();
    const { supplierCode, csvContent, csvFormat = 'TYRESYSTEM' } = body;

    if (!supplierCode || !csvContent) {
      return NextResponse.json(
        { error: 'supplierCode and csvContent are required' },
        { status: 400 }
      );
    }

    // Verify supplier exists
    const supplier = await prisma.supplierConfig.findUnique({
      where: { code: supplierCode },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    console.log(`📥 [IMPORT] Starting CSV import for supplier: ${supplierCode}`);
    console.log(`📋 [IMPORT] Filter: Only PKW and Motorrad tires with EU labels`);

    // Parse CSV (TyreSystem uses semicolon as delimiter)
    const parseResult = parseCSV(csvContent, ';');

    if (parseResult.errors.length > 0) {
      console.warn(`⚠️ [IMPORT] CSV parsing errors:`, parseResult.errors.slice(0, 10)); // Log first 10 errors
    }

    const stats: ImportStats = {
      total: parseResult.rows.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: parseResult.errors,
    };

    // Process each row
    for (const row of parseResult.rows) {
      try {
        const tireData = mapTyreSystemCSV(row);

        if (!tireData) {
          stats.skipped++;
          stats.errors.push(`Skipped row: Missing required fields`);
          continue;
        }

        // Check if tire already exists
        const existing = await prisma.tireCatalog.findUnique({
          where: {
            supplier_articleId: {
              supplier: supplierCode,
              articleId: tireData.articleId,
            },
          },
        });

        if (existing) {
          // Update existing tire with EU labels
          await prisma.tireCatalog.update({
            where: { id: existing.id },
            data: {
              ean: tireData.ean,
              brand: tireData.brand,
              model: tireData.model,
              width: tireData.width,
              height: tireData.height,
              diameter: tireData.diameter,
              season: tireData.season,
              vehicleType: tireData.vehicleType,
              loadIndex: tireData.loadIndex,
              speedIndex: tireData.speedIndex,
              runFlat: tireData.runFlat || false,
              threePMSF: tireData.threePMSF || false,
              labelFuelEfficiency: tireData.labelFuelEfficiency,
              labelWetGrip: tireData.labelWetGrip,
              labelNoise: tireData.labelNoise,
              labelNoiseClass: tireData.labelNoiseClass,
              lastSync: new Date(),
              importedBy: userId || 'system',
            },
          });
          stats.updated++;
        } else {
          // Create new tire with EU labels
          await prisma.tireCatalog.create({
            data: {
              supplier: supplierCode,
              articleId: tireData.articleId,
              ean: tireData.ean,
              brand: tireData.brand,
              model: tireData.model,
              width: tireData.width,
              height: tireData.height,
              diameter: tireData.diameter,
              season: tireData.season,
              vehicleType: tireData.vehicleType,
              loadIndex: tireData.loadIndex,
              speedIndex: tireData.speedIndex,
              runFlat: tireData.runFlat || false,
              threePMSF: tireData.threePMSF || false,
              labelFuelEfficiency: tireData.labelFuelEfficiency,
              labelWetGrip: tireData.labelWetGrip,
              labelNoise: tireData.labelNoise,
              labelNoiseClass: tireData.labelNoiseClass,
              lastSync: new Date(),
              importedBy: userId || 'system',
              isActive: true,
            },
          });
          stats.imported++;
        }
      } catch (error) {
        stats.skipped++;
        stats.errors.push(
          `Error processing article ${row['ArticleId'] || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Update supplier last import timestamp
    await prisma.supplierConfig.update({
      where: { code: supplierCode },
      data: {
        lastCsvImport: new Date(),
        csvImportedBy: userId,
      },
    });

    console.log(
      `✅ [IMPORT] Completed: ${stats.imported} imported, ${stats.updated} updated, ${stats.skipped} skipped`
    );

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ [API] Error importing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
