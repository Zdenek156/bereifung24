# Google Maps Geocoding Integration

## Status: IN PROGRESS

Die Implementierung der Google Maps Geocoding API für präzise Umkreissuche ist zu ~80% abgeschlossen.

## Was wurde implementiert ✅

### 1. Geocoding Service (`lib/geocoding.ts`)
- ✅ `geocodeAddress()` - Konvertiert Adresse (Straße + PLZ + Stadt) zu Koordinaten
- ✅ `calculateDistance()` - Berechnet Luftlinie zwischen zwei Koordinaten (Haversine-Formel)
- ✅ `filterWorkshopsByRadius()` - Filtert Werkstätten nach Entfernung
- ✅ `isWithinRadius()` - Prüft ob Position im Umkreis liegt

### 2. Database Schema
- ✅ `User.latitude` und `User.longitude` Felder hinzugefügt
- ✅ `TireRequest.latitude` und `TireRequest.longitude` Felder hinzugefügt
- ✅ Migration `20251120201012_add_geocoding_fields` erstellt und ausgeführt

### 3. API Endpoints

#### Customer Registration (`app/api/auth/register/customer/route.ts`)
- ✅ Geocoding der Kundenadresse bei Registrierung
- ✅ Speicherung von latitude/longitude im User-Profil

#### Workshop Registration (`app/api/auth/register/workshop/route.ts`)
- ✅ Geocoding der Werkstattadresse bei Registrierung
- ✅ Speicherung von latitude/longitude im User-Profil

#### Tire Request Creation (`app/api/tire-requests/route.ts`)
- ✅ Geocoding der Kundenadresse bei Anfrageerstellung
- ✅ Speicherung von Koordinaten in TireRequest

#### Workshop Tire Requests (`app/api/workshop/tire-requests/route.ts`)
- ✅ Abruf der Werkstatt-Koordinaten
- ✅ Filterung nach Umkreis (radiusKm)
- ✅ Berechnung der Entfernung für jede Anfrage
- ✅ Sortierung nach Entfernung (nächste zuerst)
- ✅ Fallback: Zeigt alle Anfragen wenn Werkstatt keine Koordinaten hat

## Was fehlt noch ⏳

### 1. Google Maps API Key 🔑
**KRITISCH - Ohne diesen Key funktioniert nichts!**

1. Gehe zu https://console.cloud.google.com
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere "Geocoding API"
4. Erstelle einen API Key
5. Füge Restriktionen hinzu:
   - API-Beschränkung: Nur "Geocoding API"
   - Optional: HTTP-Referrer oder IP-Beschränkungen

6. Füge den Key zur `.env` hinzu:
   ```env
   GOOGLE_MAPS_API_KEY="dein_api_key_hier"
   ```

7. Füge den Key auch auf dem Production Server hinzu:
   ```bash
   ssh -i ~/.ssh/bereifung24_hetzner root@167.235.24.110
   cd bereifung24
   nano .env
   # Füge hinzu: GOOGLE_MAPS_API_KEY="..."
   pm2 restart bereifung24
   ```

### 2. TypeScript Fehler beheben
Die TypeScript Fehler treten auf, weil der Language Server die neuen Prisma-Felder noch nicht kennt.

**Lösung:**
1. VS Code neu starten ODER
2. TypeScript Server neu starten: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### 3. Profile Update APIs
Momentan wird nur bei Registrierung geocodet. Wenn ein User seine Adresse ändert, müssen die Koordinaten neu berechnet werden.

**TODO:**
- `app/api/user/profile/route.ts` - PUT-Method erweitern
- `app/api/workshop/profile/route.ts` - PUT-Method erweitern

### 4. Migration für Production Server
Die Migration ist lokal mit SQLite durchgeführt. Auf dem Production Server läuft PostgreSQL.

**TODO beim Deployment:**
```bash
cd bereifung24
npx prisma migrate deploy
```

**WICHTIG:** Schema auf PostgreSQL umstellen vor Deploy:
```prisma
datasource db {
  provider = "postgresql"  // NICHT sqlite!
  url      = env("DATABASE_URL")
}
```

### 5. Bestehende User/Werkstätten geocoden
Alle bestehenden User und Werkstätten haben `latitude=NULL` und `longitude=NULL`.

**Optionen:**
1. **Automatisches Geocoding:** Script erstellen das alle User geocodet
2. **Beim nächsten Login:** Geocode bei erstem Profil-Zugriff
3. **Manuell:** User müssen Profil einmal speichern

