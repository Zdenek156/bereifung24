const { PrismaClient } = require('@prisma/client')
const AdmZip = require('adm-zip')

const prisma = new PrismaClient()

async function importEPRELData() {
  const startTime = Date.now()
  let importRecord = null
  let importedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  try {
    console.log('[EPREL Import] Starting import...')
    
    // Create import record using Prisma raw SQL
    const importResult = await prisma.$queryRaw`
      INSERT INTO eprel_imports (status, tires_imported, tires_updated, tires_deleted, started_at)
      VALUES ('RUNNING', 0, 0, 0, NOW())
      RETURNING id
    `
    importRecord = { id: importResult[0].id }
    
    console.log('[EPREL Import] Import ID:', importRecord.id)

    // Get API key
    const setting = await prisma.adminApiSetting.findUnique({
      where: { key: 'EPREL_API_KEY' }
    })
    
    if (!setting || !setting.value) {
      throw new Error('EPREL API Key nicht gefunden')
    }
    
    console.log('[EPREL Import] API Key gefunden')

    // Download ZIP
    console.log('[EPREL Import] Downloading ZIP file from EPREL...')
    const response = await fetch('https://eprel.ec.europa.eu/api/exportProducts/tyres', {
      headers: {
        'X-Api-Key': setting.value,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`EPREL API error: ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    console.log(`[EPREL Import] Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`)

    // Extract ZIP
    console.log('[EPREL Import] Extracting ZIP...')
    const zip = new AdmZip(Buffer.from(buffer))
    const entries = zip.getEntries()

    // Process each JSON file
    for (const entry of entries) {
      if (!entry.entryName.endsWith('.json')) continue

      console.log(`[EPREL Import] Processing ${entry.entryName}...`)
      const jsonContent = entry.getData().toString('utf8')
      const tires = JSON.parse(jsonContent)
      
      console.log(`[EPREL Import] Found ${tires.length} tires`)

      const batchSize = 50
      for (let i = 0; i < tires.length; i += batchSize) {
        const batch = tires.slice(i, i + batchSize)
        
        for (const tire of batch) {
          try {
            // Extract data from EPREL format
            const width = tire.tyreSection || 0
            const aspectRatio = tire.aspectRatio || 0
            const diameter = Math.floor(tire.rimDiameter || 0) // Convert 16.5 -> 16
            
            // Skip if essential data missing
            if (!width || !aspectRatio || !diameter) {
              skippedCount++
              continue
            }

            const eprelId = tire.eprelRegistrationNumber || null
            const supplierName = tire.supplierOrTrademark || 'Unknown'
            const modelName = tire.commercialName || tire.modelIdentifier || 'Unknown'
            const tyreDimension = tire.sizeDesignation || `${width}/${aspectRatio}R${diameter}`
            
            // Load index and speed rating
            const loadIndex = tire.loadCapacityIndex?.toString() || null
            const speedRating = tire.speedCategorySymbol || null
            
            // Tire class (C1 = summer, C2 = summer, C3 = truck/commercial)
            let tyreClass = tire.tyreClass?.toLowerCase() || null
            
            // Check for winter/all-season indicators
            const has3PMSF = tire.severeSnowTyre === true
            const hasIceGrip = tire.iceTyre === true
            
            // If has 3PMSF, it's winter or all-season
            if (has3PMSF && tyreClass === 'c1') {
              tyreClass = 'winter' // Most likely winter
            }
            
            // EU label data
            const fuelEfficiencyClass = tire.energyClass || null
            const wetGripClass = tire.wetGripClass || null
            const externalRollingNoiseLevel = tire.externalRollingNoiseValue || null
            const externalRollingNoiseClass = tire.externalRollingNoiseClass || null

            // Store complete tire data as JSON
            const additionalData = {
              modelIdentifier: tire.modelIdentifier,
              onMarketStartDate: tire.onMarketStartDate,
              organisation: tire.organisation?.organisationName,
              contactDetails: tire.contactDetails,
              implementingAct: tire.implementingAct,
              loadCapacityIndicator: tire.loadCapacityIndicator
            }

            // Insert/Update using Prisma raw SQL
            await prisma.$executeRaw`
              INSERT INTO eprel_tires (
                eprel_id, supplier_name, model_name, tyre_dimension,
                width, aspect_ratio, diameter,
                load_index, speed_rating, tyre_class,
                has_3pmsf, has_ice_grip,
                fuel_efficiency_class, wet_grip_class,
                external_rolling_noise_level, external_rolling_noise_class,
                additional_data, imported_at, last_updated, data_version
              ) VALUES (
                ${eprelId}, ${supplierName}, ${modelName}, ${tyreDimension},
                ${width}, ${aspectRatio}, ${diameter},
                ${loadIndex}, ${speedRating}, ${tyreClass},
                ${has3PMSF}, ${hasIceGrip},
                ${fuelEfficiencyClass}, ${wetGripClass},
                ${externalRollingNoiseLevel}, ${externalRollingNoiseClass},
                ${JSON.stringify(additionalData)}::jsonb, NOW(), NOW(), ${'EU_2020_740'}
              )
              ON CONFLICT (eprel_id) 
              DO UPDATE SET
                supplier_name = EXCLUDED.supplier_name,
                model_name = EXCLUDED.model_name,
                tyre_dimension = EXCLUDED.tyre_dimension,
                width = EXCLUDED.width,
                aspect_ratio = EXCLUDED.aspect_ratio,
                diameter = EXCLUDED.diameter,
                load_index = EXCLUDED.load_index,
                speed_rating = EXCLUDED.speed_rating,
                tyre_class = EXCLUDED.tyre_class,
                has_3pmsf = EXCLUDED.has_3pmsf,
                has_ice_grip = EXCLUDED.has_ice_grip,
                fuel_efficiency_class = EXCLUDED.fuel_efficiency_class,
                wet_grip_class = EXCLUDED.wet_grip_class,
                external_rolling_noise_level = EXCLUDED.external_rolling_noise_level,
                external_rolling_noise_class = EXCLUDED.external_rolling_noise_class,
                additional_data = EXCLUDED.additional_data,
                last_updated = NOW(),
                data_version = EXCLUDED.data_version
            `
            
            if (eprelId) {
              // Check if it was an insert or update
              const existing = await prisma.$queryRaw`
                SELECT id FROM eprel_tires WHERE eprel_id = ${eprelId} LIMIT 1
              `
              if (existing.length > 0) {
                updatedCount++
              } else {
                importedCount++
              }
            } else {
              importedCount++
            }

          } catch (error) {
            skippedCount++
            console.error(`[EPREL Import] Error processing tire: ${error.message}`)
          }
        }

        // Progress update
        if ((i + batchSize) % 500 === 0 || i + batchSize >= tires.length) {
          console.log(`[EPREL Import] Progress: ${Math.min(i + batchSize, tires.length)} / ${tires.length} (Imported: ${importedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount})`)
        }
      }
    }

    // Mark as complete
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[EPREL Import] ✅ Completed in ${duration}s`)
    console.log(`[EPREL Import] Imported: ${importedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`)

    await prisma.$executeRaw`
      UPDATE eprel_imports 
      SET status = 'SUCCESS',
          tires_imported = ${importedCount},
          tires_updated = ${updatedCount},
          completed_at = NOW()
      WHERE id = ${importRecord.id}
    `

  } catch (error) {
    console.error('[EPREL Import] ❌ Error:', error.message)
    
    if (importRecord) {
      await prisma.$executeRaw`
        UPDATE eprel_imports 
        SET status = 'FAILED',
            error_message = ${error.message},
            completed_at = NOW()
        WHERE id = ${importRecord.id}
      `
    }
  } finally {
    await prisma.$disconnect()
  }
}

importEPRELData()
