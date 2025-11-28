# deploy-gocardless.ps1
# PowerShell script to deploy GoCardless configuration to server

Write-Host ""
Write-Host "GoCardless Server Deployment" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$serverHost = "root@167.235.24.110"
$workspaceDir = "/root/Bereifung24 Workspace"

Write-Host "Step 1: Updating .env file..." -ForegroundColor Yellow

ssh $serverHost @"
cd '$workspaceDir'
echo '' >> .env
echo '# GoCardless (SEPA Direct Debit) - LIVE MODE' >> .env
echo 'GOCARDLESS_ACCESS_TOKEN=\"live_WmP-dhJqZY7Amzn-J6TqYivdjL2OHefpmc0fYWrj\"' >> .env
echo 'GOCARDLESS_ENVIRONMENT=\"live\"' >> .env
echo 'GOCARDLESS_WEBHOOK_SECRET=\"\"' >> .env
echo '.env updated successfully'
"@

Write-Host ""
Write-Host "Step 2: Installing gocardless-nodejs..." -ForegroundColor Yellow

ssh $serverHost @"
cd '$workspaceDir'
npm install gocardless-nodejs
"@

Write-Host ""
Write-Host "Step 3: Running database migration..." -ForegroundColor Yellow

ssh $serverHost @"
cd '$workspaceDir'
npx prisma migrate deploy
"@

Write-Host ""
Write-Host "Step 4: Building application..." -ForegroundColor Yellow

ssh $serverHost @"
cd '$workspaceDir'
npm run build
"@

Write-Host ""
Write-Host "Step 5: Restarting PM2..." -ForegroundColor Yellow

ssh $serverHost @"
cd '$workspaceDir'
pm2 restart bereifung24-app
"@

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure webhook in GoCardless dashboard"
Write-Host "  2. Test SEPA mandate creation"
Write-Host ""
