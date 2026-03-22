#!/bin/bash
cd /var/www/bereifung24

# Remove old broken Firebase entries
sed -i '/^# Firebase/d' .env
sed -i '/^FIREBASE_PROJECT_ID/d' .env
sed -i '/^FIREBASE_SERVICE_ACCOUNT/d' .env
# Remove any leftover JSON lines from broken multi-line insert
sed -i '/^{$/d' .env
sed -i '/^  "type"/d' .env
sed -i '/^  "project_id"/d' .env
sed -i '/^  "private_key_id"/d' .env
sed -i '/^  "private_key"/d' .env
sed -i '/^  "client_email"/d' .env
sed -i '/^  "client_id"/d' .env
sed -i '/^  "auth_uri"/d' .env
sed -i '/^  "token_uri"/d' .env
sed -i '/^  "auth_provider_x509_cert_url"/d' .env
sed -i '/^  "client_x509_cert_url"/d' .env
sed -i '/^  "universe_domain"/d' .env
sed -i '/^}$/d' .env
sed -i '/^-----/d' .env
# Remove lines that look like private key content
sed -i '/^[A-Za-z0-9+/=]\{40,\}/d' .env

# Remove trailing empty lines
sed -i -e :a -e '/^\n*$/{$d;N;ba' -e '}' .env

# Now add properly as single-line JSON
SA_JSON=$(cat /tmp/firebase-sa.json | tr -d '\n' | tr -d '\r')
echo '' >> .env
echo '# Firebase (FCM Push Notifications)' >> .env
echo "FIREBASE_PROJECT_ID=bereifung24-app" >> .env
printf 'FIREBASE_SERVICE_ACCOUNT=%s\n' "$SA_JSON" >> .env

echo '✅ Firebase env vars added (single-line)'
grep FIREBASE /var/www/bereifung24/.env | cut -c1-80
