import { prisma } from '@/lib/prisma'

/**
 * Tire Search & Pricing Service
 * Handles tire search with filters and dynamic price calculation based on workshop pricing rules
 */

export interface TireSearchFilters {
  workshopId: string
  // Required: Tire dimensions from vehicle
  width: string
  height: string
  diameter: string
  // CRITICAL: Load and Speed Index for safety compliance
  minLoadIndex?: string // Minimum load index (e.g., '91', '96')
  minSpeedIndex?: string // Minimum speed rating (e.g., 'H', 'V', 'W', 'Y')
  // Optional filters
  season?: 's' | 'w' | 'g' | 'all' // s=Summer, w=Winter, g=All-season
  minStock?: number // Default: 4 (for full set)
  minPrice?: number // Minimum price per tire
  maxPrice?: number // Maximum price per tire
  quality?: 'premium' | 'quality' | 'budget' // Quality category
  brands?: string[] // Filter by brands
  // EU Labels
  minFuelEfficiency?: string // A-G (A=best)
  minWetGrip?: string // A-G (A=best)
  maxNoise?: number // Maximum dB
  // Features
  runFlat?: boolean
  threePMSF?: boolean
  showDOTTires?: boolean // Default false = hide DOT tires (models with "DOT" in name)
  // Sorting
  sortBy?: 'price' | 'brand' | 'fuel' | 'wetGrip' | 'noise'
  sortOrder?: 'asc' | 'desc'
}

export interface TireSearchResult {
  // Product details
  id: string
  articleNumber: string
  ean?: string
  brand: string
  model: string
  width: string
  height: string
  diameter: string
  season: string
  loadIndex?: string
  speedIndex?: string
  runFlat: boolean
  threePMSF: boolean
  // EU Labels
  labelFuelEfficiency?: string
  labelWetGrip?: string
  labelNoise?: number
  labelNoiseClass?: string
  eprelUrl?: string
  // DOT Info
  isDOT?: boolean
  dotInfo?: string // e.g. "DOT2021" or "DOT 48/2021"
  // Pricing
  purchasePrice: number // EK (Einkaufspreis)
  sellingPrice: number // VK (Verkaufspreis) - calculated with workshop markup
  markup: {
    fixed: number
    percent: number
    includeVat: boolean
  }
  // Availability
  stock: number
  supplier: string
}

export interface CheapestTireResult {
  tire?: TireSearchResult
  totalPrice: number // For 4 tires (or 2 for motorcycles)
  pricePerTire: number
  quantity: number
  available: boolean
}

export interface TireRecommendation {
  label: string // "Günstigster", "Testsieger", "Beliebt"
  tire: TireSearchResult
  pricePerTire: number
  totalPrice: number
  quantity: number
}

export interface TireRecommendationsResult {
  recommendations: TireRecommendation[]
  selectedIndex: number // Index of the default/selected recommendation
  quantity: number
  available: boolean
}

/**
 * Calculate selling price based on workshop pricing rules
 */
async function calculateSellingPrice(
  workshopId: string,
  purchasePrice: number,
  diameter: string,
  vehicleType: string
): Promise<{ sellingPrice: number; markup: { fixed: number; percent: number; includeVat: boolean } }> {
  // Parse diameter to number (e.g., "16" → 16, "19.5" → 19.5)
  const rimSize = Math.floor(parseFloat(diameter))

  // Get pricing rule for this rim size and vehicle type
  const pricingRule = await prisma.tirePricingBySize.findUnique({
    where: {
      workshopId_rimSize_vehicleType: {
        workshopId,
        rimSize,
        vehicleType: vehicleType === 'Motorrad' ? 'MOTO' : 'AUTO',
      },
    },
  })

  // If no specific rule, get default workshop settings from PricingSettings
  if (!pricingRule) {
    const pricingSettings = await prisma.pricingSettings.findUnique({
      where: { workshopId },
      select: {
        autoFixedMarkup: true,
        autoPercentMarkup: true,
        autoIncludeVat: true,
        motoFixedMarkup: true,
        motoPercentMarkup: true,
        motoIncludeVat: true,
      },
    })

    if (!pricingSettings) {
      throw new Error(`Pricing settings not found for workshop ${workshopId}`)
    }

    const isMoto = vehicleType === 'Motorrad'
    const fixedMarkup = isMoto ? pricingSettings.motoFixedMarkup : pricingSettings.autoFixedMarkup
    const percentMarkup = isMoto ? pricingSettings.motoPercentMarkup : pricingSettings.autoPercentMarkup
    const includeVat = isMoto ? pricingSettings.motoIncludeVat : pricingSettings.autoIncludeVat

    // Calculate price: (EK + Fixed) * (1 + Percent/100) * (1 + VAT if included)
    let price = purchasePrice + fixedMarkup
    price = price * (1 + percentMarkup / 100)
    if (includeVat) {
      price = price * 1.19 // 19% German VAT
    }

    return {
      sellingPrice: parseFloat(price.toFixed(2)),
      markup: {
        fixed: fixedMarkup,
        percent: percentMarkup,
        includeVat,
      },
    }
  }

  // Use specific pricing rule
  let price = purchasePrice + pricingRule.fixedMarkup
  price = price * (1 + pricingRule.percentMarkup / 100)
  if (pricingRule.includeVat) {
    price = price * 1.19
  }

  return {
    sellingPrice: parseFloat(price.toFixed(2)),
    markup: {
      fixed: pricingRule.fixedMarkup,
      percent: pricingRule.percentMarkup,
      includeVat: pricingRule.includeVat,
    },
  }
}

