'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Mail, FileText, Calendar, Building2, Euro } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  workshop: {
    id: string
    name: string
    street?: string
    zip?: string
    city?: string
    email?: string
    phone?: string
  }
  periodStart: string
  periodEnd: string
  lineItems: any[]
  subtotal: number
  vatAmount: number
  totalAmount: number
  status: string
  sentAt?: string
  paidAt?: string
  dueDate?: string
  pdfUrl?: string
  sepaPaymentId?: string
  sepaStatus?: string
  notes?: string
  createdAt: string
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/admin/invoices/${params.id}`)
      if (response.ok) {
        const result = await response.json()
        setInvoice(result.data)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePdf = async () => {
    if (!invoice) return
    
    setGenerating(true)
    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}/generate-pdf`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        setInvoice({ ...invoice, pdfUrl: result.data.pdfUrl })
        alert('PDF erfolgreich generiert!')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Fehler beim Generieren des PDFs')
    } finally {
      setGenerating(false)
    }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-DE')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-500'
    }
    const labels = {
      DRAFT: 'Entwurf',
      SENT: 'Versendet',
      PAID: 'Bezahlt',
      OVERDUE: 'Überfällig',
      CANCELLED: 'Storniert'
    }
    return (
      <span className={`px-3 py-1 rounded text-sm font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Rechnung...</div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Rechnung nicht gefunden</h2>
          <Link href="/admin/invoices">
            <Button>Zurück zur Übersicht</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Rechnung {invoice.invoiceNumber}</h1>
          {getStatusBadge(invoice.status)}
        </div>
        <div className="flex gap-3">
          {!invoice.pdfUrl && (
            <Button
              onClick={handleGeneratePdf}
              disabled={generating}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? 'Generiere...' : 'PDF generieren'}
            </Button>
          )}
          {invoice.pdfUrl && (
            <Button variant="outline" asChild>
              <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                PDF herunterladen
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Info */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rechnungsinformationen
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Rechnungsnummer</div>
                <div className="font-mono font-semibold">{invoice.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Erstellt am</div>
                <div className="font-semibold">{formatDate(invoice.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Leistungszeitraum</div>
                <div className="font-semibold">
                  {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Fällig am</div>
                <div className="font-semibold">{formatDate(invoice.dueDate)}</div>
              </div>
              {invoice.sentAt && (
                <div>
                  <div className="text-sm text-gray-600">Versendet am</div>
                  <div className="font-semibold">{formatDate(invoice.sentAt)}</div>
                </div>
              )}
              {invoice.paidAt && (
                <div>
                  <div className="text-sm text-gray-600">Bezahlt am</div>
                  <div className="font-semibold">{formatDate(invoice.paidAt)}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Line Items */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Rechnungspositionen
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2 text-sm font-semibold">Pos.</th>
                    <th className="pb-2 text-sm font-semibold">Beschreibung</th>
                    <th className="pb-2 text-sm font-semibold text-center">Menge</th>
                    <th className="pb-2 text-sm font-semibold text-right">Einzelpreis</th>
                    <th className="pb-2 text-sm font-semibold text-right">Gesamt</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.lineItems.map((item: any) => (
                    <tr key={item.position}>
                      <td className="py-3 text-sm">{item.position}</td>
                      <td className="py-3 text-sm">{item.description}</td>
                      <td className="py-3 text-sm text-center">{item.quantity}</td>
                      <td className="py-3 text-sm text-right font-mono">{formatEUR(item.unitPrice)}</td>
                      <td className="py-3 text-sm text-right font-mono font-semibold">{formatEUR(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2">
                  <tr>
                    <td colSpan={4} className="pt-3 text-sm font-semibold text-right">Nettobetrag:</td>
                    <td className="pt-3 text-sm text-right font-mono font-semibold">{formatEUR(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="py-1 text-sm font-semibold text-right">zzgl. 19% MwSt:</td>
                    <td className="py-1 text-sm text-right font-mono font-semibold">{formatEUR(invoice.vatAmount)}</td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan={4} className="pt-2 text-base font-bold text-right">Gesamtbetrag:</td>
                    <td className="pt-2 text-base text-right font-mono font-bold text-blue-600">{formatEUR(invoice.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {invoice.notes && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold mb-2">Hinweise</h3>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workshop Info */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Werkstatt
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Name</div>
                <div className="font-semibold">{invoice.workshop.name}</div>
              </div>
              {invoice.workshop.street && (
                <div>
                  <div className="text-sm text-gray-600">Adresse</div>
                  <div className="text-sm">
                    {invoice.workshop.street}<br />
                    {invoice.workshop.zip} {invoice.workshop.city}
                  </div>
                </div>
              )}
              {invoice.workshop.email && (
                <div>
                  <div className="text-sm text-gray-600">E-Mail</div>
                  <div className="text-sm">{invoice.workshop.user?.email || '-'}</div>
                </div>
              )}
              {invoice.workshop.user?.phone && (
                <div>
                  <div className="text-sm text-gray-600">Telefon</div>
                  <div className="text-sm">{invoice.workshop.user.phone}</div>
                </div>
              )}
            </div>
          </Card>

          {/* SEPA Info */}
          {invoice.sepaPaymentId && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">SEPA-Lastschrift</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Payment ID</div>
                  <div className="text-sm font-mono">{invoice.sepaPaymentId}</div>
                </div>
                {invoice.sepaStatus && (
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="text-sm font-semibold">{invoice.sepaStatus}</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* PDF Preview */}
          {invoice.pdfUrl && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">PDF-Vorschau</h2>
              <div className="aspect-[3/4] bg-gray-100 rounded border flex items-center justify-center">
                <iframe
                  src={invoice.pdfUrl}
                  className="w-full h-full rounded"
                  title="PDF Preview"
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
