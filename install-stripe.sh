#!/bin/bash

# Install Stripe dependencies for payment processing

echo "📦 Installing Stripe packages..."

npm install stripe@latest @stripe/stripe-js@latest @stripe/react-stripe-js@latest

echo "✅ Stripe packages installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Add STRIPE_SECRET_KEY to .env (get from https://dashboard.stripe.com/apikeys)"
echo "2. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env"
echo "3. Restart the development server"
echo ""
echo "🔗 Stripe Dashboard: https://dashboard.stripe.com"
echo "📚 Stripe Docs: https://stripe.com/docs"
