'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Eye, Send, Archive, Trash2 } from 'lucide-react'
import { useBuildPath } from '@/hooks/useBasePath'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  status: string
  targetAudience: 'CUSTOMER' | 'WORKSHOP' | 'BOTH'
  featuredImage?: string
  imageAlt?: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  focusKeyword?: string
  canonicalUrl?: string
  categoryId: string
  category: Category
  tags: Array<{ name: string }>
}

export default function EditArticlePage() {
  const router = useRouter()
  const buildPath = useBuildPath()
  const params = useParams()
  const postId = params.id as string

  const [categories, setCategories] = useState<Category[]>([])
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    fetchPost()
  }, [postId])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/blog/categories')
      if (response.ok) {
        const result = await response.json()
        setCategories(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`)
      if (response.ok) {
        const result = await response.json()
        const postData = result.data
        setPost(postData)
        
        // Populate form
        setTitle(postData.title)
        setSlug(postData.slug)
        setExcerpt(postData.excerpt || '')
        setContent(postData.content)
        setCategoryId(postData.categoryId)
        setTags(postData.tags.map((t: any) => t.name).join(', '))
        setTargetAudience(postData.targetAudience)
        setFeaturedImage(postData.featuredImage || '')
        setImageAlt(postData.imageAlt || '')
        setMetaTitle(postData.metaTitle)
        setMetaDescription(postData.metaDescription)
        setKeywords(postData.keywords?.join(', ') || '')
        setFocusKeyword(postData.focusKeyword || '')
        setCanonicalUrl(postData.canonicalUrl || '')
      } else {
        alert('Artikel nicht gefunden')
        router.push(buildPath('blog/artikel'))
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      alert('Fehler beim Laden des Artikels')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (status?: 'DRAFT' | 'PUBLISHED') => {
    if (!title || !slug || !content || !categoryId) {
      alert('Bitte füllen Sie alle Pflichtfelder aus: Titel, Slug, Inhalt, Kategorie')
      return
    }

    setSaving(true)
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t)
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k)

      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || content.substring(0, 160),
          content,
          categoryId,
          tags: tagArray,
          targetAudience,
          ...(status && { status }),
          featuredImage: featuredImage || null,
          imageAlt: imageAlt || null,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || excerpt || content.substring(0, 160),
          keywords: keywordArray,
          focusKeyword: focusKeyword || null,
          canonicalUrl: canonicalUrl || null,
          changeNote: 'Artikel aktualisiert'
        })
      })

      if (response.ok) {
        alert('Artikel erfolgreich gespeichert!')
        fetchPost() // Reload to update status
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Fehler beim Speichern des Artikels')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Artikel jetzt veröffentlichen?')) return
    
    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}/publish`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Artikel erfolgreich veröffentlicht!')
        fetchPost()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error publishing article:', error)
      alert('Fehler beim Veröffentlichen')
    }
  }

  const handleArchive = async () => {
    if (!confirm('Artikel archivieren?')) return
    
    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}/archive`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Artikel archiviert!')
        router.push(buildPath('blog/artikel'))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error archiving article:', error)
      alert('Fehler beim Archivieren')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Artikel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) return
    
    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Artikel gelöscht!')
        router.push(buildPath('blog/artikel'))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Fehler beim Löschen')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Artikel...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(buildPath('/blog/artikel'))}
            className="flex items-center gap-2"
          >
            ← Zurück
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Artikel bearbeiten</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`
                px-2 py-1 text-xs rounded-full
                ${post?.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                  post?.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                  post?.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {post?.status}
              </span>
              <span className="text-gray-600 text-sm">
                • {(post as any)?._count?.blogViews || 0} Views
              </span>
            </div>
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
          
          {post?.status === 'PUBLISHED' && (
            <Button
              onClick={() => window.open(`/ratgeber/${slug}`, '_blank')}
              variant="outline"
            >
              Ansehen
            </Button>
          )}
          
          <Button
            onClick={() => handleSave()}
            disabled={saving}
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          
          {post?.status !== 'PUBLISHED' && (
            <Button
              onClick={handlePublish}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Veröffentlichen
            </Button>
          )}
          
          <Button
            onClick={handleArchive}
            variant="outline"
            className="text-orange-600"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archivieren
          </Button>
          
          <Button
            onClick={handleDelete}
            variant="outline"
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
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
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Kurzbeschreibung (Excerpt)
                    </label>
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
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
                    Inhalt (HTML) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    💡 Verwenden Sie HTML-Tags für Formatierung: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
                  </p>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full border rounded px-3 py-2 font-mono text-sm min-h-[500px]"
                    placeholder="<h2>Überschrift</h2><p>Ihr Text hier...</p>"
                  />
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
                    />
                  </div>
                  {featuredImage && (
                    <div className="border rounded overflow-hidden">
                      <img 
                        src={featuredImage} 
                        alt={imageAlt || 'Preview'} 
                        className="w-full h-48 object-cover"
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
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {metaTitle.length}/60 Zeichen
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Meta-Beschreibung
                    </label>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      className="w-full border rounded px-3 py-2 min-h-[80px]"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {metaDescription.length}/160 Zeichen
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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Canonical URL
                    </label>
                    <Input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
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
                <h1 className="text-4xl font-bold mb-4">{title}</h1>
                {excerpt && (
                  <p className="text-xl text-gray-600 mb-6">{excerpt}</p>
                )}
                <div 
                  className="border-t pt-6"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </article>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-2">💡 Markdown-Hilfe</h3>
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
