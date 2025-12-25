import { sendEmail } from './email'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface NewSuggestionNotificationData {
  suggestionId: string
  title: string
  category: string
  priority: string
  submitterName: string
}

interface StatusChangeNotificationData {
  suggestionId: string
  title: string
  oldStatus: string
  newStatus: string
  changedBy: string
  submitterId: string
  assigneeId?: string | null
}

interface NewCommentNotificationData {
  suggestionId: string
  suggestionTitle: string
  commentText: string
  authorName: string
  submitterId: string
  assigneeId?: string | null
}

/**
 * Benachrichtigt alle Admins über einen neuen Verbesserungsvorschlag
 */
export async function notifyAdminsOfNewSuggestion(data: NewSuggestionNotificationData) {
  try {
    // Hole alle Admins (User mit role ADMIN)
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true
      },
      select: {
        email: true,
        name: true
      }
    })

    if (admins.length === 0) {
      console.log('⚠️ Keine Admins gefunden für KVP-Benachrichtigung')
      return
    }

    const categoryLabels: Record<string, string> = {
      PROCESS: 'Prozess',
      PRODUCT: 'Produkt',
      CUSTOMER_SERVICE: 'Kundenservice',
      TECHNOLOGY: 'Technologie',
      WORKPLACE: 'Arbeitsplatz',
      OTHER: 'Sonstiges'
    }

    const priorityLabels: Record<string, string> = {
      LOW: 'Niedrig',
      MEDIUM: 'Mittel',
      HIGH: 'Hoch',
      CRITICAL: 'Kritisch'
    }

    const emailPromises = admins.map(admin => 
      sendEmail({
        to: admin.email,
        subject: `[KVP] Neuer Verbesserungsvorschlag: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Neuer Verbesserungsvorschlag eingereicht</h2>
            
            <p>Hallo ${admin.name || 'Admin'},</p>
            
            <p>${data.submitterName} hat einen neuen Verbesserungsvorschlag eingereicht:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">${data.title}</h3>
              <p style="margin: 10px 0;">
                <strong>Kategorie:</strong> ${categoryLabels[data.category] || data.category}<br>
                <strong>Priorität:</strong> <span style="color: ${
                  data.priority === 'CRITICAL' ? '#dc2626' : 
                  data.priority === 'HIGH' ? '#ea580c' : 
                  data.priority === 'MEDIUM' ? '#ca8a04' : '#16a34a'
                };">${priorityLabels[data.priority] || data.priority}</span>
              </p>
            </div>
            
            <p>
              <a href="${process.env.NEXTAUTH_URL}/admin/kvp/${data.suggestionId}" 
                 style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                Vorschlag ansehen
              </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Diese E-Mail wurde automatisch vom KVP-System gesendet.
            </p>
          </div>
        `,
        text: `Neuer Verbesserungsvorschlag: ${data.title}\n\nKategorie: ${categoryLabels[data.category]}\nPriorität: ${priorityLabels[data.priority]}\nEingereicht von: ${data.submitterName}\n\nLink: ${process.env.NEXTAUTH_URL}/admin/kvp/${data.suggestionId}`
      })
    )

    await Promise.allSettled(emailPromises)
    console.log(`✅ ${admins.length} Admin(s) über neuen KVP-Vorschlag benachrichtigt`)
  } catch (error) {
    console.error('❌ Fehler beim Benachrichtigen der Admins:', error)
  }
}

/**
 * Benachrichtigt Einreicher und Zugewiesenen über Status-Änderung
 */
