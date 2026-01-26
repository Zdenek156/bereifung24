# Bereifung24 Project

## Flutter Mobile App
- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [ ] Create and Run Task
- [ ] Launch the Project
- [x] Ensure Documentation is Complete

## GmbH Accounting System (HGB-konform)
- [x] 6 Prisma models: BalanceSheet, IncomeStatement, Depreciation, Provision, CapitalAccount, YearEndClosing
- [x] 66 SKR04 accounts seeded
- [x] Professional print layouts for Bilanz and GuV
- [x] Year selection: 2025 to current year only
- [x] Comparison API with null-safe logic
- [x] Back navigation buttons on all accounting pages
- [x] Lock/Approve workflow for balance sheets

### Lock/Approve Workflow Pattern
**Implementiert in:** [app/admin/buchhaltung/bilanz/page.tsx](../app/admin/buchhaltung/bilanz/page.tsx)

**Workflow:**
1. **Normal** (bearbeitbar) → "Neu generieren" und "Sperren" Buttons verfügbar
2. **Gesperrt** (`locked: true`, `lockedAt: timestamp`) → Keine Änderungen möglich, "Freigeben" Button erscheint
3. **Freigegeben** (`approvedBy: userId`) → Genehmigt durch autorisierten Benutzer (z.B. Geschäftsführer)

**API-Endpoints:**
- `POST /api/admin/accounting/balance-sheet/[id]/lock` - Sperrt die Bilanz
- `POST /api/admin/accounting/balance-sheet/[id]/approve` - Gibt die Bilanz frei

**Service-Funktionen:** [lib/accounting/balanceSheetService.ts](../lib/accounting/balanceSheetService.ts)
- `lockBalanceSheet(id, userId)` - Setzt `locked = true` und `lockedAt = new Date()`
- `approveBalanceSheet(id, userId)` - Setzt `approvedBy = userId` (nur wenn bereits locked)

**Zukünftige Verwendung:**
- [ ] **HR-Modul:** Hierarchie-System mit Freigabe-Workflows
  - Mitarbeiter-Dokumente (Verträge, Zeugnisse, etc.)
  - Urlaubsanträge (Mitarbeiter → Vorgesetzter → HR)
  - Spesenfreigaben (Mitarbeiter → Manager → Buchhaltung)
  - Gehaltsänderungen (HR → Geschäftsführung)
  - Struktur: `locked` (kann nicht mehr bearbeitet werden) → `approvedBy` (genehmigt durch autorisierten Benutzer)

## Future Phases

### Phase 2: Automation & Compliance
- [ ] Automatic booking generation from invoices
- [ ] Monthly depreciation cron job
- [ ] DATEV export functionality
- [ ] Provision tracking and release
- [ ] Capital account management

### Phase 3: HR Module
- [x] Employee hierarchy management
- [x] Document approval workflows (using Lock/Approve pattern)
- [x] Leave request approvals with hierarchy
- [x] Expense approvals with multi-level authorization
- [x] Salary change approvals (HR → Management)
- [x] Job postings on homepage with online application form
- [ ] **Payroll System (Gehaltsabrechnung) - Phase 2**

## HR Module - Payroll System (Phase 2)

### ⚠️ Gehaltsabrechnung - Komplexität & Optionen

**Status:** Prisma-Model vorhanden, Berechnungslogik fehlt

**Anforderungen:**
- Deutsche Gesetzeskonformität (2026)
- GoBD-konforme PDF-Generierung
- Revisionssichere Archivierung

**Zu implementieren:**

#### 1. Sozialversicherungsbeiträge 2026
- **Krankenversicherung (KV):** 14,6% (je 7,3% AN/AG) + Zusatzbeitrag Ø 1,7%
- **Pflegeversicherung (PV):** 3,4% (1,7% AN/AG) + 0,6% Kinderlosenzuschlag (ab 23 Jahre)
- **Rentenversicherung (RV):** 18,6% (je 9,3% AN/AG)
- **Arbeitslosenversicherung (ALV):** 2,6% (je 1,3% AN/AG)
- **Beitragsbemessungsgrenze:** West 96.600€ / Ost 96.600€

#### 2. Arbeitgeber-Umlagen
- U1-Umlage (Krankheit): ~1,5%
- U2-Umlage (Mutterschaft): ~0,3%
- U3-Umlage (Insolvenz): ~0,1%
- Berufsgenossenschaft: ~1% (branchenabhängig)

#### 3. Lohnsteuer nach Bundesland
- Steuerklassen I-VI mit verschiedenen Formeln
- Grundfreibetrag: 12.096€ (2026)
- Solidaritätszuschlag: 5,5% (ab Freigrenze)
- Kirchensteuer: 8% (BY, BW) oder 9% (Rest-DE)

#### 4. Sonderfälle
- Minijob: 520€/Monat, pauschal versteuert (2%)
- Gleitzone (Midijob): 520,01€ - 2.000€ (reduzierte SV)
- Kurzarbeit, Elternzeit, Krankheit

#### 5. Implementierungsoptionen

**Option A: Komplette Eigenentwicklung**
- ✅ Volle Kontrolle, keine Abhängigkeiten
- ❌ Sehr aufwändig (8-12h)
- ❌ Fehleranfällig bei Gesetzesänderungen
- ❌ Haftungsrisiko

**Option B: Externe Lohnsteuer-API + Eigene SV** ⭐ **EMPFOHLEN**
- ✅ Lohnsteuer extern korrekt berechnet
- ✅ SV-Berechnung selbst (einfacher)
- ✅ Reduziertes Haftungsrisiko
- ⚠️ Monatliche API-Kosten (~50-100€)
- Anbieter: personio.de, lexoffice.de, steuerrechner.de

**Option C: DATEV/Personio Integration**
- ✅ Professionell und rechtssicher
- ✅ Automatische Updates
- ❌ Hohe Kosten (ab 200€/Monat)
- ❌ Vendor Lock-in

#### 6. Schrittweise Umsetzung (empfohlen)

**Phase 2A: Basis-Gehaltsabrechnung (4-5h)**
- Admin gibt SV-Beiträge und Steuern manuell ein
- PDF-Generierung nach GoBD-Muster
- Archivierung und Versionierung
- ✅ Schnell ready, keine Fehlerrisiken

**Phase 2B: Automatische SV-Berechnung (3-4h)**
- Formeln für KV, PV, RV, ALV
- Beitragsbemessungsgrenzen
- Arbeitgeber-Umlagen

**Phase 2C: Lohnsteuer-Integration (2-3h)**
- API-Anbindung für Lohnsteuerberechnung
- Soli und Kirchensteuer
- Steuerklassen-Verwaltung
