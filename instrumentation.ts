export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startBillingCron } = await import('./lib/billing-cron')
    startBillingCron()
  }
}
