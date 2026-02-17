# Stripe Connect - 6,9% Provision System

## Übersicht

Das Bereifung24 Stripe Connect System ermöglicht:
- **Kunden** zahlen über Stripe (Karte, Klarna, Überweisung)
- **Plattform** (Bereifung24) erhält **6,9% Provision** automatisch
- **Werkstatt** erhält **93,1%** des Betrags direkt auf ihr Konto
- **Stripe-Gebühren** werden automatisch von der Provision abgezogen

---

## 💰 Payment Flow & Provisionsaufteilung

### Beispiel: Kunde zahlt 100€

```
┌─────────────────────────────────────────────────────┐
│ Kunde zahlt:           100,00€                     │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Stripe Payment Processing                          │
│  ├─ Application Fee:   6,90€ (6,9%)                │
│  ├─ Stripe Gebühren:  ~1,75€ (1,5% + 0,25€)        │
│  └─ Werkstatt erhält: 93,10€ (automatisch)         │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ FINALE AUFTEILUNG:                                 │
│                                                     │
│ 🏭 Werkstatt:     93,10€ (93,1%)                   │
│ 🏢 Bereifung24:    5,15€ (6,9€ - 1,75€ Gebühren)  │
│ 💳 Stripe:         1,75€ (Gebühren)                │
│                                                     │
│ SUMME:           100,00€ ✅                         │
└─────────────────────────────────────────────────────┘
```

### Stripe-Gebühren (EU-Karten)
- **Kartenzahlung:** 1,5% + 0,25€ pro Transaktion
- **Klarna:** ~1,8% + 0,25€
- **SEPA-Überweisung:** 0,35€ pauschal (günstigste Option!)
- **PayPal:** 1,5% + 0,25€ (gleich wie Karte, da über Stripe!)

**Wichtig:** Die Stripe-Gebühren werden automatisch von der Application Fee (6,9%) abgezogen, nicht vom Werkstatt-Betrag!

**PayPal über Stripe vs. PayPal direkt:**
- ✅ **Über Stripe:** Einheitliches System, 6,9% Provision funktioniert automatisch, kein separates PayPal SDK nötig
- ⚠️ **PayPal direkt:** Separate Integration, kompliziertere Provision-Tracking, nur für PayPal-Ratenzahlung (Pay Later) verwendet

---

## 🏗️ Technische Implementierung

### 1. Stripe Connect Account Onboarding

**Werkstatt registriert sich für Stripe:**

```typescript
// POST /api/workshop/stripe-connect/create-account-link
// Creates Stripe Express Account & Onboarding Link

const accountLink = await stripe.accountLinks.create({
  account: workshopStripeAccountId,
  refresh_url: `${url}/dashboard/workshop/settings?stripe_refresh=true`,
  return_url: `${url}/dashboard/workshop/settings?stripe_onboarding=success`,
  type: 'account_onboarding'
})

// Werkstatt wird zu Stripe weitergeleitet
// → Verifizierung (ID, Bankverbindung, Geschäftsdetails)
// → Nach Verifizierung: stripeEnabled = true
```

**Datenbank-Felder im `workshops` Model:**
```typescript
stripeAccountId  String?  // Stripe Connected Account ID
stripeEnabled    Boolean  // true nach erfolgreicher Verifizierung
```

---

### 2. Payment Session mit Application Fee

**Kunde bucht Termin:**

```typescript
// POST /api/customer/direct-booking/create-stripe-session

const PLATFORM_COMMISSION_RATE = 0.069 // 6,9%
const applicationFeeAmount = Math.round(totalPrice * 100 * PLATFORM_COMMISSION_RATE) // in cents

const sessionConfig = {
  payment_method_types: ['card', 'klarna', 'paypal'], // PayPal seit 17.02.2026 über Stripe!
  line_items: [{
    price_data: {
      currency: 'eur',
      product_data: { name: 'Reifenwechsel bei Autowerkstatt XYZ' },
      unit_amount: Math.round(totalPrice * 100) // 100€ = 10000 cents
    },
    quantity: 1
  }],
  mode: 'payment',
  
  // 🎯 KEY: Application Fee für 6,9% Provision
  payment_intent_data: {
    application_fee_amount: applicationFeeAmount, // 690 cents = 6,90€
    on_behalf_of: workshop.stripeAccountId, // Workshop account (nur bei Karte)
    transfer_data: {
      destination: workshop.stripeAccountId // Werkstatt erhält Geld direkt
    }
  }
}

const checkoutSession = await stripe.checkout.sessions.create(sessionConfig)
```

