# Payment Testing Plan - 10. Februar 2026

## Problem: 6 Buchungen blieben PENDING trotz möglicher Zahlung

### Phase 1: Webhook-Logs analysieren
```bash
# 1. Prüfe ob Stripe Webhooks ankamen (11:02 - 11:03 Uhr)
ssh root@167.235.24.110 "pm2 logs bereifung24 --lines 1000 --nostream | grep -E '2026-02-10.*11:0[2-3].*stripe|webhook.*checkout.session.completed'"

# 2. Prüfe Fehler in Webhook-Handler
ssh root@167.235.24.110 "pm2 logs bereifung24 --err --lines 500 --nostream | grep -B 5 -A 5 'stripe\|webhook'"
```

### Phase 2: Payment Success Routes prüfen
Relevante Dateien:
- `app/api/webhooks/stripe/route.ts` - Stripe Webhook Handler
- `app/api/customer/direct-booking/confirm/route.ts` - PayPal Success
- `app/api/customer/direct-booking/success/route.ts` - Success Page

**Prüfen:**
1. Werden Bookings korrekt auf PAID gesetzt?
2. Fehlerbehandlung bei DB-Updates?
3. Logging vorhanden?

### Phase 3: Database Check
```javascript
// Prüfe alle 6 PENDING Buchungen
const pendingBookings = [
  'cmlghre0l00068niqcl5u8zmc',
  'cmlghri9200098niqrzuu29in',
  'cmlghrmmu000c8niq3atpl56y',
  'cmlghrtl1000f8niqi89dgiwi',
  'cmlghs06e000i8niq83upovw2',
  'cmlghs3qt000k8niq8iibv4vc'
]

// Für jede Buchung prüfen:
// - Stripe Session ID vorhanden?
// - Stripe Payment ID?
// - Wann auf CANCELLED gesetzt?
// - Warum CANCELLED?
```

### Phase 4: Stripe Dashboard prüfen
1. Login: https://dashboard.stripe.com
2. Suche Sessions von 10. Feb 11:02-11:03 Uhr
3. Status: completed, expired, oder open?
4. Webhook-Events: Wurden gesendet?

### Phase 5: Test-Buchung mit Logging
1. Temporäres intensives Logging hinzufügen:
   - Webhook-Empfang
   - DB-Update-Schritte
   - Fehler mit Stack Trace

2. Test-Buchung durchführen:
   - Mit Stripe Testmodus
   - Erfolgreiche Zahlung
   - Logs in Echtzeit verfolgen

3. Verifizieren:
   - Webhook kam an
   - Status wurde auf PAID gesetzt
   - Email wurde versendet
   - Buchung ist sichtbar

### Phase 6: Fixes implementieren
Nach Identifikation der Ursache(n):
- [ ] Customer ID Bug (reserve API)
- [ ] Webhook Handler Fehler
- [ ] Status Update Logik
- [ ] Error Handling verbessern

### Test-Szenarien
1. **Normale Zahlung**: Kunde bezahlt vollständig
2. **Abgebrochene Zahlung**: Kunde bricht bei Stripe ab
3. **Fehlgeschlagene Zahlung**: Kreditkarte abgelehnt
4. **Timeout**: Stripe Session läuft ab (30 min)
5. **Webhook Retry**: Stripe sendet mehrmals bei Fehler

## Nächste Schritte
1. Script erstellen: Prüfe alle 6 PENDING Buchungen auf Stripe Session Details
2. Webhook-Logs durchsuchen für 11:02 Uhr
3. Stripe Dashboard manuell prüfen
4. Test-Buchung mit detailliertem Logging
