# GoCardless SEPA-Lastschrift Setup für Bereifung24

## Übersicht
Automatische monatliche Provisionsabrechnung per SEPA-Lastschrift über GoCardless.

## Installation

```bash
npm install gocardless-nodejs
```

## Umgebungsvariablen (.env)

```env
# GoCardless API
GOCARDLESS_ACCESS_TOKEN=your_access_token_here
GOCARDLESS_ENVIRONMENT=sandbox  # 'sandbox' für Test, 'live' für Production
GOCARDLESS_WEBHOOK_SECRET=your_webhook_secret_here
```

## Workflow

### 1. Workshop-Registrierung / SEPA-Einrichtung
- Workshop registriert sich auf der Plattform
- Workshop muss SEPA-Mandat in Einstellungen einrichten
- GoCardless Customer wird erstellt
- GoCardless Bank Account wird erstellt
- GoCardless Mandate wird erstellt (Kunde bestätigt)
- Mandate-Status wird in DB gespeichert

### 2. Buchung abgeschlossen
- Kunde bucht Termin und zahlt Werkstatt
- Commission-Eintrag wird erstellt (Status: PENDING)
- Provision wird berechnet: 4,9% vom Auftragswert

### 3. Monatliche Abrechnung (Cron-Job)
- Jeden Monat am 1. (oder konfigurierbares Datum)
- Alle PENDING Commissions des Vormonats werden gesammelt
- Pro Werkstatt wird eine GoCardless Payment erstellt
- Status ändert sich zu BILLED
- Werkstatt erhält E-Mail-Benachrichtigung

### 4. SEPA-Einzug
- GoCardless zieht Betrag automatisch ein (3-5 Werktage)
- Webhook informiert über erfolgreichen Einzug
- Status ändert sich zu COLLECTED
- Bei Fehler: Status FAILED

## API-Endpunkte

### Workshop-Sicht
- `GET /api/workshop/commissions` - Alle Provisionen abrufen
- `GET /api/workshop/sepa-mandate` - SEPA-Mandat-Status
- `POST /api/workshop/sepa-mandate/create` - SEPA-Mandat einrichten
- `GET /api/workshop/sepa-mandate/authorize` - GoCardless Authorization Flow

### Admin-Sicht
- `GET /api/admin/commissions` - Alle Provisionen aller Werkstätten
- `POST /api/admin/commissions/bill-month` - Monatliche Abrechnung auslösen
- `GET /api/admin/commissions/stats` - Statistiken
- `POST /api/admin/commissions/[id]/retry` - Fehlgeschlagene Zahlung wiederholen

### Webhooks
- `POST /api/webhooks/gocardless` - GoCardless Events empfangen

## Datenbank-Schema

### Workshop-Tabelle (erweitert)
- `gocardlessCustomerId` - GoCardless Customer ID
- `gocardlessMandateId` - GoCardless Mandate ID
- `gocardlessMandateStatus` - pending_submission, submitted, active, cancelled, failed
- `gocardlessMandateRef` - Eindeutige Referenz für SEPA-Mandat

### Commission-Tabelle (erweitert)
- `gocardlessPaymentId` - GoCardless Payment ID
- `gocardlessPaymentStatus` - pending_submission, submitted, confirmed, paid_out, failed
- `taxRate` - MwSt-Satz (19%)
- `taxAmount` - MwSt-Betrag
- `netAmount` - Nettobetrag
- `grossAmount` - Bruttobetrag
- `billingPeriodStart` - Abrechnungszeitraum Start
- `billingPeriodEnd` - Abrechnungszeitraum Ende

## Provision Berechnung

```
Auftragswert (Brutto): 200,00 €
Provision (4,9%):       9,80 €
─────────────────────────────
Netto (ohne MwSt):      8,24 €
MwSt (19%):             1,56 €
Brutto:                 9,80 €
```

## Rechtliche Hinweise

Auf Rechnungen muss stehen:
- "Vermittlungsprovision gem. §3 Abs. 11 UStG"
- "Plattformgebühr für vermittelte Dienstleistung"
- Zeitraum der vermittelten Aufträge
- Einzelauflistung aller Aufträge

## Cron-Job Setup

```bash
# In ecosystem.config.js oder separater Cron-Service
# Jeden Monat am 1. um 00:00 Uhr
0 0 1 * * node scripts/bill-monthly-commissions.js
```

## Testing (Sandbox)

1. GoCardless Sandbox Account erstellen
2. Test-IBAN verwenden: DE89370400440532013000
3. Mandate Status manuell auf "active" setzen
4. Test-Payments durchführen
5. Webhook-Events testen mit GoCardless Dashboard
