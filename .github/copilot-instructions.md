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
- [ ] Employee hierarchy management
- [ ] Document approval workflows (using Lock/Approve pattern)
- [ ] Leave request approvals with hierarchy
- [ ] Expense approvals with multi-level authorization
- [ ] Salary change approvals (HR → Management)
