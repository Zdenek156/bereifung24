# API Ninjas Integration - Fahrzeugdaten

## 🎯 Überblick

Integration von **API Ninjas** für automatische Fahrzeugdaten-Ermittlung mit zwei Optionen:
1. **VIN Lookup** - Automatische Daten über Fahrgestellnummer (FIN)
2. **Cars API** - Manuelle Suche nach Marke, Modell, Baujahr

## 📋 Implementierte Features

### ✅ Backend APIs

#### 1. VIN Lookup API
**Endpoint:** `GET /api/vehicles/vin-lookup?vin=WVWZZZ3CZHE123456`

**Funktionen:**
- 17-stellige VIN validierung
- API Ninjas VIN Lookup Integration
- Automatische Datenerfassung:
  - Hersteller (make)
  - Modell (model)
  - Baujahr (year)
  - Motor (engine)
  - Getriebe (transmission)
  - Antrieb (drive: FWD/RWD/AWD)
  - Kraftstofftyp (fuelType)
  - Verbrauch (MPG-Werte)

**Response:**
```json
{
  "make": "Volkswagen",
  "model": "Golf",
  "year": 2020,
  "vin": "WVWZZZ3CZHE123456",
  "engine": "2.0L I4",
  "transmission": "Automatic",
  "drive": "FWD",
  "fuelType": "GASOLINE",
  "city_mpg": 28,
  "highway_mpg": 36,
  "combined_mpg": 31
}
```

#### 2. Cars Search API
**Endpoint:** `GET /api/vehicles/search?make=Volkswagen&model=Golf&year=2020`

**Parameter:**
- `make` (required) - Hersteller
- `model` (optional) - Modellbezeichnung
- `year` (optional) - Baujahr

**Funktionen:**
- Suche in API Ninjas Car Database
- Filterung nach Kriterien
- Duplikat-Entfernung
- Max. 50 Ergebnisse

**Response:**
```json
[
  {
    "make": "Volkswagen",
    "model": "Golf GTI",
    "year": 2020,
    "class": "compact",
    "fuelType": "GASOLINE",
    "drive": "fwd",
    "transmission": "a",
    "cylinders": 4,
    "displacement": 2.0,
    "city_mpg": 25,
    "highway_mpg": 33
  }
]
```

#### 3. Car Makes API
**Endpoint:** `GET /api/vehicles/makes`

**Funktionen:**
- Liste aller verfügbaren Hersteller
- Sortiert alphabetisch
- Deutsche und internationale Marken

**Response:**
```json
{
  "makes": ["Audi", "BMW", "Mercedes-Benz", "Volkswagen", ...]
}
```

### ✅ Frontend Komponente

**Komponente:** `<VehicleSearch />`
**Pfad:** `components/VehicleSearch.tsx`

**Props:**
```typescript
interface VehicleSearchProps {
  onVehicleSelect: (vehicle: VehicleData) => void
  initialData?: VehicleData
  className?: string
}
```

**Features:**
- Toggle zwischen VIN und Manueller Suche
- Echtzeit VIN-Validierung (17 Zeichen)
- Automatische VIN-Großschreibung
- Dropdown für Hersteller-Auswahl
- Suchfilter für Modell und Jahr
- Ergebnisliste mit Details
- Loading States
- Error Handling
- Success Feedback

## 🔧 Setup

