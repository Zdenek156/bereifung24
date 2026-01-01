'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BlacklistEntry {
  id: string
  email: string
  reason: string | null
  deletedAt: string
  supportNotes: string | null
  updatedAt: string
}

export default function EmailBlacklistPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/admin/email-blacklist')
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/email-blacklist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supportNotes: editNotes })
      })

      if (response.ok) {
        await fetchEntries()
        setEditingId(null)
        setEditNotes('')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Fehler beim Speichern der Notiz')
    }
  }

  const handleUnlock = async (id: string, email: string) => {
    if (!confirm(`E-Mail-Adresse "${email}" wirklich freischalten?\n\nDie Adresse kann dann wieder für Registrierungen verwendet werden.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/email-blacklist/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchEntries()
        alert('E-Mail-Adresse wurde freigeschaltet')
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Freischalten')
      }
    } catch (error) {
      console.error('Error unlocking email:', error)
      alert('Fehler beim Freischalten')
    }
  }

  const filteredEntries = entries.filter(entry =>
    entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Blacklist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">E-Mail Blacklist</h1>
          <p className="mt-2 text-gray-600">
            Gesperrte E-Mail-Adressen von gelöschten Accounts
          </p>
        </div>

        {/* Statistik */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Gesamt gesperrt</p>
              <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mit Support-Notizen</p>
              <p className="text-2xl font-bold text-blue-600">
                {entries.filter(e => e.supportNotes).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Letzte 7 Tage</p>
              <p className="text-2xl font-bold text-gray-900">
                {entries.filter(e => {
                  const date = new Date(e.deletedAt)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return date >= weekAgo
                }).length}
              </p>
            </div>
          </div>
        </div>

        {/* Suche */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            placeholder="E-Mail oder Grund suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tabelle */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-Mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gelöscht am
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Support-Notizen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'Keine Einträge gefunden' : 'Keine gesperrten E-Mails'}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {entry.reason || <span className="text-gray-400 italic">Kein Grund angegeben</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(entry.deletedAt).toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === entry.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Support-Notizen hinzufügen..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNotes(entry.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditNotes('')
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-600 mb-2">
                              {entry.supportNotes || (
                                <span className="text-gray-400 italic">Keine Notizen</span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingId(entry.id)
                                setEditNotes(entry.supportNotes || '')
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              {entry.supportNotes ? 'Bearbeiten' : 'Notiz hinzufügen'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleUnlock(entry.id, entry.email)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Freischalten
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info-Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Hinweise</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Gesperrte E-Mails können nicht für neue Registrierungen verwendet werden</li>
            <li>Support-Notizen helfen bei der Dokumentation von Kundenkontakten</li>
            <li>Nur Administratoren können E-Mails freischalten</li>
            <li>Nach dem Freischalten kann die E-Mail-Adresse sofort wieder genutzt werden</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
