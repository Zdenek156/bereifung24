'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, FileText, Eye, Edit2, Trash2, Archive, ExternalLink, Copy } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { useRouter } from 'next/navigation'
import { useBuildPath } from '@/hooks/useBasePath'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  targetAudience: 'CUSTOMER' | 'WORKSHOP' | 'BOTH'
  views: number
  readTime: number
  publishedAt?: string
  updatedAt: string
  category: {
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }
  author: {
    id: string
    firstName: string
    lastName: string
  }
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
  _count: {
    blogViews: number
    revisions: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

export default function BlogArtikelPage() {
  const router = useRouter()
  const buildPath = useBuildPath()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterAudience, setFilterAudience] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [page, filterStatus, filterCategory, filterAudience])

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

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (filterStatus) params.append('status', filterStatus)
      if (filterCategory) params.append('categoryId', filterCategory)
      if (filterAudience) params.append('audience', filterAudience)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/blog/posts?${params}`)
      if (response.ok) {
        const result = await response.json()
        setPosts(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchPosts()
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Artikel "${title}" wirklich löschen?`)) return

    try {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPosts()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Fehler beim Löschen des Artikels')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/blog/posts/${id}/archive`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchPosts()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error archiving post:', error)
      alert('Fehler beim Archivieren')
    }
  }

  const handleDuplicate = async (post: BlogPost) => {
    const newSlug = `${post.slug}-kopie-${Date.now()}`
    const newTitle = `${post.title} (Kopie)`

    try {
      const response = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug,
          excerpt: post.excerpt,
          content: post.excerpt, // We don't have full content here
          categoryId: post.category.id,
          tags: post.tags.map(t => t.name),
          targetAudience: post.targetAudience,
          status: 'DRAFT'
        })
      })

      if (response.ok) {
        const result = await response.json()
        router.push(buildPath(`blog/artikel/${result.data.id}/bearbeiten`))
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error duplicating post:', error)
      alert('Fehler beim Duplizieren')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Entwurf' },
      REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Review' },
      PUBLISHED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Veröffentlicht' },
      ARCHIVED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Archiviert' }
    }
    const badge = badges[status] || badges.DRAFT
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getAudienceBadge = (audience: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      CUSTOMER: { bg: 'bg-blue-50', text: 'text-blue-700', label: '👤 Kunde' },
      WORKSHOP: { bg: 'bg-orange-50', text: 'text-orange-700', label: '🔧 Werkstatt' },
      BOTH: { bg: 'bg-purple-50', text: 'text-purple-700', label: '👥 Beide' }
    }
    const badge = badges[audience] || badges.CUSTOMER
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const filteredPosts = posts

  if (loading && posts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Artikel...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Alle Artikel</h1>
            <p className="text-gray-600 mt-1">{posts.length} Artikel gefunden</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(buildPath('blog/artikel/upload'))}
            variant="outline"
            className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Excel importieren
          </Button>
          <Button
            onClick={() => router.push(buildPath('blog/artikel/neu'))}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Artikel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Suche nach Titel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(1)
            }}
            className="border rounded px-3 py-2"
          >
            <option value="">Alle Status</option>
            <option value="DRAFT">Entwurf</option>
            <option value="REVIEW">Review</option>
            <option value="PUBLISHED">Veröffentlicht</option>
            <option value="ARCHIVED">Archiviert</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              setPage(1)
            }}
            className="border rounded px-3 py-2"
          >
            <option value="">Alle Kategorien</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filterAudience}
            onChange={(e) => {
              setFilterAudience(e.target.value)
              setPage(1)
            }}
            className="border rounded px-3 py-2"
          >
            <option value="">Alle Zielgruppen</option>
            <option value="CUSTOMER">Kunden</option>
            <option value="WORKSHOP">Werkstätten</option>
            <option value="BOTH">Beide</option>
          </select>
        </div>

        {(searchTerm || filterStatus || filterCategory || filterAudience) && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('')
                setFilterCategory('')
                setFilterAudience('')
                setPage(1)
              }}
              variant="outline"
              size="sm"
            >
              Filter zurücksetzen
            </Button>
            <Button
              onClick={handleSearch}
              size="sm"
            >
              Suchen
            </Button>
          </div>
        )}
      </Card>

      {/* Article List */}
      {filteredPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">Keine Artikel gefunden</h2>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus || filterCategory || filterAudience
              ? 'Versuchen Sie andere Filtereinstellungen'
              : 'Erstellen Sie Ihren ersten Blog-Artikel'}
          </p>
          <Button
            onClick={() => router.push(buildPath('blog/artikel/neu'))}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Artikel
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {filteredPosts.map(post => (
              <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${post.category.color}20` }}
                  >
                    {post.category.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 line-clamp-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusBadge(post.status)}
                        {getAudienceBadge(post.targetAudience)}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: post.category.color }}
                        ></span>
                        {post.category.name}
                      </span>
                      <span>•</span>
                      <span>
                        {post.author.firstName} {post.author.lastName}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(post.updatedAt).toLocaleDateString('de-DE')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post._count.blogViews} Views
                      </span>
                      <span>•</span>
                      <span>{post.readTime} Min. Lesezeit</span>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => router.push(buildPath(`blog/artikel/${post.id}/bearbeiten`))}
                        size="sm"
                        variant="outline"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Bearbeiten
                      </Button>

                      {post.status === 'PUBLISHED' && (
                        <Button
                          onClick={() => window.open(`/ratgeber/${post.slug}`, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ansehen
                        </Button>
                      )}

                      <Button
                        onClick={() => handleDuplicate(post)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Duplizieren
                      </Button>

                      {post.status !== 'ARCHIVED' && (
                        <Button
                          onClick={() => handleArchive(post.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Archivieren
                        </Button>
                      )}

                      <Button
                        onClick={() => handleDelete(post.id, post.title)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Löschen
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Zurück
              </Button>
              <span className="text-sm text-gray-600">
                Seite {page} von {totalPages}
              </span>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
              >
                Weiter
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
