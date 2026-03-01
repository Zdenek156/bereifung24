# Tire Catalog Auto-Update Cronjob Setup

## Übersicht

Die automatische Aktualisierung der Reifenkataloge lädt CSV-Daten von konfigurierten Download-Links und importiert sie automatisch in die zentrale Datenbank.

## API Endpoint

- **URL:** `https://bereifung24.de/api/cron/update-tire-catalogs`
- **Methode:** `POST`
- **Authorization:** `Bearer YOUR_CRON_SECRET`

## Voraussetzungen

1. **CRON_SECRET** in `.env` oder Umgebungsvariablen setzen:
   ```env
   CRON_SECRET=your-secure-random-secret-here
   ```

2. **Lieferant mit CSV-Download-Link** in der Datenbank konfigurieren:
   - Gehen Sie zu **Admin → Reifenkatalog → Lieferanten**
   - Fügen Sie einen neuen Lieferanten hinzu
   - Tragen Sie die **CSV-Download-URL** ein
   - Setzen Sie **Status** auf **Aktiv**

## Cronjob Einrichtung

### Option 1: Server Crontab (Empfohlen)

SSH auf den Server und fügen Sie folgende Zeile zur crontab hinzu:

```bash
# Bearbeiten der crontab
crontab -e

# Fügen Sie eine dieser Zeilen hinzu:

# Wöchentlich (jeden Sonntag um 3 Uhr morgens)
0 3 * * 0 curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://bereifung24.de/api/cron/update-tire-catalogs

# Monatlich (am 1. Tag des Monats um 3 Uhr morgens)
0 3 1 * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://bereifung24.de/api/cron/update-tire-catalogs
```

**Cron Schedule Syntax:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Wochentag (0-6, Sonntag = 0)
│ │ │ └─── Monat (1-12)
│ │ └───── Tag (1-31)
│ └─────── Stunde (0-23)
└───────── Minute (0-59)
```

### Option 2: EasyCron.com (Externe Lösung)

1. Registrieren Sie sich auf [EasyCron.com](https://www.easycron.com/) (100 kostenlose Jobs)
2. Erstellen Sie einen neuen Cronjob:
   - **URL:** `https://bereifung24.de/api/cron/update-tire-catalogs`
   - **Method:** POST
   - **HTTP Header:** `Authorization: Bearer YOUR_CRON_SECRET`
   - **Schedule:** Wählen Sie "Weekly" oder "Monthly"
3. Speichern und aktivieren

### Option 3: GitHub Actions (für GitHub-Projekte)

Erstellen Sie `.github/workflows/update-tire-catalogs.yml`:

```yaml
name: Update Tire Catalogs

on:
  schedule:
    - cron: '0 3 * * 0' # Sonntags um 3 Uhr
  workflow_dispatch: # Für manuellen Trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Tire Catalog Update
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://bereifung24.de/api/cron/update-tire-catalogs
```

## Manueller Test

Testen Sie den Cronjob manuell via curl:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://bereifung24.de/api/cron/update-tire-catalogs
```

Erwartete Antwort:
```json
{
  "success": true,
  "message": "Tire catalog update completed",
  "summary": {
    "total": 1,
    "success": 1,
    "failed": 0,
    "results": [
      {
        "supplier": "TYRESYSTEM",
        "name": "TyreSystem API",
        "success": true,
        "stats": {
          "total": 150,
          "imported": 120,
          "updated": 30,
          "skipped": 0,
          "errors": []
        }
      }
    ]
  }
}
```

## Health Check

Prüfen Sie den Status des Cronjobs:

```bash
curl https://bereifung24.de/api/cron/update-tire-catalogs
```

Antwort:
```json
{
  "service": "Tire Catalog Auto-Update",
  "status": "healthy",
  "suppliersConfigured": 1,
  "schedule": {
    "weekly": "0 3 * * 0 (Every Sunday at 3 AM)",
    "monthly": "0 3 1 * * (1st day of month at 3 AM)"
  },
  "usage": "POST with Authorization: Bearer YOUR_CRON_SECRET"
}
```

## Logging

Alle Cronjob-Ausführungen werden geloggt:

```bash
# Server-Logs prüfen
pm2 logs bereifung24 | grep CRON

# Beispiel-Ausgabe:
# [CRON] Starting automatic tire catalog updates...
# [CRON] Found 1 supplier(s) with CSV URLs
# [CRON] Downloading CSV for TyreSystem API (TYRESYSTEM)...
# [CRON] Downloaded 87543 bytes for TYRESYSTEM
# [CRON] ✓ TYRESYSTEM: 120 imported, 30 updated
# [CRON] Tire catalog update completed
```

## Fehlerbehebung

### Problem: "Unauthorized" Fehler

**Lösung:** Stellen Sie sicher, dass der `Authorization` Header korrekt gesetzt ist:
```bash
-H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Problem: "No suppliers configured"

**Lösung:** 
1. Gehen Sie zu **Admin → Reifenkatalog → Lieferanten**
2. Stellen Sie sicher, dass mindestens ein Lieferant:
   - **Aktiv** ist (Status = Aktiv)
   - Eine **CSV-Download-URL** hat

### Problem: CSV-Download schlägt fehl

**Lösung:**
- Prüfen Sie, ob die CSV-URL erreichbar ist (Browser-Test)
- Prüfen Sie Server-Logs für Fehlermeldungen
- Testen Sie den Import manuell über die Admin-Oberfläche

### Problem: Import schlägt fehl

**Lösung:**
- Prüfen Sie das CSV-Format (muss TyreSystem-kompatibel sein)
- Prüfen Sie die Fehlermeldungen im Log
- Testen Sie mit einer kleineren CSV-Datei

## Sicherheit

⚠️ **Wichtig:**
- Verwenden Sie einen **starken, zufälligen CRON_SECRET**
- Teilen Sie den Secret **niemals öffentlich**
- Ändern Sie den Secret regelmäßig (z.B. jährlich)

Generieren Sie einen sicheren Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
