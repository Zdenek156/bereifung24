import { ImapService, ImapConfig, EmailMessage } from './imap-service'
import { SmtpService, SmtpConfig, EmailOptions } from './smtp-service'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Verschlüsselungs-Key (in Produktion aus env laden)
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'default-key-32-chars-long-here'
const ENCRYPTION_IV_LENGTH = 16

/**
 * Passwort verschlüsseln
 */
export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  )
  let encrypted = cipher.update(password)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

/**
 * Passwort entschlüsseln
 */
export function decryptPassword(encryptedPassword: string): string {
  const parts = encryptedPassword.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedText = Buffer.from(parts[1], 'hex')
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
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

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * E-Mail-Einstellungen des Benutzers abrufen
   */
  async getEmailSettings() {
    const settings = await prisma.emailSettings.findUnique({
      where: { userId: this.userId },
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
      password: decryptPassword(settings.imapPassword),
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

    const config: SmtpConfig = {
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: decryptPassword(settings.smtpPassword),
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
  }
) {
  // Passwörter verschlüsseln
  const encryptedPassword = encryptPassword(settings.imapPassword)

  return await prisma.emailSettings.upsert({
    where: { userId },
    update: {
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
    },
    create: {
      userId,
      imapHost: settings.imapHost,
      imapPort: settings.imapPort,
      imapUser: settings.imapUser,
      imapPassword: encryptedPassword,
      imapTls: settings.imapTls,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpPassword: encryptedPassword,
      smtpSecure: settings.smtpSecure,
      syncEnabled: settings.syncEnabled,
      syncInterval: settings.syncInterval,
    },
  })
}
