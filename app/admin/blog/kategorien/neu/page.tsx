'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import BackButton from '@/components/BackButton'
import { useBuildPath } from '@/hooks/useBasePath'
import { Save, X } from 'lucide-react'

export default function NeueCategoriesPage() {
  const router = useRouter()
  const buildPath = useBuildPath()
  const [loading, setLoading] = useState(false)
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/blog/categories', {
        method: 'POST',
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
      console.error('Error creating category:', error)
      alert('Fehler beim Erstellen der Kategorie')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold">Neue Kategorie erstellen</h1>
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
                onChange={handleNameChange}
                required
                placeholder="z.B. Reifenwissen"
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
                placeholder="z.B. reifenwissen"
              />
              <p className="text-sm text-gray-500 mt-1">
                Wird automatisch aus dem Namen generiert
              </p>
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
                placeholder="Kurze Beschreibung der Kategorie"
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
                  placeholder="🛞"
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
                    placeholder="#3B82F6"
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
                placeholder="Optional: Überschreibt den Namen für SEO"
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
                placeholder="Meta-Beschreibung für Suchmaschinen"
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
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Niedrigere Zahlen werden zuerst angezeigt
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(buildPath('blog/kategorien'))}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Speichern...' : 'Kategorie erstellen'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
