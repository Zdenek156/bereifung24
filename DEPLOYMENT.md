# Bereifung24 Deployment Guide

## Server-Informationen

- **Server IP:** 167.235.24.110 (Hetzner VPS)
- **SSH User:** root
- **SSH Key:** `C:\Users\zdene\.ssh\bereifung24_hetzner`
- **Server Pfad:** `/var/www/bereifung24`
- **PM2 App Name:** `bereifung24`
- **Node Version:** v20.19.5
- **Next.js Version:** 14.0.4

## Schnell-Referenz

### PowerShell Commands (Wichtigste!)

#### 1. Einzelne Datei deployen:
```powershell
# Datei hochladen
scp -i C:\Users\zdene\.ssh\bereifung24_hetzner "PFAD\ZUR\DATEI" root@167.235.24.110:"/var/www/bereifung24/PFAD/ZUR/DATEI"

# Clean rebuild + restart
ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110 "cd /var/www/bereifung24 && rm -rf .next && npm run build && pm2 restart bereifung24"
```

#### 2. Quick Restart (ohne rebuild):
```powershell
ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110 "pm2 restart bereifung24"
```

#### 3. Logs anzeigen:
```powershell
ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110 "pm2 logs bereifung24 --lines 50 --nostream"
```

#### 4. PM2 Status:
```powershell
ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110 "pm2 list"
```

## VS Code Tasks

Du kannst Tasks direkt in VS Code ausführen (`Ctrl+Shift+P` → "Tasks: Run Task"):

- 🚀 **Deploy: Full** - Clean build + restart
- ⚡ **Deploy: Quick Restart** - Nur restart
- 📤 **Deploy: Current File** - Aktuelle Datei hochladen
- 📊 **PM2: Status** - Server Status
- 📝 **PM2: Logs** - Letzte 50 Zeilen

## Typische Workflows

### Debug-Code entfernen:
1. Debug-Code lokal entfernen
2. Datei deployen mit Clean Build

```powershell
scp -i C:\Users\zdene\.ssh\bereifung24_hetzner "app\dashboard\customer\requests\[id]\book\page.tsx" root@167.235.24.110:"/var/www/bereifung24/app/dashboard/customer/requests/[id]/book/page.tsx"

ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110 "cd /var/www/bereifung24 && rm -rf .next && npm run build && pm2 restart bereifung24"
```

### API ändern:
```powershell
scp -i C:\Users\zdene\.ssh\bereifung24_hetzner "app\api\offers\route.ts" root@167.235.24.110:"/var/www/bereifung24/app/api/offers/route.ts"

ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110 "pm2 restart bereifung24"
```

## Wichtige PM2 Commands

```bash
pm2 list                    # Status aller Apps
pm2 restart bereifung24     # App neustarten
pm2 logs bereifung24        # Live logs
pm2 logs --lines 100        # Letzte 100 Zeilen
pm2 monit                   # CPU/Memory Monitor
pm2 show bereifung24        # Details zur App
```

## Troubleshooting

### Cache-Probleme (Debug-Info bleibt sichtbar):
```powershell
ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110 "cd /var/www/bereifung24 && rm -rf .next && npm run build && pm2 restart bereifung24"
```

### OOM Fehler:
```bash
pm2 restart bereifung24 --max-memory-restart 2G

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