/**
 * Search tires with filters
 * Automatically detects workshop connection type (API vs CSV) and uses appropriate datasource
 */
export async function searchTires(filters: TireSearchFilters): Promise<TireSearchResult[]> {
  const {
    workshopId,
    width,
    height,
    diameter,
    season,
    minStock = 4,
    minPrice,
    maxPrice,
    quality,
    brands,
    minFuelEfficiency,
    minWetGrip,
    maxNoise,
    runFlat,
    threePMSF,
    sortBy = 'price',
    sortOrder = 'asc',
  } = filters

  // Check workshop supplier configuration
  const workshopSupplier = await prisma.workshopSupplier.findFirst({
    where: {
      workshopId,
      isActive: true,
    },
    orderBy: {
      priority: 'asc', // Use highest priority supplier
    },
  })

  if (!workshopSupplier) {
    console.log(`⚠️ [Tire Search] No active supplier found for workshop ${workshopId}`)
    return []
  }

  console.log(`🔧 [Tire Search] Workshop ${workshopId} - Supplier: ${workshopSupplier.supplier}, Mode: ${workshopSupplier.connectionType}, AutoOrder: ${workshopSupplier.autoOrder}`)

  // Route to appropriate search method
  if (workshopSupplier.connectionType === 'API') {
    return searchTiresViaAPI(filters, workshopSupplier)
  } else {
    return searchTiresViaDatabase(filters, workshopSupplier)
  }
}

/**
 * Search tires via TireCatalog + Live API pricing
 */
