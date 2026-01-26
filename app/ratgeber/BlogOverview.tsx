'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Calendar, Clock, Eye, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featuredImage?: string
  views: number
  readTime: number
  publishedAt: string
  category: {
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }
  author?: {
    firstName: string
    lastName: string
  }
  tags: Array<{
    name: string
    slug: string
  }>
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  _count: {
    posts: number
  }
}

interface Tag {
  id: string
  name: string
  slug: string
  usageCount: number
}

interface Props {
  featuredPost: BlogPost | null
  posts: BlogPost[]
  categories: Category[]
  popularTags: Tag[]
}

export default function BlogOverview({ featuredPost, posts, categories, popularTags }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || post.category.id === selectedCategory

    return matchesSearch && matchesCategory
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Reifen-Ratgeber</h1>
            <p className="text-xl text-cyan-100 mb-8">
              Professionelle Tipps und Guides rund um Autoreifen - von Experten erklärt
            </p>
            
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Wonach suchen Sie? (z.B. Reifenwechsel, Kosten, Winterreifen...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-lg bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {featuredPost && !searchTerm && !selectedCategory && (
              <Card className="mb-8 overflow-hidden hover:shadow-xl transition-shadow">
                <Link href={`/ratgeber/${featuredPost.slug}`}>
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredPost.featuredImage && (
                      <div className="relative h-64 md:h-auto">
                        <img
                          src={featuredPost.featuredImage}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span
                            className="px-3 py-1 rounded-full text-sm font-medium text-white"
                            style={{ backgroundColor: featuredPost.category.color }}
                          >
                            {featuredPost.category.icon} {featuredPost.category.name}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-6 flex flex-col justify-center">
                      <div className="text-sm text-cyan-600 font-semibold mb-2">
                        ⭐ Empfohlen
                      </div>
                      <h2 className="text-3xl font-bold mb-3 hover:text-cyan-600 transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(featuredPost.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredPost.readTime} Min.
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {featuredPost.views} Views
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            )}

            {/* Category Filter */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                    !selectedCategory
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white border border-gray-200 hover:border-cyan-600'
                  }`}
                >
                  Alle Artikel
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'text-white'
                        : 'bg-white border border-gray-200 hover:border-gray-400'
                    }`}
                    style={
                      selectedCategory === cat.id
                        ? { backgroundColor: cat.color }
                        : {}
                    }
                  >
                    {cat.icon} {cat.name} ({cat._count.posts})
                  </button>
                ))}
              </div>
            </div>

            {/* Article Grid */}
            {filteredPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">Keine Artikel gefunden</h3>
                <p className="text-gray-600">
                  Versuchen Sie andere Suchbegriffe oder wählen Sie eine andere Kategorie
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPosts.map(post => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/ratgeber/${post.slug}`}>
                      {post.featuredImage && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3">
                            <span
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: post.category.color }}
                            >
                              {post.category.icon} {post.category.name}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-cyan-600 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime} Min.
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-cyan-600" />
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Kategorien</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {cat._count.posts}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Popular Tags */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Beliebte Themen</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <Link
                    key={tag.id}
                    href={`/ratgeber?tag=${tag.slug}`}
                    className="px-3 py-1 bg-gray-100 hover:bg-cyan-100 rounded-full text-sm transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </Card>

            {/* CTA */}
            <Card className="p-6 bg-gradient-to-br from-cyan-600 to-blue-700 text-white">
              <h3 className="font-bold text-lg mb-2">Reifenwechsel benötigt?</h3>
              <p className="text-sm text-cyan-100 mb-4">
                Vergleichen Sie jetzt Angebote von Werkstätten in Ihrer Nähe!
              </p>
              <Button
                onClick={() => (window.location.href = '/booking')}
                className="w-full bg-white text-cyan-600 hover:bg-gray-100"
              >
                Jetzt Angebote einholen
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
