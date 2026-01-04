# 🚀 MITARBEITER-PORTAL ROADMAP - Bereifung24

**Start:** 04.01.2026  
**Status:** In Entwicklung 🟢

---

## 📊 ÜBERSICHT

### Ziel
Professionelles Self-Service-Portal für alle Bereifung24-Mitarbeiter mit rollenbasierten Zugriffsrechten zur Digitalisierung administrativer Prozesse.

### Technologie-Stack
- **Frontend:** Next.js 14, React, TailwindCSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Datenbank:** PostgreSQL (Hetzner Server)
- **Auth:** NextAuth.js
- **Storage:** Lokaler Server (keine Cloud)
- **Verschlüsselung:** AES-256 für sensible Daten

---

## ✅ PHASE 0: Foundation (Abgeschlossen)

- [x] E-Mail-System für Mitarbeiter
  - [x] IMAP-Integration (Hetzner)
  - [x] SMTP-Versand (Port 587)
  - [x] Ordnerverwaltung (Inbox, Sent, Drafts, Trash)
  - [x] Custom E-Mail-Adressen
  - [x] Auto-Entwurf beim Schließen
- [x] B24Employee-System mit Permissions
- [x] Authentifizierung
- [x] Basis-Infrastruktur

---

## 🎯 PHASE 1: Dashboard & Profilverwaltung (In Arbeit)

**Timeline:** Woche 1-2 (04.01 - 18.01.2026)

### 1.1 Dashboard Homepage `/mitarbeiter`
- [ ] Dashboard-Layout mit Sidebar-Navigation
- [ ] Willkommens-Widget mit Mitarbeiter-Info
- [ ] Schnellübersicht-Karten (Quick Stats)
  - [ ] Offene Urlaubstage
  - [ ] Überstunden
  - [ ] Neue Dokumente
  - [ ] Offene Aufgaben
- [ ] Schnellzugriff-Buttons
- [ ] Responsive Design (Desktop/Tablet/Mobile)
- [ ] Permission-basierte Widget-Anzeige

### 1.2 Profilverwaltung `/mitarbeiter/profil`
- [ ] Stammdaten-Ansicht
  - [ ] Persönliche Informationen
  - [ ] Position & Abteilung
  - [ ] Kontaktdaten
  - [ ] Profilbild-Upload
- [ ] Bankverbindung (verschlüsselt)
  - [ ] IBAN, BIC
  - [ ] Bank-Name
- [ ] Notfall-Kontakt
- [ ] Steuer & Sozialversicherung
  - [ ] Steuer-ID
  - [ ] Sozialversicherungsnummer
  - [ ] Steuerklasse

### 1.3 Datenbank-Erweiterungen
- [ ] `EmployeeProfile` Model
- [ ] `EmployeeDocument` Model
- [ ] Verschlüsselungs-Utilities
- [ ] API-Routes für Profil
- [ ] File-Upload-System

---

## ✅ PHASE 2: Urlaubs- & Abwesenheitsverwaltung (ABGESCHLOSSEN)

**Timeline:** 04.01.2026  
**Status:** ✅ Live seit 04.01.2026

### 2.1 Urlaubsverwaltung `/mitarbeiter/urlaub`
- [x] Urlaubsantrag-Formular
  - [x] Datumsauswahl (Start/Ende)
  - [x] Art (Urlaub/Sonderurlaub/Unbezahlt)
  - [x] Bemerkungsfeld
- [x] Antrags-Übersicht
  - [x] Pending/Approved/Rejected Status
  - [x] Historie aller Anträge
- [x] Urlaubskonto-Anzeige
  - [x] Gesamt-Anspruch (30 Tage)
  - [x] Genommen
  - [x] Beantragt (Pending)
  - [x] Verfügbar
  - [x] Übertrag aus Vorjahr
- [x] API-Integration für LeaveBalance & LeaveRequest
- [ ] **HR-TODO:** Genehmigungs-Workflow
  - [ ] Notification an Vorgesetzte
  - [ ] Approve/Reject-Funktion in HR-Portal
  - [ ] E-Mail-Benachrichtigungen

