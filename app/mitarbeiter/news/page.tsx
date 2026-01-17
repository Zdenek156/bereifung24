'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bell, Pin, Calendar, User, Eye, Filter, Plus, Pencil, Trash2, X } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface Author {
  id: string
  firstName: string
  lastName: string
  profileImage?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  priority: string
  isPinned: boolean
  isActive: boolean
  publishedAt: string
  expiresAt?: string
  viewCount: number
  author: Author
  isRead: boolean
  readAt?: string
  createdAt: string
}

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  GENERAL: { label: 'Allgemein', emoji: '📢', color: 'bg-gray-100 text-gray-800' },
  NEWS: { label: 'News', emoji: '📰', color: 'bg-blue-100 text-blue-800' },
  EVENT: { label: 'Event', emoji: '📅', color: 'bg-purple-100 text-purple-800' },
  BIRTHDAY: { label: 'Geburtstag', emoji: '🎂', color: 'bg-pink-100 text-pink-800' },
  ACHIEVEMENT: { label: 'Erfolg', emoji: '🏆', color: 'bg-yellow-100 text-yellow-800' },
  POLICY: { label: 'Richtlinie', emoji: '📋', color: 'bg-indigo-100 text-indigo-800' },
  URGENT: { label: 'Dringend', emoji: '⚠️', color: 'bg-red-100 text-red-800' },
  MARKETPLACE: { label: 'Marktplatz', emoji: '🛒', color: 'bg-green-100 text-green-800' }
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'border-l-gray-400',
  NORMAL: 'border-l-blue-500',
  HIGH: 'border-l-orange-500',
  URGENT: 'border-l-red-600'
}

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('ALL')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GENERAL',
    priority: 'NORMAL',
    expiresAt: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
    } else {
      fetchAnnouncements()
    }
  }, [session, status, router])

  useEffect(() => {
    applyFilters()
  }, [announcements, filterType, showUnreadOnly])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employee/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...announcements]

    if (filterType !== 'ALL') {
      filtered = filtered.filter(a => a.type === filterType)
    }

    if (showUnreadOnly) {
      filtered = filtered.filter(a => !a.isRead)
    }

    setFilteredAnnouncements(filtered)
  }

  const markAsRead = async (announcementId: string) => {
    try {
      const response = await fetch(`/api/employee/announcements/${announcementId}`, {
        method: 'PATCH'
      })

      if (response.ok) {
        setAnnouncements(prev =>
          prev.map(a =>
            a.id === announcementId
              ? { ...a, isRead: true, readAt: new Date().toISOString() }
              : a
          )
        )
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const unreadCount = announcements.filter(a => !a.isRead).length

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Bitte Überschrift und Text ausfüllen')
      return
    }

    setCreating(true)
    try {
      const url = editingId 
        ? `/api/employee/announcements/${editingId}`
        : '/api/employee/announcements'
      
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || null
        })
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setEditingId(null)
        setFormData({
          title: '',
          content: '',
          type: 'GENERAL',
          priority: 'NORMAL',
          expiresAt: ''
        })
        fetchAnnouncements()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      alert('Fehler beim Speichern')
    } finally {
      setCreating(false)
    }
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt ? announcement.expiresAt.split('T')[0] : ''
    })
    setShowCreateDialog(true)
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Möchten Sie diese Ankündigung wirklich löschen?')) {
      return
    }

    try {
      const response = await fetch(`/api/employee/announcements/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchAnnouncements()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Fehler beim Löschen')
    } finally {
      setCreating(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-7 h-7 text-blue-600" />
                Schwarzes Brett
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Aktuelle Ankündigungen & News {unreadCount > 0 && `• ${unreadCount} ungelesen`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neue Ankündigung
              </button>
              <BackButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Alle Typen</option>
              {Object.entries(TYPE_LABELS).map(([key, { label, emoji }]) => (
                <option key={key} value={key}>
                  {emoji} {label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Nur ungelesene</span>
            </label>

            <div className="ml-auto text-sm text-gray-600">
              {filteredAnnouncements.length} Ankündigung{filteredAnnouncements.length !== 1 ? 'en' : ''}
            </div>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Lädt Ankündigungen...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {showUnreadOnly || filterType !== 'ALL'
                ? 'Keine Ankündigungen mit diesen Filtern gefunden'
                : 'Noch keine Ankündigungen vorhanden'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => {
              const typeInfo = TYPE_LABELS[announcement.type] || TYPE_LABELS.GENERAL
              const priorityColor = PRIORITY_COLORS[announcement.priority] || PRIORITY_COLORS.NORMAL

              return (
                <div
                  key={announcement.id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityColor} ${
                    !announcement.isRead ? 'ring-2 ring-blue-200' : ''
                  }`}
                  onClick={() => !announcement.isRead && markAsRead(announcement.id)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.isPinned && (
                            <Pin className="w-4 h-4 text-blue-600" fill="currentColor" />
                          )}
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            <span>{typeInfo.emoji}</span>
                            <span>{typeInfo.label}</span>
                          </span>
                          {!announcement.isRead && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                              Neu
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {announcement.title}
                        </h3>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-sm max-w-none mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            {announcement.author.firstName} {announcement.author.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(announcement.publishedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{announcement.viewCount}x angesehen</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {announcement.isRead && announcement.readAt && (
                          <span className="text-green-600">
                            ✓ Gelesen am {formatDate(announcement.readAt)} um {formatTime(announcement.readAt)}
                          </span>
                        )}
                        {/* Edit/Delete Buttons - nur für Ersteller sichtbar */}
                        {session?.user?.id === announcement.author.id && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditAnnouncement(announcement)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Bearbeiten"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteAnnouncement(announcement.id)
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateDialog(false)
                      setEditingId(null)
                      setFormData({
                        title: '',
                        content: '',
                        type: 'GENERAL',
                        priority: 'NORMAL',
                        expiresAt: ''
                      })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Überschrift *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Team-Meeting am Freitag"
                      maxLength={200}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategorie
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(TYPE_LABELS).map(([key, { label, emoji }]) => (
                        <option key={key} value={key}>
                          {emoji} {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={6}
                      placeholder="Schreibe hier deine Ankündigung..."
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorität
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW">Niedrig</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">Hoch</option>
                      <option value="URGENT">Dringend</option>
                    </select>
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anzeigen bis (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Wenn leer, wird die Ankündigung unbegrenzt angezeigt
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateAnnouncement}
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Wird gespeichert...' : editingId ? 'Änderungen speichern' : 'Veröffentlichen'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateDialog(false)
                      setEditingId(null)
                      setFormData({
                        title: '',
                        content: '',
                        type: 'GENERAL',
                        priority: 'NORMAL',
                        expiresAt: ''
                      })
                    }}
                    disabled={creating}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
