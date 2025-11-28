# GoCardless SEPA-Lastschrift Integration

## Übersicht

Diese Integration ermöglicht die automatische Abrechnung der Provisionen (4,9% des Umsatzes) von Werkstätten über SEPA-Lastschrift.

## Features

✅ **SEPA-Lastschrift-Mandat**: Werkstätten können ein SEPA-Mandat einrichten
✅ **Automatische Abrechnung**: Monatliche Provisionsabrechnung am 1. des Monats
✅ **Steuerberechnung**: Automatische Berechnung von Netto, Brutto und MwSt (19%)
✅ **Rechnungsverwaltung**: Automatische Rechnungsnummern-Generierung
✅ **Admin-Dashboard**: Übersicht aller Provisionen mit Steueraufschlüsselung
✅ **Webhook-Integration**: Echtzeit-Updates zu Zahlungsstatus
✅ **Detaillierte Berichte**: Pro Werkstatt und Abrechnungszeitraum

## Workflow

### 1. Werkstatt richtet SEPA-Mandat ein

```
Werkstatt → Einstellungen → SEPA-Lastschrift einrichten
            → Weiterleitung zu GoCardless
            → Bankdaten eingeben
            → Mandat bestätigen
            → Zurück zu Bereifung24
```

**API Endpoints:**
- `POST /api/workshop/sepa-mandate/create` - Erstellt Redirect Flow
- `POST /api/workshop/sepa-mandate/complete` - Vervollständigt Mandat nach Redirect
- `GET /api/workshop/sepa-mandate/status` - Prüft Mandat-Status

### 2. Kunde bucht Service

Normale Buchung läuft wie gewohnt. Die Provision wird in der `Commission` Tabelle gespeichert mit Status `PENDING`.

### 3. Monatliche Abrechnung

Am 1. jeden Monats läuft ein Cron-Job:

```bash
# Crontab entry
0 2 1 * * cd /root/Bereifung24\ Workspace && npx ts-node scripts/monthly-billing.ts
```

Der Job:
1. Sammelt alle Buchungen des Vormonats pro Werkstatt
2. Berechnet Gesamtprovision mit Steueraufschlüsselung
3. Erstellt GoCardless Payment für jede Werkstatt
4. Speichert Rechnungsnummer und Payment-ID

**API Endpoint:**
- `POST /api/admin/commissions/bill-month` - Manuelle Abrechnung für einen bestimmten Monat

### 4. SEPA-Einzug

GoCardless zieht die Provision automatisch 3 Tage nach Erstellung ein.

### 5. Webhook-Updates

GoCardless sendet Webhook-Benachrichtigungen bei Status-Änderungen:

- `mandates.active` - Mandat ist aktiv
- `payments.confirmed` - Zahlung bestätigt
- `payments.paid_out` - Geld überwiesen
- `payments.failed` - Zahlung fehlgeschlagen

**API Endpoint:**
- `POST /api/webhooks/gocardless` - Webhook Handler

## Datenbank Schema

### Workshop Erweiterungen

```prisma
model Workshop {
  // ... existing fields
  
  // GoCardless SEPA
  gocardlessCustomerId       String?   @unique
  gocardlessMandateId        String?   @unique
  gocardlessMandateStatus    String?
  gocardlessMandateRef       String?   @unique
  gocardlessMandateCreatedAt DateTime?
  gocardlessBankAccountId    String?
}
```

### Commission Erweiterungen

```prisma
model Commission {
  // ... existing fields
  
  // Tax calculation
  taxRate        Float    @default(19.0)
  taxAmount      Float?
  netAmount      Float?
  grossAmount    Float?
  
  // Billing period
  billingPeriodStart DateTime?
  billingPeriodEnd   DateTime?
  billingMonth       Int?
  billingYear        Int?
  
  // GoCardless
  gocardlessPaymentId     String?   @unique
  gocardlessPaymentStatus String?
  gocardlessChargeDate    DateTime?
  gocardlessPayoutId      String?
  
  // Invoice
  invoiceNumber  String?   @unique
  invoiceUrl     String?
  invoiceSentAt  DateTime?
  
  @@index([workshopId, status])
  @@index([billingMonth, billingYear])
  @@index([gocardlessPaymentId])
}
```

## Environment Variables

```env
# GoCardless (SEPA Direct Debit)
GOCARDLESS_ACCESS_TOKEN="sandbox_xxx"  # Get from GoCardless Dashboard
GOCARDLESS_ENVIRONMENT="sandbox"       # or "live" for production
GOCARDLESS_WEBHOOK_SECRET="your-secret" # Generate in webhook settings
```

## Installation

### 1. Install Package

```bash
npm install gocardless-nodejs
```

### 2. Database Migration

```bash
npx prisma migrate deploy
```

### 3. Configure Environment Variables

Füge die GoCardless Credentials zur `.env` Datei hinzu.

### 4. Setup Webhook

