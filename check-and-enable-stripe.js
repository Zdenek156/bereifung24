const { PrismaClient } = require('@prisma/client')
const Stripe = require('stripe')
const prisma = new PrismaClient()

async function checkAndEnableStripeAccount() {
  try {
    console.log('🔍 Prüfe Luxus24 Stripe Account...\n')
    
    // Get workshop
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Luxus24' },
      include: { user: true }
    })

    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden')
      return
    }

    if (!workshop.stripeAccountId) {
      console.log('❌ Keine Stripe Account ID vorhanden')
      return
    }

    console.log('✅ Werkstatt:', workshop.companyName)
    console.log('📧 Email:', workshop.user.email)
    console.log('🆔 Stripe Account ID:', workshop.stripeAccountId)
    console.log('📊 Current Status:', workshop.stripeEnabled ? 'Enabled ✅' : 'Disabled ❌')

    // Get Stripe secret key from environment variable
    const stripeKey = process.env.STRIPE_SECRET_KEY
    
    if (!stripeKey) {
      console.log('\n❌ Stripe Secret Key nicht gefunden')
      console.log('Bitte STRIPE_SECRET_KEY als Environment Variable setzen oder direkt im Code eintragen')
      return
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18',
    })

    // Check account status with Stripe
    console.log('\n🔍 Prüfe Account-Status bei Stripe...')
    const account = await stripe.accounts.retrieve(workshop.stripeAccountId)

    console.log('\n📋 Stripe Account Details:')
    console.log('===================================')
    console.log('Account ID:', account.id)
    console.log('Email:', account.email)
    console.log('Business Name:', account.business_profile?.name)
    console.log('Business Type:', account.business_type)
    console.log('Country:', account.country)
    console.log('\n💰 Capabilities:')
    console.log('Charges Enabled:', account.charges_enabled ? '✅' : '❌')
    console.log('Payouts Enabled:', account.payouts_enabled ? '✅' : '❌')
    console.log('Details Submitted:', account.details_submitted ? '✅' : '❌')

    if (account.requirements) {
      console.log('\n📝 Requirements:')
      console.log('Currently Due:', account.requirements.currently_due?.length || 0, 'items')
      console.log('Eventually Due:', account.requirements.eventually_due?.length || 0, 'items')
      console.log('Past Due:', account.requirements.past_due?.length || 0, 'items')
      
      if (account.requirements.currently_due && account.requirements.currently_due.length > 0) {
        console.log('\n⚠️ Fehlende Informationen:')
        account.requirements.currently_due.forEach(req => console.log('  -', req))
      }
    }

    // Check if account is fully set up
    if (account.charges_enabled && account.details_submitted) {
      console.log('\n✅ Account ist vollständig eingerichtet!')
      
      if (!workshop.stripeEnabled) {
        console.log('🔄 Aktiviere Stripe in Datenbank...')
        await prisma.workshop.update({
          where: { id: workshop.id },
          data: { stripeEnabled: true }
        })
        console.log('✅ Stripe erfolgreich aktiviert!')
      } else {
        console.log('ℹ️  Stripe ist bereits aktiviert in der Datenbank')
      }
    } else {
      console.log('\n⚠️ Account-Setup ist noch nicht abgeschlossen!')
      console.log('Der User muss das Onboarding bei Stripe fertigstellen.')
      
      // Create new onboarding link
      console.log('\n🔗 Erstelle neuen Onboarding-Link...')
      const accountLink = await stripe.accountLinks.create({
        account: workshop.stripeAccountId,
        refresh_url: 'https://bereifung24.de/dashboard/workshop/settings?stripe_refresh=true',
        return_url: 'https://bereifung24.de/dashboard/workshop/settings?stripe_onboarding=success',
        type: 'account_onboarding',
        collection_options: {
          fields: 'currently_due',
          future_requirements: 'omit',
        },
      })
      
      console.log('\n📎 Onboarding-Link:')
      console.log(accountLink.url)
      console.log('\n👉 Senden Sie diesen Link an den User oder öffnen Sie ihn im Browser.')
    }

  } catch (error) {
    console.error('\n❌ Fehler:', error.message)
    if (error.raw) {
      console.error('Details:', error.raw.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkAndEnableStripeAccount()
