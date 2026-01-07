# 📊 BUCHHALTUNG - AKTUELLER STATUS & ROADMAP UPDATE

**Stand:** 07.01.2026, 23:45 Uhr  
**Projekt:** Bereifung24 Finanzbuchhaltung  
**Version:** 0.40.0

---

## ✅ ABGESCHLOSSENE PHASEN

### Phase 1: Datenmodell & Schema ✅ 100%
- [x] Prisma Models erstellt (ChartOfAccounts, AccountingEntry, Payroll, VehicleCost, AccountingSetting)
- [x] Enums definiert (EntrySourceType, AccountType, VehicleCostType, PayrollStatus)
- [x] Migration deployed: 20260106_add_accounting_system
- [x] SKR04 Kontenplan initialisiert (Seed-Script)
- [x] Bestehende Models erweitert

### Phase 2: Automatische Buchungen ✅ 60%
**Deployed:**
- [x] bookingService.ts mit allen 8 Auto-Booking-Methoden
- [x] Commission → AccountingEntry (Soll 1200 / Haben 8400)
- [x] Expense → AccountingEntry (Genehmigung + Zahlung)
- [x] AffiliatePayment → AccountingEntry (Soll 4650 / Haben 1200)

**Noch offen:**
- [ ] VehicleCost Integration (Methode vorhanden, API fehlt)
- [ ] Payroll Integration (Methode vorhanden, API fehlt)
- [ ] ProcurementOrder Integration

### Phase 3: Manuelle Buchungen & UI ✅ 100%
- [x] Dashboard: `/admin/buchhaltung` mit Navigation
- [x] Manuelle Buchung: `/admin/buchhaltung/manuelle-buchung`
- [x] Journalbuch: `/admin/buchhaltung/journal`
  - Filter (Datum, Suche, Konto, Betrag, Source)
  - Detail-Modal mit Audit-Log
  - Storno-Funktion (GoBD-konform)
  - Beleg-Integration (Phase 6)
- [x] Kontenplan-Seite: `/admin/buchhaltung/kontenplan`

### Phase 6: Beleg-Management ✅ 100%
- [x] API: `/api/admin/accounting/documents` (GET, POST, DELETE)
- [x] Frontend: `/admin/buchhaltung/belege`
- [x] Journal-Integration: Upload/Download/Remove in Detail-Modal
- [x] Dateispeicherung: `/public/uploads/accounting/YYYY/MM/`
- [x] Multi-File-Upload (PDF, JPG, PNG, HEIC, max 10MB)
- [x] attachmentUrls Array in AccountingEntry (String[])

### Phase 8: DATEV Export ✅ 30%
- [x] Export-Seite: `/admin/buchhaltung/export`
  - Format-Auswahl (DATEV/Excel/PDF)
  - Zeitraum-Picker (Monat/Quartal/Jahr/Custom)
  - Options (nur gesperrte Buchungen)
- [x] DATEV CSV Export: `/api/admin/accounting/export/datev`
  - EXTF 510/700 Format
  - 116 Spalten nach Spezifikation
  - UTF-8 mit BOM
  - Automatischer Download

**Noch offen:**
- [ ] Excel Export (exceljs)
- [ ] PDF Export (pdfkit/puppeteer)
- [ ] E-Mail-Versand
- [ ] Export-Log/Historie

---

## 🚧 IN ARBEIT / GEPLANT

### Phase 4: Gehaltsverwaltung
- [ ] Payroll-Übersicht
- [ ] Gehaltsabrechnung erstellen/bearbeiten
- [ ] PDF-Generierung
- [ ] Auto-Booking bei Auszahlung
- [ ] HR-System-Vorbereitung

### Phase 5: Fahrzeugkosten-Tracking
- [ ] Vehicle-Costs-Seite
- [ ] Kostenerfassung pro Fahrzeug
- [ ] Auto-Booking (Soll 6300 / Haben 1200)
- [ ] Dashboard-Widget

### Phase 7: Berichte & Auswertungen
- [ ] EÜR (Einnahmen-Überschuss-Rechnung)
- [ ] UStVA (Umsatzsteuer-Voranmeldung)
- [ ] BWA (Betriebswirtschaftliche Auswertung)
- [ ] Kontoblätter
- [ ] Summen- und Saldenliste

### Phase 9: GoBD-Compliance UI
- [ ] Lock/Unlock-Interface für Buchungen
- [ ] Automatische Sperrung nach Zeitraum
- [ ] Audit-Log-Übersicht
- [ ] Compliance-Dashboard (Validierungen)
- [ ] Archivierungs-Monitoring

---

## ⚠️ WICHTIG: GmbH-UMSTELLUNG (Zukünftig)

### Hintergrund
Bereifung24 plant die Umstellung auf eine GmbH. Dies erfordert grundlegende Änderungen in der Buchhaltung:

