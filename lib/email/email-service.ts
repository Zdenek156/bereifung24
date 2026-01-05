import { ImapService, ImapConfig, EmailMessage } from './imap-service'
import { SmtpService, SmtpConfig, EmailOptions } from './smtp-service'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const ENCRYPTION_IV_LENGTH = 16

/**
 * Get encryption key from user's email settings or generate a new one
 */
async function getEncryptionKey(userId: string): Promise<string> {
  const settings = await prisma.emailSettings.findUnique({
    where: { userId },
    select: { encryptionKey: true }
  })
  
  if (settings?.encryptionKey) {
    return settings.encryptionKey
  }
  
  // Generate new 32-byte key for AES-256
  const newKey = crypto.randomBytes(32).toString('hex').substring(0, 32)
  
  // Save it to settings if they exist
  await prisma.emailSettings.updateMany({
    where: { userId },
    data: { encryptionKey: newKey }
  })
  
  return newKey
}

/**
 * Passwort verschlüsseln
 */
export async function encryptPassword(password: string, userId: string): Promise<string> {
  const key = await getEncryptionKey(userId)
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(key),
    iv
  )
  let encrypted = cipher.update(password)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

/**
 * Passwort entschlüsseln
 */
export async function decryptPassword(encryptedPassword: string, userId: string): Promise<string> {
  const key = await getEncryptionKey(userId)
  const parts = encryptedPassword.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedText = Buffer.from(parts[1], 'hex')
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key),
    iv
  )
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

/**
 * Email-Service - Kombiniert IMAP und SMTP
 */
export class EmailService {
  private userId: string
  private isB24Employee: boolean

  constructor(userId: string, isB24Employee: boolean = false) {
    this.userId = userId
    this.isB24Employee = isB24Employee
  }

  /**
   * Prüfen, ob E-Mail-Einstellungen existieren
   */
  async hasSettings(): Promise<boolean> {
    const whereClause = this.isB24Employee
      ? { b24EmployeeId: this.userId }
      : { userId: this.userId }
    
    const settings = await prisma.emailSettings.findUnique({
      where: whereClause,
      select: { id: true },
    })
    return !!settings
  }

  /**
   * E-Mail-Einstellungen des Benutzers abrufen
   */
  async getEmailSettings() {
    const whereClause = this.isB24Employee
      ? { b24EmployeeId: this.userId }
      : { userId: this.userId }
    
    const settings = await prisma.emailSettings.findUnique({
      where: whereClause,
    })

    if (!settings) {
      throw new Error('Email settings not configured')
    }

    return settings
  }

  /**
   * IMAP-Service initialisieren
   */
  async getImapService(): Promise<ImapService> {
    const settings = await this.getEmailSettings()

    const config: ImapConfig = {
      user: settings.imapUser,
      password: await decryptPassword(settings.imapPassword, this.userId),
      host: settings.imapHost,
      port: settings.imapPort,
      tls: settings.imapTls,
    }

    return new ImapService(config)
  }

  /**
   * SMTP-Service initialisieren
   */
  async getSmtpService(): Promise<SmtpService> {
    const settings = await this.getEmailSettings()

    // Automatische Bestimmung der Verschlüsselung basierend auf Port
    // Port 465 = SSL/TLS (secure: true)
    // Port 587 = STARTTLS (secure: false)
    // Andere Ports = Benutzereinstellung
    let secure = settings.smtpSecure
    if (settings.smtpPort === 465) {
      secure = true
    } else if (settings.smtpPort === 587) {
      secure = false
    }

    const config: SmtpConfig = {
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: secure,
      auth: {
        user: settings.smtpUser,
        pass: await decryptPassword(settings.smtpPassword, this.userId),
      },
    }

    return new SmtpService(config)
  }

