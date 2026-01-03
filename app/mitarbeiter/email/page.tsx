'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EmailMessage {
  id: string
  uid: number
  from: string
  to: string[]
  subject: string
  date: string
  textContent?: string
  htmlContent?: string
  isRead: boolean
  isFlagged: boolean
  folder: string
}

export default function EmailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [currentFolder, setCurrentFolder] = useState('INBOX')
  const [hasSettings, setHasSettings] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      checkSettings()
    }
  }, [session])

  useEffect(() => {
    if (hasSettings) {
      fetchMessages()
    }
  }, [currentFolder, hasSettings])

  const checkSettings = async () => {
    try {
      const res = await fetch('/api/email/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.needsConfiguration) {
          setHasSettings(false)
        }
      }
    } catch (error) {
      console.error('Error checking settings:', error)
      setHasSettings(false)
    }
  }

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/email/messages?folder=${currentFolder}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        if (data.needsConfiguration) {
          setHasSettings(false)
          setMessages([])
          return
        }
        setMessages(data.messages || [])
        if (data.messages?.length > 0 && !selectedMessage) {
          setSelectedMessage(data.messages[0])
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncMessages = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: currentFolder, limit: 50 }),
      })
      
      if (res.ok) {
        await fetchMessages()
      }
    } catch (error) {
      console.error('Error syncing messages:', error)
    } finally {
      setSyncing(false)
    }
  }

  const markAsRead = async (message: EmailMessage) => {
    if (message.isRead) return

    try {
      await fetch(`/api/email/messages/${message.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true, folder: message.folder }),
      })

      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const deleteMessage = async (message: EmailMessage) => {
    if (!confirm('E-Mail wirklich löschen?')) return

    try {
      await fetch(`/api/email/messages/${message.uid}?folder=${message.folder}`, {
        method: 'DELETE',
      })

      setMessages((prev) => prev.filter((m) => m.id !== message.id))
      if (selectedMessage?.id === message.id) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleSelectMessage = (message: EmailMessage) => {
    setSelectedMessage(message)
    markAsRead(message)
  }

  if (!hasSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            E-Mail nicht konfiguriert
          </h2>
          <p className="text-gray-600 mb-6">
            Bitte richten Sie zuerst Ihre E-Mail-Einstellungen ein, um Ihr Postfach zu nutzen.
          </p>
          <Link
            href="/mitarbeiter/email-settings"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Jetzt einrichten
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">📧 E-Mail</h1>
          
          <select
            value={currentFolder}
            onChange={(e) => setCurrentFolder(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="INBOX">Posteingang</option>
            <option value="Sent">Gesendet</option>
            <option value="Drafts">Entwürfe</option>
            <option value="Trash">Papierkorb</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={syncMessages}
            disabled={syncing}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? '🔄 Synchronisiere...' : '🔄 Aktualisieren'}
          </button>

          <Link
            href="/mitarbeiter/email/compose"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ✉️ Neue E-Mail
          </Link>

          <Link
            href="/mitarbeiter/email-settings"
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            ⚙️ Einstellungen
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message List */}
        <div className="w-1/3 bg-white border-r overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Lade E-Mails...
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Keine E-Mails in diesem Ordner
            </div>
          ) : (
            <div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                  } ${!message.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className={`font-medium truncate ${!message.isRead ? 'font-bold' : ''}`}>
                      {message.from}
                    </div>
                    <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {new Date(message.date).toLocaleDateString('de-DE', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className={`text-sm truncate ${!message.isRead ? 'font-semibold' : 'text-gray-600'}`}>
                    {message.subject || '(Kein Betreff)'}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {message.textContent?.substring(0, 60)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Viewer */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selectedMessage ? (
            <div className="p-6">
              {/* Message Header */}
              <div className="border-b pb-4 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedMessage.subject || '(Kein Betreff)'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/mitarbeiter/email/compose?reply=${selectedMessage.id}`)}
                      className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                    >
                      ↩️ Antworten
                    </button>
                    <button
                      onClick={() => deleteMessage(selectedMessage)}
                      className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Von:</span>{' '}
                    <span className="text-gray-900">{selectedMessage.from}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">An:</span>{' '}
                    <span className="text-gray-900">{selectedMessage.to.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Datum:</span>{' '}
                    <span className="text-gray-900">
                      {new Date(selectedMessage.date).toLocaleString('de-DE', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="prose max-w-none">
                {selectedMessage.htmlContent ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedMessage.htmlContent }} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans">
                    {selectedMessage.textContent}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Keine E-Mail ausgewählt
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
