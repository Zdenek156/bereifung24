# Invoice System - Quick Start Guide

## 🚀 Phase 6: Deployment (READY TO GO!)

Alle Code-Changes sind fertig und committed (7c3eabf). Jetzt folgt nur noch Deployment & Testing.

---

## ⚡ Quick Start (5 Minuten)

### 1. Lokaler Test (Optional)
```bash
# Quick test (keine DB nötig)
node scripts/quick-test.js
```

### 2. Production Deployment
```bash
# Deploy alles auf einmal (Dauer: ~5 Minuten)
./scripts/deploy-invoice-system.sh
```

**Was das Script macht:**
- ✅ SSH-Verbindung prüfen
- ✅ Latest Code pullen
- ✅ Datenbank-Migrationen ausführen
- ✅ Dependencies installieren (puppeteer + Chromium)
- ✅ Prisma generieren + Build
- ✅ Invoice-Verzeichnisse erstellen
- ✅ PM2 neu starten

### 3. Invoice Settings konfigurieren
```bash
# Browser öffnen:
https://bereifung24.de/admin/invoices/settings

# Eintragen:
- Firmenname: Bereifung24 GmbH
- Adresse, Steuernummer, IBAN, etc.
- Logo hochladen (max 2MB)
```

### 4. Cron Job einrichten
```bash
# Interaktives Setup
./scripts/setup-cron-job.sh

# Wähle Option 1 (PM2) - empfohlen
```

### 5. Test-Rechnung erstellen
```bash
# Via Admin UI:
https://bereifung24.de/admin/invoices
→ "Monatliche Rechnungen generieren"

# Oder via API:
curl -X POST https://bereifung24.de/api/admin/invoices/generate-monthly \
  -H "Cookie: next-auth.session-token=<your-token>"
```

---

## 📋 Detailed Steps

### Step 1: Local Testing (Optional)

```bash
# Prüfe alle Komponenten
node scripts/quick-test.js

# Vollständiger Test (mit DB)
./scripts/test-invoice-system.sh

# Mit Admin-Token für API-Tests:
export ADMIN_TOKEN="<your-token>"
./scripts/test-invoice-system.sh
```

### Step 2: Production Deployment

#### Option A: Automatisches Deployment (Empfohlen)
```bash
./scripts/deploy-invoice-system.sh
```

#### Option B: Manuelles Deployment
```bash
# SSH to server
ssh root@167.235.24.110 -i ~/.ssh/bereifung24_hetzner

cd /var/www/bereifung24
git pull origin main

# Run migrations
psql -U postgres -d bereifung24 < migration_add_commission_invoicing.sql
psql -U postgres -d bereifung24 < migration_commission_invoice_email_template.sql

# Install & build
npm install
npx prisma generate
npm run build

# Create directories
mkdir -p public/invoices/2026/01
chmod -R 755 public/invoices

# Restart
pm2 restart bereifung24
pm2 logs bereifung24 --lines 20
```

### Step 3: Environment Variables

```bash
# SSH to server
ssh root@167.235.24.110 -i ~/.ssh/bereifung24_hetzner

# Edit .env
nano /var/www/bereifung24/.env

# Add (if missing):
CRON_SECRET=$(openssl rand -base64 32)
GOCARDLESS_ENVIRONMENT=live
GOCARDLESS_ACCESS_TOKEN=<live-token>
GOCARDLESS_WEBHOOK_SECRET=<webhook-secret>

# Save and restart
pm2 restart bereifung24
```

### Step 4: Invoice Settings Setup

**Via Browser:**
1. Login: https://bereifung24.de/admin
2. Navigate: Rechnungen → Einstellungen
3. Fill in all fields:
   - **Firmenname:** Bereifung24 GmbH
   - **Adresse:** [Your address]
   - **USt-IdNr:** [Your VAT ID]
   - **Steuernummer:** [Your tax number]
   - **Registergericht:** [e.g., Amtsgericht München]
   - **Registernummer:** [HRB number]
   - **Geschäftsführung:** [CEO name]
   - **Email:** buchhaltung@bereifung24.de
   - **Telefon:** [Phone]
   - **Website:** www.bereifung24.de
   - **Bank:** [Bank name]
   - **IBAN:** [Your IBAN]
   - **BIC:** [Your BIC]
   - **GoCardless Gläubiger-ID:** [From GoCardless dashboard]
4. Upload logo (PNG/JPG, max 2MB)
5. Save

