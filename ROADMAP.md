# 🗺️ BEREIFUNG24 - Entwicklungs-Roadmap

## 📋 Projekt-Übersicht
**Plattform zur Vermittlung von Reifen und Montagedienstleistungen zwischen Kunden und Werkstätten**

---

## ⚠️ WICHTIG: Zu überprüfen nach Feiertagen
- [ ] **SEPA-Mandate Status prüfen** (ab 27.12.2025)
  - Mandat "Test Reifen Werkstatt" ist auf `pending_submission` seit 17.12.2025
  - Grund: Weihnachtsfeiertage - Banken arbeiten nicht
  - Normale Verarbeitung dauert 3-5 Werktage
  - Automatische Aktivierung durch GoCardless Webhook erwartet
  - Button "Alle synchronisieren" auf `/admin/sepa-mandates` nutzen um Status zu aktualisieren

---

## ✅ Phase 1: Projekt-Setup & Grundlagen (ABGESCHLOSSEN)
- [x] Repository eingerichtet
- [x] Next.js 14 Projekt erstellen
- [x] TailwindCSS Design-System
- [x] Prisma ORM Setup
- [x] Environment-Konfiguration
- [x] Einladende Startseite erstellt
- [x] Code zu GitHub gepusht

**Status:** ✅ Abgeschlossen

---

## ✅ Phase 2: Datenbank-Architektur (ABGESCHLOSSEN)
- [x] User-Management (Kunde/Werkstatt/Admin)
- [x] Reifenanfragen-Schema
- [x] Angebots-Schema
- [x] Fahrzeug-Verwaltung
- [x] Termin-Schema
- [x] Bewertungs-Schema
- [x] Provisions-Abrechnungen

**Status:** ✅ Abgeschlossen

---

## 🔐 Phase 3: Authentication & Rollen-System (ABGESCHLOSSEN)
- [x] NextAuth.js Integration
- [x] Registrierung (Kunde/Werkstatt)
- [x] Login mit Rollen-Erkennung
- [x] Dashboard-Routing (Customer/Workshop/Admin)
- [x] Profil-Verwaltung Grundlagen
- [x] SEPA-Mandats-Authentifizierung (Werkstatt)
- [x] API Routes für Registration
- [x] Client-Side Authentication Pages
- [x] Role-based Dashboards

**Status:** ✅ Abgeschlossen

---

## 👤 Phase 4: Kunden-Bereich (IN ARBEIT)
- [x] **Startseite** (einladend, Marketing-fokussiert)
- [x] **Reifenanfrage erstellen:**
  - [x] Reifentyp (Sommer/Winter/Allwetter)
  - [x] Dimensionen (Breite/Querschnitt/Zoll)
  - [x] Indices (Tragfähigkeit/Geschwindigkeit)
  - [x] Runflat-Option
  - [x] Hersteller-Präferenzen
  - [x] Benötigt-bis Datum (mind. 7 Tage)
  - [x] Umkreis-Slider (km)
- [x] **Anfragen-Übersicht:**
  - [x] Alle Anfragen anzeigen
  - [x] Status-Badges
  - [x] Detail-Ansicht mit Angeboten
- [x] **Angebots-Übersicht:**
  - [x] Erhaltene Angebote anzeigen
  - [x] Angebote vergleichen (nach Preis sortiert)
  - [x] Angebot annehmen
- [ ] **Fahrzeug-Verwaltung:**
  - [ ] Fahrzeuge anlegen
  - [ ] Reifenhistorie je Fahrzeug
- [ ] **Termin-Buchung:**
  - [ ] Kalender mit freien Slots
  - [ ] Google Calendar Integration
- [ ] **Zahlungsoptionen:**
  - [ ] PayPal
  - [ ] Überweisung (IBAN anzeigen)
  - [ ] Kreditkarte
  - [ ] Vor-Ort-Zahlung
- [ ] **Bewertungen abgeben**

**Status:** 🟡 In Arbeit (Kernfunktionen fertig)

---

## ✅ Phase 5: Werkstatt-Bereich (ABGESCHLOSSEN)
- [x] **Dashboard** (Anfragen-Übersicht)
- [x] **Anfragen-Liste mit Filter:**
  - [x] Nach Entfernung
  - [x] Nach Zollgröße
  - [x] Nach Runflat
  - [x] Nach Reifentyp
  - [x] Nach Datum
- [x] **Angebot erstellen:**
  - [x] Reifenbezeichnung eingeben
  - [x] Hersteller angeben
  - [x] Preis festlegen
  - [x] Gültigkeitsdauer
- [x] **Angebotsübersicht:**
  - [x] Eigene Angebote
  - [x] Status (Offen/Angenommen/Abgelaufen)
- [x] **Termin-Verwaltung:**
  - [x] Google Calendar Synchronisation
  - [x] Zeitslot-Konfiguration
  - [x] Gebuchte Termine
