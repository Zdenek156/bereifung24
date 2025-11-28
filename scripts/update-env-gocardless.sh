#!/bin/bash
# update-env-gocardless.sh
# Run this script on the server to update .env with GoCardless configuration

cd /root/Bereifung24\ Workspace

echo ""
echo "🔧 Updating .env with GoCardless configuration..."
echo ""

# Check if GoCardless config already exists
if grep -q "GOCARDLESS_ACCESS_TOKEN" .env; then
  echo "⚠️  GoCardless configuration already exists in .env"
  echo "Please update manually or remove existing lines first."
  exit 1
fi

# Add GoCardless configuration
cat >> .env << 'EOF'

# GoCardless (SEPA Direct Debit) - LIVE MODE
GOCARDLESS_ACCESS_TOKEN="live_WmP-dhJqZY7Amzn-J6TqYivdjL2OHefpmc0fYWrj"
GOCARDLESS_ENVIRONMENT="live"
GOCARDLESS_WEBHOOK_SECRET=""
EOF

echo "✅ .env updated with GoCardless configuration"
echo ""
echo "📦 Installing gocardless-nodejs package..."
npm install gocardless-nodejs

echo ""
echo "🗄️  Running database migration..."
npx prisma migrate deploy

echo ""
echo "🔄 Rebuilding application..."
npm run build

echo ""
echo "♻️  Restarting PM2..."
pm2 restart bereifung24-app

echo ""
echo "✅ Server configuration complete!"
echo ""
echo "Next: Configure webhook in GoCardless dashboard"
