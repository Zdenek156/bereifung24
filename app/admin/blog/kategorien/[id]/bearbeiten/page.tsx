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

export default function BearbeitenCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const buildPath = useBuildPath()
  const categoryId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    seoTitle: '',
    seoDescription: '',
    sortOrder: 0
  })

  useEffect(() => {
    fetchCategory()
  }, [categoryId])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/blog/categories/${categoryId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const cat = result.data
          setFormData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            icon: cat.icon || '',
            color: cat.color || '#3B82F6',
            seoTitle: cat.seoTitle || '',
            seoDescription: cat.seoDescription || '',
            sortOrder: cat.sortOrder || 0
          })
        }
      } else {
        alert('Kategorie nicht gefunden')
        router.push(buildPath('blog/kategorien'))
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      alert('Fehler beim Laden der Kategorie')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/blog/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push(buildPath('blog/kategorien'))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Fehler beim Aktualisieren der Kategorie')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Kategorie wirklich löschen? Artikel mit dieser Kategorie müssen vorher umkategorisiert werden.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/blog/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push(buildPath('blog/kategorien'))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Kategorie kann nicht gelöscht werden'}`)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Fehler beim Löschen der Kategorie')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Kategorie...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold">Kategorie bearbeiten</h1>
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

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Icon (Emoji oder Text)
                </label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Farbe
                </label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* SEO Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                SEO Titel
              </label>
              <Input
                value={formData.seoTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
              />
            </div>

            {/* SEO Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                SEO Beschreibung
              </label>
              <Textarea
                value={formData.seoDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Sortierung
              </label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
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
                onClick={() => router.push(buildPath('blog/kategorien'))}
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
