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

  // Brand filter (overrides quality if both specified)
  if (brands && brands.length > 0) {
    where.brand = { in: brands }
  }

  // EU Label filters
  if (minFuelEfficiency) {
    where.labelFuelEfficiency = { lte: minFuelEfficiency } // A < B < C...
  }
  if (minWetGrip) {
    where.labelWetGrip = { lte: minWetGrip }
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

  // Calculate selling prices
  const results: TireSearchResult[] = []

  for (const tire of tires) {
    const { sellingPrice, markup } = await calculateSellingPrice(
      workshopId,
      tire.price,
      tire.diameter || diameter,
      tire.vehicleType || 'PKW'
    )

    // Apply price filters (on selling price)
    if (minPrice && sellingPrice < minPrice) {
      continue
    }
    if (maxPrice && sellingPrice > maxPrice) {
      continue
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
      loadIndex: tire.loadIndex || undefined,
      speedIndex: tire.speedIndex || undefined,
      runFlat: tire.runFlat,
      threePMSF: tire.threePMSF,
      labelFuelEfficiency: tire.labelFuelEfficiency || undefined,
      labelWetGrip: tire.labelWetGrip || undefined,
      labelNoise: tire.labelNoise || undefined,
      labelNoiseClass: tire.labelNoiseClass || undefined,
      eprelUrl: tire.eprelUrl || undefined,
      purchasePrice: tire.price,
      sellingPrice,
      markup,
      stock: tire.stock,
      supplier: tire.supplier,
    })
  }

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
  additionalFilters?: Partial<TireSearchFilters>
): Promise<TireRecommendationsResult> {
  const minStock = vehicleType === 'Motorrad' ? 2 : 4
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
  recommendations.push({
    label: 'Günstigster',
    tire: cheapest,
    pricePerTire: cheapest.sellingPrice,
    totalPrice: parseFloat((cheapest.sellingPrice * quantity).toFixed(2)),
    quantity,
  })

  // 2. Testsieger (best premium brand tire - cheapest of premium brands)
  const premiumTire = allTires.find(t => 
    PREMIUM_BRANDS.some(b => t.brand.toLowerCase().includes(b.toLowerCase()))
  )
  if (premiumTire && premiumTire.id !== cheapest.id) {
    recommendations.push({
      label: 'Testsieger',
      tire: premiumTire,
      pricePerTire: premiumTire.sellingPrice,
      totalPrice: parseFloat((premiumTire.sellingPrice * quantity).toFixed(2)),
      quantity,
    })
  }

  // 3. Beliebt (best quality-brand tire)
  const qualityTire = allTires.find(t => 
    QUALITY_BRANDS.some(b => t.brand.toLowerCase().includes(b.toLowerCase()))
  )
  if (qualityTire && qualityTire.id !== cheapest.id && qualityTire.id !== premiumTire?.id) {
    recommendations.push({
      label: 'Beliebt',
      tire: qualityTire,
      pricePerTire: qualityTire.sellingPrice,
      totalPrice: parseFloat((qualityTire.sellingPrice * quantity).toFixed(2)),
      quantity,
    })
  }

  // If we only have 1 recommendation and more tires, add second cheapest as alternative
  if (recommendations.length === 1 && allTires.length > 1) {
    const secondCheapest = allTires[1]
    recommendations.push({
      label: 'Alternative',
      tire: secondCheapest,
      pricePerTire: secondCheapest.sellingPrice,
      totalPrice: parseFloat((secondCheapest.sellingPrice * quantity).toFixed(2)),
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
