# 💳 Zahlungssystem-Roadmap - Bereifung24

**Erstellt am:** 30. Januar 2026  
**Letztes Update:** 31. Januar 2026  
**Status:** ✅ Phase 1 & 2 implementiert  
**TSA-konform:** ✅ Ja (Kunde zahlt direkt an Werkstatt)

---

## 📊 Implementierungsstatus

- ✅ **Phase 1:** Datenbank-Schema (Payment-Model)
- ✅ **Phase 2:** PayPal Webhooks (automatische Bestätigung)
- ⏳ **Phase 3:** Stripe Integration (Kreditkarte, Apple Pay, Google Pay)
- ⏳ **Phase 4:** Frontend-Integration (Zahlungsauswahl bei Buchung)

---

## 🎯 Grundprinzip (TSA-Konformität)

✅ **Kunde zahlt IMMER direkt an Werkstatt**  
✅ **Bereifung24 = Vermittler** (keine Zahlungsabwicklung)  
✅ **Automatische Status-Updates** für alle Parteien  
✅ **Keine Zahlungsfluss über Bereifung24** (TSA-konform)

---

## 💳 Geplante Zahlungsmethoden

### 1. **PayPal** ✅ IMPLEMENTIERT
- **Status:** ✅ Webhook-Integration implementiert
- **Features:**
  - ✅ Automatische Zahlungsbestätigung
  - ✅ Email-Benachrichtigungen (Kunde & Werkstatt)
  - ✅ Booking-Status Update (PAID)
  - ✅ Signature-Verifizierung (Sicherheit)
- **Dateien:**
  - `app/api/webhooks/paypal/route.ts`
  - `lib/paypal/webhook.ts`
- **Gebühren:** 2,49% + 0,35€
- **Setup:** Webhook-URL in PayPal Dashboard eintragen

### 2. **Kreditkarte / Debitkarte** (via Stripe)
- Visa, Mastercard, American Express
- **Apple Pay** (iPhone)
- **Google Pay** (Android)
- **Gebühren:** ~1,4% + 0,25€
- **Priorität:** 🟡 MITTEL

### 3. **SEPA-Lastschrift** (via GoCardless)
- **Status:** ✅ Bereits implementiert
- Perfekt für wiederkehrende Kunden
- **Gebühren:** ~0,6%

### 4. **Klarna** ⭐ EMPFOHLEN
- Sofortüberweisung
- "Später zahlen" (30 Tage)
- Ratenkauf
- Sehr beliebt in Deutschland
- **Gebühren:** ~2,49%
- **Priorität:** 🟢 NIEDRIG (Nice-to-have)

### 5. **giropay / paydirekt**
- Deutsche Bank-Überweisung
- Direktzahlung ohne Kreditkarte
- Integration über Stripe
- **Gebühren:** ~1,2%
- **Priorität:** 🟢 NIEDRIG

### 6. **Barzahlung vor Ort**
- **Status:** ✅ Bereits möglich
- Werkstatt bestätigt manuell
- Klassischer Weg

---

## 🔄 Workflow-Konzept

### **Option A: Vorzahlung (Online)**

```
1. Kunde bucht Termin
   ↓
2. Seite fragt: "Jetzt online bezahlen oder vor Ort?"
   ↓
3. Kunde wählt: "Jetzt bezahlen"
   ↓
4. Wählt Zahlungsmethode:
   - PayPal
   - Kreditkarte
   - Klarna
   - SEPA-Lastschrift
   ↓
5. Zahlt direkt an Werkstatt-Account
   ↓
6. ✅ AUTOMATISCH:
   ├─ Bereifung24 erhält Webhook von PayPal/Stripe
   ├─ Buchungsstatus → "BEZAHLT" 
   ├─ Email an Kunde: "Zahlung bestätigt - Ihr Termin ist gesichert"
   ├─ Email an Werkstatt: "Zahlung eingegangen für Termin XYZ"
   └─ Dashboard-Badge "BEZAHLT" (grün) für beide sichtbar
```

### **Option B: Vor-Ort-Zahlung**

```
1. Kunde bucht Termin
   ↓
2. Wählt: "Vor Ort bezahlen"
   ↓
3. Status: "GEBUCHT" (gelb)
   ↓
4. Kunde kommt zur Werkstatt
   ↓
5. Werkstatt klickt: "Als bezahlt markieren"
   ↓
6. Status → "BEZAHLT" (grün)
   ↓
7. Email-Bestätigung an beide
```

