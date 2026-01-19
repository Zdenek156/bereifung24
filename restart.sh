#!/bin/bash
# Simple restart script for bereifung24 without PM2
# Usage: bash restart.sh

cd /var/www/bereifung24

echo "🔄 Pulling latest code..."
git pull

echo "📦 Checking dependencies..."
npm install --production=false

echo "⚙️  Stopping old server..."
pkill -f 'node.*next start' || true

echo "🚀 Starting server..."
nohup npm start > /var/log/bereifung24.log 2>&1 &

sleep 3

if ps aux | grep 'node.*next start' | grep -v grep > /dev/null; then
    echo "✅ Server is running!"
    ps aux | grep 'node.*next start' | grep -v grep
else
    echo "❌ Server failed to start. Check logs:"
    tail -20 /var/log/bereifung24.log
    exit 1
fi
