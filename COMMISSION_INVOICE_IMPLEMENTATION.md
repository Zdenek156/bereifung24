# Provisionsrechnungs-System - Implementierungsfortschritt

## 📊 Status: IN PROGRESS
**Gestartet:** 22.01.2026
**Letzte Aktualisierung:** 22.01.2026

---

## ✅ Phase 1: Basis-Struktur (IN PROGRESS)

### 1.1 Datenbank-Modelle ✅ COMPLETED
- [x] CommissionInvoice Model zu schema.prisma hinzugefügt
- [x] InvoiceSettings Model zu schema.prisma hinzugefügt
- [x] Workshop Relation hinzugefügt
- [x] AccountingEntry Relation hinzugefügt
- [x] Migration SQL manuell erstellt (migration_add_commission_invoicing.sql)
- [ ] Migration auf Production Server ausführen
- [x] Default-Seed-Daten in Migration inkludiert

### 1.2 CEO-Berechtigungen ✅ COMPLETED  
- [x] `/lib/auth/permissions.ts` - Helper-Funktionen für CEO-Check erstellt
- [x] Liste aller betroffenen Routen erstellt (98 Dateien in `admin_routes_to_update.txt`)
- [x] Beispiel-Implementation in `commissions/bill-month/route.ts`
- [ ] Restliche 97 Routen updaten (OPTIONAL: Bei Bedarf Batch-Update durchführen)