---

## 🏗️ Implementierungs-Phasen

### **Phase 1: Basis-Infrastruktur** ✅ ABGESCHLOSSEN

**Status:** ✅ Implementiert am 31.01.2026

**Was wurde gemacht:**
- ✅ Payment-Model im Prisma Schema erstellt
- ✅ Relation zum Booking-Model (`payments Payment[]`)
- ✅ Datenbank-Tabelle mit Migration erstellt
- ✅ Indexes für Performance
- ✅ Foreign Keys für Datenintegrität
- ✅ Prisma Client neu generiert

**Ergebnis:** Datenbank bereit für Zahlungsverfolgung

**Prisma Schema Erweiterung:**

```prisma
model Booking {
  id               String    @id @default(cuid())
  // ... existing fields ...
  
  // NEU: Payment-Felder
  paymentStatus    String    @default("PENDING")  // PENDING, PAID, REFUNDED
  paymentMethod    String?                        // PAYPAL, CARD, SEPA, CASH, KLARNA
  paymentAmount    Decimal?
  paymentFeesAmount Decimal?
  paymentNote      String?
  paidAt           DateTime?
  
  payments         Payment[]
}

model Payment {
  id              String   @id @default(cuid())
  bookingId       String
  booking         Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  amount          Decimal   @db.Decimal(10, 2)
  currency        String    @default("EUR")
  method          String    // PAYPAL, CARD, SEPA, CASH, KLARNA
  status          String    @default("PENDING")  // PENDING, COMPLETED, FAILED, REFUNDED
  
  // Provider-spezifische IDs
  transactionId   String?   @unique
  paypalOrderId   String?   @unique
  paypalCaptureId String?
  stripePaymentId String?
  
  // Metadata
  ipAddress       String?
  userAgent       String?
  metadata        Json?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  confirmedAt     DateTime?
  failedAt        DateTime?
  refundedAt      DateTime?
  
  @@index([bookingId])
  @@index([status])
  @@index([transactionId])
}
```

**Neue Status-Werte:**
- `PENDING` - Wartet auf Zahlung
- `PAID` - Zahlung bestätigt
- `FAILED` - Zahlung fehlgeschlagen
- `REFUNDED` - Rückerstattung erfolgt
- `CANCELLED` - Storniert

**Dashboard-Badges:**
- 🟡 "Gebucht" → `PENDING`
- 🟢 "Bezahlt" → `PAID`
- ✅ "Abgeschlossen" → Service erledigt
- 🔴 "Fehlgeschlagen" → `FAILED`

**Aufgaben:**
- [x] Prisma Schema aktualisieren
- [x] Migration erstellen und ausführen
- [x] `npx prisma generate`
- [x] Prisma Client neu generieren

---

### **Phase 2: PayPal Webhooks** ✅ ABGESCHLOSSEN

**Status:** ✅ Implementiert am 31.01.2026

**Was wurde gemacht:**
- ✅ Webhook-Endpoint: `app/api/webhooks/paypal/route.ts`
- ✅ Signature-Verifizierung: `lib/paypal/webhook.ts`
- ✅ Event-Handler für:
  - `PAYMENT.CAPTURE.COMPLETED` - Zahlung erfolgreich
  - `PAYMENT.CAPTURE.DENIED` - Zahlung fehlgeschlagen
  - `PAYMENT.CAPTURE.REFUNDED` - Rückerstattung
- ✅ Automatisches Update von:
  - Payment-Record (COMPLETED/FAILED/REFUNDED)
  - Booking-Status (PAID/FAILED/REFUNDED)
  - Email-Benachrichtigungen an Kunde & Werkstatt

**Konfiguration erforderlich:**
1. PayPal Developer Dashboard öffnen
2. Webhook erstellen mit URL: `https://bereifung24.de/api/webhooks/paypal`
3. Events abonnieren:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
4. Webhook-ID in `.env` eintragen: `PAYPAL_WEBHOOK_ID`

