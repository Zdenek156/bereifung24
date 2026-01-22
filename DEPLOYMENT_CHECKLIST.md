# Phase 6: Testing & Deployment Checklist

## ✅ Pre-Deployment Tests

### Unit Tests (Optional - kann nachgeholt werden)

- [ ] `invoiceService.ts` - Rechnungsnummer-Generator
- [ ] `invoiceAccountingService.ts` - Buchungssatz-Erstellung
- [ ] `invoicePdfService.ts` - PDF-Generierung
- [ ] Commission Grouping Logic

### Integration Tests

#### 1. Rechnung manuell erstellen
```bash
# Via Admin-UI oder API
POST /api/admin/invoices
{
  "workshopId": "test-workshop-id",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31",
  "lineItems": [...],
  "commissionIds": [...]
}
```

**Prüfen:**
- [x] Rechnung in DB erstellt
- [x] InvoiceSettings verwendet (Firmendaten)
- [x] Rechnungsnummer fortlaufend (B24-INV-2026-0001)

#### 2. PDF generieren
```bash
POST /api/admin/invoices/{id}/generate-pdf
```

**Prüfen:**
- [x] PDF erstellt in `/public/invoices/2026/01/`
- [x] Logo angezeigt (falls hochgeladen)
- [x] Alle Pflichtangaben vorhanden (§14 UStG)
- [x] MwSt-Berechnung korrekt (19%)
- [x] Tabellen sauber formatiert

#### 3. Buchhaltungseintrag prüfen
```sql
SELECT * FROM accounting_entries 
WHERE source_type = 'COMMISSION_INVOICE' 
AND source_id = 'invoice-id';
```

**Erwarten:**
- [x] SOLL 1400 (Forderungen)
- [x] HABEN 8400 (Erlöse)
- [x] vatRate = 19
- [x] vatAmount korrekt
- [x] Link zu Invoice vorhanden

#### 4. Email-Test
```bash
# Test-Email ohne echten Versand
POST /api/admin/invoices/{id}/send-test-email
{
  "to": "test@example.com"
}
```

**Prüfen:**
- [x] Template korrekt gerendert
- [x] PDF als Anhang
- [x] SEPA vs. Überweisung richtig angezeigt
- [x] Betreff & Body korrekt

#### 5. Cron-Test (Staging)
```bash
# Manueller Trigger
POST /api/admin/invoices/generate-monthly
Authorization: Bearer <admin-token>
```

**Prüfen:**
- [x] Findet PENDING Commissions
- [x] Gruppiert nach Service-Typ
- [x] Erstellt Rechnungen für alle Workshops
- [x] PDFs generiert
- [x] Buchhaltung erstellt
- [x] Emails versendet (Staging-SMTP)
- [x] Provisionen auf BILLED gesetzt
- [x] Fehler-Handling funktioniert (einzelne Workshop-Fehler brechen nicht alles ab)

#### 6. SEPA-Test (Sandbox)
```bash
# GoCardless Sandbox verwenden
GOCARDLESS_ENVIRONMENT=sandbox
```

**Prüfen:**
- [x] Payment erstellt in GoCardless
- [x] Webhook empfangen
- [x] Status-Update in Invoice
- [x] Zahlungsbuchung erstellt bei Success
- [x] Fehler-Email bei Failure

---

## 🚀 Deployment Checklist

### 1. Database Migration

```bash
# SSH to production server
ssh root@167.235.24.110 -i ~/.ssh/bereifung24_hetzner

# Navigate to project
cd /var/www/bereifung24

# Pull latest changes
git pull origin main

# Run migrations
psql -U postgres -d bereifung24 < migration_add_commission_invoicing.sql
psql -U postgres -d bereifung24 < migration_commission_invoice_email_template.sql

# Verify tables created
psql -U postgres -d bereifung24 -c "\dt commission_invoices"
psql -U postgres -d bereifung24 -c "\dt invoice_settings"
```

**Erwartetes Ergebnis:**
```
✅ commission_invoices table created (17 columns)
✅ invoice_settings table created (24 columns)
✅ Default settings row inserted (id='default-settings')
✅ Email template inserted (slug='commission-invoice')
```

### 2. Environment Variables

```bash
# Add to /var/www/bereifung24/.env
nano .env
```