- [x] **Werkstatt-Profil:**
  - [x] Stammdaten
  - [x] Bankverbindung (SEPA)
  - [x] PayPal E-Mail
  - [x] Öffnungszeiten
- [x] **Bewertungen ansehen**
- [x] **Provisionsübersicht:**
  - [x] Akzeptierte Angebote
  - [x] 5% Provision anzeigen
  - [x] Monatliche Abrechnungen

**Status:** ✅ Abgeschlossen

---

## ✅ Phase 6: Admin-Bereich (ABGESCHLOSSEN)
- [x] **Dashboard mit Statistiken:**
  - [x] Gesamt-Anfragen
  - [x] Gesamt-Angebote
  - [x] Angenommene Angebote
  - [x] Provisions-Übersicht
- [x] **Anfragen-Verwaltung:**
  - [x] Alle Kundenanfragen
  - [x] Status-Übersicht
- [x] **Angebots-Verwaltung:**
  - [x] Alle abgegebenen Angebote
  - [x] Angenommene Angebote
  - [x] Auswertungen
- [x] **Provisions-Management:**
  - [x] Automatische 5% Berechnung
  - [x] Monatliche Übersichten
  - [x] SEPA-Lastschrift-Export
  - [x] Abrechnungshistorie
- [x] **User-Management:**
  - [x] Kunden verwalten
  - [x] Werkstätten verwalten
  - [x] Deaktivierung/Sperrung
- [x] **System-Einstellungen**

**Status:** ✅ Abgeschlossen

---

## ✅ Phase 7: E-Mail-System (ABGESCHLOSSEN)
- [x] **Kunden-E-Mails:**
  - [x] Registrierung-Bestätigung
  - [x] Neues Angebot erhalten
  - [x] Angebot angenommen (Bestätigung)
  - [x] Termin-Erinnerung
  - [x] Bewertungs-Anfrage
- [x] **Werkstatt-E-Mails:**
  - [x] Registrierung-Bestätigung
  - [x] Neue passende Anfrage
  - [x] Angebot angenommen
  - [x] Termin-Bestätigung
  - [x] Monatliche Provisionsabrechnung
- [x] **Admin-E-Mails:**
  - [x] Neue Registrierung
  - [x] Probleme/Meldungen

**Status:** ✅ Abgeschlossen

---

## 💳 Phase 8: Zahlungs-Integration
- [ ] PayPal Integration
- [ ] Stripe (Kreditkarte)
- [ ] Überweisungs-Details anzeigen
- [ ] Zahlungs-Status-Tracking
- [ ] SEPA-Lastschrift für Provisionen

**Status:** ⚪ Ausstehend

---

## 🎨 Phase 9: Design & UX-Optimierung
- [ ] Responsive Design (Mobile-First)
- [ ] Einladende Startseite
- [ ] Logo & Branding
- [ ] Bildmaterial
- [ ] Animations & Transitions
- [ ] Dark Mode (optional)

**Status:** ⚪ Ausstehend

---

## 🧪 Phase 10: Testing & Qualitätssicherung
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] E2E Tests
- [ ] Performance-Optimierung
- [ ] Security-Audit
- [ ] Browser-Kompatibilität

**Status:** ⚪ Ausstehend

---

## 🚀 Phase 11: Deployment & Go-Live
- [ ] Production-Build
- [ ] Vercel Deployment
- [ ] Subdomain-Konfiguration (app.bereifung24.de)
- [ ] SSL-Zertifikat
- [ ] Production-Datenbank
- [ ] Monitoring einrichten
- [ ] Backup-Strategie

**Status:** ⚪ Ausstehend

---

## 🔄 Phase 12: Post-Launch Features
- [ ] Analytics & Tracking
- [ ] A/B Testing
- [ ] Chat-Support
- [ ] Mobile App (optional)
- [ ] API für Partner
- [ ] Erweiterte Filter
- [ ] Benachrichtigungs-Präferenzen

**Status:** ⚪ Ausstehend

---

## 🎨 Phase 13: Werkstatt-Branding & Dokumenten-Management
- [ ] **Werkstatt-Logo Upload:**
  - [ ] Logo-Upload-Funktion in Werkstatt-Einstellungen
  - [ ] Bildoptimierung (Format, Größe)
  - [ ] Logo-Anzeige bei Angeboten
  - [ ] Logo-Anzeige in Werkstatt-Profil
  - [ ] Logo-Anzeige bei Termin-Bestätigung
- [ ] **Umsatzsteuer-Status (§14 UStG):**
  - [ ] Checkbox in Werkstatt-Einstellungen: "Unternehmen nach §14 UStG"
  - [ ] Bei aktiviert: Hinweis "Preis enthält keine MwSt." bei allen Preisen
  - [ ] Bei nicht aktiviert: "(inkl. MwSt.)" bei allen Preisangaben
  - [ ] Anpassung in Angebots-Darstellung
  - [ ] Anpassung in Rechnungen
