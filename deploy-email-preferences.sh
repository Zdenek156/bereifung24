#!/bin/bash

# Deployment Script für Email Notification Preferences
# Auf dem Server ausführen als: bash deploy-email-preferences.sh

cd /var/www/bereifung24

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running database migration..."
npx prisma migrate deploy

echo "🔄 Generating Prisma Client..."
npx prisma generate

echo "🏗️ Building Next.js application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart bereifung24

echo "✅ Deployment complete!"
echo ""
echo "Die Email-Einstellungen sind jetzt verfügbar:"
echo "- Kunden: https://app.bereifung24.de/dashboard/customer/settings"
echo "- Werkstätten: https://app.bereifung24.de/dashboard/workshop/settings"
