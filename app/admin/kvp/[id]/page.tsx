'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import BackButton from '@/components/BackButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Suggestion {
  id: string
  title: string
  description: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'NEW' | 'IN_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'ON_HOLD'
  estimatedEffort?: string
  plannedDate?: string
  completedDate?: string
  submittedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

interface Comment {
  id: string
  content: string
  isStatusNote: boolean
  author: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

const PRIORITIES = [
  { value: 'LOW', label: 'Niedrig', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Mittel', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'Hoch', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITICAL', label: 'Kritisch', color: 'bg-red-100 text-red-800' }
]

const STATUSES = [
  { value: 'NEW', label: 'Neu', color: 'bg-purple-100 text-purple-800' },
  { value: 'IN_REVIEW', label: 'In Prüfung', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APPROVED', label: 'Genehmigt', color: 'bg-green-100 text-green-800' },
  { value: 'IN_PROGRESS', label: 'In Umsetzung', color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: 'Abgeschlossen', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'REJECTED', label: 'Abgelehnt', color: 'bg-red-100 text-red-800' },
  { value: 'ON_HOLD', label: 'Zurückgestellt', color: 'bg-gray-100 text-gray-800' }
]

const CATEGORIES = [
  'UI/UX',
  'Performance',
  'Prozess',
  'Feature',
  'Bug',
  'Dokumentation',
  'Sicherheit',
  'Sonstiges'
]

export default function KVPDetailPage() {
  const router = useRouter()
  const params = useParams()
  const suggestionId = params.id as string

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    status: '',
    estimatedEffort: '',
    plannedDate: '',
    completedDate: '',
    statusNote: ''
  })

  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)

  useEffect(() => {
    fetchSuggestion()
  }, [suggestionId])

  const fetchSuggestion = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/kvp/${suggestionId}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestion(data)
        setFormData({
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: data.status,
          estimatedEffort: data.estimatedEffort || '',
          plannedDate: data.plannedDate ? new Date(data.plannedDate).toISOString().split('T')[0] : '',
          completedDate: data.completedDate ? new Date(data.completedDate).toISOString().split('T')[0] : '',
          statusNote: ''
        })
      }
    } catch (error) {
      console.error('Error fetching suggestion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/kvp/${suggestionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditing(false)
        fetchSuggestion()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating suggestion:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setAddingComment(true)
    try {
      const response = await fetch(`/api/admin/kvp/${suggestionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        setNewComment('')
        fetchSuggestion()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Fehler beim Hinzufügen des Kommentars')
    } finally {
      setAddingComment(false)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const p = PRIORITIES.find(pr => pr.value === priority)
    return p ? <Badge className={p.color}>{p.label}</Badge> : null
  }

  const getStatusBadge = (status: string) => {
    const s = STATUSES.find(st => st.value === status)
    return s ? <Badge className={s.color}>{s.label}</Badge> : null
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-gray-500">Laden...</div>
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-red-500">Vorschlag nicht gefunden</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityBadge(suggestion.priority)}
                    {getStatusBadge(suggestion.status)}
                    <Badge variant="outline">{suggestion.category}</Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">{suggestion.title}</CardTitle>
                  <CardDescription>
                    Eingereicht von {suggestion.submittedBy.firstName} {suggestion.submittedBy.lastName} am{' '}
                    {new Date(suggestion.createdAt).toLocaleDateString('de-DE')}
                  </CardDescription>
                </div>
                <Button
                  variant={editing ? 'outline' : 'default'}
                  onClick={() => {
                    if (editing) {
                      setFormData({
                        title: suggestion.title,
                        description: suggestion.description,
                        category: suggestion.category,
                        priority: suggestion.priority,
                        status: suggestion.status,
                        estimatedEffort: suggestion.estimatedEffort || '',
                        plannedDate: suggestion.plannedDate ? new Date(suggestion.plannedDate).toISOString().split('T')[0] : '',
                        completedDate: suggestion.completedDate ? new Date(suggestion.completedDate).toISOString().split('T')[0] : '',
                        statusNote: ''
                      })
                    }
                    setEditing(!editing)
                  }}
                >
                  {editing ? 'Abbrechen' : 'Bearbeiten'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {editing ? (
                <>
                  <div>
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={8}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="category">Kategorie</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priorität</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.status !== suggestion.status && (
                    <div>
                      <Label htmlFor="statusNote">Statusänderung Notiz (optional)</Label>
                      <Input
                        id="statusNote"
                        value={formData.statusNote}
                        onChange={(e) => setFormData({ ...formData, statusNote: e.target.value })}
                        placeholder="Begründung für Statusänderung..."
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="estimatedEffort">Geschätzter Aufwand</Label>
                      <Input
                        id="estimatedEffort"
                        value={formData.estimatedEffort}
                        onChange={(e) => setFormData({ ...formData, estimatedEffort: e.target.value })}
                        placeholder="z.B. 1 Tag"
                      />
                    </div>

                    <div>
                      <Label htmlFor="plannedDate">Geplante Umsetzung</Label>
                      <Input
                        id="plannedDate"
                        type="date"
                        value={formData.plannedDate}
                        onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="completedDate">Abgeschlossen am</Label>
                      <Input
                        id="completedDate"
                        type="date"
                        value={formData.completedDate}
                        onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Beschreibung</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{suggestion.description}</p>
                  </div>

                  {suggestion.estimatedEffort && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Geschätzter Aufwand</h3>
                      <p className="text-gray-600">{suggestion.estimatedEffort}</p>
                    </div>
                  )}

                  {(suggestion.plannedDate || suggestion.completedDate) && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Zeitplan</h3>
                      <div className="space-y-1 text-sm">
                        {suggestion.plannedDate && (
                          <p>
                            <span className="text-gray-500">Geplant:</span>{' '}
                            <span className="text-gray-700">
                              {new Date(suggestion.plannedDate).toLocaleDateString('de-DE')}
                            </span>
                          </p>
                        )}
                        {suggestion.completedDate && (
                          <p>
                            <span className="text-gray-500">Abgeschlossen:</span>{' '}
                            <span className="text-gray-700">
                              {new Date(suggestion.completedDate).toLocaleDateString('de-DE')}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Kommentare & Diskussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Comment */}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Kommentar hinzufügen..."
                  rows={3}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={addingComment || !newComment.trim()}
                  className="self-start"
                >
                  {addingComment ? '...' : 'Senden'}
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 border-t pt-4">
                {suggestion.comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Noch keine Kommentare</p>
                ) : (
                  suggestion.comments.map(comment => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg ${
                        comment.isStatusNote
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">
                          {comment.author.firstName} {comment.author.lastName}
                          {comment.isStatusNote && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              System-Notiz
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString('de-DE')}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Eingereicht von</p>
                <p className="font-medium">
                  {suggestion.submittedBy.firstName} {suggestion.submittedBy.lastName}
                </p>
                <p className="text-gray-500 text-xs">{suggestion.submittedBy.email}</p>
              </div>

              {suggestion.assignedTo && (
                <div>
                  <p className="text-gray-500 mb-1">Zugewiesen an</p>
                  <p className="font-medium">
                    {suggestion.assignedTo.firstName} {suggestion.assignedTo.lastName}
                  </p>
                  <p className="text-gray-500 text-xs">{suggestion.assignedTo.email}</p>
                </div>
              )}

              <div>
                <p className="text-gray-500 mb-1">Erstellt</p>
                <p className="font-medium">
                  {new Date(suggestion.createdAt).toLocaleString('de-DE')}
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Zuletzt aktualisiert</p>
                <p className="font-medium">
                  {new Date(suggestion.updatedAt).toLocaleString('de-DE')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