- [ ] **Rechnungs-Upload:**
  - [ ] Upload-Funktion für Rechnungen (PDF) nach Angebotsannahme
  - [ ] Rechnungs-Liste in Werkstatt-Dashboard
  - [ ] Kunden-Zugriff auf hochgeladene Rechnungen
  - [ ] Download-Funktion für Kunden
  - [ ] Automatische E-Mail-Benachrichtigung an Kunden bei Rechnungs-Upload
  - [ ] Rechnungshistorie für beide Seiten

**Status:** ⚪ Ausstehend

---

## 🏪 Phase 14: SEO-Optimierte Werkstatt-Landing Pages
- [ ] **Individuelle Werkstatt-Landing Pages:**
  - [ ] Öffentliche URL-Struktur: `bereifung24.de/werkstatt/[werkstatt-slug]`
  - [ ] SEO-freundliche URLs (z.B. `/werkstatt/autohaus-mueller-berlin`)
  - [ ] Vollständige Werkstatt-Informationen:
    - [ ] Name, Logo, Bilder der Werkstatt
    - [ ] Vollständige Adresse mit interaktiver Google Maps Integration
    - [ ] Öffnungszeiten (übersichtlich dargestellt)
    - [ ] Kontaktdaten (Telefon, E-Mail, Website)
    - [ ] Beschreibungstext der Werkstatt
  - [ ] **Service-Übersicht:**
    - [ ] Liste aller angebotenen Services
    - [ ] Service-Pakete mit Preisen
    - [ ] Spezialleistungen (Motorradreifen, Klimaservice, etc.)
  - [ ] **Bewertungen & Rezensionen:**
    - [ ] Anzeige von Kundenbewertungen
    - [ ] Durchschnittliche Bewertung mit Sternen
    - [ ] Authentische Rezensionen mit Datum
  - [ ] **CTA-Elemente:**
    - [ ] "Jetzt Anfrage stellen" Button
    - [ ] "Termin vereinbaren" Button
    - [ ] Direkte Kontaktmöglichkeiten
  - [ ] **SEO-Optimierung:**
    - [ ] Strukturierte Daten (Schema.org LocalBusiness)
    - [ ] Meta-Tags (Title, Description) mit Werkstatt-Name & Ort
    - [ ] OpenGraph-Tags für Social Media
    - [ ] Canonical URLs
    - [ ] Sitemap-Integration
    - [ ] Lokale Keywords (Stadt, Region, PLZ)
  - [ ] **Verwaltung im Workshop-Dashboard:**
    - [ ] Landing Page Editor für Werkstätten
    - [ ] Bildergalerie-Upload (Werkstatt, Team, Ausstattung)
    - [ ] Beschreibungstext bearbeiten
    - [ ] Service-Highlights auswählen
    - [ ] Preview-Funktion
  - [ ] **Technische Umsetzung:**
    - [ ] Server-Side Rendering (SSR) für beste SEO
    - [ ] Dynamische Generierung basierend auf Werkstatt-Daten
    - [ ] Breadcrumb-Navigation
    - [ ] Mobile-optimiert & responsive
    - [ ] Schnelle Ladezeiten (Performance-Optimierung)
  - [ ] **Bereifung24 SEO-Vorteile:**
    - [ ] Backlinks von allen Werkstatt-Seiten zur Hauptseite
    - [ ] Erhöhte Content-Menge (einzigartige Seiten pro Werkstatt)
    - [ ] Lokale Suchmaschinen-Optimierung durch verschiedene Standorte
    - [ ] Erhöhte Domain Authority durch mehr indexierte Seiten
    - [ ] Long-Tail Keywords durch spezifische Werkstatt/Service-Kombinationen

**Status:** ⚪ Ausstehend

---

## 📊 Aktueller Fortschritt

**Gesamt-Fortschritt:** 83% ████████████████░░░░

**Aktuelle Phase:** Phase 8 - Zahlungs-Integration
**Nächste Schritte:** Feature 4 (MwSt.-Option) und Feature 2 (Bewertungssystem)

---

## 🎯 Meilensteine

| Meilenstein | Ziel | Status |
|-------------|------|--------|
| M1: MVP - Basis-Funktionen | Anfrage erstellen, Angebot abgeben, Annahme | ✅ Abgeschlossen |
| M2: Zahlungen & Termine | Terminbuchung, Zahlungsoptionen | ✅ Abgeschlossen |
| M3: Provisionen & Admin | Admin-Dashboard, Abrechnungen | ✅ Abgeschlossen |
| M4: Launch | Go-Live auf Subdomain | 🟡 In Arbeit |

---

## 🚀 Neue Features (Dezember 2025)

### 1. Workshop Logo Upload
**Status:** ✅ Erledigt (08.12.2025)
**Priorität:** Hoch

**Beschreibung:**
Werkstätten sollen in den Einstellungen ihr Logo hochladen können.

