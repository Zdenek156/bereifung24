'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Euro, 
  Calendar,
  Home,
  ChevronRight,
  Users,
  TrendingUp,
  CheckCircle
} from 'lucide-react'

interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  description: string
  requirements: string[]
  benefits: string[]
  employmentType: string
  weeklyHours: number | null
  salaryRange: {
    min: number
    max: number
  } | null
  remoteAllowed: boolean
  applicationDeadline: string | null
  publishedAt: string
  applicationCount: number
}

export default function KarrierePage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/public/jobs', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const result = await response.json()
        setJobs(result.data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEmploymentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      FULLTIME_40H: 'Vollzeit (40h)',
      FULLTIME_37_5H: 'Vollzeit (37,5h)',
      FULLTIME_35H: 'Vollzeit (35h)',
      PARTTIME_30H: 'Teilzeit (30h)',
      PARTTIME_25H: 'Teilzeit (25h)',
      PARTTIME_20H: 'Teilzeit (20h)',
      PARTTIME_15H: 'Teilzeit (15h)',
      MINIJOB_603: 'Minijob (603€)',
      SHORTTERM_EMPLOYMENT: 'Kurzfristig'
    }
    return labels[type] || type
  }

  const formatSalary = (range: { min: number; max: number }) => {
    return `${range.min.toLocaleString('de-DE')} - ${range.max.toLocaleString('de-DE')} €/Jahr`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Lade Stellenangebote...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">B24</span>
              </div>
              <span className="text-2xl font-bold">Bereifung24</span>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Zur Startseite
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Werde Teil von Bereifung24
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              Wir revolutionieren den Reifenservice in Deutschland. Arbeite mit uns an der Zukunft der Mobilität!
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Users className="h-5 w-5" />
                <span>Tolles Team</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <TrendingUp className="h-5 w-5" />
                <span>Schnelles Wachstum</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Home className="h-5 w-5" />
                <span>Remote-Optionen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Offene Positionen</h2>
            <p className="text-gray-600">
              {jobs.length} {jobs.length === 1 ? 'offene Stelle' : 'offene Stellen'} verfügbar
            </p>
          </div>

          {jobs.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Keine offenen Stellen</h3>
                <p className="text-gray-600 mb-6">
                  Aktuell haben wir keine offenen Positionen. Schauen Sie bald wieder vorbei!
                </p>
                <Link href="/">
                  <Button>Zur Startseite</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6">
              {jobs.map(job => (
                <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-primary-100 p-3 rounded-lg">
                          <Briefcase className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                              {job.remoteAllowed && (
                                <span className="text-green-600 font-medium">(Remote möglich)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{getEmploymentTypeLabel(job.employmentType)}</span>
                            </div>
                            {job.salaryRange && (
                              <div className="flex items-center gap-1">
                                <Euro className="h-4 w-4" />
                                <span>{formatSalary(job.salaryRange)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div 
                        className="text-gray-700 mb-4 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                      />

                      {job.benefits.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {job.benefits.slice(0, 3).map((benefit, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {benefit}
                              </span>
                            ))}
                            {job.benefits.length > 3 && (
                              <span className="text-sm text-gray-500">
                                +{job.benefits.length - 3} weitere
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Veröffentlicht: {formatDate(job.publishedAt)}</span>
                        </div>
                        {job.applicationDeadline && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Clock className="h-4 w-4" />
                            <span>Bewerbungsfrist: {formatDate(job.applicationDeadline)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:w-48">
                      <Link href={`/karriere/${job.id}`}>
                        <Button className="w-full">
                          Details ansehen
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                      <Link href={`/karriere/${job.id}#bewerben`}>
                        <Button variant="outline" className="w-full">
                          Jetzt bewerben
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Warum Bereifung24?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Wachstum & Entwicklung</h3>
              <p className="text-gray-600">
                Wir sind ein schnell wachsendes Unternehmen mit vielen Entwicklungsmöglichkeiten.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Starkes Team</h3>
              <p className="text-gray-600">
                Arbeite mit motivierten Kollegen an spannenden Projekten in einem innovativen Umfeld.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Flexible Arbeitsmodelle</h3>
              <p className="text-gray-600">
                Remote-Arbeit, flexible Arbeitszeiten und moderne Tools für produktives Arbeiten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Bereifung24. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}
