# EPREL API Integration - Konfiguration

## Status
❌ API Key funktioniert aktuell nicht (Stand: 08.01.2026)
- Error: "Missing Authentication Token"
- Support-Anfrage gesendet an: ENER-B1@ec.europa.eu

## Korrekte API-Konfiguration

### Endpoint-Format
```
GET https://eprel.ec.europa.eu/api/public/energylabel/v1/tyres/{modelIdentifier}
```

### Headers
```
x-api-key: [DEIN_API_KEY]     # WICHTIG: lowercase!
Accept: application/json
```

### Beispiel-Request
```javascript
const response = await fetch(
  'https://eprel.ec.europa.eu/api/public/energylabel/v1/tyres/123456789',
  {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Accept': 'application/json'
    }
  }
);
```

## Implementierung im Projekt

### API Route
- **Datei**: `app/api/eprel/search/route.ts`
- **Funktion**: Sucht Reifen basierend auf Dimension und Saison
- **Fallback**: Mock-Daten (15 Hersteller, 75+ Modelle)

### Code-Anpassungen bei neuem API Key

1. **API Key in Datenbank speichern**:
   ```bash
   # SSH auf Server
   ssh -i "C:\Users\zdene\.ssh\bereifung24_hetzner" root@167.235.24.110
   
   # Node-Script ausführen
   cd /var/www/bereifung24
   node add-eprel-api-key.js
   ```

2. **Endpoint in app/api/eprel/search/route.ts anpassen**:
   - Aktuell: `https://eprel.ec.europa.eu/api/products/tyres`
   - Korrekt: `https://eprel.ec.europa.eu/api/public/energylabel/v1/tyres/{modelId}`

3. **Mapping der EPREL-Felder prüfen**:
   ```typescript
   // Aktuelle Feldnamen (zu verifizieren mit echten Daten):
   {
     supplierName → manufacturer
     modelName/commercialName → model
     wetGripClass → wetGripClass
     fuelEfficiencyClass → fuelEfficiency
     externalRollingNoiseLevel → noiseLevel
     hasSnowflake → has3PMSF
   }
   ```

## Getestete Varianten (alle fehlgeschlagen)

### Endpoints
- ❌ `/api/v1.0.92/exportProducts/tyres`
- ❌ `/api/exportProducts/tyres`
- ❌ `/api/v1.0.92/products/tyres`
- ❌ `/api/products/tyres`
- ❌ `/api/public/energylabel/v1/tyres` (ohne modelId)
- ❌ `/api/public/energylabel/v1/tyres/{modelId}` (mit verschiedenen IDs)

### Header-Varianten
- ❌ `x-api-key`
- ❌ `X-API-KEY`
- ❌ `X-Api-Key`
- ❌ `Authorization: Bearer {key}`
- ❌ `Authorization: {key}`
- ❌ `api-key`
- ❌ `apikey`

## Mock-Daten System

### Funktionalität
✅ Vollständig implementiert und aktiv
- 15 Hersteller (Continental, Michelin, Bridgestone, etc.)
- 25 Sommerreifen-Modelle
- 25 Winterreifen-Modelle
- 25 Ganzjahresreifen-Modelle
- Realistische EU-Label-Daten (A-E Ratings)
- Prioritäts-basierte Sortierung

### Automatischer Fallback
System wechselt automatisch zu echten EPREL-Daten sobald API Key funktioniert:
```typescript
// Keine Code-Änderung nötig!
// Fallback-Logik in app/api/eprel/search/route.ts bereits implementiert
if (!apiKey) return mockData;
if (apiError) return mockData;
if (noResults) return mockData;
```

## Server-Info
- IP: 167.235.24.110 (Hetzner)
- Deployment: `ssh root@167.235.24.110` + `cd /var/www/bereifung24 && git pull && npm run build && pm2 restart bereifung24`

## Nächste Schritte bei neuem API Key

1. ✅ API Key in Admin-Panel eintragen (Settings → API Settings → EPREL_API_KEY)
2. ✅ Test-Endpoint aufrufen: `/api/eprel/test` (nur für Admins)
3. ✅ Bei Success: Feldnamen-Mapping in `/api/eprel/search/route.ts` verifizieren
4. ✅ TireAdvisorWidget testen im Customer-Dashboard
5. ✅ Console-Logs prüfen: "EPREL API Response: 200", "source: 'eprel'"

## Kontakt
- EPREL Support: ENER-B1@ec.europa.eu
- Bereifung24: info@bereifung24.de
- Wiki: https://webgate.ec.europa.eu/fpfis/wikis/spaces/EPREL/
