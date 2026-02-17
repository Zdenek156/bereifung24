# PayPal Integration via Stripe - Migration Guide

## ✅ Was wurde geändert (17.02.2026)

### Vorher: Separate PayPal Integration
```typescript
// Alte Implementierung
if (method === 'paypal') {
  // Separate PayPal API
  const response = await fetch('/api/customer/direct-booking/create-paypal-order')
  // ... PayPal SDK, separate Webhooks, kompliziertes Provision-Tracking
}
```

**Probleme:**
- ❌ Separate API-Integration nötig
- ❌ Eigene Webhook-Handler für PayPal
- ❌ Keine automatische 6,9% Provision (Application Fee)
- ❌ Kompliziertes Tracking und Reporting
- ❌ Zwei verschiedene Payment-Systeme parallel

---

### Nachher: PayPal über Stripe
```typescript
// Neue Implementierung (seit 17.02.2026)
if (method === 'paypal') {
  // PayPal via Stripe Checkout
  const response = await fetch('/api/customer/direct-booking/create-stripe-session', {
    body: JSON.stringify({
      paymentMethodType: 'paypal', // Einfach als payment method type!
      // ... rest
    })
  })
}
```

**Vorteile:**
- ✅ **Ein System** für alle Zahlungen (Karte, Klarna, PayPal, SEPA)
- ✅ **6,9% Provision** funktioniert automatisch
- ✅ **Keine separaten Webhooks** nötig
- ✅ **Einheitliches Reporting** in Stripe Dashboard
- ✅ **Weniger Code** zu warten

---

## 🎯 Wie funktioniert PayPal über Stripe?

### Payment Flow

```
┌─────────────────────────────────────────────────────┐
│ Kunde wählt PayPal                                 │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Stripe Checkout Session erstellt                   │
│  payment_method_types: ['paypal']                  │
│  application_fee_amount: 690 (6,9%)                │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Kunde wird zu PayPal weitergeleitet               │
│  (Stripe leitet automatisch weiter)                │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Kunde zahlt mit PayPal                             │
│  (Einloggen, Zahlung bestätigen)                   │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Stripe verarbeitet Zahlung                         │
│  ├─ 100€ von PayPal-Konto abgebucht                │
│  ├─ 6,90€ Application Fee (Plattform)              │
│  ├─ ~1,75€ Stripe-Gebühren (von 6,90€ abgezogen)   │
│  └─ 93,10€ Transfer zur Werkstatt                  │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Webhook: checkout.session.completed                │
│  → DirectBooking erstellt                          │
│  → Commission tracking (6,90€)                     │
│  → Status: CONFIRMED                               │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Code-Änderungen

### 1. Backend: Stripe Session API

**Datei:** `app/api/customer/direct-booking/create-stripe-session/route.ts`

**Änderung:**
```typescript
// Vor:
const paymentMethodMap = {
  'card': ['card'],
  'klarna': ['klarna'],
}

// Nach:
const paymentMethodMap = {
  'card': ['card'],
  'klarna': ['klarna'],
  'paypal': ['paypal'], // ← NEU!
}

// PayPal bekommt auch Application Fee:
} else if (enabledPaymentMethods.includes('paypal')) {
  sessionConfig.payment_intent_data = {
    application_fee_amount: applicationFeeAmount, // 6,9%
    transfer_data: {
      destination: workshop.stripeAccountId,
    },
  }
}
```

---

### 2. Frontend: Payment Page

**Datei:** `app/workshop/[id]/payment/page.tsx`

**Änderung:**
```typescript
// Vor:
if (method === 'paypal') {
  // Separate PayPal API
  const response = await fetch('/api/customer/direct-booking/create-paypal-order', {...})
}

// Nach:
// PayPal läuft jetzt durch Stripe (zusammen mit Karte, Klarna)
const response = await fetch('/api/customer/direct-booking/create-stripe-session', {
  body: JSON.stringify({
    paymentMethodType: 'paypal', // ← Einfach als payment method!
    // ...
  })
})
```

**UI-Änderung:**
```tsx
<p className="text-xs text-gray-500">
  Schnell & sicher via Stripe  {/* ← NEU: "via Stripe" hinzugefügt */}