**Unterstützte Zahlungsmethoden:**
- ✅ **Kreditkarte** (Visa, Mastercard, Amex)
- ✅ **Klarna** (Sofort, Rechnung, Ratenkauf)
- ✅ **PayPal** (seit 17.02.2026 über Stripe!)
- ✅ **SEPA-Überweisung** (customer_balance)

**Was passiert bei der Zahlung:**
1. Kunde zahlt 100€ via Stripe Checkout
2. Stripe erstellt Payment Intent mit `application_fee_amount: 690` (6,90€)
3. Stripe transferiert **93,10€** automatisch zur Werkstatt
4. Stripe behält **6,90€** als Application Fee für die Plattform
5. Stripe zieht **ihre Gebühren (~1,75€)** von der Application Fee ab
6. Plattform (Bereifung24) erhält **5,15€ netto**

---

### 3. Webhook - Commission Tracking

**Stripe sendet Event an `/api/webhooks/stripe`:**

```typescript
// checkout.session.completed Event
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const totalPrice = parseFloat(session.metadata?.totalPrice || '0')
  
  // Berechne Provision & Auszahlung
  const PLATFORM_COMMISSION_RATE = 0.069
  const platformCommission = totalPrice * PLATFORM_COMMISSION_RATE // 6,90€
  const workshopPayout = totalPrice * (1 - PLATFORM_COMMISSION_RATE) // 93,10€
  
  // Schätze Stripe-Gebühren (1,5% + 0,25€)
  const stripeFeesEstimate = (totalPrice * 0.015) + 0.25 // ~1,75€
  const platformNetCommission = platformCommission - stripeFeesEstimate // 5,15€
  
  // Speichere in DirectBooking
  await prisma.directBooking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      totalPrice: 100.00,
      platformCommission: 6.90,
      platformCommissionCents: 690,
      workshopPayout: 93.10,
      stripeFeesEstimate: 1.75,
      platformNetCommission: 5.15,
      paidAt: new Date()
    }
  })
}
```

---

### 4. Datenbank-Schema

**DirectBooking Model:**

```prisma
model DirectBooking {
  id          String   @id @default(cuid())
  
  // Pricing
  basePrice       Decimal  @db.Decimal(10, 2)
  totalPrice      Decimal  @db.Decimal(10, 2)
  
  // 💰 Commission & Payout (NEW)
  platformCommission       Decimal? @db.Decimal(10, 2) // 6,90€ (6,9% von 100€)
  platformCommissionCents  Int?                       // 690 cents (für Stripe API)
  workshopPayout           Decimal? @db.Decimal(10, 2) // 93,10€ (93,1% von 100€)
  stripeFeesEstimate       Decimal? @db.Decimal(10, 2) // ~1,75€ (geschätzt)
  platformNetCommission    Decimal? @db.Decimal(10, 2) // 5,15€ (6,90€ - 1,75€)
  
  // Payment
  paymentMethod   DirectBookingPaymentMethod?
  paymentStatus   DirectBookingPaymentStatus  @default(PENDING)
  stripeSessionId String?
  stripePaymentId String?
  paidAt          DateTime?
  
  // Relations
  workshop   Workshop @relation(fields: [workshopId], references: [id])
  customer   User     @relation(fields: [customerId], references: [id])
  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id])
  
  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 📊 Reporting & Analytics

### Admin-Dashboard: Provisionsübersicht

**Endpoint:** `GET /api/admin/commissions/summary?from=2026-01-01&to=2026-12-31`

```typescript
const commissions = await prisma.directBooking.groupBy({
  by: ['workshopId'],
  where: {
    paymentStatus: 'PAID',
    paidAt: { gte: fromDate, lte: toDate }
  },
  _sum: {
    totalPrice: true,
    platformCommission: true,
    platformNetCommission: true,
    workshopPayout: true
  },
  _count: { id: true }
})