export async function notifyStatusChange(data: StatusChangeNotificationData) {
  try {
    const recipients: Array<{ email: string; name: string; role: string }> = []

    // Hole Einreicher-Details
    const submitter = await prisma.b24Employee.findUnique({
      where: { id: data.submitterId },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    })

    if (submitter) {
      recipients.push({
        email: submitter.email,
        name: `${submitter.firstName} ${submitter.lastName}`,
        role: 'submitter'
      })
    }

    // Hole Zugewiesenen-Details (falls vorhanden)
    if (data.assigneeId) {
      const assignee = await prisma.b24Employee.findUnique({
        where: { id: data.assigneeId },
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      })

      if (assignee && assignee.email !== submitter?.email) {
        recipients.push({
          email: assignee.email,
          name: `${assignee.firstName} ${assignee.lastName}`,
          role: 'assignee'
        })
      }
    }

    if (recipients.length === 0) {
      console.log('⚠️ Keine Empfänger für Status-Änderung gefunden')
      return
    }

    const statusLabels: Record<string, string> = {
      SUBMITTED: 'Eingereicht',
      UNDER_REVIEW: 'In Prüfung',
      APPROVED: 'Genehmigt',
      IN_PROGRESS: 'In Bearbeitung',
      IMPLEMENTED: 'Umgesetzt',
      REJECTED: 'Abgelehnt',
      ON_HOLD: 'Zurückgestellt'
    }

    const emailPromises = recipients.map(recipient => 
      sendEmail({
        to: recipient.email,
        subject: `[KVP] Status-Änderung: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Verbesserungsvorschlag aktualisiert</h2>
            
            <p>Hallo ${recipient.name},</p>
            
            <p>Der Status des Verbesserungsvorschlags wurde geändert:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">${data.title}</h3>
              <p style="margin: 10px 0;">
                <strong>Alter Status:</strong> ${statusLabels[data.oldStatus] || data.oldStatus}<br>
                <strong>Neuer Status:</strong> <span style="color: #4f46e5; font-weight: bold;">${statusLabels[data.newStatus] || data.newStatus}</span><br>
                <strong>Geändert von:</strong> ${data.changedBy}
              </p>
            </div>
            
            <p>
              <a href="${process.env.NEXTAUTH_URL}/admin/kvp/${data.suggestionId}" 
                 style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                Details ansehen
              </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Diese E-Mail wurde automatisch vom KVP-System gesendet.
            </p>
          </div>
        `,
        text: `Status-Änderung: ${data.title}\n\nAlter Status: ${statusLabels[data.oldStatus]}\nNeuer Status: ${statusLabels[data.newStatus]}\nGeändert von: ${data.changedBy}\n\nLink: ${process.env.NEXTAUTH_URL}/admin/kvp/${data.suggestionId}`
      })
    )

    await Promise.allSettled(emailPromises)
    console.log(`✅ ${recipients.length} Person(en) über Status-Änderung benachrichtigt`)
  } catch (error) {
    console.error('❌ Fehler beim Benachrichtigen über Status-Änderung:', error)
  }
}

/**
 * Benachrichtigt Einreicher und Zugewiesenen über neuen Kommentar
 */
export async function notifyNewComment(data: NewCommentNotificationData) {
  try {
    const recipients: Array<{ email: string; name: string }> = []

    // Hole Einreicher-Details
    const submitter = await prisma.b24Employee.findUnique({
      where: { id: data.submitterId },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    })

    if (submitter) {
      recipients.push({
        email: submitter.email,
        name: `${submitter.firstName} ${submitter.lastName}`
      })
    }

    // Hole Zugewiesenen-Details (falls vorhanden)
    if (data.assigneeId) {
      const assignee = await prisma.b24Employee.findUnique({
        where: { id: data.assigneeId },
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      })

      if (assignee && assignee.email !== submitter?.email) {
        recipients.push({
          email: assignee.email,
          name: `${assignee.firstName} ${assignee.lastName}`
        })
      }
    }

    if (recipients.length === 0) {
      console.log('⚠️ Keine Empfänger für Kommentar-Benachrichtigung gefunden')
      return
    }

    const emailPromises = recipients.map(recipient => 
      sendEmail({
        to: recipient.email,
        subject: `[KVP] Neuer Kommentar: ${data.suggestionTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Neuer Kommentar zu Verbesserungsvorschlag</h2>
            
            <p>Hallo ${recipient.name},</p>
            
            <p>${data.authorName} hat einen Kommentar zu folgendem Vorschlag hinzugefügt:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">${data.suggestionTitle}</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 10px;">
                <p style="margin: 0; color: #374151;">${data.commentText}</p>
              </div>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                — ${data.authorName}
              </p>
            </div>
            
            <p>
              <a href="${process.env.NEXTAUTH_URL}/admin/kvp/${data.suggestionId}" 
                 style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                Kommentar ansehen
              </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Diese E-Mail wurde automatisch vom KVP-System gesendet.
            </p>
          </div>
        `,
        text: `Neuer Kommentar zu: ${data.suggestionTitle}\n\n${data.commentText}\n\n— ${data.authorName}\n\nLink: ${process.env.NEXTAUTH_URL}/admin/kvp/${data.suggestionId}`
      })
    )

    await Promise.allSettled(emailPromises)
    console.log(`✅ ${recipients.length} Person(en) über neuen Kommentar benachrichtigt`)
  } catch (error) {
    console.error('❌ Fehler beim Benachrichtigen über neuen Kommentar:', error)
  }
}