  /**
   * E-Mails aus IMAP abrufen und in DB cachen
   */
  async syncMessages(folder: string = 'INBOX', limit?: number): Promise<void> {
    const imapService = await this.getImapService()

    try {
      const messages = await imapService.fetchMessages(folder, limit)

      // E-Mails in Datenbank speichern (Cache)
      for (const message of messages) {
        await prisma.emailMessage.upsert({
          where: {
            userId_uid_folder: {
              userId: this.userId,
              uid: message.uid,
              folder: message.folder,
            },
          },
          update: {
            messageId: message.messageId,
            from: message.from,
            to: message.to,
            cc: message.cc || [],
            bcc: message.bcc || [],
            replyTo: message.replyTo,
            subject: message.subject,
            date: message.date,
            textContent: message.textContent,
            htmlContent: message.htmlContent,
            attachments: message.attachments as any,
            flags: message.flags,
            isRead: message.flags.includes('\\Seen'),
            isFlagged: message.flags.includes('\\Flagged'),
          },
          create: {
            userId: this.userId,
            uid: message.uid,
            messageId: message.messageId,
            folder: message.folder,
            from: message.from,
            to: message.to,
            cc: message.cc || [],
            bcc: message.bcc || [],
            replyTo: message.replyTo,
            subject: message.subject,
            date: message.date,
            textContent: message.textContent,
            htmlContent: message.htmlContent,
            attachments: message.attachments as any,
            flags: message.flags,
            isRead: message.flags.includes('\\Seen'),
            isFlagged: message.flags.includes('\\Flagged'),
          },
        })
      }

      // lastSyncedAt aktualisieren
      await prisma.emailSettings.update({
        where: { userId: this.userId },
        data: { lastSyncedAt: new Date() },
      })
    } catch (error) {
      console.error('Error syncing messages:', error)
      throw error
    }
  }

