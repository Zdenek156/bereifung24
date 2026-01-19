#!/bin/bash
# Deployment Script für Bereifung24
# Build WÄHREND Server läuft, dann swap - OHNE Port-Probleme

set -e

echo "🚀 Starting deployment..."
cd /var/www/bereifung24

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building application (server stays online)..."
npm run build

echo "♻️ Restarting server..."
pkill -9 -f 'npm start' 2>/dev/null || true
pkill -9 -f 'node.*next' 2>/dev/null || true
sleep 2

nohup npm start > /var/log/bereifung24.log 2>&1 &
sleep 3

if ps aux | grep 'node.*next start' | grep -v grep > /dev/null; then
    echo "✅ Deployment successful!"
    ps aux | grep 'node.*next start' | grep -v grep
else
    echo "❌ Server failed to start"
    tail -30 /var/log/bereifung24.log
    exit 1
fi
