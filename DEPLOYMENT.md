# Bereifung24 Deployment Checklist

## Vor dem Deployment
- [ ] Repository auf GitHub aktualisiert
- [ ] Alle Tests bestanden
- [ ] .env.example aktualisiert
- [ ] Database Schema finalisiert

## Server Setup
- [ ] Hetzner Cloud Server erstellt (Ubuntu 22.04)
- [ ] SSH-Zugang konfiguriert
- [ ] Firewall eingerichtet (Ports 22, 80, 443)
- [ ] Node.js 20.x installiert
- [ ] PostgreSQL installiert
- [ ] Nginx installiert
- [ ] PM2 installiert

## Datenbank
- [ ] PostgreSQL Datenbank erstellt
- [ ] Datenbankbenutzer erstellt
- [ ] Berechtigungen gesetzt
- [ ] DATABASE_URL in .env.production gesetzt

## Application
- [ ] Repository geklont nach /var/www/bereifung24
- [ ] npm install ausgeführt
- [ ] .env.production mit allen Variablen erstellt
- [ ] NEXTAUTH_SECRET generiert
- [ ] npx prisma generate ausgeführt
- [ ] npx prisma migrate deploy ausgeführt
- [ ] npm run build erfolgreich
- [ ] PM2 konfiguriert und gestartet

## Nginx & SSL
- [ ] Nginx Config erstellt
- [ ] Config aktiviert (symlink)
- [ ] nginx -t erfolgreich
- [ ] DNS A-Record erstellt
- [ ] DNS propagiert (dig ihre-subdomain.ihre-domain.de)
- [ ] Certbot installiert
- [ ] SSL-Zertifikat generiert
- [ ] HTTPS funktioniert

## Testing
- [ ] Website erreichbar über HTTPS
- [ ] Login funktioniert
- [ ] Registrierung funktioniert
- [ ] Dashboard lädt
- [ ] API Endpoints funktionieren
- [ ] Datenbank-Operationen funktionieren

## Monitoring
- [ ] pm2 logs bereifung24 --lines 50 (keine Errors)
- [ ] tail -f /var/log/nginx/bereifung24_error.log (keine Errors)
- [ ] Automatisches Backup eingerichtet
- [ ] PM2 Monitoring aktiviert

## Optional
- [ ] Email-Server konfiguriert und getestet
- [ ] PayPal API Keys hinzugefügt
- [ ] Google Analytics/Tracking hinzugefügt
- [ ] Monitoring (Uptime Robot, etc.)
- [ ] Backup-Strategie implementiert

## Nach dem Deployment
- [ ] Admin-Account erstellt
- [ ] Test-Daten angelegt
- [ ] Alle Features getestet
- [ ] Team informiert
- [ ] Dokumentation aktualisiert

## Nützliche Befehle

### PM2
```bash
pm2 status                    # Status anzeigen
pm2 logs bereifung24          # Logs anzeigen
pm2 restart bereifung24       # App neustarten
pm2 stop bereifung24          # App stoppen
pm2 delete bereifung24        # App entfernen
pm2 monit                     # Monitoring Dashboard
```

### Nginx
```bash
sudo nginx -t                      # Config testen
sudo systemctl restart nginx       # Nginx neustarten
sudo systemctl status nginx        # Status anzeigen
tail -f /var/log/nginx/error.log  # Error Log
```

### PostgreSQL
```bash
sudo -u postgres psql              # PostgreSQL CLI
\l                                 # Datenbanken anzeigen
\c bereifung24                     # Mit DB verbinden
\dt                                # Tabellen anzeigen
```

### Updates deployen
```bash
cd /var/www/bereifung24
sudo ./deploy.sh
```
