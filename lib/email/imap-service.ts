import Imap from 'node-imap'
import { simpleParser } from 'mailparser'
import { Readable } from 'stream'

export interface ImapConfig {
  user: string
  password: string
  host: string
  port: number
  tls: boolean
}

export interface EmailMessage {
  uid: number
  messageId?: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  subject: string
  date: Date
  textContent?: string
  htmlContent?: string
  attachments?: Array<{
    filename: string
    contentType: string
    size: number
  }>
  flags: string[]
  folder: string
}

export class ImapService {
  private config: ImapConfig
  private imap: Imap | null = null

  constructor(config: ImapConfig) {
    this.config = config
  }

  /**
   * Verbindung zum IMAP-Server herstellen
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap = new Imap(this.config)

      this.imap.once('ready', () => {
        console.log('IMAP connection ready')
        resolve()
      })

      this.imap.once('error', (err: Error) => {
        console.error('IMAP connection error:', err)
        reject(err)
      })

      this.imap.once('end', () => {
        console.log('IMAP connection ended')
      })

      this.imap.connect()
    })
  }

  /**
   * Verbindung trennen
   */
  disconnect(): void {
    if (this.imap) {
      this.imap.end()
      this.imap = null
    }
  }

  /**
   * Ordner öffnen (z.B. INBOX, Sent, Drafts)
   */
  private async openBox(boxName: string, readOnly: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'))
      }

      this.imap.openBox(boxName, readOnly, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Alle E-Mails aus einem Ordner abrufen
   */
  async fetchMessages(
    folder: string = 'INBOX',
    limit?: number
  ): Promise<EmailMessage[]> {
    await this.connect()
    await this.openBox(folder)

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'))
      }

      this.imap.search(['ALL'], (err, uids) => {
        if (err) {
          this.disconnect()
          return reject(err)
        }

        if (!uids || uids.length === 0) {
          this.disconnect()
          return resolve([])
        }

        // Limitiere die Anzahl der abgerufenen Nachrichten
        const fetchUids = limit ? uids.slice(-limit) : uids

        const fetch = this.imap!.fetch(fetchUids, {
          bodies: '',
          struct: true,
        })

        const messages: EmailMessage[] = []
        const parsedMessages: Map<number, Partial<EmailMessage>> = new Map()

        fetch.on('message', (msg, seqno) => {
          let uid = 0
          const flags: string[] = []

          msg.on('body', (stream: Readable) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                console.error('Error parsing email:', err)
                return
              }

              const messageData = {
                uid,
                messageId: parsed.messageId,
                from: parsed.from?.text || '',
                to: parsed.to?.value.map((addr) => addr.address || '') || [],
                cc: parsed.cc?.value.map((addr) => addr.address || '') || [],
                bcc: parsed.bcc?.value.map((addr) => addr.address || '') || [],
                replyTo: parsed.replyTo?.value[0]?.address,
                subject: parsed.subject || '',
                date: parsed.date || new Date(),
                textContent: parsed.text,
                htmlContent: parsed.html || undefined,
                attachments: parsed.attachments.map((att) => ({
                  filename: att.filename || 'unknown',
                  contentType: att.contentType,
                  size: att.size,
                })),
                flags,
                folder,
              }

              parsedMessages.set(uid, messageData)
            })
          })

          msg.once('attributes', (attrs: any) => {
            uid = attrs.uid
            if (attrs.flags) {
              flags.push(...attrs.flags)
            }
          })
        })

        fetch.once('error', (err) => {
          this.disconnect()
          reject(err)
        })

        fetch.once('end', () => {
          // Wait a bit for all parsing to complete
          setTimeout(() => {
            messages.push(...Array.from(parsedMessages.values()) as EmailMessage[])
            this.disconnect()
            resolve(messages)
          }, 1000)
        })
      })
    })
  }

  /**
   * Einzelne E-Mail anhand UID abrufen
   */
  async fetchMessageByUid(
    uid: number,
    folder: string = 'INBOX'
  ): Promise<EmailMessage | null> {
    await this.connect()
    await this.openBox(folder)

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'))
      }

      const fetch = this.imap.fetch([uid], {
        bodies: '',
        struct: true,
      })

      let message: EmailMessage | null = null
      const flags: string[] = []

      fetch.on('message', (msg) => {
        msg.on('body', (stream: Readable) => {
          simpleParser(stream, async (err, parsed) => {
            if (err) {
              console.error('Error parsing email:', err)
              return
            }

            message = {
              uid,
              messageId: parsed.messageId,
              from: parsed.from?.text || '',
              to: parsed.to?.value.map((addr) => addr.address || '') || [],
              cc: parsed.cc?.value.map((addr) => addr.address || '') || [],
              bcc: parsed.bcc?.value.map((addr) => addr.address || '') || [],
              replyTo: parsed.replyTo?.value[0]?.address,
              subject: parsed.subject || '',
              date: parsed.date || new Date(),
              textContent: parsed.text,
              htmlContent: parsed.html || undefined,
              attachments: parsed.attachments.map((att) => ({
                filename: att.filename || 'unknown',
                contentType: att.contentType,
                size: att.size,
              })),
              flags,
              folder,
            }
          })
        })

        msg.once('attributes', (attrs: any) => {
          if (attrs.flags) {
            flags.push(...attrs.flags)
          }
        })
      })

      fetch.once('error', (err) => {
        this.disconnect()
        reject(err)
      })

      fetch.once('end', () => {
        this.disconnect()
        resolve(message)
      })
    })
  }

  /**
   * E-Mail-Flags aktualisieren (z.B. als gelesen markieren)
   */
  async updateFlags(
    uid: number,
    flags: string[],
    folder: string = 'INBOX'
  ): Promise<void> {
    await this.connect()
    await this.openBox(folder, false) // readOnly = false

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'))
      }

      this.imap.addFlags([uid], flags, (err) => {
        this.disconnect()
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * E-Mail löschen (in Trash verschieben oder dauerhaft löschen)
   */
  async deleteMessage(uid: number, folder: string = 'INBOX'): Promise<void> {
    await this.connect()
    await this.openBox(folder, false)

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'))
      }

      this.imap.addFlags([uid], ['\\Deleted'], (err) => {
        if (err) {
          this.disconnect()
          return reject(err)
        }

        this.imap!.expunge((err) => {
          this.disconnect()
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
  }

  /**
   * E-Mail in anderen Ordner verschieben
   */
  async moveMessage(
    uid: number,
    fromFolder: string,
    toFolder: string
  ): Promise<void> {
    await this.connect()
    await this.openBox(fromFolder, false)

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'))
      }

      this.imap.move([uid], toFolder, (err) => {
        this.disconnect()
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Verfügbare Ordner auflisten
   */
  async listFolders(): Promise<string[]> {
    await this.connect()

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not connected'))
      }

      this.imap.getBoxes((err, boxes) => {
        this.disconnect()
        if (err) {
          reject(err)
        } else {
          const folderNames = Object.keys(boxes)
          resolve(folderNames)
        }
      })
    })
  }
}