**Via API:**
```bash
curl -X PUT https://bereifung24.de/api/admin/invoices/settings \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Bereifung24 GmbH",
    "companyStreet": "...",
    "companyZip": "...",
    "companyCity": "...",
    "companyCountry": "Deutschland",
    "taxId": "DE...",
    "taxNumber": "...",
    "registerCourt": "Amtsgericht München",
    "registerNumber": "HRB ...",
    "managingDirector": "...",
    "email": "buchhaltung@bereifung24.de",
    "phone": "...",
    "website": "www.bereifung24.de",
    "bankName": "...",
    "iban": "DE...",
    "bic": "...",
    "gocardlessCreditorId": "..."
  }'
```

### Step 5: Cron Job Setup

```bash
./scripts/setup-cron-job.sh
```

**Options:**
1. **PM2 (Empfohlen)** - Für PM2-gemanagte Apps
2. **System Crontab** - Klassische Unix cron
3. **GitHub Actions** - Für Vercel/Cloud hosting
4. **Manual** - Zeigt nur Commands

**Nach Setup:**
```bash
# Test manual trigger
curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices \
  -H "Authorization: Bearer <CRON_SECRET>"

# View cron logs (PM2)
pm2 logs invoice-cron

# View cron logs (System)
tail -f /var/log/invoice-cron.log
```

### Step 6: GoCardless Webhook

1. Login: https://manage.gocardless.com
2. Navigate: Settings → Webhooks
3. Add Endpoint:
   - **URL:** https://bereifung24.de/api/webhooks/gocardless
   - **Secret:** (from .env: GOCARDLESS_WEBHOOK_SECRET)
   - **Events:** 
     - payments.confirmed
     - payments.failed
     - payments.cancelled
4. Save

### Step 7: Test Invoice Generation

#### Via Admin UI:
1. Browser: https://bereifung24.de/admin/invoices
2. Click: "Monatliche Rechnungen generieren"
3. Wait for completion message
4. Verify: Invoices listed in table

#### Via API:
```bash
# Get session token from browser console:
# document.cookie

# Manual trigger
curl -X POST https://bereifung24.de/api/admin/invoices/generate-monthly \
  -H "Cookie: next-auth.session-token=<your-token>" \
  -H "Content-Type: application/json"
```

#### Verify Results:
```bash
# Check database
ssh root@167.235.24.110 'psql -U postgres -d bereifung24 -c "SELECT * FROM commission_invoices;"'

# Check PDFs
ssh root@167.235.24.110 'ls -lah /var/www/bereifung24/public/invoices/2026/01/'

# Check accounting
ssh root@167.235.24.110 'psql -U postgres -d bereifung24 -c "SELECT * FROM accounting_entries WHERE source_type='\''COMMISSION_INVOICE'\'';"'
```

---

## 🧪 Testing Checklist

### Pre-Production Tests

- [ ] **Database Migration**
  ```bash
  psql -U postgres -d bereifung24 -c "\dt commission*"
  ```

- [ ] **Puppeteer Installation**
  ```bash
  ssh root@167.235.24.110 'node -e "require('\''puppeteer'\'')"'
  ```

- [ ] **Invoice Settings**
  ```bash
  curl https://bereifung24.de/api/admin/invoices/settings
  ```

- [ ] **PDF Generation**
  ```bash
  # Via admin UI: Generate test invoice
  # Verify: PDF exists in /public/invoices/
  ```

- [ ] **Email Template**
  ```bash
  psql -U postgres -d bereifung24 -c "SELECT * FROM email_templates WHERE slug='commission-invoice';"
  ```

- [ ] **Accounting Entry**
  ```bash
  # After test invoice
  psql -U postgres -d bereifung24 -c "SELECT * FROM accounting_entries WHERE source_type='COMMISSION_INVOICE';"
  ```

### Production Smoke Tests

- [ ] Admin UI loads: https://bereifung24.de/admin/invoices
- [ ] Settings page works: https://bereifung24.de/admin/invoices/settings
- [ ] Filter funktionieren
- [ ] Statistics displayed correctly
- [ ] Manual trigger works
- [ ] PDF preview works
- [ ] Email sent successfully
- [ ] SEPA payment initiated (if mandate exists)
- [ ] Commissions marked as BILLED

---

## 📊 Monitoring

### Logs

```bash
# PM2 logs
pm2 logs bereifung24
pm2 logs invoice-cron

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System cron logs
tail -f /var/log/cron.log
tail -f /var/log/invoice-cron.log
```

### Health Checks

```bash
# Server status
curl https://bereifung24.de/api/health

# Invoice settings
curl https://bereifung24.de/api/admin/invoices/settings

# Database connection
ssh root@167.235.24.110 'psql -U postgres -d bereifung24 -c "SELECT 1"'

# PM2 status
ssh root@167.235.24.110 'pm2 status'
```

### Cron Monitoring

```bash
# Check last run
pm2 logs invoice-cron --lines 50

# Check next scheduled run
pm2 describe invoice-cron | grep "cron_restart"

# Manual test
curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices \
  -H "Authorization: Bearer <CRON_SECRET>"
```