async function searchTiresViaAPI(
  filters: TireSearchFilters,
  workshopSupplier: any
): Promise<TireSearchResult[]> {
  const {
    workshopId,
    width,
    height,
    diameter,
    season,
    minStock = 4,
    quality,
    brands,
    minFuelEfficiency,
    minWetGrip,
    maxNoise,
    runFlat,
    threePMSF,
    sortBy = 'price',
    sortOrder = 'asc',
  } = filters

  console.log(`🌐 [API Mode] Searching TireCatalog for ${width}/${height}R${diameter}`)

  // Quality category brand mapping
  const PREMIUM_BRANDS = ['Michelin', 'Continental', 'Pirelli', 'Bridgestone', 'Goodyear', 'Dunlop']
  const QUALITY_BRANDS = ['Hankook', 'Kumho', 'Yokohama', 'Toyo', 'Falken', 'BFGoodrich', 'Cooper', 'Nokian']

  // Build where clause for TireCatalog
  // CRITICAL: width/height/diameter are stored as STRING in TireCatalog schema
  const where: any = {
    supplier: workshopSupplier.supplier,
    isActive: true,
    width: width.toString(),
    height: height.toString(),
    diameter: diameter.toString(),
  }

  // Season filter
  if (season && season !== 'all') {
    where.season = season
  }

  // Quality filter (by brand)
  if (quality) {
    if (quality === 'premium') {
      where.brand = { in: PREMIUM_BRANDS }
    } else if (quality === 'quality') {
      where.brand = { in: QUALITY_BRANDS }
    } else if (quality === 'budget') {
      where.brand = { notIn: [...PREMIUM_BRANDS, ...QUALITY_BRANDS] }
    }
  }

  // Brand filter
  if (brands && brands.length > 0) {
    where.brand = { in: brands }
  }

  // EU Label filters
  if (minFuelEfficiency) {
    const labelHierarchy = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const minIndex = labelHierarchy.indexOf(minFuelEfficiency)
    if (minIndex !== -1) {
      where.labelFuelEfficiency = { in: labelHierarchy.slice(0, minIndex + 1) }
    }
  }
  if (minWetGrip) {
    const labelHierarchy = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const minIndex = labelHierarchy.indexOf(minWetGrip)
    if (minIndex !== -1) {
      where.labelWetGrip = { in: labelHierarchy.slice(0, minIndex + 1) }
    }
  }
  if (maxNoise) {
    where.labelNoise = { lte: maxNoise }
  }

  // Feature filters
  if (runFlat !== undefined) {
    where.runFlat = runFlat
  }
  if (threePMSF !== undefined) {
    where.threePMSF = threePMSF
  }

  // Model exclusions (DEMO, DOT)
  const modelExclusions: any[] = [
    { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } }
  ]
  
  if (filters.showDOTTires === true) {
    where.model = { contains: 'DOT', mode: 'insensitive' }
  } else {
    modelExclusions.push({ NOT: { model: { contains: 'DOT', mode: 'insensitive' } } })
  }
  
  where.AND = modelExclusions

  // Fetch from TireCatalog
  const catalogTires = await prisma.tireCatalog.findMany({
    where,
    orderBy: { brand: 'asc' },
    take: 100, // Limit for performance
  })

  console.log(`📊 [API Mode] Found ${catalogTires.length} tires in catalog`)

  // Query API for live prices + stock
  const { inquireArticle } = await import('@/lib/services/tyreSystemService')
  const results: TireSearchResult[] = []

  for (const tire of catalogTires.slice(0, 50)) { // Further limit API calls
    try {
      // Query TyreSystem API
      const apiResult = await inquireArticle(workshopId, tire.articleId, minStock)
      
      if (!apiResult || apiResult.inquiryResponse.offerData.errorCode !== 0) {
        console.log(`⚠️ [API] Skipping ${tire.brand} ${tire.model} - API error`)
        continue
      }

      const offerData = apiResult.inquiryResponse.offerData
      const purchasePrice = parseFloat(offerData.price)
      const stock = parseInt(offerData.stock)

      // Check stock requirement
      if (stock < minStock) {
        continue
      }

      // Calculate selling price with workshop markup
      const { sellingPrice, markup } = await calculateSellingPrice(
        workshopId,
        purchasePrice,
        diameter,
        tire.vehicleType || 'PKW'
      )

      // Apply price filters
      if (filters.minPrice && sellingPrice < filters.minPrice) continue
      if (filters.maxPrice && sellingPrice > filters.maxPrice) continue

      // Apply Load/Speed Index filters (post-filtering)
      if (filters.minLoadIndex && tire.loadIndex) {
        const loadIndexMatch = tire.loadIndex.match(/(\d+)/)
        const tireLoad = loadIndexMatch ? parseInt(loadIndexMatch[1]) : NaN
        const minLoad = parseInt(filters.minLoadIndex)
        if (!isNaN(tireLoad) && !isNaN(minLoad) && tireLoad < minLoad) continue
      }

      if (filters.minSpeedIndex && tire.speedIndex) {
        const SPEED_INDEX_ORDER = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'ZR']
        const tireSpeedIdx = SPEED_INDEX_ORDER.indexOf(tire.speedIndex.toUpperCase())
        const minSpeedIdx = SPEED_INDEX_ORDER.indexOf(filters.minSpeedIndex.toUpperCase())
        if (tireSpeedIdx >= 0 && minSpeedIdx >= 0 && tireSpeedIdx < minSpeedIdx) continue
      }

      results.push({
        id: tire.id,
        articleNumber: tire.articleId,
        ean: tire.ean || undefined,
        brand: tire.brand,
        model: tire.model,
        width: tire.width,
        height: tire.height,
        diameter: tire.diameter,
        season: tire.season,
        loadIndex: tire.loadIndex || undefined,
        speedIndex: tire.speedIndex || undefined,
        runFlat: tire.runFlat,
        threePMSF: tire.threePMSF,
        labelFuelEfficiency: tire.labelFuelEfficiency || undefined,
        labelWetGrip: tire.labelWetGrip || undefined,
        labelNoise: tire.labelNoise || undefined,
        labelNoiseClass: tire.labelNoiseClass || undefined,
        eprelUrl: tire.eprelUrl || undefined,
        purchasePrice,
        sellingPrice,
        markup,
        stock,
        supplier: workshopSupplier.supplier,
      })
    } catch (error) {
      console.error(`❌ [API] Error processing tire ${tire.articleId}:`, error)
    }
  }

  // Sort results
  if (sortBy === 'price') {
    results.sort((a, b) => sortOrder === 'asc' ? a.sellingPrice - b.sellingPrice : b.sellingPrice - a.sellingPrice)
  } else if (sortBy === 'brand') {
    results.sort((a, b) => sortOrder === 'asc' ? a.brand.localeCompare(b.brand) : b.brand.localeCompare(a.brand))
  }

  console.log(`✅ [API Mode] Returning ${results.length} tires with live pricing`)
  return results
}

