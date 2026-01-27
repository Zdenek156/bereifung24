import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getApiSetting } from '@/lib/api-settings'
import AdmZip from 'adm-zip'

/**
 * POST /api/admin/eprel/import
 * Download EPREL tire database (ZIP), extract, and import into database
 * This should be run weekly via cron or manually by admin
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admin can trigger import
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    // Check if import is already running
    const runningImport = await prisma.ePRELImport.findFirst({
      where: { status: 'RUNNING' },
      orderBy: { startedAt: 'desc' }
    })

    if (runningImport) {
      return NextResponse.json({
        error: 'Import läuft bereits',
        importId: runningImport.id
      }, { status: 409 })
    }

    // Create import record
    const importRecord = await prisma.ePRELImport.create({
      data: {
        status: 'RUNNING',
        tiresImported: 0,
        tiresUpdated: 0,
        tiresDeleted: 0
      }
    })

    // Start import in background (don't wait for completion)
    importEPRELData(importRecord.id).catch(error => {
      console.error('EPREL import failed:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'EPREL Import gestartet',
      importId: importRecord.id
    })

  } catch (error) {
    console.error('Error starting EPREL import:', error)
    return NextResponse.json(
      { error: 'Fehler beim Starten des Imports' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/eprel/import?importId=xxx
 * Check status of import
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const importId = searchParams.get('importId')

    if (importId) {
      // Get specific import status
      const importRecord = await prisma.ePRELImport.findUnique({
        where: { id: importId }
      })

      if (!importRecord) {
        return NextResponse.json({ error: 'Import nicht gefunden' }, { status: 404 })
      }

      return NextResponse.json(importRecord)
    } else {
      // Get latest imports
      const imports = await prisma.ePRELImport.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10
      })

      return NextResponse.json(imports)
    }

  } catch (error) {
    console.error('Error fetching import status:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Import-Status' },
      { status: 500 }
    )
  }
}

/**
 * Background function to import EPREL data
 */
async function importEPRELData(importId: string) {
  const startTime = Date.now()
  
  try {
    console.log('[EPREL Import] Starting import...')

    // Get API key
    const apiKey = await getApiSetting('EPREL_API_KEY')
    
    if (!apiKey) {
      throw new Error('EPREL API Key nicht konfiguriert')
    }

    // Download ZIP file from EPREL API
    console.log('[EPREL Import] Downloading ZIP file from EPREL API...')
    const response = await fetch('https://eprel.ec.europa.eu/api/exportProducts/tyres', {
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`EPREL API error: ${response.status} ${response.statusText}`)
    }

    // Get ZIP file as buffer
    const buffer = await response.arrayBuffer()
    console.log(`[EPREL Import] Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`)

    // Extract ZIP file
    console.log('[EPREL Import] Extracting ZIP file...')
    const zip = new AdmZip(Buffer.from(buffer))
    const zipEntries = zip.getEntries()

    console.log(`[EPREL Import] Found ${zipEntries.length} files in ZIP`)

    let totalTires = 0
    let importedCount = 0
    let updatedCount = 0

    // Process each JSON file in ZIP
    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.json')) {
        console.log(`[EPREL Import] Processing ${entry.entryName}...`)
        
        const jsonContent = entry.getData().toString('utf8')
        const tires = JSON.parse(jsonContent)

        if (!Array.isArray(tires)) {
          console.warn(`[EPREL Import] ${entry.entryName} is not an array, skipping`)
          continue
        }

        console.log(`[EPREL Import] Found ${tires.length} tires in ${entry.entryName}`)
        totalTires += tires.length

        // Process tires in batches
        const batchSize = 100
        for (let i = 0; i < tires.length; i += batchSize) {
          const batch = tires.slice(i, i + batchSize)
          
          for (const tire of batch) {
            try {
              // Parse tire dimension (e.g., "205/55R16 91V")
              const dimension = tire.tyreDimension || tire.dimension || ''
              const dimensionMatch = dimension.match(/(\d{3})\/(\d{2})R(\d{2})/)
              
              if (!dimensionMatch) {
                console.warn(`[EPREL Import] Invalid dimension: ${dimension}`)
                continue
              }

              const [, width, aspectRatio, diameter] = dimensionMatch

              // Map season
              const tyreClass = (tire.tyreClass || tire.season || '').toLowerCase()
              
              const tireData = {
                eprelId: tire.id || tire.productId || null,
                supplierName: tire.supplierName || tire.manufacturer || 'Unknown',
                modelName: tire.modelName || tire.commercialName || tire.model || 'Unknown',
                tyreDimension: `${width}/${aspectRatio}R${diameter}`,
                width: parseInt(width),
                aspectRatio: parseInt(aspectRatio),
                diameter: parseInt(diameter),
                loadIndex: tire.loadIndex || null,
                speedRating: tire.speedRating || null,
                tyreClass: tyreClass,
                has3PMSF: tire.hasSnowflake || tire.has3PMSF || tire.snowGrip || false,
                hasIceGrip: tire.hasIceGrip || false,
                fuelEfficiencyClass: tire.fuelEfficiencyClass || tire.rollingResistanceClass || null,
                wetGripClass: tire.wetGripClass || tire.wetGrip || null,
                externalRollingNoiseLevel: tire.externalRollingNoiseLevel ? parseInt(tire.externalRollingNoiseLevel) : null,
                externalRollingNoiseClass: tire.externalRollingNoiseClass || tire.noiseClass || null,
                additionalData: tire,
                dataVersion: new Date().toISOString()
              }

              // Upsert tire (insert or update if exists)
              if (tire.id || tire.productId) {
                const existing = await prisma.ePRELTire.findUnique({
                  where: { eprelId: tire.id || tire.productId }
                })

                if (existing) {
                  await prisma.ePRELTire.update({
                    where: { eprelId: tire.id || tire.productId },
                    data: tireData
                  })
                  updatedCount++
                } else {
                  await prisma.ePRELTire.create({
                    data: tireData
                  })
                  importedCount++
                }
              } else {
                // No unique ID, just insert
                await prisma.ePRELTire.create({
                  data: tireData
                })
                importedCount++
              }

            } catch (tireError) {
              console.error('[EPREL Import] Error processing tire:', tireError)
              // Continue with next tire
            }
          }

          // Update progress
          await prisma.ePRELImport.update({
            where: { id: importId },
            data: {
              tiresImported: importedCount,
              tiresUpdated: updatedCount
            }
          })
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Update import record with success
    await prisma.ePRELImport.update({
      where: { id: importId },
      data: {
        status: 'SUCCESS',
        tiresImported: importedCount,
        tiresUpdated: updatedCount,
        completedAt: new Date(),
        dataVersion: new Date().toISOString()
      }
    })

    console.log(`[EPREL Import] ✅ Import completed successfully in ${duration}s`)
    console.log(`[EPREL Import] Imported: ${importedCount}, Updated: ${updatedCount}, Total: ${totalTires}`)

  } catch (error) {
    console.error('[EPREL Import] ❌ Import failed:', error)

    // Update import record with error
    await prisma.ePRELImport.update({
      where: { id: importId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      }
    })
  }
}
