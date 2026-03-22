#!/bin/bash
CRON_SECRET='***REMOVED***'
(crontab -l 2>/dev/null; echo ''; echo '# Push-Erinnerungen 24h vor Termin (taeglich 18 Uhr)'; echo "0 18 * * * curl -s -X POST -H 'Authorization: Bearer ${CRON_SECRET}' http://localhost:3000/api/cron/push-reminders >> /var/log/bereifung24/push-reminders-cron.log 2>&1") | crontab -
echo "Done"
crontab -l | tail -3
