# 📊 BUCHHALTUNG - ROADMAP & IMPLEMENTIERUNGSPLAN

**Projekt:** Vollständige Finanzbuchhaltung für Bereifung24  
**Start:** 06.01.2026  
**Kontenrahmen:** SKR04 (Abschlussgliederung)  
**Geschäftsjahr:** Kalenderjahr (01.01. - 31.12.)  
**GoBD-konform:** Ja (10 Jahre Aufbewahrung)

---

## 🎯 PROJEKTZIELE

- [ ] Zentrale Buchhaltungsübersicht mit allen Einnahmen und Ausgaben
- [ ] Automatische Buchungserstellung aus bestehenden Systemen
- [ ] Manuelle Buchungsmöglichkeit für sonstige Geschäftsvorfälle
- [ ] Gehaltsverwaltung mit Vorbereitung für HR-Integration
- [ ] Fahrzeugkosten-Tracking für Geschäftsfahrzeuge
- [ ] Beleg-Management (PDF, Fotos, E-Mails)
- [ ] Export für Steuerberater (DATEV, Excel, PDF)
- [ ] GoBD-konforme Archivierung (unveränderbar, nachvollziehbar)
- [ ] Berichte: EÜR, UStVA, BWA

---

## 📋 PHASE 1: DATENMODELL & SCHEMA-ERWEITERUNG

**Dauer:** 2-3 Tage  
**Priorität:** KRITISCH

### 1.1 Neue Prisma Models erstellen

- [x] **ChartOfAccounts** - SKR04 Kontenplan
  - Kontonummern (z.B. 4120)
  - Kontobezeichnungen (z.B. "Löhne und Gehälter")
  - Kontentyp (REVENUE, EXPENSE, ASSET, LIABILITY)
  - Aktiv/Inaktiv Status

- [x] **AccountingEntry** - Zentrale Buchungen
  - Fortlaufende Belegnummer (GoBD)
  - Buchungsdatum / Belegdatum
  - Soll-Konto / Haben-Konto (SKR04)
  - Betrag, MwSt-Satz, MwSt-Betrag
  - Beschreibung, Dokumentennummer
  - Source-Typ (COMMISSION, EXPENSE, PAYROLL, etc.)
  - Source-ID (Verknüpfung zu Original-Datensatz)
  - Anlagen (PDF/Foto-URLs)
  - GoBD: locked-Status, Zeitstempel
  - Stornierung (Verknüpfung zu Original)
  - Audit-Fields (createdBy, createdAt, updatedAt)

- [x] **Payroll** - Gehaltsabrechnungen
  - Mitarbeiter-Verknüpfung
  - Monat/Jahr
  - Brutto-Gehalt, Netto-Gehalt
  - Steuer, Sozialversicherung
  - Bonuszahlungen, Abzüge
  - Status (DRAFT, APPROVED, PAID)
  - Auszahlungsdatum
  - PDF-Dokument
  - ⚠️ Hinweis: Vorbereitung für HR-System-Integration

- [x] **VehicleCost** - Fahrzeugkosten
  - Verknüpfung zu Asset (Fahrzeug)
  - Kostenart (FUEL, MAINTENANCE, INSURANCE, TAX, REPAIRS, PARKING, TOLLS, OTHER)
  - Datum, Betrag
  - KM-Stand
  - Beschreibung, Lieferant/Tankstelle
  - Beleg-URL

- [x] **AccountingSetting** - Konfiguration
  - Steuerberater-Daten (Name, Email, Telefon, Adresse)
  - Unternehmensdaten (Steuernummer, USt-IdNr.)
  - Export-Präferenzen (DATEV/Excel/PDF)
  - Kontenplan-Version (SKR04)
  - Belegnummern-Format und -Counter
  - Standard-MwSt-Sätze

### 1.2 Enums erweitern

- [x] EntrySourceType (COMMISSION, EXPENSE, TRAVEL_EXPENSE, PAYROLL, PROCUREMENT, INFLUENCER, VEHICLE, MANUAL)
- [x] AccountType (REVENUE, EXPENSE, ASSET, LIABILITY)
- [x] VehicleCostType (FUEL, MAINTENANCE, INSURANCE, TAX, REPAIRS, PARKING, TOLLS, OTHER)
- [x] PayrollStatus (DRAFT, APPROVED, PAID)
- [x] ExportFormat (DATEV, EXCEL, PDF)

### 1.3 Bestehende Models erweitern

- [x] B24Employee erweitern (falls nötig)
  - Relation zu Payroll
  - Gehaltsinformationen (für später mit HR-System)

### 1.4 Migration erstellen und testen

- [ ] `npx prisma migrate dev --name add_accounting_system`
- [ ] Lokale Testdatenbank prüfen
- [ ] Migration auf Produktions-Server vorbereiten

### 1.5 SKR04 Kontenplan initialisieren