### 1. API Key besorgen
1. Registrieren auf [https://api-ninjas.com/register](https://api-ninjas.com/register)
2. API Key kopieren (Dashboard)
3. **Free Tier:** 50,000 API calls/Monat

### 2. Umgebungsvariablen konfigurieren

**.env** (Server):
```bash
API_NINJAS_KEY="your-actual-api-key-here"
```

**.env.example** (Template):
```bash
# API Ninjas (for VIN lookup and vehicle search)
# Get your free API key at: https://api-ninjas.com/register
# Free tier: 50,000 API calls per month
API_NINJAS_KEY="your-api-ninjas-key-here"
```

### 3. Dependencies
Alle Dependencies bereits vorhanden:
- `next` (API Routes)
- `next-auth` (Authentication)
- `lucide-react` (Icons)

## 📖 Verwendung

### Integration in bestehende Pages

#### Beispiel: Tire Request Page

```tsx
'use client'

import { useState } from 'react'
import VehicleSearch from '@/components/VehicleSearch'

export default function CreateRequestPage() {
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear()
  })

  const handleVehicleSelect = (vehicle: any) => {
    setVehicleData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year
    })
    
    // Optional: Save to form or database
    console.log('Selected vehicle:', vehicle)
  }

  return (
    <form>
      <h2>Fahrzeugsuche</h2>
      
      <VehicleSearch
        onVehicleSelect={handleVehicleSelect}
        initialData={vehicleData}
        className="mb-6"
      />
      
      {/* Rest of the form */}
      {vehicleData.make && (
        <div className="bg-green-50 p-4 rounded">
          <p>✅ Ausgewählt: {vehicleData.make} {vehicleData.model} ({vehicleData.year})</p>
        </div>
      )}
    </form>
  )
}
```

### Integration in Vehicle Management

```tsx
// app/dashboard/customer/vehicles/page.tsx

const handleAddVehicle = (vehicleData: any) => {
  // Save vehicle to database
  fetch('/api/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      vin: vehicleData.vin,
      fuelType: vehicleData.fuelType
    })
  })
}

return (
  <div>
    <VehicleSearch onVehicleSelect={handleAddVehicle} />
  </div>
)
```

## 🔄 Workflow

### VIN Lookup Flow
```
Kunde gibt VIN ein (17 Zeichen)
  ↓
Frontend validiert Länge
  ↓
API Call: /api/vehicles/vin-lookup?vin=XXX
  ↓
API Ninjas VIN Lookup
  ↓
Fahrzeugdaten zurück
  ↓
onVehicleSelect(vehicleData) callback
  ↓
Parent Component speichert Daten
```

### Manuelle Suche Flow
```
Kunde wählt Hersteller aus Dropdown
  ↓
Optional: Modell und Jahr eingeben
  ↓
API Call: /api/vehicles/search?make=XXX&model=YYY&year=ZZZZ
  ↓
API Ninjas Cars API
  ↓
Liste von Fahrzeugen anzeigen
  ↓
Kunde wählt Fahrzeug aus
  ↓
onVehicleSelect(vehicleData) callback
  ↓
Parent Component speichert Daten
```

## 🎨 UI/UX Features

### VIN Mode
- ✅ Großbuchstaben-Konvertierung
- ✅ 17-Zeichen Limit
- ✅ Echtzeit Zeichenzähler
- ✅ Loading Spinner
- ✅ Success Animation
- ✅ Error Messages
- ✅ Hilfetext mit VIN-Position

### Manual Mode
- ✅ Dropdown für Hersteller (sortiert)
- ✅ Freie Modell-Eingabe
- ✅ Jahr-Validierung (1990 - aktuell+1)
- ✅ Ergebnisliste mit Scroll
- ✅ Hover Effects
- ✅ Detailanzeige (Antrieb, Kraftstoff)
- ✅ Empty State

## 🚀 Deployment

### 1. Umgebungsvariablen setzen
```bash
# Auf dem Server
ssh root@167.235.24.110
cd /var/www/bereifung24
nano .env
# Füge hinzu: API_NINJAS_KEY="your-actual-key"
```

### 2. Build & Restart
```bash
npm run build
pm2 restart bereifung24
```

### 3. Verify
- Teste VIN Lookup: `WVWZZZ3CZHE123456` (VW Golf)
- Teste Manuelle Suche: BMW → 3er → 2020

## 📊 API Limits

### Free Tier (API Ninjas)
- **50,000 calls/Monat**
- **Keine Kreditkarte erforderlich**
- **Ausreichend für:**
  - ~1,666 VIN Lookups pro Tag
  - Oder: 833 Manuelle Suchen pro Tag (je 2 Requests)

### Optimierung
- VIN Lookup: 1 API Call
- Manuelle Suche: 1 API Call
- Hersteller-Liste: Statisch (kein API Call)

## 🔒 Security

- ✅ API Key nur im Backend (.env)
- ✅ Authentifizierung erforderlich (next-auth)
- ✅ Input Validierung (VIN-Länge, Jahr-Range)
- ✅ Error Messages ohne sensitive Daten
- ✅ Rate Limiting (API Ninjas-seitig)

## 🎯 Vorteile für Bereifung24

### Für Kunden
- ✅ **Schnellere Anfragen** - VIN scannen statt manuell eingeben
- ✅ **Weniger Fehler** - Automatische Datenerfassung
- ✅ **Bessere UX** - Zwei Wege zur Fahrzeugauswahl
- ✅ **Mobile-friendly** - QR-Code Scanner möglich (zukünftig)

### Für Werkstätten
- ✅ **Genauere Daten** - Direkt von Herstellerdatenbank
- ✅ **Weniger Rückfragen** - Vollständige Fahrzeuginfos
- ✅ **Bessere Angebote** - Mehr Kontext über Fahrzeug

### Für die Plattform
- ✅ **Professioneller** - Moderne Fahrzeugsuche
- ✅ **Skalierbar** - 50k Requests/Monat ausreichend
- ✅ **Kostenlos** - Free Tier ohne Risiko
- ✅ **Erweiterbar** - Motorcycles API vorhanden

## 🔮 Zukünftige Erweiterungen

### Phase 2
- [ ] **QR/Barcode Scanner** - VIN via Kamera scannen (mobile)
- [ ] **Motorcycles API** - Für Motorrad-Bereifung
- [ ] **Tire Size Mapping** - Automatische Reifengröße aus Fahrzeugdaten
- [ ] **VIN Validation** - Prüfziffer-Algorithmus

### Phase 3
- [ ] **Caching** - VIN Lookups in DB speichern
- [ ] **Autovervollständigung** - Model-Vorschläge während Eingabe
- [ ] **Bulk Import** - CSV mit VINs importieren
- [ ] **Analytics** - Beliebte Fahrzeugmarken tracken

## 📝 Beispiel-VINs für Tests

```
WVWZZZ3CZHE123456  - Volkswagen Golf (Deutschland)
1HGBH41JXMN109186 - Honda Accord (USA)
WAUZZZ8V4AA123456 - Audi (Deutschland)
WBADT43452G123456 - BMW 3er (Deutschland)
WDB9032021L123456 - Mercedes C-Klasse (Deutschland)
```

## 🐛 Troubleshooting

### "VIN nicht gefunden"
- Prüfe VIN-Länge (genau 17 Zeichen)
- Versuche manuelle Suche als Fallback
- Alte Fahrzeuge (vor 1980) ggf. nicht in DB

### "API not configured"
- Prüfe `.env` Datei auf Server
- Vergewissere: `API_NINJAS_KEY` gesetzt
- Restart: `pm2 restart bereifung24`

### "Keine Suchergebnisse"
- Model-Eingabe zu spezifisch
- Versuche nur Hersteller + Jahr
- Prüfe Tippfehler in Modellname

## 📞 Support

- **API Ninjas Docs:** https://api-ninjas.com/api/vinlookup
- **API Ninjas Dashboard:** https://api-ninjas.com/dashboard
- **Bereifung24 Workspace:** `c:\Bereifung24\Bereifung24 Workspace`

---

**Status:** ✅ Ready for Integration
**Erstellt:** 28. Januar 2026
**Autor:** GitHub Copilot
