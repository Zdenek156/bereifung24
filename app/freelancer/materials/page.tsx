'use client'

import { useEffect, useState } from 'react'

interface Material {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileSize: number | null
  version: string
  lastDownloaded: string | null
  updatedAt: string
}

interface AffiliateLink {
  affiliateCode: string
  affiliateLink: string
  qrCodeUrl: string
}

const categoryLabels: Record<string, string> = {
  PRESENTATION: '📊 Präsentationen',
  ONE_PAGER: '📄 One-Pager',
  BROCHURE: '📖 Broschüren',
  EMAIL_TEMPLATE: '📧 E-Mail-Vorlagen',
  FAQ: '❓ FAQ',
}

const categoryIcons: Record<string, string> = {
  PRESENTATION: '📊',
  ONE_PAGER: '📄',
  BROCHURE: '📖',
  EMAIL_TEMPLATE: '📧',
  FAQ: '❓',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [affiliate, setAffiliate] = useState<AffiliateLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [matRes, affRes] = await Promise.all([
          fetch('/api/freelancer/materials'),
          fetch('/api/freelancer/affiliate-link'),
        ])
        if (matRes.ok) {
          const data = await matRes.json()
          setMaterials(data.materials)
        }
        if (affRes.ok) setAffiliate(await affRes.json())
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function downloadMaterial(materialId: string) {
    const res = await fetch(`/api/freelancer/materials/${materialId}/download`)
    if (res.ok) {
      const data = await res.json()
      window.open(data.fileUrl, '_blank')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  // Group materials by category
  const grouped = materials.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = []
    acc[m.category].push(m)
    return acc
  }, {} as Record<string, Material[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vertriebsmaterialien</h1>
        <p className="text-gray-500">Alles was du für deine Arbeit brauchst</p>
      </div>

      {/* Affiliate Link Card */}
      {affiliate && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-lg font-bold mb-2">🔗 Dein persönlicher Affiliate-Link</h2>
          <p className="text-blue-100 text-sm mb-4">Teile diesen Link mit Werkstätten. Jede Registrierung wird dir zugeordnet.</p>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3 mb-4">
            <input
              readOnly
              value={affiliate.affiliateLink}
              className="flex-1 bg-transparent text-white text-sm border-none outline-none"
            />
            <button
              onClick={() => copyToClipboard(affiliate.affiliateLink)}
              className="px-3 py-1 bg-white text-blue-700 rounded-md text-sm font-medium hover:bg-blue-50"
            >
              {copied ? '✓ Kopiert!' : 'Kopieren'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-blue-200">Affiliate-Code:</p>
              <p className="font-mono text-lg font-bold">{affiliate.affiliateCode}</p>
            </div>
            <div className="ml-auto">
              <a
                href={affiliate.qrCodeUrl}
                download={`B24-QR-${affiliate.affiliateCode}.png`}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 inline-flex items-center gap-2"
              >
                📱 QR-Code herunterladen
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Materials by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
          Noch keine Materialien verfügbar. Der Admin wird bald Dokumente bereitstellen.
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                {categoryLabels[category] || category}
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryIcons[m.category] || '📄'}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{m.title}</p>
                      {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>{m.fileName}</span>
                        {m.fileSize && <span>{formatFileSize(m.fileSize)}</span>}
                        <span>v{m.version}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadMaterial(m.id)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                  >
                    ⬇ Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
