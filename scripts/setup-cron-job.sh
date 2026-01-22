#!/bin/bash

# ============================================
# Setup Cron Job for Invoice Generation
# ============================================
# Configures automatic monthly invoice generation
# Runs on 1st of each month at 09:00
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Invoice Cron Job Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if running on server
if [ -d "/var/www/bereifung24" ]; then
    PROJECT_DIR="/var/www/bereifung24"
else
    PROJECT_DIR="$(pwd)"
fi

echo "Project directory: $PROJECT_DIR"
echo ""

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(cat "$PROJECT_DIR/.env" | grep CRON_SECRET | xargs)
fi

if [ -z "$CRON_SECRET" ]; then
    echo -e "${RED}✗ CRON_SECRET not found in .env${NC}"
    echo "Generating new CRON_SECRET..."
    CRON_SECRET=$(openssl rand -base64 32)
    echo "CRON_SECRET=$CRON_SECRET" >> "$PROJECT_DIR/.env"
    echo -e "${GREEN}✓ CRON_SECRET added to .env${NC}"
fi

# Choose setup method
echo -e "${YELLOW}Choose cron setup method:${NC}"
echo "1) PM2 (recommended for Next.js apps)"
echo "2) System crontab"
echo "3) GitHub Actions (for Vercel/cloud hosting)"
echo "4) Manual (show commands only)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo -e "\n${BLUE}Setting up PM2 cron job...${NC}"
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo -e "${RED}✗ PM2 not installed${NC}"
            echo "Install with: npm install -g pm2"
            exit 1
        fi
        
        # Create ecosystem config
        cat > "$PROJECT_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'bereifung24',
      script: 'npm',
      args: 'start',
      cwd: '$PROJECT_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'invoice-cron',
      script: 'node',
      args: ['-e', "require('node-fetch')('https://bereifung24.de/api/cron/generate-commission-invoices', { method: 'POST', headers: { 'Authorization': 'Bearer $CRON_SECRET' } }).then(r => r.json()).then(console.log).catch(console.error)"],
      cron_restart: '0 9 1 * *',  // 09:00 on 1st of month
      autorestart: false,
      watch: false
    }
  ]
};
EOF
        
        echo -e "${GREEN}✓ ecosystem.config.js created${NC}"
        
        # Start PM2
        pm2 delete invoice-cron 2>/dev/null || true
        pm2 start ecosystem.config.js --only invoice-cron
        pm2 save
        
        echo -e "${GREEN}✓ PM2 cron job configured${NC}"
        echo ""
        echo "View logs: pm2 logs invoice-cron"
        echo "Stop cron: pm2 stop invoice-cron"
        echo "Restart:   pm2 restart invoice-cron"
        ;;
        
    2)
        echo -e "\n${BLUE}Setting up system crontab...${NC}"
        
        # Create cron script
        cat > "$PROJECT_DIR/scripts/run-invoice-cron.sh" << EOF
#!/bin/bash
curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  -H "Content-Type: application/json" \\
  >> /var/log/invoice-cron.log 2>&1
EOF
        
        chmod +x "$PROJECT_DIR/scripts/run-invoice-cron.sh"
        echo -e "${GREEN}✓ Cron script created${NC}"
        
        # Add to crontab
        CRON_LINE="0 9 1 * * $PROJECT_DIR/scripts/run-invoice-cron.sh"
        
        echo ""
        echo "Add this line to your crontab (crontab -e):"
        echo -e "${YELLOW}$CRON_LINE${NC}"
        echo ""
        read -p "Add to crontab now? [y/N]: " add_cron
        
        if [[ $add_cron =~ ^[Yy]$ ]]; then
            (crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -
            echo -e "${GREEN}✓ Crontab updated${NC}"
            echo ""
            crontab -l | grep invoice-cron
        fi
        
        # Create log file
        sudo touch /var/log/invoice-cron.log
        sudo chmod 644 /var/log/invoice-cron.log
        echo -e "${GREEN}✓ Log file created: /var/log/invoice-cron.log${NC}"
        ;;
        
    3)
        echo -e "\n${BLUE}GitHub Actions Cron Setup${NC}"
        echo ""
        echo "Create file: .github/workflows/invoice-cron.yml"
        echo ""
        cat << 'EOF'
name: Monthly Invoice Generation
on:
  schedule:
    - cron: '0 9 1 * *'  # 09:00 on 1st of month
  workflow_dispatch:  # Manual trigger

jobs:
  generate-invoices:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Invoice Generation
        run: |
          curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
EOF
        echo ""
        echo "Add CRON_SECRET to GitHub repository secrets:"
        echo "Settings → Secrets and variables → Actions → New repository secret"
        echo "Name: CRON_SECRET"
        echo -e "Value: ${YELLOW}$CRON_SECRET${NC}"
        ;;
        
    4)
        echo -e "\n${BLUE}Manual Setup Instructions${NC}"
        echo ""
        echo -e "${YELLOW}Curl command:${NC}"
        echo "curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices \\"
        echo "  -H \"Authorization: Bearer $CRON_SECRET\" \\"
        echo "  -H \"Content-Type: application/json\""
        echo ""
        echo -e "${YELLOW}Node.js command:${NC}"
        echo "node -e \"require('node-fetch')('https://bereifung24.de/api/cron/generate-commission-invoices', { method: 'POST', headers: { 'Authorization': 'Bearer $CRON_SECRET' } }).then(r => r.json()).then(console.log)\""
        echo ""
        echo -e "${YELLOW}CRON_SECRET:${NC}"
        echo "$CRON_SECRET"
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ Cron setup completed!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Test cron manually:${NC}"
echo "  curl -X POST https://bereifung24.de/api/cron/generate-commission-invoices \\"
echo "    -H \"Authorization: Bearer $CRON_SECRET\""
echo ""
echo -e "${YELLOW}Or via admin UI:${NC}"
echo "  https://bereifung24.de/admin/invoices → 'Monatliche Rechnungen generieren'"
echo ""