**Hinzufügen:**
```bash
# Cron Secret (generieren: openssl rand -base64 32)
CRON_SECRET=<secure-random-secret>

# GoCardless (Production)
GOCARDLESS_ACCESS_TOKEN=<live-token>
GOCARDLESS_WEBHOOK_SECRET=<webhook-secret>
GOCARDLESS_ENVIRONMENT=live

# SMTP (bereits vorhanden - prüfen)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<app-password>
```

### 3. Install Dependencies

```bash
# Install puppeteer
npm install

# Test puppeteer (headless browser)
node -e "const puppeteer = require('puppeteer'); puppeteer.launch().then(b => { console.log('✅ Puppeteer works'); b.close(); });"
```

**Falls Fehler:**
```bash
# Install Chromium dependencies
apt-get update
apt-get install -y chromium-browser chromium-codecs-ffmpeg
```

### 4. Build & Restart

```bash
# Generate Prisma client
npx prisma generate

# Build Next.js
npm run build

# Restart PM2
pm2 restart bereifung24
pm2 save

# Check status
pm2 status
pm2 logs bereifung24 --lines 50
```

### 5. Verify Deployment

```bash
# Test health endpoint
curl https://bereifung24.de/api/health

# Test invoice settings API
curl https://bereifung24.de/api/admin/invoices/settings \
  -H "Cookie: next-auth.session-token=<token>"
```

### 6. Setup Cron Job

**Option A: PM2 Cron (Empfohlen)**
```bash
# Create ecosystem config
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'bereifung24',
    script: 'npm',
    args: 'start',
    env: { NODE_ENV: 'production', PORT: 3000 }
  }, {
    name: 'invoice-cron',
    script: 'curl',
    args: `-X POST https://bereifung24.de/api/cron/generate-commission-invoices -H "Authorization: Bearer ${process.env.CRON_SECRET}"`,
    cron_restart: '0 9 1 * *', // 1st at 09:00
    autorestart: false
  }]
}
```

```bash
pm2 start ecosystem.config.js
pm2 save
```

**Option B: System Crontab**
```bash
crontab -e

# Add:
0 9 1 * * curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 7. Configure GoCardless Webhook

```bash
# GoCardless Dashboard:
# Settings → Webhooks → Add Endpoint
URL: https://bereifung24.de/api/webhooks/gocardless
Secret: <GOCARDLESS_WEBHOOK_SECRET>
Events: payments.confirmed, payments.failed, payments.cancelled
```

### 8. Populate Invoice Settings

```bash
# Via Admin UI oder API
# Browser: https://bereifung24.de/admin/invoices/settings

# Oder API:
curl -X PUT https://bereifung24.de/api/admin/invoices/settings \
  -H "Cookie: ..." \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Bereifung24 GmbH",
    "companyStreet": "...",
    "companyZip": "...",
    "companyCity": "...",
    "taxId": "DE...",
    "bankName": "...",
    "iban": "DE...",
    "bic": "...",
    "gocardlessCreditorId": "...",
    "email": "buchhaltung@bereifung24.de",
    "phone": "...",
    "website": "www.bereifung24.de",
    "managingDirector": "..."
  }'
```

### 9. Upload Company Logo

```bash
# Via Admin UI:
# https://bereifung24.de/admin/invoices/settings
# Logo hochladen (PNG/JPG/SVG, max 2MB)
```

---

## ✅ Post-Deployment Verification

### Smoke Tests

#### 1. Admin UI erreichbar
- [ ] https://bereifung24.de/admin/invoices lädt
- [ ] Filter funktionieren
- [ ] Statistik-Cards zeigen Daten

#### 2. Settings gespeichert
- [ ] https://bereifung24.de/admin/invoices/settings
- [ ] Firmendaten korrekt
- [ ] Logo wird angezeigt

#### 3. Manuelle Test-Rechnung
- [ ] Test-Workshop mit PENDING Commissions erstellen
- [ ] Manuell "Monatliche Rechnungen generieren" auslösen
- [ ] Prüfen: Rechnung erstellt, PDF vorhanden, Email versendet

#### 4. Buchhaltung prüfen
- [ ] Admin → Buchhaltung → Buchungen
- [ ] Filter: COMMISSION_INVOICE
- [ ] Buchungssatz korrekt (1400/8400/1776)