**Umgebungsvariablen:**
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_API_URL=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_WEBHOOK_VERIFY=true
```

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPayPalWebhookSignature } from '@/lib/paypal/webhook'
import { sendPaymentConfirmationEmail } from '@/lib/email/payment'

export async function POST(request: Request) {
  try {
    // 1. Webhook-Body lesen
    const body = await request.text()
    const headers = Object.fromEntries(request.headers)
    
    // 2. PayPal-Signatur verifizieren (Sicherheit!)
    const isValid = await verifyPayPalWebhookSignature(body, headers)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // 3. Event parsen
    const event = JSON.parse(body)
    
    // 4. Event-Typ prüfen
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      await handlePaymentCompleted(event)
    } else if (event.event_type === 'PAYMENT.CAPTURE.DENIED') {
      await handlePaymentFailed(event)
    } else if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      await handlePaymentRefunded(event)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentCompleted(event: any) {
  const orderId = event.resource.supplementary_data.related_ids.order_id
  const captureId = event.resource.id
  const amount = parseFloat(event.resource.amount.value)
  
  // Payment-Record suchen/erstellen
  const payment = await prisma.payment.upsert({
    where: { paypalOrderId: orderId },
    create: {
      paypalOrderId: orderId,
      paypalCaptureId: captureId,
      amount,
      currency: 'EUR',
      method: 'PAYPAL',
      status: 'COMPLETED',
      confirmedAt: new Date(),
      bookingId: '...' // TODO: Booking finden via custom_id
    },
    update: {
      status: 'COMPLETED',
      paypalCaptureId: captureId,
      confirmedAt: new Date()
    }
  })
  
  // Booking-Status aktualisieren
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date()
    },
    include: {
      customer: true,
      workshop: true
    }
  })
  
  // Email-Benachrichtigungen senden
  await sendPaymentConfirmationEmail(booking)
}
```

#### **2.2 PayPal Webhook-Signatur Verifizierung**

**Datei:** `lib/paypal/webhook.ts`

```typescript
import crypto from 'crypto'

export async function verifyPayPalWebhookSignature(
  body: string,
  headers: Record<string, string>
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID!
  const transmissionId = headers['paypal-transmission-id']
  const timestamp = headers['paypal-transmission-time']
  const certUrl = headers['paypal-cert-url']
  const actualSignature = headers['paypal-transmission-sig']
  const authAlgo = headers['paypal-auth-algo']
  
  // CRC32 des Bodys berechnen
  const crc = crc32(body).toString()
  
  // Expected signature erstellen
  const expectedSignature = `${transmissionId}|${timestamp}|${webhookId}|${crc}`
  
  // Zertifikat von PayPal holen
  const cert = await fetchPayPalCertificate(certUrl)
  
  // Signatur verifizieren
  const verifier = crypto.createVerify(authAlgo)
  verifier.update(expectedSignature)
  
  return verifier.verify(cert, actualSignature, 'base64')
}

async function fetchPayPalCertificate(url: string): Promise<string> {
  const response = await fetch(url)
  return await response.text()
}

function crc32(str: string): number {
  // CRC32 Implementierung
  // ...
}
```

#### **2.3 Email-Benachrichtigungen**

**Datei:** `lib/email/payment.ts`

```typescript
import { sendEmail } from './mailer'

export async function sendPaymentConfirmationEmail(booking: any) {
  // An Kunde
  await sendEmail({
    to: booking.customer.email,
    subject: '✓ Zahlung bestätigt - Ihr Termin ist gesichert',
    template: 'payment-confirmation-customer',
    data: {
      customerName: booking.customer.name,
      amount: booking.paymentAmount,
      workshopName: booking.workshop.name,
      appointmentDate: booking.appointmentDate,
      bookingId: booking.id
    }
  })
  
  // An Werkstatt
  await sendEmail({
    to: booking.workshop.email,
    subject: 'Zahlung eingegangen - Buchung bestätigt',
    template: 'payment-confirmation-workshop',
    data: {
      workshopName: booking.workshop.name,
      customerName: booking.customer.name,
      amount: booking.paymentAmount,
      appointmentDate: booking.appointmentDate,
      bookingId: booking.id
    }
  })
}
```

**Benötigte Environment-Variablen:**
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_MODE=sandbox  # oder 'live' für Produktion
```

**PayPal Webhook Events (wichtigste):**
- `PAYMENT.CAPTURE.COMPLETED` → Zahlung erfolgreich ✅
- `PAYMENT.CAPTURE.DENIED` → Zahlung abgelehnt ❌
- `PAYMENT.CAPTURE.PENDING` → Zahlung in Bearbeitung ⏳
- `PAYMENT.CAPTURE.REFUNDED` → Rückerstattung 💰

**PayPal Developer Dashboard Setup:**
1. Login: https://developer.paypal.com
2. Apps & Credentials → Create App
3. Webhooks → Add Webhook
4. URL: `https://bereifung24.de/api/webhooks/paypal`
5. Events auswählen (alle PAYMENT.CAPTURE.*)
6. Webhook ID + Secret kopieren

