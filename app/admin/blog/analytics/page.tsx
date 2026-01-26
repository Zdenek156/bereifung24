'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Eye, FileText, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import BackButton from '@/components/BackButton'

interface Analytics {
  totalViews: number
  viewsLast30Days: number
  topPosts: Array<{
    id: string
    title: string
    views: number
    category: {
      name: string
    }
  }>
}

export default function BlogAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/blog/stats')
      if (response.ok) {
        const data = await response.json()
        setAnalytics({
          totalViews: data.data.overview.totalViews,
          viewsLast30Days: data.data.overview.viewsLast30Days,
          topPosts: data.data.topPosts || []
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Blog Analytics
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-lg">
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gesamt-Aufrufe</p>
              <p className="text-3xl font-bold">{analytics?.totalViews || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-lg">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aufrufe (30 Tage)</p>
              <p className="text-3xl font-bold">{analytics?.viewsLast30Days || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Top Artikel
        </h2>
        <div className="space-y-3">
          {analytics?.topPosts.map((post, index) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="font-bold text-2xl text-gray-400">
                  #{index + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600">{post.category.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-600" />
                <span className="font-semibold">{post.views}</span>
              </div>
            </div>
          ))}

          {(!analytics?.topPosts || analytics.topPosts.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Noch keine Daten verfügbar
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