**Anforderungen:**
- Upload-Funktion in Workshop-Einstellungen (`/dashboard/workshop/settings`)
- Logo-Speicherung (Dateisystem oder Cloud-Storage)
- Anzeige des Logos:
  - In allen Angeboten
  - In Angebotsdetails
  - Auf der Workshop-Landing-Page
  - Im Dashboard

**Technische Umsetzung:**
- Datei-Upload Komponente
- Bildoptimierung/Resize
- Prisma Schema Update (Workshop Model: `logoUrl` field)
- API Endpoint: `/api/workshop/logo` (POST/DELETE)

---

### 2. Bewertungsfunktion (5-Sterne-Rating)
**Status:** ✅ Erledigt (17.12.2025)  
**Priorität:** Hoch

**Beschreibung:**
Kunden können Werkstätten nach Angebotsannahme mit 5 Sternen und Text bewerten.

**Anforderungen:**
- Bewertung nur nach Angebotsannahme möglich
- 5-Sterne-Rating + Textfeld
- Anzeige der Bewertungen:
  - Bei Angebotsübersicht für Kunden
  - Auf Workshop-Landing-Page
  - Im Workshop-Profil
  - Im Admin-Bereich

**Technische Umsetzung:**
- Prisma Schema: `Review` Model erweitern (rating, comment, verified)
- API Endpoints: `/api/reviews` (GET/POST)
- Review-Komponente für Kunden
- Durchschnittsbewertung berechnen
- Review-Liste Komponente
- Verifikation über Booking-Status

---

### 3. Analytics/Besucherstatistik im Admin-Bereich
**Status:** ✅ Erledigt (17.12.2025)  
**Priorität:** Mittel

**Beschreibung:**
Admin-Bereich soll Besucherzahlen mit Zeitraumauswahl anzeigen.

**Anforderungen:**
- Seitenaufrufe tracken
- Zeitraum-Filter (Tag, Woche, Monat, Jahr, Custom)
- Anzeige von:
  - Gesamtbesuche
  - Unique Visitors
  - Besuche pro Seite
  - Landing-Page Performance
  - Workshop-Profil Aufrufe

**Technische Umsetzung:**
- Analytics-Tracking implementieren (z.B. Server-Side Events)
- Prisma Schema: `PageView` Model
- Middleware für Tracking
- Admin Dashboard: `/admin/analytics`
- Charts/Graphs (Recharts oder ähnlich)
- Export-Funktion (CSV)

---

### 4. MwSt. / Kleinunternehmer-Option
**Status:** ⏳ Offen  
**Priorität:** Hoch

**Beschreibung:**
Werkstätten können wählen, ob sie normale Preise (inkl. MwSt.) oder als Kleinunternehmer (ohne MwSt.) anzeigen.

**Anforderungen:**
- Auswahl in Workshop-Einstellungen:
  - [ ] Normaler Betrieb → "inkl. MwSt." bei allen Preisen
  - [ ] Kleinunternehmer → Hinweis "Keine Umsatzsteuer gemäß §19 UStG"
- Anzeige der korrekten Texte:
  - In Angeboten
  - Auf Landing-Page
  - In Preisberechnungen
  - In Rechnungen/Dokumenten

**Technische Umsetzung:**
- Prisma Schema: Workshop Model → `taxMode` enum ('STANDARD', 'KLEINUNTERNEHMER')
- Settings-Update in `/dashboard/workshop/settings`
- Conditional Rendering in allen Preis-Komponenten
- API Update: `/api/workshop/profile`
- PDF-Generierung anpassen

---

### 5. Passwort-Sicherheitsanforderungen
**Status:** ✅ Erledigt (bereits implementiert)  
**Priorität:** Mittel

**Beschreibung:**
Stärkere Passwort-Anforderungen für Registrierung.

**Anforderungen:**
- Mindestens 8 Zeichen
- Mindestens 1 Großbuchstabe
- Mindestens 1 Sonderzeichen
- Live-Validierung mit Fehlermeldung
- Für Kunden- und Werkstatt-Registrierung

**Technische Umsetzung:**
- Validierung in Forms:
  - `/register/customer`
  - `/register/workshop`
- Backend-Validierung in API:
  - `/api/auth/register/customer`
  - `/api/auth/register/workshop`
- Passwort-Stärke-Indikator (optional)
- Regex: `/^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/`

---

### 6. Motorrad-Räder ohne Motorrad Option
**Status:** ⏳ Offen  
**Priorität:** Niedrig

**Beschreibung:**
Bei Motorradreifen-Anfrage: Option, dass Kunde nur die Räder (ohne Motorrad) vorbeibringt.

**Anforderungen:**
- Checkbox in Motorrad-Anfrage: "Ich bringe nur die Räder (ohne Motorrad)"
- Separate Angabe für:
  - Vorderrad
  - Hinterrad
- Information muss in Anfrage sichtbar sein
- Werkstatt sieht diese Info beim Angebot erstellen

