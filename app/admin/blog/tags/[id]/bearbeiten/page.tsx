'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import BackButton from '@/components/BackButton'
import { useBuildPath } from '@/hooks/useBasePath'
import { Save, X, Trash2 } from 'lucide-react'

export default function BearbeitenTagPage() {
  const router = useRouter()
  const params = useParams()
  const buildPath = useBuildPath()
  const tagId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  })

  useEffect(() => {
    fetchTag()
  }, [tagId])

  const fetchTag = async () => {
    try {
      const response = await fetch(`/api/admin/blog/tags/${tagId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const tag = result.data
          setFormData({
            name: tag.name,
            slug: tag.slug,
            description: tag.description || ''
          })
        }
      } else {
        alert('Tag nicht gefunden')
        router.push(buildPath('blog/tags'))
      }
    } catch (error) {
      console.error('Error fetching tag:', error)
      alert('Fehler beim Laden des Tags')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/blog/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push(buildPath('blog/tags'))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Error updating tag:', error)
      alert('Fehler beim Aktualisieren des Tags')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tag wirklich löschen? Artikel mit diesem Tag verlieren die Zuordnung.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/blog/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push(buildPath('blog/tags'))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Tag kann nicht gelöscht werden'}`)
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Fehler beim Löschen des Tags')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Tag...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold">Tag bearbeiten</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-2">
                URL-Slug <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Beschreibung
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(buildPath('blog/tags'))}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Speichern...' : 'Änderungen speichern'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
