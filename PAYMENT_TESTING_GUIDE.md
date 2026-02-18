# 💳 Zahlungssystem Test-Guide - Bereifung24

**Datum:** 18. Februar 2026  
**Ziel:** Systematisches Testen aller Zahlungsszenarien nach Payment-System-Cleanup

---

## 📋 Test-Übersicht

### ✅ Zu testende Szenarien

1. **Erfolgreiche Zahlung** (payment successful)
   - Kreditkarte (Visa, Mastercard, Amex)
   - Apple Pay / Google Pay
   - Klarna
   - PayPal
   - Banküberweisung (customer_balance)

2. **Abgelehnte Zahlung** (payment failed)
   - Kreditkarte abgelehnt
   - Unzureichende Deckung
   - Bank lehnt ab

3. **Abgebrochene Zahlung** (payment cancelled)
   - Kunde schließt Stripe Checkout
   - Kunde klickt "Zurück"

4. **Erstattung** (refund)
   - Volle Erstattung
   - Teilerstattung
   - Status-Updates

5. **Timeout** (session expired)
   - Stripe Session läuft ab (30 min)
   - Buchung automatisch cancelled

---

## 🧪 Test-Umgebung

### Stripe Test-Modus aktivieren

**Option 1: Stripe Test-Keys in Admin Panel**
1. Gehe zu: https://bereifung24.de/admin/api-settings
2. Aktiviere Testmodus
3. Füge Test-Keys ein:
   - `STRIPE_SECRET_KEY`: `sk_test_...`
   - `STRIPE_PUBLISHABLE_KEY`: `pk_test_...`

**Option 2: Direkt in Stripe Dashboard**
- Test-Modus Toggle oben rechts: "Test data"

### Stripe Test-Kreditkarten

| Szenario | Kartennummer | CVC | Datum | PLZ |
|----------|--------------|-----|-------|-----|
| ✅ **Erfolg** | `4242 4242 4242 4242` | 123 | 12/34 | 12345 |
| ❌ **Abgelehnt (Generic)** | `4000 0000 0000 0002` | 123 | 12/34 | 12345 |
| ❌ **Insufficient Funds** | `4000 0000 0000 9995` | 123 | 12/34 | 12345 |
| ❌ **Lost Card** | `4000 0000 0000 9987` | 123 | 12/34 | 12345 |
| ❌ **Expired Card** | `4000 0000 0000 0069` | 123 | 12/34 | 12345 |
| 🔐 **3D Secure** | `4000 0025 0000 3155` | 123 | 12/34 | 12345 |
| 🇩🇪 **SEPA Debit** | `4000 0082 6000 0000` | 123 | 12/34 | 12345 |

**Hinweis:** Für alle Test-Karten:
- **CVC:** Beliebige 3 Ziffern (z.B. 123)
- **Ablaufdatum:** Beliebiges zukünftiges Datum (z.B. 12/34)
- **PLZ:** Beliebige 5 Ziffern (z.B. 12345)

### Test-Workshop

**Empfehlung:** Erstelle/Verwende einen Test-Workshop
- Name: "Test-Werkstatt GmbH"
- Stripe Account verbunden
- Test-Preise konfiguriert

---

## 🔍 Test-Ablauf

### Pre-Test Checklist
- [ ] Stripe Test-Modus aktiviert
- [ ] Test-Workshop existiert und ist online
- [ ] Test-Customer Account vorhanden
- [ ] Browser DevTools geöffnet (Console + Network Tab)
- [ ] PM2 Logs im Terminal laufen: `ssh ... "pm2 logs bereifung24 --lines 50"`

---

## 1️⃣ Test: Erfolgreiche Zahlung

### 1.1 Kreditkarte (Card Payment)

**Test-Schritte:**
1. Als Customer einloggen
2. Werkstatt suchen → Test-Werkstatt auswählen
3. Service wählen: Räderwechsel (oder Reifenmontage)
4. Fahrzeug auswählen
5. Termin auswählen
6. Zur Zahlung gehen
7. **Zahlungsart:** Kreditkarte
8. Stripe Checkout öffnet sich
9. Test-Karte eingeben: `4242 4242 4242 4242`
10. "Zahlen" klicken

