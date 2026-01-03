'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import EmployeePicker, { Employee } from '@/components/email/EmployeePicker'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

export default function ComposePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const replyToId = searchParams.get('reply')

  const [to, setTo] = useState<Employee[]>([])
  const [cc, setCc] = useState<Employee[]>([])
  const [bcc, setBcc] = useState<Employee[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (replyToId) {
      loadReplyMessage(replyToId)
    }
  }, [replyToId])

  const loadReplyMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/email/messages/${messageId}`)
      if (res.ok) {
        const message = await res.json()
        setSubject(`Re: ${message.subject}`)
        setBody(`\n\n---\nAm ${new Date(message.date).toLocaleString('de-DE')} schrieb ${message.from}:\n${message.textContent || ''}`)
      }
    } catch (error) {
      console.error('Error loading reply message:', error)
    }
  }

  const handleSend = async () => {
    if (to.length === 0 || !subject) {
      alert('Bitte füllen Sie Empfänger und Betreff aus')
      return
    }

    setSending(true)

    try {
      const res = await fetch('/api/email/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.map((e) => e.email),
          cc: cc.map((e) => e.email),
          bcc: bcc.map((e) => e.email),
          subject,
          html: body,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to send email')
      }

      alert('E-Mail erfolgreich versendet!')
      router.push('/mitarbeiter/email')
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Fehler beim Versenden der E-Mail')
    } finally {
      setSending(false)
    }
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean'],
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">✉️ Neue E-Mail</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {/* To */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700 w-16">An:</label>
                <div className="flex-1">
                  <EmployeePicker
                    selectedEmployees={to}
                    onSelect={setTo}
                    multiple
                    placeholder="Empfänger auswählen..."
                  />
                </div>
                <div className="flex gap-2">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cc */}
            {showCc && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 w-16">Cc:</label>
                <div className="flex-1">
                  <EmployeePicker
                    selectedEmployees={cc}
                    onSelect={setCc}
                    multiple
                    placeholder="Cc-Empfänger auswählen..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCc(false)
                    setCc([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Bcc */}
            {showBcc && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 w-16">Bcc:</label>
                <div className="flex-1">
                  <EmployeePicker
                    selectedEmployees={bcc}
                    onSelect={setBcc}
                    multiple
                    placeholder="Bcc-Empfänger auswählen..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBcc(false)
                    setBcc([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 w-16">Betreff:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="E-Mail-Betreff..."
              />
            </div>

            {/* Body */}
            <div className="border rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={body}
                onChange={setBody}
                modules={modules}
                className="h-96"
                placeholder="Ihre Nachricht..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={handleSend}
                disabled={sending || to.length === 0 || !subject}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {sending ? 'Sende...' : '📤 E-Mail senden'}
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          💡 <strong>Hinweis:</strong> E-Mails werden über den Hetzner SMTP-Server an die ausgewählten E-Mail-Adressen versendet.
        </div>
      </div>
    </div>
  )
}
