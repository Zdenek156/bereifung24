#!/bin/bash
# Deployment Script für Bereifung24
# Zero-downtime deployment with PM2

set -e

echo "🚀 Starting deployment..."
cd /var/www/bereifung24

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies (if needed)..."
npm install --production

echo "🏗️ Building application (this takes ~2 minutes)..."
npm run build

echo "⏳ Waiting for build to complete fully..."
sleep 5

# Check if PM2 is managing the app
if pm2 list | grep -q "bereifung24"; then
    echo "🔄 Reloading app with PM2 (zero-downtime)..."
    pm2 reload bereifung24
else
    echo "🚀 Starting app with PM2 for the first time..."
    pm2 start npm --name bereifung24 -- start
    pm2 save
fi

echo "⏳ Waiting for server to stabilize (10 seconds)..."
sleep 10

echo "🔍 Checking server health..."
if curl -I http://localhost:3000 2>&1 | grep -q "200 OK"; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "📊 PM2 Status:"
    pm2 list
    pm2 info bereifung24
else
    echo "❌ SERVER FAILED TO START"
    echo "📋 PM2 Logs:"
    pm2 logs bereifung24 --lines 50 --nostream
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "💡 PM2 manages auto-restart on crashes"
echo "💡 Run 'pm2 logs bereifung24' to view logs"
echo "💡 Run 'pm2 monit' to monitor performance"
echo "💡 Use 'tail -f /var/log/bereifung24.log' to view logs"
