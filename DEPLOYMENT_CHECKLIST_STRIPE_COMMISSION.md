# Stripe Connect 6,9% Provision - Deployment Checklist

## ✅ Implementierte Änderungen

### 1. Payment Session API
**Datei:** `app/api/customer/direct-booking/create-stripe-session/route.ts`

**Änderungen:**
- ✅ Application Fee Berechnung (6,9% vom Gesamtbetrag)
- ✅ Logging für Payment Breakdown
- ✅ `application_fee_amount` in allen Payment Methods (card, klarna, customer_balance, **paypal**)
- ✅ PayPal über Stripe integriert (seit 17.02.2026)

```typescript
const PLATFORM_COMMISSION_RATE = 0.069 // 6,9%
const applicationFeeAmount = Math.round(totalPrice * 100 * PLATFORM_COMMISSION_RATE)

sessionConfig.payment_intent_data = {
  application_fee_amount: applicationFeeAmount,
  on_behalf_of: workshop.stripeAccountId, // nur bei Karte
  transfer_data: {
    destination: workshop.stripeAccountId
  }
}
```

**Unterstützte Payment Methods:**
- ✅ Kreditkarte (card)
- ✅ Klarna
- ✅ SEPA-Überweisung (customer_balance)
- ✅ **PayPal (NEU!)** - läuft jetzt über Stripe statt separate API

---

### 2. Webhook Handler
**Datei:** `app/api/webhooks/stripe/route.ts`

**Änderungen:**
- ✅ Commission Tracking bei `checkout.session.completed`
- ✅ Berechnung: platformCommission, workshopPayout, stripeFeesEstimate, platformNetCommission
- ✅ Speicherung in DirectBooking-Tabelle

```typescript
const PLATFORM_COMMISSION_RATE = 0.069
const platformCommission = totalPrice * PLATFORM_COMMISSION_RATE // 6,90€
const workshopPayout = totalPrice * (1 - PLATFORM_COMMISSION_RATE) // 93,10€
const stripeFeesEstimate = (totalPrice * 0.015) + 0.25 // ~1,75€
const platformNetCommission = platformCommission - stripeFeesEstimate // 5,15€
```

---

### 3. Prisma Schema
**Datei:** `prisma/schema.prisma`

**Änderungen:**
- ✅ Neue Spalten in `DirectBooking` Model:
  - `platformCommission` (Decimal)
  - `platformCommissionCents` (Int)
  - `workshopPayout` (Decimal)
  - `stripeFeesEstimate` (Decimal)
  - `platformNetCommission` (Decimal)

---

### 4. SQL Migration
**Datei:** `add-commission-tracking.sql`

**Inhalt:**
```sql
ALTER TABLE direct_bookings
ADD COLUMN platform_commission DECIMAL(10, 2) NULL,
ADD COLUMN platform_commission_cents INT NULL,
ADD COLUMN workshop_payout DECIMAL(10, 2) NULL,
ADD COLUMN stripe_fees_estimate DECIMAL(10, 2) NULL,
ADD COLUMN platform_net_commission DECIMAL(10, 2) NULL;

CREATE INDEX idx_direct_bookings_platform_commission 
ON direct_bookings(platform_commission, payment_status);
```

---

### 5. UI Anpassungen
**Datei:** `app/dashboard/workshop/settings/page.tsx`

**Änderungen:**
- ✅ Info-Text bei verbundenem Stripe Account: "93,1% nach 6,9% Provision"
- ✅ Hinweis beim Onboarding: "Sie erhalten 93,1% jeder Zahlung"
- ✅ Transparenz-Info: "Stripe-Gebühren werden von Provision abgezogen"

---

### 6. Dokumentation
**Datei:** `STRIPE_CONNECT_COMMISSION.md`

**Inhalt:**
- ✅ Komplette Erklärung des Payment Flows
- ✅ Beispielrechnung (100€ → 93,10€ Werkstatt, 5,15€ Plattform netto)
- ✅ Technische Implementierung
- ✅ API-Endpunkte
- ✅ Troubleshooting
- ✅ Testing-Szenarien

---

## 🚀 Deployment-Schritte

### 1. Datenbank-Migration ausführen
```bash
# Development
npx prisma migrate dev --name add_commission_tracking

# Oder direkt SQL ausführen:
mysql -u root -p bereifung24 < add-commission-tracking.sql
```

### 2. Prisma Client neu generieren
```bash
npx prisma generate
```

### 3. Code auf Server deployen
```bash
# Option A: VS Code Task "🚀 Deploy: Full (Clean Build + Restart)"
# Option B: Manuell
git add .
git commit -m "feat: Stripe Connect 6.9% commission with Application Fees"
git push

# Auf Server:
cd /var/www/bereifung24
git pull
rm -rf .next
npm run build
pm2 restart bereifung24
```

### 4. Stripe Webhook konfigurieren (falls noch nicht)
```
URL: https://bereifung24.de/api/webhooks/stripe
Events:
  - checkout.session.completed ✅
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded
  - account.updated ✅
```