**Erwartetes Verhalten:**
- ✅ Redirect zu: `/dashboard/customer/direct-booking/success?session_id=...`
- ✅ Buchung erscheint in "Meine Termine"
- ✅ Status: `CONFIRMED`
- ✅ Payment Status: `PAID`
- ✅ Email-Bestätigung an Kunde
- ✅ Email-Benachrichtigung an Werkstatt

**Logs prüfen:**
```bash
# Production Server
ssh root@167.235.24.110 "pm2 logs bereifung24 --lines 100 --nostream | grep -E 'Checkout completed|Payment breakdown|DirectBooking'"
```

**Erwartete Log-Ausgaben:**
```
📬 Stripe Webhook received: checkout.session.completed
✅ Checkout completed: cs_test_...
💰 Payment breakdown:
  total: 100.00€
  platformCommission: 6.90€
  workshopPayout: 93.10€
  stripeFeesEstimate: 1.75€
  platformNetCommission: 5.15€
✅ DirectBooking created: cml...
```

**Database prüfen:**
```javascript
// Mit Prisma Studio oder direkt in DB
await prisma.directBooking.findUnique({
  where: { id: 'booking_id' },
  select: {
    status: true,
    paymentStatus: true,
    stripeSessionId: true,
    stripePaymentId: true,
    paidAt: true,
    platformCommission: true,
    workshopPayout: true
  }
})

// Erwartetes Ergebnis:
{
  status: 'CONFIRMED',
  paymentStatus: 'PAID',
  stripeSessionId: 'cs_test_...',
  stripePaymentId: 'pi_...',
  paidAt: Date,
  platformCommission: 6.90,
  workshopPayout: 93.10
}
```

---

### 1.2 Apple Pay / Google Pay

**Test-Schritte:**
1. Gleicher Flow wie 1.1
2. **Zahlungsart:** Kreditkarte (enthält automatisch Apple/Google Pay)
3. Im Stripe Checkout erscheint Apple Pay / Google Pay Button
4. Klick auf Wallet-Button
5. Zahlung bestätigen

**Hinweis:** 
- Apple Pay nur auf Safari/iOS mit verifizierten Domains
- Google Pay auf Chrome/Android

**Erwartetes Verhalten:**
- Identisch zu 1.1 Kreditkarte
- Webhook `checkout.session.completed` wird gefeuert
- Payment Method in Stripe: `link` oder `apple_pay`/`google_pay`

---

### 1.3 Klarna

**Test-Schritte:**
1. Gleicher Flow wie 1.1
2. **Zahlungsart:** Klarna
3. Im Stripe Checkout: Klarna auswählen
4. Klarna Test-Credentials eingeben

**Klarna Test-Daten:**
- Email: `test@example.com`
- Postleitzahl: `12345` (beliebig)

**Erwartetes Verhalten:**
- Zahlung wird sofort genehmigt (im Test-Modus)
- Webhook `checkout.session.completed`
- Status: `PAID`, `CONFIRMED`

---

### 1.4 PayPal

**Test-Schritte:**
1. Gleicher Flow wie 1.1
2. **Zahlungsart:** PayPal
3. Redirect zu PayPal Sandbox
4. Login mit PayPal Sandbox Account
5. Zahlung bestätigen

**PayPal Test-Account:**
- Email: `sb-buyer@paypal.com` (oder erstelle Sandbox Account)
- Passwort: (aus PayPal Developer Dashboard)

**Erwartetes Verhalten:**
- Redirect zurück zu bereifung24.de
- Webhook `checkout.session.completed`
- Payment Method: `paypal`

---

### 1.5 Banküberweisung (customer_balance)

**Test-Schritte:**
1. Gleicher Flow wie 1.1
2. **Zahlungsart:** Banküberweisung / Vorkasse
3. Stripe Checkout zeigt Bankverbindung
4. Kunde "bestätigt" (im Test-Modus sofort erfolgreich)

**Erwartetes Verhalten:**
- Status initial: `PENDING` (wartet auf Zahlungseingang)
- Nach Stripe Bestätigung: `PAID`, `CONFIRMED`
- Email mit Zahlungshinweisen

---

## 2️⃣ Test: Abgelehnte Zahlung

### 2.1 Kreditkarte abgelehnt (Generic Decline)

**Test-Schritte:**
1. Gleicher Flow wie Test 1.1
2. Test-Karte eingeben: `4000 0000 0000 0002`
3. "Zahlen" klicken