- [x] Seed-Script für wichtigste SKR04-Konten erstellen:
  - **Erlöse (8xxx):**
    - 8400 - Erlöse (Provisionen Werkstätten)
    - 8120 - Umsatzerlöse 19% USt
    - 8300 - Erlöse sonstige Leistungen 19% USt
  - **Aufwendungen (4xxx, 6xxx):**
    - 4120 - Löhne und Gehälter
    - 4130 - Gesetzliche soziale Aufwendungen
    - 4650 - Provisionsaufwendungen
    - 4670 - Reisekosten Arbeitnehmer
    - 4671 - Reisekosten Unternehmer
    - 4610 - Werbekosten
    - 6200 - Fremdleistungen
    - 6300 - Kfz-Kosten
    - 6400 - Werbe- und Reisekosten
    - 6520 - Bürobedarf
    - 6805 - Werkzeuge und Kleingeräte
  - **Vermögen & Verbindlichkeiten:**
    - 0027 - Anlagen im Bau
    - 0480 - Andere Fahrzeuge
    - 1200 - Bank
    - 1600 - Kasse
    - 1576 - Umsatzsteuer-Vorauszahlung
    - 1780 - Umsatzsteuer 19%

- [ ] Seed ausführen: `npx prisma db seed`

---

## 📋 PHASE 2: AUTOMATISCHE BUCHUNGSERSTELLUNG

**Dauer:** 3-4 Tage  
**Priorität:** HOCH

### 2.1 Booking-Service erstellen

- [ ] `/lib/accounting/bookingService.ts` erstellen
  - Funktion: `createAccountingEntry()`
  - Belegnummern-Generator (fortlaufend, GoBD)
  - Validierung (Soll = Haben)
  - Doppelte Buchungen verhindern

### 2.2 Automatische Hooks/Trigger

- [ ] **Commission (Werkstatt-Provisionen)**
  - Hook bei Status-Änderung → COLLECTED
  - Buchung: Soll 1200 (Bank) / Haben 8400 (Erlöse)
  - MwSt: 19% (netto → brutto)
  - API-Route anpassen: `/api/admin/commissions`

- [ ] **AffiliatePayment (Influencer-Provisionen)**
  - Hook bei Status → PAID
  - Buchung: Soll 4650 (Provisionsaufwand) / Haben 1200 (Bank)
  - API-Route anpassen: `/api/admin/influencer-payments`

- [ ] **Expense (Mitarbeiter-Spesen)**
  - Hook bei Status → PAID
  - Buchung je nach Category:
    - MEAL → 4670 (Reisekosten)
    - HOTEL → 4670 (Reisekosten)
    - TRAVEL → 4670 (Reisekosten)
    - FUEL → 6300 (Kfz-Kosten)
    - TOOLS → 6805 (Werkzeuge)
    - OFFICE → 6520 (Bürobedarf)
    - PHONE → 6400 (Werbekosten)
  - Vorsteuer berücksichtigen (falls vorhanden)

- [ ] **TravelExpense (Reisekosten)**
  - Hook bei Status → PAID
  - Buchung: Soll 4670/4671 / Haben 1200 (Bank)
  - Kilometerpauschale + Übernachtung + Verpflegung

- [ ] **Payroll (Gehälter)**
  - Hook bei Status → PAID
  - Mehrere Buchungen:
    1. Brutto: Soll 4120 (Löhne) / Haben 1200 (Bank Netto)
    2. Steuer: Soll 4120 / Haben 1780 (USt)
    3. SV: Soll 4130 (Sozialabgaben) / Haben 1200

- [ ] **ProcurementOrder (Einkauf/Bestellungen)**
  - Hook bei Status → COMPLETED
  - Unterscheidung:
    - Wareneinkauf → 6200 (Fremdleistungen)
    - Anlagen → 0027/0480 (Anlagevermögen)
  - Vorsteuer-Abzug (falls Beleg mit MwSt)

- [ ] **VehicleCost (Fahrzeugkosten)**
  - Automatische Buchung bei Erstellung
  - Buchung: Soll 6300 (Kfz-Kosten) / Haben 1200 (Bank)

### 2.3 Stornierung-Logik

- [ ] Storno-Funktion für AccountingEntry
  - Neue Buchung mit negativem Betrag
  - Verknüpfung zu Original-Buchung
  - Nicht löschen, sondern stornieren (GoBD)

### 2.4 Error-Handling & Logging

- [ ] Fehlerbehandlung bei fehlgeschlagenen Buchungen
- [ ] Logging aller Auto-Bookings
- [ ] Retry-Mechanismus bei Fehlern

---

## 📋 PHASE 3: BUCHHALTUNGS-DASHBOARD & UI

**Dauer:** 4-5 Tage  
**Priorität:** HOCH

### 3.1 Navigation erweitern

- [ ] Admin-Menü erweitern:
  ```
  Buchhaltung
  ├── Übersicht (Dashboard)
  ├── Journalbuch
  ├── Kontenplan
  ├── Offene Posten
  ├── Manuelle Buchung
  ├── Berichte
  └── Einstellungen
  ```

### 3.2 Dashboard erstellen

**Route:** `/admin/accounting` oder `/admin/buchhaltung`

- [ ] **API-Route:** `/api/admin/accounting/dashboard`
  - Monatliche Einnahmen/Ausgaben
  - Gewinn/Verlust aktueller Monat
  - Jahres-Summen
  - Top-Konten
  - Ausstehende Belege
  - Umsatzsteuer-Vorschau

