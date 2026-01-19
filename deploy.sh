#!/bin/bash
# Deployment Script für Bereifung24
# Server läuft während des Builds weiter, PM2 managed den Neustart

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/bereifung24

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies (Prisma generate runs in postinstall)
echo "📦 Installing dependencies..."
npm install

# Build application (PM2 keeps old server running)
echo "🏗️ Building application..."
npm run build

# Restart with PM2 (graceful restart)
echo "♻️ Restarting application with PM2..."
pm2 restart bereifung24 || pm2 start npm --name bereifung24 -- start

echo "✅ Deployment completed successfully!"
pm2 status bereifung24
