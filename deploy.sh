#!/bin/bash
# Deployment Script für Bereifung24
# CRITICAL: Stop server BEFORE build to prevent ChunkLoadError

set -e

echo "🚀 Starting deployment..."
cd /var/www/bereifung24

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies (if needed)..."
npm install --production

echo "🛑 CRITICAL: Stopping server BEFORE build to prevent ChunkLoadError..."
pkill -9 node || true
sleep 3

echo "🧹 Cleaning old build..."
rm -rf .next

echo "🏗️ Building application (this takes ~2 minutes)..."
npm run build

echo "⏳ Waiting for build to complete fully..."
sleep 5

echo "✅ Build complete! Starting server..."
nohup npm start > /var/log/bereifung24.log 2>&1 &

echo "⏳ Waiting for server to start (15 seconds)..."
sleep 15

echo "🔍 Checking server health..."
if curl -I http://localhost:3000 2>&1 | grep -q "200 OK"; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "📊 Server Status:"
    ps aux | grep 'node.*next' | grep -v grep
else
    echo "❌ SERVER FAILED TO START"
    echo "📋 Last 50 log lines:"
    tail -50 /var/log/bereifung24.log
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "💡 Server is now running with latest code"
echo "💡 No more ChunkLoadError for customers"
echo "💡 Use 'tail -f /var/log/bereifung24.log' to view logs"