- [ ] **Frontend-Komponenten:**
  - KPI-Cards (Einnahmen, Ausgaben, Gewinn)
  - Diagramme (Monatsverlauf)
  - Letzte Buchungen (Tabelle)
  - Warnungen/Todos
  - Quick-Actions (Manuelle Buchung, Export)

### 3.3 Journalbuch

**Route:** `/admin/accounting/journal`

- [ ] **API-Route:** `/api/admin/accounting/entries`
  - GET: Alle Buchungen (paginiert)
  - POST: Manuelle Buchung erstellen
  - PATCH: Buchung sperren (lock)
  - DELETE: Buchung stornieren

- [ ] **Frontend:**
  - Tabelle mit Filterung (Datum, Konto, Betrag, Status)
  - Sortierung
  - Volltext-Suche
  - Beleg-Vorschau (PDF/Bild)
  - Detail-Ansicht (Modal)
  - Export-Button

### 3.4 Kontenplan-Verwaltung

**Route:** `/admin/accounting/chart-of-accounts`

- [ ] **API-Route:** `/api/admin/accounting/accounts`
  - GET: Alle Konten (SKR04)
  - POST: Neues Konto anlegen
  - PATCH: Konto bearbeiten
  - Konten aktivieren/deaktivieren

- [ ] **Frontend:**
  - Baumstruktur oder Tabelle
  - Gruppierung nach Kontentyp
  - Salden anzeigen
  - CRUD-Operationen

### 3.5 Offene Posten

**Route:** `/admin/accounting/open-items`

- [ ] **API-Route:** `/api/admin/accounting/open-items`
  - Ausstehende Provisionen (PENDING/BILLED)
  - Nicht genehmigte Spesen
  - Fehlende Belege
  - Überfällige Zahlungen

- [ ] **Frontend:**
  - Gruppierte Liste
  - Quick-Actions (Genehmigen, Zahlen, Beleg hochladen)

### 3.6 Manuelle Buchung

**Route:** `/admin/accounting/manual-entry`

- [ ] **Formular:**
  - Buchungsdatum / Belegdatum
  - Soll-Konto (Dropdown mit SKR04)
  - Haben-Konto (Dropdown)
  - Betrag
  - MwSt-Satz (0%, 7%, 19%)
  - Beschreibung
  - Dokumentennummer
  - Beleg-Upload (optional)
  - Validierung: Soll = Haben

- [ ] **API-Route:** `/api/admin/accounting/manual-entry`

---

## 📋 PHASE 4: GEHALTSVERWALTUNG

**Dauer:** 2-3 Tage  
**Priorität:** MITTEL  
**Hinweis:** Vorbereitung für spätere HR-System-Integration

### 4.1 Payroll-Übersicht

**Route:** `/admin/payroll` oder `/admin/gehalter`

- [ ] **API-Route:** `/api/admin/payroll`
  - GET: Alle Gehaltsabrechnungen
  - POST: Neue Abrechnung erstellen
  - PATCH: Status ändern (DRAFT → APPROVED → PAID)
  - DELETE: Entwurf löschen

- [ ] **Frontend:**
  - Monatliche Übersicht
  - Tabelle mit allen Mitarbeitern
  - Summen (Gesamt-Brutto, Gesamt-Netto)
  - Status-Filter
  - Bulk-Actions (mehrere auf einmal genehmigen)

### 4.2 Gehaltsabrechnung erstellen

**Route:** `/admin/payroll/new`

- [ ] **Formular:**
  - Mitarbeiter auswählen
  - Monat/Jahr
  - Brutto-Gehalt (Eingabe)
  - Steuer (Eingabe oder Berechnung)
  - Sozialversicherung (Eingabe)
  - Bonuszahlungen (optional)
  - Abzüge (optional)
  - Netto wird berechnet
  - Notizen
  - Status (Entwurf beim Erstellen)

- [ ] **Validierung:**
  - Keine doppelten Abrechnungen (Mitarbeiter + Monat + Jahr unique)
  - Positive Beträge

### 4.3 Gehaltsabrechnung-Detail

**Route:** `/admin/payroll/[id]`

- [ ] Detailansicht
- [ ] PDF-Vorschau (falls vorhanden)
- [ ] PDF generieren-Funktion
- [ ] Status ändern
- [ ] Als bezahlt markieren
- [ ] Automatische Buchung auslösen

### 4.4 PDF-Generierung (vereinfacht)

- [ ] Template für Gehaltsabrechnung
- [ ] Mitarbeiter-Daten
- [ ] Bruttogehalt, Abzüge, Nettogehalt
- [ ] Zeitraum
- [ ] PDF speichern im File-System
- [ ] ⚠️ Hinweis: Später Anbindung an externes HR-System oder Lohnbuchhaltungs-Software

### 4.5 Integration mit Buchhaltung

- [ ] Hook: Payroll.status = PAID → AccountingEntry
- [ ] Mehrere Buchungen:
  - Lohn-Brutto
  - Steuer
  - Sozialversicherung
  - Netto-Auszahlung

---

## 📋 PHASE 5: FAHRZEUGKOSTEN-TRACKING

**Dauer:** 2 Tage  
**Priorität:** NIEDRIG