---

## 🔄 Monthly Workflow (Automatic)

**1. Februar 2026, 09:00 Uhr:**
- Cron job startet automatisch
- Findet alle Workshops mit Januar-Provisionen (PENDING)
- Gruppiert nach Service-Typ (Reifen, Räder, etc.)
- Erstellt Rechnungen für jeden Workshop
- Generiert PDFs
- Erstellt Buchhaltungseinträge (1400/8400/1776)
- Sendet Emails mit PDF-Anhang
- Initiiert SEPA-Zahlungen (GoCardless)
- Fallback: Bank-Transfer Email falls kein SEPA-Mandat
- Markiert Provisionen als BILLED

**2-5. Februar 2026:**
- SEPA-Zahlungen werden eingezogen
- Webhooks empfangen (payments.confirmed)
- Zahlungsbuchungen erstellt (1200/1400)
- Rechnungen als PAID markiert

**Monitoring:**
```bash
# Check results
pm2 logs invoice-cron --lines 100

# Check invoices created
psql -U postgres -d bereifung24 -c "SELECT COUNT(*) FROM commission_invoices WHERE period_start = '2026-01-01';"

# Check emails sent
# Prüfe Posteingang von Werkstätten

# Check SEPA payments
# GoCardless Dashboard
```

---

## 🚨 Troubleshooting

### Problem: Migration fehlgeschlagen

```bash
# Rollback
psql -U postgres -d bereifung24 << EOF
DROP TABLE IF EXISTS commission_invoices CASCADE;
DROP TABLE IF EXISTS invoice_settings CASCADE;
DELETE FROM email_templates WHERE slug = 'commission-invoice';
EOF

# Re-run
psql -U postgres -d bereifung24 < migration_add_commission_invoicing.sql
psql -U postgres -d bereifung24 < migration_commission_invoice_email_template.sql
```

### Problem: Puppeteer läuft nicht

```bash
ssh root@167.235.24.110

# Install Chromium dependencies
apt-get update
apt-get install -y chromium-browser chromium-codecs-ffmpeg

# Test
node -e "const puppeteer = require('puppeteer'); puppeteer.launch().then(b => { console.log('OK'); b.close(); });"
```

### Problem: PDF nicht generiert

```bash
# Check directory permissions
ls -la /var/www/bereifung24/public/invoices/
chmod -R 755 /var/www/bereifung24/public/invoices/

# Check logs
pm2 logs bereifung24 | grep PDF
pm2 logs bereifung24 | grep puppeteer
```

### Problem: Email nicht versendet

```bash
# Check SMTP settings
psql -U postgres -d bereifung24 -c "SELECT * FROM email_settings;"

# Test SMTP connection
nc -zv smtp.gmail.com 587

# Check .env
grep SMTP /var/www/bereifung24/.env
```

### Problem: Cron läuft nicht

```bash
# PM2 method
pm2 logs invoice-cron
pm2 restart invoice-cron
pm2 describe invoice-cron

# System crontab
crontab -l | grep invoice
tail -f /var/log/invoice-cron.log

# Manual trigger
curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -v
```

### Problem: SEPA fehlgeschlagen

```bash
# Check GoCardless settings
grep GOCARDLESS /var/www/bereifung24/.env

# Check webhook
curl -X POST https://bereifung24.de/api/webhooks/gocardless \
  -H "Webhook-Signature: test" \
  -d '{"events":[]}'

# Check mandate
# GoCardless Dashboard → Mandates
```

---

## ✅ Go-Live Checklist

- [ ] Code deployed (git commit 7c3eabf)
- [ ] Database migrations executed
- [ ] Puppeteer + Chromium installed
- [ ] Invoice settings configured (company data)
- [ ] Company logo uploaded
- [ ] Environment variables set (CRON_SECRET, GOCARDLESS_*)
- [ ] Email template created
- [ ] Cron job configured (PM2 or crontab)
- [ ] GoCardless webhook configured
- [ ] Test invoice generated successfully
- [ ] PDF generated and downloadable
- [ ] Email sent and received
- [ ] Accounting entry created correctly
- [ ] SEPA payment tested (sandbox)
- [ ] Monitoring setup (logs, alerts)
- [ ] Rollback plan documented
- [ ] Team notified

---

## 📞 Support

**Logs:** `pm2 logs bereifung24` oder `pm2 logs invoice-cron`  
**Status:** `pm2 status`  
**Restart:** `pm2 restart bereifung24`  
**Docs:** See DEPLOYMENT_CHECKLIST.md

---

**🎯 Ready for Production!**

Alle Code-Changes sind committed. Nur noch Deployment & Konfiguration nötig.  
Geschätzte Zeit: **30-45 Minuten**
