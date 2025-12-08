// Utility function to format price display with tax information
export function formatPriceWithTax(price: number, taxMode?: string): string {
  const formattedPrice = price.toFixed(2) + ' €'
  
  if (!taxMode || taxMode === 'STANDARD') {
    return formattedPrice
  }
  
  return formattedPrice
}

export function getTaxLabel(taxMode?: string): string {
  if (!taxMode || taxMode === 'STANDARD') {
    return 'inkl. MwSt.'
  }
  return 'gemäß §19 UStG (ohne MwSt.)'
}

export function getPriceNote(taxMode?: string): string {
  if (!taxMode || taxMode === 'STANDARD') {
    return 'Alle Preise inkl. gesetzl. MwSt.'
  }
  return 'Keine Umsatzsteuer gemäß §19 UStG'
}