### 2.2 Krankmeldungen `/mitarbeiter/krankmeldung`
- [x] Krankmeldungs-Formular
  - [x] Startdatum (Pflicht)
  - [x] Enddatum (Optional)
  - [x] Erwartetes Rückkehr-Datum
  - [x] Bemerkungsfeld
- [x] AU-Bescheinigung hochladen
  - [x] PDF/Bild-Upload
  - [x] Speicherung in `/uploads/sick-certificates/`
- [x] Krankmeldungs-Historie
  - [x] Alle Krankmeldungen anzeigen
  - [x] AU-Status (vorhanden/ausstehend)
- [x] Rückkehr-Datum-Tracking
- [ ] **HR-TODO:** Automatische Benachrichtigungen
  - [ ] E-Mail an HR bei neuer Krankmeldung
  - [ ] Erinnerung bei fehlender AU-Bescheinigung

### 2.3 Datenbank & API
- [x] `LeaveRequest` Model (bereits vorhanden)
- [x] `SickLeave` Model (bereits vorhanden)
- [x] `LeaveBalance` Model (bereits vorhanden)
- [x] `/api/employee/leave` - GET & POST
- [x] `/api/employee/sick-leave` - GET & POST
- [ ] **HR-TODO:** Approval-Workflow-API
- [ ] **HR-TODO:** Notification-System

### 📋 HR-Integration Notizen:
- Alle Datenstrukturen sind HR-ready
- `approvedBy`, `approvedAt`, `rejectionReason` Felder bereits vorhanden
- `substituteId` für Urlaubsvertretung implementiert
- Krankmeldungen mit Benachrichtigungs-Timestamp (`notifiedAt`)
- Upload-Ordner für AU-Bescheinigungen eingerichtet
- Status-Management implementiert (pending/approved/rejected/cancelled)

---

## ✅ PHASE 3: Zeiterfassung (ABGESCHLOSSEN)

**Timeline:** 04.01.2026  
**Status:** ✅ Live seit 04.01.2026

### 3.1 Zeiterfassung `/mitarbeiter/zeit`
- [x] Start/Stop-Buttons
  - [x] Große Live-Timer-Anzeige (Stunden:Minuten:Sekunden)
  - [x] Arbeit starten/beenden
  - [x] Status-Anzeige (Aktiv/Pause)
- [x] Pausenzeit-Erfassung
  - [x] Pause starten/beenden
  - [x] Automatische Pausenzeit-Berechnung
  - [x] Mehrere Pausen pro Session
- [x] Laufende Zeit-Anzeige
  - [x] Echtzeit-Update jede Sekunde
  - [x] Aktuelle Session-Zeit
- [x] Tageszusammenfassung
  - [x] Heute gearbeitet (Stunden)
  - [x] Anzahl Sessions
  - [x] Anzahl Pausen
- [x] Heutige Zeiteinträge-Liste
  - [x] Alle Sessions mit Start/Ende
  - [x] Status (Läuft/Beendet)
  - [x] Arbeitszeit + Pausenzeit
- [x] Auto-Refresh (alle 30 Sekunden)
- [ ] **TODO:** Wochenübersicht
- [ ] **TODO:** Monatsübersicht
- [ ] **TODO:** Export-Funktion (Excel/PDF)

### 3.2 Überstunden-Tracking
- [x] Automatische Berechnung im Hintergrund
  - [x] Monatliche Soll/Ist-Stunden
  - [x] Differenz (Überstunden/Minusstunden)
  - [x] Kumuliertes Saldo über Monate
- [x] `OvertimeBalance` Model mit Monatsdaten
- [ ] **TODO:** Überstunden-Konto-Anzeige für Mitarbeiter
- [ ] **TODO:** Abbau-Anträge für Überstunden
- [ ] **TODO:** Historie & Grafiken