**Bisheriges System:**
- ✅ Einnahmen-Überschuss-Rechnung (EÜR)
- ✅ Einfache Buchführung
- ✅ Erlös-/Aufwandskonten (SKR04)

**Zukünftiges System (GmbH):**
- 🔄 Doppelte Buchführung (Bilanzierung)
- 🔄 Jahresabschluss (Bilanz + GuV)
- 🔄 Erweiterte Kontengruppen

### Erforderliche Änderungen

#### 1. Kontenrahmen erweitern
**Neu hinzufügen:**
- **Aktivkonten (0xxx, 1xxx):**
  - 0027 Anlagen im Bau ✅ (bereits vorhanden)
  - 0480 Andere Fahrzeuge ✅
  - Weitere Anlagevermögen-Konten
  - Forderungen aus Lieferungen
  - Bank/Kasse ✅

- **Passivkonten (2xxx, 3xxx):**
  - Eigenkapital (2800-2899)
  - Privatentnahmen/Privateinlagen
  - Rückstellungen
  - Verbindlichkeiten ✅ (3300 bereits da)

- **Abgrenzungskonten:**
  - Rechnungsabgrenzungsposten (RAP)
  - Aktive RAP (0980)
  - Passive RAP (3900)

#### 2. Neue Berichte
- [ ] **Bilanz** (Aktiva vs. Passiva)
  - Anlagevermögen
  - Umlaufvermögen
  - Eigenkapital
  - Fremdkapital (Verbindlichkeiten, Rückstellungen)

- [ ] **GuV (Gewinn- und Verlustrechnung)**
  - Ersetzt EÜR
  - Gesamtkostenverfahren oder Umsatzkostenverfahren
  - Jahresergebnis

- [ ] **Anlagenspiegel**
  - Entwicklung des Anlagevermögens
  - Zugänge/Abgänge
  - Abschreibungen
  - Buchwerte

- [ ] **Kapitalkontenentwicklung**
  - Eröffnungsbilanz
  - Privatentnahmen/Einlagen
  - Gewinn/Verlust
  - Schlussbilanz

#### 3. Buchungslogik anpassen

**Neue Buchungstypen:**
- **Abschreibungen:**
  - Soll 6220 (Abschreibungen) / Haben 0xxx (Anlagevermögen-Korrektur)
  - Monatliche planmäßige Abschreibungen

- **Rückstellungen:**
  - Soll 6850 (Rückstellungen) / Haben 3xxx (Rückstellungen Passiva)
  - z.B. für Steuernachzahlungen, Urlaubsrückstellungen

- **Forderungen/Verbindlichkeiten:**
  - Bei Rechnungsstellung: Soll 1400 (Forderungen) / Haben 8xxx (Erlöse)
  - Bei Zahlung: Soll 1200 (Bank) / Haben 1400 (Forderungen)

- **Privatentnahmen:**
  - Soll 2100 (Privatentnahmen) / Haben 1200 (Bank)
  - Wird gegen Eigenkapital gebucht

- **Jahresabschluss:**
  - GuV-Konten abschließen → Jahresüberschuss/-fehlbetrag
  - Bilanzvortrag erstellen
  - Eröffnungsbilanz für nächstes Jahr

#### 4. Migration & Übergang

**Schritte:**
1. **Eröffnungsbilanz erstellen**
   - Alle Vermögenswerte bewerten
   - Eigenkapital berechnen
   - Startbilanz zum Stichtag

2. **Altdaten migrieren**
   - Bestehende EÜR-Buchungen bleiben
   - Ab Stichtag: Doppelte Buchführung
   - Historische Daten archivieren

3. **Systeme parallel laufen lassen**
   - EÜR für Altdaten (vor Stichtag)
   - Bilanzierung für neue Daten (nach Stichtag)

4. **Steuerberater-Abnahme**
   - Eröffnungsbilanz prüfen lassen
   - Kontenplan abstimmen
   - Buchungslogik freigeben

#### 5. Technische Umsetzung

**Neue Prisma Models:**
```prisma
model BalanceSheet {
  id            String   @id @default(cuid())
  year          Int
  fiscalYear    String   // "2026", "2026/2027"
  assets        Json     // Aktiva-Struktur
  liabilities   Json     // Passiva-Struktur
  createdAt     DateTime @default(now())
  locked        Boolean  @default(false)
}

model Depreciation {
  id              String   @id @default(cuid())
  assetId         String
  asset           Asset    @relation(fields: [assetId], references: [id])
  year            Int
  month           Int
  depreciationRate Decimal @db.Decimal(5,2)
  amount          Decimal  @db.Decimal(10,2)
  bookValue       Decimal  @db.Decimal(10,2)
  entryId         String?  // Verknüpfung zu AccountingEntry
  createdAt       DateTime @default(now())
}

model Provision {
  id          String   @id @default(cuid())
  type        String   // TAX, VACATION, WARRANTY, etc.
  amount      Decimal  @db.Decimal(10,2)
  year        Int
  description String
  entryId     String?
  createdAt   DateTime @default(now())
}
```

