import nodemailer, { Transporter } from 'nodemailer'
import { Attachment } from 'nodemailer/lib/mailer'

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface EmailOptions {
  from?: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  subject: string
  text?: string
  html?: string
  attachments?: Attachment[]
}

export class SmtpService {
  private config: SmtpConfig
  private transporter: Transporter | null = null

  constructor(config: SmtpConfig) {
    this.config = config
    this.createTransporter()
  }

  /**
   * Nodemailer Transporter erstellen
   */
  private createTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure, // true für 465, false für andere Ports
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      },
    })
  }

  /**
   * Verbindung testen
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false
    }

    try {
      await this.transporter.verify()
      console.log('SMTP connection verified')
      return true
    } catch (error) {
      console.error('SMTP verification failed:', error)
      return false
    }
  }

  /**
   * E-Mail versenden
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized')
    }

    try {
      // Standard-Absender setzen, falls nicht angegeben
      const from = options.from || this.config.auth.user

      const mailOptions = {
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(', ')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(', ')
            : options.bcc
          : undefined,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', info.messageId)
    } catch (error) {
      console.error('Error sending email:', error)
      throw new Error('Failed to send email')
    }
  }

  /**
   * E-Mail mit Signatur versenden
   */
  async sendEmailWithSignature(
    options: EmailOptions,
    signature?: string
  ): Promise<void> {
    // Signatur am Ende des HTML-Inhalts hinzufügen
    if (signature && options.html) {
      options.html = `${options.html}<br><br>${signature}`
    } else if (signature && options.text) {
      options.text = `${options.text}\n\n${signature}`
    }

    await this.sendEmail(options)
  }

  /**
   * Entwurf speichern (im IMAP Drafts-Ordner)
   * Hinweis: Dies ist ein Workaround, da SMTP kein Entwürfe-Konzept hat
   * In der Praxis würde man den Entwurf in der Datenbank speichern
   */
  async saveDraft(options: EmailOptions): Promise<void> {
    // Für echte Entwürfe würde man IMAP.append() verwenden
    // Dies ist eine vereinfachte Implementierung
    console.log('Draft saved (would use IMAP APPEND in production)')
  }
}