---

### **Phase 3: UI-Erweiterung** ⏱️ 1-2h

#### **3.1 Zahlungsauswahl auf Buchungsseite**

**Datei:** `app/dashboard/customer/requests/[id]/book/page.tsx`

**Neue Komponente:**

```tsx
<div className="bg-white rounded-xl shadow-md p-6 mb-6">
  <h2 className="text-xl font-bold mb-4">Zahlungsart wählen</h2>
  
  <div className="space-y-3">
    {/* Online-Zahlung */}
    <div className="border-2 border-blue-500 rounded-lg p-4">
      <label className="flex items-center cursor-pointer">
        <input type="radio" name="paymentChoice" value="online" />
        <div className="ml-3 flex-1">
          <p className="font-semibold text-lg">Jetzt online bezahlen</p>
          <p className="text-sm text-gray-600">Sichere Zahlung - Termin sofort bestätigt</p>
        </div>
      </label>
      
      {/* Zahlungsmethoden (wenn "online" gewählt) */}
      {selectedPayment === 'online' && (
        <div className="mt-4 pl-7 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
            <img src="/paypal-logo.png" className="h-6" />
            <span>PayPal</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
            <img src="/visa-mastercard.png" className="h-6" />
            <span>Kreditkarte / Debitkarte</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
            <img src="/klarna-logo.png" className="h-6" />
            <span>Klarna (Später zahlen)</span>
          </button>
        </div>
      )}
    </div>
    
    {/* Vor-Ort-Zahlung */}
    <div className="border rounded-lg p-4">
      <label className="flex items-center cursor-pointer">
        <input type="radio" name="paymentChoice" value="onsite" />
        <div className="ml-3">
          <p className="font-semibold">Vor Ort in der Werkstatt bezahlen</p>
          <p className="text-sm text-gray-600">Bar, EC-Karte oder Kreditkarte</p>
        </div>
      </label>
    </div>
  </div>
</div>
```

#### **3.2 Dashboard-Status-Badges**

**Kundenansicht:** `app/dashboard/customer/appointments/page.tsx`

```tsx
<div className="flex items-center gap-2">
  {booking.paymentStatus === 'PAID' && (
    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
      ✓ Bezahlt
    </span>
  )}
  {booking.paymentStatus === 'PENDING' && (
    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
      ⏳ Gebucht
    </span>
  )}
</div>
```

**Werkstatt-Ansicht:** `app/dashboard/workshop/appointments/page.tsx`

```tsx
<div className="flex items-center gap-2">
  {booking.paymentStatus === 'PAID' && (
    <div>
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
        💰 Bezahlt
      </span>
      <p className="text-xs text-gray-500 mt-1">
        {booking.paymentMethod} - {booking.paymentAmount}€
      </p>
    </div>
  )}
  {booking.paymentStatus === 'PENDING' && (
    <button
      onClick={() => markAsPaid(booking.id)}
      className="text-sm text-blue-600 hover:underline"
    >
      Als bezahlt markieren
    </button>
  )}
</div>
```

#### **3.3 Zahlungshistorie-Seite**

**Datei:** `app/dashboard/customer/payments/page.tsx`

