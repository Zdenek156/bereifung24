'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Eye,
  User,
  ChevronRight,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage?: string
  imageAlt?: string
  views: number
  readTime: number
  publishedAt: string
  updatedAt: string
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

interface Props {
  post: BlogPost
  relatedPosts: BlogPost[]
}

export default function ArticleDetail({ post, relatedPosts }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Track view
    fetch(`/api/blog/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id })
    }).catch(err => console.error('Failed to track view:', err))
  }, [post.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/ratgeber/${post.slug}`
    : `https://bereifung24.de/ratgeber/${post.slug}`

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(post.title)

    let url = ''
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'copy':
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  // Generate Schema.org JSON-LD
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Bereifung24'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bereifung24',
      logo: {
        '@type': 'ImageObject',
        url: 'https://bereifung24.de/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': shareUrl
    }
  }

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-cyan-600">
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/ratgeber" className="hover:text-cyan-600">
                Ratgeber
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link
                href={`/ratgeber?category=${post.category.slug}`}
                className="hover:text-cyan-600"
              >
                {post.category.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium truncate">
                {post.title}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              <Card className="overflow-hidden">
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="relative h-96 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.imageAlt || post.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white mb-3"
                        style={{ backgroundColor: post.category.color }}
                      >
                        {post.category.icon} {post.category.name}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Header */}
                  <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
                  <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pb-6 border-b">
                    {post.author && (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {post.author.firstName} {post.author.lastName}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {post.readTime} Min. Lesezeit
                    </span>
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {post.views} Aufrufe
                    </span>
                  </div>

                  {/* Content */}
                  <div 
                    className="prose prose-lg max-w-none mt-8 mb-8"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="pt-6 border-t">
                      <div className="flex flex-wrap gap-2">
                        <span className="font-semibold text-gray-700">Tags:</span>
                        {post.tags.map(tag => (
                          <Link
                            key={tag.slug}
                            href={`/ratgeber?tag=${tag.slug}`}
                            className="px-3 py-1 bg-gray-100 hover:bg-cyan-100 rounded-full text-sm transition-colors"
                          >
                            #{tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Share Buttons */}
                  <div className="pt-6 border-t mt-6">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700">Teilen:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare('twitter')}
                        className="gap-2"
                      >
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare('facebook')}
                        className="gap-2"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare('linkedin')}
                        className="gap-2"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare('copy')}
                        className="gap-2"
                      >
                        <LinkIcon className="h-4 w-4" />
                        {copied ? 'Kopiert!' : 'Link kopieren'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-bold mb-6">Ähnliche Artikel</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {relatedPosts.map(related => (
                      <Card key={related.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <Link href={`/ratgeber/${related.slug}`}>
                          {related.featuredImage && (
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={related.featuredImage}
                                alt={related.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="mb-2">
                              <span
                                className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: related.category.color }}
                              >
                                {related.category.icon} {related.category.name}
                              </span>
                            </div>
                            <h3 className="font-bold mb-2 line-clamp-2 hover:text-cyan-600 transition-colors">
                              {related.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {related.excerpt}
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {related.readTime} Min.
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {related.views}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* CTA */}
              <Card className="p-6 bg-gradient-to-br from-cyan-600 to-blue-700 text-white sticky top-4">
                <h3 className="font-bold text-lg mb-2">Reifenwechsel benötigt?</h3>
                <p className="text-sm text-cyan-100 mb-4">
                  Vergleichen Sie jetzt kostenlos Angebote von Werkstätten in Ihrer Nähe!
                </p>
                <Button
                  onClick={() => (window.location.href = '/booking')}
                  className="w-full bg-white text-cyan-600 hover:bg-gray-100"
                >
                  Jetzt Angebote einholen
                </Button>
              </Card>

              {/* Quick Links */}
              <Card className="p-6">
                <h3 className="font-bold mb-4">In diesem Artikel</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    📝 {post.readTime} Minuten Lesezeit
                  </p>
                  <p className="text-gray-600">
                    👁️ {post.views} Aufrufe
                  </p>
                  <p className="text-gray-600">
                    📅 Aktualisiert: {formatDate(post.updatedAt)}
                  </p>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
