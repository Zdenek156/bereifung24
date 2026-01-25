#!/bin/bash
# Deployment Script für Bereifung24
# With detailed timing information

set -e

echo "🚀 Starting deployment..."
START_TIME=$(date +%s)
cd /var/www/bereifung24

echo "🛑 [1/5] Stopping old server..."
STEP_START=$(date +%s)
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No process on port 3000"
STEP_END=$(date +%s)
echo "   ⏱️  Took $((STEP_END - STEP_START))s"

echo "📥 [2/5] Pulling latest changes..."
STEP_START=$(date +%s)
git pull origin main
STEP_END=$(date +%s)
echo "   ⏱️  Took $((STEP_END - STEP_START))s"

echo "🧹 [3/5] Cleaning old build..."
STEP_START=$(date +%s)
rm -rf .next
STEP_END=$(date +%s)
echo "   ⏱️  Took $((STEP_END - STEP_START))s"

echo "🏗️ [4/5] Building application..."
STEP_START=$(date +%s)
npm run build
STEP_END=$(date +%s)
echo "   ⏱️  Took $((STEP_END - STEP_START))s"

echo "🚀 [5/5] Starting server..."
STEP_START=$(date +%s)
nohup npm start > server.log 2>&1 &
sleep 5
STEP_END=$(date +%s)
echo "   ⏱️  Took $((STEP_END - STEP_START))s"

# Check if server is running
if lsof -ti:3000 > /dev/null; then
    END_TIME=$(date +%s)
    TOTAL_TIME=$((END_TIME - START_TIME))
    echo ""
    echo "✅ Server running on port 3000"
    echo "🎉 Deployment completed!"
    echo "⏱️  TOTAL TIME: ${TOTAL_TIME}s"
    echo "✅ Deployment complete!"
else
    echo "❌ Server failed to start. Check server.log"
    tail -20 server.log
    exit 1
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
