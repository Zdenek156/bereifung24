'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Euro, 
  Calendar,
  Home,
  ArrowLeft,
  CheckCircle,
  Upload,
  Mail,
  Phone,
  User,
  FileText,
  Send
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
  contactPerson: string
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetterText: ''
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    // Scroll to application form if hash is present
    if (window.location.hash === '#bewerben') {
      setTimeout(() => {
        document.getElementById('bewerben')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [job])

  const fetchJob = async (id: string) => {
    try {
      const response = await fetch(`/api/public/jobs/${id}`)
      if (response.ok) {
        const result = await response.json()
        setJob(result.data)
      } else {
        router.push('/karriere')
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      router.push('/karriere')
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
    return `${range.min.toLocaleString('de-DE')} - ${range.max.toLocaleString('de-DE')} € pro Jahr`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse'
    }
    if (!cvFile) {
      newErrors.cv = 'Lebenslauf ist erforderlich'
    } else if (cvFile.size > 10 * 1024 * 1024) {
      newErrors.cv = 'Datei zu groß (max. 10 MB)'
    } else if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(cvFile.type)) {
      newErrors.cv = 'Nur PDF, DOC oder DOCX erlaubt'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0])
      if (errors.cv) {
        setErrors(prev => ({ ...prev, cv: '' }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !job) return

    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('jobPostingId', job.id)
      formDataToSend.append('firstName', formData.firstName)
      formDataToSend.append('lastName', formData.lastName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('coverLetterText', formData.coverLetterText)
      if (cvFile) {
        formDataToSend.append('cv', cvFile)
      }

      const response = await fetch('/api/public/jobs/apply', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        setSubmitted(true)
        // Scroll to success message
        setTimeout(() => {
          document.getElementById('success')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Absenden der Bewerbung')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Fehler beim Absenden der Bewerbung')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Lade Stellenangebot...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return null
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
            <div className="flex gap-3">
              <Link href="/karriere">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Alle Stellen
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Startseite
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Job Details */}
          <Card className="p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-primary-100 p-4 rounded-lg">
                <Briefcase className="h-8 w-8 text-primary-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{job.location}</span>
                    {job.remoteAllowed && (
                      <span className="text-green-600 font-medium">(Remote möglich)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{getEmploymentTypeLabel(job.employmentType)}</span>
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-5 w-5" />
                      <span>{formatSalary(job.salaryRange)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Stellenbeschreibung</h2>
              <div 
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>

            <div className="border-t pt-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Anforderungen</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {job.benefits.length > 0 && (
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Das bieten wir</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {job.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6 flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Veröffentlicht: {formatDate(job.publishedAt)}</span>
              </div>
              {job.applicationDeadline && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>Bewerbungsfrist: {formatDate(job.applicationDeadline)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Ansprechpartner: {job.contactPerson}</span>
              </div>
            </div>
          </Card>

          {/* Application Form */}
          <div id="bewerben">
            {submitted ? (
              <Card id="success" className="p-8 text-center bg-green-50 border-green-200">
                <div className="max-w-md mx-auto">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2 text-green-900">Bewerbung erfolgreich!</h2>
                  <p className="text-gray-700 mb-6">
                    Vielen Dank für Ihre Bewerbung auf die Position <strong>{job.title}</strong>. 
                    Wir haben Ihre Unterlagen erhalten und werden uns in Kürze bei Ihnen melden.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/karriere">
                      <Button>
                        Weitere Stellen ansehen
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline">
                        Zur Startseite
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Jetzt bewerben</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Vorname <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={`pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                          placeholder="Max"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nachname <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={`pl-10 ${errors.lastName ? 'border-red-500' : ''}`}
                          placeholder="Mustermann"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      E-Mail-Adresse <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="max.mustermann@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Telefonnummer
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10"
                        placeholder="+49 123 456789"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Lebenslauf (PDF, DOC, DOCX) <span className="text-red-500">*</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center ${errors.cv ? 'border-red-500' : 'border-gray-300'}`}>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-primary-600 hover:text-primary-700 font-medium">
                          Datei auswählen
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-sm text-gray-500 mt-1">oder per Drag & Drop (max. 10 MB)</p>
                      {cvFile && (
                        <p className="text-sm text-green-600 mt-2">
                          <FileText className="inline h-4 w-4 mr-1" />
                          {cvFile.name}
                        </p>
                      )}
                    </div>
                    {errors.cv && (
                      <p className="text-red-500 text-sm mt-1">{errors.cv}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Anschreiben (optional)
                    </label>
                    <Textarea
                      value={formData.coverLetterText}
                      onChange={(e) => setFormData({ ...formData, coverLetterText: e.target.value })}
                      rows={6}
                      placeholder="Warum möchten Sie bei uns arbeiten? Was macht Sie zum idealen Kandidaten?"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Mit dem Absenden Ihrer Bewerbung erklären Sie sich mit unserer{' '}
                      <Link href="/datenschutz" className="text-primary-600 hover:underline">
                        Datenschutzerklärung
                      </Link>{' '}
                      einverstanden.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      'Wird gesendet...'
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Bewerbung absenden
                      </>
                    )}
                  </Button>
                </form>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2026 Bereifung24. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}
