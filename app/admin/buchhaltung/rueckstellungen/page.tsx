'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, XCircle, PieChart, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Provision {
  id: string;
  type: string;
  description: string;
  amount: number;
  released: boolean;
  releasedAt?: string;
  year: number;
  createdAt: string;
}

interface ProvisionTotals {
  type: string;
  total: number;
}

const PROVISION_TYPES = [
  { value: 'TAX', label: 'Steuerrückstellungen' },
  { value: 'VACATION', label: 'Urlaubsrückstellungen' },
  { value: 'WARRANTY', label: 'Gewährleistungsrückstellungen' },
  { value: 'LEGAL', label: 'Rechtliche Verpflichtungen' },
  { value: 'RESTRUCTURING', label: 'Restrukturierung' },
  { value: 'PENSION', label: 'Pensionsrückstellungen' },
  { value: 'OTHER', label: 'Sonstige' },
];

export default function RueckstellungenPage() {
  const router = useRouter();
  const [provisions, setProvisions] = useState<Provision[]>([]);
  const [totals, setTotals] = useState<ProvisionTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    amount: '',
    year: new Date().getFullYear(),
    reason: '',
  });

  useEffect(() => {
    fetchProvisions();
    fetchTotals();
  }, []);

  const fetchProvisions = async () => {
    try {
      const response = await fetch('/api/admin/accounting/provisions');
      const result = await response.json();
      if (result.success && result.data) {
        setProvisions(result.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Rückstellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotals = async () => {
    try {
      const response = await fetch('/api/admin/accounting/provisions/totals');
      const result = await response.json();
      if (result.success && result.data) {
        // Convert the totals object to an array format
        const totalsArray = Object.entries(result.data.totals).map(([type, total]) => ({
          type,
          total: total as number
        }));
        setTotals(totalsArray);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Summen:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/accounting/provisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (response.ok) {
        await fetchProvisions();
        await fetchTotals();
        closeModal();
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Rückstellung:', error);
    }
  };

  const handleRelease = async (id: string) => {
    if (!confirm('Rückstellung wirklich auflösen?')) return;
    
    try {
      const response = await fetch(`/api/admin/accounting/provisions/${id}/release`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchProvisions();
        await fetchTotals();
      }
    } catch (error) {
      console.error('Fehler beim Auflösen der Rückstellung:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Rückstellung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
    
    try {
      const response = await fetch(`/api/admin/accounting/provisions?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchProvisions();
        await fetchTotals();
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Rückstellung:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      type: '',
      description: '',
      amount: '',
      year: new Date().getFullYear(),
      reason: '',
    });
  };

  const filteredProvisions = provisions.filter((provision) => {
    if (selectedType !== 'all' && provision.type !== selectedType) return false;
    if (selectedYear !== 'all' && provision.year.toString() !== selectedYear) return false;
    return true;
  });

  const totalAmount = filteredProvisions.reduce((sum, p) => sum + p.amount, 0);

  // Unique years for filter
  const availableYears = Array.from(new Set(provisions.map(p => p.year))).sort((a, b) => b - a);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/buchhaltung')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-3xl font-bold">Rückstellungen</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Rückstellung anlegen
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt Rückstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(provisions.reduce((sum, p) => sum + p.amount, 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Rückstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {provisions.filter((p) => !p.released).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aufgelöste Rückstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {provisions.filter((p) => p.released).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {totals.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Rückstellungen nach Typ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {totals.map((item, index) => {
                const maxTotal = Math.max(...totals.map(t => t.total));
                const percentage = (item.total / maxTotal) * 100;
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-purple-500', 'bg-teal-500', 'bg-pink-500'];
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{PROVISION_TYPES.find(t => t.value === item.type)?.label || item.type}</span>
                      <span className="text-muted-foreground">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.total)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div className={`${colors[index % colors.length]} h-8 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium`} style={{ width: `${percentage}%` }}>
                        {percentage > 10 ? `${percentage.toFixed(0)}%` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Nach Typ filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            {PROVISION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Nach Jahr filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Jahre</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto text-lg font-semibold">
          Summe: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalAmount)}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Lädt...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead>Jahr</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProvisions.map((provision) => (
                <TableRow key={provision.id}>
                  <TableCell className="font-medium">
                    {PROVISION_TYPES.find((t) => t.value === provision.type)?.label || provision.type}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{provision.description}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(provision.amount)}</TableCell>
                  <TableCell>{provision.year}</TableCell>
                  <TableCell>
                    <Badge
                      variant={provision.released ? 'outline' : 'default'}
                    >
                      {provision.released ? 'Aufgelöst' : 'Aktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(provision.createdAt).toLocaleDateString('de-DE')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {!provision.released && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleRelease(provision.id)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Auflösen
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(provision.id)}>
                            Löschen
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neue Rückstellung anlegen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="type">Rückstellungstyp</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVISION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Beschreibung der Rückstellung"
                />
              </div>

              <div>
                <Label htmlFor="reason">Begründung (optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                  placeholder="Rechtliche oder wirtschaftliche Begründung"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Betrag (€)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Geschäftsjahr</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Abbrechen
              </Button>
              <Button type="submit">Rückstellung anlegen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
