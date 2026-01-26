'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Tag as TagIcon, Edit, Trash } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import { useBuildPath } from '@/hooks/useBasePath'

interface Tag {
  id: string
  name: string
  slug: string
  usageCount: number
  _count: {
    posts: number
  }
}

export default function BlogTagsPage() {
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/blog/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tag wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/blog/tags/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTags()
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Tags...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TagIcon className="h-8 w-8" />
            Blog-Tags
          </h1>
        </div>
        <Button onClick={() => router.push('/admin/blog/tags/neu')}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Tag
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {tags.map((tag) => (
          <Card key={tag.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{tag.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/blog/tags/${tag.id}/bearbeiten`)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {tag._count.posts} Artikel
              </div>
            </div>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-2xl font-bold">Keine Tags vorhanden</h2>
            <p className="text-gray-600">
              Erstellen Sie Ihren ersten Blog-Tag
            </p>
            <Button onClick={() => router.push('/admin/blog/tags/neu')}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Tag
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