**Erwartetes Verhalten:**
- ❌ Stripe zeigt Fehler: "Your card was declined"
- ❌ Kunde bleibt im Stripe Checkout
- ❌ Buchung wird NICHT erstellt
- ℹ️ Kunde kann neue Karte eingeben oder abbrechen

**Logs prüfen:**
```bash
ssh root@167.235.24.110 "pm2 logs bereifung24 --lines 100 --nostream | grep -E 'payment_intent.payment_failed'"
```

**Falls Payment Intent erstellt wurde:**
- Webhook: `payment_intent.payment_failed`
- Buchung Status: `CANCELLED`
- Payment Status: `FAILED`

---

### 2.2 Insufficient Funds (Unzureichende Deckung)

**Test-Schritte:**
1. Test-Karte: `4000 0000 0000 9995`
2. Rest wie 2.1

**Erwartetes Verhalten:**
- Stripe Fehler: "Your card has insufficient funds"
- Buchung wird nicht erstellt oder auf `FAILED` gesetzt

---

### 2.3 Lost/Stolen Card

**Test-Schritte:**
1. Test-Karte: `4000 0000 0000 9987`
2. Rest wie 2.1

**Erwartetes Verhalten:**
- Stripe Fehler: "Your card was declined"
- Buchung `CANCELLED` falls bereits erstellt

---

## 3️⃣ Test: Abgebrochene Zahlung

### 3.1 Kunde bricht Stripe Checkout ab

**Test-Schritte:**
1. Gleicher Flow bis Stripe Checkout
2. **NICHT** bezahlen
3. Klick auf "← Zurück" oder "X" (oben links im Checkout)

**Erwartetes Verhalten:**
- ✅ Redirect zu: `cancel_url` (z.B. `/dashboard/customer/direct-booking/checkout?cancelled=true`)
- ℹ️ Meldung: "Zahlung wurde abgebrochen"
- ❌ Buchung wird NICHT erstellt
- ⏱️ Stripe Session läuft ab nach 30 Minuten

**Logs prüfen:**
```bash
# Keine Webhooks sollten ankommen (Session nicht completed)
ssh root@167.235.24.110 "pm2 logs bereifung24 --err --lines 50 --nostream"
```

---

### 3.2 Session Timeout (30 Minuten)

**Test-Schritte:**
1. Stripe Checkout öffnen
2. **NICHT** bezahlen
3. Warte 30+ Minuten
4. Versuche Zahlung

**Erwartetes Verhalten:**
- Stripe zeigt: "This checkout session has expired"
- Buchung bleibt `PENDING` oder wird durch Cron-Job auf `EXPIRED` gesetzt

**Implementierungs-Hinweis:**
```typescript
// Empfehlung: Cron-Job für abgelaufene Sessions
// Prüfe alle PENDING Bookings älter als 30 Minuten
// Setze Status auf EXPIRED falls keine Zahlung
```

---

## 4️⃣ Test: Erstattung (Refund)

### 4.1 Volle Erstattung (Full Refund)

**Voraussetzung:**
- Erfolgreiche Buchung aus Test 1.1 (Status: `PAID`, `CONFIRMED`)

**Test-Schritte:**
1. Login Stripe Dashboard: https://dashboard.stripe.com/test/payments
2. Suche Payment Intent der Testbuchung
3. Klick auf "Refund payment"
4. Betrag: **Voll** (100% Erstattung)
5. Klick "Refund"

**Erwartetes Verhalten:**
- ✅ Stripe sendet Webhook: `charge.refunded`
- ✅ Buchung Status: `CANCELLED`
- ✅ Payment Status: `REFUNDED`
- 📧 Email an Kunde: "Ihre Buchung wurde storniert"
- 📧 Email an Werkstatt: "Buchung wurde storniert"

**Logs prüfen:**
```bash
ssh root@167.235.24.110 "pm2 logs bereifung24 --lines 100 --nostream | grep -E 'charge.refunded|Booking refunded'"
```

**Erwartete Log-Ausgaben:**
```
📬 Stripe Webhook received: charge.refunded
💰 Charge refunded: ch_...
✅ Booking refunded
```

