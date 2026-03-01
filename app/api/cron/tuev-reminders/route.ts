import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, tuevReminderEmailTemplate } from '@/lib/email'

/**
 * Cron Job: TÜV Reminder Emails
 * 
 * Runs:
 * - Weekly on Mondays at 09:00 (for 7-day reminders)
 * - Monthly on 1st at 09:00 (for 30-day reminders)
 * 
 * Sends email reminders to customers about upcoming vehicle inspections
 */
export async function GET(request: Request) {
  try {
    // Security: Check for cron secret or authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of day

    // Calculate date ranges
    const in7Days = new Date(today)
    in7Days.setDate(in7Days.getDate() + 7)
    in7Days.setHours(23, 59, 59, 999) // End of day

    const in30Days = new Date(today)
    in30Days.setDate(in30Days.getDate() + 30)
    in30Days.setHours(23, 59, 59, 999) // End of day

    const in31Days = new Date(today)
    in31Days.setDate(in31Days.getDate() + 31) // For 30-day range filtering

    console.log('🔔 TÜV Reminder Cron Job started')
    console.log('📅 Today:', today.toISOString())
    console.log('📅 7 days window:', in7Days.toISOString())
    console.log('📅 30 days window:', in30Days.toISOString())

    // Find vehicles with:
    // 1. inspectionReminder = true
    // 2. nextInspectionDate in the future
    // 3. Either 7 or 30 days away (based on inspectionReminderDays setting)
    const vehiclesNeedingReminder = await prisma.vehicle.findMany({
      where: {
        inspectionReminder: true,
        nextInspectionDate: {
          not: null,
          gte: today, // Only future dates
        }
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    })

    console.log(`✅ Found ${vehiclesNeedingReminder.length} vehicles with reminder enabled`)

    const results = {
      total: vehiclesNeedingReminder.length,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    }

    for (const vehicle of vehiclesNeedingReminder) {
      try {
        const inspectionDate = new Date(vehicle.nextInspectionDate!)
        const daysUntilInspection = Math.ceil((inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        const reminderDays = vehicle.inspectionReminderDays || 30
        const customerEmail = vehicle.customer.user.email

        // Check if we should send reminder based on days setting
        let shouldSend = false
        
        if (reminderDays === 7) {
          // Weekly check: Send if inspection is 7-8 days away
          shouldSend = daysUntilInspection >= 7 && daysUntilInspection <= 8
        } else if (reminderDays === 30) {
          // Monthly check: Send if inspection is 30-31 days away
          shouldSend = daysUntilInspection >= 30 && daysUntilInspection <= 31
        }

        if (!shouldSend) {
          console.log(`⏭️  Skipping vehicle ${vehicle.id} - ${daysUntilInspection} days away (needs ${reminderDays} days)`)
          results.skipped++
          continue
        }

        // Check if we already sent a reminder recently (prevent duplicates)
        const recentReminders = await prisma.vehicle.findFirst({
          where: {
            id: vehicle.id,
            // Custom field to track last reminder sent (we'll need to add this to schema)
            // For now, we rely on the cron schedule to prevent duplicates
          }
        })

        // Prepare email data
        const vehicleName = `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}`
        const customerName = `${vehicle.customer.user.firstName} ${vehicle.customer.user.lastName}`
        const tuevDateFormatted = inspectionDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

        // Send reminder email
        await sendEmail({
          to: customerEmail,
          subject: `🚗 TÜV-Erinnerung: ${vehicleName} – Noch ${daysUntilInspection} Tage`,
          html: tuevReminderEmailTemplate({
            customerName,
            vehicleName,
            licensePlate: vehicle.licensePlate || undefined,
            tuevDate: tuevDateFormatted,
            daysRemaining: daysUntilInspection
          })
        })

        console.log(`✅ Sent reminder to ${customerEmail} for ${vehicleName} (${daysUntilInspection} days)`)
        
        results.sent++
        results.details.push({
          vehicleId: vehicle.id,
          vehicleName,
          customerEmail,
          daysUntilInspection,
          status: 'sent'
        })

      } catch (error) {
        console.error(`❌ Error sending reminder for vehicle ${vehicle.id}:`, error)
        results.errors++
        results.details.push({
          vehicleId: vehicle.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'error'
        })
      }
    }

    console.log('🏁 TÜV Reminder Cron Job completed')
    console.log(`📊 Results: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`)

    return NextResponse.json({
      success: true,
      message: 'TÜV reminder cron job completed',
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('❌ TÜV Reminder Cron Job failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