**Empfehlung:** Script für Bulk-Geocoding:
```typescript
// scripts/geocode-existing-users.ts
import { prisma } from '@/lib/prisma'
import { geocodeAddress } from '@/lib/geocoding'

async function geocodeExistingUsers() {
  const users = await prisma.user.findMany({
    where: {
      latitude: null,
      street: { not: null },
      zipCode: { not: null },
      city: { not: null }
    }
  })

  for (const user of users) {
    const result = await geocodeAddress(
      user.street!,
      user.zipCode!,
      user.city!
    )
    
    if (result) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          latitude: result.latitude,
          longitude: result.longitude
        }
      })
      console.log(`✓ Geocoded ${user.email}`)
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}
```

## Testing Checklist 🧪

### Lokales Testing
- [ ] API Key hinzugefügt zu `.env`
- [ ] TypeScript Server neu gestartet (keine Fehler mehr)
- [ ] Neuen Customer registrieren → Koordinaten gespeichert?
- [ ] Neue Werkstatt registrieren → Koordinaten gespeichert?
- [ ] Reifenanfrage erstellen → Koordinaten gespeichert?
- [ ] Als Werkstatt einloggen → Nur Anfragen im Umkreis sichtbar?

### Test-Szenarien
1. **Werkstatt in München, Kunde in Berlin (25km Radius)**
   - Erwartung: Werkstatt sieht Anfrage NICHT
   
2. **Werkstatt in München, Kunde in München (25km Radius)**
   - Erwartung: Werkstatt sieht Anfrage
   
3. **Werkstatt ohne Koordinaten**
   - Erwartung: Zeigt alle Anfragen + Warnung im Log

4. **Anfrage ohne Koordinaten**
   - Erwartung: Wird nicht an Werkstätten gezeigt

5. **50km Radius vs 100km Radius**
   - Erwartung: Mehr Werkstätten bei größerem Radius

### Production Testing
- [ ] Google Maps API Key auf Server hinzugefügt
- [ ] Schema auf PostgreSQL umgestellt
- [ ] Migration deployed (`prisma migrate deploy`)
- [ ] Deployment erfolgreich
- [ ] Registrierung getestet
- [ ] Umkreissuche getestet

## Kosten 💰

**Google Maps Geocoding API Preise:**
- Erste 40.000 Anfragen/Monat: **KOSTENLOS**
- Danach: $5 pro 1.000 Anfragen

**Schätzung für Bereifung24:**
- Registrierung: 1 Geocode pro User/Werkstatt
- Anfrageerstellung: 1 Geocode pro Anfrage
- Bei 500 Registrierungen + 1000 Anfragen/Monat = 1.500 Geocodes = **KOSTENLOS**

**TIPP:** API Key Budget Limit setzen:
- Gehe zu Google Cloud Console
- Billing → Budgets & Alerts
- Setze Alert bei z.B. $10/Monat

## Deployment Script

Verwende das bestehende `deploy.ps1` Script:

```powershell
.\deploy.ps1
```

Das Script macht:
1. SSH Connection mit bereifung24_hetzner Key
2. Git pull (holt neue Geocoding-Implementierung)
3. Prisma migrate deploy (fügt latitude/longitude Felder hinzu)
4. Prisma generate (regeneriert Client)
5. npm run build (baut neue Version)
6. PM2 restart (startet App neu)

## Nächste Schritte

1. **JETZT:**
   - [ ] Google Maps API Key erstellen und hinzufügen
   - [ ] VS Code neu starten (TypeScript Fehler beheben)
   - [ ] Lokal testen

2. **DANACH:**
   - [ ] Profile Update APIs erweitern (Geocoding bei Adressänderung)
   - [ ] Bulk-Geocoding Script für bestehende User

3. **DANN:**
   - [ ] Schema auf PostgreSQL umstellen
   - [ ] API Key auf Production Server hinzufügen
   - [ ] `deploy.ps1` ausführen
   - [ ] Production testen

4. **OPTIONAL:**
   - [ ] Geocoding Fehlerbehandlung verbessern
   - [ ] Caching für häufige Adressen
   - [ ] Admin-Dashboard: Statistiken über Geocoding-Success-Rate
   - [ ] Retry-Logik bei Google API Fehlern

## Bekannte Einschränkungen

1. **Luftlinie vs. Straßenentfernung**
   - Aktuell: Berechnung per Haversine (Luftlinie)
   - Echte Fahrtstrecke kann länger sein
   - Für Fahrzeit-Berechnung: Google Distance Matrix API nötig (teurer)

2. **Geocoding Genauigkeit**
   - Abhängig von Google Maps Datenqualität
   - Unvollständige Adressen können fehlschlagen
   - Tippfehler in Straßennamen problematisch

3. **Rate Limits**
   - Google: 50 Anfragen/Sekunde (Standard)
   - Bei Bulk-Geocoding: Sleep zwischen Requests einbauen

## Support & Dokumentation

- Google Maps Platform: https://developers.google.com/maps/documentation/geocoding
- Prisma Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula
