'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Mail, Phone, FileText, Download, Check, X, Clock } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useRouter, useSearchParams } from 'next/navigation'

interface Application {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  coverLetter: string
  resumeUrl: string | null
  status: 'NEW' | 'REVIEWED' | 'INVITED' | 'REJECTED' | 'HIRED'
  notes: string | null
  jobPosting: {
    id: string
    title: string
    department: string
  }
  createdAt: string
  updatedAt: string
}

export default function BewerbungenPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  useEffect(() => {
    fetchApplications()
  }, [jobId, selectedStatus])

  const fetchApplications = async () => {
    try {
      let url = '/api/admin/hr/applications'
      const params = new URLSearchParams()
      if (jobId) params.append('jobId', jobId)
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus)
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      NEW: 'bg-blue-100 text-blue-800 border-blue-300',
      REVIEWED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      INVITED: 'bg-purple-100 text-purple-800 border-purple-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
      HIRED: 'bg-green-100 text-green-800 border-green-300'
    }
    const labels = {
      NEW: 'Neu',
      REVIEWED: 'In Prüfung',
      INVITED: 'Zum Gespräch',
      REJECTED: 'Abgelehnt',
      HIRED: 'Eingestellt'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/hr/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchApplications()
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Fehler beim Aktualisieren des Status')
    }
  }

  const handleDownloadResume = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `Lebenslauf_${name}.pdf`
    a.click()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Bewerbungen...</div>
        </div>
      </div>
    )
  }

  return (
    <PermissionGuard applicationKey="hr">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Bewerbungen</h1>
              <p className="text-gray-600 mt-1">Kandidaten verwalten & bewerten</p>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="ALL">Alle Status</option>
              <option value="NEW">Neu</option>
              <option value="REVIEWED">In Prüfung</option>
              <option value="INVITED">Zum Gespräch</option>
              <option value="HIRED">Eingestellt</option>
              <option value="REJECTED">Abgelehnt</option>
            </select>
            <div className="ml-auto text-sm text-gray-600">
              {applications.length} {applications.length === 1 ? 'Bewerbung' : 'Bewerbungen'}
            </div>
          </div>
        </Card>

        {/* Applications List */}
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map(app => (
              <Card key={app.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {app.firstName} {app.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Bewerbung für: {app.jobPosting.title}
                        </p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${app.email}`} className="hover:text-blue-600">
                          {app.email}
                        </a>
                      </div>
                      {app.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${app.phone}`} className="hover:text-blue-600">
                            {app.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Cover Letter Preview */}
                    <div className="bg-gray-50 p-4 rounded mb-4">
                      <p className="text-sm font-semibold mb-2">Anschreiben:</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{app.coverLetter}</p>
                    </div>

                    {app.notes && (
                      <div className="bg-yellow-50 p-4 rounded mb-4">
                        <p className="text-sm font-semibold mb-2">Notizen:</p>
                        <p className="text-sm text-gray-700">{app.notes}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Eingegangen am {new Date(app.createdAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {app.resumeUrl && (
                      <Button
                        onClick={() => handleDownloadResume(app.resumeUrl!, `${app.firstName}_${app.lastName}`)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Lebenslauf
                      </Button>
                    )}
                    
                    {app.status === 'NEW' && (
                      <>
                        <Button
                          onClick={() => handleStatusChange(app.id, 'REVIEWED')}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          In Prüfung
                        </Button>
                      </>
                    )}
                    
                    {(app.status === 'NEW' || app.status === 'REVIEWED') && (
                      <Button
                        onClick={() => handleStatusChange(app.id, 'INVITED')}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Zum Gespräch
                      </Button>
                    )}
                    
                    {(app.status === 'REVIEWED' || app.status === 'INVITED') && (
                      <>
                        <Button
                          onClick={() => {
                            if (confirm('Bewerbung wirklich annehmen?')) {
                              handleStatusChange(app.id, 'HIRED')
                            }
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Annehmen
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm('Bewerbung wirklich ablehnen?')) {
                              handleStatusChange(app.id, 'REJECTED')
                            }
                          }}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Ablehnen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold">Keine Bewerbungen</h2>
              <p className="text-gray-600">
                {selectedStatus !== 'ALL' 
                  ? `Es gibt keine Bewerbungen mit Status "${selectedStatus}".`
                  : jobId
                  ? 'Für diese Stelle sind noch keine Bewerbungen eingegangen.'
                  : 'Es sind noch keine Bewerbungen eingegangen.'
                }
              </p>
            </div>
          </Card>
        )}
      </div>
    </PermissionGuard>
  )
}
