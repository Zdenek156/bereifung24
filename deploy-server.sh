#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd /var/www/bereifung24
echo '📥 Running Prisma migration...'
npx prisma migrate deploy
echo '🔄 Generating Prisma Client...'
npx prisma generate
echo '🏗️ Building Next.js...'
npm run build
echo '🔄 Restarting PM2...'
pm2 restart bereifung24
echo '✅ Deployment complete!'