**Database prüfen:**
```javascript
await prisma.directBooking.findUnique({
  where: { id: 'booking_id' },
  select: {
    status: true,
    paymentStatus: true,
    refundedAt: true // Falls Feld existiert
  }
})

// Erwartetes Ergebnis:
{
  status: 'CANCELLED',
  paymentStatus: 'REFUNDED'
}
```

---

### 4.2 Teilerstattung (Partial Refund)

**Test-Schritte:**
1. Im Stripe Dashboard
2. Refund payment
3. Betrag: **50%** (z.B. 50€ von 100€)
4. Refund

**Erwartetes Verhalten:**
- Webhook: `charge.refunded` (mit Amount)
- Status bleibt möglicherweise `CONFIRMED` (abhängig von Business-Logik)
- Payment Status: `PARTIALLY_REFUNDED` (falls implementiert)

**Hinweis:** Aktuell wird bei Refund immer `CANCELLED` gesetzt. Für Teilerstattungen evtl. Logik anpassen:

```typescript
// Vorschlag für Webhook-Handler
async function handleChargeRefunded(charge: Stripe.Charge) {
  const refundedAmount = charge.amount_refunded / 100 // Cents to Euro
  const totalAmount = charge.amount / 100
  
  const isFullRefund = refundedAmount === totalAmount
  
  await prisma.directBooking.updateMany({
    where: { stripePaymentId: paymentIntentId },
    data: {
      paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      status: isFullRefund ? 'CANCELLED' : 'CONFIRMED',
      refundedAmount: refundedAmount
    }
  })
}
```

---

## 5️⃣ Test: Workshop Payout (Commission Flow)

### 5.1 Commission Breakdown prüfen

**Nach erfolgreicher Zahlung (Test 1.1):**

**Database Check:**
```javascript
await prisma.directBooking.findUnique({
  where: { id: 'booking_id' },
  select: {
    totalPrice: true,
    platformCommission: true,
    workshopPayout: true,
    stripeFeesEstimate: true,
    platformNetCommission: true
  }
})

// Erwartetes Ergebnis bei 100€ Zahlung:
{
  totalPrice: 100.00,
  platformCommission: 6.90,        // 6.9%
  workshopPayout: 93.10,           // 93.1%
  stripeFeesEstimate: 1.75,        // ~1.5% + 0.25€
  platformNetCommission: 5.15      // 6.90 - 1.75
}
```

**Stripe Dashboard prüfen:**
1. https://dashboard.stripe.com/test/connect/transfers
2. Suche Transfer zur Test-Werkstatt
3. Amount: 93.10€ (Workshop Payout)
4. Application Fee: 6.90€ (Platform Commission)

---

### 5.2 Payout nach Refund

**Nach Erstattung (Test 4.1):**

**Stripe Dashboard:**
- Transfer wird automatisch rückgängig gemacht
- Workshop erhält KEIN Geld
- Platform Commission wird ebenfalls zurückgebucht

**Business-Logik prüfen:**
- Werkstatt-Dashboard: Buchung nicht mehr in "Bestätigte Termine"
- Werkstatt-Email über Stornierung

---

## 🔧 Debugging & Monitoring

### Live-Logs während Test

**Terminal 1: PM2 Logs**
```bash
ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110 "pm2 logs bereifung24"
```

**Terminal 2: Webhook-Logs filtern**
```bash
ssh root@167.235.24.110 "tail -f /var/www/bereifung24/.next/server/app/api/webhooks/stripe/route.log" # Falls existiert
```

### Stripe Webhook-Events prüfen

**Stripe Dashboard:**
1. https://dashboard.stripe.com/test/webhooks
2. Klick auf Webhook: `https://bereifung24.de/api/webhooks/stripe`
3. Tab: "Events"
4. Suche Event-Type: `checkout.session.completed`
5. Status: `succeeded` oder `failed`

**Falls Webhook fehlschlägt:**
- Status Code: 401 → Signature Verification fehlgeschlagen
- Status Code: 500 → Server Error
- Retry: Stripe sendet Event bis zu 3 Tage lang erneut

### Common Issues

#### ❌ "Webhook signature verification failed"
**Ursache:** Falscher `STRIPE_WEBHOOK_SECRET`

**Fix:**
1. Gehe zu Stripe Dashboard → Webhooks
2. Klick auf Webhook
3. Kopiere "Signing secret"
4. Update im Admin Panel: `/admin/api-settings`
5. PM2 Restart