```tsx
export default function PaymentsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Meine Zahlungen</h1>
      
      <div className="bg-white rounded-xl shadow-md">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Datum</th>
              <th className="p-4 text-left">Werkstatt</th>
              <th className="p-4 text-left">Betrag</th>
              <th className="p-4 text-left">Methode</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  {new Date(payment.createdAt).toLocaleDateString('de-DE')}
                </td>
                <td className="p-4">{payment.booking.workshop.name}</td>
                <td className="p-4 font-semibold">{payment.amount}€</td>
                <td className="p-4">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {payment.method}
                  </span>
                </td>
                <td className="p-4">
                  {payment.status === 'COMPLETED' && (
                    <span className="text-green-600">✓ Abgeschlossen</span>
                  )}
                  {payment.status === 'PENDING' && (
                    <span className="text-yellow-600">⏳ Ausstehend</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

### **Phase 4: Stripe Integration** ⏱️ 2-3h

**Ziel:** Kreditkarten, Apple Pay, Google Pay

#### **4.1 Stripe Connected Accounts**

**Konzept:**
- Jede Werkstatt verbindet ihr Stripe-Konto
- Geld fließt direkt an Werkstatt (TSA-konform)
- Bereifung24 erhält nur Webhook-Benachrichtigung

**Setup-Flow für Werkstätten:**

```
1. Werkstatt geht zu: Einstellungen → Zahlungsmethoden
2. Klickt "Stripe verbinden"
3. Wird zu Stripe OAuth weitergeleitet
4. Verbindet Stripe-Konto
5. Fertig - kann jetzt Kreditkarten-Zahlungen empfangen
```

**Prisma Schema Erweiterung:**

```prisma
model Workshop {
  // ... existing fields ...
  
  // Stripe Connected Account
  stripeAccountId      String?  @unique
  stripeAccountEnabled Boolean  @default(false)
  stripeAccountType    String?  // 'standard' oder 'express'
  stripeDashboardUrl   String?
}
```

**Stripe OAuth Connection:**

```typescript
// app/api/workshop/stripe/connect/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const workshopId = searchParams.get('workshopId')
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/workshop/settings?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/workshop/settings?stripe=success`,
    type: 'account_onboarding',
  })
  
  return Response.redirect(accountLink.url)
}
```

**Zahlungsabwicklung:**

```typescript
// app/api/payments/stripe/create/route.ts
export async function POST(request: Request) {
  const { bookingId, workshopId } = await request.json()
  
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId }
  })
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // in Cents
    currency: 'eur',
    application_fee_amount: 0, // Wir nehmen keine Gebühr (TSA!)
    transfer_data: {
      destination: workshop.stripeAccountId, // Direkt an Werkstatt
    },
    metadata: {
      bookingId,
      workshopId
    }
  })
  
  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
```

**Stripe Webhooks:**

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')!
  const body = await request.text()
  
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  if (event.type === 'payment_intent.succeeded') {
    await handleStripePaymentSuccess(event.data.object)
  }
  
  return NextResponse.json({ received: true })
}
```

**Environment-Variablen:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### **Phase 5: Klarna Integration** ⏱️ 1-2h

**Ziel:** "Später zahlen" und Ratenkauf

Klarna läuft über Stripe Payments - nach Stripe-Setup automatisch verfügbar!

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100,
  currency: 'eur',
  payment_method_types: ['card', 'klarna'], // Klarna hinzufügen
  transfer_data: {
    destination: workshop.stripeAccountId
  }
})
```

---

## 📊 Kosten-Übersicht

| Zahlungsmethode | Gebühren (DE) | Trägt | Priorität |
|----------------|---------------|-------|-----------|
| **PayPal** | 2,49% + 0,35€ | Kunde | 🔴 HOCH |
| **Stripe (Kreditkarte)** | 1,4% + 0,25€ | Kunde | 🟡 MITTEL |
| **Apple Pay / Google Pay** | 1,4% + 0,25€ | Kunde | 🟡 MITTEL |
| **SEPA-Lastschrift** | 0,6% | Kunde | ✅ FERTIG |
| **Klarna** | ~2,49% | Kunde | 🟢 NIEDRIG |
| **giropay** | 1,2% | Kunde | 🟢 NIEDRIG |
| **Bar/EC vor Ort** | 0% | - | ✅ MÖGLICH |

**Wichtig:** Alle Gebühren werden dem Kunden transparent angezeigt und zum Gesamtpreis addiert (wie bereits bei PayPal umgesetzt).

---

## 📧 Email-Templates

### **Zahlungsbestätigung an Kunde**

```
Betreff: ✓ Zahlung bestätigt - Ihr Termin ist gesichert

Hallo {{customerName}},

Ihre Zahlung von {{amount}}€ ist bei uns eingegangen!

Ihr Termin:
📅 {{appointmentDate}}
🏢 {{workshopName}}
💳 Bezahlt via {{paymentMethod}}

Was passiert als Nächstes?
→ Die Werkstatt wurde benachrichtigt
→ Ihr Termin ist verbindlich gebucht
→ Sie erhalten 24h vorher eine Erinnerung

Wir freuen uns auf Ihren Besuch!

Mit freundlichen Grüßen
Ihr Bereifung24-Team
```

