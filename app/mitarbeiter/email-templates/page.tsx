'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Mail, FileText, Edit, Eye } from 'lucide-react'

interface EmailTemplate {
  id: string
  key: string
  name: string
  description: string | null
  subject: string
  isActive: boolean
}

export default function MitarbeiterEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/email-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Lade E-Mail-Vorlagen...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">E-Mail-Vorlagen</h1>
        <p className="mt-2 text-gray-600">
          Verwalte E-Mail-Templates und Massenmails
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Link key={template.id} href={`/admin/email-templates/${template.id}`}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${template.isActive ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                  <Mail className={`w-6 h-6 ${template.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                {!template.isActive && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Inaktiv</span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{template.description || 'Keine Beschreibung'}</p>
              <p className="text-xs text-gray-500">
                Betreff: {template.subject}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-12 text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Keine E-Mail-Vorlagen vorhanden
          </h2>
          <p className="text-gray-600">
            Es sind noch keine E-Mail-Vorlagen konfiguriert.
          </p>
        </Card>
      )}
    </div>
  )
}
