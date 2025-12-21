'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Prospect {
  id: string;
  name: string;
  googlePlaceId: string;
  city: string;
  postalCode: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  status: string;
  priority: string;
  leadScore: number;
  rating?: number;
  reviewCount: number;
  photoUrls: string[];
  estimatedRevenue?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  interactions: Interaction[];
  tasks: Task[];
  notes: Note[];
  convertedToWorkshop?: {
    id: string;
    name: string;
    city: string;
  };
  createdAt: string;
}

interface Interaction {
  id: string;
  type: string;
  notes: string;
  outcome?: string;
  channel?: string;
  duration?: number;
  scheduledFor?: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  completedAt?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Note {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const statusLabels: Record<string, string> = {
  NEW: 'Neu',
  CONTACTED: 'Kontaktiert',
  QUALIFIED: 'Qualifiziert',
  MEETING_SCHEDULED: 'Termin geplant',
  DEMO_COMPLETED: 'Demo durchgeführt',
  PROPOSAL_SENT: 'Angebot versendet',
  NEGOTIATING: 'Verhandlung',
  VERBAL_AGREEMENT: 'Mündliche Zusage',
  CONTRACT_SENT: 'Vertrag versendet',
  WON: 'Gewonnen',
  LOST: 'Verloren',
  NOT_INTERESTED: 'Kein Interesse',
  NOT_REACHABLE: 'Nicht erreichbar',
  CALLBACK: 'Follow-up geplant',
  ON_HOLD: 'Pausiert'
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  MEETING_SCHEDULED: 'bg-indigo-100 text-indigo-800',
  DEMO_COMPLETED: 'bg-cyan-100 text-cyan-800',
  PROPOSAL_SENT: 'bg-yellow-100 text-yellow-800',
  NEGOTIATING: 'bg-orange-100 text-orange-800',
  VERBAL_AGREEMENT: 'bg-lime-100 text-lime-800',
  CONTRACT_SENT: 'bg-teal-100 text-teal-800',
  WON: 'bg-green-600 text-white',
  LOST: 'bg-red-100 text-red-800',
  NOT_INTERESTED: 'bg-gray-100 text-gray-800',
  NOT_REACHABLE: 'bg-gray-200 text-gray-600',
  CALLBACK: 'bg-blue-100 text-blue-800',
  ON_HOLD: 'bg-gray-300 text-gray-700'
};

const interactionTypeLabels: Record<string, string> = {
  CALL: 'Telefonat',
  EMAIL: 'E-Mail',
  MEETING: 'Meeting',
  DEMO: 'Demo',
  NOTE: 'Notiz',
  PROPOSAL: 'Angebot',
  CONTRACT: 'Vertrag',
  FOLLOW_UP: 'Follow-up'
};

export default function ProspectDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Forms state
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProspect();
    }
  }, [status, params.id]);

  const fetchProspect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sales/prospects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProspect(data.prospect);
      } else if (response.status === 404) {
        router.push('/sales/prospects');
      }
    } catch (error) {
      console.error('Error fetching prospect:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/sales/prospects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchProspect();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const addInteraction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/sales/prospects/${params.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.get('type'),
          notes: formData.get('notes'),
          outcome: formData.get('outcome'),
          channel: formData.get('channel'),
          duration: formData.get('duration')
        })
      });

      if (response.ok) {
        setShowInteractionForm(false);
        fetchProspect();
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error adding interaction:', error);
    }
  };

  const addTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/sales/prospects/${params.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          dueDate: formData.get('dueDate'),
          priority: formData.get('priority')
        })
      });

      if (response.ok) {
        setShowTaskForm(false);
        fetchProspect();
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    const completedAt = newStatus === 'DONE' ? new Date().toISOString() : null;
    
    try {
      const response = await fetch(`/api/sales/prospects/${params.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, completedAt })
      });

      if (response.ok) {
        fetchProspect();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const addNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/sales/prospects/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.get('content'),
          isPinned: formData.get('isPinned') === 'on'
        })
      });

      if (response.ok) {
        setShowNoteForm(false);
        fetchProspect();
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const toggleNotePin = async (noteId: string, currentPinned: boolean) => {
    try {
      const response = await fetch(`/api/sales/prospects/${params.id}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinned })
      });

      if (response.ok) {
        fetchProspect();
      }
    } catch (error) {
      console.error('Error toggling note pin:', error);
    }
  };

  const convertToWorkshop = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!confirm('Möchten Sie diesen Prospect wirklich zu einer Werkstatt konvertieren?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sales/prospects/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Erfolgreich konvertiert! Werkstatt ID: ${data.workshop.id}`);
        setShowConvertForm(false);
        fetchProspect();
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
      }
    } catch (error) {
      console.error('Error converting prospect:', error);
      alert('Fehler beim Konvertieren');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!prospect) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <Link
                  href="/sales/prospects"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{prospect.name}</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {prospect.city}, {prospect.postalCode}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 text-sm rounded-full ${statusColors[prospect.status]}`}>
                  {statusLabels[prospect.status]}
                </span>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Lead Score:</span>
                  <span className={`font-semibold ${
                    prospect.leadScore >= 75 ? 'text-green-600' :
                    prospect.leadScore >= 50 ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {prospect.leadScore}
                  </span>
                </div>

                {prospect.rating && (
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-sm text-gray-600">
                      {prospect.rating} ({prospect.reviewCount} Bewertungen)
                    </span>
                  </div>
                )}

                {prospect.assignedTo && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {prospect.assignedTo.firstName} {prospect.assignedTo.lastName}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!prospect.convertedToWorkshop && prospect.status !== 'WON' && (
                <button
                  onClick={() => setShowConvertForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Zu Werkstatt konvertieren
                </button>
              )}

              {prospect.convertedToWorkshop && (
                <Link
                  href={`/admin/workshops?id=${prospect.convertedToWorkshop.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Werkstatt anzeigen →
                </Link>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'interactions', 'tasks', 'notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab === 'overview' && 'Übersicht'}
                  {tab === 'interactions' && `Interaktionen (${prospect.interactions.length})`}
                  {tab === 'tasks' && `Aufgaben (${prospect.tasks.filter(t => t.status !== 'DONE').length})`}
                  {tab === 'notes' && `Notizen (${prospect.notes.length})`}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Contact info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontaktinformationen</h2>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prospect.address}</dd>
                  </div>
                  {prospect.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={`tel:${prospect.phone}`} className="text-primary-600 hover:underline">
                          {prospect.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {prospect.website && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Website</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          {prospect.website}
                        </a>
                      </dd>
                    </div>
                  )}
                  {prospect.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={`mailto:${prospect.email}`} className="text-primary-600 hover:underline">
                          {prospect.email}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>

                {prospect.photoUrls.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Fotos</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {prospect.photoUrls.slice(0, 6).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`${prospect.name} ${idx + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Change */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status ändern</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(key)}
                      disabled={prospect.status === key}
                      className={`px-3 py-2 text-sm rounded ${
                        prospect.status === key
                          ? `${statusColors[key]} cursor-not-allowed`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column - Activity summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivität</h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-gray-500">Letzter Kontakt</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {prospect.lastContactDate 
                        ? new Date(prospect.lastContactDate).toLocaleDateString('de-DE')
                        : 'Noch kein Kontakt'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Nächster Follow-up</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {prospect.nextFollowUpDate 
                        ? new Date(prospect.nextFollowUpDate).toLocaleDateString('de-DE')
                        : 'Nicht geplant'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Interaktionen</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {prospect.interactions.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Offene Aufgaben</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {prospect.tasks.filter(t => t.status !== 'DONE').length}
                    </dd>
                  </div>
                  {prospect.estimatedRevenue && (
                    <div>
                      <dt className="text-sm text-gray-500">Geschätzter Umsatz</dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        €{prospect.estimatedRevenue.toLocaleString('de-DE')}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Recent interactions */}
              {prospect.interactions.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Interaktionen</h2>
                  <div className="space-y-3">
                    {prospect.interactions.slice(0, 5).map((interaction) => (
                      <div key={interaction.id} className="flex items-start space-x-3 text-sm">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-600"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {interactionTypeLabels[interaction.type]}
                          </p>
                          <p className="text-gray-600 line-clamp-2">{interaction.notes}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(interaction.createdAt).toLocaleDateString('de-DE')} - {interaction.createdBy.firstName} {interaction.createdBy.lastName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === 'interactions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Interaktionen</h2>
              <button
                onClick={() => setShowInteractionForm(!showInteractionForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Neue Interaktion
              </button>
            </div>

            {showInteractionForm && (
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <form onSubmit={addInteraction} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Typ *
                      </label>
                      <select
                        name="type"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="CALL">Telefonat</option>
                        <option value="EMAIL">E-Mail</option>
                        <option value="MEETING">Meeting</option>
                        <option value="DEMO">Demo</option>
                        <option value="NOTE">Notiz</option>
                        <option value="PROPOSAL">Angebot</option>
                        <option value="FOLLOW_UP">Follow-up</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kanal
                      </label>
                      <select
                        name="channel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Nicht angegeben</option>
                        <option value="PHONE">Telefon</option>
                        <option value="EMAIL">E-Mail</option>
                        <option value="IN_PERSON">Persönlich</option>
                        <option value="VIDEO">Video</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="LINKEDIN">LinkedIn</option>
                        <option value="WEBSITE">Website</option>
                        <option value="SYSTEM">System</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notizen *
                    </label>
                    <textarea
                      name="notes"
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Gesprächsnotizen, Details, nächste Schritte..."
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ergebnis
                      </label>
                      <select
                        name="outcome"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Nicht angegeben</option>
                        <option value="SUCCESS">Erfolgreich</option>
                        <option value="NO_ANSWER">Keine Antwort</option>
                        <option value="CALLBACK_REQUESTED">Rückruf gewünscht</option>
                        <option value="NOT_INTERESTED">Kein Interesse</option>
                        <option value="SCHEDULED">Termin vereinbart</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dauer (Minuten)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowInteractionForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="p-6">
              {prospect.interactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Noch keine Interaktionen</p>
              ) : (
                <div className="space-y-6">
                  {prospect.interactions.map((interaction) => (
                    <div key={interaction.id} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {interaction.createdBy.firstName[0]}{interaction.createdBy.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">
                              {interaction.createdBy.firstName} {interaction.createdBy.lastName}
                            </span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-sm text-gray-500">
                              {interactionTypeLabels[interaction.type]}
                            </span>
                            {interaction.channel && (
                              <>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-sm text-gray-500">{interaction.channel}</span>
                              </>
                            )}
                          </div>
                          <span className="text-sm text-gray-400">
                            {new Date(interaction.createdAt).toLocaleString('de-DE')}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{interaction.notes}</p>
                        {(interaction.outcome || interaction.duration) && (
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            {interaction.outcome && (
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                {interaction.outcome}
                              </span>
                            )}
                            {interaction.duration && (
                              <span>{interaction.duration} Min.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Aufgaben</h2>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Neue Aufgabe
              </button>
            </div>

            {showTaskForm && (
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <form onSubmit={addTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titel *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. Angebot vorbereiten"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschreibung
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Details zur Aufgabe..."
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fälligkeitsdatum *
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priorität
                      </label>
                      <select
                        name="priority"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="LOW">Niedrig</option>
                        <option value="MEDIUM" selected>Mittel</option>
                        <option value="HIGH">Hoch</option>
                        <option value="URGENT">Dringend</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="p-6">
              {prospect.tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Noch keine Aufgaben</p>
              ) : (
                <div className="space-y-3">
                  {prospect.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg ${
                        task.status === 'DONE' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={task.status === 'DONE'}
                          onChange={() => toggleTaskStatus(task.id, task.status)}
                          className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-medium ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                              task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                              task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                          )}
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}</span>
                            {task.assignedTo && (
                              <span>
                                Zugewiesen: {task.assignedTo.firstName} {task.assignedTo.lastName}
                              </span>
                            )}
                            {task.completedAt && (
                              <span className="text-green-600">
                                ✓ Erledigt am {new Date(task.completedAt).toLocaleDateString('de-DE')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Notizen</h2>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Neue Notiz
              </button>
            </div>

            {showNoteForm && (
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <form onSubmit={addNote} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notiz *
                    </label>
                    <textarea
                      name="content"
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ihre Notiz..."
                    ></textarea>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPinned"
                      id="isPinned"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPinned" className="ml-2 text-sm text-gray-700">
                      Notiz oben anpinnen
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNoteForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="p-6">
              {prospect.notes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Noch keine Notizen</p>
              ) : (
                <div className="space-y-4">
                  {prospect.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-lg ${
                        note.isPinned ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {note.isPinned && (
                              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78-.03 1.631.495 2.16.524.528 1.325.774 2.105.534L10 13.75l-5-3.476z" />
                              </svg>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {note.createdBy.firstName} {note.createdBy.lastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleString('de-DE')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        </div>
                        <button
                          onClick={() => toggleNotePin(note.id, note.isPinned)}
                          className="ml-4 text-gray-400 hover:text-yellow-600"
                          title={note.isPinned ? 'Loslösen' : 'Anpinnen'}
                        >
                          <svg className="h-5 w-5" fill={note.isPinned ? 'currentColor' : 'none'} viewBox="0 0 20 20" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-3-5 3V5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Convert Modal */}
        {showConvertForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Zu Werkstatt konvertieren
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Erstellen Sie einen Werkstatt-Account für {prospect.name}
                </p>

                <form onSubmit={convertToWorkshop} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-Mail Adresse *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      defaultValue={prospect.email || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="werkstatt@beispiel.de"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initiales Passwort *
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Mindestens 8 Zeichen"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Die Werkstatt erhält eine E-Mail mit Zugangsdaten
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Übertragene Daten:</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Name: {prospect.name}</li>
                      <li>• Adresse: {prospect.address}, {prospect.postalCode} {prospect.city}</li>
                      {prospect.phone && <li>• Telefon: {prospect.phone}</li>}
                      {prospect.website && <li>• Website: {prospect.website}</li>}
                    </ul>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowConvertForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Jetzt konvertieren
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
