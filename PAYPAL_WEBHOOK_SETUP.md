# 🎯 PayPal Webhook Setup - Schritt für Schritt

## ✅ Was ist bereits implementiert

1. **Webhook-Endpoint:** `https://bereifung24.de/api/webhooks/paypal`
2. **Automatische Verarbeitung:**
   - Zahlung bestätigt → Booking-Status: PAID
   - Zahlung fehlgeschlagen → Booking-Status: FAILED
   - Rückerstattung → Booking-Status: REFUNDED
3. **Email-Benachrichtigungen:**
   - Kunde erhält Zahlungsbestätigung
   - Werkstatt erhält Benachrichtigung über eingegangene Zahlung
4. **Sicherheit:** Signature-Verifizierung aller Webhooks

---

## 📋 Setup im PayPal Developer Dashboard

### Schritt 1: PayPal Developer Dashboard öffnen

1. Gehe zu: https://developer.paypal.com/dashboard/
2. Login mit PayPal Business Account
3. Wähle **"Apps & Credentials"**

### Schritt 2: App auswählen/erstellen

1. Wähle **"Sandbox"** (für Tests) oder **"Live"** (für Produktion)
2. Wenn noch keine App existiert:
   - Klicke **"Create App"**
   - Name: `Bereifung24`
   - App Type: **Merchant**
3. Klicke auf die App

### Schritt 3: API Credentials kopieren

1. Kopiere **Client ID**
2. Kopiere **Secret** (Show → Copy)
3. Trage in `.env` ein:
   ```env
   PAYPAL_CLIENT_ID=AYour_Client_ID_Here
   PAYPAL_CLIENT_SECRET=Your_Secret_Here
   ```

### Schritt 4: Webhook erstellen

1. Scrolle zu **"Webhooks"** → Klicke **"Add Webhook"**
2. **Webhook URL:** `https://bereifung24.de/api/webhooks/paypal`
3. **Event types:** Wähle folgende Events:
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `PAYMENT.CAPTURE.DENIED`
   - ✅ `PAYMENT.CAPTURE.REFUNDED`
4. Klicke **"Save"**

### Schritt 5: Webhook-ID kopieren

1. Nach dem Speichern siehst du eine **Webhook-ID** (Format: `WH-xxxxx`)
2. Trage in `.env` ein:
   ```env
   PAYPAL_WEBHOOK_ID=WH-xxxxx
   ```

### Schritt 6: API URL konfigurieren

```env
# Sandbox (für Tests)
PAYPAL_API_URL=https://api-m.sandbox.paypal.com

# Live (Produktion)
PAYPAL_API_URL=https://api-m.paypal.com
```

---

## 🧪 Webhook testen

### Option 1: PayPal Webhook Simulator

1. Im Developer Dashboard → **"Webhooks"**
2. Wähle den Webhook
3. Klicke **"Webhook events simulator"**
4. Wähle Event-Type: `PAYMENT.CAPTURE.COMPLETED`
5. Klicke **"Send test"**
6. Prüfe Logs: `pm2 logs bereifung24`

### Option 2: Echte Testzahlung

1. Verwende PayPal Sandbox Test-Accounts
2. Erstelle eine Buchung
3. Zahle mit Test-Buyer-Account
4. Prüfe:
   - ✅ Booking-Status wurde auf PAID aktualisiert
   - ✅ Email an Kunde gesendet
   - ✅ Email an Werkstatt gesendet
   - ✅ Payment-Record in Datenbank erstellt

---

## 🔍 Debugging

### Webhook-Logs prüfen

```bash
# Live-Logs anzeigen
pm2 logs bereifung24

# Letzte 50 Zeilen
pm2 logs bereifung24 --lines 50 --nostream

# Nur Fehler
pm2 logs bereifung24 --err
```

### Was zu suchen:

- ✅ `📬 PayPal Webhook received: PAYMENT.CAPTURE.COMPLETED`
- ✅ `✅ PayPal signature verified`
- ✅ `✅ Payment recorded: cml...`
- ✅ `✅ Booking updated: cml...`
- ✅ `✅ Payment confirmation emails sent`

### Häufige Fehler:

**❌ Invalid signature**
- Prüfe: `PAYPAL_WEBHOOK_ID` korrekt in `.env`
- Prüfe: Webhook-URL ist HTTPS (nicht HTTP)

**❌ No custom_id found**
- Problem: PayPal-Integration sendet keine Booking-ID
- Lösung: Bei PayPal-Zahlung muss `custom_id` mitgegeben werden

**❌ Booking not found**
- Problem: Booking-ID existiert nicht in Datenbank
- Prüfe: custom_id stimmt mit tatsächlicher Booking-ID überein

---

## 🔐 Sicherheit

### Signature-Verifizierung

Die Webhook-Route verifiziert IMMER die PayPal-Signatur:
- Verhindert gefälschte Webhooks
- Nutzt PayPal's Public Certificate
- RSA SHA-256 Algorithmus

### Deaktivierung (nur für lokales Testing!)

```env
PAYPAL_WEBHOOK_VERIFY=false
```

⚠️ **NIE in Produktion verwenden!**

---

## 📊 Status-Übersicht

### Booking Payment Status

- `PENDING` - Warten auf Zahlung
- `PAID` - Zahlung bestätigt ✅
- `FAILED` - Zahlung fehlgeschlagen ❌
- `REFUNDED` - Rückerstattung erfolgt 💸

### Payment Record Status

- `PENDING` - Erstellt, warte auf Bestätigung
- `COMPLETED` - Erfolgreich abgeschlossen
- `FAILED` - Fehlgeschlagen
- `REFUNDED` - Zurückerstattet
- `CANCELLED` - Storniert

---

## 🎉 Nächste Schritte

Nach erfolgreicher PayPal-Integration:

1. **Frontend-Integration:**
   - PayPal-Button bei Buchung einbauen
   - Zahlungsauswahl-Seite erstellen
   
2. **Stripe Integration:**
   - Kreditkarte, Apple Pay, Google Pay
   - Ähnlicher Webhook-Flow wie PayPal
   
3. **Dashboard-Erweiterung:**
   - Payment-History anzeigen
   - Rückerstattungen verwalten

---

## 📞 Support

Bei Problemen:
1. Prüfe PM2-Logs: `pm2 logs bereifung24`
2. Prüfe PayPal Developer Dashboard → Webhooks → "Recent deliveries"
3. Teste mit Webhook-Simulator
4. Prüfe Datenbank: `SELECT * FROM payments ORDER BY "createdAt" DESC LIMIT 10;`
