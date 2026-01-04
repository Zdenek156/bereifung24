#!/bin/bash
# BEREIFUNG24 - MITARBEITER PORTAL DEPLOYMENT
# Einfach dieses Script auf dem Server ausführen!

echo "🚀 BEREIFUNG24 MITARBEITER PORTAL - DEPLOYMENT"
echo "=============================================="
echo ""

# 1. Aktuellen Code holen
echo "📥 1. Code aktualisieren..."
cd /var/www/bereifung24
git pull origin main

# 2. Dependencies installieren (falls neue hinzugekommen)
echo ""
echo "📦 2. Dependencies prüfen..."
npm install

# 3. Prisma Client generieren
echo ""
echo "⚙️  3. Prisma Client generieren..."
npx prisma generate

# 4. Duplikate finden
echo ""
echo "🔍 4. Duplikate suchen..."
node scripts/find-duplicate-emails.js

echo ""
echo "=============================================="
echo "✅ SCHRITT 1 ABGESCHLOSSEN!"
echo ""
echo "📋 NÄCHSTE SCHRITTE:"
echo ""
echo "Falls DUPLIKATE gefunden wurden:"
echo "  1. Bearbeite: nano scripts/change-employee-email.js"
echo "  2. Trage E-Mail-Änderungen ein"
echo "  3. Führe aus: node scripts/change-employee-email.js"
echo ""
echo "Falls KEINE DUPLIKATE:"
echo "  1. Prüfe Accounts: node scripts/check-all-accounts.js"
echo "  2. Erstelle Mitarbeiter: node scripts/create-test-employee.js"
echo "  3. Deploy Portal: ./deploy-employee-portal.sh"
echo ""
