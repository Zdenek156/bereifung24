# Tire Search System - Migration Status

**Datum:** 25.02.2026

## Problem
Müller Reifenservice hat API-Credentials (TyreSystem), aber es werden keine Reifen angezeigt, weil:
- `tireSearchService.ts` sucht in `WorkshopInventory` (leer)
- Sollte in `TireCatalog` suchen + Live-Preise via API abrufen

## Lösung - Implementiert
✅ **Dual-Mode Tire Search System**

Der `tireSearchService` erkennt nun automatisch den Workshop-Modus:

### 1. API-Modus (für Müller Reifenservice)
```typescript
WorkshopSupplier.connectionType === 'API'
```
- Source: `TireCatalog` (zentral, 74.919 Reifen)
- Pricing: Live via TyreSystem API
- Stock: Live via TyreSystem API
- Markup: Werkstatt-spezifisch (TirePricingBySize)
- Auto-Order: Optional (`autoOrder` flag)

### 2. Database-Modus (für Werkstätten mit CSV-Import)
```typescript
WorkshopSupplier.connectionType === 'CSV'
```
- Source: `WorkshopInventory` (werkstatt-spezifisch)
- Pricing: Statisch aus Datenbank
- Stock: Statisch aus Datenbank
- Markup: Werkstatt-spezifisch
- Auto-Order: Nicht verfügbar (`requiresManualOrder = true`)

## Datenbankstruktur

### WorkshopSupplier (bestehend)
```prisma
model WorkshopSupplier {
  workshopId       String
  supplier         String        // 'TYRESYSTEM', 'REIFEN_COM', etc.
  connectionType   String        // 'API' | 'CSV'
  
  // API Mode
  usernameEncrypted String?
  passwordEncrypted String?
  
  // Settings
  isActive         Boolean @default(true)
  autoOrder        Boolean @default(false)       // Auto-Bestellung
  requiresManualOrder Boolean @default(false)    // Manuelle Bestellung
  priority         Int @default(1)
}
```

### TireCatalog (zentral)
- 74.919 Reifen von TYRESYSTEM
- Multi-Supplier ready
- EU Labels, RunFlat, 3PMSF
- articleId für API-Queries

### WorkshopInventory (werkstatt-spezifisch)
- CSV-Import Reifen
- Statische Preise
- Bestandsverwaltung

## Next Steps

### 1. Müller Reifenservice konfigurieren
```sql
UPDATE WorkshopSupplier
SET connectionType = 'API',
    autoOrder = true
WHERE workshopId = '<mueller-id>'
  AND supplier = 'TYRESYSTEM';
```

### 2. Test durchführen
- Reifensuche bei Müller Reifenservice
- Sollte jetzt 74.919 Reifen aus TireCatalog anzeigen
- Mit Live-Preisen via API

### 3. Performance optimieren
- [ ] TirePriceCache implementieren (15min TTL)
- [ ] Parallele API-Calls (Promise.all)
- [ ] Redis Caching

### 4. Auto-Order testen
- [ ] Buchung mit `autoOrder = true`
- [ ] TyreSystem Order API aufrufen
- [ ] Email an Werkstatt senden

## Files Changed
- `lib/services/tireSearchService.ts` (Refactored: 350+ lines)
  - `searchTires()` - Router function
  - `searchTiresViaAPI()` - NEW: TireCatalog + API
  - `searchTiresViaDatabase()` - Existing WorkshopInventory logic

## Testing Required
- [ ] API Mode: Müller Reifenservice zeigt Reifen
- [ ] Database Mode: Andere Werkstätten funktionieren weiterhin
- [ ] Price calculation: Markup korrekt angewendet
- [ ] Load/Speed Index filtering works
- [ ] Stock validation works
- [ ] AutoOrder flag respected