### 5.1 Asset-Verwaltung erweitern

**Route:** `/admin/procurement/assets` (erweitern)

- [ ] Fahrzeuge filtern (AssetCategory = VEHICLE)
- [ ] Button "Kosten erfassen" bei Fahrzeugen

### 5.2 Fahrzeugkosten erfassen

**Route:** `/admin/procurement/assets/[id]/costs`

- [ ] **API-Route:** `/api/admin/vehicle-costs`
  - GET: Kosten für Fahrzeug
  - POST: Neue Kosten erfassen
  - PATCH: Kosten bearbeiten
  - DELETE: Kosten löschen

- [ ] **Formular:**
  - Kostenart (Dropdown: Treibstoff, Wartung, Versicherung, Steuer, Reparatur, Parken, Maut, Sonstiges)
  - Datum
  - Betrag
  - KM-Stand (optional)
  - Beschreibung
  - Lieferant/Tankstelle
  - Beleg hochladen

- [ ] **Übersicht:**
  - Tabelle aller Kosten
  - Summen nach Kostenart
  - Diagramm (Kosten im Zeitverlauf)
  - Export (Excel/CSV)

### 5.3 Integration mit Buchhaltung

- [ ] Hook: VehicleCost erstellt → AccountingEntry
- [ ] Buchung: Soll 6300 (Kfz-Kosten) / Haben 1200 (Bank)

### 5.4 Dashboard-Widget

- [ ] KPI: Gesamt-Fahrzeugkosten pro Monat
- [ ] Teuerste Fahrzeuge

---

## 📋 PHASE 6: BELEG-MANAGEMENT

**Dauer:** 3-4 Tage  
**Priorität:** MITTEL

### 6.1 Zentrale Belegsammlung

**Route:** `/admin/accounting/documents` oder `/admin/belege`

- [ ] **API-Route:** `/api/admin/accounting/documents`
  - GET: Alle Belege (mit Filter)
  - POST: Beleg hochladen
  - PATCH: Beleg zuordnen zu Buchung
  - DELETE: Beleg löschen

- [ ] **Frontend:**
  - Grid-Ansicht mit Thumbnails
  - Upload-Bereich (Drag & Drop)
  - Filterung (Datum, Zugeordnet/Nicht zugeordnet, Typ)
  - Vorschau-Modal (PDF/Bild)
  - Download-Funktion

### 6.2 Beleg-Upload verbessern

- [ ] Multi-File-Upload
- [ ] Datei-Typen: PDF, JPG, PNG, HEIC
- [ ] Max. Größe: 10MB pro Datei
- [ ] Automatische Thumbnail-Generierung

### 6.3 Zuordnung zu Buchungen

- [ ] Drag & Drop: Beleg auf Buchung ziehen
- [ ] Oder: Bei Buchung "Beleg hinzufügen" Button
- [ ] Mehrere Belege pro Buchung möglich
- [ ] Beleg-Vorschau in Buchungs-Detail

### 6.4 Manuelles OCR (ohne externe API)

- [ ] ⚠️ Erstmal ohne automatisches OCR (zu teuer)
- [ ] Später optional: tesseract.js (Browser-basiert, kostenlos aber langsam)
- [ ] Oder Eingabefeld: "Betrag aus Beleg" für manuelle Übernahme

### 6.5 E-Mail-Integration (optional, später)

- [ ] ⚠️ Nicht in dieser Phase
- [ ] Später: Rechnungen aus E-Mail-Postfach importieren

---

## 📋 PHASE 7: BERICHTE & AUSWERTUNGEN

**Dauer:** 3-4 Tage  
**Priorität:** HOCH

### 7.1 Berichte-Menü

**Route:** `/admin/accounting/reports`

- [ ] Übersichtsseite mit verfügbaren Berichten
- [ ] Zeitraum-Auswahl (Monat, Quartal, Jahr, Benutzerdefiniert)
- [ ] Export-Buttons

### 7.2 Einnahmen-Überschuss-Rechnung (EÜR)

- [ ] **API-Route:** `/api/admin/accounting/reports/euer`
  - Berechnung: Einnahmen - Ausgaben = Gewinn
  - Gruppierung nach Kontenklassen
  - Zeitraum-Filter

- [ ] **Frontend:**
  - Tabelle mit Konten-Gruppen
  - Summen (Einnahmen, Ausgaben, Gewinn/Verlust)
  - Export (PDF, Excel)
  - Druckansicht

- [ ] **Beispiel-Struktur:**
  ```
  EINNAHMEN
  ├── Provisionen Werkstätten (8400)
  ├── Sonstige Erlöse (8300)
  └── Summe Einnahmen: XX.XXX €

  AUSGABEN
  ├── Löhne und Gehälter (4120)
  ├── Sozialabgaben (4130)
  ├── Provisionen (4650)
  ├── Reisekosten (4670)
  ├── Kfz-Kosten (6300)
  └── Summe Ausgaben: XX.XXX €

  GEWINN/VERLUST: XX.XXX €
  ```

### 7.3 Umsatzsteuer-Voranmeldung (UStVA)