### 3.3 Projekt/Kunden-Zuordnung
- [x] Feld `projectName` in WorkSession (optional)
- [ ] **TODO:** Zeitbuchung auf Projekte/Kunden
- [ ] **TODO:** Notizen zu Einträgen (erweitert)
- [ ] **TODO:** Auswertungen pro Projekt
- [ ] **TODO:** Projekt-Dropdown in UI

### 3.4 Datenbank & API
- [x] `WorkSession` Model (mit Relations)
- [x] `Break` Model (mit Berechnung)
- [x] `OvertimeBalance` Model (monatlich)
- [x] `/api/employee/time` - GET (aktuelle Session + heute)
- [x] `/api/employee/time` - POST (start, stop, break-start, break-end)
- [x] Automatisches Überstunden-Update bei Session-Ende

---

## 🚗 PHASE 4: Fahrzeuge & Fahrten (ABGESCHLOSSEN)

**Timeline:** 04.01.2026  
**Status:** ✅ Live seit 04.01.2026

### 4.1 Fahrtenbuch `/mitarbeiter/fahrtenbuch`
- [x] Fahrt-Eingabe-Formular
  - [x] Fahrzeug auswählen (Dropdown)
  - [x] Datum auswählen
  - [x] Start-KM / End-KM (automatische Berechnung)
  - [x] Start-/Ziel-Ort
  - [x] Zweck (Freitext)
  - [x] Art: Geschäftlich/Privat/Arbeitsweg
- [x] Fahrten-Übersicht (letzte 30 Tage)
  - [x] Alle Fahrten mit Details anzeigen
  - [x] Fahrzeug, Strecke, KM, Art
- [x] Monatsstatistik
  - [x] Monat gesamt (KM)
  - [x] Geschäftlich (KM)
  - [x] Anzahl Fahrten
- [x] Automatisches KM-Update am Fahrzeug
- [x] Kunde/Projekt-Zuordnung (optional)
- [ ] **TODO:** Monatlicher Export (PDF/Excel)
- [ ] **TODO:** 1%-Regelung für Privatfahrten berechnen
- [ ] **TODO:** Kilometerabrechnung (€/km)

### 4.2 Fahrzeugverwaltung (Admin) `/admin/vehicles`
- [x] Neues Fahrzeug anlegen
  - [x] Kennzeichen, Marke, Modell
  - [x] Baujahr, FIN/VIN
  - [x] Aktueller KM-Stand
  - [x] Mitarbeiter zuordnen (optional)
- [x] Fahrzeug-Übersicht
  - [x] Liste aller Fahrzeuge
  - [x] KM-Stand, Zuordnung, Status
  - [x] Anzahl Fahrten pro Fahrzeug
- [ ] **TODO:** Fahrzeug bearbeiten/deaktivieren
- [ ] **TODO:** Tankbelege hochladen (für Mitarbeiter)
- [ ] **TODO:** Wartungstermine verwalten
- [ ] **TODO:** Schadenmeldungen mit Fotos
- [ ] **TODO:** Leasingdokumente verwalten

### 4.3 Datenbank & API
- [x] `CompanyVehicle` Model (mit Leasing-Daten)
- [x] `TripEntry` Model (mit KM-Berechnung)
- [x] `FuelReceipt` Model (vorbereitet)
- [x] `VehicleDamage` Model (vorbereitet)
- [x] `VehicleMaintenance` Model (vorbereitet)
- [x] `/api/employee/trips` - GET & POST
- [x] `/api/admin/vehicles` - GET & POST
- [x] Automatisches KM-Update bei Fahrt

### 📋 Buchhaltungs-Integration (TODO):
- [ ] **Export-Funktion für Buchhaltung**
  - [ ] Monatlicher Export aller Fahrten (Excel/CSV)
  - [ ] Filterung nach Mitarbeiter
  - [ ] Filterung nach Fahrzeug
  - [ ] Filterung nach Zeitraum
  - [ ] Berechnung der Kilometerpauschale
  - [ ] Zugriff für Buchhaltungs-Rolle
