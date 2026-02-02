#!/bin/bash

# ============================================
# Bereifung24 Deployment Script
# ============================================
# 
# Server: 167.235.24.110 (Hetzner VPS)
# SSH Key: C:\Users\zdene\.ssh\bereifung24_hetzner
# Server Path: /var/www/bereifung24
# PM2 App Name: bereifung24
#
# Verwendung:
#   ./deploy.sh             # Full deployment (build + restart)
#   ./deploy.sh quick       # Quick restart ohne rebuild
#   ./deploy.sh file <path> # Einzelne Datei hochladen und rebuilden
# ============================================

SERVER="root@167.235.24.110"
SSH_KEY="C:\\Users\\zdene\\.ssh\\bereifung24_hetzner"
SERVER_PATH="/var/www/bereifung24"
APP_NAME="bereifung24"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion: Full Deployment
full_deploy() {
    echo -e "${YELLOW}🚀 Starting Full Deployment...${NC}"
    
    echo -e "${YELLOW}🔨 Building and restarting on server...${NC}"
    ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
cd /var/www/bereifung24
rm -rf .next
npm run build
pm2 restart bereifung24
pm2 logs bereifung24 --lines 5 --nostream
ENDSSH
    
    echo -e "${GREEN}✅ Deployment completed!${NC}"
    echo -e "${GREEN}Server is running with latest changes${NC}"
}

# Funktion: Quick Restart (ohne rebuild)
quick_restart() {
    echo -e "${YELLOW}⚡ Quick restart...${NC}"
    
    ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
pm2 restart bereifung24
pm2 logs bereifung24 --lines 5 --nostream
ENDSSH
    
    echo -e "${GREEN}✅ Quick restart completed!${NC}"
}

# Funktion: Einzelne Datei hochladen
upload_file() {
    local file_path="$1"
    
    if [ -z "$file_path" ]; then
        echo -e "${RED}❌ No file path provided!${NC}"
        echo "Usage: ./deploy.sh file <path>"
        exit 1
    fi
    
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}❌ File not found: $file_path${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📤 Uploading $file_path...${NC}"
    
    scp -i "$SSH_KEY" "$file_path" "$SERVER:$SERVER_PATH/$file_path"
    
    echo -e "${YELLOW}🔨 Rebuilding...${NC}"
    ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
cd /var/www/bereifung24
rm -rf .next
npm run build
pm2 restart bereifung24
pm2 logs bereifung24 --lines 5 --nostream
ENDSSH
    
    echo -e "${GREEN}✅ File uploaded and deployed!${NC}"
}

# Hauptmenü
case "$1" in
    "")
        full_deploy
        ;;
    "quick")
        quick_restart
        ;;
    "file")
        upload_file "$2"
        ;;
    "help")
        echo "Bereifung24 Deployment Script"
        echo ""
        echo "Usage:"
        echo "  ./deploy.sh              - Full deployment (build + restart)"
        echo "  ./deploy.sh quick        - Quick restart ohne rebuild"
        echo "  ./deploy.sh file <path>  - Einzelne Datei hochladen"
        echo "  ./deploy.sh help         - Diese Hilfe"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        exit 1
        ;;
esac
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