// Beispiel-Ausgabe:
{
  "summary": {
    "totalBookings": 856,
    "totalRevenue": "85,600.00€",
    "platformCommissionGross": "5,906.40€",
    "stripeFeesTotal": "1,482.50€",
    "platformCommissionNet": "4,423.90€",
    "workshopPayoutTotal": "79,693.60€"
  },
  "perWorkshop": [
    {
      "workshopName": "Autowerkstatt XYZ",
      "bookings": 23,
      "revenue": "2,300.00€",
      "commission": "158.70€",
      "payout": "2,141.30€"
    }
  ]
}
```

---

## 🔐 Sicherheit & Compliance

### Stripe Connect Requirements

**Werkstatt muss verifizieren:**
- ✅ Personalausweis / Reisepass
- ✅ Bankverbindung (IBAN)
- ✅ Geschäftsadresse
- ✅ Steuernummer (für Unternehmen)

**Account-Typen:**
- **Express Account:** Empfohlen (schnelle Verifizierung, wenige Anforderungen)
- **Standard Account:** Volle Kontrolle über Stripe-Dashboard

**Rechtskonformität:**
- 🇩🇪 **TSA (Technical Service Agreement):** Kein MSO (Marketplace Service Operator) erforderlich, da Plattform keine Dienstleistung vermittelt, sondern nur Buchungen digitalisiert
- 🇪🇺 **PSD2:** Stripe übernimmt Strong Customer Authentication (SCA)
- 📜 **DSGVO:** Kundendaten werden nur für Zahlungsabwicklung verwendet

---

## 🚀 Deployment & Setup

### 1. Stripe Dashboard konfigurieren

**Live-Modus aktivieren:**
- Stripe Settings → API Keys → **Live Mode**
- Stripe Connect → **Express Accounts aktivieren**

**Webhook-Endpoint registrieren:**
```
URL: https://bereifung24.de/api/webhooks/stripe
Events:
  - checkout.session.completed
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded
  - account.updated
```

### 2. Environment Variables

```env
# Stripe API Keys (Live Mode)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (für Redirects)
NEXT_PUBLIC_APP_URL=https://bereifung24.de
NEXTAUTH_URL=https://bereifung24.de
```

### 3. Datenbank-Migration ausführen

```bash
# Neue Spalten für DirectBooking hinzufügen
npx prisma migrate dev --name add_commission_tracking

# Oder Produktions-DB:
npx prisma migrate deploy
```

---

## 🧪 Testing

### Test-Szenarien

**1. Werkstatt-Onboarding testen:**
```bash
Werkstatt-Account → Settings → "Stripe verbinden" Button
→ Stripe Onboarding durchlaufen
→ Verify: stripeEnabled = true
```

**2. Buchung mit Kartenzahlung:**
```bash
Kunde bucht Termin für 100€
→ Zahlt mit Testkarte: 4242 4242 4242 4242
→ Verify: 
  - DirectBooking.totalPrice = 100.00
  - DirectBooking.platformCommission = 6.90
  - DirectBooking.workshopPayout = 93.10
  - DirectBooking.platformNetCommission = 5.15
```

**3. Webhook-Test:**
```bash
# Manuell Event senden via Stripe CLI
stripe trigger checkout.session.completed
→ Verify: DirectBooking status = CONFIRMED
```

---

## 📈 Zukunft & Erweiterungen

### Geplante Features

**1. Provisionsrate anpassen (dynamisch):**
```typescript
// Workshop-spezifische Provision (z.B. Premium-Partner: 5%)
model Workshop {
  commissionRate Decimal @default(0.069) // 6,9% Standard
}
```

**2. Auszahlungs-Dashboard für Werkstätten:**
```typescript
// Werkstatt sieht ihre Auszahlungen
GET /api/workshop/payouts
→ Liste aller DirectBooking mit Payout-Details
```

**3. Automatische Rechnungsstellung:**
```typescript
// Monatliche Provisionsrechnung an Bereifung24
// Werkstatt erhält Rechnung für transparente Abrechnung
```

---

## 🆘 Troubleshooting

### Problem: Workshop erhält keine Zahlungen

**Lösung:**
```typescript
// 1. Prüfe Stripe Account Status
GET /api/workshop/stripe-connect/account-status

// 2. Prüfe ob charges_enabled = true
const account = await stripe.accounts.retrieve(workshopStripeAccountId)
console.log(account.charges_enabled) // muss true sein

// 3. Prüfe ob stripeEnabled in DB gesetzt ist
const workshop = await prisma.workshop.findUnique({
  where: { id: workshopId },
  select: { stripeEnabled: true, stripeAccountId: true }
})
```

### Problem: Application Fee nicht abgezogen

**Lösung:**
```typescript
// Prüfe ob payment_intent_data.application_fee_amount gesetzt ist
const session = await stripe.checkout.sessions.retrieve(sessionId)
console.log(session.payment_intent) 

const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)
console.log(paymentIntent.application_fee_amount) // sollte 690 sein (für 100€)
```

---

## 📚 Weitere Dokumentation

- [Stripe Connect Application Fees](https://stripe.com/docs/connect/charges#application-fees)
- [Stripe Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Bereifung24 Payment System Roadmap](PAYMENT_SYSTEM_ROADMAP.md)

---

**Status:** ✅ Implementiert (17.02.2026)  
**Version:** 1.0  
**Autor:** Bereifung24 Development Team
