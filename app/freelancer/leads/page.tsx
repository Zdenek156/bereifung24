'use client'

import { useEffect, useState, useCallback } from 'react'

interface Lead {
  id: string
  workshopName: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  zipCode: string | null
  city: string | null
  status: string
  lostReason: string | null
  nextFollowUp: string | null
  notes: string | null
  workshopId: string | null
  activityCount: number
  lastActivity: any
  createdAt: string
  updatedAt: string
}

const PIPELINE_STAGES = [
  { key: 'NEW', label: 'Neu', color: 'bg-gray-100 border-gray-300', badge: 'bg-gray-500' },
  { key: 'CONTACTED', label: 'Kontaktiert', color: 'bg-blue-50 border-blue-300', badge: 'bg-blue-500' },
  { key: 'INTERESTED', label: 'Interessiert', color: 'bg-indigo-50 border-indigo-300', badge: 'bg-indigo-500' },
  { key: 'INTRODUCTION', label: 'Einführung', color: 'bg-purple-50 border-purple-300', badge: 'bg-purple-500' },
  { key: 'REGISTERED', label: 'Registriert', color: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-500' },
  { key: 'ONBOARDED', label: 'Onboarded', color: 'bg-green-50 border-green-300', badge: 'bg-green-500' },
  { key: 'LOST', label: 'Verloren', color: 'bg-red-50 border-red-300', badge: 'bg-red-500' },
]

const LOST_REASONS = [
  'Kein Interesse',
  'Nutzt Wettbewerber',
  'Zu klein',
  'Nicht erreichbar',
  'Preise zu hoch',
  'Sonstiges',
]

const ACTIVITY_TYPES = [
  { value: 'CALL', label: '📞 Anruf' },
  { value: 'EMAIL', label: '📧 E-Mail' },
  { value: 'VISIT', label: '🏢 Besuch' },
  { value: 'NOTE', label: '📝 Notiz' },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/freelancer/leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function updateLeadStatus(leadId: string, newStatus: string, lostReason?: string) {
    const body: any = { status: newStatus }
    if (lostReason) body.lostReason = lostReason
    await fetch(`/api/freelancer/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    fetchLeads()
  }

  async function createLead(formData: any) {
    await fetch('/api/freelancer/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    setShowCreateModal(false)
    fetchLeads()
  }

  async function addActivity(leadId: string, type: string, description: string) {
    await fetch(`/api/freelancer/leads/${leadId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, description }),
    })
    setShowActivityModal(null)
    fetchLeads()
  }

  async function deleteLead(leadId: string) {
    if (!confirm('Lead wirklich löschen?')) return
    await fetch(`/api/freelancer/leads/${leadId}`, { method: 'DELETE' })
    fetchLeads()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  const leadsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.key] = leads.filter(l => l.status === stage.key)
    return acc
  }, {} as Record<string, Lead[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead-Pipeline</h1>
            <p className="text-gray-500">{leads.length} Leads gesamt</p>
          </div>
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            title="Wie funktioniert die Lead-Pipeline?"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('kanban')} className={`px-3 py-1 text-sm rounded-md ${view === 'kanban' ? 'bg-white shadow' : ''}`}>Kanban</button>
            <button onClick={() => setView('table')} className={`px-3 py-1 text-sm rounded-md ${view === 'table' ? 'bg-white shadow' : ''}`}>Tabelle</button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Neuer Lead
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-7 gap-2 pb-4">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage.key} className={`${stage.color} border rounded-xl p-2`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-xs text-gray-700 truncate">{stage.label}</h3>
                <span className={`${stage.badge} text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0`}>
                  {leadsByStage[stage.key]?.length || 0}
                </span>
              </div>
              <div className="space-y-2">
                {(leadsByStage[stage.key] || []).map(lead => (
                  <div key={lead.id} className="bg-white rounded-lg shadow-sm p-2 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-xs text-gray-900 truncate">{lead.workshopName}</h4>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button onClick={() => setShowActivityModal(lead.id)} className="text-xs p-0.5 hover:bg-gray-100 rounded" title="Aktivität hinzufügen">📝</button>
                        {lead.status === 'NEW' && <button onClick={() => deleteLead(lead.id)} className="text-xs p-0.5 hover:bg-gray-100 rounded" title="Löschen">🗑️</button>}
                      </div>
                    </div>
                    {lead.contactPerson && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{lead.contactPerson}</p>}
                    {lead.nextFollowUp && (
                      <p className="text-[11px] text-orange-600 mt-0.5 truncate">📅 {new Date(lead.nextFollowUp).toLocaleDateString('de-DE')}</p>
                    )}
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">{lead.activityCount} Akt.</span>
                      {stage.key !== 'ONBOARDED' && stage.key !== 'LOST' && (
                        <select
                          className="text-[10px] border border-gray-200 rounded px-0.5 py-0.5 max-w-[70px]"
                          value={lead.status}
                          onChange={(e) => {
                            if (e.target.value === 'LOST') {
                              const reason = prompt('Verlustgrund:')
                              if (reason) updateLeadStatus(lead.id, 'LOST', reason)
                            } else {
                              updateLeadStatus(lead.id, e.target.value)
                            }
                          }}
                        >
                          {PIPELINE_STAGES.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Werkstatt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ansprechpartner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktivitäten</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Erstellt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-sm">{lead.workshopName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lead.contactPerson || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                      value={lead.status}
                      onChange={(e) => {
                        if (e.target.value === 'LOST') {
                          const reason = prompt('Verlustgrund:')
                          if (reason) updateLeadStatus(lead.id, 'LOST', reason)
                        } else {
                          updateLeadStatus(lead.id, e.target.value)
                        }
                      }}
                    >
                      {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString('de-DE') : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lead.activityCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(lead.createdAt).toLocaleDateString('de-DE')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setShowActivityModal(lead.id)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">+ Aktivität</button>
                      {lead.status === 'NEW' && <button onClick={() => deleteLead(lead.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Löschen</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && <CreateLeadModal onClose={() => setShowCreateModal(false)} onCreate={createLead} />}

      {/* Add Activity Modal */}
      {showActivityModal && <ActivityModal leadId={showActivityModal} onClose={() => setShowActivityModal(null)} onAdd={addActivity} />}

      {/* Info Modal */}
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </div>
  )
}

function CreateLeadModal({ onClose, onCreate }: { onClose: () => void, onCreate: (data: any) => void }) {
  const [form, setForm] = useState({
    workshopName: '', contactPerson: '', phone: '', email: '', address: '', zipCode: '', city: '', notes: '', nextFollowUp: '',
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold mb-4">Neuen Lead erstellen</h2>
        <div className="space-y-3">
          <input required placeholder="Werkstattname *" value={form.workshopName} onChange={e => setForm({...form, workshopName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Ansprechpartner" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Telefon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="E-Mail" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <input placeholder="Adresse" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="PLZ" value={form.zipCode} onChange={e => setForm({...form, zipCode: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Stadt" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <input type="datetime-local" value={form.nextFollowUp} onChange={e => setForm({...form, nextFollowUp: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <textarea placeholder="Notizen" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Abbrechen</button>
          <button
            onClick={() => form.workshopName && onCreate(form)}
            disabled={!form.workshopName}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >Erstellen</button>
        </div>
      </div>
    </div>
  )
}

function ActivityModal({ leadId, onClose, onAdd }: { leadId: string, onClose: () => void, onAdd: (leadId: string, type: string, desc: string) => void }) {
  const [type, setType] = useState('NOTE')
  const [description, setDescription] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">Aktivität hinzufügen</h2>
        <div className="space-y-3">
          <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <textarea
            placeholder="Beschreibung..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Abbrechen</button>
          <button
            onClick={() => description && onAdd(leadId, type, description)}
            disabled={!description}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >Hinzufügen</button>
        </div>
      </div>
    </div>
  )
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">So funktioniert die Lead-Pipeline</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Was ist die Lead-Pipeline?</h3>
            <p className="text-sm text-blue-800">
              Die Lead-Pipeline ist dein persönliches CRM-Tool, um potenzielle Werkstätten zu akquirieren.
              Jede Werkstatt, die du für Bereifung24 gewinnst, wird dir <strong>lebenslang zugeordnet</strong> —
              du erhältst dauerhaft Provision auf alle Buchungen dieser Werkstatt.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Die Phasen im Überblick</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Neu</p>
                  <p className="text-xs text-gray-600">Du hast eine interessante Werkstatt gefunden und als Lead erfasst. Trage den Werkstattnamen, Ansprechpartner und Kontaktdaten ein.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Kontaktiert</p>
                  <p className="text-xs text-gray-600">Erster Kontakt hergestellt — per Telefon, E-Mail oder persönlichem Besuch. Logge jede Aktivität, damit du den Überblick behältst.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Interessiert</p>
                  <p className="text-xs text-gray-600">Die Werkstatt zeigt Interesse an Bereifung24. Erkläre die Vorteile: Online-Buchungssystem, automatische Terminverwaltung, zusätzliche Kunden ohne Werbekosten.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">4</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Einführung</p>
                  <p className="text-xs text-gray-600">Zeige der Werkstatt das System — vor Ort, per Videocall oder am Telefon. Führe durch das Werkstatt-Portal, erkläre Buchungsablauf, Preiskalkulation und Kalender-Integration.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">5</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Registriert</p>
                  <p className="text-xs text-gray-600">Die Werkstatt hat sich auf bereifung24.de registriert. Unterstütze bei der Einrichtung: Services anlegen, Stripe verbinden, Preise konfigurieren, Landing Page aktivieren.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">6</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Onboarded ✅</p>
                  <p className="text-xs text-gray-600">Die Werkstatt ist vollständig eingerichtet und nimmt Buchungen entgegen. Ab jetzt erhältst du Provision auf jede Buchung dieser Werkstatt!</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">✕</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Verloren</p>
                  <p className="text-xs text-gray-600">Die Werkstatt hat kein Interesse oder ist nicht erreichbar. Trage den Verlustgrund ein — vielleicht ergibt sich später eine neue Chance.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2">Dein Verdienst</h3>
            <p className="text-sm text-green-800">
              Bereifung24 berechnet <strong>6,9% Plattform-Provision</strong> auf jede Buchung. Davon erhältst du als Freelancer 
              einen Anteil basierend auf deinem Tier:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-green-800">
              <li>• <strong>Starter</strong> (1–2 Werkstätten): 15% der Plattform-Provision</li>
              <li>• <strong>Bronze</strong> (3–10 Werkstätten): 20% der Plattform-Provision</li>
              <li>• <strong>Silber</strong> (11–30 Werkstätten): 25% der Plattform-Provision</li>
              <li>• <strong>Gold</strong> (31+ Werkstätten): 30% der Plattform-Provision</li>
            </ul>
            <p className="text-sm text-green-800 mt-2">
              <strong>Beispiel:</strong> Eine durchschnittliche Buchung mit Reifen liegt bei ca. 500€.
              Das ergibt 34,50€ Plattform-Provision (6,9%). Abzüglich ~8,70€ Stripe-Gebühren
              bleiben 25,80€ Netto-Provision. Als Starter (15%) erhältst du davon <strong>3,87€</strong> — bei jeder Buchung, lebenslang.
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4">
            <h3 className="font-semibold text-amber-900 mb-2">Tipps für erfolgreiche Akquise</h3>
            <ul className="space-y-1 text-sm text-amber-800">
              <li>• Logge jede Aktivität (Anruf, E-Mail, Besuch) — so behältst du den Überblick</li>
              <li>• Setze Follow-up-Termine, damit kein Lead vergessen wird</li>
              <li>• Betone die Vorteile: Keine Grundgebühr, nur 6,9% pro Buchung, mehr Kunden</li>
              <li>• Biete Hilfe bei der Einrichtung an — je schneller die Werkstatt live ist, desto früher verdienst du</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Verstanden</button>
        </div>
      </div>
    </div>
  )
}
