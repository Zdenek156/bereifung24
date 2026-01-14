'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Phone,
  MapPin,
  Mail,
  Calendar,
  FileText,
  TrendingUp,
  User,
  Building2,
  Clock,
  Plus,
  Save,
  Trash2,
  Pin,
} from 'lucide-react'

interface WorkshopCRMDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workshopId: string
  workshopName: string
}

interface CRMData {
  id: string
  leadStatus: string
  potential?: string
  estimatedMonthlyRevenue?: number
  mainContactName?: string
  mainContactPosition?: string
  mainContactPhone?: string
  mainContactEmail?: string
  decisionMaker: boolean
  otherPlatforms?: string
  nextContactDate?: string
  nextContactType?: string
  followUpNotes?: string
  contractStatus?: string
  contractStartDate?: string
  workshop: {
    companyName: string
    user: {
      email: string
      firstName: string
      lastName: string
      phone: string
    }
  }
  interactions: Interaction[]
  notes: Note[]
}

interface Interaction {
  id: string
  type: string
  date: string
  duration?: number
  summary: string
  outcome?: string
  employeeName: string
  createdAt: string
}

interface Note {
  id: string
  category?: string
  title?: string
  content: string
  isPinned: boolean
  employeeName: string
  createdAt: string
}

export function WorkshopCRMDialog({
  open,
  onOpenChange,
  workshopId,
  workshopName,
}: WorkshopCRMDialogProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [crmData, setCrmData] = useState<CRMData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Form states
  const [formData, setFormData] = useState({
    leadStatus: 'NEUKONTAKT',
    potential: '',
    estimatedMonthlyRevenue: '',
    mainContactName: '',
    mainContactPosition: '',
    mainContactPhone: '',
    mainContactEmail: '',
    decisionMaker: false,
    otherPlatforms: '',
    nextContactDate: '',
    nextContactType: '',
    followUpNotes: '',
    contractStatus: '',
    contractStartDate: '',
  })

  // New interaction form
  const [newInteraction, setNewInteraction] = useState({
    type: 'TELEFON',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    summary: '',
    outcome: '',
  })

  // New note form
  const [newNote, setNewNote] = useState({
    category: 'ALLGEMEIN',
    title: '',
    content: '',
  })

  useEffect(() => {
    if (open) {
      fetchCRMData()
    }
  }, [open, workshopId])

  const fetchCRMData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/workshops/${workshopId}/crm`)
      if (response.ok) {
        const data = await response.json()
        setCrmData(data)
        setFormData({
          leadStatus: data.leadStatus || 'NEUKONTAKT',
          potential: data.potential || '',
          estimatedMonthlyRevenue: data.estimatedMonthlyRevenue || '',
          mainContactName: data.mainContactName || '',
          mainContactPosition: data.mainContactPosition || '',
          mainContactPhone: data.mainContactPhone || '',
          mainContactEmail: data.mainContactEmail || '',
          decisionMaker: data.decisionMaker || false,
          otherPlatforms: data.otherPlatforms || '',
          nextContactDate: data.nextContactDate
            ? new Date(data.nextContactDate).toISOString().split('T')[0]
            : '',
          nextContactType: data.nextContactType || '',
          followUpNotes: data.followUpNotes || '',
          contractStatus: data.contractStatus || '',
          contractStartDate: data.contractStartDate
            ? new Date(data.contractStartDate).toISOString().split('T')[0]
            : '',
        })
      }
    } catch (error) {
      console.error('Error fetching CRM data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCRM = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/workshops/${workshopId}/crm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setCrmData(data)
        alert('CRM-Daten erfolgreich gespeichert')
      }
    } catch (error) {
      console.error('Error saving CRM data:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleAddInteraction = async () => {
    if (!newInteraction.summary) {
      alert('Bitte Zusammenfassung eingeben')
      return
    }

    try {
      const employeeName = `${session?.user?.name || 'Unbekannt'}`
      const response = await fetch(
        `/api/admin/workshops/${workshopId}/crm/interactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newInteraction,
            duration: newInteraction.duration ? parseInt(newInteraction.duration) : null,
            employeeName,
          }),
        }
      )

      if (response.ok) {
        setNewInteraction({
          type: 'TELEFON',
          date: new Date().toISOString().split('T')[0],
          duration: '',
          summary: '',
          outcome: '',
        })
        fetchCRMData()
      }
    } catch (error) {
      console.error('Error adding interaction:', error)
      alert('Fehler beim Hinzufügen')
    }
  }

  const handleAddNote = async () => {
    if (!newNote.content) {
      alert('Bitte Notiz-Inhalt eingeben')
      return
    }

    try {
      const employeeName = `${session?.user?.name || 'Unbekannt'}`
      const response = await fetch(
        `/api/admin/workshops/${workshopId}/crm/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newNote,
            employeeName,
          }),
        }
      )

      if (response.ok) {
        setNewNote({
          category: 'ALLGEMEIN',
          title: '',
          content: '',
        })
        fetchCRMData()
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Fehler beim Hinzufügen')
    }
  }

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!confirm('Interaktion wirklich löschen?')) return

    try {
      const response = await fetch(
        `/api/admin/workshops/${workshopId}/crm/interactions?interactionId=${interactionId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        fetchCRMData()
      }
    } catch (error) {
      console.error('Error deleting interaction:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Notiz wirklich löschen?')) return

    try {
      const response = await fetch(
        `/api/admin/workshops/${workshopId}/crm/notes?noteId=${noteId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        fetchCRMData()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      NEUKONTAKT: 'bg-gray-100 text-gray-800',
      INTERESSIERT: 'bg-blue-100 text-blue-800',
      VERHANDLUNG: 'bg-yellow-100 text-yellow-800',
      AKTIV: 'bg-green-100 text-green-800',
      INAKTIV: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            CRM - {workshopName}
          </DialogTitle>
          <DialogDescription>
            Vertriebsinformationen und Kontakthistorie verwalten
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Lädt...</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="contact">Kontakt</TabsTrigger>
              <TabsTrigger value="interactions">
                Interaktionen ({crmData?.interactions.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes">
                Notizen ({crmData?.notes.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leadStatus">Lead-Status</Label>
                  <select
                    id="leadStatus"
                    value={formData.leadStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, leadStatus: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="NEUKONTAKT">Neukontakt</option>
                    <option value="INTERESSIERT">Interessiert</option>
                    <option value="VERHANDLUNG">Verhandlung</option>
                    <option value="AKTIV">Aktiver Kunde</option>
                    <option value="INAKTIV">Inaktiv</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="potential">Umsatzpotenzial</Label>
                  <select
                    id="potential"
                    value={formData.potential}
                    onChange={(e) =>
                      setFormData({ ...formData, potential: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Nicht bewertet</option>
                    <option value="HOCH">Hoch</option>
                    <option value="MITTEL">Mittel</option>
                    <option value="NIEDRIG">Niedrig</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="estimatedRevenue">
                    Geschätzter Monatsumsatz (€)
                  </Label>
                  <Input
                    id="estimatedRevenue"
                    type="number"
                    value={formData.estimatedMonthlyRevenue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedMonthlyRevenue: e.target.value,
                      })
                    }
                    placeholder="z.B. 1500"
                  />
                </div>

                <div>
                  <Label htmlFor="contractStatus">Vertragsstatus</Label>
                  <select
                    id="contractStatus"
                    value={formData.contractStatus}
                    onChange={(e) =>
                      setFormData({ ...formData, contractStatus: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Nicht festgelegt</option>
                    <option value="KEIN_VERTRAG">Kein Vertrag</option>
                    <option value="ANGEBOT_GESENDET">Angebot gesendet</option>
                    <option value="VERHANDLUNG">In Verhandlung</option>
                    <option value="VERTRAG_AKTIV">Vertrag aktiv</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="otherPlatforms">
                    Andere genutzte Plattformen
                  </Label>
                  <Input
                    id="otherPlatforms"
                    value={formData.otherPlatforms}
                    onChange={(e) =>
                      setFormData({ ...formData, otherPlatforms: e.target.value })
                    }
                    placeholder="z.B. ReifenDirekt, ATU Partner, etc."
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Nächster Kontakt</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nextContactDate">Datum</Label>
                    <Input
                      id="nextContactDate"
                      type="date"
                      value={formData.nextContactDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nextContactDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="nextContactType">Art</Label>
                    <select
                      id="nextContactType"
                      value={formData.nextContactType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nextContactType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Nicht festgelegt</option>
                      <option value="TELEFON">Telefon</option>
                      <option value="BESUCH">Vor-Ort-Besuch</option>
                      <option value="EMAIL">E-Mail</option>
                      <option value="MEETING">Meeting</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="followUpNotes">Notizen / Wiedervorlage</Label>
                    <Textarea
                      id="followUpNotes"
                      value={formData.followUpNotes}
                      onChange={(e) =>
                        setFormData({ ...formData, followUpNotes: e.target.value })
                      }
                      placeholder="Was muss beim nächsten Kontakt besprochen werden?"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCRM} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Speichert...' : 'Speichern'}
                </Button>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mainContactName">Hauptansprechpartner</Label>
                  <Input
                    id="mainContactName"
                    value={formData.mainContactName}
                    onChange={(e) =>
                      setFormData({ ...formData, mainContactName: e.target.value })
                    }
                    placeholder="Name"
                  />
                </div>

                <div>
                  <Label htmlFor="mainContactPosition">Position</Label>
                  <Input
                    id="mainContactPosition"
                    value={formData.mainContactPosition}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainContactPosition: e.target.value,
                      })
                    }
                    placeholder="z.B. Geschäftsführer"
                  />
                </div>

                <div>
                  <Label htmlFor="mainContactPhone">Telefon</Label>
                  <Input
                    id="mainContactPhone"
                    value={formData.mainContactPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainContactPhone: e.target.value,
                      })
                    }
                    placeholder="+49 123 456789"
                  />
                </div>

                <div>
                  <Label htmlFor="mainContactEmail">E-Mail</Label>
                  <Input
                    id="mainContactEmail"
                    type="email"
                    value={formData.mainContactEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainContactEmail: e.target.value,
                      })
                    }
                    placeholder="kontakt@werkstatt.de"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.decisionMaker}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          decisionMaker: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Entscheidungsbefugt</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Werkstatt-Kontaktdaten</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Name:</strong> {crmData?.workshop.user?.firstName}{' '}
                    {crmData?.workshop.user?.lastName}
                  </p>
                  <p>
                    <strong>E-Mail:</strong> {crmData?.workshop.user?.email}
                  </p>
                  {crmData?.workshop.user?.phone && (
                    <p>
                      <strong>Telefon:</strong> {crmData.workshop.user.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCRM} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Speichert...' : 'Speichern'}
                </Button>
              </div>
            </TabsContent>

            {/* Interactions Tab */}
            <TabsContent value="interactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Neue Interaktion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="interactionType">Art</Label>
                      <select
                        id="interactionType"
                        value={newInteraction.type}
                        onChange={(e) =>
                          setNewInteraction({
                            ...newInteraction,
                            type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="TELEFON">Telefon</option>
                        <option value="BESUCH">Vor-Ort-Besuch</option>
                        <option value="EMAIL">E-Mail</option>
                        <option value="MEETING">Meeting</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="interactionDate">Datum</Label>
                      <Input
                        id="interactionDate"
                        type="date"
                        value={newInteraction.date}
                        onChange={(e) =>
                          setNewInteraction({
                            ...newInteraction,
                            date: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="interactionDuration">Dauer (Min.)</Label>
                      <Input
                        id="interactionDuration"
                        type="number"
                        value={newInteraction.duration}
                        onChange={(e) =>
                          setNewInteraction({
                            ...newInteraction,
                            duration: e.target.value,
                          })
                        }
                        placeholder="z.B. 30"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="interactionSummary">Zusammenfassung *</Label>
                    <Textarea
                      id="interactionSummary"
                      value={newInteraction.summary}
                      onChange={(e) =>
                        setNewInteraction({
                          ...newInteraction,
                          summary: e.target.value,
                        })
                      }
                      placeholder="Was wurde besprochen?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="interactionOutcome">Ergebnis</Label>
                    <select
                      id="interactionOutcome"
                      value={newInteraction.outcome}
                      onChange={(e) =>
                        setNewInteraction({
                          ...newInteraction,
                          outcome: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Nicht bewertet</option>
                      <option value="POSITIV">Positiv</option>
                      <option value="NEUTRAL">Neutral</option>
                      <option value="NEGATIV">Negativ</option>
                      <option value="FOLLOW_UP_NEEDED">Follow-up nötig</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleAddInteraction} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Hinzufügen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {crmData?.interactions.map((interaction) => (
                  <Card key={interaction.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{interaction.type}</Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(interaction.date).toLocaleDateString('de-DE')}
                            </span>
                            {interaction.duration && (
                              <span className="text-sm text-gray-500">
                                ({interaction.duration} Min.)
                              </span>
                            )}
                            {interaction.outcome && (
                              <Badge
                                className={
                                  interaction.outcome === 'POSITIV'
                                    ? 'bg-green-100 text-green-800'
                                    : interaction.outcome === 'NEGATIV'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {interaction.outcome}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2">{interaction.summary}</p>
                          <p className="text-xs text-gray-500">
                            von {interaction.employeeName} am{' '}
                            {new Date(interaction.createdAt).toLocaleString('de-DE')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInteraction(interaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!crmData?.interactions || crmData.interactions.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Keine Interaktionen vorhanden
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Neue Notiz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="noteCategory">Kategorie</Label>
                      <select
                        id="noteCategory"
                        value={newNote.category}
                        onChange={(e) =>
                          setNewNote({ ...newNote, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="ALLGEMEIN">Allgemein</option>
                        <option value="WICHTIG">Wichtig</option>
                        <option value="ANFORDERUNG">Anforderung</option>
                        <option value="PROBLEM">Problem</option>
                        <option value="CHANCE">Chance</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="noteTitle">Titel (optional)</Label>
                      <Input
                        id="noteTitle"
                        value={newNote.title}
                        onChange={(e) =>
                          setNewNote({ ...newNote, title: e.target.value })
                        }
                        placeholder="Kurze Überschrift"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="noteContent">Notiz *</Label>
                    <Textarea
                      id="noteContent"
                      value={newNote.content}
                      onChange={(e) =>
                        setNewNote({ ...newNote, content: e.target.value })
                      }
                      placeholder="Wichtige Informationen..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleAddNote} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Hinzufügen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {crmData?.notes.map((note) => (
                  <Card
                    key={note.id}
                    className={note.isPinned ? 'border-yellow-400 border-2' : ''}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {note.category && (
                              <Badge
                                className={
                                  note.category === 'WICHTIG'
                                    ? 'bg-red-100 text-red-800'
                                    : note.category === 'CHANCE'
                                    ? 'bg-green-100 text-green-800'
                                    : note.category === 'PROBLEM'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                                }
                              >
                                {note.category}
                              </Badge>
                            )}
                            {note.isPinned && (
                              <Pin className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                          {note.title && (
                            <h4 className="font-medium mb-1">{note.title}</h4>
                          )}
                          <p className="text-sm mb-2 whitespace-pre-wrap">
                            {note.content}
                          </p>
                          <p className="text-xs text-gray-500">
                            von {note.employeeName} am{' '}
                            {new Date(note.createdAt).toLocaleString('de-DE')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!crmData?.notes || crmData.notes.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Keine Notizen vorhanden
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
