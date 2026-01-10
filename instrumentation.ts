export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Start billing cron job
      const { startBillingCron } = await import('./lib/billing-cron')
      startBillingCron()

      // Start depreciation cron job
      const { startDepreciationCron } = await import('./lib/depreciation-cron')
      startDepreciationCron()
    } catch (error) {
      console.error('Failed to start cron jobs:', error)
    }
  }
}
