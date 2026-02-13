import { prisma } from '@/lib/prisma'

/**
 * CSV Supplier Service
 * Handles CSV import from supplier URLs
 */

export interface CSVSyncResult {
  success: boolean
  error?: string
  imported?: number
  updated?: number
  total?: number
}

interface CSVRow {
  articleNumber: string
  ean?: string
  price: number
  stock: number
  brand?: string
  model?: string
  width?: string
  height?: string
  diameter?: string
  season?: string
  vehicleType?: string
  loadIndex?: string
  speedIndex?: string
  runFlat: boolean
  threePMSF: boolean
  labelFuelEfficiency?: string
  labelWetGrip?: string
  labelNoise?: number
  labelNoiseClass?: string
  eprelUrl?: string
}

/**
 * Parse CSV content (Real tire supplier format with 28 columns)
 * Format: Artikelnummer;ean;Lagerbestand;Einkaufspreis;...;Hersteller;Profil;...;Reifenbreite;Reifenquerschnitt;Reifendurchmesser;...
 */
function parseCSV(csvContent: string): CSVRow[] {
  const rows: CSVRow[] = []
  const lines = csvContent.split('\n').filter(line => line.trim())

  // Skip header line (first line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Split by semicolon
    const columns = line.split(';').map(col => col.trim())

    // Real format has 28 columns
    if (columns.length < 28) {
      console.warn(`CSV row ${i + 1}: Expected 28 columns, got ${columns.length}. Skipping.`)
      continue
    }

    try {
      // Column mapping (0-indexed):
      // 0: Artikelnummer
      // 1: ean
      // 2: Lagerbestand
      // 3: Einkaufspreis
      // 5: Hersteller
      // 6: Profil
      // 8: Reifenbreite
      // 9: Reifenquerschnitt
      // 10: Reifendurchmesser
      // 13: Saison
      // 14: Fahrzeugtyp
      // 24: Artikeltyp (Reifen/Ersatzteile/etc.)
      // 25: Artikeluntertyp (PKW/Motorrad/LKW/Transporter)
      
      const artikeltyp = columns[24]?.toLowerCase() || ''
      const artikeluntertyp = columns[25]?.toLowerCase() || ''

      // FILTER: Nur Reifen (keine Ersatzteile, Felgen, etc.)
      if (artikeltyp !== 'reifen') {
        continue
      }

      // FILTER: Nur PKW und Motorrad (keine LKW, Transporter)
      if (!['pkw', 'motorrad'].includes(artikeluntertyp)) {
        continue
      }

      const articleNumber = columns[0]
      const ean = columns[1]
      const stock = parseInt(columns[2] || '0')
      const price = parseFloat((columns[3] || '0').replace(',', '.')) // German format: 123,45 → 123.45
      const brand = columns[5]
      const model = columns[6]
      const widthStr = columns[8]
      const heightStr = columns[9]
      const diameterStr = columns[10]
      const loadIndex = columns[11] // z.B. "91", "95"
      const speedIndex = columns[12] // z.B. "V", "H", "W"
      const season = columns[13] // s/w/g
      const vehicleType = columns[14] // PKW/Motorrad
      const labelFuelEfficiency = columns[16] || undefined // A-G
      const labelWetGrip = columns[17] || undefined // A-G
      const labelNoiseStr = columns[18] || undefined // dB value
      const labelNoiseClass = columns[19] || undefined // A, B, C
      const eprelUrl = columns[27] || undefined // EU Product Registry URL

      // Extract RunFlat and 3PMSF from model name (Profil)
      const modelLower = (model || '').toLowerCase()
      const runFlat = /runflat|run\s*flat|rft|rf[\s]/.test(modelLower)
      const threePMSF = /3pmsf|three\s*peak|schneeflocke/.test(modelLower)

      // Parse noise level
      const labelNoise = labelNoiseStr ? parseInt(labelNoiseStr) : undefined

      // Validation
      if (!articleNumber || isNaN(price) || isNaN(stock) || price <= 0) {
        console.warn(`CSV row ${i + 1}: Invalid data (ArticleNumber="${articleNumber}", Price="${columns[3]}", Stock="${columns[2]}"). Skipping.`)
        continue
      }

      // Parse dimensions (keep as strings, handle "0" as null)
      const width = widthStr && widthStr !== '0' ? widthStr : undefined
      const height = heightStr && heightStr !== '0' ? heightStr : undefined
      const diameter = diameterStr && diameterStr !== '0' ? diameterStr : undefined

      rows.push({
        articleNumber,
        ean: ean || undefined,
        stock,
        price,
        brand: brand || undefined,
        model: model || undefined,
        width,
        height,
        diameter,
        season: season || undefined,
        vehicleType: vehicleType || undefined,
        loadIndex: loadIndex || undefined,
        speedIndex: speedIndex || undefined,
        runFlat,
        threePMSF,
        labelFuelEfficiency,
        labelWetGrip,
        labelNoise,
        labelNoiseClass,
        eprelUrl,
      })
    } catch (error) {
      console.error(`CSV row ${i + 1}: Parse error:`, error)
      continue
    }
  }

  return rows
}

