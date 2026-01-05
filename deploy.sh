#!/bin/bash

# Deployment Script für Bereifung24
# Auf dem Server als /var/www/bereifung24/deploy.sh speichern

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/bereifung24

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build application
echo "🏗️ Building application..."
npm run build

# Restart PM2
echo "♻️ Restarting application..."
pm2 restart bereifung24

echo "✅ Deployment completed successfully!"
