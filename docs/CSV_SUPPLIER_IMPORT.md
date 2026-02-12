# CSV Supplier Import System

## Übersicht

Das CSV Import System ermöglicht es Werkstätten, Lieferanten ohne API-Anbindung zu integrieren. Lieferanten, die nur eine CSV-Export-Datei bereitstellen, können über eine Download-URL stündlich synchronisiert werden.

## Features

### ✅ Dual-Mode Supplier Integration
- **API-Modus**: Bestehende Funktionalität (Echtzeit-Preise, automatische Bestellung)
- **CSV-Modus**: Import via URL-Download (stündliche Synchronisierung, manuelle Bestellung)

### ✅ Automatische Synchronisierung
- Alle aktiven CSV-Supplier werden jede Stunde automatisch synchronisiert
- Status-Tracking: `pending` → `syncing` → `success` oder `error`
- Fehlerbehandlung mit detaillierter Fehlermeldung

### ✅ Vollständige UI
- Radio-Button-Auswahl: 🔌 API-Integration oder 📄 CSV-Import
- Bedingte Formular-Felder (API: Benutzername/Passwort, CSV: Download-URL)
- Warnhinweis bei CSV-Modus: "Datenbank wird jede Stunde aktualisiert, Bestellung muss manuell erfolgen"
- Supplier-Liste zeigt verschiedene Badges und Metriken je Verbindungstyp

## Datenbank Schema

### WorkshopSupplier (erweitert)
```prisma
model WorkshopSupplier {
  // Connection Type
  connectionType String @default("API") // 'API' | 'CSV'
  
  // API Credentials (nur bei API)
  usernameEncrypted String?
  passwordEncrypted String?
  encryptionIv      String?
  
  // CSV Import (nur bei CSV)
  csvImportUrl     String?   // Download-URL
  lastCsvSync      DateTime? // Letzte Synchronisierung
  csvSyncStatus    String?   // 'SUCCESS' | 'ERROR' | 'PENDING'
  csvSyncError     String?   // Fehlermeldung
  
  // Settings
  requiresManualOrder Boolean @default(false) // true bei CSV
  autoOrder           Boolean @default(false) // false bei CSV
}
```

### WorkshopInventory (neu)
```prisma
model WorkshopInventory {
  workshopId    String
  supplier      String   // 'TYRESYSTEM', etc.
  articleNumber String   // Lieferanten-Artikel-Nr
  
  // Produktinformationen
  brand    String?
  model    String?
  width    String?
  height   String?
  diameter String?
  
  // Preise & Verfügbarkeit
  price       Float
  stock       Int
  lastUpdated DateTime
  
  @@unique([workshopId, articleNumber, supplier])
}
```

## CSV Format

### Standard-Format (min. 3 Spalten)
```csv
Artikel-Nr;Preis;Lager
123456789;45.99;25
987654321;89.50;10
```

### Erweitertes Format (7 Spalten)
```csv
Artikel-Nr;Preis;Lager;Marke;Modell;Breite;Höhe;Durchmesser
123456789;45.99;25;Continental;WinterContact TS 870;205;55;16
987654321;89.50;10;Michelin;Primacy 4;225;50;17
```

### Unterstützte Trennzeichen
- Semikolon (`;`) - Standard
- Komma (`,`) - Alternative

### CSV-Parser Logik
- Erste Zeile wird als Header übersprungen
- Preise können mit Komma (`45,99`) oder Punkt (`45.99`) formatiert sein
- Leere Zeilen werden ignoriert
- Anführungszeichen werden entfernt

## API Endpoints

### POST /api/workshop/suppliers
**Supplier erstellen/aktualisieren**

#### Request Body für API-Modus:
```json
{
  "supplier": "TYRESYSTEM",
  "name": "TyreSystem GmbH",
  "connectionType": "API",
  "username": "werkstatt123",
  "password": "geheim",
  "isActive": true,
  "autoOrder": false,
  "priority": 1
}
```

#### Request Body für CSV-Modus:
```json
{
  "supplier": "CSV_SUPPLIER_A",
  "name": "CSV-Lieferant GmbH",
  "connectionType": "CSV",
  "csvUrl": "https://example.com/export/tires.csv",
  "isActive": true,
  "priority": 2
}
```

#### Response:
```json
{
  "success": true,
  "supplier": { ... }
}
```

### POST /api/workshop/suppliers/sync-csv
**Manueller CSV-Sync**

#### Request Body:
```json
{
  "supplierId": "clxxxxx123"
}
```

#### Response:
```json
{
  "success": true,
  "imported": 450,
  "updated": 1200,
  "total": 1650
}
```

### GET /api/cron/sync-supplier-csv
**Automatischer Cron-Job (stündlich)**

#### Authorization:
```
Authorization: Bearer <CRON_SECRET>
```

#### Response:
```json
{
  "total": 3,
  "success": 2,
  "failed": 1,
  "results": [
    {
      "workshop": "clw123",
      "supplier": "CSV_SUPPLIER_A",
      "status": "success",
      "imported": 100,
      "updated": 400
    },
    {
      "workshop": "clw456",
      "supplier": "CSV_SUPPLIER_B",
      "status": "error",
      "error": "HTTP 404: Not Found"
    }
  ]
}
```

## Cron Job Setup

### Option 1: Easy Cron (empfohlen für Server ohne root)
1. Gehe zu https://www.easycron.com/
2. Account erstellen (Free Plan: 20 Tasks)
3. New Cron Job:
   - **URL**: `https://bereifung24.de/api/cron/sync-supplier-csv`
   - **Schedule**: Every hour (`0 * * * *`)
   - **Authorization Header**: `Bearer <CRON_SECRET>` (aus .env)
   - **Timeout**: 60 Sekunden

