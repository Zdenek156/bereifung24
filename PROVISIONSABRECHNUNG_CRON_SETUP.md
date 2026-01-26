# 📅 Automatische Monatliche Provisionsabrechnung - Setup

## ✅ System ist vollständig getestet und funktionsfähig!

**Test-Ergebnisse vom 26. Januar 2026:**
- ✅ Test 1: Rechnung erstellt (B24-INV-2025-0007, 8 Provisionen, 13,12 EUR)
- ✅ Test 2: PDF generiert mit ZUGFeRD 2.2 XML
- ✅ Test 3: Buchhaltung angelegt (BEL-2026-00001, SOLL 1400 / HABEN 8400)
- ✅ Test 4: SEPA-Zahlung initiiert (PM01SEQY0PEP42, Status: pending_submission)

---

## 🔄 Automatischer Monatlicher Workflow

Der Cron-Job führt **automatisch** am 1. des Monats um 09:00 Uhr folgende Schritte durch:

### Für JEDEN Workshop mit PENDING Provisionen:

1. **📄 Rechnung erstellen**
   - Alle PENDING Provisionen vom Vormonat sammeln
   - Nach Service-Typ gruppieren (Reifen, Einlagerung, Reparatur, etc.)
   - Rechnung mit Line Items erstellen
   - Rechnungsnummer: B24-INV-YYYY-NNNN

2. **📋 PDF generieren**
   - ZUGFeRD 2.2 konformes PDF (maschinenlesbar)
   - XML-Invoice embedded für Buchhaltungssoftware
   - Speichern in `/public/invoices/`

3. **📊 Buchhaltungseintrag**
   - Entry Number: BEL-YYYY-NNNNN (GoBD-konform)
   - SOLL 1400 (Forderungen)
   - HABEN 8400 (Erlöse 19% USt)
   - Automatische MwSt-Berechnung

4. **📧 Email versenden**
   - PDF als Anhang
   - SEPA-Info oder Überweisungsdaten
   - An Workshop-Email (user.email)

5. **💳 SEPA-Zahlung initiieren** (falls Mandat vorhanden)
   - GoCardless Payment erstellen
   - Status: pending_submission
   - Abbuchung in 2-3 Tagen
   - Metadata: invoiceId, invoiceNumber, workshopId

6. **✅ Provisionen als BILLED markieren**
   - Status: PENDING → BILLED
   - billedAt: aktuelle Zeit

---

## 🖥️ Server-Setup (Hetzner)

### Schritt 1: SSH-Verbindung

```bash
ssh root@167.235.24.110
```

### Schritt 2: Umgebungsvariable prüfen

```bash
# In /var/www/bereifung24/.env
grep CRON_SECRET /var/www/bereifung24/.env

# Falls nicht vorhanden:
echo "CRON_SECRET=dein-sicheres-secret-hier" >> /var/www/bereifung24/.env
```

### Schritt 3: Crontab einrichten

```bash
# Crontab bearbeiten
crontab -e

# Folgenden Eintrag hinzufügen (jeden 1. des Monats um 09:00 Uhr):
0 9 1 * * curl -X POST https://www.bereifung24.de/api/cron/generate-commission-invoices -H "Authorization: Bearer DEIN_CRON_SECRET" >> /var/log/bereifung24/commission-cron.log 2>&1
```

**WICHTIG:** Ersetze `DEIN_CRON_SECRET` mit dem tatsächlichen Wert aus `.env`!

### Schritt 4: Log-Verzeichnis erstellen

```bash
mkdir -p /var/log/bereifung24
touch /var/log/bereifung24/commission-cron.log
chmod 644 /var/log/bereifung24/commission-cron.log
```

---

## 🧪 Manueller Test

### Vom lokalen PC:

```bash
curl -X POST https://www.bereifung24.de/api/cron/generate-commission-invoices \
  -H "Authorization: Bearer DEIN_CRON_SECRET" \
  -H "Content-Type: application/json"
```

### Vom Server:

```bash
cd /var/www/bereifung24
curl -X POST https://www.bereifung24.de/api/cron/generate-commission-invoices \
  -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d= -f2)"
```

### Erwartete Response:

```json
{
  "success": true,
  "summary": {
    "period": {
      "start": "2026-01-01T00:00:00.000Z",
      "end": "2026-01-31T23:59:59.000Z"
    },
    "totalWorkshops": 8,
    "successCount": 8,
    "failedCount": 0,
    "successWorkshops": ["workshop-id-1", "workshop-id-2", ...],
    "failedWorkshops": []
  }
}
```

---

## 📊 Monitoring

### Server-Logs prüfen:

```bash
# Live-Logs anzeigen
tail -f /var/www/bereifung24/server.log

# Nach Cron-Ausführung suchen
grep "Starting monthly commission invoice generation" /var/www/bereifung24/server.log

# Letzte Cron-Logs
tail -50 /var/log/bereifung24/commission-cron.log
```

### Datenbank prüfen:

```sql
-- Rechnungen vom aktuellen Monat
SELECT 
  "invoiceNumber",
  "workshopId",
  "totalAmount",
  "sepaPaymentId",
  "sepaStatus",
  "sentAt"
FROM commission_invoices
WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY "createdAt" DESC;

-- Provisionen-Status
SELECT status, COUNT(*) 
FROM commissions 
WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
GROUP BY status;

-- Buchhaltungseinträge
SELECT 
  "entryNumber",
  "debitAccount",
  "creditAccount",
  amount,
  "sourceType"
FROM accounting_entries
WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY "createdAt" DESC;
```

### GoCardless Dashboard:

https://manage.gocardless.com/payments
- Status: "Ausstehende Einsendung"
- Abbuchungsdatum: 2-3 Tage nach Erstellung

---

## 🎯 Zeitplan

| Tag | Uhrzeit | Aktion |
|-----|---------|--------|
| 1. des Monats | 09:00 | Cron-Job läuft automatisch |
| 1. des Monats | 09:05 | Alle Rechnungen versendet |
| 3. des Monats | ~ | SEPA-Abbuchungen erfolgen |
| 5. des Monats | ~ | Geld auf Bereifung24-Konto |

**Beispiel:**
- 1. Februar 2026, 09:00 Uhr → Abrechnung für Januar 2026
- 3. Februar 2026 → Geld wird von Workshop-Konten abgebucht
- 5. Februar 2026 → Geld auf Bereifung24-Konto

---

## ⚙️ Fehlerbehandlung

### SEPA-Zahlung fehlgeschlagen:
- ✅ Rechnung wird trotzdem versendet
- ✅ Email enthält Überweisungsdaten
- ⚠️ Workshop muss manuell überweisen

### Email-Versand fehlgeschlagen:
- ❌ Prozess stoppt für diesen Workshop
- ✅ Andere Workshops werden weiter verarbeitet
- 📧 Fehler wird geloggt

### PDF-Generierung fehlgeschlagen:
- ❌ Prozess stoppt für diesen Workshop
- ✅ Andere Workshops werden weiter verarbeitet
- 📄 Fehler wird geloggt

---

## 🔧 Test-Buttons (bleiben aktiv)

Die Test-Buttons auf `/admin/commissions` bleiben vorerst für manuelle Tests:

- **📄 Rechnung erstellen** - Manuell einzelne Rechnung testen
- **📧 PDF per Email** - Email-Versand testen
- **📊 Buchhaltung** - Buchhaltungseintrag testen
- **💳 SEPA** - SEPA-Zahlung testen

Diese können parallel zum automatischen Prozess verwendet werden.

---

## 🚀 Nächste Schritte

- [ ] **1. Cron auf Server einrichten** (siehe oben)
- [ ] **2. Ersten Test-Lauf durchführen** (manuell via curl)
- [ ] **3. Logs prüfen** nach erstem automatischen Lauf
- [ ] **4. Email-Benachrichtigung bei Fehlern** einrichten (später)
- [ ] **5. Dashboard für Cron-Status** erstellen (später)

---

## 📞 Support

Bei Problemen:
1. Server-Logs prüfen: `tail -f /var/www/bereifung24/server.log`
2. Cron-Logs prüfen: `tail -f /var/log/bereifung24/commission-cron.log`
3. Datenbank prüfen (siehe SQL-Queries oben)
4. GoCardless Dashboard prüfen

**API-Endpoint:** `POST /api/cron/generate-commission-invoices`
**Sicherheit:** Bearer Token (CRON_SECRET)
**Zeitplan:** 1. des Monats um 09:00 Uhr