/**
 * Search tires via WorkshopInventory (CSV/Database mode)
 */
async function searchTiresViaDatabase(
  filters: TireSearchFilters,
  workshopSupplier: any
): Promise<TireSearchResult[]> {
  const {
    workshopId,
    width,
    height,
    diameter,
    season,
    minStock = 4,
    minPrice,
    maxPrice,
    quality,
    brands,
    minFuelEfficiency,
    minWetGrip,
    maxNoise,
    runFlat,
    threePMSF,
    sortBy = 'price',
    sortOrder = 'asc',
  } = filters

  console.log(`💾 [Database Mode] Searching WorkshopInventory for ${width}/${height}R${diameter}`)

  // Quality category brand mapping
  const PREMIUM_BRANDS = ['Michelin', 'Continental', 'Pirelli', 'Bridgestone', 'Goodyear', 'Dunlop']
  const QUALITY_BRANDS = ['Hankook', 'Kumho', 'Yokohama', 'Toyo', 'Falken', 'BFGoodrich', 'Cooper', 'Nokian']
  // Budget = all others

  // Build where clause
  const where: any = {
    workshopId,
    width,
    height,
    diameter,
    stock: { gte: minStock },
  }

  // Note: Load Index and Speed Index are filtered AFTER database query
  // because load index requires numeric comparison but is stored as string
  // Speed index requires custom hierarchy comparison

  // Season filter
  if (season && season !== 'all') {
    where.season = season
    console.log(`🌡️ [Database Mode] Filtering by season: "${season}"`)
  } else {
    console.log(`🌡️ [Database Mode] No season filter applied`)
  }

  // Quality filter (by brand)
  if (quality) {
    if (quality === 'premium') {
      where.brand = { in: PREMIUM_BRANDS }
    } else if (quality === 'quality') {
      where.brand = { in: QUALITY_BRANDS }
    } else if (quality === 'budget') {
      where.brand = { notIn: [... PREMIUM_BRANDS, ...QUALITY_BRANDS] }
    }
  }

  // Brand filter
  if (brands && brands.length > 0) {
    where.brand = { in: brands }
    console.log(`🎨 [Database Mode] Filtering by ${brands.length} brands`)
  }

  // EU Label filters
  if (minFuelEfficiency) {
    const labelHierarchy = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const minIndex = labelHierarchy.indexOf(minFuelEfficiency)
    if (minIndex !== -1) {
      where.labelFuelEfficiency = { in: labelHierarchy.slice(0, minIndex + 1) }
    }
  }
  if (minWetGrip) {
    const labelHierarchy = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const minIndex = labelHierarchy.indexOf(minWetGrip)
    if (minIndex !== -1) {
      where.labelWetGrip = { in: labelHierarchy.slice(0, minIndex + 1) }
    }
  }
  if (maxNoise) {
    where.labelNoise = { lte: maxNoise }
  }

  // Feature filters
  if (runFlat !== undefined) {
    where.runFlat = runFlat
  }
  if (threePMSF !== undefined) {
    where.threePMSF = threePMSF
  }

  // Model exclusions
  const modelExclusions: any[] = [
    { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } }
  ]
  
  if (filters.showDOTTires === true) {
    where.model = { contains: 'DOT', mode: 'insensitive' }
  } else {
    modelExclusions.push({ NOT: { model: { contains: 'DOT', mode: 'insensitive' } } })
  }
  
  if (!where.AND) {
    where.AND = modelExclusions
  } else {
    where.AND = Array.isArray(where.AND) ? [...where.AND, ...modelExclusions] : [where.AND, ...modelExclusions]
  }

  // Fetch from WorkshopInventory
  const tires = await prisma.workshopInventory.findMany({
    where,
    orderBy:
      sortBy === 'price'
        ? { price: sortOrder }
        : sortBy === 'brand'
        ? { brand: sortOrder }
        : sortBy === 'fuel'
        ? { labelFuelEfficiency: sortOrder }
        : sortBy === 'wetGrip'
        ? { labelWetGrip: sortOrder }
        : sortBy === 'noise'
        ? { labelNoise: sortOrder }
        : { price: 'asc' },
  })
  
  console.log(`📊 [Database Mode] Found ${tires.length} tires in inventory`)

  // Apply Load/Speed Index filters and calculate prices
  const SPEED_INDEX_ORDER = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'ZR']
  const results: TireSearchResult[] = []
  let filteredOutCount = 0

  for (const tire of tires) {
    // Load Index filter
    if (filters.minLoadIndex && tire.loadIndex) {
      const loadIndexMatch = tire.loadIndex.match(/(\d+)/)
      const tireLoad = loadIndexMatch ? parseInt(loadIndexMatch[1]) : NaN
      const minLoad = parseInt(filters.minLoadIndex)
      
      if (!isNaN(tireLoad) && !isNaN(minLoad) && tireLoad < minLoad) {
        filteredOutCount++
        continue
      }
    }

    // Speed Index filter
    if (filters.minSpeedIndex && tire.speedIndex) {
      const tireSpeedIdx = SPEED_INDEX_ORDER.indexOf(tire.speedIndex)
      const minSpeedIdx = SPEED_INDEX_ORDER.indexOf(filters.minSpeedIndex)
      if (tireSpeedIdx !== -1 && minSpeedIdx !== -1 && tireSpeedIdx < minSpeedIdx) {
        filteredOutCount++
        continue
      }
    }

    const { sellingPrice, markup } = await calculateSellingPrice(
      workshopId,
      tire.price,
      tire.diameter || diameter,
      tire.vehicleType || 'PKW'
    )

    // Price filters
    if (minPrice && sellingPrice < minPrice) {
      filteredOutCount++
      continue
    }
    if (maxPrice && sellingPrice > maxPrice) {
      filteredOutCount++
      continue
    }

    // Clean up load index
    let cleanLoadIndex = tire.loadIndex
    if (cleanLoadIndex) {
      const match = cleanLoadIndex.match(/(\d+)/)
      if (match) {
        cleanLoadIndex = match[1]
      }
    }

    // DOT detection
    const isDOT = tire.model?.toUpperCase().includes('DOT') || false
    let dotInfo: string | undefined
    if (isDOT && tire.model) {
      const dotMatch = tire.model.match(/DOT\s*([0-9\/\s]+)/i)
      dotInfo = dotMatch ? `DOT ${dotMatch[1].trim()}` : 'DOT'
    }

    results.push({
      id: tire.id,
      articleNumber: tire.articleNumber,
      ean: tire.ean || undefined,
      brand: tire.brand || 'Unknown',
      model: tire.model || '',
      width: tire.width || width,
      height: tire.height || height,
      diameter: tire.diameter || diameter,
      season: tire.season || '?',
      loadIndex: cleanLoadIndex || undefined,
      speedIndex: tire.speedIndex || undefined,
      runFlat: tire.runFlat,
      threePMSF: tire.threePMSF,
      labelFuelEfficiency: tire.labelFuelEfficiency || undefined,
      labelWetGrip: tire.labelWetGrip || undefined,
      labelNoise: tire.labelNoise || undefined,
      labelNoiseClass: tire.labelNoiseClass || undefined,
      eprelUrl: tire.eprelUrl || undefined,
      isDOT,
      dotInfo,
      purchasePrice: tire.price,
      sellingPrice,
      markup,
      stock: tire.stock,
      supplier: tire.supplier,
    })
  }
  
  console.log(`✅ [Database Mode] Returning ${results.length} tires, ${filteredOutCount} filtered out`)
  return results
}