**Technische Umsetzung:**
- Prisma Schema: TireRequest Model → `motorcycleWheelsOnly` boolean, `frontWheelOnly` boolean, `rearWheelOnly` boolean
- Update Form: `/dashboard/customer/create-request/motorcycle`
- API Update: `/api/tire-requests/motorcycle`
- Anzeige in Werkstatt-Ansicht der Anfrage
- Preisberechnung anpassen (falls relevant)

---

### 7. Reifen-Finder Widget mit EPREL API
**Status:** ⏳ Wartend auf API-Key  
**Priorität:** Mittel

**Beschreibung:**
Kunden-Dashboard Widget zur Reifensuche und -information über die offizielle EU EPREL-Datenbank.

**API-Zugang:**
- EPREL Public API Key beantragt: https://eprel.ec.europa.eu/screen/requestpublicapikey
- Wartend auf Genehmigung (ca. 5-7 Werktage)
- API bietet vollständigen Zugriff auf EU-Reifendatenbank mit Label-Informationen

**Features:**
1. **Suchfunktionen:**
   - Schnellsuche nach Dimension (z.B. 205/55 R16)
   - Filter nach Hersteller/Marke
   - Filter nach Saison (Sommer/Winter/Ganzjahr)
   - Filter nach EU-Label-Kriterien

2. **EU-Label Informationen:**
   - Nasshaftungsklasse (A-E)
   - Rollwiderstandsklasse (A-E) 
   - Geräuschentwicklung (dB + Klasse A-C)
   - Zusatzsymbole (3PMSF Schneeflocke, Eis-Symbol)

3. **Praktische Filter:**
   - Fahrzeugtyp (PKW, SUV, Transporter, E-Auto)
   - Einsatzgebiet (Stadt, Autobahn, Offroad)
   - Umweltaspekte (CO₂-Reduktion)
   - Sicherheitspriorität (beste Nasshaftung)

4. **Anfrage-Integration:**
   - "Anfrage stellen" Button bei jedem Reifen
   - Automatische Übernahme der Reifendaten
   - Direkte Weiterleitung an Werkstätten

**Technische Umsetzung (nach API-Key Erhalt):**
- Prisma Schema: 
  ```prisma
  model TireData {
    manufacturer    String
    model          String
    dimension      String  // "205/55R16"
    loadIndex      String
    speedRating    String
    season         TireSeason
    wetGripClass   String  // A-E
    fuelEfficiency String  // A-E
    noiseLevel     Int     // dB
    noiseClass     String  // A-C
    has3PMSF       Boolean
    hasIceGrip     Boolean
    isEVOptimized  Boolean
  }
  ```
- API Routes:
  - `/api/tire-finder/search` - Suche über EPREL API
  - `/api/tire-finder/details` - Detailansicht
  - `/api/tire-finder/inquiry` - Anfrage erstellen
- Frontend:
  - `/dashboard/customer/tire-finder` - Hauptseite
  - Widget auf Customer Dashboard
- EPREL API Integration:
  - Caching-Strategie (Redis/In-Memory)
  - Rate-Limiting beachten
  - Fehlerbehandlung bei API-Ausfällen

**Datenschutz & Compliance:**
- ✅ **Datenschutz-Checkliste erstellt:** Siehe `EPREL_COMPLIANCE_CHECKLIST.md`
- ✅ **Keine personenbezogenen Daten:** EPREL enthält nur Produktinformationen
- ✅ **Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
- ⏳ **API-Key Sicherheit:** In Umgebungsvariablen speichern (nach Erhalt)
- ⏳ **Datenschutzerklärung:** Abschnitt "EPREL API Nutzung" hinzufügen
- ⏳ **Caching:** Max. 24h Cache mit automatischer Löschung
- ⏳ **Rate Limiting:** Pro-User Limits implementieren
- ⏳ **Serverseitig:** Alle EPREL Calls nur vom Backend
- ✅ **Risikobewertung:** NIEDRIG (nur Produktdaten, keine personenbezogenen Daten)

**Implementierungs-Phasen:**
1. Phase 1 (nach API-Key): Basis-Suchfunktion mit EPREL-Daten + Datenschutz-Compliance
2. Phase 2: Erweiterte Filter und Vergleichsfunktion
3. Phase 3: Favoriten und Preis-Alerts (optional)

**Voraussetzungen:**
- ⏳ EPREL API Key Genehmigung abwarten
- ⏳ API-Dokumentation studieren
- ⏳ Test-Zugriff validieren
- ✅ Datenschutz-Compliance geplant

---

### 8. CO₂-Einsparungs-Tracking-System
**Status:** 🚧 In Arbeit - Phase 1 ✅ Abgeschlossen (28.12.2025)
**Priorität:** Hoch

**Beschreibung:**
Kunden können im Dashboard sehen, wie viel CO₂ sie durch die Nutzung von Bereifung24 einsparen, indem sie nicht zu mehreren Werkstätten fahren müssen. Das System berechnet die eingesparte Fahrtstrecke basierend auf dem Standort und zeigt eine personalisierte Umweltbilanz.

