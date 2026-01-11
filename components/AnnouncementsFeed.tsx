'use client'

import { useState, useEffect } from 'react'
import { Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Announcement {
  id: string
  title: string
  type: string
  priority: string
  isPinned: boolean
  publishedAt: string
  author: {
    firstName: string
    lastName: string
  }
  isRead: boolean
}

const TYPE_EMOJIS: Record<string, string> = {
  GENERAL: '📢',
  NEWS: '📰',
  EVENT: '📅',
  BIRTHDAY: '🎂',
  ACHIEVEMENT: '🏆',
  POLICY: '📋',
  URGENT: '⚠️',
  MARKETPLACE: '🛒'
}

export default function AnnouncementsFeed() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/employee/announcements')
      if (response.ok) {
        const data = await response.json()
        // Nur die ersten 5 Ankündigungen anzeigen
        setAnnouncements(data.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = announcements.filter(a => !a.isRead).length

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">Schwarzes Brett</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">Schwarzes Brett</h3>
        </div>
        <div className="text-center py-4 text-gray-500 text-sm">
          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p>Keine Ankündigungen vorhanden</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">Schwarzes Brett</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
              {unreadCount} neu
            </span>
          )}
        </div>
        <Link
          href="/mitarbeiter/news"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Alle anzeigen
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {announcements.map((announcement) => (
          <Link
            key={announcement.id}
            href="/mitarbeiter/news"
            className={`block p-3 rounded-lg border transition-all hover:shadow-md ${
              !announcement.isRead 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{TYPE_EMOJIS[announcement.type] || '📢'}</span>
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {announcement.title}
                  </h4>
                  {!announcement.isRead && (
                    <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{announcement.author.firstName} {announcement.author.lastName}</span>
                  <span>•</span>
                  <span>{new Date(announcement.publishedAt).toLocaleDateString('de-DE', { 
                    day: '2-digit', 
                    month: 'short' 
                  })}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