### Option 2: Server Crontab (benötigt SSH-Zugriff)
```bash
# Crontab editieren
crontab -e

# Stündlicher Cron-Job hinzufügen (jede volle Stunde)
0 * * * * curl -X GET -H "Authorization: Bearer <CRON_SECRET>" https://bereifung24.de/api/cron/sync-supplier-csv >> /var/log/bereifung24-csv-sync.log 2>&1
```

### Option 3: Vercel Cron (nur für Vercel-Hosted Apps)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-supplier-csv",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Environment Variables

```env
# .env.local oder .env
CRON_SECRET=generate_secure_random_token_here
```

**WICHTIG**: Generiere ein sicheres Token:
```bash
openssl rand -base64 32
```

## Testing

### 1. CSV-Supplier manuell erstellen
```bash
# Via UI: Dashboard → Einstellungen → Lieferanten
# Radio Button auf "CSV-Import" stellen
# URL: https://example.com/test-tires.csv
# Speichern
```

### 2. Manuellen Sync testen
```bash
curl -X POST https://bereifung24.de/api/workshop/suppliers/sync-csv \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"supplierId":"clxxxxx123"}'
```

### 3. Cron-Job testen
```bash
curl -X GET https://bereifung24.de/api/cron/sync-supplier-csv \
  -H "Authorization: Bearer <CRON_SECRET>"
```

### 4. Inventory prüfen
```sql
-- Via Prisma Studio oder PGAdmin
SELECT * FROM workshop_inventory 
WHERE workshop_id = 'clxxxxx' 
AND supplier = 'CSV_SUPPLIER_A' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Deployment

### 1. Schema Migration
```bash
# Lokal testen (optional, DB muss laufen)
npx prisma migrate dev --name add_csv_supplier_mode

# Auf Production deployen
ssh root@167.235.24.110
cd /var/www/bereifung24
git pull origin main
npx prisma migrate deploy
npm run build
pm2 restart bereifung24
```

### 2. Cron Job aktivieren
- Easy Cron Account erstellen und Job einrichten (siehe oben)
- `CRON_SECRET` in `.env` auf dem Server setzen

### 3. Testen
- CSV-Supplier in Dashboard erstellen
- "CSV jetzt sync" Button klicken
- Inventory prüfen
- Cron-Job manuell auslösen und Response prüfen

## Fehlerbehebung

### CSV-Download schlägt fehl
```
Fehler: HTTP 404: Not Found
```
**Lösung**: CSV-URL prüfen, im Browser testen

### CSV-Parsing-Fehler
```
Fehler: No valid data in CSV
```
**Lösung**: 
- Header-Zeile vorhanden?
- Mindestens 3 Spalten (Artikel-Nr, Preis, Lager)?
- Trennzeichen korrekt (`;` oder `,`)?

### Timeout bei großen CSV-Dateien
```
Fehler: AbortError: The operation was aborted
```
**Lösung**: 
- Timeout in `csvSupplierService.ts` erhöhen (Standard: 30s)
- CSV-Datei komprimieren oder aufteilen

### Cron-Job wird nicht ausgeführt
**Prüfen**:
- Easy Cron Dashboard → Execution History
- Server Logs: `pm2 logs bereifung24 | grep CRON`
- Authorization Header korrekt?
- `CRON_SECRET` in `.env` gesetzt?

## Security

### ✅ Implementierte Sicherheitsmaßnahmen
- API-Credentials verschlüsselt (AES-256) - nur bei API-Modus
- CSV-URLs werden validiert (URL-Format prüfen)
- Cron-Job benötigt Authorization Bearer Token
- SQL-Injection-sicher (Prisma ORM)
- Rate-Limiting für manuelle Sync-Requests (TODO)

### ⚠️ Wichtige Hinweise
- CSV-URLs sollten HTTPS verwenden
- `CRON_SECRET` niemals in Git committen
- CSV-Dateien sollten keine sensiblen Daten enthalten
- Supplier kann nur auf eigene Inventory zugreifen (workshopId check)

## Roadmap

### Phase 1: MVP (abgeschlossen)
- [x] Prisma schema extension
- [x] UI mit connection type selector
- [x] API endpoints für beide Modi
- [x] CSV-Parser & Sync-Logik
- [x] Cron-Job-Endpoint
- [x] Migration erstellt

### Phase 2: Erweiterungen (geplant)
- [ ] Rate-Limiting für manuelle Syncs (max 1x/5min)
- [ ] CSV-Historie (letzte 10 Sync-Results speichern)
- [ ] Benachrichtigung bei Sync-Fehlern (Email an Werkstatt)
- [ ] CSV-Vorschau im Dashboard (Validierung vor Import)
- [ ] Bulk-Import (mehrere CSV-Dateien auf einmal)

### Phase 3: Advanced Features (später)
- [ ] FTP/SFTP-Support (für Lieferanten ohne HTTP-Export)
- [ ] Excel-Import (.xlsx Support)
- [ ] Custom Field Mapping (flexible Spaltenreihenfolge)
- [ ] Duplikat-Erkennung (gleiche Reifen von mehreren Lieferanten)
- [ ] Preisvergleich (günstigster Lieferant highlighten)

## Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Email: entwickler@bereifung24.de
- Dokumentation: `/docs/csv-supplier-import`