**Geschäftlicher Mehrwert:**
- Starkes Alleinstellungsmerkmal (USP) für umweltbewusste Kunden
- Emotionale Kundenbindung durch sichtbaren Umweltbeitrag
- Marketing-Material: "Mit jedem Angebot X kg CO₂ gespart"
- Differenzierung von Mitbewerbern
- Moderne, nachhaltigkeitsorientierte Markenpositionierung

---

#### ✅ Phase 1: Basis CO₂-Tracking mit Standard-Werten (ABGESCHLOSSEN)
**Ziel:** Automatische Berechnung bei jeder Anfrage mit durchschnittlichen Verbrauchswerten

**Datenbank-Schema:**
- [x] Prisma Schema erweitern:
  ```prisma
  model CO2Settings {
    id                      String   @id @default(cuid())
    workshopsToCompare      Int      @default(3)    // Anzahl Werkstätten, die Kunde sonst besuchen würde
    co2PerKmCombustion      Int      @default(140)  // g CO₂/km für Verbrenner (Durchschnitt)
    co2PerKmElectric        Int      @default(50)   // g CO₂/km für E-Autos (Strommix DE)
    co2PerLiterFuel         Int      @default(2330) // g CO₂/Liter Benzin
    co2PerKWhElectric       Int      @default(420)  // g CO₂/kWh Strom (DE Mix)
    updatedAt               DateTime @updatedAt
  }

  model TireRequest {
    // ... existing fields
    savedCO2Grams          Int?     // Gespeicherte CO₂-Menge in Gramm
    calculationMethod      String?  // 'STANDARD' oder 'PERSONAL'
  }

  enum FuelType {
    UNKNOWN
    PETROL      // Benzin
    DIESEL      // Diesel
    ELECTRIC    // Elektro
    HYBRID      // Hybrid
    PLUGIN_HYBRID
    LPG         // Autogas
    CNG         // Erdgas
  }

  model Vehicle {
    // ... existing fields
    fuelType              FuelType  @default(UNKNOWN)
    fuelConsumption       Float?    // L/100km für Verbrenner
    electricConsumption   Float?    // kWh/100km für E-Autos
  }
  ```

**Backend-Implementation:**
- [x] `lib/co2Calculator.ts` erstellen:
  - [x] `calculateCO2Savings()` - Hauptfunktion
  - [x] `calculateDistance()` - Haversine-Formel für Geo-Distanz
  - [x] `findNearestWorkshops()` - N nächste Werkstätten finden
  - [x] `getTotalAvoidedDistance()` - Summe aller vermiedenen Fahrten × 2 (Hin/Rück)

**Berechnungs-Algorithmus:**
```typescript
// 1. Finde die N nächsten Werkstätten zum Kunden
// 2. Berechne Distanz zu jeder Werkstatt
// 3. Summe = (Distanz_WS1 + Distanz_WS2 + ... + Distanz_WSN) × 2 (Hin+Rück)
// 4. CO₂ = Summe × CO₂-pro-km-Faktor
// 5. Speichere bei TireRequest.savedCO2Grams
```

**API Endpoints:**
- [x] `/api/admin/co2-settings` (GET/POST) - Admin konfiguriert Werte
- [x] `/api/co2/calculate` (POST) - Berechnung bei Anfrageerstellung

**Admin-Interface:**
- [x] Admin-Seite `/admin/co2-tracking` erstellen:
  - [x] Einstellung: Anzahl Werkstätten (Standard: 3)
  - [x] Einstellung: CO₂/km für Verbrenner (Standard: 140g)
  - [x] Einstellung: CO₂/km für E-Autos (Standard: 50g)
  - [x] Einstellung: CO₂/Liter Kraftstoff (Standard: 2330g)
  - [x] Einstellung: CO₂/kWh Strom (Standard: 420g)
  - [x] Speichern-Button
  - [x] Info-Tooltips mit Erklärungen

**Integration in Anfrageerstellung:**
- [x] Bei TireRequest-Erstellung CO₂ automatisch berechnen
- [x] In `/api/tire-requests/create` Integration
- [x] Wert in `savedCO2Grams` speichern
- [x] Methode als 'STANDARD' markieren

**Kunden-Dashboard Widget:**
- [x] Neue Komponente: `app/dashboard/customer/components/CO2SavingsWidget.tsx`
- [x] Design:
  - Grünes Blatt-Icon oder CO₂-Symbol
  - Große Zahl: "X.XX kg CO₂ gespart"
  - Subtext: "Durch Y Anfragen über Bereifung24"
  - Vergleich: "Das entspricht Z gefahrenen km"
- [x] API Call: `/api/customer/co2-stats` (GET)
- [x] Aggregation aller TireRequests des Kunden

---

#### Phase 2: Persönliche Verbrauchswerte (Fahrzeugverwaltung)
**Ziel:** Präzise Berechnungen basierend auf individuellem Fahrzeugverbrauch

