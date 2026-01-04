#!/bin/bash

echo "🚀 Employee Portal Migration auf Hetzner Server"
echo "=============================================="
echo ""

# 1. Prisma Client generieren
echo "📦 Schritt 1: Prisma Client generieren..."
npx prisma generate

# 2. Datenbank-Schema anwenden
echo ""
echo "🗄️  Schritt 2: Datenbank-Schema anwenden..."
echo "   Erstelle 5 neue Tabellen:"
echo "   - employee_profiles (Stammdaten, verschlüsselt)"
echo "   - employee_documents (Dokumenten-Management)"
echo "   - leave_balances (Urlaubskonto)"
echo "   - leave_requests (Urlaubsanträge)"
echo "   - sick_leaves (Krankmeldungen)"
echo ""

npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Datenbank-Migration erfolgreich!"
  
  # 3. ENCRYPTION_KEY in Datenbank speichern
  echo ""
  echo "🔐 Schritt 3: ENCRYPTION_KEY in Datenbank speichern..."
  node scripts/setup-employee-portal.js
  
  # 4. PM2 Restart
  echo ""
  echo "♻️  Schritt 4: Next.js App neu starten..."
  pm2 restart bereifung24
  
  echo ""
  echo "✨ Migration abgeschlossen!"
  echo ""
  echo "📋 Nächste Schritte:"
  echo "   1. Öffne https://www.bereifung24.de/mitarbeiter"
  echo "   2. Teste Dashboard-Statistiken"
  echo "   3. Gehe zu Profil-Seite und fülle Stammdaten aus"
  echo "   4. Prüfe ENCRYPTION_KEY in /admin/api-settings"
  echo ""
else
  echo ""
  echo "❌ Fehler bei der Migration!"
  echo "Bitte prüfe die Fehlermeldung oben."
  exit 1
fi
