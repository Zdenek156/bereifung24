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

## ⏰ PHASE 2: Urlaubs- & Abwesenheitsverwaltung

**Timeline:** Woche 3-4 (18.01 - 01.02.2026)

### 2.1 Urlaubsverwaltung `/mitarbeiter/urlaub`
- [ ] Urlaubsantrag-Formular
  - [ ] Datumsauswahl (Start/Ende)
  - [ ] Art (Urlaub/Sonderurlaub)
  - [ ] Bemerkungsfeld
- [ ] Antrags-Übersicht
  - [ ] Pending/Approved/Rejected
  - [ ] Historie
- [ ] Urlaubskonto-Anzeige
  - [ ] Gesamt-Anspruch
  - [ ] Genommen
  - [ ] Resturlaub
- [ ] Genehmigungs-Workflow
  - [ ] Notification an Vorgesetzte
  - [ ] Approve/Reject-Funktion
  - [ ] E-Mail-Benachrichtigungen

### 2.2 Krankmeldungen `/mitarbeiter/krankmeldung`
- [ ] Krankmeldungs-Formular
- [ ] AU-Bescheinigung hochladen
- [ ] Krankmeldungs-Historie
- [ ] Automatische Benachrichtigungen
- [ ] Rückkehr-Datum-Tracking

### 2.3 Datenbank
- [ ] `LeaveRequest` Model
- [ ] `SickLeave` Model
- [ ] `LeaveBalance` Model
- [ ] Approval-Workflow-API
- [ ] Notification-System

---

## 🕐 PHASE 3: Zeiterfassung

**Timeline:** Woche 5-7 (01.02 - 22.02.2026)

### 3.1 Zeiterfassung `/mitarbeiter/zeit`
- [ ] Start/Stop-Buttons
- [ ] Pausenzeit-Erfassung
- [ ] Laufende Zeit-Anzeige
- [ ] Tageszusammenfassung
- [ ] Wochenübersicht
- [ ] Monatsübersicht
- [ ] Export-Funktion (Excel/PDF)

### 3.2 Überstunden-Tracking
- [ ] Automatische Berechnung
- [ ] Überstunden-Konto
- [ ] Abbau-Anträge
- [ ] Historie

### 3.3 Projekt/Kunden-Zuordnung
- [ ] Zeitbuchung auf Projekte
- [ ] Notizen zu Einträgen
- [ ] Auswertungen pro Projekt

### 3.4 Datenbank
- [ ] `TimeEntry` Model
- [ ] `WorkSession` Model
- [ ] `OvertimeBalance` Model
- [ ] Time-Tracking-API

---

## 🚗 PHASE 4: Fahrzeuge & Fahrten

**Timeline:** Woche 8-10 (22.02 - 15.03.2026)

### 4.1 Fahrtenbuch `/mitarbeiter/fahrtenbuch`
- [ ] Fahrt-Eingabe-Formular
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
