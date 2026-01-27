const { PrismaClient } = require('@prisma/client')
const AdmZip = require('adm-zip')

const prisma = new PrismaClient()

async function importEPREL() {
  const startTime = Date.now()
  
  try {
    console.log('[EPREL Import] Starting first import...\n')

    // Create import record
    const importRecord = await prisma.$executeRaw`
      INSERT INTO eprel_imports (id, status, tires_imported, tires_updated, tires_deleted)
      VALUES (gen_random_uuid()::text, 'RUNNING', 0, 0, 0)
      RETURNING *
    `

    const importId = await prisma.$queryRaw`SELECT id FROM eprel_imports WHERE status = 'RUNNING' ORDER BY started_at DESC LIMIT 1`
    const importRecordId = importId[0].id

    console.log(`[EPREL Import] Import ID: ${importRecordId}`)

    // Get API key
    const setting = await prisma.adminApiSetting.findUnique({
      where: { key: 'EPREL_API_KEY' }
    })
    
    if (!setting || !setting.value) {
      throw new Error('EPREL API Key nicht gefunden')
    }

    console.log('[EPREL Import] API Key gefunden')

    // Download ZIP file
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

    let importedCount = 0
    let updatedCount = 0

    // Process JSON files
    for (const entry of entries) {
      if (entry.entryName.endsWith('.json')) {
        console.log(`[EPREL Import] Processing ${entry.entryName}...`)
        
        const jsonContent = entry.getData().toString('utf8')
        const tires = JSON.parse(jsonContent)

        if (!Array.isArray(tires)) continue

        console.log(`[EPREL Import] Found ${tires.length} tires`)

        // Process in batches of 50
        const batchSize = 50
        for (let i = 0; i < tires.length; i += batchSize) {
          const batch = tires.slice(i, i + batchSize)
          
          for (const tire of batch) {
            try {
              const dimension = tire.tyreDimension || tire.dimension || ''
              const match = dimension.match(/(\d{3})\/(\d{2})R(\d{2})/)
              
              if (!match) continue

              const [, width, aspectRatio, diameter] = match

              const tireData = {
                eprel_id: tire.id || tire.productId || null,
                supplier_name: tire.supplierName || 'Unknown',
                model_name: tire.modelName || tire.commercialName || 'Unknown',
                tyre_dimension: `${width}/${aspectRatio}R${diameter}`,
                width: parseInt(width),
                aspect_ratio: parseInt(aspectRatio),
                diameter: parseInt(diameter),
                load_index: tire.loadIndex || null,
                speed_rating: tire.speedRating || null,
                tyre_class: (tire.tyreClass || tire.season || '').toLowerCase(),
                has_3pmsf: tire.hasSnowflake || tire.has3PMSF || false,
                has_ice_grip: tire.hasIceGrip || false,
                fuel_efficiency_class: tire.fuelEfficiencyClass || tire.rollingResistanceClass || null,
                wet_grip_class: tire.wetGripClass || tire.wetGrip || null,
                external_rolling_noise_level: tire.externalRollingNoiseLevel ? parseInt(tire.externalRollingNoiseLevel) : null,
                external_rolling_noise_class: tire.externalRollingNoiseClass || tire.noiseClass || null,
                additional_data: tire,
                data_version: new Date().toISOString()
              }

              // Use raw SQL for inserts/updates
              const eprelIdValue = tire.id || tire.productId
              
              if (eprelIdValue) {
                const existing = await prisma.$queryRaw`SELECT id FROM eprel_tires WHERE eprel_id = ${eprelIdValue} LIMIT 1`
                
                if (existing && existing.length > 0) {
                  await prisma.$executeRaw`
                    UPDATE eprel_tires SET
                      supplier_name = ${tireData.supplier_name},
                      model_name = ${tireData.model_name},
                      tyre_dimension = ${tireData.tyre_dimension},
                      width = ${tireData.width},
                      aspect_ratio = ${tireData.aspect_ratio},
                      diameter = ${tireData.diameter},
                      load_index = ${tireData.load_index},
                      speed_rating = ${tireData.speed_rating},
                      tyre_class = ${tireData.tyre_class},
                      has_3pmsf = ${tireData.has_3pmsf},
                      has_ice_grip = ${tireData.has_ice_grip},
                      fuel_efficiency_class = ${tireData.fuel_efficiency_class},
                      wet_grip_class = ${tireData.wet_grip_class},
                      external_rolling_noise_level = ${tireData.external_rolling_noise_level},
                      external_rolling_noise_class = ${tireData.external_rolling_noise_class},
                      additional_data = ${JSON.stringify(tireData.additional_data)}::jsonb,
                      last_updated = NOW(),
                      data_version = ${tireData.data_version}
                    WHERE eprel_id = ${eprelIdValue}
                  `
                  updatedCount++
                } else {
                  await prisma.$executeRaw`
                    INSERT INTO eprel_tires (
                      id, eprel_id, supplier_name, model_name, tyre_dimension,
                      width, aspect_ratio, diameter, load_index, speed_rating,
                      tyre_class, has_3pmsf, has_ice_grip, fuel_efficiency_class,
                      wet_grip_class, external_rolling_noise_level, external_rolling_noise_class,
                      additional_data, data_version
                    ) VALUES (
                      gen_random_uuid()::text, ${eprelIdValue}, ${tireData.supplier_name}, ${tireData.model_name}, ${tireData.tyre_dimension},
                      ${tireData.width}, ${tireData.aspect_ratio}, ${tireData.diameter}, ${tireData.load_index}, ${tireData.speed_rating},
                      ${tireData.tyre_class}, ${tireData.has_3pmsf}, ${tireData.has_ice_grip}, ${tireData.fuel_efficiency_class},
                      ${tireData.wet_grip_class}, ${tireData.external_rolling_noise_level}, ${tireData.external_rolling_noise_class},
                      ${JSON.stringify(tireData.additional_data)}::jsonb, ${tireData.data_version}
                    )
                  `
                  importedCount++
                }
              } else {
                await prisma.$executeRaw`
                  INSERT INTO eprel_tires (
                    id, supplier_name, model_name, tyre_dimension,
                    width, aspect_ratio, diameter, load_index, speed_rating,
                    tyre_class, has_3pmsf, has_ice_grip, fuel_efficiency_class,
                    wet_grip_class, external_rolling_noise_level, external_rolling_noise_class,
                    additional_data, data_version
                  ) VALUES (
                    gen_random_uuid()::text, ${tireData.supplier_name}, ${tireData.model_name}, ${tireData.tyre_dimension},
                    ${tireData.width}, ${tireData.aspect_ratio}, ${tireData.diameter}, ${tireData.load_index}, ${tireData.speed_rating},
                    ${tireData.tyre_class}, ${tireData.has_3pmsf}, ${tireData.has_ice_grip}, ${tireData.fuel_efficiency_class},
                    ${tireData.wet_grip_class}, ${tireData.external_rolling_noise_level}, ${tireData.external_rolling_noise_class},
                    ${JSON.stringify(tireData.additional_data)}::jsonb, ${tireData.data_version}
                  )
                `
                importedCount++
              }

            } catch (tireError) {
              // Skip invalid tires
            }
          }

          // Progress update every batch
          if (i % (batchSize * 10) === 0) {
            await prisma.$executeRaw`UPDATE eprel_imports SET tires_imported = ${importedCount}, tires_updated = ${updatedCount} WHERE id = ${importRecordId}`
            console.log(`[EPREL Import] Progress: ${importedCount + updatedCount} / ${tires.length}`)
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Mark as complete
    await prisma.$executeRaw`
      UPDATE eprel_imports 
      SET status = 'SUCCESS', 
          tires_imported = ${importedCount}, 
          tires_updated = ${updatedCount},
          completed_at = NOW(),
          data_version = ${new Date().toISOString()}
      WHERE id = ${importRecordId}
    `

    console.log(`\n[EPREL Import] ✅ Completed in ${duration}s`)
    console.log(`[EPREL Import] Imported: ${importedCount}, Updated: ${updatedCount}`)

  } catch (error) {
    console.error('[EPREL Import] ❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

importEPREL()
