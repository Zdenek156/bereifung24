'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Eye, Send, ArrowLeft } from 'lucide-react'
import BackButton from '@/components/BackButton'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

export default function NewArticlePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [targetAudience, setTargetAudience] = useState<'CUSTOMER' | 'WORKSHOP' | 'BOTH'>('CUSTOMER')
  const [featuredImage, setFeaturedImage] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  
  // SEO Fields
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      const autoSlug = title
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(autoSlug)
    }
  }, [title])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/blog/categories')
      if (response.ok) {
        const result = await response.json()
        setCategories(result.data || [])
        if (result.data && result.data.length > 0) {
          setCategoryId(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!title || !slug || !content || !categoryId) {
      alert('Bitte füllen Sie alle Pflichtfelder aus: Titel, Slug, Inhalt, Kategorie')
      return
    }

    setLoading(true)
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t)
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k)

      const response = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || content.substring(0, 160),
          content,
          categoryId,
          tags: tagArray,
          targetAudience,
          status,
          featuredImage: featuredImage || null,
          imageAlt: imageAlt || null,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || excerpt || content.substring(0, 160),
          keywords: keywordArray,
          focusKeyword: focusKeyword || null,
          canonicalUrl: canonicalUrl || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Artikel erfolgreich ${status === 'DRAFT' ? 'als Entwurf gespeichert' : 'veröffentlicht'}!`)
        router.push('/admin/blog/artikel')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Fehler beim Speichern des Artikels')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Neuer Artikel</h1>
            <p className="text-gray-600 mt-1">Erstellen Sie einen neuen Blog-Artikel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Editor' : 'Vorschau'}
          </Button>
          <Button
            onClick={() => handleSave('DRAFT')}
            disabled={loading}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            Als Entwurf speichern
          </Button>
          <Button
            onClick={() => handleSave('PUBLISHED')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Veröffentlichen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {!showPreview ? (
            <>
              {/* Title & Slug */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Titel <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="z.B. Reifenwechsel im Frühling - Der ultimative Guide"
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      URL-Slug <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">/ratgeber/</span>
                      <Input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="reifenwechsel-fruehling-guide"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Wird automatisch aus dem Titel generiert. Nur Kleinbuchstaben und Bindestriche.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Kurzbeschreibung (Excerpt)
                    </label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Kurze Zusammenfassung des Artikels (ca. 150-160 Zeichen)"
                      className="w-full border rounded px-3 py-2 min-h-[80px]"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {excerpt.length}/160 Zeichen
                    </p>
                  </div>
                </div>
              </Card>

              {/* Content Editor */}
              <Card className="p-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Inhalt (Markdown) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="# Überschrift 1&#10;&#10;## Überschrift 2&#10;&#10;**Fettgedruckter Text**&#10;&#10;- Listenpunkt 1&#10;- Listenpunkt 2&#10;&#10;[Link-Text](https://example.com)"
                    className="w-full border rounded px-3 py-2 font-mono text-sm min-h-[400px]"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Markdown wird unterstützt. Verwenden Sie # für Überschriften, ** für Fettdruck, * für Listen.
                  </p>
                </div>
              </Card>

              {/* Featured Image */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Beitragsbild</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bild-URL
                    </label>
                    <Input
                      type="url"
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {featuredImage && (
                    <div className="border rounded overflow-hidden">
                      <img 
                        src={featuredImage} 
                        alt={imageAlt || 'Preview'} 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.jpg'
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Alt-Text (SEO)
                    </label>
                    <Input
                      type="text"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="Beschreibung des Bildes für SEO"
                    />
                  </div>
                </div>
              </Card>

              {/* SEO Settings */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">SEO-Einstellungen</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Meta-Titel
                    </label>
                    <Input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder={title || "SEO-Titel für Google"}
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {metaTitle.length}/60 Zeichen (optimal: 50-60)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Meta-Beschreibung
                    </label>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Beschreibung für Google-Suchergebnisse"
                      className="w-full border rounded px-3 py-2 min-h-[80px]"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {metaDescription.length}/160 Zeichen (optimal: 150-160)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Focus-Keyword
                    </label>
                    <Input
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="z.B. Reifenwechsel Kosten"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Keywords (kommagetrennt)
                    </label>
                    <Input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="Reifenwechsel, Kosten, Werkstatt, Frühling"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Canonical URL (optional)
                    </label>
                    <Input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="https://bereifung24.de/ratgeber/..."
                    />
                  </div>
                </div>
              </Card>
            </>
          ) : (
            /* Preview */
            <Card className="p-8">
              <article className="prose prose-lg max-w-none">
                {featuredImage && (
                  <img 
                    src={featuredImage} 
                    alt={imageAlt}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <h1 className="text-4xl font-bold mb-4">{title || 'Titel des Artikels'}</h1>
                {excerpt && (
                  <p className="text-xl text-gray-600 mb-6">{excerpt}</p>
                )}
                <div className="border-t pt-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || '*Noch kein Inhalt vorhanden*'}
                  </ReactMarkdown>
                </div>
              </article>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Veröffentlichung</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Kategorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Kategorie wählen...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Zielgruppe
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="CUSTOMER">👤 Kunden</option>
                  <option value="WORKSHOP">🔧 Werkstätten</option>
                  <option value="BOTH">👥 Beide</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tags (kommagetrennt)
                </label>
                <Input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Reifenwechsel, Frühjahr, Kosten"
                />
              </div>
            </div>
          </Card>

          {/* Help */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              💡 Markdown-Hilfe
            </h3>
            <div className="text-sm space-y-2 text-gray-700">
              <p><code className="bg-white px-1"># Überschrift 1</code></p>
              <p><code className="bg-white px-1">## Überschrift 2</code></p>
              <p><code className="bg-white px-1">**Fettdruck**</code></p>
              <p><code className="bg-white px-1">*Kursiv*</code></p>
              <p><code className="bg-white px-1">- Listenpunkt</code></p>
              <p><code className="bg-white px-1">[Link](url)</code></p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