1. Gehe zu [GoCardless Dashboard](https://manage.gocardless.com/developers/webhooks)
2. Erstelle neuen Webhook mit URL: `https://bereifung24.de/api/webhooks/gocardless`
3. Kopiere das Secret in `GOCARDLESS_WEBHOOK_SECRET`

### 5. Setup Cron Job

```bash
crontab -e
```

Füge hinzu:
```bash
# Monthly billing - runs at 2 AM on the 1st of each month
0 2 1 * * cd /root/Bereifung24\ Workspace && npx ts-node scripts/monthly-billing.ts >> /var/log/monthly-billing.log 2>&1
```

## Testing

### Sandbox Mode

GoCardless bietet einen Sandbox-Modus zum Testen:

1. Erstelle Sandbox Account: https://manage-sandbox.gocardless.com/
2. Nutze `sandbox_` Access Token
3. Teste mit Sandbox Bank Details

### Test SEPA-Mandat

1. Login als Werkstatt
2. Gehe zu Einstellungen → SEPA-Lastschrift
3. Klicke "SEPA-Mandat einrichten"
4. Nutze Test-IBAN: `DE89370400440532013000`

### Test Monatliche Abrechnung

```bash
# Als Admin API-Call
curl -X POST https://bereifung24.de/api/admin/commissions/bill-month \
  -H "Content-Type: application/json" \
  -d '{"year": 2024, "month": 1}'
```

## Admin Dashboard

Der Admin kann alle Provisionen einsehen:

```
GET /api/admin/commissions/stats
```

**Query Parameters:**
- `year` - Filter nach Jahr
- `month` - Filter nach Monat
- `workshopId` - Filter nach Werkstatt

**Response:**
```json
{
  "totals": {
    "count": 150,
    "grossAmount": 1470.00,
    "netAmount": 1235.29,
    "taxAmount": 234.71,
    "byStatus": {
      "PENDING": { "count": 50, "grossAmount": 490.00 },
      "COLLECTED": { "count": 100, "grossAmount": 980.00 }
    }
  },
  "byWorkshop": [
    {
      "workshop": { "id": "...", "name": "AutoFit München" },
      "totals": {
        "count": 25,
        "grossAmount": 245.00,
        "netAmount": 205.88,
        "taxAmount": 39.12,
        "totalRevenue": 5000.00
      }
    }
  ],
  "byPeriod": [
    {
      "period": "2024-01",
      "year": 2024,
      "month": 1,
      "count": 50,
      "grossAmount": 490.00,
      "workshopsCount": 10
    }
  ]
}
```

## Provisionsberechnung

**Beispiel:**
- Auftragswert: €200,00
- Provision (4,9%): €9,80 (brutto)
- Netto: €8,24
- MwSt (19%): €1,56

**Formel:**
```
Brutto = Auftragswert × 0.049
Netto = Brutto / 1.19
MwSt = Brutto - Netto
```

## Rechtliche Hinweise

### Rechnungsstellung

Jede Rechnung muss enthalten:
- Rechnungsnummer (Format: `RE-YYYY-MM-XXXX`)
- Leistungszeitraum
- Aufschlüsselung: Netto, MwSt (19%), Brutto
- Hinweis: "Provision als Vermittler gemäß § 4 Nr. 14 UStG"
- SEPA-Lastschriftmandat-Referenz

### SEPA-Lastschrift

- Pre-Notification: 14 Tage vor Einzug (GoCardless sendet automatisch)
- Mandate Reference: Eindeutige Referenznummer
- Widerrufsrecht: 8 Wochen nach Einzug

## Support

### GoCardless Status

Status-Übersicht: https://gocardless.com/status/

### Logs

```bash
# Application logs
pm2 logs bereifung24-app

# Monthly billing logs
tail -f /var/log/monthly-billing.log

# Database migrations
cat /root/Bereifung24\ Workspace/prisma/migrations/*/migration.sql
```

### Häufige Fehler

**1. "Mandate not active"**
- Mandat muss erst von GoCardless aktiviert werden (1-2 Werktage)
- Prüfe Status: `GET /api/workshop/sepa-mandate/status`

**2. "Payment failed"**
- Unzureichende Deckung
- Mandat widerrufen
- Bankkonto geschlossen
→ Webhook sendet `payments.failed` Event

**3. "Webhook signature invalid"**
- `GOCARDLESS_WEBHOOK_SECRET` in `.env` prüfen
- Secret aus GoCardless Dashboard muss übereinstimmen

## Production Checklist

- [ ] GoCardless Live Account erstellt
- [ ] Live Access Token in `.env` eingetragen
- [ ] `GOCARDLESS_ENVIRONMENT="live"` gesetzt
- [ ] Webhook URL konfiguriert
- [ ] Webhook Secret in `.env` eingetragen
- [ ] Cron Job eingerichtet
- [ ] Test-Mandat in Sandbox erfolgreich
- [ ] Test-Payment in Sandbox erfolgreich
- [ ] Erstes Live-Mandat mit Test-Werkstatt erstellt
- [ ] Monitoring für fehlgeschlagene Payments eingerichtet

## Nächste Schritte

1. **Invoice PDF Generation**: Automatische Rechnungs-PDF Erstellung
2. **Email Notifications**: Benachrichtigungen bei erfolgreichen/fehlgeschlagenen Zahlungen
3. **Admin UI**: Dashboard für Provisionsverwaltung
4. **Workshop Commission View**: Detaillierte Provisionsübersicht für Werkstätten
5. **Refund Handling**: Stornierungen und Rückerstattungen

## Lizenz & Credits

- GoCardless Node.js SDK: https://github.com/gocardless/gocardless-nodejs
- GoCardless API Docs: https://developer.gocardless.com/
