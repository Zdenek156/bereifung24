// Utility functions for Procurement module

export function generateRequestNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ANF-${year}-${random}`
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PO-${year}-${random}`
}

export function generateAssetNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ASS-${year}-${random}`
}

export function calculateDepreciation(
  acquisitionCost: number,
  usefulLife: number,
  method: 'LINEAR' | 'DEGRESSIV' | 'SOFORT'
): number {
  if (method === 'SOFORT') {
    return acquisitionCost
  }
  
  if (method === 'LINEAR') {
    return acquisitionCost / usefulLife
  }
  
  // Degressiv (simplified - max 25% or 2.5x linear)
  const linear = acquisitionCost / usefulLife
  const degressiv = acquisitionCost * 0.25
  return Math.min(degressiv, linear * 2.5)
}

export function getAfaUsefulLife(category: string): number {
  const afaTable: Record<string, number> = {
    COMPUTER: 3,
    MONITOR: 3,
    PERIPHERALS: 3,
    SOFTWARE: 3,
    FURNITURE: 13,
    VEHICLE: 6,
    PHONE: 5,
    NETWORK: 5,
    SERVER: 5,
    OTHER: 5
  }
  
  return afaTable[category] || 5
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export function calculateVat(netAmount: number, vatRate: number): number {
  return netAmount * vatRate
}

export function calculateGross(netAmount: number, vatRate: number): number {
  return netAmount + calculateVat(netAmount, vatRate)
}
