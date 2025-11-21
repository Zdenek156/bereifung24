# E-Mail Konfiguration für Bereifung24

## Aktueller Status:
- E-Mail-Versand ist implementiert
- Credentials fehlen noch auf dem Server

## SMTP Server Optionen:

### 1. Gmail (Einfach für Testing)
```bash
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="deine-email@gmail.com"
EMAIL_PASSWORD="app-passwort"  # Nicht normales Passwort!
EMAIL_FROM="noreply@bereifung24.de"
```

**Gmail App-Passwort erstellen:**
1. Google Konto → Sicherheit
2. 2-Faktor-Authentifizierung aktivieren
3. App-Passwörter → Mail → Passwort generieren

### 2. Mailgun (Professionell, kostenlos für 5.000 E-Mails/Monat)
```bash
EMAIL_HOST="smtp.mailgun.org"
EMAIL_PORT="587"
EMAIL_USER="postmaster@mg.bereifung24.de"
EMAIL_PASSWORD="mailgun-smtp-password"
EMAIL_FROM="noreply@bereifung24.de"
```

**Setup:** https://mailgun.com → Domain hinzufügen → SMTP-Credentials

### 3. SendGrid (Sehr zuverlässig, 100 E-Mails/Tag kostenlos)
```bash
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASSWORD="dein-sendgrid-api-key"
EMAIL_FROM="noreply@bereifung24.de"
```

**Setup:** https://sendgrid.com → API Key erstellen

### 4. Amazon SES (Günstig, professionell)
```bash
EMAIL_HOST="email-smtp.eu-central-1.amazonaws.com"
EMAIL_PORT="587"
EMAIL_USER="SMTP-Username"
EMAIL_PASSWORD="SMTP-Password"
EMAIL_FROM="noreply@bereifung24.de"
```

### 5. Eigener SMTP Server (Wenn vorhanden)
```bash
EMAIL_HOST="mail.bereifung24.de"
EMAIL_PORT="587"
EMAIL_USER="noreply@bereifung24.de"
EMAIL_PASSWORD="dein-passwort"
EMAIL_FROM="noreply@bereifung24.de"
```

## 📝 Installation auf dem Server:

### Schritt 1: .env Datei auf Server bearbeiten
```bash
ssh bereifung24
nano /var/www/bereifung24/.env
```

### Schritt 2: E-Mail-Einstellungen hinzufügen
Ersetze die leeren Werte mit deinen SMTP-Credentials:
```bash
EMAIL_HOST="smtp.gmail.com"          # Dein SMTP Server
EMAIL_PORT="587"                     # Port (meist 587 oder 465)
EMAIL_USER="deine@email.com"         # SMTP Username
EMAIL_PASSWORD="dein-app-passwort"   # SMTP Passwort
EMAIL_FROM="noreply@bereifung24.de"  # Absender-Adresse
```

### Schritt 3: PM2 neu starten
```bash
pm2 restart bereifung24
```

### Schritt 4: Test
Nach der Konfiguration funktionieren automatisch:
- ✉️ Passwort-Reset E-Mails
- ✉️ Neue Angebot Benachrichtigungen
- ✉️ Angebot akzeptiert Benachrichtigungen
- ✉️ Admin Newsletter

## 🧪 E-Mail Test (Optional)
Teste ob E-Mails funktionieren:
1. Gehe zu https://bereifung24.de/forgot-password
2. Gib deine E-Mail ein
3. Du solltest eine E-Mail mit Reset-Link erhalten

## 💡 Empfehlung:
Für den Start: **Gmail** (schnell & einfach)
Für Production: **Mailgun** oder **SendGrid** (professionell & zuverlässig)

## ⚠️ Wichtig:
- Gmail erlaubt nur 500 E-Mails/Tag
- Für Massen-E-Mails (Admin Newsletter) → Mailgun/SendGrid verwenden
- SPF/DKIM Records für bessere Zustellbarkeit konfigurieren

## 📧 Implementierte E-Mail-Features:

### 1. Passwort zurücksetzen
- Trigger: Benutzer klickt "Passwort vergessen"
- Inhalt: Link zum Passwort zurücksetzen (1 Stunde gültig)
- Template: Professionell mit Bereifung24 Branding

### 2. Neues Angebot (an Kunde)
- Trigger: Werkstatt erstellt Angebot
- Inhalt: Details zum Angebot mit Link zur Ansicht
- Template: Übersichtlich mit Preis und Termin

### 3. Angebot akzeptiert (an Werkstatt)
- Trigger: Kunde akzeptiert Angebot
- Inhalt: Buchungsdetails mit Kundendaten
- Template: Alle wichtigen Infos für Werkstatt

### 4. Admin Newsletter
- Trigger: Admin sendet E-Mail über /admin/email
- Empfänger: Alle Werkstätten, Alle Kunden, oder Filter
- Template: Individueller HTML-Inhalt

## 🔒 Fallback-Modus:
Aktuell läuft der Code im Fallback-Modus:
- E-Mails werden in Console geloggt
- Keine echten E-Mails werden versendet
- Sobald SMTP konfiguriert ist, funktioniert alles automatisch