- [ ] **API-Route:** `/api/admin/accounting/reports/ustva`
  - Berechnung:
    - Umsatzsteuer (aus Einnahmen)
    - Vorsteuer (aus Ausgaben)
    - Zahllast = Umsatzsteuer - Vorsteuer
  - Gruppierung nach MwSt-Sätzen (19%, 7%, 0%)

- [ ] **Frontend:**
  - Formular-ähnliche Darstellung (wie ELSTER)
  - Zeilen für verschiedene Steuersätze
  - Berechnung Zahllast/Erstattung
  - Export (PDF)

- [ ] **Beispiel-Struktur:**
  ```
  Umsätze zu 19%: XX.XXX €
  → Umsatzsteuer 19%: X.XXX €
  
  Vorsteuern 19%: X.XXX €
  
  Zahllast: X.XXX €
  ```

### 7.4 BWA (Betriebswirtschaftliche Auswertung)

- [ ] **API-Route:** `/api/admin/accounting/reports/bwa`
  - Monatlicher Überblick
  - Kostenstruktur
  - Vergleich zu Vormonaten
  - Prozentuale Anteile

- [ ] **Frontend:**
  - Tabelle mit Monatsvergleich
  - Diagramme (Balken, Torten)
  - Trend-Analyse
  - Export (PDF, Excel)

### 7.5 Kontoblätter

- [ ] **API-Route:** `/api/admin/accounting/reports/account-sheet`
  - Alle Buchungen für ein Konto
  - Saldo berechnen
  - Zeitraum-Filter

- [ ] **Frontend:**
  - Konto auswählen (Dropdown)
  - Tabelle mit Buchungen
  - Saldo (Anfang, Buchungen, Ende)

### 7.6 Summen- und Saldenliste

- [ ] Alle Konten mit Summen
- [ ] Soll-/Haben-Salden
- [ ] Gruppierung nach Kontenklassen

---

## 📋 PHASE 8: STEUERBERATER-EXPORT

**Dauer:** 2-3 Tage  
**Priorität:** HOCH

### 8.1 Steuerberater-Einstellungen

**Route:** `/admin/accounting/settings`

- [ ] **Formular:**
  - Steuerberater-Name
  - Firma/Kanzlei
  - E-Mail
  - Telefon
  - Adresse
  - Bevorzugtes Export-Format (DATEV / Excel / PDF)

- [ ] **API-Route:** `/api/admin/accounting/settings`

### 8.2 Export-Seite

**Route:** `/admin/accounting/export`

- [ ] **Parameter:**
  - Zeitraum (Monat, Quartal, Jahr, Benutzerdefiniert)
  - Format (DATEV / Excel / PDF)
  - Optionen:
    - Mit Belegen (als ZIP)
    - Nur gebuchte Einträge
    - Nur nicht gesperrte Einträge

- [ ] **Export-Button:**
  - Generiert Datei
  - Download oder E-Mail an Steuerberater

### 8.3 DATEV-Export

- [ ] **CSV-Format nach DATEV-Spezifikation:**
  - Header-Zeile mit Metadaten
  - Spalten:
    - Umsatz
    - Soll/Haben-Kennzeichen
    - WKZ Umsatz (EUR)
    - Kurs
    - Basis-Umsatz
    - WKZ Basis-Umsatz
    - Konto
    - Gegenkonto
    - BU-Schlüssel (Buchungsschlüssel)
    - Belegdatum
    - Belegfeld 1 (Belegnummer)
    - Belegfeld 2
    - Buchungstext
    - Postensperre
    - KOST1 (Kostenstelle 1)
    - KOST2 (Kostenstelle 2)
    - usw.

- [ ] **Validierung:**
  - Kontenlänge (4 oder 8 Stellen)
  - Datumsformat (DDMM oder DDMMYYYY)
  - Encoding (ANSI oder UTF-8)

- [ ] **API-Route:** `/api/admin/accounting/export/datev`

### 8.4 Excel-Export

- [ ] **Format:**
  - Tabellenblatt "Journal" mit allen Buchungen
  - Spalten: Datum, Belegnr., Konto, Gegenkonto, Beschreibung, Betrag, MwSt
  - Tabellenblatt "Summen" mit Kontensalden
  - Tabellenblatt "EÜR" (Einnahmen-Überschuss-Rechnung)
  - Tabellenblatt "UStVA" (Umsatzsteuer)

- [ ] **Formatierung:**
  - Überschriften fett
  - Zahlenformate (Währung)
  - Summen-Zeilen
  - Filtern aktiviert

- [ ] **API-Route:** `/api/admin/accounting/export/excel`
- [ ] Library: `exceljs`

### 8.5 PDF-Export

- [ ] **Umfang:**
  - Deckblatt mit Unternehmensdaten und Zeitraum
  - Journalbuch (alle Buchungen)
  - EÜR
  - UStVA
  - Optional: Belege anhängen

- [ ] **API-Route:** `/api/admin/accounting/export/pdf`
- [ ] Library: `pdfkit` oder `puppeteer`

### 8.6 E-Mail-Versand

- [ ] Export als Anhang per E-Mail
- [ ] An Steuerberater-Adresse aus Einstellungen
- [ ] Betreff: "Buchhaltung [Zeitraum] - [Unternehmen]"
- [ ] Text-Vorlage anpassbar
- [ ] CC an Admin möglich