</p>
```

---

## 🔧 Stripe Dashboard Konfiguration

### PayPal aktivieren

**Schritte:**
1. Stripe Dashboard → **Settings** → **Payment methods**
2. Suche nach **"PayPal"**
3. Klicke auf **"Enable"** / **"Aktivieren"**
4. Bestätige die PayPal-Nutzungsbedingungen

**Wichtig:**
- PayPal muss für **Connected Accounts** aktiviert sein
- Werkstätten müssen PayPal in ihrem Stripe Express Account akzeptieren

**Für Werkstätten:**
```
Workshop → Stripe Express Dashboard → Payment methods → PayPal aktivieren
```

---

## 💰 Gebühren-Vergleich

### PayPal über Stripe vs. PayPal direkt

**PayPal über Stripe:**
```
Kunde zahlt:           100,00€
├─ Stripe-Gebühren:     ~1,75€ (1,5% + 0,25€)
├─ Plattform (netto):    5,15€ (6,9% - 1,75€)
└─ Werkstatt:           93,10€ (93,1%)

TOTAL: 100,00€
```

**PayPal direkt (alte Integration):**
```
Kunde zahlt:           100,00€
├─ PayPal-Gebühren:     ~2,49€ (2,49% + 0,35€)
├─ Plattform-Fee:        6,90€ (manuell berechnet)
└─ Werkstatt:           90,61€ (90,61%)

TOTAL: 100,00€
Problem: Provision muss manuell abgerechnet werden!
```

**Fazit:** PayPal über Stripe ist **günstiger** (1,75€ vs. 2,49€) und **einfacher** (automatische Provision)!

---

## 🔄 Migration für bestehende Systeme

### Ist ein Datenbankupdate nötig?

**Nein!** Die Datenbank-Struktur bleibt gleich:
- `DirectBooking.paymentMethod = 'STRIPE'` (nicht 'PAYPAL')
- `DirectBooking.platformCommission` wird automatisch berechnet
- Webhook `checkout.session.completed` behandelt PayPal genauso wie Karte

**Vorteil:** Alle PayPal-Zahlungen werden im gleichen Schema getrackt wie Kartenzahlungen!

---

### PayPal-Ratenzahlung (Pay Later)

**Status:** Bleibt vorerst über separate PayPal-API

**Grund:**
- Stripe unterstützt PayPal "Pay Later" (Ratenzahlung) noch nicht direkt
- Für Ratenzahlung wird weiterhin die separate PayPal-Integration verwendet

**Code:**
```typescript
if (method === 'paypal-installments') {
  // Weiterhin über separate PayPal API
  const response = await fetch('/api/customer/direct-booking/create-paypal-order', {
    body: JSON.stringify({ installments: true, ... })
  })
}
```

**Zukunft:**
Sobald Stripe PayPal Pay Later unterstützt, können wir auch das umstellen.

---

## 🧪 Testing

### Test-Szenario: PayPal-Zahlung über Stripe

**1. Stripe Test-Mode aktivieren**
```env
STRIPE_MODE=test
STRIPE_SECRET_KEY=sk_test_...
```

**2. Werkstatt verbindet Stripe**
- Werkstatt-Dashboard → Settings → Stripe verbinden
- Express Onboarding abschließen

**3. Kunde bucht Termin**
- Wählt "PayPal" als Zahlungsmethode
- Klickt "Jetzt zahlungspflichtig buchen"

**4. PayPal-Zahlung (Sandbox)**
In Test-Mode wird man zu PayPal Sandbox weitergeleitet:
```
Email: sb-test@business.example.com
Password: 12345678
```

**5. Verify in Datenbank**
```sql
SELECT 
  id,
  total_price,
  payment_method, -- sollte 'STRIPE' sein
  platform_commission, -- sollte 6,90€ sein
  workshop_payout, -- sollte 93,10€ sein
  stripe_session_id,
  payment_status -- sollte 'PAID' sein