**Neue Routes:**
- `/admin/buchhaltung/bilanz` - Bilanz-Übersicht
- `/admin/buchhaltung/guv` - GuV-Bericht
- `/admin/buchhaltung/anlagen` - Anlagenspiegel
- `/admin/buchhaltung/abschreibungen` - Abschreibungsplan
- `/admin/buchhaltung/jahresabschluss` - Jahresabschluss-Wizard

**Neue API-Endpoints:**
- `/api/admin/accounting/balance-sheet` - Bilanz erstellen/abrufen
- `/api/admin/accounting/income-statement` - GuV berechnen
- `/api/admin/accounting/depreciation` - Abschreibungen verwalten
- `/api/admin/accounting/year-end-closing` - Jahresabschluss durchführen

#### 6. Timeline & Phasen

**Phase 16 (NEU): GmbH-Umstellung**
- Dauer: 5-7 Arbeitstage
- Priorität: HOCH (nach Phase 9)
- Voraussetzungen:
  - ✅ Phase 1-9 abgeschlossen
  - ✅ Steuerberater-Absprache
  - ✅ Eröffnungsbilanz vorbereitet
  - ✅ Kontenplan erweitert

**Unterphasen:**
1. Kontenplan erweitern (1 Tag)
2. Neue Models & Migration (1 Tag)
3. Bilanz-/GuV-Berichte (2 Tage)
4. Abschreibungs-/Rückstellungslogik (1 Tag)
5. Jahresabschluss-Funktionen (1 Tag)
6. Testing & Steuerberater-Freigabe (1 Tag)

---

## 📦 OFFENE FEATURES

### Kurzfristig (nächste 2 Wochen)
1. **Excel/PDF Export** (Phase 8 vervollständigen)
2. **Fahrzeugkosten-Tracking** (Phase 5)
3. **Gehaltsverwaltung Basis** (Phase 4)
4. **EÜR-Bericht** (Phase 7)

### Mittelfristig (nächster Monat)
1. **GoBD-Compliance-UI** (Phase 9)
2. **UStVA-Bericht** (Phase 7)
3. **BWA-Bericht** (Phase 7)
4. **VehicleCost Auto-Booking** (Phase 2)
5. **Payroll Auto-Booking** (Phase 2)

### Langfristig (Q1 2026)
1. **GmbH-Umstellung** (Phase 16)
2. **Bilanzierung** (Phase 16)
3. **Jahresabschluss** (Phase 16)
4. **HR-System-Integration** (Phase 11)
5. **Erweiterte Berichte** (Kontoblätter, Saldenlisten)

---

## 🐛 BEKANNTE PROBLEME

### Minor Issues
- [ ] DATEV Export: BU-Schlüssel (USt-Schlüssel) fehlen noch (manuelles Mapping erforderlich)
- [ ] Kontenplan: Einige spezielle SKR04-Konten fehlen (werden bei Bedarf hinzugefügt)
- [ ] Performance: Bei sehr vielen Buchungen (>10.000) könnte Paginierung nötig sein

### Future Considerations
- [ ] Multi-Währung (falls internationales Geschäft)
- [ ] Kostenstellen-Rechnung (optional)
- [ ] Budget-Planung (optional)
- [ ] ELSTER-Schnittstelle (optional)

---

## 💾 DEPLOYMENT STATUS

**Production Server:** Hetzner 167.235.24.110  
**PM2 Status:** Online (Restart Count: 4778)  
**Last Deployment:** 07.01.2026, 23:30 Uhr  
**Last Commit:** `5631a5a` - "Add Phase 8 - DATEV CSV Export implementation"

**Database:**
- PostgreSQL on localhost:5432
- Latest Migration: 20260107_add_attachments_array
- Seed: SKR04 Kontenplan deployed

**Files:**
- Document Storage: `/public/uploads/accounting/`
- Backups: Daily automated (GoBD 10 years)

---

## 📞 NEXT STEPS

1. **Sofort (heute/morgen):**
   - ✅ DATEV Export testen mit echten Daten
   - Phase 9: GoBD-UI beginnen (Lock/Unlock)

2. **Diese Woche:**
   - Excel Export implementieren
   - EÜR-Bericht erstellen
   - Fahrzeugkosten-Integration

3. **Nächste Woche:**
   - Gehaltsverwaltung Basis
   - UStVA-Bericht
   - Compliance-Dashboard

4. **Vor GmbH-Umstellung:**
   - Alle Phasen 1-9 abschließen
   - Mit Steuerberater Eröffnungsbilanz besprechen
   - Kontenplan-Erweiterung planen
   - Stichtag festlegen

---

**Dokumentiert von:** GitHub Copilot  
**Für:** Bereifung24 Development Team  
**Review:** Erforderlich vor Phase 16 (GmbH-Umstellung)
