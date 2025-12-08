# 🗺️ BEREIFUNG24 - Entwicklungs-Roadmap

## 📋 Projekt-Übersicht
**Plattform zur Vermittlung von Reifen und Montagedienstleistungen zwischen Kunden und Werkstätten**

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

**Gesamt-Fortschritt:** 60% ████████████░░░░░░░░

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
**Status:** ⏳ Offen  
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
**Status:** ⏳ Offen  
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
**Status:** ⏳ Offen  
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

**Letzte Aktualisierung:** 8. Dezember 2025
**Version:** 0.7.0 - Phasen 1-7 abgeschlossen, Feature 1 implementiert
**Fortschritt:** 60% abgeschlossen (Phase 1-7 fertig, Phase 8-14 offen)
**Neue Features:** 1 von 6 erledigt, 5 offen für Dezember 2025