- [ ] **API-Route:** `/api/admin/accounting/export/email`

### 8.7 Export-Log

- [ ] Speichern:
  - Wer hat exportiert?
  - Wann?
  - Welcher Zeitraum?
  - Welches Format?
  - An wen versendet?

- [ ] **Übersicht:** `/admin/accounting/export/history`

---

## 📋 PHASE 9: GoBD-COMPLIANCE & ARCHIVIERUNG

**Dauer:** 2 Tage  
**Priorität:** HOCH (Rechtlich erforderlich)

### 9.1 Unveränderbarkeit (GoBD)

- [ ] **AccountingEntry: "locked" Status**
  - Gesperrte Buchungen können nicht mehr bearbeitet werden
  - Nur Stornierung möglich
  - Lock-Zeitpunkt und Lock-User speichern

- [ ] **Lock-Funktion:**
  - Manuell: Admin sperrt Buchung
  - Automatisch: Nach Export oder Monatsabschluss
  - Massen-Sperrung für Zeitraum

- [ ] **UI:**
  - Gesperrte Buchungen visuell kennzeichnen (Schloss-Icon)
  - Button "Sperren" / "Freigeben" (nur Admin)
  - Warnung beim Versuch zu bearbeiten

### 9.2 Belegnummern-Vergabe (GoBD)

- [ ] **Fortlaufende, lückenlose Nummerierung**
  - Format: `BEL-[JAHR]-[NUMMER]` (z.B. BEL-2026-00001)
  - Counter in AccountingSetting
  - Transaktionssicher (keine Dopplungen)

- [ ] **Prüfung:**
  - Alle Nummern fortlaufend?
  - Keine Lücken?
  - Bericht über fehlende Nummern

### 9.3 Änderungshistorie (Audit-Trail)

- [ ] **Audit-Log für AccountingEntry:**
  - Wer hat wann was geändert?
  - Alte Werte vs. Neue Werte
  - Grund für Änderung (optional)

- [ ] **Model: AccountingAuditLog**
  ```prisma
  model AccountingAuditLog {
    id        String   @id @default(cuid())
    entryId   String
    entry     AccountingEntry @relation(fields: [entryId], references: [id])
    action    String   // CREATED, UPDATED, LOCKED, STORNO
    userId    String
    user      User     @relation(fields: [userId], references: [id])
    changes   String?  // JSON mit Änderungen
    timestamp DateTime @default(now())
  }
  ```

- [ ] **UI:**
  - In Buchungs-Detail: Tab "Historie"
  - Liste aller Änderungen

### 9.4 Archivierung (10 Jahre)

- [ ] **Belege:**
  - Hochgeladene PDFs/Fotos speichern (nicht löschen)
  - Verzeichnisstruktur: `/uploads/accounting/[JAHR]/[MONAT]/`
  - Dateinamen mit Timestamp

- [ ] **Buchungsdaten:**
  - Datenbank-Backup regelmäßig
  - Export aller Buchungen pro Jahr als JSON/XML für Langzeit-Archiv

- [ ] **Aufbewahrungsfristen:**
  - Buchungsbelege: 10 Jahre
  - Jahresabschlüsse: 10 Jahre
  - Rechnungen: 10 Jahre (bereits in anderen Systemen vorhanden)

### 9.5 Export-Anforderung (GoBD)

- [ ] **Daten müssen exportierbar und lesbar sein ohne Spezialsoftware**
  - CSV/Excel: ✅
  - PDF: ✅
  - JSON-Export für alle Daten

- [ ] **Datenstruktur-Dokumentation:**
  - README mit Erklärung der Felder
  - Kontenplan-Zuordnung

### 9.6 Prüf-Tools

- [ ] **Validierungs-Dashboard:** `/admin/accounting/compliance`
  - ✅ Alle Buchungen mit Belegen?
  - ✅ Belegnummern lückenlos?
  - ✅ Soll = Haben für alle Einträge?
  - ✅ Gesperrte Buchungen nicht geändert?
  - ✅ Alle Exporte gespeichert?

- [ ] **Warnungen bei Verstößen**

---

## 📋 PHASE 10: OPTIMIERUNG & ZUSATZFUNKTIONEN

**Dauer:** 2-3 Tage  
**Priorität:** NIEDRIG (Nice-to-have)

### 10.1 Dashboard-Erweiterungen

- [ ] Widget: "Monatsvergleich" (aktueller Monat vs. Vormonat)
- [ ] Widget: "Top 5 Ausgaben-Kategorien"
- [ ] Widget: "Liquiditäts-Vorschau" (nächste 30 Tage)
- [ ] Widget: "Offene Rechnungen" (aus anderen Systemen)

### 10.2 Erweiterte Filter

- [ ] Gespeicherte Filter (z.B. "Alle Kfz-Kosten 2025")
- [ ] Quick-Filter (Heute, Diese Woche, Diesen Monat, Dieses Jahr)
- [ ] Mehrfach-Selektion (Shift+Click, Checkbox)

### 10.3 Kostenstellen (optional)

- [ ] Model: CostCenter
- [ ] Zuordnung von Buchungen zu Kostenstellen
- [ ] Berichte pro Kostenstelle