### **Zahlungsbestätigung an Werkstatt**

```
Betreff: 💰 Zahlung eingegangen - Buchung bestätigt

Guten Tag {{workshopName}},

Für Ihren Termin ist die Zahlung eingegangen:

Kunde: {{customerName}}
Betrag: {{amount}}€
Termin: {{appointmentDate}}
Zahlung: {{paymentMethod}}

Der Kunde hat bereits bezahlt.
Der Termin ist verbindlich bestätigt.

→ Zum Dashboard: https://bereifung24.de/dashboard/workshop/appointments

Mit freundlichen Grüßen
Ihr Bereifung24-Team
```

---

## 🔐 Sicherheit

### **Webhook-Signatur-Verifizierung**

**Warum wichtig?**
- Verhindert gefälschte Zahlungsbestätigungen
- Schützt vor Manipulation
- Pflicht für Produktiv-Umgebung

**PayPal:**
```typescript
const isValid = await verifyPayPalWebhookSignature(body, headers)
if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 401 })
```

**Stripe:**
```typescript
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

### **Rate Limiting**

```typescript
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests pro Minute
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }
  
  // ...
}
```

### **Idempotenz**

Verhindert doppelte Zahlungen:

```typescript
const payment = await prisma.payment.upsert({
  where: { transactionId: event.id },
  create: { /* ... */ },
  update: { /* nichts - bereits vorhanden */ }
})
```

---

## 📱 Mobile Optimierung

### **Android Intent URL** (bereits implementiert)
```typescript
const intentUrl = `intent://cgi-bin/webscr?${params}#Intent;` +
  `scheme=https;` +
  `package=com.paypal.android.p2pmobile;` +
  `S.browser_fallback_url=${browserLink};` +
  `end`
```

### **iOS Universal Links** (geplant)
```typescript
const iosUrl = `https://www.paypal.com/cgi-bin/webscr?${params}`
// iOS erkennt automatisch PayPal-URLs und öffnet App
```

---

## 🧪 Testing-Strategie

### **Sandbox-Konten**

**PayPal Sandbox:**
- https://developer.paypal.com/dashboard
- Test-Käufer: `sb-buyer@personal.example.com`
- Test-Verkäufer: `sb-seller@business.example.com`
- Test-Geld: Unlimited

**Stripe Test-Modus:**
- Test-Kreditkarte: `4242 4242 4242 4242`
- Jede CVC, Zukunftsdatum
- Test-Daten: https://stripe.com/docs/testing

### **Test-Checklist**

- [ ] PayPal-Zahlung erfolgreich
- [ ] PayPal-Webhook empfangen
- [ ] Booking-Status auf PAID gesetzt
- [ ] Email an Kunde gesendet
- [ ] Email an Werkstatt gesendet
- [ ] Dashboard zeigt "BEZAHLT" Badge
- [ ] Kreditkarten-Zahlung (Stripe)
- [ ] Apple Pay funktioniert
- [ ] Google Pay funktioniert
- [ ] Fehlerfall: Zahlung abgelehnt
- [ ] Fehlerfall: Webhook-Signatur ungültig
- [ ] Mobile: Android Intent URL
- [ ] Mobile: iOS Universal Links

---

## 📈 Monitoring & Analytics

### **Payment-Metriken**

**Tracking in Dashboard:**
- Erfolgsrate pro Zahlungsmethode
- Durchschnittliche Zahlungsdauer
- Fehlerrate
- Beliebte Zahlungsmethoden
- Conversion-Rate (Buchung → Zahlung)

**Prisma Query:**
```typescript
const stats = await prisma.payment.groupBy({
  by: ['method', 'status'],
  _count: true,
  _sum: { amount: true }
})
```

### **Fehler-Logging**

```typescript
if (payment.status === 'FAILED') {
  await prisma.errorLog.create({
    data: {
      type: 'PAYMENT_FAILED',
      paymentId: payment.id,
      error: payment.metadata.error,
      context: { bookingId, workshopId }
    }
  })
}
```

---

## 🚀 Deployment-Checklist

### **Vor Produktiv-Start:**

**PayPal:**
- [ ] PayPal Business Account verifiziert
- [ ] App im Live-Modus erstellt
- [ ] Webhook URL registriert: `https://bereifung24.de/api/webhooks/paypal`
- [ ] Webhook Events aktiviert
- [ ] Environment-Variablen auf Live gesetzt