  /**
   * E-Mail versenden
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const smtpService = await this.getSmtpService()

    // Signatur abrufen, falls vorhanden
    const signature = await prisma.emailSignature.findUnique({
      where: { userId: this.userId },
    })

    if (signature && signature.enabled) {
      await smtpService.sendEmailWithSignature(options, signature.htmlContent)
    } else {
      await smtpService.sendEmail(options)
    }

    // Gesendete E-Mail im IMAP Sent-Ordner speichern
    try {
      const imapService = await this.getImapService()
      const settings = await this.getEmailSettings()
      
      // Erstelle rohe E-Mail im RFC822-Format
      const from = options.from || settings.smtpUser
      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to
      const date = new Date().toUTCString()
      
      let rawMessage = `From: ${from}\r\n`
      rawMessage += `To: ${to}\r\n`
      if (options.cc) {
        const cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc
        rawMessage += `Cc: ${cc}\r\n`
      }
      rawMessage += `Subject: ${options.subject}\r\n`
      rawMessage += `Date: ${date}\r\n`
      rawMessage += `MIME-Version: 1.0\r\n`
      
      if (options.html) {
        rawMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`
        rawMessage += options.html
      } else {
        rawMessage += `Content-Type: text/plain; charset=utf-8\r\n\r\n`
        rawMessage += options.text || ''
      }
      
      await imapService.appendMessage('INBOX.Sent', rawMessage, ['\\Seen'])
    } catch (error) {
      console.error('Error saving sent message to IMAP:', error)
      // Nicht werfen, da die E-Mail bereits versendet wurde
    }
  }

  /**
   * E-Mails aus Cache abrufen
   */
  async getCachedMessages(folder: string = 'INBOX', limit: number = 50) {
    return await prisma.emailMessage.findMany({
      where: {
        userId: this.userId,
        folder,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    })
  }

  /**
   * Einzelne E-Mail aus Cache abrufen
   */
  async getCachedMessage(uid: number, folder: string = 'INBOX') {
    return await prisma.emailMessage.findUnique({
      where: {
        userId_uid_folder: {
          userId: this.userId,
          uid,
          folder,
        },
      },
    })
  }

  /**
   * E-Mail anhand Datenbank-ID abrufen
   */
  async getMessageById(id: string) {
    return await prisma.emailMessage.findFirst({
      where: {
        id,
        userId: this.userId,
      },
    })
  }

  /**
   * E-Mail als gelesen markieren
   */
  async markAsRead(uid: number, folder: string = 'INBOX'): Promise<void> {
    const imapService = await this.getImapService()
    await imapService.updateFlags(uid, ['\\Seen'], folder)

    // Cache aktualisieren
    await prisma.emailMessage.update({
      where: {
        userId_uid_folder: {
          userId: this.userId,
          uid,
          folder,
        },
      },
      data: { isRead: true },
    })
  }

  /**
   * E-Mail löschen
   */
  async deleteMessage(uid: number, folder: string = 'INBOX'): Promise<void> {
    const imapService = await this.getImapService()
    await imapService.deleteMessage(uid, folder)

    // Aus Cache entfernen
    await prisma.emailMessage.delete({
      where: {
        userId_uid_folder: {
          userId: this.userId,
          uid,
          folder,
        },
      },
    })
  }

  /**
   * E-Mail in Papierkorb verschieben
   */
  async moveToTrash(uid: number, fromFolder: string = 'INBOX'): Promise<void> {
    const imapService = await this.getImapService()
    
    try {
      await imapService.moveMessage(uid, fromFolder, 'INBOX.Trash')
      
      // Cache aktualisieren
      await prisma.emailMessage.updateMany({
        where: {
          userId: this.userId,
          uid,
          folder: fromFolder,
        },
        data: {
          folder: 'INBOX.Trash',
        },
      })
    } catch (error) {
      console.error('Error moving message to trash:', error)
      throw error
    }
  }

  /**
   * E-Mail dauerhaft löschen
   */
  async deleteMessage(uid: number, folder: string = 'INBOX.Trash'): Promise<void> {
    const imapService = await this.getImapService()
    
    try {
      await imapService.deleteMessage(uid, folder)
      
      // Aus Cache entfernen
      await prisma.emailMessage.deleteMany({
        where: {
          userId: this.userId,
          uid,
          folder,
        },
      })
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  /**
   * Entwurf speichern
   */
  async saveDraft(options: EmailOptions): Promise<void> {
    const imapService = await this.getImapService()
    const settings = await this.getEmailSettings()
    
    try {
      // Erstelle rohe E-Mail im RFC822-Format
      const from = options.from || settings.smtpUser
      const to = Array.isArray(options.to) ? options.to.join(', ') : options.to
      const date = new Date().toUTCString()
      
      let rawMessage = `From: ${from}\r\n`
      rawMessage += `To: ${to}\r\n`
      if (options.cc) {
        const cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc
        rawMessage += `Cc: ${cc}\r\n`
      }
      rawMessage += `Subject: ${options.subject}\r\n`
      rawMessage += `Date: ${date}\r\n`
      rawMessage += `MIME-Version: 1.0\r\n`
      rawMessage += `X-Draft: true\r\n`
      
      if (options.html) {
        rawMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`
        rawMessage += options.html
      } else {
        rawMessage += `Content-Type: text/plain; charset=utf-8\r\n\r\n`
        rawMessage += options.text || ''
      }
      
      await imapService.appendMessage('INBOX.Drafts', rawMessage, ['\\Draft'])
    } catch (error) {
      console.error('Error saving draft:', error)
      throw error
    }
  }
}

/**
 * E-Mail-Einstellungen erstellen/aktualisieren
 */
export async function saveEmailSettings(
  userId: string,
  settings: {
    imapHost: string
    imapPort: number
    imapUser: string
    imapPassword: string
    imapTls: boolean
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    smtpSecure: boolean
    syncEnabled: boolean
    syncInterval: number
  },
  isB24Employee: boolean = false
) {
  // Passwörter verschlüsseln
  const encryptedPassword = await encryptPassword(settings.imapPassword, userId)

  // Wenn B24Employee, müssen wir die Employee ID finden
  let employeeId: string | undefined
  if (isB24Employee) {
    const employee = await prisma.b24Employee.findUnique({
      where: { userId },
      select: { id: true }
    })
    if (!employee) {
      throw new Error('B24Employee not found for user')
    }
    employeeId = employee.id
  }

  // Determine which field to use based on user type
  const whereClause = isB24Employee && employeeId
    ? { b24EmployeeId: employeeId } 
    : { userId }

  const updateData = {
    imapHost: settings.imapHost,
    imapPort: settings.imapPort,
    imapUser: settings.imapUser,
    imapPassword: encryptedPassword,
    imapTls: settings.imapTls,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPassword: encryptedPassword, // Gleiche Credentials
    smtpSecure: settings.smtpSecure,
    syncEnabled: settings.syncEnabled,
    syncInterval: settings.syncInterval,
  }

  const createData = {
    ...updateData,
    ...(isB24Employee && employeeId ? { b24EmployeeId: employeeId } : { userId }),
  }

  return await prisma.emailSettings.upsert({
    where: whereClause,
    update: updateData,
    create: createData,
  })
}
