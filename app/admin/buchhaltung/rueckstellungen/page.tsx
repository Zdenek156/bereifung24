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
import { Plus, BookOpen, XCircle, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Provision {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: 'pending' | 'booked' | 'released';
  createdAt: string;
  bookedAt?: string;
  releasedAt?: string;
  fiscalYear: number;
}

interface ProvisionTotals {
  type: string;
  total: number;
}

const PROVISION_TYPES = [
  { value: 'warranties', label: 'Warranties & Guarantees' },
  { value: 'legal', label: 'Legal Costs' },
  { value: 'tax', label: 'Tax Provisions' },
  { value: 'pensions', label: 'Pensions' },
  { value: 'restructuring', label: 'Restructuring' },
  { value: 'onerous', label: 'Onerous Contracts' },
  { value: 'other', label: 'Other' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function RueckstellungenPage() {
  const [provisions, setProvisions] = useState<Provision[]>([]);
  const [totals, setTotals] = useState<ProvisionTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    amount: '',
    fiscalYear: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchProvisions();
    fetchTotals();
  }, []);

  const fetchProvisions = async () => {
    try {
      const response = await fetch('/api/admin/accounting/provisions');
      const data = await response.json();
      setProvisions(data);
    } catch (error) {
      console.error('Failed to fetch provisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotals = async () => {
    try {
      const response = await fetch('/api/admin/accounting/provisions/totals');
      const data = await response.json();
      setTotals(data);
    } catch (error) {
      console.error('Failed to fetch totals:', error);
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
      console.error('Failed to create provision:', error);
    }
  };

  const handleBook = async (id: string) => {
    if (!confirm('Book this provision to the accounts?')) return;
    
    try {
      const response = await fetch(`/api/admin/accounting/provisions/${id}/book`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchProvisions();
        await fetchTotals();
      }
    } catch (error) {
      console.error('Failed to book provision:', error);
    }
  };

  const handleRelease = async (id: string) => {
    if (!confirm('Release this provision?')) return;
    
    try {
      const response = await fetch(`/api/admin/accounting/provisions/${id}/release`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchProvisions();
        await fetchTotals();
      }
    } catch (error) {
      console.error('Failed to release provision:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      type: '',
      description: '',
      amount: '',
      fiscalYear: new Date().getFullYear(),
    });
  };

  const filteredProvisions = provisions.filter((provision) => {
    if (selectedType !== 'all' && provision.type !== selectedType) return false;
    if (selectedStatus !== 'all' && provision.status !== selectedStatus) return false;
    return true;
  });

  const totalAmount = filteredProvisions.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rückstellungen</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Provision
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Provisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{provisions.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {provisions.filter((p) => p.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {provisions.filter((p) => p.status === 'booked').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Released</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {provisions.filter((p) => p.status === 'released').length}
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
              Provisions by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={totals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="total" name="Amount">
                  {totals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PROVISION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="released">Released</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-lg font-semibold">
          Filtered Total: €{totalAmount.toFixed(2)}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Fiscal Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProvisions.map((provision) => (
                <TableRow key={provision.id}>
                  <TableCell className="font-medium">
                    {PROVISION_TYPES.find((t) => t.value === provision.type)?.label || provision.type}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{provision.description}</TableCell>
                  <TableCell className="text-right">€{provision.amount.toFixed(2)}</TableCell>
                  <TableCell>{provision.fiscalYear}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        provision.status === 'booked'
                          ? 'default'
                          : provision.status === 'pending'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {provision.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(provision.createdAt).toLocaleDateString('de-DE')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {provision.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => handleBook(provision.id)}>
                          <BookOpen className="h-4 w-4 mr-1" />
                          Book
                        </Button>
                      )}
                      {provision.status === 'booked' && (
                        <Button size="sm" variant="outline" onClick={() => handleRelease(provision.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Release
                        </Button>
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
            <DialogTitle>Create New Provision</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="type">Provision Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (€)</Label>
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
                  <Label htmlFor="fiscalYear">Fiscal Year</Label>
                  <Input
                    id="fiscalYear"
                    type="number"
                    value={formData.fiscalYear}
                    onChange={(e) => setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">Create Provision</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