**Fahrzeugverwaltung erweitern:**
- [ ] Formular `/dashboard/customer/vehicles` aktualisieren:
  - [ ] Dropdown: Kraftstoffart (Benzin/Diesel/Elektro/Hybrid/etc.)
  - [ ] Input: Durchschnittsverbrauch
    - Bei Verbrenner: "Verbrauch (L/100km)"
    - Bei Elektro: "Verbrauch (kWh/100km)"
  - [ ] Optional-Checkbox: "Standardwerte verwenden"
  - [ ] Hilfetext: "Finden Sie im Bordcomputer oder Fahrzeugschein"

**Berechnungs-Logik erweitern:**
- [ ] `lib/co2Calculator.ts` aktualisieren:
  - [ ] Check: Hat Fahrzeug persönlichen Verbrauch?
  - [ ] JA → Berechne mit persönlichen Werten:
    ```typescript
    // Für Verbrenner:
    co2 = (distance_km / 100) × fuelConsumption_L × co2PerLiter_g
    
    // Für E-Autos:
    co2 = (distance_km / 100) × electricConsumption_kWh × co2PerKWh_g
    ```
  - [ ] NEIN → Verwende Standard CO₂/km-Wert
  - [ ] Markiere Methode: 'PERSONAL' oder 'STANDARD'

**API Updates:**
- [ ] `/api/vehicles` - Neue Felder speichern
- [ ] `/api/co2/calculate` - Fahrzeug-Daten einbeziehen

**Dashboard Anpassung:**
- [ ] Widget zeigt an: "Basierend auf Ihrem [Fahrzeugname]"
- [ ] Tooltip: "Mit Ihrem persönlichen Verbrauch berechnet"

---

#### Phase 3: Erweiterte Dashboard-Darstellung
**Ziel:** Umfassende Umweltbilanz mit gespartem Kraftstoff und Geld

**Dashboard Widget erweitern:**
- [ ] Komponente `CO2SavingsWidget.tsx` ausbauen:
  - [ ] **Hauptanzeige:**
    - Große Zahl: "X.XX kg CO₂ gespart"
    - Icon: Grünes Blatt
  
  - [ ] **Detail-Karten (Unterhalb):**
    - 📊 "Y.Y Liter Kraftstoff gespart" (bei Verbrennern)
    - 📊 "Y.Y kWh Strom gespart" (bei E-Autos)
    - 💰 "~Z.ZZ € gespart" (Kraftstoffkosten)
    - 🚗 "~W km vermiedene Fahrten"
  
  - [ ] **Vergleichs-Visualisierung:**
    - "Das entspricht X Bäumen, die ein Jahr wachsen"
    - "Das entspricht Y km Autofahrt"
    - "So viel CO₂ wie Z Ladungen Smartphone"

**Berechnungs-Erweiterung:**
- [ ] `lib/co2Calculator.ts` erweitern:
  - [ ] `calculateSavedFuel()` - Gespartes Benzin/Diesel in Liter
  - [ ] `calculateSavedElectricity()` - Gesparter Strom in kWh
  - [ ] `calculateSavedMoney()` - Geldwert basierend auf:
    - Benzinpreis (Admin-Einstellung, z.B. 1.65 €/L)
    - Strompreis (Admin-Einstellung, z.B. 0.35 €/kWh)
  - [ ] `getComparisonFacts()` - Vergleichswerte generieren

**Admin-Settings erweitern:**
- [ ] `/admin/co2-tracking` zusätzliche Einstellungen:
  - [ ] Benzinpreis (€/Liter) - Standard: 1.65 €
  - [ ] Dieselpreis (€/Liter) - Standard: 1.55 €
  - [ ] Strompreis (€/kWh) - Standard: 0.35 €
  - [ ] Aktivieren/Deaktivieren einzelner Anzeigen

**API Erweiterung:**
- [ ] `/api/customer/co2-stats` erweiterte Response:
  ```typescript
  {
    totalCO2SavedGrams: number,
    totalFuelSavedLiters: number,    // Nur bei Verbrennern
    totalElectricitySavedKWh: number, // Nur bei E-Autos
    totalMoneySaved: number,          // in Euro
    totalDistanceAvoided: number,     // in km
    numberOfRequests: number,
    comparisons: {
      equivalentTrees: number,
      equivalentCarKm: number,
      equivalentPhoneCharges: number
    }
  }
  ```

**UI-Elemente:**
- [ ] Progress-Ring oder Gauge für CO₂-Reduktion
- [ ] Timeline: CO₂-Einsparung über Zeit (Chart)
- [ ] "Teilen"-Button: Social Media Share (optional)
- [ ] "Zertifikat herunterladen" (optional, PDF)

---

**Implementierungs-Reihenfolge:**
1. ✅ Schema-Definition und Datenbank-Migration
2. ✅ CO₂-Calculator Bibliothek entwickeln
3. ✅ Admin-Interface für Einstellungen
4. ✅ Integration in Anfrageerstellung
5. ✅ Basis-Widget im Kunden-Dashboard
6. ✅ Fahrzeugverwaltung mit Verbrauchsangaben
7. ✅ Erweiterte Berechnungen (Kraftstoff/Geld)
8. ✅ Vollständiges Dashboard-Widget mit allen Metriken