### 10.4 Budget-Planung

- [ ] Jahresbudget pro Konto/Kategorie festlegen
- [ ] Warnung bei Überschreitung
- [ ] Budget vs. Ist-Vergleich

### 10.5 Wiederkehrende Buchungen

- [ ] Template für regelmäßige Buchungen (z.B. Miete, Versicherung)
- [ ] Automatisch erstellen (monatlich, quartalsweise, jährlich)

### 10.6 Multi-Währung (später)

- [ ] ⚠️ Nur wenn internationales Geschäft
- [ ] Wechselkurse
- [ ] Umrechnung in EUR

### 10.7 Schnittstellen (später)

- [ ] ⚠️ Nicht in dieser Phase
- [ ] API für externe Buchhaltungs-Software (z.B. lexoffice, sevDesk)
- [ ] ELSTER-Schnittstelle (elektronische Steuererklärung)

---

## 📋 PHASE 11: HR-SYSTEM VORBEREITUNG

**Dauer:** 1 Tag (nur Planung)  
**Priorität:** DOKUMENTATION  
**Hinweis:** Für spätere Integration

### 11.1 Anforderungen an HR-System

- [ ] **Mitarbeiter-Stammdaten:**
  - Gehaltsstufen/Lohngruppen
  - Arbeitszeitmodelle (Vollzeit, Teilzeit, Minijob, Werkstudent)
  - Steuerklasse
  - Sozialversicherungsnummer
  - Bankverbindung

- [ ] **Lohnberechnung:**
  - Brutto → Netto
  - Steuer-Berechnung (Lohnsteuer-Tabellen)
  - Sozialversicherung (Kranken-, Renten-, Arbeitslosen-, Pflegevers.)
  - Kirchensteuer
  - Solidaritätszuschlag

- [ ] **Zeiterfassung:**
  - Arbeitsstunden erfassen
  - Überstunden
  - Urlaub/Krankheitstage
  - Zuschläge (Nacht, Wochenende, Feiertag)

### 11.2 Schnittstellen-Definition

- [ ] **Von HR-System zu Buchhaltung:**
  - Monatliche Gehaltsabrechnungen (Payroll-Datensatz)
  - Status-Updates (genehmigt, ausgezahlt)
  - PDF-Gehaltsabrechnungen

- [ ] **Von Buchhaltung zu HR-System:**
  - Bestätigung der Buchung
  - Auszahlungs-Datum

### 11.3 API-Endpoints vorbereiten

- [ ] `/api/hr/payroll` - Gehaltsabrechnungen empfangen
- [ ] Webhook für Status-Updates

### 11.4 Dokumentation

- [ ] README für HR-Entwickler
- [ ] API-Spezifikation (OpenAPI/Swagger)
- [ ] Beispiel-Daten (JSON)

---

## 📋 PHASE 12: TESTING & QA

**Dauer:** 3-4 Tage  
**Priorität:** KRITISCH

### 12.1 Unit-Tests

- [ ] BookingService Tests
  - Belegnummern-Generator
  - Validierung (Soll = Haben)
  - Doppelte Buchungen verhindern

- [ ] Auto-Booking Tests
  - Commission → AccountingEntry
  - Expense → AccountingEntry
  - Payroll → AccountingEntry

- [ ] Report-Tests
  - EÜR-Berechnung
  - UStVA-Berechnung

### 12.2 Integration-Tests

- [ ] Workflows testen:
  - Provision erfassen → Buchung erstellen → Export
  - Spesen genehmigen → Buchung erstellen
  - Gehalt erstellen → Buchung erstellen

### 12.3 E2E-Tests (optional)

- [ ] Playwright/Cypress Tests für UI
- [ ] Wichtigste User-Flows

### 12.4 Manuelle Tests

- [ ] Alle UI-Seiten durchklicken
- [ ] Filter/Suche testen
- [ ] Export-Funktionen testen (DATEV, Excel, PDF)
- [ ] Berechtigungen prüfen

### 12.5 Testdaten

- [ ] Seed-Script für Demo-Daten
  - Beispiel-Buchungen (verschiedene Konten)
  - Verschiedene Monate/Jahre
  - Mit und ohne Belege
  - Gesperrte und offene Buchungen

### 12.6 Bugfixing

- [ ] Issues aus Tests beheben
- [ ] Code-Review

---

## 📋 PHASE 13: DOKUMENTATION & SCHULUNG

**Dauer:** 2 Tage  
**Priorität:** HOCH

### 13.1 Benutzer-Dokumentation

- [ ] **Handbuch für Buchhaltungs-Mitarbeiter:**
  - Wie erstelle ich eine manuelle Buchung?
  - Wie ordne ich Belege zu?
  - Wie erstelle ich eine Gehaltsabrechnung?
  - Wie exportiere ich für Steuerberater?

- [ ] **FAQ:**
  - Was ist SKR04?
  - Welches Konto für welche Ausgabe?
  - Wie storniere ich eine Buchung?
  - Was bedeutet GoBD?

### 13.2 Admin-Dokumentation

- [ ] **System-Übersicht:**
  - Architektur-Diagramm
  - Datenfluss
  - Datenbank-Schema

