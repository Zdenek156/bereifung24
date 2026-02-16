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

  // If no specific rule, get default workshop settings
  if (!pricingRule) {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: {
        autoFixedMarkup: true,
        autoPercentMarkup: true,
        autoIncludeVat: true,
        motoFixedMarkup: true,
        motoPercentMarkup: true,
        motoIncludeVat: true,
      },
    })

    if (!workshop) {
      throw new Error(`Workshop ${workshopId} not found`)
    }

    const isMoto = vehicleType === 'Motorrad'
    const fixedMarkup = isMoto ? workshop.motoFixedMarkup : workshop.autoFixedMarkup
    const percentMarkup = isMoto ? workshop.motoPercentMarkup : workshop.autoPercentMarkup
    const includeVat = isMoto ? workshop.motoIncludeVat : workshop.autoIncludeVat

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
    console.log(`🌡️ [Tire Search] Filtering by season: "${season}"`)
  } else {
    console.log(`🌡️ [Tire Search] No season filter applied (season="${season}")`)
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

  // Brand filter (overrides quality if both specified)
  if (brands && brands.length > 0) {
    where.brand = { in: brands }
    console.log(`🎨 [Brand Filter] Filtering by ${brands.length} brands:`, brands.slice(0, 5))  // Log first 5 brands
  }

  // EU Label filters (A=best, G=worst)
  // User selects "minimum acceptable quality" - e.g., "at least B" means A or B
  if (minFuelEfficiency) {
    const labelHierarchy = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const minIndex = labelHierarchy.indexOf(minFuelEfficiency)
    if (minIndex !== -1) {
      const acceptableLabels = labelHierarchy.slice(0, minIndex + 1)
      where.labelFuelEfficiency = { in: acceptableLabels }
      console.log(`🏷️ [Fuel Filter] Minimum ${minFuelEfficiency} → Accepting:`, acceptableLabels)
    }
  }
  if (minWetGrip) {
    const labelHierarchy = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const minIndex = labelHierarchy.indexOf(minWetGrip)
    if (minIndex !== -1) {
      const acceptableLabels = labelHierarchy.slice(0, minIndex + 1)
      where.labelWetGrip = { in: acceptableLabels }
      console.log(`🏷️ [Wet Grip Filter] Minimum ${minWetGrip} → Accepting:`, acceptableLabels)
    }
  }
  if (maxNoise) {
    where.labelNoise = { lte: maxNoise }
    console.log(`🔇 [Noise Filter] Maximum ${maxNoise}dB`)
  }

  // Feature filters
  if (runFlat !== undefined) {
    where.runFlat = runFlat
  }
  if (threePMSF !== undefined) {
    where.threePMSF = threePMSF
  }

  // Model exclusions: Always exclude DEMO
  const modelExclusions: any[] = [
    { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } }
  ]
  
  // DOT filter logic:
  // - showDOTTires = false (default): Show ALL tires (no DOT filtering)
  // - showDOTTires = true: ONLY show DOT tires (older stock)
  if (filters.showDOTTires === true) {
    // Show ONLY DOT tires (older stock)
    modelExclusions.push({ model: { contains: 'DOT', mode: 'insensitive' } })
    console.log('🔴 [DOT Filter] Showing ONLY DOT tires (older stock)')
  }
  // else: Default - no DOT filtering, show all tires
  
  // Add model exclusions to AND clause
  if (!where.AND) {
    where.AND = modelExclusions
  } else {
    where.AND = Array.isArray(where.AND) ? [...where.AND, ...modelExclusions] : [where.AND, ...modelExclusions]
  }

  // Fetch matching tires
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
  
  console.log(`📊 [Tire Search] Found ${tires.length} tires. First 3 seasons:`, tires.slice(0, 3).map(t => `${t.brand} ${t.model} (season="${t.season}")`))

  // Speed index hierarchy (slowest to fastest) for post-filtering
  const SPEED_INDEX_ORDER = ['L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'ZR']

  console.log(`🔍 [Tire Search] FILTER REQUIREMENTS:`, {
    minLoadIndex: filters.minLoadIndex || 'NONE',
    minSpeedIndex: filters.minSpeedIndex || 'NONE',
    willFilterByLoad: !!filters.minLoadIndex,
    willFilterBySpeed: !!filters.minSpeedIndex
  })

  // Calculate selling prices and apply filters
  const results: TireSearchResult[] = []
  let filteredOutCount = 0

  for (const tire of tires) {
    // CRITICAL: Load Index filter (must be >= vehicle's load index)
    if (filters.minLoadIndex && tire.loadIndex) {
      // Extract numeric load index from strings like "(91Y) (Z)" or "91" or "91Y"
      const loadIndexMatch = tire.loadIndex.match(/(\d+)/)
      const tireLoad = loadIndexMatch ? parseInt(loadIndexMatch[1]) : NaN
      const minLoad = parseInt(filters.minLoadIndex)
      
      if (!isNaN(tireLoad) && !isNaN(minLoad) && tireLoad < minLoad) {
        console.log(`❌🔒 [TIRE FILTER] Skipping ${tire.brand} ${tire.model}: Load Index ${tireLoad} (from "${tire.loadIndex}") < required ${filters.minLoadIndex}`)
        filteredOutCount++
        continue
      }
      
      if (isNaN(tireLoad)) {
        console.log(`⚠️ [TIRE FILTER] WARNING: ${tire.brand} ${tire.model} has UNPARSEABLE loadIndex "${tire.loadIndex}" (required: ${filters.minLoadIndex})`)
      }
    }
    // WARNING: If tire has no load index in database, it won't be filtered
    if (filters.minLoadIndex && !tire.loadIndex) {
      console.log(`⚠️ [TIRE FILTER] WARNING: ${tire.brand} ${tire.model} has NO loadIndex in database (required: ${filters.minLoadIndex})`)
    }

    // CRITICAL: Speed Index filter (must be >= vehicle's speed rating)
    if (filters.minSpeedIndex && tire.speedIndex) {
      const tireSpeedIdx = SPEED_INDEX_ORDER.indexOf(tire.speedIndex)
      const minSpeedIdx = SPEED_INDEX_ORDER.indexOf(filters.minSpeedIndex)
      if (tireSpeedIdx !== -1 && minSpeedIdx !== -1 && tireSpeedIdx < minSpeedIdx) {
        console.log(`❌🔒 [TIRE FILTER] Skipping ${tire.brand} ${tire.model}: Speed Index ${tire.speedIndex} < required ${filters.minSpeedIndex}`)
        filteredOutCount++
        continue
      }
    }
    // WARNING: If tire has no speed index in database, it won't be filtered
    if (filters.minSpeedIndex && !tire.speedIndex) {
      console.log(`⚠️ [TIRE FILTER] WARNING: ${tire.brand} ${tire.model} has NO speedIndex in database (required: ${filters.minSpeedIndex})`)
    }

    const { sellingPrice, markup } = await calculateSellingPrice(
      workshopId,
      tire.price,
      tire.diameter || diameter,
      tire.vehicleType || 'PKW'
    )

    // Apply price filters (on selling price)
    if (minPrice && sellingPrice < minPrice) {
      console.log(`💰 [Price Filter] Skipping ${tire.brand} ${tire.model}: €${sellingPrice.toFixed(2)} < min €${minPrice}`)
      filteredOutCount++
      continue
    }
    if (maxPrice && sellingPrice > maxPrice) {
      console.log(`💰 [Price Filter] Skipping ${tire.brand} ${tire.model}: €${sellingPrice.toFixed(2)} > max €${maxPrice}`)
      filteredOutCount++
      continue
    }

    // Clean up load index - extract just the number from strings like "(91Y) (Z)"
    let cleanLoadIndex = tire.loadIndex
    if (cleanLoadIndex) {
      const match = cleanLoadIndex.match(/(\d+)/)
      if (match) {
        cleanLoadIndex = match[1]
      }
    }

    // Extract DOT information from model name
    const isDOT = tire.model?.toUpperCase().includes('DOT') || false
    let dotInfo: string | undefined
    if (isDOT && tire.model) {
      // Try to extract DOT date from model name (e.g., "DOT2021", "DOT 48/2021", "DOT 2019")
      const dotMatch = tire.model.match(/DOT\s*([0-9\/\s]+)/i)
      if (dotMatch) {
        dotInfo = `DOT ${dotMatch[1].trim()}`
      } else {
        dotInfo = 'DOT'
      }
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
  
  console.log(`✅ [Tire Search] After filters: ${results.length} tires available, ${filteredOutCount} tires filtered out${filters.minLoadIndex ? ` (Load ≥${filters.minLoadIndex})` : ''}${filters.minSpeedIndex ? ` (Speed ≥${filters.minSpeedIndex})` : ''}`)

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
