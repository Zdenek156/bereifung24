'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, X } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useRouter } from 'next/navigation'

export default function NeueStelleErstellenPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    employmentType: 'FULL_TIME' as 'FULL_TIME' | 'PART_TIME' | 'INTERN' | 'FREELANCE',
    salaryRange: '',
    description: '',
    requirements: '',
    benefits: '',
    isActive: true // Default: Sofort veröffentlichen
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.department || !formData.location || !formData.description || !formData.requirements) {
      alert('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/hr/job-postings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Stellenausschreibung erfolgreich erstellt!')
        router.push('/admin/hr/stellen')
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Stelle konnte nicht erstellt werden'}`)
      }
    } catch (error) {
      console.error('Error creating job posting:', error)
      alert('Fehler beim Erstellen der Stellenausschreibung')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <PermissionGuard applicationKey="hr">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Neue Stelle ausschreiben</h1>
            <p className="text-gray-600 mt-1">Stellenausschreibung erstellen und veröffentlichen</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Grundinformationen</h2>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stellentitel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="z.B. Softwareentwickler (m/w/d)"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abteilung <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="z.B. IT, Vertrieb, HR"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standort <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="z.B. München, Remote"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschäftigungsart <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="FULL_TIME">Vollzeit</option>
                  <option value="PART_TIME">Teilzeit</option>
                  <option value="MINI_JOB">Minijob</option>
                  <option value="MIDI_JOB">Midijob</option>
                  <option value="INTERN">Praktikum</option>
                  <option value="APPRENTICE">Azubi</option>
                  <option value="WORKING_STUDENT">Werkstudent</option>
                  <option value="FREELANCE">Freelancer</option>
                  <option value="TEMPORARY">Zeitarbeit</option>
                </select>
              </div>

              {/* Salary Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gehaltsrahmen (optional)
                </label>
                <input
                  type="text"
                  value={formData.salaryRange}
                  onChange={(e) => handleChange('salaryRange', e.target.value)}
                  placeholder="z.B. 50.000 - 65.000 € p.a."
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Stellenbeschreibung</h2>
            
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Beschreiben Sie die Position und die Aufgaben..."
                  className="w-full border rounded px-3 py-2 min-h-[150px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Beschreiben Sie die Position, Verantwortlichkeiten und das Team
                </p>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anforderungen <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  placeholder="Listen Sie die erforderlichen Qualifikationen und Erfahrungen auf..."
                  className="w-full border rounded px-3 py-2 min-h-[150px]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Eine Anforderung pro Zeile (z.B. "- 3 Jahre Erfahrung mit React")
                </p>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benefits & Vorteile (optional)
                </label>
                <textarea
                  value={formData.benefits}
                  onChange={(e) => handleChange('benefits', e.target.value)}
                  placeholder="Was bieten wir? (z.B. flexible Arbeitszeiten, Weiterbildung, etc.)"
                  className="w-full border rounded px-3 py-2 min-h-[100px]"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Veröffentlichung</h2>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Sofort veröffentlichen und für Bewerbungen öffnen
              </label>
            </div>
            {!formData.isActive && (
              <p className="text-xs text-gray-500 mt-2">
                Die Stelle wird als Entwurf gespeichert und kann später aktiviert werden
              </p>
            )}
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => router.push('/admin/hr/stellen')}
              variant="outline"
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Erstelle...' : 'Stelle erstellen'}
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  )
}
