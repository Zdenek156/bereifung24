'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Tag, FolderOpen, TrendingUp, Eye, Edit, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import { useBuildPath } from '@/hooks/useBasePath'

interface BlogStats {
  overview: {
    totalPosts: number
    publishedCount: number
    draftCount: number
    reviewCount: number
    archivedCount: number
    totalCategories: number
    totalTags: number
    totalViews: number
    viewsLast30Days: number
  }
  recentPosts: Array<{
    id: string
    title: string
    status: string
    updatedAt: string
    category: {
      name: string
      icon: string
      color: string
    }
    author: {
      firstName: string
      lastName: string
    }
    _count: {
      blogViews: number
    }
  }>
  topPosts: Array<{
    id: string
    title: string
    slug: string
    views: number
    category: {
      name: string
      slug: string
    }
  }>
}

export default function BlogDashboard() {
  const router = useRouter()
  const buildPath = useBuildPath()
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/blog/stats')
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching blog stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800' },
      REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      PUBLISHED: { bg: 'bg-green-100', text: 'text-green-800' },
      ARCHIVED: { bg: 'bg-red-100', text: 'text-red-800' }
    }
    const badge = badges[status] || badges.DRAFT
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Statistiken...</div>
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
            <h1 className="text-3xl font-bold">Blog & Content</h1>
            <p className="text-gray-600 mt-1">SEO-optimiertes Blog-System für Bereifung24</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(buildPath('blog/artikel/neu'))}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Artikel
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Veröffentlicht</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats?.overview.publishedCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entwürfe</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">
                {stats?.overview.draftCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Edit className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Views (30 Tage)</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats?.overview.viewsLast30Days || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kategorien</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats?.overview.totalCategories || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Button
          onClick={() => router.push(buildPath('blog/artikel'))}
          variant="outline"
          className="h-auto py-4 flex-col items-start"
        >
          <FileText className="h-6 w-6 mb-2" />
          <span className="font-semibold">Alle Artikel</span>
          <span className="text-xs text-gray-500">
            {stats?.overview.totalPosts || 0} Artikel
          </span>
        </Button>

        <Button
          onClick={() => router.push(buildPath('blog/kategorien'))}
          variant="outline"
          className="h-auto py-4 flex-col items-start"
        >
          <FolderOpen className="h-6 w-6 mb-2" />
          <span className="font-semibold">Kategorien</span>
          <span className="text-xs text-gray-500">
            {stats?.overview.totalCategories || 0} Kategorien
          </span>
        </Button>

        <Button
          onClick={() => router.push(buildPath('blog/tags'))}
          variant="outline"
          className="h-auto py-4 flex-col items-start"
        >
          <Tag className="h-6 w-6 mb-2" />
          <span className="font-semibold">Tags</span>
          <span className="text-xs text-gray-500">
            {stats?.overview.totalTags || 0} Tags
          </span>
        </Button>

        <Button
          onClick={() => router.push(buildPath('blog/analytics'))}
          variant="outline"
          className="h-auto py-4 flex-col items-start"
        >
          <TrendingUp className="h-6 w-6 mb-2" />
          <span className="font-semibold">Analytics</span>
          <span className="text-xs text-gray-500">
            {stats?.overview.totalViews || 0} Views gesamt
          </span>
        </Button>
      </div>

      {/* Recent Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Zuletzt bearbeitet
          </h2>
          <div className="space-y-4">
            {stats?.recentPosts && stats.recentPosts.length > 0 ? (
              stats.recentPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(buildPath(`blog/artikel/${post.id}/bearbeiten`))}
                  className="flex items-start justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: post.category.color }}>
                        {post.category.icon}
                      </span>
                      <span className="text-xs text-gray-500">
                        {post.category.name}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
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
                        {post._count.blogViews}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(post.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Noch keine Artikel vorhanden</p>
                <Button
                  onClick={() => router.push(buildPath('blog/artikel/neu'))}
                  className="mt-4"
                  variant="outline"
                  size="sm"
                >
                  Ersten Artikel erstellen
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Top Posts */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Artikel (30 Tage)
          </h2>
          <div className="space-y-4">
            {stats?.topPosts && stats.topPosts.length > 0 ? (
              stats.topPosts.map((post, index) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/ratgeber/${post.slug}`)}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{post.category.name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views} Views
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Noch keine Artikel-Views vorhanden</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
