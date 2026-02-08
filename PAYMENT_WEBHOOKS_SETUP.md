# Payment Webhooks Setup Guide

## ✅ **Status: IMPLEMENTIERT**

Beide Webhooks (Stripe & PayPal) sind bereits implementiert und funktionieren mit Direct Payments!

---

## 🔔 **Wie Webhooks funktionieren**

### **Flow:**
```
1. Kunde zahlt bei Stripe/PayPal
   ↓
2. Zahlung geht DIREKT an Werkstatt
   ↓
3. Stripe/PayPal sendet Webhook an euren Server
   ↓
4. Webhook-Handler aktualisiert Booking-Status
   ↓
5. Termin wird automatisch bestätigt ✅
```

**Wichtig:** Webhooks kommen **sofort** nach erfolgreicher Zahlung (meist innerhalb 1-2 Sekunden)!

---

## 🎯 **Stripe Webhook Setup**

### **1. Webhook-Endpoint aktivieren**
URL: `https://bereifung24.de/api/webhooks/stripe`

### **2. Im Stripe Dashboard:**
1. Gehe zu: https://dashboard.stripe.com/webhooks
2. Klick auf "+ Add endpoint"
3. Trage ein:
   - **Endpoint URL:** `https://bereifung24.de/api/webhooks/stripe`
   - **Events to send:**
     - ✅ `checkout.session.completed`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `charge.refunded`
4. Klick auf "Add endpoint"
5. **WICHTIG:** Kopiere das **Signing Secret** (beginnt mit `whsec_...`)

### **3. Signing Secret in Datenbank speichern:**
1. Gehe zu: https://bereifung24.de/admin/api-settings
2. Füge neuen Eintrag hinzu:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (dein Signing Secret)

### **4. Test:**
Im Stripe Dashboard unter Webhooks → Klick auf deinen Webhook → Tab "Send test webhook"
- Wähle Event: `checkout.session.completed`
- Klick "Send test webhook"
- ✅ Status sollte "200 OK" sein

---

## 💙 **PayPal Webhook Setup**

### **1. Webhook-Endpoint aktivieren**
URL: `https://bereifung24.de/api/webhooks/paypal`

### **2. Im PayPal Dashboard:**
1. Gehe zu: https://developer.paypal.com/dashboard/webhooks
2. Klick auf "Add Webhook"
3. Trage ein:
   - **Webhook URL:** `https://bereifung24.de/api/webhooks/paypal`
   - **Event types:**
     - ✅ `PAYMENT.CAPTURE.COMPLETED`
     - ✅ `PAYMENT.CAPTURE.DENIED`
     - ✅ `PAYMENT.CAPTURE.REFUNDED`
4. Klick auf "Save"
5. **WICHTIG:** Kopiere die **Webhook ID** (beginnt mit `WH-...`)

### **3. Webhook ID in Datenbank speichern:**
1. Gehe zu: https://bereifung24.de/admin/api-settings
2. Füge neuen Eintrag hinzu (falls noch nicht vorhanden):
   - **Key:** `PAYPAL_WEBHOOK_ID`
   - **Value:** `WH-...` (deine Webhook ID)

### **4. Test:**
Im PayPal Dashboard unter Webhooks → Klick auf deinen Webhook → "Simulate message"
- Wähle Event: `PAYMENT.CAPTURE.COMPLETED`
- Klick "Send Message"
- ✅ Status sollte "200 OK" sein

---

## 📊 **Was passiert bei Zahlung?**

### **Stripe (Kreditkarte):**
```
1. Kunde klickt "Zahlen" → Stripe Checkout öffnet sich
2. Kunde gibt Kreditkartendaten ein
3. Zahlung wird verarbeitet
4. Geld geht DIREKT an Werkstatt (100%)
5. Stripe sendet Webhook: checkout.session.completed
6. Server empfängt Webhook:
   ✅ DirectBooking-Status → CONFIRMED
   ✅ PaymentStatus → PAID
   ✅ Email an Kunde & Werkstatt
```

### **PayPal (inkl. Ratenzahlung):**
```
1. Kunde klickt "PayPal" → PayPal-Login öffnet sich
2. Kunde meldet sich an und bestätigt
3. Zahlung wird verarbeitet
4. Geld geht DIREKT an Werkstatt (100%)
5. PayPal sendet Webhook: PAYMENT.CAPTURE.COMPLETED
6. Server empfängt Webhook:
   ✅ DirectBooking-Status → CONFIRMED
   ✅ PaymentStatus → PAID
   ✅ Email an Kunde & Werkstatt
```

---

## 🔍 **Webhook-Logs checken**

### **Server-Logs ansehen:**
```bash
ssh root@167.235.24.110
pm2 logs bereifung24 --lines 100 | grep "Webhook"
```

### **Was du sehen solltest:**
```
📬 Stripe Webhook received: checkout.session.completed
✅ Checkout completed: cs_test_...
✅ DirectBooking created: clxxx...
✅ Payment confirmed for booking
```

### **Bei PayPal:**
```
📬 PayPal Webhook received: PAYMENT.CAPTURE.COMPLETED
✅ Payment recorded: clxxx...
✅ Booking updated: clxxx...
```

---

## ⚠️ **Wichtige Hinweise**

### **1. Webhook Security:**
- ✅ Beide Webhooks verwenden **Signature Verification**
- ✅ Nur echte Requests von Stripe/PayPal werden akzeptiert
- ✅ Fake-Requests werden abgelehnt (401 Unauthorized)

### **2. Idempotenz:**
- ✅ Webhooks können mehrfach gesendet werden
- ✅ Code ist idempotent (mehrfache Ausführung = kein Problem)
- ✅ Bookings werden nicht doppelt erstellt

### **3. Retry-Mechanismus:**
- Stripe: Versucht es 3 Tage lang (exponentielles Backoff)
- PayPal: Versucht es 10x über 24 Stunden
- **Wichtig:** Server muss 200 OK zurückgeben!

### **4. Testing:**
- ✅ Verwende Stripe/PayPal Test-Mode für Tests
- ✅ Webhooks funktionieren auch im Test-Mode
- ✅ Live-Mode erst aktivieren wenn alles funktioniert

---

## 🚀 **Zusammenfassung**

### **Aktueller Status:**
- ✅ Stripe Webhook implementiert: `/api/webhooks/stripe`
- ✅ PayPal Webhook implementiert: `/api/webhooks/paypal`
- ✅ Beide unterstützen Direct Payments
- ✅ Automatische Termin-Bestätigung funktioniert
- ⚠️ **TODO:** Webhook Secrets in Admin-Panel eintragen

### **Was ihr noch tun müsst:**
1. ✅ Stripe Connect aktivieren (siehe STRIPE_CONNECT_SETUP.md)
2. ⚠️ Stripe Webhook Secret eintragen
3. ⚠️ PayPal Webhook ID eintragen
4. ✅ Test-Zahlungen durchführen
5. ✅ Logs checken ob Webhooks ankommen

### **Dokumentation:**
- Stripe Webhooks: https://stripe.com/docs/webhooks
- PayPal Webhooks: https://developer.paypal.com/api/rest/webhooks/

---

## 📞 **Support**

Bei Problemen mit Webhooks:
1. Check PM2 Logs: `pm2 logs bereifung24`
2. Check Stripe Dashboard → Webhooks → Event Details
3. Check PayPal Dashboard → Webhooks → Recent Deliveries
4. Kontaktiere mich falls Webhook-Status != 200