**Testing-Checkpoints:**
- [ ] Test 1: Berechnung mit Standard-Werten validieren
- [ ] Test 2: Berechnung mit persönlichen Werten prüfen
- [ ] Test 3: Admin-Settings Änderungen testen
- [ ] Test 4: Widget-Darstellung auf Mobile
- [ ] Test 5: Performance bei vielen Anfragen (100+)

**Dokumentation:**
- [ ] README-Sektion mit Berechnungslogik
- [ ] API-Dokumentation für CO₂-Endpoints
- [ ] Admin-Handbuch für CO₂-Einstellungen
- [ ] Kunden-FAQ: "Wie wird meine CO₂-Ersparnis berechnet?"

---

## ✅ FERTIG: Influencer-Partner-Programm (31.12.2025)

### ✅ DEPLOYMENT ERFOLGREICH (PM2 Restart #674):
- [x] **Datenbank-Schema erweitert** (Commit: d645b05)
  - ✅ InfluencerApplication Model hinzugefügt mit Status-Workflow
  - ✅ ApplicationStatus Enum (PENDING, APPROVED, REJECTED)
  - ✅ Automatisches Speichern von Bewerbungen in Datenbank
  - ✅ Duplikat-Check per E-Mail
  - ✅ Influencer Model mit 5 Provisionstypen:
    - CPM (Pro 1000 Views) - Standard €3.00
    - Pro registriertem Kunden - Standard €15.00
    - Pro erstem Angebot vom Kunden - Standard €25.00
    - Pro registrierter Werkstatt - Standard €20.00
    - Pro erstem Angebot von Werkstatt - Standard €30.00
  - ✅ Individuelle Provisionssätze pro Influencer
  - ✅ Payment-Daten (Bank/PayPal)

- [x] **Frontend-Komponenten:**
  - ✅ `/admin/influencer-applications` - Bewerbungsverwaltung
  - ✅ `ApplicationsList.tsx` - Bewerbungsübersicht
  - ✅ `ApprovalModal.tsx` - Genehmigungsformular
  - ✅ "📝 Bewerbungen" Button im Influencer-Management

- [x] **API-Routes:**
  - ✅ `POST /api/influencer/applications` - Öffentliche Bewerbung einreichen
  - ✅ `GET /api/admin/influencer-applications` - Bewerbungen abrufen
  - ✅ `POST /api/admin/influencer-applications/approve` - Genehmigen
  - ✅ Automatische Account-Erstellung
  - ✅ Temporäres Passwort-Generation
  - ✅ E-Mail-Benachrichtigungen an Admins

- [x] **E-Mail-System:**
  - ✅ Admin-Benachrichtigung bei neuer Bewerbung
  - ✅ Welcome-E-Mail mit Login-Daten
  - ✅ Alle 5 Provisionstypen angezeigt
  - ✅ Persönlicher Tracking-Link

- [x] **Dependencies:**
  - ✅ jsonwebtoken
  - ✅ @radix-ui/react-select
  - ✅ @types/jsonwebtoken

### 🐛 BEHOBENE PROBLEME:
1. ✅ **Missing Model Error** - `InfluencerApplication` Model fehlte im Schema
   - **Lösung**: Model mit allen Feldern hinzugefügt
   - **Commit**: d645b05
   
2. ✅ **Keine Datenspeicherung** - Bewerbungen wurden nur per E-Mail verschickt
   - **Lösung**: `prisma.influencerApplication.create()` hinzugefügt
   - **Features**: Duplikat-Check, Validierung

3. ✅ **Deployment-Issue** - Prisma Client hatte Model nicht
   - **Lösung**: `npx prisma generate && npx prisma db push`
   - **Status**: PM2 Restart #674 erfolgreich

### 📝 WICHTIGE DATEIEN:
- Schema: `prisma/schema.prisma` (Zeilen 2108-2136)
- Public API: `app/api/influencer/applications/route.ts`
- Admin API: `app/api/admin/influencer-applications/route.ts`
- Approve API: `app/api/admin/influencer-applications/approve/route.ts`
- Admin Page: `app/admin/influencer-applications/page.tsx`
- Components: `components/admin/ApplicationsList.tsx`, `ApprovalModal.tsx`

### 🎯 NÄCHSTE SCHRITTE:
- [ ] Influencer-Dashboard mit Statistiken erweitern
- [ ] Tracking-Links generieren und testen
- [ ] Payment-System für Provisionsauszahlung
- [ ] Analytics für Influencer-Performance

---

**Letzte Aktualisierung:** 31. Dezember 2025
**Version:** 0.8.3 - Influencer-System (100% fertig & deployed)
**Fortschritt:** 90% abgeschlossen (Phase 1-8 fertig)
**PM2 Status:** Restart #674, online
