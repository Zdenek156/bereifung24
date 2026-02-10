# Email Anti-Spam Maßnahmen für bereifung24.de

## Problem
Hetzner hat am 10.02.2026 um 16:22 das Email-Passwort geändert wegen "Spammailversand".
Grund: Viele Test-Buchungen während Debugging (mehrere Emails pro Minute an gleiche Empfänger).

## Sofortmaßnahmen (✅ Implementiert)

### 1. Rate Limiting
- **Datei:** `lib/email-rate-limiter.ts`
- **Limit:** Max 5 Buchungs-Emails pro Stunde pro Empfänger
- **Effekt:** Verhindert schnelle Email-Bursts die als Spam erkannt werden

**Test:**
```bash
# Nach 5 Buchungen in 1 Stunde wird geblockt
[EMAIL RATE LIMIT] Blocked email to customer@example.com (5/5 emails sent)
```

## Langfristige Lösungen (Noch zu tun)

### 2. SPF-Record setzen ⚠️ WICHTIG
SPF (Sender Policy Framework) authorisiert Hetzner-Server zum Versand.

**Aktion:** DNS-Eintrag bei Domain-Provider (wo bereifung24.de gehostet ist) hinzufügen:

```
Type: TXT
Name: bereifung24.de (oder @)
Value: v=spf1 include:_spf.perfora.net include:_spf.kundenserver.de ~all
```

**Erklärung:**
- `include:_spf.perfora.net` - Erlaubt Hetzner Mail-Server
- `include:_spf.kundenserver.de` - Erlaubt 1&1/IONOS Server (falls verwendet)
- `~all` - "Soft fail" für andere Server (keine harten Ablehnungen)

**Check:**
```bash
nslookup -type=TXT bereifung24.de
# Sollte SPF-Record zeigen
```

### 3. DKIM-Signatur einrichten ⚠️ WICHTIG
DKIM (DomainKeys Identified Mail) signiert Emails kryptographisch.

**Bei Hetzner konsoleh.hetzner.com:**
1. Login → Domains → bereifung24.de → E-Mail
2. DKIM aktivieren
3. DNS-Record kopieren (wird automatisch generiert)
4. Bei Domain-Provider eintragen:

```
Type: TXT
Name: default._domainkey.bereifung24.de
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ... (langer Key)
```

**Check:**
```bash
nslookup -type=TXT default._domainkey.bereifung24.de
```

### 4. DMARC-Policy setzen (Optional aber empfohlen)
DMARC definiert, wie mit fehlgeschlagenen SPF/DKIM-Checks umgegangen wird.

**DNS-Eintrag:**
```
Type: TXT
Name: _dmarc.bereifung24.de
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@bereifung24.de; pct=100; adkim=s; aspf=s
```

**Erklärung:**
- `p=quarantine` - Fehlgeschlagene Emails landen im Spam (statt Ablehnung)
- `rua=mailto:...` - Berichte über fehlgeschlagene Authentifizierungen
- `adkim=s` - Strict DKIM alignment
- `aspf=s` - Strict SPF alignment

### 5. Reverse DNS (PTR) prüfen
Hetzner-Server sollte korrekten Reverse-DNS haben.

**Check:**
```bash
nslookup 167.235.24.110
# Sollte auf bereifung24.de oder mail.bereifung24.de zeigen
```

**Falls nicht:** Bei Hetzner im Server-Management → Networking → Reverse DNS setzen:
```
167.235.24.110 → mail.bereifung24.de
```

### 6. Email-Templates verbessern

**Problem:** Automatisierte Emails sehen oft nach Spam aus.

**Verbesserungen:**
- ✅ Vollständige HTML-Struktur (bereits vorhanden)
- ✅ Plain-Text Alternative (bereits vorhanden)
- ✅ Professionelle Absender-Adresse: "Bereifung24" <info@bereifung24.de>
- ⚠️ **Unsubscribe-Link fehlt** (für Marketing-Emails)
- ⚠️ **Firmenadresse im Footer** (Impressumspflicht)

**To Do:**
```html
<!-- In allen Email-Templates am Ende -->
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
  <p>Bereifung24 GmbH<br>
  [Adresse]<br>
  [PLZ, Ort]<br>
  Geschäftsführer: [Name]<br>
  Handelsregister: [Nummer]</p>
  
  <p style="margin-top: 10px;">
    <a href="https://bereifung24.de/datenschutz">Datenschutz</a> | 
    <a href="https://bereifung24.de/impressum">Impressum</a>
  </p>
</div>
```

### 7. Email-Versand zeitlich verteilen

**Problem:** Alle Emails sofort = Burst → Spam-Verdacht

**Lösung (optional):** Queue-System für Email-Versand
- Emails in Queue schreiben
- Max 10 Emails pro Minute versenden
- Worker-Job verarbeitet Queue

**Simple Implementierung:**
```typescript
// lib/email-queue.ts
const emailQueue: EmailJob[] = []
let processing = false

export async function queueEmail(emailData: EmailOptions) {
  emailQueue.push(emailData)
  if (!processing) {
    processQueue()
  }
}

async function processQueue() {
  processing = true
  while (emailQueue.length > 0) {
    const email = emailQueue.shift()
    if (email) {
      await sendEmail(email)
      await new Promise(resolve => setTimeout(resolve, 6000)) // 6 sec delay = max 10/min
    }
  }
  processing = false
}
```

## Testing-Strategie

### Für Entwicklung
1. **Mock-Modus aktivieren:** Emails nur loggen, nicht senden
2. **Test-Email-Adressen:** Nur an eigene Adressen senden
3. **Rate Limit respektieren:** Max 3 Tests pro Stunde

### Vor Production-Deployment
1. ✅ SPF-Record gesetzt
2. ✅ DKIM aktiviert
3. ✅ DMARC-Policy aktiv
4. ✅ Reverse DNS korrekt
5. ✅ Email-Templates mit Impressum
6. ✅ Rate Limiting aktiv

## Monitoring

### Email-Reputation checken
```bash
# MXToolbox - Email Health Check
https://mxtoolbox.com/SuperTool.aspx?action=blacklist:bereifung24.de

# Google Postmaster Tools
https://postmaster.google.com/

# Mail-Tester (Email-Score)
https://www.mail-tester.com/
```

### Hetzner Logs überwachen
```bash
ssh root@167.235.24.110
tail -f /var/log/mail.log | grep bereifung24
```

## Checkliste bei erneutem Spam-Verdacht

- [ ] Wie viele Emails wurden in letzter Stunde versendet?
- [ ] An wie viele verschiedene Empfänger?
- [ ] Haben Emails gleichen Inhalt? (Spam-Muster)
- [ ] Bounce-Rate prüfen (ungültige Email-Adressen)
- [ ] SPF/DKIM/DMARC-Checks bestanden?
- [ ] IP-Blacklist-Check durchführen

## Kontakt bei Problemen

**Hetzner Support:**
- Email: support@hetzner.com
- Ticket: https://konsoleh.hetzner.com/
- Telefon: +49 (0)9831 505-0

**Bei Passwort-Reset:**
1. Neues Passwort in konsoleh.hetzner.com setzen
2. In Admin-Panel unter /admin/email-settings aktualisieren
3. Test-Email senden zur Verifikation