- [ ] **Admin-Übersicht**
  - [ ] Alle Fahrten aller Mitarbeiter
  - [ ] Monatliche Statistiken
  - [ ] Tankkosten-Übersicht
  - [ ] Export für Steuerberater
  - [ ] Start-/End-KM
  - [ ] Start-/Ziel-Ort
  - [ ] Zweck (Geschäftlich/Privat)
  - [ ] Kunde/Projekt
- [ ] Fahrten-Übersicht
- [ ] Kilometerabrechnung
- [ ] Monatlicher Export
- [ ] 1%-Regelung für Privatfahrten

### 4.2 Fahrzeugverwaltung
- [ ] Fahrzeugstammdaten
- [ ] Kilometerstand-Historie
- [ ] Tankbelege hochladen
- [ ] Wartungstermine
- [ ] Schadenmeldungen mit Fotos
- [ ] Leasingdokumente

### 4.3 Datenbank
- [ ] `Vehicle` Model
- [ ] `TripEntry` Model
- [ ] `FuelReceipt` Model
- [ ] `VehicleDamage` Model
- [ ] `MaintenanceSchedule` Model

---

## 💰 PHASE 5: Spesen & Belege

**Timeline:** Woche 11-13 (15.03 - 05.04.2026)

### 5.1 Spesenverwaltung `/mitarbeiter/spesen`
- [ ] Beleg hochladen (Foto/PDF)
- [ ] OCR-Erkennung (Tesseract.js)
  - [ ] Datum extrahieren
  - [ ] Betrag extrahieren
  - [ ] MwSt. erkennen
- [ ] Kategorisierung
  - [ ] Essen & Trinken
  - [ ] Hotel
  - [ ] Fahrtkosten
  - [ ] Werkzeug/Material
  - [ ] Sonstiges
- [ ] Spesen-Übersicht
- [ ] Genehmigungs-Workflow
- [ ] Export für Buchhaltung

### 5.2 Reisekostenabrechnung
- [ ] Reise-Formular
- [ ] Verpflegungspauschalen
- [ ] Übernachtungskosten
- [ ] Fahrtkosten
- [ ] Gesamt-Abrechnung

### 5.3 Datenbank
- [ ] `Expense` Model
- [ ] `ExpenseCategory` Model
- [ ] `TravelExpense` Model
- [ ] OCR-Integration
- [ ] Approval-Workflow

---

## 📄 PHASE 6: Dokumentenverwaltung

**Timeline:** Woche 14-15 (05.04 - 19.04.2026)

### 6.1 Dokumente `/mitarbeiter/dokumente`
- [ ] Dokumenten-Übersicht
  - [ ] Arbeitsverträge
  - [ ] Lohnabrechnungen
  - [ ] Bescheinigungen
  - [ ] Weiterbildungen
  - [ ] Sonstige
- [ ] Upload durch Admin/HR
- [ ] Download mit Zugriffskontrolle
- [ ] Versionshistorie
- [ ] Zugriffs-Audit-Log

### 6.2 Sicherheit
- [ ] End-to-End Verschlüsselung
- [ ] Berechtigungs-Prüfung
- [ ] Automatische Löschung nach Frist
- [ ] Zugriffsprotokoll

### 6.3 Datenbank
- [ ] `EmployeeDocument` (bereits geplant)
- [ ] `DocumentAccess` Log
- [ ] `DocumentVersion` Model
- [ ] Encrypted File Storage

---

## 💬 PHASE 7: Kommunikation & Organisation

**Timeline:** Woche 16-17 (19.04 - 03.05.2026)

### 7.1 Schwarzes Brett `/mitarbeiter/news`
- [ ] Ankündigungen (Admin)
- [ ] Firmen-News
- [ ] Geburtstage
- [ ] Events
- [ ] Marketplace (optional)