#### 5. Cron-Log prüfen
```bash
pm2 logs invoice-cron
# Oder
tail -f /var/log/cron.log
```

---

## 📊 Monitoring Setup

### 1. Error Tracking (Optional)

**Sentry Integration:**
```bash
npm install @sentry/nextjs
```

```javascript
// sentry.server.config.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
})
```

### 2. Uptime Monitoring

- [ ] UptimeRobot: https://bereifung24.de/api/health
- [ ] Ping alle 5 Minuten
- [ ] Alert bei Downtime

### 3. Cron Monitoring

- [ ] Cron-Job Success/Failure Tracking
- [ ] Email bei Cron-Fehler
- [ ] Slack-Notification (optional)

### 4. Logs

```bash
# PM2 Logs ansehen
pm2 logs bereifung24 --lines 100

# Nach Fehlern filtern
pm2 logs bereifung24 | grep ERROR

# Invoice-spezifische Logs
pm2 logs bereifung24 | grep "invoice"
```

---

## 🔄 Rollback Plan

Falls Probleme auftreten:

### 1. Code Rollback
```bash
git revert HEAD~6  # Revert last 6 commits (all phases)
npm run build
pm2 restart bereifung24
```

### 2. Database Rollback
```sql
-- Drop tables
DROP TABLE IF EXISTS commission_invoices CASCADE;
DROP TABLE IF EXISTS invoice_settings CASCADE;

-- Remove email template
DELETE FROM email_templates WHERE slug = 'commission-invoice';

-- Remove accounting entries
DELETE FROM accounting_entries WHERE source_type = 'COMMISSION_INVOICE';
```

### 3. Disable Cron
```bash
pm2 stop invoice-cron
# Oder
crontab -e  # Comment out line
```

---

## 📝 Go-Live Checklist

Finale Checks vor erstem produktiven Cron-Run:

- [ ] Migration auf Production erfolgreich
- [ ] Environment Variables gesetzt
- [ ] Puppeteer funktioniert
- [ ] Invoice Settings korrekt (Firmendaten, Logo, Bank)
- [ ] Email Template vorhanden
- [ ] SMTP konfiguriert und getestet
- [ ] GoCardless Webhook konfiguriert
- [ ] Cron-Job eingerichtet und getestet
- [ ] Test-Rechnung manuell erstellt und geprüft
- [ ] Buchhaltungseinträge korrekt
- [ ] PDF-Generierung funktioniert
- [ ] CEO hat ADMIN-Rechte (permissions.ts)
- [ ] Backup der Datenbank erstellt
- [ ] Monitoring aktiv
- [ ] Team informiert

---

## 🎯 Success Criteria

### Erster Cron-Run (Februar 1, 2026)

**Erwartetes Ergebnis:**
- ✅ Alle Workshops mit Januar-Provisionen erhalten Rechnung
- ✅ PDFs in `/public/invoices/2026/01/` gespeichert
- ✅ Emails versendet
- ✅ Buchhaltungseinträge erstellt
- ✅ SEPA-Zahlungen initiiert (falls Mandat)
- ✅ Provisionen von PENDING → BILLED
- ✅ Keine kritischen Fehler im Log

**Nachkontrolle (Februar 2-5, 2026):**
- ✅ Werkstätten haben Emails erhalten
- ✅ SEPA-Zahlungen erfolgreich (GoCardless Dashboard)
- ✅ Keine Beschwerden von Werkstätten
- ✅ Buchhaltung stimmt

---

## 🚨 Troubleshooting

### Problem: Cron läuft nicht
```bash
pm2 logs invoice-cron
pm2 restart invoice-cron
```

### Problem: PDF-Generierung fehlschlägt
```bash
# Chromium installieren
apt-get install chromium-browser
```

### Problem: Email nicht versendet
```bash
# SMTP-Settings prüfen
SELECT * FROM email_settings;

# Test-Email senden
node test-email.js
```

### Problem: SEPA fehlgeschlagen
- GoCardless Dashboard prüfen
- Mandate-Status prüfen
- Webhook-Events ansehen
- Fallback auf Überweisung ist automatisch

---

**Status:** Bereit für Deployment ✅
**Geschätzte Deployment-Zeit:** 30-45 Minuten
**Risiko:** Niedrig (alle Services isoliert, Rollback möglich)