/**
 * Find cheapest tire for a workshop (for search results display)
 */
export async function findCheapestTire(
  workshopId: string,
  width: string,
  height: string,
  diameter: string,
  season?: 's' | 'w' | 'g' | 'all',
  vehicleType: 'PKW' | 'Motorrad' = 'PKW',
  additionalFilters?: Partial<TireSearchFilters>
): Promise<CheapestTireResult> {
  const minStock = vehicleType === 'Motorrad' ? 2 : 4

  const tires = await searchTires({
    workshopId,
    width,
    height,
    diameter,
    season,
    minStock,
    sortBy: 'price',
    sortOrder: 'asc',
    ...additionalFilters, // Spread additional filters (minPrice, maxPrice, quality, etc.)
  })

  if (tires.length === 0) {
    return {
      totalPrice: 0,
      pricePerTire: 0,
      quantity: minStock,
      available: false,
    }
  }

  const cheapestTire = tires[0]
  const quantity = minStock
  const totalPrice = cheapestTire.sellingPrice * quantity

  return {
    tire: cheapestTire,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    pricePerTire: cheapestTire.sellingPrice,
    quantity,
    available: true,
  }
}

/**
 * Find 3 tire recommendations: Günstigster, Testsieger (Premium), Beliebt (Quality)
 */
