#!/bin/bash
# PayPal Environment Setup Script

echo "🔧 PayPal Environment Variable Setup"
echo "======================================"
echo ""
echo "Füge folgende Variablen in /var/www/bereifung24/.env hinzu:"
echo ""
echo "# PayPal SDK (Frontend)"
echo "NEXT_PUBLIC_PAYPAL_CLIENT_ID=\"YOUR_PAYPAL_CLIENT_ID_HERE\""
echo ""
echo "# PayPal Webhook (Backend)"
echo "PAYPAL_WEBHOOK_ID=\"WH-XXXXXXXXXXXXXXXXXXXXXX\""
echo ""
echo "Hinweis:"
echo "- NEXT_PUBLIC_PAYPAL_CLIENT_ID = Gleicher Wert wie PAYPAL_CLIENT_ID"
echo "- PAYPAL_WEBHOOK_ID = Aus PayPal Developer Dashboard kopieren"
echo ""
echo "Danach: pm2 restart bereifung24"
