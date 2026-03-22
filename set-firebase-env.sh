#!/bin/bash
cd /var/www/bereifung24

# Read the service account JSON and set it as env var
SA_JSON=$(cat firebase-service-account.json | tr -d '\n')

# Check if FIREBASE vars already exist in .env
if grep -q "FIREBASE_PROJECT_ID" .env; then
  echo "Firebase vars already in .env, updating..."
  sed -i '/^FIREBASE_PROJECT_ID=/d' .env
  sed -i '/^FIREBASE_SERVICE_ACCOUNT=/d' .env
fi

# Append to .env
echo "" >> .env
echo "FIREBASE_PROJECT_ID=bereifung24-app" >> .env
echo "FIREBASE_SERVICE_ACCOUNT=$SA_JSON" >> .env

echo "✅ Firebase env vars set"
echo "FIREBASE_PROJECT_ID=$(grep FIREBASE_PROJECT_ID .env | head -1)"
echo "FIREBASE_SERVICE_ACCOUNT length: $(grep FIREBASE_SERVICE_ACCOUNT .env | head -1 | wc -c) chars"
