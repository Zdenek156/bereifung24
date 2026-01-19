'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, Users, Eye, EyeOff, Plus, Pencil, Trash2 } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useRouter } from 'next/navigation'

interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'INTERN' | 'FREELANCE'
  salaryRange: string | null
  description: string
  requirements: string
  benefits: string | null
  isActive: boolean
  applicationCount: number
  createdAt: string
  updatedAt: string
}

export default function StellenausschreibungenPage() {
  const router = useRouter()
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    fetchJobPostings()
  }, [showInactive])

  const fetchJobPostings = async () => {
    try {
      const url = `/api/admin/hr/job-postings${showInactive ? '?includeInactive=true' : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setJobPostings(data)
      }
    } catch (error) {
      console.error('Error fetching job postings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEmploymentTypeLabel = (type: string): string => {
    const labels = {
      FULL_TIME: 'Vollzeit',
      PART_TIME: 'Teilzeit',
      INTERN: 'Praktikum',
      FREELANCE: 'Freelance'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getEmploymentTypeBadge = (type: string) => {
    const styles = {
      FULL_TIME: 'bg-green-100 text-green-800 border-green-300',
      PART_TIME: 'bg-blue-100 text-blue-800 border-blue-300',
      INTERN: 'bg-purple-100 text-purple-800 border-purple-300',
      FREELANCE: 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[type as keyof typeof styles]}`}>
        {getEmploymentTypeLabel(type)}
      </span>
    )
  }

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/admin/hr/job-postings/${id}/toggle`, {
        method: 'PATCH'
      })
      if (response.ok) {
        fetchJobPostings()
      }
    } catch (error) {
      console.error('Error toggling job posting:', error)
      alert('Fehler beim Ändern des Status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diese Stellenausschreibung wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/hr/job-postings/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchJobPostings()
      }
    } catch (error) {
      console.error('Error deleting job posting:', error)
      alert('Fehler beim Löschen')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Stellenausschreibungen...</div>
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
              <h1 className="text-3xl font-bold">Stellenausschreibungen</h1>
              <p className="text-gray-600 mt-1">Offene Positionen verwalten</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowInactive(!showInactive)}
              variant="outline"
            >
              {showInactive ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Nur aktive
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Alle anzeigen
                </>
              )}
            </Button>
            <Button
              onClick={() => router.push('/admin/hr/stellen/neu')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Stelle
            </Button>
          </div>
        </div>

        {/* Job Postings Grid */}
        {jobPostings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobPostings.map(job => (
              <Card key={job.id} className={`p-6 ${!job.isActive && 'opacity-60'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      {!job.isActive && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                          Inaktiv
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getEmploymentTypeBadge(job.employmentType)}
                      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-300">
                        {job.department}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <p><strong>Standort:</strong> {job.location}</p>
                  {job.salaryRange && (
                    <p><strong>Gehalt:</strong> {job.salaryRange}</p>
                  )}
                  <p className="line-clamp-3">{job.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{job.applicationCount} {job.applicationCount === 1 ? 'Bewerbung' : 'Bewerbungen'}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/admin/hr/bewerbungen?jobId=${job.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Bewerbungen
                    </Button>
                    <Button
                      onClick={() => handleToggleActive(job.id, job.isActive)}
                      variant="outline"
                      size="sm"
                    >
                      {job.isActive ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Deaktivieren
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Aktivieren
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => router.push(`/admin/hr/stellen/${job.id}/bearbeiten`)}
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(job.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl mb-4">💼</div>
              <h2 className="text-2xl font-bold">Keine Stellenausschreibungen</h2>
              <p className="text-gray-600">
                {showInactive 
                  ? 'Es sind keine Stellenausschreibungen vorhanden.'
                  : 'Es sind aktuell keine aktiven Stellenausschreibungen vorhanden.'
                }
              </p>
              <Button
                onClick={() => router.push('/admin/hr/stellen/neu')}
                className="mt-4"
              >
                Erste Stelle ausschreiben
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PermissionGuard>
  )
}
