'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BackButton from '@/components/BackButton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ImprovementSuggestion {
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
  comments: any[]
  createdAt: string
  updatedAt: string
}

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

export default function KVPPage() {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [newSuggestion, setNewSuggestion] = useState({
    title: '',
    description: '',
    category: 'Feature',
    priority: 'MEDIUM',
    estimatedEffort: '',
    plannedDate: ''
  })

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/kvp')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/kvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSuggestion)
      })

      if (response.ok) {
        setShowNewDialog(false)
        setNewSuggestion({
          title: '',
          description: '',
          category: 'Feature',
          priority: 'MEDIUM',
          estimatedEffort: '',
          plannedDate: ''
        })
        fetchSuggestions()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating suggestion:', error)
      alert('Fehler beim Erstellen des Vorschlags')
    } finally {
      setSubmitting(false)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const p = PRIORITIES.find(pr => pr.value === priority)
    return p ? (
      <Badge className={p.color}>{p.label}</Badge>
    ) : null
  }

  const getStatusBadge = (status: string) => {
    const s = STATUSES.find(st => st.value === status)
    return s ? (
      <Badge className={s.color}>{s.label}</Badge>
    ) : null
  }

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filterStatus !== 'ALL' && suggestion.status !== filterStatus) return false
    if (filterCategory !== 'ALL' && suggestion.category !== filterCategory) return false
    if (filterPriority !== 'ALL' && suggestion.priority !== filterPriority) return false
    return true
  })

  // Statistics
  const stats = {
    total: suggestions.length,
    new: suggestions.filter(s => s.status === 'NEW').length,
    inProgress: suggestions.filter(s => s.status === 'IN_PROGRESS').length,
    completed: suggestions.filter(s => s.status === 'COMPLETED').length
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <CardTitle className="text-2xl">KVP - Kontinuierlicher Verbesserungsprozess</CardTitle>
                <CardDescription>
                  Verbesserungsvorschläge für Bereifung24 einreichen und verwalten
                </CardDescription>
              </div>
            </div>
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Neuer Vorschlag
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Neuen Verbesserungsvorschlag einreichen</DialogTitle>
                  <DialogDescription>
                    Beschreiben Sie Ihre Idee zur Verbesserung von Bereifung24
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitSuggestion} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      value={newSuggestion.title}
                      onChange={(e) => setNewSuggestion({ ...newSuggestion, title: e.target.value })}
                      placeholder="Kurze Beschreibung des Vorschlags"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Beschreibung *</Label>
                    <Textarea
                      id="description"
                      value={newSuggestion.description}
                      onChange={(e) => setNewSuggestion({ ...newSuggestion, description: e.target.value })}
                      placeholder="Detaillierte Beschreibung des Verbesserungsvorschlags..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Kategorie *</Label>
                      <Select
                        value={newSuggestion.category}
                        onValueChange={(value) => setNewSuggestion({ ...newSuggestion, category: value })}
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
                        value={newSuggestion.priority}
                        onValueChange={(value) => setNewSuggestion({ ...newSuggestion, priority: value })}
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimatedEffort">Geschätzter Aufwand</Label>
                      <Input
                        id="estimatedEffort"
                        value={newSuggestion.estimatedEffort}
                        onChange={(e) => setNewSuggestion({ ...newSuggestion, estimatedEffort: e.target.value })}
                        placeholder="z.B. 1 Tag, 1 Woche"
                      />
                    </div>

                    <div>
                      <Label htmlFor="plannedDate">Geplante Umsetzung</Label>
                      <Input
                        id="plannedDate"
                        type="date"
                        value={newSuggestion.plannedDate}
                        onChange={(e) => setNewSuggestion({ ...newSuggestion, plannedDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewDialog(false)}
                      disabled={submitting}
                    >
                      Abbrechen
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Wird gespeichert...' : 'Vorschlag einreichen'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-sm text-gray-600">Gesamt</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{stats.new}</div>
                <p className="text-sm text-gray-600">Neu</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                <p className="text-sm text-gray-600">In Umsetzung</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-sm text-gray-600">Abgeschlossen</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Alle Status</SelectItem>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Alle Kategorien</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorität filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Alle Prioritäten</SelectItem>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Suggestions List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Laden...</div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine Verbesserungsvorschläge gefunden
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map(suggestion => (
                <Card
                  key={suggestion.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/admin/kvp/${suggestion.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                          {getPriorityBadge(suggestion.priority)}
                          {getStatusBadge(suggestion.status)}
                          <Badge variant="outline">{suggestion.category}</Badge>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{suggestion.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Eingereicht von: <strong>{suggestion.submittedBy.firstName} {suggestion.submittedBy.lastName}</strong>
                          </span>
                          {suggestion.assignedTo && (
                            <span>
                              Zugewiesen an: <strong>{suggestion.assignedTo.firstName} {suggestion.assignedTo.lastName}</strong>
                            </span>
                          )}
                          {suggestion.estimatedEffort && (
                            <span>
                              Aufwand: <strong>{suggestion.estimatedEffort}</strong>
                            </span>
                          )}
                          <span className="ml-auto">
                            {new Date(suggestion.createdAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {suggestion.comments.length > 0 && (
                          <Badge variant="outline" className="text-blue-600">
                            💬 {suggestion.comments.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
