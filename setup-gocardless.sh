#!/bin/bash
# setup-gocardless.sh
# Execute this script on the server to setup GoCardless

cd /root/Bereifung24\ Workspace

echo ""
echo "================================"
echo "GoCardless Setup on Server"
echo "================================"
echo ""

# Check if already configured
if grep -q "GOCARDLESS_ACCESS_TOKEN" .env; then
  echo "WARNING: GoCardless configuration already exists in .env"
  echo "Skipping .env update..."
else
  echo "Step 1: Updating .env file..."
  cat >> .env << 'EOF'

# GoCardless (SEPA Direct Debit) - LIVE MODE
GOCARDLESS_ACCESS_TOKEN="live_WmP-dhJqZY7Amzn-J6TqYivdjL2OHefpmc0fYWrj"
GOCARDLESS_ENVIRONMENT="live"
GOCARDLESS_WEBHOOK_SECRET=""
EOF
  echo "✓ .env updated"
fi

echo ""
echo "Step 2: Installing gocardless-nodejs..."
npm install gocardless-nodejs
echo "✓ Package installed"

echo ""
echo "Step 3: Running database migration..."
npx prisma migrate deploy
echo "✓ Migration completed"

echo ""
echo "Step 4: Building application..."
npm run build
echo "✓ Build completed"

echo ""
echo "Step 5: Restarting PM2..."
pm2 restart bereifung24-app
echo "✓ PM2 restarted"

echo ""
echo "================================"
echo "Setup completed successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Configure webhook in GoCardless dashboard"
echo "2. Add webhook secret to .env"
echo ""