- [ ] **Wartung:**
  - Datenbank-Backup
  - Belege archivieren
  - Monatsabschluss durchführen

### 13.3 Entwickler-Dokumentation

- [ ] **Code-Dokumentation:**
  - JSDoc für Funktionen
  - README für Module

- [ ] **API-Dokumentation:**
  - Endpoints beschreiben
  - Request/Response-Beispiele

### 13.4 Video-Tutorials (optional)

- [ ] Bildschirmaufnahmen für häufige Aufgaben
- [ ] Loom oder ähnlich

---

## 📋 PHASE 14: DEPLOYMENT & GO-LIVE

**Dauer:** 1-2 Tage  
**Priorität:** KRITISCH

### 14.1 Datenmigration

- [ ] Bestehende Daten prüfen:
  - Commissions
  - Expenses
  - TravelExpenses
  - ProcurementOrders

- [ ] Migrations-Script:
  - Historische Daten in AccountingEntry überführen
  - Belegnummern vergeben
  - Validierung

### 14.2 Produktions-Deployment

- [ ] Prisma Migration auf Prod-DB:
  ```bash
  npx prisma migrate deploy
  ```

- [ ] Seed SKR04 Kontenplan:
  ```bash
  npx prisma db seed
  ```

- [ ] Build & Deploy:
  ```bash
  npm run build
  pm2 restart bereifung24
  ```

### 14.3 Smoke-Tests

- [ ] Nach Deployment wichtigste Funktionen testen
- [ ] Logs prüfen
- [ ] Performance checken

### 14.4 Monitoring

- [ ] Fehler-Logging (Sentry oder ähnlich)
- [ ] Performance-Monitoring
- [ ] Alert bei kritischen Fehlern

### 14.5 Backup-Strategie

- [ ] Tägliches DB-Backup
- [ ] Wöchentliches File-Backup (Belege)
- [ ] Aufbewahrung: 10 Jahre (GoBD)

---

## 📋 PHASE 15: WARTUNG & SUPPORT

**Dauer:** Laufend  
**Priorität:** HOCH

### 15.1 Regelmäßige Aufgaben

- [ ] Monatlich:
  - Buchhaltung prüfen
  - Export für Steuerberater
  - Offene Posten abarbeiten

- [ ] Jährlich:
  - Jahresabschluss
  - Kontenplan aktualisieren (falls nötig)
  - Alte Daten archivieren

### 15.2 Support

- [ ] User-Fragen beantworten
- [ ] Bugs fixen
- [ ] Feature-Requests sammeln

### 15.3 Updates

- [ ] Gesetzliche Änderungen (z.B. MwSt-Sätze)
- [ ] Neue Konten hinzufügen
- [ ] Optimierungen

---

## 🎯 MEILENSTEINE & CHECKPOINTS

### Meilenstein 1: Foundation (nach Phase 1-2)
- [ ] Datenmodell steht
- [ ] Automatische Buchungen funktionieren
- [ ] Erste Testdaten vorhanden

### Meilenstein 2: Core Features (nach Phase 3-4)
- [ ] Dashboard läuft
- [ ] Journalbuch funktioniert
- [ ] Gehaltsverwaltung einsatzbereit

### Meilenstein 3: Export & Compliance (nach Phase 7-9)
- [ ] DATEV-Export funktioniert
- [ ] GoBD-konform
- [ ] Erste Steuerberater-Übergabe möglich

### Meilenstein 4: Go-Live (nach Phase 14)
- [ ] Produktiv im Einsatz
- [ ] Schulung durchgeführt
- [ ] Dokumentation vollständig

---

## ⚠️ RISIKEN & ABHÄNGIGKEITEN

### Risiken:
1. **GoBD-Konformität:** Muss von Steuerberater abgenommen werden
2. **Komplexität Lohnberechnung:** Evtl. externe Software nötig
3. **Datenmigration:** Fehler bei Überführung alter Daten
4. **Performance:** Bei vielen Buchungen langsam

### Abhängigkeiten:
1. **HR-System:** Kommt später, Schnittstelle muss vorbereitet sein
2. **Steuerberater:** Muss Format absegnen
3. **Bestehende Systeme:** Müssen weiter funktionieren

---

## 📞 KONTAKT & FREIGABEN

### Freigaben erforderlich:
- [ ] Datenmodell (Phase 1)
- [ ] UI-Design (Phase 3)
- [ ] Export-Formate (Phase 8)
- [ ] Go-Live (Phase 14)

### Bei Fragen:
- Projektleiter: [Name]
- Steuerberater: [Name, wenn vorhanden]
- IT: [Name]

---

## 📊 FORTSCHRITT

**Gesamt-Fortschritt:** 0% (0/200 Tasks)

**Phase 1:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 2:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 3:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 4:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 5:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 6:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 7:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 8:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 9:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 10:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 11:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 12:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 13:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 14:** ⬜️⬜️⬜️⬜️⬜️ 0%  
**Phase 15:** ⬜️⬜️⬜️⬜️⬜️ 0%  

---

**Letzte Aktualisierung:** 06.01.2026  
**Version:** 1.0  
**Status:** 🟡 In Planung