const PREMIUM_BRANDS = ['Michelin', 'Continental', 'Pirelli', 'Bridgestone', 'Goodyear', 'Dunlop']
const QUALITY_BRANDS = ['Hankook', 'Kumho', 'Yokohama', 'Toyo', 'Falken', 'BFGoodrich', 'Cooper', 'Nokian']

export async function findTireRecommendations(
  workshopId: string,
  width: string,
  height: string,
  diameter: string,
  season?: 's' | 'w' | 'g' | 'all',
  vehicleType: 'PKW' | 'Motorrad' = 'PKW',
  additionalFilters?: Partial<TireSearchFilters>,
  requestedQuantity?: number, // Optional: Override default quantity
  disposalFeePerTire: number = 0, // Disposal fee per tire
  runFlatSurchargePerTire: number = 0 // RunFlat surcharge per tire
): Promise<TireRecommendationsResult> {
  // Use requested quantity if provided, otherwise default based on vehicle type
  const minStock = requestedQuantity || (vehicleType === 'Motorrad' ? 2 : 4)
  const quantity = minStock

  // Get all matching tires sorted by price
  const allTires = await searchTires({
    workshopId,
    width,
    height,
    diameter,
    season,
    minStock,
    sortBy: 'price',
    sortOrder: 'asc',
    ...additionalFilters,
  })

  if (allTires.length === 0) {
    return { recommendations: [], selectedIndex: 0, quantity, available: false }
  }

  const recommendations: TireRecommendation[] = []

  // 1. Günstigster (cheapest overall)
  const cheapest = allTires[0]
  const cheapestPricePerTire = cheapest.sellingPrice + disposalFeePerTire + (cheapest.runFlat ? runFlatSurchargePerTire : 0)
  recommendations.push({
    label: 'Günstigster',
    tire: cheapest,
    pricePerTire: parseFloat(cheapestPricePerTire.toFixed(2)),
    totalPrice: parseFloat((cheapestPricePerTire * quantity).toFixed(2)),
    quantity,
  })

  // 2. Testsieger (best premium brand tire - cheapest of premium brands)
  const premiumTire = allTires.find(t => 
    PREMIUM_BRANDS.some(b => t.brand.toLowerCase().includes(b.toLowerCase()))
  )
  if (premiumTire && premiumTire.id !== cheapest.id) {
    const premiumPricePerTire = premiumTire.sellingPrice + disposalFeePerTire + (premiumTire.runFlat ? runFlatSurchargePerTire : 0)
    recommendations.push({
      label: 'Testsieger',
      tire: premiumTire,
      pricePerTire: parseFloat(premiumPricePerTire.toFixed(2)),
      totalPrice: parseFloat((premiumPricePerTire * quantity).toFixed(2)),
      quantity,
    })
  }

  // 3. Beliebt (best quality-brand tire)
  const qualityTire = allTires.find(t => 
    QUALITY_BRANDS.some(b => t.brand.toLowerCase().includes(b.toLowerCase()))
  )
  if (qualityTire && qualityTire.id !== cheapest.id && qualityTire.id !== premiumTire?.id) {
    const qualityPricePerTire = qualityTire.sellingPrice + disposalFeePerTire + (qualityTire.runFlat ? runFlatSurchargePerTire : 0)
    recommendations.push({
      label: 'Beliebt',
      tire: qualityTire,
      pricePerTire: parseFloat(qualityPricePerTire.toFixed(2)),
      totalPrice: parseFloat((qualityPricePerTire * quantity).toFixed(2)),
      quantity,
    })
  }

  // If we only have 1 recommendation and more tires, add second cheapest as alternative
  if (recommendations.length === 1 && allTires.length > 1) {
    const secondCheapest = allTires[1]
    const secondPricePerTire = secondCheapest.sellingPrice + disposalFeePerTire + (secondCheapest.runFlat ? runFlatSurchargePerTire : 0)
    recommendations.push({
      label: 'Alternative',
      tire: secondCheapest,
      pricePerTire: parseFloat(secondPricePerTire.toFixed(2)),
      totalPrice: parseFloat((secondPricePerTire * quantity).toFixed(2)),
      quantity,
    })
  }

  return {
    recommendations,
    selectedIndex: 0, // Default to cheapest
    quantity,
    available: true,
  }
}

