#!/bin/bash
# deploy-gocardless.sh
# Deployment script for GoCardless integration

echo "🚀 GoCardless Integration Deployment"
echo "===================================="
echo ""

# Check if on server
if [[ $(hostname) != *"hetzner"* ]] && [[ $(hostname -I) != *"167.235.24.110"* ]]; then
  echo "⚠️  This script should be run on the production server (167.235.24.110)"
  echo "Copy files to server and run there."
  exit 1
fi

# Navigate to app directory
cd /root/Bereifung24\ Workspace || exit 1

echo "📦 Installing GoCardless Node.js SDK..."
npm install gocardless-nodejs

echo ""
echo "🗄️  Running database migration..."
npx prisma migrate deploy

echo ""
echo "🔧 Checking .env configuration..."
if ! grep -q "GOCARDLESS_ACCESS_TOKEN" .env; then
  echo "⚠️  GoCardless environment variables not found in .env"
  echo ""
  echo "Please add the following to your .env file:"
  echo ""
  echo "# GoCardless (SEPA Direct Debit)"
  echo "GOCARDLESS_ACCESS_TOKEN=\"your-access-token\""
  echo "GOCARDLESS_ENVIRONMENT=\"sandbox\"  # or \"live\" for production"
  echo "GOCARDLESS_WEBHOOK_SECRET=\"your-webhook-secret\""
  echo ""
  echo "Get your credentials from: https://manage.gocardless.com/developers"
  exit 1
fi

echo "✅ GoCardless environment variables found"

echo ""
echo "🔄 Rebuilding Next.js application..."
npm run build

echo ""
echo "♻️  Restarting PM2 process..."
pm2 restart bereifung24-app

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Configure GoCardless webhook URL in GoCardless Dashboard:"
echo "   https://manage.gocardless.com/developers/webhooks"
echo "   Webhook URL: https://bereifung24.de/api/webhooks/gocardless"
echo ""
echo "2. Test SEPA mandate creation:"
echo "   - Login as workshop user"
echo "   - Go to Settings > SEPA-Lastschrift"
echo "   - Complete mandate setup"
echo ""
echo "3. Setup monthly billing cron job:"
echo "   crontab -e"
echo "   Add: 0 2 1 * * cd /root/Bereifung24\\ Workspace && npx ts-node scripts/monthly-billing.ts"
echo ""
