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

## 🏭 Phase 5: Werkstatt-Bereich
- [ ] **Dashboard** (Anfragen-Übersicht)
- [ ] **Anfragen-Liste mit Filter:**
  - [ ] Nach Entfernung
  - [ ] Nach Zollgröße
  - [ ] Nach Runflat
  - [ ] Nach Reifentyp
  - [ ] Nach Datum
- [ ] **Angebot erstellen:**
  - [ ] Reifenbezeichnung eingeben
  - [ ] Hersteller angeben
  - [ ] Preis festlegen
  - [ ] Gültigkeitsdauer
- [ ] **Angebotsübersicht:**
  - [ ] Eigene Angebote
  - [ ] Status (Offen/Angenommen/Abgelaufen)
- [ ] **Termin-Verwaltung:**
  - [ ] Google Calendar Synchronisation
  - [ ] Zeitslot-Konfiguration
  - [ ] Gebuchte Termine
- [ ] **Werkstatt-Profil:**
  - [ ] Stammdaten
  - [ ] Bankverbindung (SEPA)
  - [ ] PayPal E-Mail
  - [ ] Öffnungszeiten
- [ ] **Bewertungen ansehen**
- [ ] **Provisionsübersicht:**
  - [ ] Akzeptierte Angebote
  - [ ] 5% Provision anzeigen
  - [ ] Monatliche Abrechnungen

**Status:** ⚪ Ausstehend

---

## 👨‍💼 Phase 6: Admin-Bereich
- [ ] **Dashboard mit Statistiken:**
  - [ ] Gesamt-Anfragen
  - [ ] Gesamt-Angebote
  - [ ] Angenommene Angebote
  - [ ] Provisions-Übersicht
- [ ] **Anfragen-Verwaltung:**
  - [ ] Alle Kundenanfragen
  - [ ] Status-Übersicht
- [ ] **Angebots-Verwaltung:**
  - [ ] Alle abgegebenen Angebote
  - [ ] Angenommene Angebote
  - [ ] Auswertungen
- [ ] **Provisions-Management:**
  - [ ] Automatische 5% Berechnung
  - [ ] Monatliche Übersichten
  - [ ] SEPA-Lastschrift-Export
  - [ ] Abrechnungshistorie
- [ ] **User-Management:**
  - [ ] Kunden verwalten
  - [ ] Werkstätten verwalten
  - [ ] Deaktivierung/Sperrung
- [ ] **System-Einstellungen**

**Status:** ⚪ Ausstehend

---

## 📧 Phase 7: E-Mail-System
- [ ] **Kunden-E-Mails:**
  - [ ] Registrierung-Bestätigung
  - [ ] Neues Angebot erhalten
  - [ ] Angebot angenommen (Bestätigung)
  - [ ] Termin-Erinnerung
  - [ ] Bewertungs-Anfrage
- [ ] **Werkstatt-E-Mails:**
  - [ ] Registrierung-Bestätigung
  - [ ] Neue passende Anfrage
  - [ ] Angebot angenommen
  - [ ] Termin-Bestätigung
  - [ ] Monatliche Provisionsabrechnung
- [ ] **Admin-E-Mails:**
  - [ ] Neue Registrierung
  - [ ] Probleme/Meldungen

**Status:** ⚪ Ausstehend

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

**Gesamt-Fortschritt:** 15% ███░░░░░░░░░░░░░░░░░

**Aktuelle Phase:** Phase 3 - Authentication & Rollen-System
**Nächste Schritte:** Kunden-Bereich: Reifenanfrage-Formular entwickeln

---

## 🎯 Meilensteine

| Meilenstein | Ziel | Status |
|-------------|------|--------|
| M1: MVP - Basis-Funktionen | Anfrage erstellen, Angebot abgeben, Annahme | 🟡 In Arbeit |
| M2: Zahlungen & Termine | Terminbuchung, Zahlungsoptionen | ⚪ Ausstehend |
| M3: Provisionen & Admin | Admin-Dashboard, Abrechnungen | ⚪ Ausstehend |
| M4: Launch | Go-Live auf Subdomain | ⚪ Ausstehend |

---

**Letzte Aktualisierung:** 17.11.2025, 23:55 Uhr
**Version:** 0.4.0 - Kunden-Bereich: Reifenanfrage-System implementiert
**Fortschritt:** 35% abgeschlossen (Phase 1-3 fertig, Phase 4 in Arbeit)