### 5. Test-Transaktion durchführen
```bash
# 1. Werkstatt-Account einloggen
# 2. Settings → Stripe verbinden (wenn noch nicht)
# 3. Onboarding abschließen

# 4. Kunde-Account einloggen
# 5. Termin buchen (z.B. 100€)
# 6. Zahlung mit Testkarte: 4242 4242 4242 4242

# 7. Datenbank prüfen:
SELECT 
  id,
  total_price,
  platform_commission,
  workshop_payout,
  stripe_fees_estimate,
  platform_net_commission,
  payment_status
FROM direct_bookings
WHERE payment_status = 'PAID'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📊 Erwartete Ergebnisse

### Beispiel: Buchung über 150€

**Kundenzahlung:** 150,00€

**Stripe Application Fee:**
- 6,9% von 150€ = **10,35€**

**Werkstatt erhält:**
- 150€ - 10,35€ = **139,65€**

**Stripe-Gebühren (geschätzt):**
- 1,5% von 150€ = 2,25€
- Fixe Gebühr = 0,25€
- **Total: 2,50€**

**Plattform erhält (netto):**
- 10,35€ - 2,50€ = **7,85€**

**Datenbank-Eintrag:**
```json
{
  "totalPrice": 150.00,
  "platformCommission": 10.35,
  "platformCommissionCents": 1035,
  "workshopPayout": 139.65,
  "stripeFeesEstimate": 2.50,
  "platformNetCommission": 7.85,
  "paymentStatus": "PAID"
}
```

---

## ⚠️ Wichtige Hinweise

### 1. Stripe Connect Requirements
- ✅ Workshop muss Stripe Express Account haben
- ✅ Account muss verifiziert sein (`charges_enabled = true`)
- ✅ `stripeEnabled = true` in Datenbank

### 2. Application Fee Limits
- **Minimum:** 0,50€ (50 cents)
- **Maximum:** Bis zu 100% des Betrags (theoretisch)
- **Unsere Provision:** 6,9% (im normalen Rahmen)

### 3. Stripe-Gebühren
Die Gebühren variieren je nach Zahlungsmethode:
- **Kartenzahlung:** 1,5% + 0,25€
- **Klarna:** ~1,8% + 0,25€
- **SEPA-Überweisung:** 0,35€ (pauschal)

**Wichtig:** Gebühren werden IMMER von der Application Fee abgezogen, nie vom Workshop-Betrag!

### 4. Payout-Timing
- **Workshop:** Erhält Geld nach 2-7 Tagen (abhängig von Stripe-Einstellungen)
- **Plattform:** Erhält Application Fee nach 2-7 Tagen
- **Unterschied:** Keine! Beide erhalten zur gleichen Zeit

---

## 🛠️ Troubleshooting

### Problem: Workshop erhält 100% statt 93,1%
**Lösung:** Prüfe ob `application_fee_amount` im PaymentIntent gesetzt ist:
```typescript
const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)
console.log(paymentIntent.application_fee_amount) // sollte > 0 sein
```

### Problem: Commission-Felder bleiben NULL
**Lösung:** Datenbank-Migration nicht ausgeführt:
```bash
npx prisma migrate deploy
# oder SQL manuell ausführen
```

### Problem: Webhook nicht gefeuert
**Lösung:** Prüfe Webhook-Signatur in Stripe Dashboard:
```
Webhooks → Endpoint Details → Recent Events
```

---

## 📈 Monitoring & Reporting

### Commission-Report erstellen
```sql
-- Monatliche Übersicht
SELECT 
  DATE_FORMAT(created_at, '%Y-%m') AS month,
  COUNT(*) AS bookings,
  SUM(total_price) AS total_revenue,
  SUM(platform_commission) AS total_commission,
  SUM(platform_net_commission) AS net_commission,
  SUM(workshop_payout) AS total_workshop_payout
FROM direct_bookings
WHERE payment_status = 'PAID'
GROUP BY month
ORDER BY month DESC;
```

### Top-Werkstätten nach Umsatz
```sql
SELECT 
  w.company_name,
  COUNT(db.id) AS bookings,
  SUM(db.total_price) AS revenue,
  SUM(db.platform_net_commission) AS our_commission,
  SUM(db.workshop_payout) AS workshop_earned
FROM direct_bookings db
JOIN workshops w ON db.workshop_id = w.id
WHERE db.payment_status = 'PAID'
GROUP BY w.id
ORDER BY revenue DESC
LIMIT 10;
```

---

## ✅ Post-Deployment Checklist

- [ ] Datenbank-Migration erfolgreich
- [ ] Prisma Client neu generiert
- [ ] Code deployed und Server neu gestartet
- [ ] Stripe Webhook konfiguriert
- [ ] **PayPal als Payment Method aktiviert** (Stripe Dashboard → Payment Methods)
- [ ] Test-Buchung durchgeführt (Development)
- [ ] Test-Buchung durchgeführt (Production)
- [ ] **PayPal-Test durchgeführt** (über Stripe, nicht direkt!)
- [ ] Commission-Berechnung in DB korrekt
- [ ] Workshop erhält 93,1% des Betrags
- [ ] Logging funktioniert (siehe PM2 Logs)
- [ ] Settings-UI zeigt Provision-Info an
- [ ] Dokumentation gelesen und verstanden

---

**Status:** ✅ Ready for Deployment  
**Datum:** 17.02.2026  
**Geschätzte Deployment-Zeit:** 10-15 Minuten  
**Risiko:** 🟡 Medium (Payment Logic Änderung)

**Backup-Plan:**
Falls Probleme auftreten, revert zu vorherigem Git-Commit:
```bash
git log --oneline | head -5
git revert <commit-hash>
pm2 restart bereifung24
```
