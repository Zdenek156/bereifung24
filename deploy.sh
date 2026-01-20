#!/bin/bash
# Deployment Script für Bereifung24
# Zero-Downtime Deployment mit PM2

set -e

echo "🚀 Starting Zero-Downtime Deployment..."
cd /var/www/bereifung24

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "🛑 Stopping server BEFORE build to prevent ChunkLoadError..."
pm2 stop bereifung24 || pkill -9 node || true
sleep 3

echo "🧹 Cleaning old build..."
rm -rf .next

echo "🏗️ Building application (this takes ~2 minutes)..."
npm run build

echo "⏳ Waiting for build to complete..."
sleep 5

echo "✅ Build complete! Starting server with PM2..."
pm2 start ecosystem.config.js
pm2 save

echo "⏳ Waiting for server to start..."
sleep 15

echo "🔍 Checking server health..."
if curl -I http://localhost:3000 2>&1 | grep -q "200 OK"; then
    echo "✅ DEPLOYMENT SUCCESSFUL! Server is running."
    echo "📊 PM2 Status:"
    pm2 status bereifung24
else
    echo "❌ SERVER FAILED TO START"
    echo "📋 Last 50 log lines:"
    pm2 logs bereifung24 --lines 50 --nostream
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "💡 Use 'pm2 logs bereifung24' to view logs"
echo "💡 Use 'pm2 monit' to monitor the app"