#### ❌ "No signature found"
**Ursache:** NGINX oder Proxy entfernt Header

**Fix:**
```nginx
# bereifung24.nginx
location /api/webhooks/stripe {
    proxy_pass http://localhost:3000;
    proxy_set_header stripe-signature $http_stripe_signature;
}
```

#### ❌ "Booking not found"
**Ursache:** Metadata fehlt in Checkout Session

**Fix:** Prüfe `/api/customer/direct-booking/create-stripe-session`:
```typescript
metadata: {
  workshopId: '...',
  customerId: '...',
  date: '...',
  time: '...',
  serviceType: '...',
  vehicleId: '...',
  totalPrice: '...'
}
```

---

## 📊 Test-Report Template

Nach jedem Test dokumentieren:

```markdown
### Test-Report: [Szenario Name]
**Datum:** 18.02.2026  
**Tester:** [Name]  
**Test-Modus:** Stripe Test  

#### Ergebnis
- [ ] ✅ Test bestanden
- [ ] ❌ Test fehlgeschlagen
- [ ] ⚠️ Teilweise erfolgreich

#### Details
- **Booking ID:** `cml...`
- **Stripe Session ID:** `cs_test_...`
- **Payment Intent ID:** `pi_...`
- **Status DB:** `CONFIRMED` / `PAID`
- **Logs:** [Link zu Screenshot]
- **Stripe Dashboard:** [Link]

#### Probleme
1. [Beschreibung]
2. [Beschreibung]

#### Fixes
1. [Implementiert]
2. [Offen]
```

---

## ✅ Test-Checkliste

### Vor Go-Live

- [ ] Test 1.1: Erfolgreiche Kreditkartenzahlung ✅
- [ ] Test 1.2: Apple Pay / Google Pay ✅
- [ ] Test 1.3: Klarna ✅
- [ ] Test 1.4: PayPal ✅
- [ ] Test 1.5: Banküberweisung ✅
- [ ] Test 2.1: Kreditkarte abgelehnt ✅
- [ ] Test 2.2: Insufficient Funds ✅
- [ ] Test 2.3: Lost/Stolen Card ✅
- [ ] Test 3.1: Zahlung abgebrochen ✅
- [ ] Test 3.2: Session Timeout ✅
- [ ] Test 4.1: Volle Erstattung ✅
- [ ] Test 4.2: Teilerstattung ✅
- [ ] Test 5.1: Commission Breakdown ✅
- [ ] Test 5.2: Payout nach Refund ✅

### Email-Tests
- [ ] Kunden-Email bei erfolgreicher Buchung ✅
- [ ] Werkstatt-Email bei neuer Buchung ✅
- [ ] Kunden-Email bei Stornierung ✅
- [ ] Werkstatt-Email bei Stornierung ✅

### Error-Handling
- [ ] Webhook Retry bei Server-Fehler ✅
- [ ] Doppelte Webhook-Events (Idempotenz) ✅
- [ ] Session läuft ab → Buchung cancelled ✅

### Security
- [ ] Webhook Signature Verification ✅
- [ ] Rate Limiting auf Webhook-Endpoint ✅
- [ ] Logging ohne sensible Daten ✅

---

## 🚀 Nach Erfolgreichem Test

**Nächste Schritte:**
1. ✅ Alle Tests dokumentiert
2. 🔄 Stripe von Test auf Live umstellen
3. 📧 Email-Templates finalisieren
4. 📊 Monitoring einrichten (Sentry, Datadog)
5. 🎯 Go-Live

**Monitoring nach Go-Live:**
- Erste 24h: Alle Zahlungen manuell prüfen
- Erste Woche: Täglich Webhook-Logs checken
- Danach: Automatisches Monitoring mit Alerts

---

## 📝 Notizen

- Alle Zahlungen laufen über Stripe Connect
- Platform Commission: 6.9%
- Stripe Fees: ~1.5% + 0.25€ (von Platform bezahlt)
- Workshops erhalten: 93.1% direkt auf ihr Stripe-Konto
- Webhooks sind idempotent (können mehrmals gefeuert werden)

---

**Last Updated:** 18. Februar 2026  
**Version:** 1.0  
**Maintainer:** Bereifung24 Dev Team
