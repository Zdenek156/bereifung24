#!/bin/bash
cd /var/www/bereifung24

# Add Firebase env vars if not already present
if ! grep -q "FIREBASE_PROJECT_ID" .env; then
  echo '' >> .env
  echo '# Firebase (FCM Push Notifications)' >> .env
  echo 'FIREBASE_PROJECT_ID=bereifung24-app' >> .env
  echo "FIREBASE_SERVICE_ACCOUNT=$(cat /tmp/firebase-sa.json)" >> .env
  echo '✅ Firebase env vars added'
else
  echo 'ℹ️  Firebase env vars already exist'
fi