FROM direct_bookings
WHERE payment_method = 'STRIPE'
ORDER BY created_at DESC
LIMIT 1;
```

**6. Verify in Stripe Dashboard**
```
Payments → All Payments → Suche nach PaymentIntent
→ Details:
  - Payment method: PayPal
  - Application fee: 6,90€
  - Transfer: 93,10€ → Workshop account
```

---

## 📊 Reporting

### PayPal-Zahlungen filtern

**SQL-Query:**
```sql
-- Alle PayPal-Zahlungen über Stripe finden
-- (identifiziert durch stripe_session_id UND payment_method = 'STRIPE')
SELECT 
  db.id,
  db.created_at,
  w.company_name AS workshop,
  u.email AS customer,
  db.total_price,
  db.platform_commission,
  db.workshop_payout,
  'PayPal via Stripe' AS payment_source
FROM direct_bookings db
JOIN workshops w ON db.workshop_id = w.id
JOIN users u ON db.customer_id = u.id
WHERE db.payment_method = 'STRIPE'
  AND db.stripe_session_id IS NOT NULL
  AND db.payment_status = 'PAID'
ORDER BY db.created_at DESC;
```

**Stripe Dashboard:**
```
Payments → Filters:
  - Payment method: PayPal
  - Status: Successful
  - Application fee: > 0
```

---

## ⚠️ Wichtige Hinweise

### 1. Stripe Connect erforderlich
- PayPal über Stripe funktioniert nur mit **Connected Accounts**
- Werkstatt muss **Stripe Express Account** haben
- Account muss **verifiziert** sein (`charges_enabled = true`)

### 2. PayPal muss in Payment Methods aktiviert sein
- Stripe Dashboard → Settings → Payment methods → PayPal
- Pro Workshop: Stripe Express Dashboard → Payment methods → PayPal

### 3. Gebühren
- PayPal-Gebühren über Stripe: **1,5% + 0,25€** (gleich wie Karte)
- PayPal-Gebühren direkt: **2,49% + 0,35€** (teurer!)
- **Stripe ist günstiger** bei PayPal-Zahlungen!

### 4. Webhook-Events
- `checkout.session.completed` wird für alle Payment Methods gefeuert (Karte, Klarna, PayPal)
- Keine separaten PayPal-Webhooks mehr nötig
- Vereinfachte Event-Verarbeitung

---

## 🚀 Deployment

### Checklist

**Backend:**
- [x] `paymentMethodMap` um PayPal erweitert
- [x] PayPal-Logik in Payment Intent Data
- [x] Webhook unterstützt PayPal (bereits vorhanden)

**Frontend:**
- [x] UI-Text aktualisiert ("via Stripe")
- [x] PayPal-Button nutzt Stripe-Session API
- [x] PayPal Ratenzahlung bleibt vorerst separat

**Stripe Dashboard:**
- [ ] PayPal als Payment Method aktivieren
- [ ] PayPal für Connected Accounts freischalten

**Testing:**
- [ ] Test-Buchung mit PayPal über Stripe
- [ ] Provision (6,9%) wird korrekt berechnet
- [ ] Workshop erhält 93,1%
- [ ] Webhook feuert für PayPal-Zahlung

---

## 📚 Weitere Dokumentation

- [Stripe PayPal Integration](https://stripe.com/docs/payments/paypal)
- [Stripe Connect Application Fees](https://stripe.com/docs/connect/charges#application-fees)
- [PayPal über Stripe vs. PayPal direkt](https://stripe.com/blog/paypal-integration)
- [Bereifung24 Payment System](STRIPE_CONNECT_COMMISSION.md)

---

**Status:** ✅ Implementiert (17.02.2026)  
**Version:** 2.0  
**Migration:** Keine Datenbank-Änderungen nötig  
**Breaking Changes:** Keine