/**
 * Sync supplier CSV inventory
 */
export async function syncSupplierCSV(
  workshopId: string,
  supplierId: string
): Promise<CSVSyncResult> {
  try {
    // Get supplier
    const supplier = await prisma.workshopSupplier.findUnique({
      where: { id: supplierId },
    })

    if (!supplier) {
      return { success: false, error: 'Supplier not found' }
    }

    if (supplier.workshopId !== workshopId) {
      return { success: false, error: 'Access denied' }
    }

    if (supplier.connectionType !== 'CSV') {
      return { success: false, error: 'Supplier is not CSV type' }
    }

    if (!supplier.csvImportUrl) {
      return { success: false, error: 'CSV URL not configured' }
    }

    // Update status to syncing
    await prisma.workshopSupplier.update({
      where: { id: supplierId },
      data: { csvSyncStatus: 'syncing' },
    })

    // Fetch CSV
    const response = await fetch(supplier.csvImportUrl, {
      headers: {
        'User-Agent': 'Bereifung24-Workshop-Bot/1.0',
      },
      signal: AbortSignal.timeout(30000), // 30s timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const csvContent = await response.text()
    const rows = parseCSV(csvContent)

    if (rows.length === 0) {
      throw new Error('No valid data in CSV')
    }

    // Get all article numbers from CSV
    const csvArticleNumbers = new Set(rows.map(r => r.articleNumber))

    // Get existing articles to find discontinued ones
    const existingArticles = await prisma.workshopInventory.findMany({
      where: {
        workshopId,
        supplier: supplier.supplier,
      },
      select: {
        id: true,
        articleNumber: true,
      },
    })

    // Find discontinued articles (exist in DB but not in CSV)
    const discontinuedIds = existingArticles
      .filter(article => !csvArticleNumbers.has(article.articleNumber))
      .map(article => article.id)

    // Delete discontinued articles in batches (PostgreSQL limit: 32767 params)
    let deletedCount = 0
    if (discontinuedIds.length > 0) {
      const DELETE_BATCH_SIZE = 5000
      for (let i = 0; i < discontinuedIds.length; i += DELETE_BATCH_SIZE) {
        const batch = discontinuedIds.slice(i, i + DELETE_BATCH_SIZE)
        const result = await prisma.workshopInventory.deleteMany({
          where: {
            id: { in: batch },
          },
        })
        deletedCount += result.count
      }
    }

    console.log(`[CSV-SYNC] ${supplier.name}: Deleted ${deletedCount} discontinued items`)
    console.log(`[CSV-SYNC] ${supplier.name}: Processing ${rows.length} items (updating ALL prices & stock)...`)

    // Bulk upsert ALL items - prices and stock are ALWAYS updated
    let created = 0
    let processed = 0

    // Process in batches of 500 to avoid memory issues with large CSVs
    const BATCH_SIZE = 500
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)

      const results = await Promise.all(
        batch.map(async (row) => {
          const existsBefore = await prisma.workshopInventory.findUnique({
            where: {
              workshopId_articleNumber_supplier: {
                workshopId,
                articleNumber: row.articleNumber,
                supplier: supplier.supplier,
              },
            },
            select: { id: true },
          })

          await prisma.workshopInventory.upsert({
            where: {
              workshopId_articleNumber_supplier: {
                workshopId,
                articleNumber: row.articleNumber,
                supplier: supplier.supplier,
              },
            },
            update: {
              // ALWAYS update all fields (prices change frequently!)
              price: row.price,
              stock: row.stock,
              ean: row.ean,
              brand: row.brand,
              model: row.model,
              width: row.width,
              height: row.height,
              diameter: row.diameter,
              season: row.season,
              vehicleType: row.vehicleType,
              loadIndex: row.loadIndex,
              speedIndex: row.speedIndex,
              runFlat: row.runFlat,
              threePMSF: row.threePMSF,
              labelFuelEfficiency: row.labelFuelEfficiency,
              labelWetGrip: row.labelWetGrip,
              labelNoise: row.labelNoise,
              labelNoiseClass: row.labelNoiseClass,
              eprelUrl: row.eprelUrl,
              lastUpdated: new Date(),
            },
            create: {
              workshopId,
              supplier: supplier.supplier,
              articleNumber: row.articleNumber,
              price: row.price,
              stock: row.stock,
              ean: row.ean,
              brand: row.brand,
              model: row.model,
              width: row.width,
              height: row.height,
              diameter: row.diameter,
              season: row.season,
              vehicleType: row.vehicleType,
              loadIndex: row.loadIndex,
              speedIndex: row.speedIndex,
              runFlat: row.runFlat,
              threePMSF: row.threePMSF,
              labelFuelEfficiency: row.labelFuelEfficiency,
              labelWetGrip: row.labelWetGrip,
              labelNoise: row.labelNoise,
              labelNoiseClass: row.labelNoiseClass,
              eprelUrl: row.eprelUrl,
              lastUpdated: new Date(),
            },
          })

          processed++
          return { isNew: !existsBefore }
        })
      )

      created += results.filter(r => r.isNew).length
      
      // Progress log for large imports
      if (rows.length > 1000) {
        console.log(`[CSV-SYNC] ${supplier.name}: Processed ${processed}/${rows.length} items...`)
      }
    }

    const updated = processed - created

    console.log(`[CSV-SYNC] ${supplier.name}: ✅ Complete - ${created} new, ${updated} updated, ${deletedCount} deleted`)

    // Update sync status
    await prisma.workshopSupplier.update({
      where: { id: supplierId },
      data: {
        lastCsvSync: new Date(),
        csvSyncStatus: 'success',
        csvSyncError: null,
      },
    })

    return {
      success: true,
      imported: created,
      updated,
      total: rows.length,
    }
  } catch (error) {
    console.error('CSV sync error:', error)
    
    // Update error status
    await prisma.workshopSupplier.update({
      where: { id: supplierId },
      data: {
        csvSyncStatus: 'error',
        csvSyncError: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sync all active CSV suppliers (for cron job)
 */
export async function syncAllCSVSuppliers() {
  try {
    const csvSuppliers = await prisma.workshopSupplier.findMany({
      where: {
        connectionType: 'CSV',
        isActive: true,
      },
      include: {
        workshop: true,
      },
    })

    const results = []

    for (const supplier of csvSuppliers) {
      const result = await syncSupplierCSV(supplier.workshopId, supplier.id)
      results.push({
        workshopId: supplier.workshopId,
        supplierId: supplier.id,
        supplier: supplier.supplier,
        ...result,
      })
    }

    return results
  } catch (error) {
    console.error('Error syncing all CSV suppliers:', error)
    return []
  }
}
