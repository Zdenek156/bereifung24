#!/bin/bash
# Email Sync Cron Job Setup
# Synchronisiert E-Mails alle 10 Minuten für alle Mitarbeiter

# Cron-Job zur crontab hinzufügen
# */10 * * * * curl -X GET -H "Authorization: Bearer your-secret-token-here" https://bereifung24.de/api/cron/sync-emails >> /var/log/bereifung24-email-sync.log 2>&1

echo "📧 Email Sync Cron Job Setup"
echo "=============================="
echo ""
echo "Dieser Cron-Job synchronisiert E-Mails alle 10 Minuten."
echo ""
echo "1. Geheimen Token generieren:"
echo "   openssl rand -base64 32"
echo ""
echo "2. Token in .env.local speichern:"
echo "   echo 'CRON_SECRET=IHR_GENERIERTER_TOKEN' >> /var/www/bereifung24/.env.local"
echo ""
echo "3. PM2 neu starten um Umgebungsvariable zu laden:"
echo "   pm2 restart bereifung24 --update-env"
echo ""
echo "4. Cron-Job einrichten:"
echo "   crontab -e"
echo ""
echo "5. Folgende Zeile hinzufügen:"
echo "   */10 * * * * curl -X GET -H \"Authorization: Bearer IHR_TOKEN\" https://bereifung24.de/api/cron/sync-emails >> /var/log/bereifung24-email-sync.log 2>&1"
echo ""
echo "6. Log-Datei überwachen:"
echo "   tail -f /var/log/bereifung24-email-sync.log"
echo ""