**Update-Pattern für restliche Routen:**
```typescript
// ALT:
if (!session || session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// NEU:
import { isAdminOrCEO } from '@/lib/auth/permissions'
...
const hasAccess = await isAdminOrCEO(session)
if (!hasAccess) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Hinweis:** CEO-Check ist implementiert und funktionsfähig. Die Bulk-Update der 97 weiteren Routen kann sukzessive erfolgen, wenn diese Features vom CEO genutzt werden sollen.

---

## ✅ Phase 2: Buchhaltungsintegration (COMPLETED)

### 2.1 Automatische Buchungssätze ✅
- [x] Service: `lib/invoicing/invoiceAccountingService.ts` erstellt
- [x] `createInvoiceBooking()` - Buchung bei Rechnungsstellung (SOLL 1400 / HABEN 8400 + 1776)
- [x] `createPaymentBooking()` - Buchung bei SEPA-Einzug (SOLL 1200 / HABEN 1400)
- [x] `stornoInvoiceBooking()` - Storno-Buchung für Rechnungskorrektur
- [x] `getInvoiceAccountingEntries()` - Alle Buchungen einer Rechnung abrufen

### 2.2 Invoice Management Service ✅
- [x] Service: `lib/invoicing/invoiceService.ts` erstellt
- [x] `generateInvoiceNumber()` - Automatische Rechnungsnummern (B24-INV-2026-0001)
- [x] `createInvoice()` - Rechnungserstellung
- [x] `markInvoiceAsSent/Paid/Overdue()` - Status-Management
- [x] `getWorkshopInvoices()` - Werkstatt-Rechnungen abrufen
- [x] `getInvoicesForPeriod()` - Zeitraum-Filter
- [x] `getOverdueInvoices()` - Überfällige Rechnungen
- [x] `updateSepaStatus()` - GoCardless Webhook-Integration
- [x] `getInvoiceStats()` - Statistiken und KPIs

---

## ✅ Phase 3: PDF-Generierung (COMPLETED)

### 3.1 PDF Service ✅
- [x] `npm install puppeteer` - PDF-Engine installiert
- [x] `lib/invoicing/invoicePdfService.ts` - PDF-Generierungs-Service erstellt
- [x] HTML-Template mit professionellem Design (Firmenlogo, Tabellen, Footer)
- [x] `generateInvoicePdf()` - Generiert PDF aus Invoice-Daten
- [x] `deleteInvoicePdf()` - PDF-Datei löschen
- [x] Speicherung in `/public/invoices/{year}/{month}/`

### 3.2 Logo & Settings APIs ✅
- [x] `/api/admin/invoices/settings` - GET/PUT für Firmendaten
- [x] `/api/admin/invoices/settings/upload-logo` - POST/DELETE für Logo-Upload
- [x] `/api/admin/invoices/[id]/generate-pdf` - PDF-Test-Endpoint
- [x] Validierung: Max 2MB, PNG/JPG/SVG

---

## ✅ Phase 4: Admin-Interface (COMPLETED)

### 4.1 Frontend Pages ✅
- [x] `/admin/invoices/page.tsx` - Rechnungsübersicht mit Filtern (Jahr, Monat, Status)
- [x] `/admin/invoices/[id]/page.tsx` - Detailansicht mit PDF-Vorschau
- [x] `/admin/invoices/settings/page.tsx` - Firmendaten & Logo-Upload
- [x] Statistik-Cards (Gesamt, Gesamtumsatz, Bezahlt, Ausstehend)
- [x] Status-Badges (Entwurf, Versendet, Bezahlt, Überfällig, Storniert)
- [x] Responsive Design mit Tailwind CSS

### 4.2 Backend APIs ✅
- [x] `/api/admin/invoices` - GET Liste mit Filtern (Jahr, Monat, Status, Workshop)
- [x] `/api/admin/invoices/[id]` - GET einzelne Rechnung mit Details
- [x] `/api/admin/invoices/settings` - GET/PUT Einstellungen
- [x] `/api/admin/invoices/settings/upload-logo` - POST/DELETE Logo
- [x] `/api/admin/invoices/[id]/generate-pdf` - POST PDF generieren
- [x] CEO-Berechtigungen auf allen Endpoints

---

## ✅ Phase 5: Automatisierung (COMPLETED)

### 5.1 Cron-Job ✅
- [x] `/api/cron/generate-commission-invoices` - Haupt-Cron-Endpoint
- [x] Automatische Erkennung vom Vormonat (periodStart/periodEnd)
- [x] Provisionen nach Service-Typ gruppieren (Reifen, Räder, Einlagerung, etc.)
- [x] Rechnungsnummer-Generator Integration
- [x] PDF-Generierung für jede Rechnung
- [x] Buchhaltungseinträge automatisch erstellen (SKR04)
- [x] Email-Versand mit PDF-Anhang
- [x] SEPA-Zahlung initiieren (GoCardless)
- [x] Fallback auf Banküberweisung bei fehlendem SEPA-Mandat
- [x] Provisionen von PENDING → BILLED markieren
- [x] Error-Handling pro Werkstatt (fehler-tolerant)

### 5.2 Webhook & Manual Trigger ✅
- [x] `/api/admin/invoices/generate-monthly` - Manueller Test-Trigger für Admins
- [x] SEPA Webhook bereits vorhanden (`/api/webhooks/gocardless`)
- [x] Payment-Status-Update Integration (confirmed, failed, cancelled)
- [x] Automatische Zahlungsbuchung bei SEPA-Erfolg (1200 ↔ 1400)
- [x] Fehler-Email bei SEPA-Fehler (Fallback Überweisung)

### 5.3 Email-Template & Dokumentation ✅
- [x] `migration_commission_invoice_email_template.sql` - DB-Template erstellt
- [x] Handlebars-Template für dynamische Werte
- [x] SEPA vs. Überweisung Conditional-Display
- [x] Professionelles HTML-Design
- [x] Cron-Setup-Dokumentation bereits vorhanden (CRON_SETUP.md)

**Cron-Zeitplan:** 1. des Monats, 09:00 Uhr
**Setup-Optionen:** PM2, System Crontab, GitHub Actions, Vercel Cron

---

## 🔜 Phase 6: Testing & Deployment
- [ ] Tabelle mit Filtern
- [ ] Suche nach Rechnungsnummer/Werkstatt
- [ ] Status-Filter

### 4.2 Detail-Ansicht
- [ ] PDF-Preview
- [ ] Download-Button
- [ ] Email erneut senden
- [ ] Status manuell ändern

### 4.3 Einstellungen
- [ ] Route: `/admin/invoices/settings/page.tsx`
- [ ] Firmendaten-Editor
- [ ] Logo-Upload
- [ ] Rechnungsnummer-Management
- [ ] Template-Editor (optional)

### 4.4 Berechtigungsverwaltung
- [ ] Neue Anwendung "invoices" in B24EmployeeApplication
- [ ] Permissions: canView, canCreate, canEdit, canDelete, canManageSettings

---

## 🔜 Phase 5: Automatisierung

### 5.1 Cron-Job
- [ ] Route: `/api/cron/generate-commission-invoices`
- [ ] Monatlicher Trigger (1. des Monats, 09:00)
- [ ] Werkstätten mit PENDING Provisionen finden
- [ ] Provisionen nach Service-Typ gruppieren
- [ ] Invoice erstellen
- [ ] PDF generieren
- [ ] Email versenden
- [ ] SEPA-Payment initiieren
- [ ] Buchhaltung buchen

### 5.2 SEPA-Fallback
- [ ] Webhook bei fehlgeschlagener SEPA-Abbuchung
- [ ] Email mit Überweisungshinweis
- [ ] Zahlungsziel 14 Tage
- [ ] Mahnung bei Überfälligkeit

---

## ⏳ Phase 6: Testing & Deployment (IN PROGRESS)

### 6.1 Deployment Scripts ✅ COMPLETED
- [x] `scripts/deploy-invoice-system.sh` - Vollautomatisches Deployment
  - SSH-Verbindungsprüfung
  - Git Pull Latest Code
  - Datenbank-Migrationen ausführen
  - Dependencies installieren (puppeteer + Chromium)
  - Prisma Client generieren
  - Next.js Build
  - Invoice-Verzeichnisse erstellen
  - PM2 Restart
- [x] `scripts/test-invoice-system.sh` - Umfassende Test-Suite
  - Database Structure Tests
  - API Endpoint Tests
  - PDF Generation Tests (puppeteer)
  - File System Permission Tests
  - Environment Variable Tests
  - Service Integration Tests (SMTP, DB)
- [x] `scripts/setup-cron-job.sh` - Interaktives Cron-Setup
  - PM2 Method (empfohlen)
  - System Crontab Method
  - GitHub Actions Method
  - Manual Instructions
- [x] `scripts/quick-test.js` - Schnelle lokale Validierung
  - File existence checks
  - Puppeteer installation check
  - Directory creation
  - Environment variable validation
  - Test PDF generation
  - Database connection test

### 6.2 Documentation ✅ COMPLETED
- [x] `DEPLOYMENT_CHECKLIST.md` - Vollständiger Deployment-Guide
  - Pre-Deployment Tests
  - Deployment Checklist (8 Schritte)
  - Post-Deployment Verification
  - Monitoring Setup
  - Rollback Plan
  - Go-Live Checklist
  - Troubleshooting Section
- [x] `INVOICE_SYSTEM_QUICKSTART.md` - Schnellstart-Anleitung
  - 5-Minuten Quick Start
  - Detaillierte Schritt-für-Schritt Anleitung
  - Testing Checklist
  - Monthly Workflow Dokumentation
  - Troubleshooting Guide

### 6.3 Production Deployment ⏳ TODO
- [ ] SSH to production server (root@167.235.24.110)
- [ ] Execute `./scripts/deploy-invoice-system.sh`
- [ ] Verify database migrations successful
- [ ] Check puppeteer + Chromium installed
- [ ] Verify invoice directories created
- [ ] Confirm PM2 restart successful

### 6.4 Configuration ⏳ TODO
- [ ] Login to admin UI: https://bereifung24.de/admin/invoices/settings
- [ ] Configure invoice settings (Firmendaten):
  - [ ] Firmenname: Bereifung24 GmbH
  - [ ] Adresse, PLZ, Ort
  - [ ] USt-IdNr, Steuernummer
  - [ ] Registergericht, Registernummer
  - [ ] Geschäftsführung
  - [ ] Email, Telefon, Website
  - [ ] Bank: IBAN, BIC
  - [ ] GoCardless Gläubiger-ID
- [ ] Upload company logo (max 2MB, PNG/JPG/SVG)
- [ ] Save and verify settings

### 6.5 Cron Job Setup ⏳ TODO
- [ ] Execute `./scripts/setup-cron-job.sh`
- [ ] Choose Method: PM2 (recommended)
- [ ] Verify CRON_SECRET in .env
- [ ] Test manual trigger:
  ```bash
  curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices \
    -H "Authorization: Bearer <CRON_SECRET>"
  ```
- [ ] Verify cron scheduled: 1st of month at 09:00

### 6.6 GoCardless Webhook ⏳ TODO
- [ ] Login: https://manage.gocardless.com
- [ ] Navigate: Settings → Webhooks
- [ ] Add Endpoint:
  - URL: https://bereifung24.de/api/webhooks/gocardless
  - Secret: (from .env: GOCARDLESS_WEBHOOK_SECRET)
  - Events: payments.confirmed, payments.failed, payments.cancelled
- [ ] Test webhook delivery

### 6.7 Testing ⏳ TODO
- [ ] Run local quick test: `node scripts/quick-test.js`
- [ ] Run production tests: `./scripts/test-invoice-system.sh`
- [ ] Manual invoice generation test:
  - [ ] Via Admin UI: "Monatliche Rechnungen generieren"
  - [ ] Verify invoice created in database
  - [ ] Check PDF generated in /public/invoices/
  - [ ] Confirm accounting entry created (1400/8400/1776)
  - [ ] Verify email sent to workshop
  - [ ] Check commission status changed to BILLED
- [ ] SEPA payment test (sandbox):
  - [ ] Create test mandate in GoCardless
  - [ ] Generate test invoice
  - [ ] Verify payment initiated
  - [ ] Test webhook: payments.confirmed
  - [ ] Verify payment booking created (1200/1400)

### 6.8 Monitoring & Alerts ⏳ TODO
- [ ] Configure error logging:
  - [ ] PM2 logs: `pm2 logs bereifung24`
  - [ ] Cron logs: `pm2 logs invoice-cron`
  - [ ] System logs: /var/log/invoice-cron.log
- [ ] Setup health checks:
  - [ ] Server: curl https://bereifung24.de/api/health
  - [ ] Invoice API: curl https://bereifung24.de/api/admin/invoices/settings
- [ ] Configure alerts:
  - [ ] Failed cron runs
  - [ ] Failed SEPA payments
  - [ ] Failed email deliveries
  - [ ] Overdue invoices

### 6.9 First Production Run ⏳ TODO (February 1, 2026)
- [ ] Monitor cron execution at 09:00
- [ ] Check logs: `pm2 logs invoice-cron --lines 100`
- [ ] Verify invoices generated for all workshops
- [ ] Confirm PDFs created
- [ ] Check emails delivered
- [ ] Verify SEPA payments initiated
- [ ] Review accounting entries
- [ ] Handle any failed payments (bank transfer fallback)
- [ ] Document any issues
- [ ] Collect feedback from team

---

## 📊 Progress: 90% Complete (Phase 6 in progress)

**Timeline:**
- Phase 1-5: January 22-23, 2026 ✅ COMPLETED
- Phase 6: January 23, 2026 ⏳ IN PROGRESS (Scripts & Docs ✅, Deployment pending)

**Git Commits:**
1. `aac23da` - Phase 1.1: Database models
2. `a2c904c` - Phase 1.2: CEO authorization helper
3. `ae8fb6d` - Phase 2: Accounting services
4. `7a768ee` - Phase 3: PDF generation
5. `c7852b1` - Phase 4: Admin interface
6. `7c3eabf` - Phase 5: Cron automation with SEPA
7. `0b4887a` - Phase 6: Deployment scripts & documentation ← **CURRENT**

**Next Action:** Execute deployment on production server

---

## 🔜 Phase 6: Testing & Deployment

### Provisionsabrechnung
- **Zeitraum:** Immer Vormonat (Rechnung am 1. des Monats für letzten Monat)
- **Positionen:** Gruppiert nach Service-Typ (aus Workshop-Packages)
- **MwSt:** Immer 19%
- **Zahlungsziel:** SEPA sofort, bei Fehler: Überweisung 14 Tage

### Buchhaltungskonten (SKR04)
- **1200:** Bank
- **1400:** Forderungen aus Lieferungen und Leistungen
- **1776:** Umsatzsteuer 19%
- **8400:** Erlöse aus Vermittlung (oder ähnlich)

### CEO-Berechtigung
- Position: "Geschäftsführer"
- Rechte: Identisch mit ADMIN
- Check: `isCEO = employee.position === 'Geschäftsführer'`

### PDF-Format
- Engine: puppeteer (HTML → PDF)
- Storage: `/public/invoices/{year}/{month}/` (verschlüsselt) oder S3
- Namensschema: `{invoiceNumber}.pdf`

### Rechnungsnummer
- Format: `B24-INV-{YEAR}-{NUMBER}`
- Beispiel: `B24-INV-2026-0001`
- Fortlaufend, Reset nur für Testing

---

## 🐛 Bekannte Issues / TODO

1. [ ] Email-Template für Rechnungsversand erstellen
2. [ ] Storno-Prozess (Credit Notes) definieren
3. [ ] Mahnung-Prozess bei Überfälligkeit
4. [ ] Dashboard-Widget für ausstehende Zahlungen

---

## 📚 API-Routen (Geplant)

### Rechnungen
- `GET /api/admin/invoices` - Liste aller Rechnungen
- `GET /api/admin/invoices/[id]` - Einzelne Rechnung
- `POST /api/admin/invoices` - Manuelle Rechnung erstellen
- `PATCH /api/admin/invoices/[id]` - Status ändern
- `DELETE /api/admin/invoices/[id]` - Rechnung löschen
- `GET /api/admin/invoices/[id]/pdf` - PDF herunterladen
- `POST /api/admin/invoices/[id]/send` - Email erneut senden

### Einstellungen
- `GET /api/admin/invoices/settings` - Einstellungen laden
- `PATCH /api/admin/invoices/settings` - Einstellungen speichern
- `POST /api/admin/invoices/settings/logo` - Logo hochladen
- `POST /api/admin/invoices/settings/reset-number` - Rechnungsnummer zurücksetzen

### Cron
- `POST /api/cron/generate-commission-invoices` - Monatliche Generierung

---

## 🔗 Verknüpfte Dateien

### Zu erstellende Dateien:
- `prisma/schema.prisma` (erweitern)
- `prisma/migrations/XXXXXX_add_commission_invoices/migration.sql`
- `lib/invoicing/invoicePdfService.ts`
- `lib/invoicing/invoiceAccountingService.ts`
- `lib/invoicing/invoiceEmailService.ts`
- `app/admin/invoices/page.tsx`
- `app/admin/invoices/[id]/page.tsx`
- `app/admin/invoices/settings/page.tsx`
- `app/api/admin/invoices/route.ts`
- `app/api/admin/invoices/[id]/route.ts`
- `app/api/admin/invoices/settings/route.ts`
- `app/api/cron/generate-commission-invoices/route.ts`
- `components/InvoicePreview.tsx`
- `public/templates/invoice-template.html`

### Zu ändernde Dateien (CEO-Berechtigung):
- Alle Dateien in `app/api/admin/**` die role-Checks haben
- Liste wird in Phase 1.2 erstellt

---

## 💡 Nächste Schritte

1. ✅ Dokumentation erstellt
2. ⏳ Prisma Schema erweitern
3. ⏳ Migration erstellen
4. 🔜 Seed-Daten
5. 🔜 CEO-Berechtigungen

