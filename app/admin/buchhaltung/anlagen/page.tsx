'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, TrendingDown } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  depreciationMethod: string;
  usefulLife: number;
  residualValue: number;
  currentValue: number;
  accumulatedDepreciation: number;
  status: 'active' | 'disposed' | 'fully_depreciated';
}

interface DepreciationSchedule {
  period: string;
  openingValue: number;
  depreciation: number;
  closingValue: number;
}

export default function AnlagenPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [schedule, setSchedule] = useState<DepreciationSchedule[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchaseDate: new Date(),
    purchasePrice: '',
    depreciationMethod: 'linear',
    usefulLife: '',
    residualValue: '0',
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/admin/accounting/assets');
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedAsset
        ? `/api/admin/accounting/assets/${selectedAsset.id}`
        : '/api/admin/accounting/assets';
      
      const response = await fetch(url, {
        method: selectedAsset ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice),
          usefulLife: parseInt(formData.usefulLife),
          residualValue: parseFloat(formData.residualValue),
        }),
      });

      if (response.ok) {
        await fetchAssets();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save asset:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      const response = await fetch(`/api/admin/accounting/assets/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchAssets();
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const viewSchedule = async (asset: Asset) => {
    try {
      const response = await fetch(`/api/admin/accounting/assets/${asset.id}/schedule`);
      const data = await response.json();
      setSchedule(data);
      setSelectedAsset(asset);
      setIsScheduleOpen(true);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    }
  };

  const runMonthlyDepreciation = async () => {
    if (!confirm('Run monthly depreciation for all active assets?')) return;
    
    try {
      const response = await fetch('/api/admin/accounting/assets/depreciation/run', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchAssets();
        alert('Monthly depreciation completed successfully');
      }
    } catch (error) {
      console.error('Failed to run depreciation:', error);
    }
  };

  const openModal = (asset?: Asset) => {
    if (asset) {
      setSelectedAsset(asset);
      setFormData({
        name: asset.name,
        category: asset.category,
        purchaseDate: new Date(asset.purchaseDate),
        purchasePrice: asset.purchasePrice.toString(),
        depreciationMethod: asset.depreciationMethod,
        usefulLife: asset.usefulLife.toString(),
        residualValue: asset.residualValue.toString(),
      });
    } else {
      setSelectedAsset(null);
      setFormData({
        name: '',
        category: '',
        purchaseDate: new Date(),
        purchasePrice: '',
        depreciationMethod: 'linear',
        usefulLife: '',
        residualValue: '0',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Anlagenverwaltung</h1>
        <div className="space-x-2">
          <Button onClick={runMonthlyDepreciation} variant="outline">
            <TrendingDown className="mr-2 h-4 w-4" />
            Run Monthly Depreciation
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Acc. Depreciation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>{asset.category}</TableCell>
                  <TableCell>{format(new Date(asset.purchaseDate), 'dd.MM.yyyy')}</TableCell>
                  <TableCell className="text-right">€{asset.purchasePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">€{asset.currentValue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">€{asset.accumulatedDepreciation.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => viewSchedule(asset)}>
                        Schedule
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openModal(asset)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(asset.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="buildings">Buildings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate.toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: new Date(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price (€)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="depreciationMethod">Depreciation Method</Label>
                  <Select
                    value={formData.depreciationMethod}
                    onValueChange={(value) => setFormData({ ...formData, depreciationMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="declining">Declining Balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="usefulLife">Useful Life (Years)</Label>
                  <Input
                    id="usefulLife"
                    type="number"
                    value={formData.usefulLife}
                    onChange={(e) => setFormData({ ...formData, usefulLife: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="residualValue">Residual Value (€)</Label>
                  <Input
                    id="residualValue"
                    type="number"
                    step="0.01"
                    value={formData.residualValue}
                    onChange={(e) => setFormData({ ...formData, residualValue: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedAsset ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Depreciation Schedule Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Depreciation Schedule - {selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Opening Value</TableHead>
                  <TableHead className="text-right">Depreciation</TableHead>
                  <TableHead className="text-right">Closing Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.period}</TableCell>
                    <TableCell className="text-right">€{entry.openingValue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">€{entry.depreciation.toFixed(2)}</TableCell>
                    <TableCell className="text-right">€{entry.closingValue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