### 7.2 Aufgabenverwaltung `/mitarbeiter/aufgaben`
- [ ] Aufgaben-Liste
- [ ] Delegation
- [ ] Deadlines & Erinnerungen
- [ ] Status-Tracking
- [ ] Priorisierung

### 7.3 Wissensdatenbank `/mitarbeiter/wiki`
- [ ] FAQ
- [ ] Anleitungen
- [ ] Vorlagen
- [ ] Video-Tutorials (optional)

### 7.4 Datenbank
- [ ] `Announcement` Model
- [ ] `Task` Model
- [ ] `KnowledgeArticle` Model

---

## 🎓 PHASE 8: Onboarding & Offboarding

**Timeline:** Woche 18-19 (03.05 - 17.05.2026)

### 8.1 Onboarding
- [ ] Willkommens-Checkliste
- [ ] Dokumente zum Ausfüllen
- [ ] Schulungsvideos
- [ ] Ansprechpartner
- [ ] IT-Equipment-Anforderung
- [ ] Zugangsberechtigungen

### 8.2 Offboarding
- [ ] Kündigungs-Workflow
- [ ] Rückgabe-Checkliste (Equipment)
- [ ] Zugangs-Deaktivierung
- [ ] Exit-Interview
- [ ] Zeugniserstellung

### 8.3 Datenbank
- [ ] `OnboardingChecklist` Model
- [ ] `OffboardingProcess` Model
- [ ] `EquipmentAssignment` Model

---

## 📊 PHASE 9: Analytics & Reporting

**Timeline:** Woche 20-21 (17.05 - 31.05.2026)

### 9.1 Admin-Dashboards
- [ ] Übersicht aller Mitarbeiter
- [ ] Urlaubsplanung (Kalenderansicht)
- [ ] Überstunden-Auswertung
- [ ] Krankheitstage-Statistik
- [ ] Spesen-Übersicht
- [ ] Fahrtkosten-Auswertung

### 9.2 Export-Funktionen
- [ ] Excel-Export für Lohnbuchhaltung
- [ ] PDF-Reports
- [ ] DATEV-Export (optional)

### 9.3 Datenbank
- [ ] Analytics Views
- [ ] Report Templates

---

## 📱 PHASE 10: Mobile App (Zukünftig)

**Timeline:** Q3 2026

- [ ] React Native App
- [ ] Zeiterfassung per App
- [ ] Krankmeldung
- [ ] Belege fotografieren
- [ ] Fahrtenbuch mit GPS
- [ ] Push-Notifications

---

## 🔐 SECURITY & COMPLIANCE (Durchgehend)

- [ ] DSGVO-Konformität
- [ ] Datenverschlüsselung (AES-256)
- [ ] Zugriffskontrolle
- [ ] Audit-Logs
- [ ] Backup-Strategie
- [ ] Aufbewahrungsfristen
- [ ] Löschkonzept

---

## 🎨 DESIGN-SYSTEM (Durchgehend)

- [ ] Konsistente UI-Komponenten
- [ ] Responsive Design
- [ ] Accessibility (WCAG 2.1)
- [ ] Dark Mode (optional)
- [ ] Mehrsprachigkeit (DE/EN)

---

## 📈 METRIKEN & ERFOLG

### KPIs
- Reduzierung HR-Anfragen um 70%
- Zeitersparnis: 10h/Woche für HR
- Mitarbeiter-Zufriedenheit: >90%
- System-Nutzung: >95% der Mitarbeiter

### Feedback-Zyklen
- Sprint-Reviews alle 2 Wochen
- User-Testing nach jeder Phase
- Iterative Verbesserungen

---

## 🛠️ TECHNICAL DEBT & OPTIMIERUNG

- [ ] Performance-Optimierung
- [ ] Code-Refactoring
- [ ] Test-Coverage erhöhen
- [ ] Documentation vervollständigen
- [ ] API-Dokumentation (OpenAPI)

---

**Letzte Aktualisierung:** 04.01.2026  
**Verantwortlich:** Bereifung24 Dev Team  
**Nächste Review:** 18.01.2026