**Stripe:**
- [ ] Stripe-Konto verifiziert
- [ ] Connected Accounts aktiviert
- [ ] Webhook URL registriert: `https://bereifung24.de/api/webhooks/stripe`
- [ ] Test-Zahlungen erfolgreich
- [ ] Environment-Variablen auf Live gesetzt

**Datenbank:**
- [ ] Migration ausgeführt
- [ ] Backup erstellt
- [ ] Prisma Client neu generiert

**Email:**
- [ ] Templates getestet
- [ ] SMTP-Credentials korrekt
- [ ] Test-Emails versendet

**Security:**
- [ ] Webhook-Signatur-Verifizierung aktiv
- [ ] Rate Limiting implementiert
- [ ] HTTPS erzwungen
- [ ] API-Keys sicher gespeichert (Environment-Variablen)

---

## 📝 Benötigte Credentials

### **PayPal (für Phase 2)**
```env
PAYPAL_CLIENT_ID=           # Aus PayPal Developer Dashboard
PAYPAL_CLIENT_SECRET=       # Aus PayPal Developer Dashboard
PAYPAL_WEBHOOK_ID=          # Nach Webhook-Registration
PAYPAL_MODE=sandbox         # 'sandbox' oder 'live'
```

**Wo zu finden:**
1. Login: https://developer.paypal.com
2. Apps & Credentials
3. Create App (oder bestehende App)
4. Client ID + Secret kopieren

### **Stripe (für Phase 4)**
```env
STRIPE_SECRET_KEY=sk_live_...          # Aus Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_live_...     # Aus Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...        # Nach Webhook-Registration
```

**Wo zu finden:**
1. Login: https://dashboard.stripe.com
2. Developers → API keys
3. Keys kopieren

---

## 🎯 Priorisierung

### **Sofort (Diese Woche):**
1. ✅ Android Intent URL für PayPal (FERTIG)
2. 🔄 Phase 1: Payment-Schema (2-3h)
3. 🔄 Phase 2: PayPal Webhooks (1-2h)

### **Nächste Woche:**
4. Phase 3: UI-Erweiterung (1-2h)
5. Testing & Bugfixes (1h)

### **Später (wenn PayPal läuft):**
6. Phase 4: Stripe Integration (2-3h)
7. Phase 5: Klarna (1h)

---

## 💡 Wichtige Hinweise

### **TSA-Konformität gewährleisten:**
- ✅ Geld fließt IMMER direkt zur Werkstatt
- ✅ Bereifung24 wickelt KEINE Zahlungen ab
- ✅ Bereifung24 erhält nur Statusbenachrichtigungen
- ✅ Werkstatt-Konten müssen eigenständig sein

### **Rechtliche Aspekte:**
- AGB aktualisieren (Zahlungsbedingungen)
- Datenschutzerklärung erweitern (PayPal/Stripe)
- Widerrufsrecht bei Vorzahlung
- Rechnungsstellung durch Werkstatt

### **User Experience:**
- Klare Kommunikation über Zahlungsstatus
- Sofortige Bestätigung nach Zahlung
- Transparente Gebührenaufteilung
- Einfacher Vor-Ort-Zahlungs-Fallback

---

## 📞 Support-Workflow

**Bei Zahlungsproblemen:**

1. Kunde meldet Problem
2. Admin prüft Payment-Status im Dashboard
3. PayPal/Stripe Transaction-ID nachschlagen
4. Bei Bedarf: Manuell als bezahlt markieren
5. Email-Bestätigung nachsenden

**Admin-Tools benötigt:**
- Payment-Übersicht im Admin-Dashboard
- Manuelle Status-Änderung
- Email-Resend-Funktion
- Refund-Funktion (später)

---

## ✅ Nächste Schritte

**Nach dieser Dokumentation:**

1. User gibt grünes Licht
2. PayPal Credentials besorgen
3. Phase 1 + 2 implementieren (3-4h)
4. Testing in Sandbox
5. Live-Deployment
6. Monitoring

**Bereit zum Start!** 🚀

---

**Letzte Aktualisierung:** 30. Januar 2026  
**Version:** 1.0 (Initial Draft)  
**Status:** Warten auf Freigabe
