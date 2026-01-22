#!/bin/bash

# ============================================
# Bereifung24 Invoice System Deployment
# ============================================
# Deploys Commission Invoice System to Production
# Phases: Database Migration → Dependencies → Build → Cron Setup
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER="root@167.235.24.110"
SSH_KEY="$HOME/.ssh/bereifung24_hetzner"
PROJECT_DIR="/var/www/bereifung24"
DB_NAME="bereifung24"
DB_USER="postgres"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Bereifung24 Invoice System Deployment${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Step 1: Verify SSH connection
echo -e "${YELLOW}[1/8] Verifying SSH connection...${NC}"
if ssh -i "$SSH_KEY" "$SERVER" "echo 'Connected'" &>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed. Check your SSH key.${NC}"
    exit 1
fi

# Step 2: Pull latest code
echo -e "\n${YELLOW}[2/8] Pulling latest code from GitHub...${NC}"
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
cd /var/www/bereifung24
git fetch origin
echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log -1 --oneline)"
git pull origin main
echo "✓ Code updated to commit: $(git log -1 --oneline)"
ENDSSH
echo -e "${GREEN}✓ Code updated${NC}"

# Step 3: Run database migrations
echo -e "\n${YELLOW}[3/8] Running database migrations...${NC}"
ssh -i "$SSH_KEY" "$SERVER" << ENDSSH
cd /var/www/bereifung24

# Check if migrations already applied
if psql -U $DB_USER -d $DB_NAME -tAc "SELECT to_regclass('public.commission_invoices');" | grep -q "commission_invoices"; then
    echo "⚠ Tables already exist, skipping migration"
else
    echo "Running migration_add_commission_invoicing.sql..."
    psql -U $DB_USER -d $DB_NAME < migration_add_commission_invoicing.sql
    echo "✓ Commission invoice tables created"
fi

# Check email template
if psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM email_templates WHERE slug='commission-invoice';" | grep -q "^0$"; then
    echo "Running migration_commission_invoice_email_template.sql..."
    psql -U $DB_USER -d $DB_NAME < migration_commission_invoice_email_template.sql
    echo "✓ Email template created"
else
    echo "⚠ Email template already exists, skipping"
fi

# Verify tables
echo ""
echo "Verifying database tables:"
psql -U $DB_USER -d $DB_NAME -c "\dt commission*"
psql -U $DB_USER -d $DB_NAME -c "\dt invoice*"
ENDSSH
echo -e "${GREEN}✓ Database migrations completed${NC}"

# Step 4: Install dependencies
echo -e "\n${YELLOW}[4/8] Installing dependencies (puppeteer)...${NC}"
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
cd /var/www/bereifung24

# Install npm packages
npm install

# Verify puppeteer
if node -e "require('puppeteer')" 2>/dev/null; then
    echo "✓ Puppeteer installed"
else
    echo "✗ Puppeteer installation failed"
    exit 1
fi

# Install Chromium dependencies (if not already)
if ! command -v chromium-browser &> /dev/null; then
    echo "Installing Chromium..."
    apt-get update -qq
    apt-get install -y chromium-browser chromium-codecs-ffmpeg
    echo "✓ Chromium installed"
else
    echo "✓ Chromium already installed"
fi
ENDSSH
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 5: Generate Prisma client and build
echo -e "\n${YELLOW}[5/8] Building application...${NC}"
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
cd /var/www/bereifung24

# Generate Prisma client
npx prisma generate
echo "✓ Prisma client generated"

# Build Next.js
npm run build
echo "✓ Next.js build completed"
ENDSSH
echo -e "${GREEN}✓ Build completed${NC}"

# Step 6: Setup environment variables
echo -e "\n${YELLOW}[6/8] Checking environment variables...${NC}"
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
cd /var/www/bereifung24

# Check if CRON_SECRET exists
if grep -q "CRON_SECRET=" .env; then
    echo "✓ CRON_SECRET already set"
else
    echo "⚠ CRON_SECRET not found in .env"
    echo "Please add: CRON_SECRET=$(openssl rand -base64 32)"
fi

# Check GoCardless
if grep -q "GOCARDLESS_ACCESS_TOKEN=" .env; then
    echo "✓ GOCARDLESS_ACCESS_TOKEN found"
else
    echo "⚠ GOCARDLESS_ACCESS_TOKEN missing"
fi

# Check SMTP
if grep -q "SMTP_HOST=" .env; then
    echo "✓ SMTP settings found"
else
    echo "⚠ SMTP settings missing"
fi
ENDSSH
echo -e "${GREEN}✓ Environment check completed${NC}"

# Step 7: Create invoice directories
echo -e "\n${YELLOW}[7/8] Creating invoice directories...${NC}"
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
cd /var/www/bereifung24

# Create invoice storage directory
mkdir -p public/invoices/2026/01
chmod -R 755 public/invoices
chown -R www-data:www-data public/invoices

echo "✓ Invoice directories created"
ls -la public/invoices/
ENDSSH
echo -e "${GREEN}✓ Directories created${NC}"

# Step 8: Restart PM2
echo -e "\n${YELLOW}[8/8] Restarting application...${NC}"
ssh -i "$SSH_KEY" "$SERVER" << 'ENDSSH'
cd /var/www/bereifung24

# Restart PM2
pm2 restart bereifung24
pm2 save

# Wait for app to start
sleep 3

# Check status
pm2 status
pm2 logs bereifung24 --lines 10 --nostream
ENDSSH
echo -e "${GREEN}✓ Application restarted${NC}"

# Summary
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure invoice settings: https://bereifung24.de/admin/invoices/settings"
echo "2. Upload company logo"
echo "3. Setup cron job (see CRON_SETUP.md)"
echo "4. Test manual invoice generation"
echo ""
echo -e "${YELLOW}To verify deployment:${NC}"
echo "  curl https://bereifung24.de/api/admin/invoices/settings"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  ssh -i $SSH_KEY $SERVER 'cd $PROJECT_DIR && pm2 logs bereifung24'"
echo ""
