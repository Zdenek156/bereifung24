# Sales Outreach Pipeline – Setup

## 1) DB-Migration auf dem Server ausführen

```bash
ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110
cd /var/www/bereifung24
git pull origin main
psql -U postgres -d bereifung24 -f add-prospect-outreach.sql
npx prisma generate
rm -rf .next && npm run build && pm2 restart bereifung24
```

## 2) Partner-Mailbox `partner@bereifung24.de` einrichten

1. Im Hetzner-Webhosting-Konto die neue Mailbox `partner@bereifung24.de` mit eigenem Passwort anlegen.
2. Im Admin-Panel unter **API-Einstellungen** folgende Keys hinterlegen:

| Key | Beispielwert | Zweck |
|---|---|---|
| `OUTREACH_SMTP_HOST` | `mail.your-server.de` | SMTP für Outreach-Mailbox |
| `OUTREACH_SMTP_PORT` | `587` | STARTTLS (587) oder SSL (465) |
| `OUTREACH_SMTP_USER` | `partner@bereifung24.de` | Login |
| `OUTREACH_SMTP_PASSWORD` | `<Passwort>` | Mailbox-Passwort |
| `OUTREACH_FROM_EMAIL` | `partner@bereifung24.de` | From-Adresse |
| `OUTREACH_FROM_NAME` | `Bereifung24 Partnerteam` | Display-Name |
| `OUTREACH_IMAP_HOST` | `mail.your-server.de` | IMAP-Server für Reply-Polling |
| `OUTREACH_IMAP_PORT` | `993` | TLS |
| `OUTREACH_IMAP_USER` | `partner@bereifung24.de` |  |
| `OUTREACH_IMAP_PASSWORD` | `<Passwort>` |  |
| `OUTREACH_IMAP_TLS` | `true` |  |
| `CRON_SECRET` | `<langes-zufalls-token>` | Schützt den IMAP-Sync-Endpoint |

## 3) IMAP-Reply-Polling als Cronjob einrichten

```bash
crontab -e
# Alle 10 Minuten neue Replies einsammeln
*/10 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://bereifung24.de/api/cron/sales/sync-inbox >> /var/log/bereifung24-outreach-sync.log 2>&1
```

Manueller Test:
```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://bereifung24.de/api/cron/sales/sync-inbox
```

## 4) Workflow im Admin-UI

1. `/admin/sales/prospects` → Prospect öffnen.
2. Tab **Outreach** wählen.
3. **Jetzt analysieren** → Gemini crawlt die Webseite + Google-Daten und liefert Insights.
4. Sequenz wählen (Erstkontakt / Follow-up / Letzter Versuch).
5. **KI-Entwurf erzeugen** → Subject + Body werden automatisch vorgeschlagen.
6. Vor Versand prüfen, ggf. anpassen, **Email versenden**.
7. Replies erscheinen automatisch im Verlauf (durch IMAP-Cronjob), inklusive Zuordnung zum Thread.

## 5) Tracking

- **Open-Tracking:** 1×1-Pixel `/api/sales/outreach/track/[id]/open` – setzt `openedAt`/`openCount`.
- **Click-Tracking:** alle Links in der Email werden über `/api/sales/outreach/track/[id]/click?u=…` umgeleitet (mit SSRF-Schutz, nur http/https und keine privaten IPs).
- **Reply-Tracking:** Eingehende Mails werden via `In-Reply-To`/`References`-Header gegen die `messageId` der ausgehenden Outreach-Email gematched und als `INBOUND`-Eintrag mit `repliedAt` gespeichert.

## 6) Sicherheit

- Webseiten-Crawler blockiert private IP-Bereiche (SSRF), Timeout 8s, max 1 MB pro Page, max 4 Pages pro Analyse.
- Click-Tracking-Redirect lehnt unzulässige Schemata + private Hosts ab.
- IMAP-Passwort wird nur in `AdminApiSetting` (DB) gespeichert.
- Tracking-Endpoints sind absichtlich unauthenticated (Empfänger ist nicht eingeloggt) – sie führen aber nur Inkremente / Redirects auf gespeicherte URLs aus.
