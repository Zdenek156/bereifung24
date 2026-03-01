import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'

/**
 * POST /api/workshop/tyresystem/import
 * 
 * Import TyreSystem tire catalog CSV into WorkshopInventory
 * 
 * CSV Format (TyreSystem Standard):
 * ArticleNumber,EAN,Brand,Model,Width,Height,Diameter,Season,LoadIndex,SpeedIndex,
 * RunFlat,3PMSF,FuelEfficiency,WetGrip,Noise,NoiseClass,Price,Stock
 * 
 * Body: FormData with "file" field
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true }
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Read CSV content
    const buffer = Buffer.from(await file.arrayBuffer())
    const csvContent = buffer.toString('utf-8')

    console.log(`📂 [TyreSystem Import] Processing CSV: ${file.name} (${buffer.length} bytes)`)

    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ',',
      bom: true, // Handle UTF-8 BOM
    })

    console.log(`📊 [TyreSystem Import] Found ${records.length} records`)

    // Map season codes (s=Summer, w=Winter, g=All-season)
    const mapSeason = (season: string): string => {
      const s = season.toLowerCase()
      if (s.includes('sommer') || s === 'summer' || s === 's') return 's'
      if (s.includes('winter') || s === 'w') return 'w'
      if (s.includes('ganz') || s.includes('all') || s === 'g') return 'g'
      return s
    }

    // Prepare bulk insert/update
    const imported: any[] = []
    const errors: any[] = []
    let updated = 0
    let created = 0

    for (const record of records) {
      try {
        // Skip invalid records
        if (!record.ArticleNumber || !record.Width || !record.Height || !record.Diameter) {
          errors.push({ record, error: 'Missing required fields' })
          continue
        }

        // Parse numeric values
        const price = parseFloat(record.Price || '0')
        const stock = parseInt(record.Stock || '0')
        
        if (isNaN(price) || price <= 0) {
          errors.push({ record, error: 'Invalid price' })
          continue
        }

        // Prepare data
        const tireData = {
          workshopId: user.workshop.id,
          articleNumber: record.ArticleNumber,
          ean: record.EAN || null,
          brand: record.Brand || 'Unknown',
          model: record.Model || '',
          width: record.Width,
          height: record.Height,
          diameter: record.Diameter,
          season: mapSeason(record.Season || 's'),
          loadIndex: record.LoadIndex || null,
          speedIndex: record.SpeedIndex || null,
          runFlat: record.RunFlat === '1' || record.RunFlat?.toLowerCase() === 'true',
          threePMSF: record['3PMSF'] === '1' || record['3PMSF']?.toLowerCase() === 'true',
          labelFuelEfficiency: record.FuelEfficiency || null,
          labelWetGrip: record.WetGrip || null,
          labelNoise: record.Noise ? parseInt(record.Noise) : null,
          labelNoiseClass: record.NoiseClass || null,
          price, // This is purchase price (EK)
          stock,
          supplier: 'TYRESYSTEM',
          vehicleType: 'PKW', // Can be enhanced with detection logic
        }

        // Upsert (create or update)
        const existing = await prisma.workshopInventory.findFirst({
          where: {
            workshopId: user.workshop.id,
            articleNumber: record.ArticleNumber,
            supplier: 'TYRESYSTEM'
          }
        })

        if (existing) {
          // Update existing
          await prisma.workshopInventory.update({
            where: { id: existing.id },
            data: {
              price,
              stock,
              model: tireData.model,
              // Update other fields that might have changed
              labelFuelEfficiency: tireData.labelFuelEfficiency,
              labelWetGrip: tireData.labelWetGrip,
              labelNoise: tireData.labelNoise,
            }
          })
          updated++
        } else {
          // Create new
          await prisma.workshopInventory.create({
            data: tireData
          })
          created++
        }

        imported.push({
          articleNumber: record.ArticleNumber,
          brand: record.Brand,
          model: record.Model,
          size: `${record.Width}/${record.Height} R${record.Diameter}`,
          price
        })

      } catch (error) {
        errors.push({
          record,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Update supplier last sync
    await prisma.workshopSupplier.updateMany({
      where: {
        workshopId: user.workshop.id,
        supplier: 'TYRESYSTEM'
      },
      data: {
        lastCsvSync: new Date(),
        csvSyncStatus: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
        csvSyncError: errors.length > 0 
          ? `${errors.length} errors, first: ${errors[0]?.error}` 
          : null
      }
    })

    console.log(`✅ [TyreSystem Import] Completed: ${created} created, ${updated} updated, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      summary: {
        totalRecords: records.length,
        created,
        updated,
        errors: errors.length,
        imported: imported.slice(0, 10) // Show first 10
      },
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined // Show first 5 errors
    })

  } catch (error) {
    console.error('❌ [TyreSystem Import] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Import failed'
    }, { status: 500 })
  }
}
