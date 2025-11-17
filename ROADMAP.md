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

## 🔐 Phase 3: Authentication & Rollen-System
- [ ] NextAuth.js Integration
- [ ] Registrierung (Kunde/Werkstatt)
- [ ] Login mit Rollen-Erkennung
- [ ] Profil-Verwaltung
- [ ] SEPA-Mandats-Authentifizierung (Werkstatt)

**Status:** ⚪ Ausstehend

---

## 👤 Phase 4: Kunden-Bereich
- [ ] **Startseite** (einladend, Marketing-fokussiert)
- [ ] **Reifenanfrage erstellen:**
  - [ ] Reifentyp (Sommer/Winter/Allwetter)
  - [ ] Dimensionen (Breite/Querschnitt/Zoll)
  - [ ] Indices (Tragfähigkeit/Geschwindigkeit)
  - [ ] Runflat-Option
  - [ ] Hersteller-Präferenzen
  - [ ] Benötigt-bis Datum (mind. 7 Tage)
  - [ ] Umkreis-Slider (km)
- [ ] **Fahrzeug-Verwaltung:**
  - [ ] Fahrzeuge anlegen
  - [ ] Reifenhistorie je Fahrzeug
- [ ] **Angebots-Übersicht:**
  - [ ] Erhaltene Angebote anzeigen
  - [ ] Angebote vergleichen
  - [ ] Angebot annehmen
- [ ] **Termin-Buchung:**
  - [ ] Kalender mit freien Slots
  - [ ] Google Calendar Integration
- [ ] **Zahlungsoptionen:**
  - [ ] PayPal
  - [ ] Überweisung (IBAN anzeigen)
  - [ ] Kreditkarte
  - [ ] Vor-Ort-Zahlung
- [ ] **Bewertungen abgeben**

**Status:** ⚪ Ausstehend

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

## 📊 Aktueller Fortschritt

**Gesamt-Fortschritt:** 15% ███░░░░░░░░░░░░░░░░░

**Aktuelle Phase:** Phase 3 - Authentication & Rollen-System
**Nächste Schritte:** Login/Registrierung für Kunden und Werkstätten

---

## 🎯 Meilensteine

| Meilenstein | Ziel | Status |
|-------------|------|--------|
| M1: MVP - Basis-Funktionen | Anfrage erstellen, Angebot abgeben, Annahme | ⚪ Ausstehend |
| M2: Zahlungen & Termine | Terminbuchung, Zahlungsoptionen | ⚪ Ausstehend |
| M3: Provisionen & Admin | Admin-Dashboard, Abrechnungen | ⚪ Ausstehend |
| M4: Launch | Go-Live auf Subdomain | ⚪ Ausstehend |

---

**Letzte Aktualisierung:** 17.11.2025, 22:05 Uhr
**Version:** 0.2.0 - Basis-Setup abgeschlossen, Datenbank-Schema fertig, Startseite live
