export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { startBillingCron } = await import('./lib/billing-cron')
      startBillingCron()
    } catch (error) {
      console.error('Failed to start billing cron:', error)
    }
  }
}
