'use client'

import { X, Star, MapPin, Phone, Globe, Clock, Euro, ExternalLink, TrendingUp, Info, FileText, CheckSquare, Activity, Trash2, Send, Plus } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

interface ProspectDetail {
  placeId: string
  name: string
  address: string
  city: string
  postalCode: string
  lat: number
  lng: number
  rating?: number
  reviewCount: number
  photoUrls?: string[]
  phone?: string
  website?: string
  openingHours?: string[]
  priceLevel?: number
  leadScore: number
  leadScoreBreakdown?: {
    label: string
    points: number
  }[]
}

interface Note {
  id: string
  content: string
  createdAt: string
  createdBy?: string
}

interface ProspectDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  prospect: ProspectDetail | null
  onImport?: () => void
}

export default function ProspectDetailDialog({ 
  isOpen, 
  onClose, 
  prospect,
  onImport 
}: ProspectDetailDialogProps) {
  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'tasks' | 'activity'>('info')
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Load notes when Notes tab is opened
  useEffect(() => {
    if (activeTab === 'notes' && prospect?.placeId) {
      setLoadingNotes(true)
      fetch(`/api/sales/prospects/${prospect.placeId}/notes`)
        .then(response => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('Failed to fetch notes')
        })
        .then(data => {
          setNotes(data.notes || [])
        })
        .catch(error => {
          console.error('Error loading notes:', error)
        })
        .finally(() => {
          setLoadingNotes(false)
        })
    }
  }, [activeTab, prospect?.placeId])

  const loadNotes = useCallback(async () => {
    if (!prospect?.placeId) return
    
    setLoadingNotes(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoadingNotes(false)
    }
  }, [prospect?.placeId])

  // NOW the conditional return AFTER all hooks
  if (!isOpen || !prospect) return null

  const getPriceLevelText = (level?: number) => {
    if (!level) return 'Keine Angabe'
    return '€'.repeat(level)
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const handleGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prospect.name)}&query_place_id=${prospect.placeId}`,
      '_blank'
    )
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !prospect) return
    
    setSavingNote(true)
    try {
      const response = await fetch(`/api/sales/prospects/${prospect.placeId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newNoteContent,
          prospectData: {
            name: prospect.name,
            address: prospect.address,
            city: prospect.city,
            postalCode: prospect.postalCode,
            lat: prospect.lat,
            lng: prospect.lng,
            phone: prospect.phone,
            website: prospect.website,
            rating: prospect.rating,
            reviewCount: prospect.reviewCount,
            priceLevel: prospect.priceLevel,
            photoUrls: prospect.photoUrls
          }
        })
      })
      
      if (response.ok) {
        setNewNoteContent('')
        await loadNotes()
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Notiz wirklich löschen?')) return
    
    try {
      const response = await fetch(`/api/sales/prospects/${prospect!.placeId}/notes/${noteId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadNotes()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const tabs = [
    { id: 'info' as const, label: 'Informationen', icon: Info },
    { id: 'notes' as const, label: 'Notizen', icon: FileText },
    { id: 'tasks' as const, label: 'Aufgaben', icon: CheckSquare },
    { id: 'activity' as const, label: 'Aktivitäten', icon: Activity },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{prospect.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">{/* Photo Gallery */}
            {prospect.photoUrls && prospect.photoUrls.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  📸 Galerie ({prospect.photoUrls.length} {prospect.photoUrls.length === 1 ? 'Foto' : 'Fotos'})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {prospect.photoUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${prospect.name} - Foto ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">ℹ️ Informationen</h3>
              <div className="space-y-3">
                {/* Rating */}
                {prospect.rating && (
                  <div className="flex items-center text-sm">
                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-2" />
                    <span className="font-medium">{prospect.rating.toFixed(1)} Sterne</span>
                    <span className="text-gray-600 ml-1">({prospect.reviewCount} Bewertungen)</span>
                  </div>
                )}

                {/* Address */}
                <div className="flex items-start text-sm">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{prospect.street || prospect.address}</div>
                    {prospect.postalCode && prospect.city && (
                      <div className="text-gray-600 mt-0.5">
                        {prospect.postalCode} {prospect.city}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                {prospect.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={`tel:${prospect.phone}`} className="text-primary-600 hover:underline">
                      {prospect.phone}
                    </a>
                  </div>
                )}

                {/* Website */}
                {prospect.website && (
                  <div className="flex items-center text-sm">
                    <Globe className="h-5 w-5 text-gray-400 mr-2" />
                    <a 
                      href={prospect.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline truncate"
                    >
                      {prospect.website}
                    </a>
                  </div>
                )}

                {/* Opening Hours */}
                {prospect.openingHours && prospect.openingHours.length > 0 && (
                  <div className="flex items-start text-sm">
                    <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      {prospect.openingHours.map((hours, index) => (
                        <div key={index} className="text-gray-600">{hours}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Level */}
                <div className="flex items-center text-sm">
                  <Euro className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium">Preisniveau:</span>
                  <span className="ml-2 text-gray-600">{getPriceLevelText(prospect.priceLevel)}</span>
                </div>
              </div>
            </div>

            {/* Lead Score Breakdown */}
            {prospect.leadScoreBreakdown && prospect.leadScoreBreakdown.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Lead-Score Breakdown: {prospect.leadScore}/100
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {prospect.leadScoreBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{item.label}</span>
                        <span className={`px-2 py-1 rounded font-medium ${
                          item.points > 0 
                            ? 'bg-green-100 text-green-800' 
                            : item.points < 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.points > 0 ? '+' : ''}{item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between font-semibold">
                    <span>Gesamt-Score:</span>
                    <span className={`px-3 py-1 rounded ${getLeadScoreColor(prospect.leadScore)}`}>
                      {prospect.leadScore}/100
                    </span>
                  </div>
                </div>
              </div>
            )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Add New Note */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neue Notiz hinzufügen
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Notiz eingeben..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      disabled={savingNote}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNoteContent.trim() || savingNote}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-fit"
                    >
                      {savingNote ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Speichern...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Speichern
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {loadingNotes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-gray-600 mt-2">Lade Notizen...</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Noch keine Notizen vorhanden</p>
                    <p className="text-sm mt-1">Füge oben eine neue Notiz hinzu</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(note.createdAt).toLocaleDateString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {note.createdBy && (
                                <span className="ml-2">• {note.createdBy}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors flex-shrink-0"
                            title="Notiz löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="text-center py-12 text-gray-500">
                  <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aufgaben-Funktion wird in Kürze verfügbar sein</p>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="text-center py-12 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aktivitäten-Timeline wird in Kürze verfügbar sein</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleGoogleMaps}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              In Google Maps öffnen
            </button>
            
            {onImport && (
              <button
                onClick={() => {
                  onImport()
                  onClose()
                }}
                className="flex items-center px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                ✓ Als Prospect importieren
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