/**
 * Get available brands for filter dropdown
 */
export async function getAvailableBrands(
  workshopId: string,
  width?: string,
  height?: string,
  diameter?: string
): Promise<string[]> {
  const where: any = { workshopId }
  
  if (width) where.width = width
  if (height) where.height = height
  if (diameter) where.diameter = diameter

  const brands = await prisma.workshopInventory.findMany({
    where,
    select: { brand: true },
    distinct: ['brand'],
  })

  return brands
    .map(b => b.brand)
    .filter(b => b && b.trim())
    .sort() as string[]
}

/**
 * Search TyreSystem tires with live pricing and caching
 * 
 * Strategy:
 * 1. Query TireCatalog for matching tires (central catalog)
 * 2. Check TirePriceCache for each tire (15min TTL)
 * 3. Cache HIT: Use cached price (~100ms)
 * 4. Cache MISS: Query TyreSystem API + update cache (~500ms)
 * 
 * Benefits:
 * - Fast response for popular tires (150× faster with cache)
 * - Always fresh prices (15min TTL)
 * - No API costs on cache hits
 */
export async function searchTyreSystemTires(
  filters: TireSearchFilters
): Promise<TireSearchResult[]> {
  const { inquireArticle } = await import('@/lib/services/tyreSystemService')
  
  // 1. Query TireCatalog (central, admin-managed catalog)
  const where: any = {
    supplier: 'TYRESYSTEM',
    isActive: true,
    width: filters.width,
    height: filters.height,
    diameter: filters.diameter,
  }

  if (filters.season && filters.season !== 'all') {
    where.season = filters.season
  }

  if (filters.brands && filters.brands.length > 0) {
    where.brand = { in: filters.brands }
  }

  const catalogItems = await prisma.tireCatalog.findMany({
    where,
    select: {
      id: true,
      articleId: true,
      ean: true,
      brand: true,
      model: true,
      width: true,
      height: true,
      diameter: true,
      season: true,
      vehicleType: true,
      loadIndex: true,
      speedIndex: true,
      runFlat: true,
      threePMSF: true,
      labelFuelEfficiency: true,
      labelWetGrip: true,
      labelNoise: true,
      labelNoiseClass: true,
      eprelUrl: true,
    },
  })

  console.log(`🔍 [TyreSystem Search] Found ${catalogItems.length} articles in catalog`)

  if (catalogItems.length === 0) {
    return []
  }

  // 2. For each catalog item, check cache first
  const results: TireSearchResult[] = []
  const amount = filters.minStock || 4
  const CACHE_TTL_MINUTES = 15 // 15 minutes cache

  let cacheHits = 0
  let cacheMisses = 0

  for (const item of catalogItems) {
    try {
      // Check if we have valid cache
      const cache = await prisma.tirePriceCache.findFirst({
        where: {
          workshopId: filters.workshopId,
          tireCatalogId: item.id,
          expiresAt: { gt: new Date() } // Not expired
        }
      })

      let purchasePrice: number
      let sellingPrice: number
      let stock: number
      let markup: { fixed: number; percent: number }

      if (cache) {
        // ✅ CACHE HIT - Use cached data
        cacheHits++
        purchasePrice = parseFloat(cache.purchasePrice.toString())
        sellingPrice = parseFloat(cache.sellingPrice.toString())
        stock = cache.stock
        markup = {
          fixed: parseFloat(cache.markupFixed.toString()),
          percent: parseFloat(cache.markupPercent.toString())
        }

        // Increment hit counter
        await prisma.tirePriceCache.update({
          where: { id: cache.id },
          data: { hitCount: { increment: 1 } }
        })

        console.log(`✅ [Cache HIT] ${item.brand} ${item.model} - ${item.articleId}`)
      } else {
        // ❌ CACHE MISS - Query API
        cacheMisses++
        console.log(`⏳ [Cache MISS] ${item.brand} ${item.model} - Querying API...`)

        const inquiry = await inquireArticle(
          filters.workshopId,
          item.articleId,
          amount
        )

        if (!inquiry || !inquiry.inquiryResponse || !inquiry.inquiryResponse.offerData) {
          console.warn(`⚠️ No pricing data for article ${item.articleId}`)
          continue
        }

        const offerData = inquiry.inquiryResponse.offerData
        
        if (offerData.errorCode !== 0) {
          console.warn(`⚠️ Article ${item.articleId} not available: Error ${offerData.errorCode}`)
          continue
        }

        purchasePrice = parseFloat(offerData.price)
        stock = parseInt(offerData.stock) || 0

        // Calculate selling price with workshop markup
        const priceCalc = await calculateSellingPrice(
          filters.workshopId,
          purchasePrice,
          item.diameter,
          item.vehicleType || 'PKW'
        )
        
        sellingPrice = priceCalc.sellingPrice
        markup = priceCalc.markup

        // 💾 Save to cache (15min TTL)
        const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000)
        
        await prisma.tirePriceCache.upsert({
          where: {
            workshopId_tireCatalogId: {
              workshopId: filters.workshopId,
              tireCatalogId: item.id
            }
          },
          create: {
            workshopId: filters.workshopId,
            tireCatalogId: item.id,
            supplier: 'TYRESYSTEM',
            articleId: item.articleId,
            purchasePrice,
            sellingPrice,
            stock,
            markupFixed: markup.fixed,
            markupPercent: markup.percent,
            includeVat: true, // Assuming VAT included
            cachedAt: new Date(),
            expiresAt,
            hitCount: 0,
            apiVersion: '1.0'
          },
          update: {
            purchasePrice,
            sellingPrice,
            stock,
            markupFixed: markup.fixed,
            markupPercent: markup.percent,
            cachedAt: new Date(),
            expiresAt,
            updatedAt: new Date()
          }
        })

        console.log(`💾 [Cached] ${item.brand} ${item.model} - Valid until ${expiresAt.toISOString()}`)
      }

      // Check minimum stock requirement
      if (stock < amount) {
        continue
      }

      // Apply price filters
      if (filters.minPrice && sellingPrice < filters.minPrice) {
        continue
      }
      if (filters.maxPrice && sellingPrice > filters.maxPrice) {
        continue
      }

      // Add to results
      results.push({
        id: item.id,
        articleNumber: item.articleId,
        ean: item.ean || undefined,
        brand: item.brand,
        model: item.model,
        width: item.width,
        height: item.height,
        diameter: item.diameter,
        season: item.season,
        loadIndex: item.loadIndex || undefined,
        speedIndex: item.speedIndex || undefined,
        runFlat: item.runFlat,
        threePMSF: item.threePMSF,
        labelFuelEfficiency: item.labelFuelEfficiency || undefined,
        labelWetGrip: item.labelWetGrip || undefined,
        labelNoise: item.labelNoise || undefined,
        isDOT: item.model.toLowerCase().includes('dot'),
        eprelUrl: item.eprelUrl || undefined,
        stock,
        purchasePrice,
        sellingPrice,
        markup,
        supplier: 'TYRESYSTEM',
      })
    } catch (error) {
      console.error(`❌ Error processing article ${item.articleId}:`, error)
      continue
    }
  }

  console.log(`📊 [Cache Stats] Hits: ${cacheHits} | Misses: ${cacheMisses} | Hit Rate: ${cacheHits > 0 ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) : 0}%`)
  console.log(`✅ [TyreSystem Search] ${results.length} articles with pricing`)

  // 3. Sort results
  const sortBy = filters.sortBy || 'price'
  const sortOrder = filters.sortOrder || 'asc'

  results.sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'price':
        comparison = a.sellingPrice - b.sellingPrice
        break
      case 'brand':
        comparison = a.brand.localeCompare(b.brand)
        break
      case 'fuel':
        comparison = (a.labelFuelEfficiency || 'Z').localeCompare(b.labelFuelEfficiency || 'Z')
        break
      case 'wetGrip':
        comparison = (a.labelWetGrip || 'Z').localeCompare(b.labelWetGrip || 'Z')
        break
      case 'noise':
        comparison = (a.labelNoise || 999) - (b.labelNoise || 999)
        break
      default:
        comparison = a.sellingPrice - b.sellingPrice
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  return results
}

