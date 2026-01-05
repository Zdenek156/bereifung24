'use client'

import { useState, useEffect } from 'react'
import { Newspaper, ExternalLink, RefreshCw, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  shortText?: string
  date: string
  imageUrl?: string
  tags: string[]
  detailsUrl: string
  type?: string
  topline?: string
}

export default function NewsFeedStripe() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Direkt Tagesschau API vom Client aufrufen
      const response = await fetch('https://www.tagesschau.de/api2/news/')
      
      if (!response.ok) {
        throw new Error('API nicht erreichbar')
      }

      const data = await response.json()
      
      const newsItems = data.news?.slice(0, 12).map((article: any) => ({
        id: article.sophoraId || article.externalId,
        title: article.title,
        shortText: article.firstSentence || article.teaserImage?.alttext,
        date: article.date,
        imageUrl: article.teaserImage?.imageVariants?.['16x9-256'],
        tags: article.tags?.map((tag: any) => tag.tag) || [],
        detailsUrl: article.shareURL || article.detailsweb,
        type: article.type,
        topline: article.topline
      })) || []

      setNews(newsItems)
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Nachrichten konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
    // Auto-refresh alle 30 Minuten
    const interval = setInterval(fetchNews, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('news-scroll-container')
    if (container) {
      const scrollAmount = 400
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount)
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  if (error && news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Nachrichten</h3>
          </div>
          <button
            onClick={fetchNews}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">Aktuelle Nachrichten</h3>
          {!loading && news.length > 0 && (
            <span className="text-xs text-gray-500">
              • {news.length} Artikel
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNews}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Scroll Buttons */}
        {news.length > 4 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-2 transition-all"
              disabled={scrollPosition === 0}
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-2 transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* News Cards Container */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[280px] animate-pulse">
                <div className="w-full h-40 bg-gray-200 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div
            id="news-scroll-container"
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
          >
            {news.map((article) => (
              <a
                key={article.id}
                href={article.detailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[280px] max-w-[280px] flex-shrink-0 group"
              >
                <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all">
                  {article.imageUrl && (
                    <div className="w-full h-40 bg-gray-200 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    {article.topline && (
                      <span className="text-xs font-semibold text-blue-600 uppercase block mb-1">
                        {article.topline}
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                      {article.title}
                    </h4>
                    {article.shortText && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {article.shortText}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(article.date).toLocaleDateString('de-DE')}</span>
                      <ExternalLink className="w-3 h-3 group-hover:text-blue-600" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/news')
      if (response.ok) {
        const data = await response.json()
        setNews(data.news || [])
        setLastUpdate(data.cachedAt || data.fetchedAt)
        setError(null)
      } else {
        setError('Nachrichten konnten nicht geladen werden')
      }
    } catch (err) {
      setError('Fehler beim Laden der Nachrichten')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 60) {
      return `vor ${diffMins} Min.`
    } else if (diffHours < 24) {
      return `vor ${diffHours} Std.`
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Nachrichten</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="w-24 h-16 bg-gray-200 rounded flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Nachrichten</h3>
          </div>
          <button
            onClick={fetchNews}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">{error}</p>
          <button
            onClick={fetchNews}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Nachrichten</h3>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lastUpdate && formatDate(lastUpdate)}
          </span>
        </div>
        <button
          onClick={fetchNews}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Aktualisieren"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {news.slice(0, 8).map((article) => (
          <a
            key={article.id}
            href={article.detailsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            {article.imageUrl && (
              <div className="w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {article.topline && (
                <span className="text-xs font-medium text-blue-600 uppercase">
                  {article.topline}
                </span>
              )}
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600">
                {article.title}
              </h4>
              {article.shortText && (
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {article.shortText}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {formatDate(article.date)}
                </span>
                {article.tags && article.tags.length > 0 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {article.tags[0]}
                    </span>
                  </>
                )}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-blue-600" />
          </a>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t text-center">
        <a
          href="https://www.tagesschau.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-600 inline-flex items-center gap-1"
        >
          Weitere Nachrichten auf tagesschau.de
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
