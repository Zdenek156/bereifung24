'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Plus, Edit, Trash2 } from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  key: string
  subject: string
  body: string
  isActive: boolean
  updatedAt: string
}

export default function MitarbeiterEmailTemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchTemplates()
    }
  }, [status, session, router])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Lade...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold">Email Templates</h1>
              <p className="text-sm text-gray-600 mt-1">
                E-Mail-Vorlagen verwalten
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            ℹ️ Hinweis: Email-Vorlagen können nur von Administratoren bearbeitet werden. 
            Sie können hier die verfügbaren Vorlagen einsehen.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-xs text-gray-500">{template.key}</p>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    template.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {template.isActive ? 'Aktiv' : 'Inaktiv'}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Betreff:</p>
                  <p className="text-sm text-gray-900">{template.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Aktualisiert:</p>
                  <p className="text-xs text-gray-600">
                    {new Date(template.updatedAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Keine Email-Templates vorhanden</p>
          </div>
        )}
      </div>
    </div>
  )
}
