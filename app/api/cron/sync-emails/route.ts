import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email/email-service'

/**
 * Cron Job: Email Synchronisierung
 * 
 * Synchronisiert E-Mails für alle Mitarbeiter die E-Mail-Einstellungen haben
 * Sollte alle 5-15 Minuten ausgeführt werden
 * 
 * Vercel Cron:
 * In vercel.json hinzufügen:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-emails",
 *     "schedule": "*/10 * * * *"
 *   }]
 * }
 * 
 * Oder via externem Cron (z.B. crontab):
 * */10 * * * * curl -X GET https://bereifung24.de/api/cron/sync-emails
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [CRON] Starting email sync for all employees...')

    // Authorization check (Optional: Add secret token)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token-here'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.log('⚠️ [CRON] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Alle Mitarbeiter mit E-Mail-Einstellungen finden
    const employees = await prisma.b24Employee.findMany({
      where: {
        emailSettings: {
          some: {}
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    })

    console.log(`📧 [CRON] Found ${employees.length} employees with email settings`)

    const results = {
      total: employees.length,
      synced: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Für jeden Mitarbeiter E-Mails synchronisieren
    for (const employee of employees) {
      try {
        console.log(`📬 [CRON] Syncing emails for ${employee.firstName} ${employee.lastName} (${employee.email})`)
        
        const emailService = new EmailService(employee.id, true)
        
        // Prüfen ob Einstellungen existieren
        const hasSettings = await emailService.hasSettings()
        if (!hasSettings) {
          console.log(`⏭️ [CRON] Skipping ${employee.email} - no valid settings`)
          continue
        }

        // E-Mails synchronisieren (nur neue/ungelesene)
        await emailService.syncMessages('INBOX', 50)
        
        results.synced++
        console.log(`✅ [CRON] Successfully synced emails for ${employee.email}`)
      } catch (error: any) {
        console.error(`❌ [CRON] Failed to sync emails for ${employee.email}:`, error.message)
        results.failed++
        results.errors.push(`${employee.email}: ${error.message}`)
      }
    }

    console.log('✅ [CRON] Email sync completed:', results)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error: any) {
    console.error('❌ [CRON] Email sync job failed:', error)
    return NextResponse.json(
      { error: error.message || 'Email sync failed' },
      { status: 500 }
    )
  }
}

// Auch POST unterstützen für manuelle Trigger
export async function POST(request: NextRequest) {
  return GET(request)
}
