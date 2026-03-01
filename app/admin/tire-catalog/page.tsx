'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Upload, 
  Download,
  Loader2,
  FileText,
  RefreshCw,
  Calendar
} from 'lucide-react';

interface Supplier {
  id: string;
  code: string;
  name: string;
  csvDownloadUrl: string | null;
  csvFormat: string | null;
  lastCsvImport: string | null;
  csvImportedBy: string | null;
  apiEndpoint: string | null;
  apiEnabled: boolean;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ImportStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export default function TireCatalogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportStats | null>(null);
  
  // Catalog state
  const [catalogTires, setCatalogTires] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogStats, setCatalogStats] = useState<any>(null);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    csvDownloadUrl: '',
    csvFormat: 'TYRESYSTEM',
    apiEndpoint: '',
    description: '',
  });

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  // Load suppliers
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadSuppliers();
      loadCatalog();
    }
  }, [session]);

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const response = await fetch('/api/admin/tire-catalog?limit=100');
      if (response.ok) {
        const data = await response.json();
        
        // Use tires from response
        setCatalogTires(data.tires || []);
        
        // Use stats from database (not calculated client-side)
        setCatalogStats(data.stats || null);
        
        // Use lastSync from database
        if (data.lastSync) {
          setLastImportDate(data.lastSync);
        }
      }
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleManualUpdate = async () => {
    if (!confirm('Möchten Sie alle Reifenkataloge jetzt aktualisieren? Dies kann einige Minuten dauern.')) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/cron/update-tire-catalogs', {
        method: 'POST',
        headers: {
          'x-manual-trigger': 'true', // Special header for manual triggers
        },
      });

      if (response.ok || response.status === 202) {
        const result = await response.json();
        
        if (response.status === 202) {
          // Async import started
          alert(
            `${result.message}\n\n` +
            `Bitte warten Sie einige Minuten und laden Sie dann die Seite neu, um die aktualisierten Daten zu sehen.\n\n` +
            `Tipp: Klicken Sie auf "Neu laden" um den Fortschritt zu prüfen.`
          );
        } else {
          // Sync import completed
          alert(`Aktualisierung abgeschlossen!\n\nErfolgreich: ${result.summary?.success || 0}\nFehler: ${result.summary?.failed || 0}`);
        }
        
        // Reload data after a short delay
        setTimeout(() => {
          loadSuppliers();
          loadCatalog();
        }, 2000);
      } else {
        const error = await response.json();
        alert(`Fehler bei der Aktualisierung: ${error.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Error updating catalogs:', error);
      alert('Fehler bei der Aktualisierung. Bitte versuchen Sie es später erneut.');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCatalog = async () => {
    if (!confirm('Möchten Sie wirklich den gesamten Reifenkatalog löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/tire-catalog', {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Katalog erfolgreich geleert!\n\n${result.deleted} Einträge gelöscht.`);
        await loadCatalog();
      } else {
        const error = await response.json();
        alert(`Fehler beim Leeren des Katalogs: ${error.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('Error clearing catalog:', error);
      alert('Fehler beim Leeren des Katalogs. Bitte versuchen Sie es später erneut.');
    }
  };

  const handleCreateSupplier = async () => {
    try {
      const response = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadSuppliers();
        setShowSupplierDialog(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Failed to create supplier');
    }
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;

    try {
      const response = await fetch(`/api/admin/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadSuppliers();
        setEditingSupplier(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('Failed to update supplier');
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`Delete supplier "${supplier.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSuppliers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Failed to delete supplier');
    }
  };

  const handleImportCSV = async () => {
    if (!selectedSupplier || !csvContent) return;

    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/admin/tire-catalog/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierCode: selectedSupplier.code,
          csvContent,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setImportResult(result.stats);
        await loadSuppliers(); // Refresh to show last import timestamp
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      csvDownloadUrl: '',
      csvFormat: 'TYRESYSTEM',
      apiEndpoint: '',
      description: '',
    });
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      code: supplier.code,
      name: supplier.name,
      csvDownloadUrl: supplier.csvDownloadUrl || '',
      csvFormat: supplier.csvFormat || 'TYRESYSTEM',
      apiEndpoint: supplier.apiEndpoint || '',
      description: supplier.description || '',
    });
  };

  const openImportDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowImportDialog(true);
    setCsvContent('');
    setImportResult(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reifenkatalog-Verwaltung</h1>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Lieferanten und importieren Sie Reifenkataloge
        </p>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suppliers">Lieferanten</TabsTrigger>
          <TabsTrigger value="catalog">Katalog</TabsTrigger>
        </TabsList>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lieferanten</CardTitle>
                  <CardDescription>
                    Verwalten Sie Reifenlieferanten und deren CSV-Quellen
                  </CardDescription>
                </div>
                <Button onClick={() => setShowSupplierDialog(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Neuer Lieferant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>CSV-Link</TableHead>
                    <TableHead>Letzter Import</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Keine Lieferanten vorhanden. Erstellen Sie einen neuen Lieferanten.
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-mono">{supplier.code}</TableCell>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>
                          {supplier.csvDownloadUrl ? (
                            <a 
                              href={supplier.csvDownloadUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Link
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Nicht konfiguriert</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.lastCsvImport
                            ? new Date(supplier.lastCsvImport).toLocaleString('de-DE')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                            {supplier.isActive ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openImportDialog(supplier)}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSupplier(supplier)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reifenkatalog</CardTitle>
                  <CardDescription>
                    Übersicht aller importierten Reifen
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {lastImportDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                      <Calendar className="h-4 w-4" />
                      Zuletzt aktualisiert: {new Date(lastImportDate).toLocaleString('de-DE')}
                    </div>
                  )}
                  <Button
                    onClick={loadCatalog}
                    variant="outline"
                    disabled={catalogLoading}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${catalogLoading ? 'animate-spin' : ''}`} />
                    Neu laden
                  </Button>
                  <Button
                    onClick={handleClearCatalog}
                    variant="destructive"
                    disabled={catalogLoading || catalogTires.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Katalog leeren
                  </Button>
                  <Button
                    onClick={handleManualUpdate}
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aktualisiere...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Jetzt aktualisieren
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : catalogTires.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Kein Reifenkatalog vorhanden</h3>
                  <p className="text-muted-foreground mb-4">
                    Importieren Sie einen Reifenkatalog über den Tab "Lieferanten"
                  </p>
                  <Button onClick={() => document.querySelector<HTMLButtonElement>('[value="suppliers"]')?.click()}>
                    Zu Lieferanten
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Statistics */}
                  {catalogStats && (
                    <div className="grid grid-cols-4 gap-4">
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{catalogStats.total}</div>
                          <p className="text-sm text-muted-foreground">Reifen gesamt</p>
                        </CardContent>
                      </Card>
                      {Object.entries(catalogStats.bySupplier).map(([supplier, count]) => (
                        <Card key={supplier} className="bg-blue-50">
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{count as number}</div>
                            <p className="text-sm text-muted-foreground">{supplier}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {Object.entries(catalogStats.byVehicleType).map(([type, count]) => (
                        <Card key={type} className="bg-green-50">
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{count as number}</div>
                            <p className="text-sm text-muted-foreground">
                              {type === 'PKW' ? 'PKW' : type === 'MOTO' ? 'Motorrad' : type}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Tire Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Artikel-ID</TableHead>
                        <TableHead>EAN</TableHead>
                        <TableHead>Marke</TableHead>
                        <TableHead>Modell</TableHead>
                        <TableHead>Größe</TableHead>
                        <TableHead>Saison</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Eigenschaften</TableHead>
                        <TableHead>EU-Label</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catalogTires.slice(0, 100).map((tire) => (
                        <TableRow key={tire.id}>
                          <TableCell className="font-mono text-sm">{tire.articleId}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{tire.ean || '-'}</TableCell>
                          <TableCell className="font-medium">{tire.brand}</TableCell>
                          <TableCell>{tire.model}</TableCell>
                          <TableCell className="font-mono">
                            {tire.width}/{tire.height} R{tire.diameter}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tire.seasonLabel || 
                                (tire.season === 's' ? 'Sommer' : 
                                 tire.season === 'w' ? 'Winter' : 
                                 tire.season === 'g' ? 'Ganzjahr' : tire.season)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>
                              {tire.vehicleType === 'PKW' ? 'PKW' : 
                               tire.vehicleType === 'MOTO' ? 'Motorrad' : 
                               tire.vehicleType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {tire.runFlat && (
                                <Badge variant="secondary" className="text-xs">RF</Badge>
                              )}
                              {tire.threePMSF && (
                                <Badge variant="secondary" className="text-xs">❄️</Badge>
                              )}
                              {tire.loadIndex && (
                                <Badge variant="outline" className="text-xs">{tire.loadIndex}</Badge>
                              )}
                              {tire.speedIndex && (
                                <Badge variant="outline" className="text-xs">{tire.speedIndex}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(tire.labelFuelEfficiency || tire.labelWetGrip || tire.labelNoise) ? (
                              <div className="text-xs space-y-0.5">
                                {tire.labelFuelEfficiency && (
                                  <div>⛽ {tire.labelFuelEfficiency}</div>
                                )}
                                {tire.labelWetGrip && (
                                  <div>💧 {tire.labelWetGrip}</div>
                                )}
                                {tire.labelNoise && (
                                  <div>🔊 {tire.labelNoise}dB</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {catalogStats && catalogStats.total > 100 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... und {catalogStats.total - 100} weitere Reifen (insgesamt {catalogStats.total})
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Supplier Dialog */}
      <Dialog 
        open={showSupplierDialog || !!editingSupplier} 
        onOpenChange={(open) => {
          if (!open) {
            setShowSupplierDialog(false);
            setEditingSupplier(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? 'Aktualisieren Sie die Lieferanten-Informationen'
                : 'Erstellen Sie einen neuen Reifenlieferanten'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Lieferanten-Code *</Label>
                <Input
                  id="code"
                  placeholder="TYRESYSTEM"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={!!editingSupplier}
                />
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="TyreSystem GmbH"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="csvDownloadUrl">CSV-Download-Link</Label>
              <Input
                id="csvDownloadUrl"
                placeholder="https://example.com/catalog.csv"
                value={formData.csvDownloadUrl}
                onChange={(e) => setFormData({ ...formData, csvDownloadUrl: e.target.value })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                URL zum Herunterladen der CSV-Datei (optional, wenn manueller Upload)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="csvFormat">CSV-Format</Label>
                <Input
                  id="csvFormat"
                  value={formData.csvFormat}
                  onChange={(e) => setFormData({ ...formData, csvFormat: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="apiEndpoint">API-Endpoint (optional)</Label>
                <Input
                  id="apiEndpoint"
                  placeholder="https://api.example.com"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Notizen zum Lieferanten..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSupplierDialog(false);
                setEditingSupplier(null);
                resetForm();
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
              disabled={!formData.code || !formData.name}
            >
              {editingSupplier ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CSV-Import: {selectedSupplier?.name}</DialogTitle>
            <DialogDescription>
              Laden Sie eine CSV-Datei hoch oder fügen Sie den Inhalt direkt ein
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSupplier?.csvDownloadUrl && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Konfigurierter Download-Link:</p>
                    <a 
                      href={selectedSupplier.csvDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedSupplier.csvDownloadUrl}
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedSupplier.csvDownloadUrl!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Herunterladen
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="csv-file">CSV-Datei hochladen</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>

            <div>
              <Label htmlFor="csv-content">Oder CSV-Inhalt direkt eingeben</Label>
              <Textarea
                id="csv-content"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="ArticleId,Brand,Model,Width,Height,Diameter,Season..."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {csvContent ? `${csvContent.split('\n').length} Zeilen` : 'Keine Daten'}
              </p>
            </div>

            {importResult && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Import-Ergebnis
                </h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Gesamt</p>
                    <p className="text-2xl font-bold">{importResult.total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Importiert</p>
                    <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Aktualisiert</p>
                    <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Übersprungen</p>
                    <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">
                      Fehler ({importResult.errors.length}):
                    </p>
                    <div className="bg-red-50 p-2 rounded text-xs max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, i) => (
                        <div key={i} className="text-red-700">{error}</div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <div className="text-red-600 mt-1">
                          ... und {importResult.errors.length - 10} weitere Fehler
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setCsvContent('');
                setImportResult(null);
              }}
            >
              Schließen
            </Button>
            <Button
              onClick={handleImportCSV}
              disabled={!csvContent || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importiere...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import starten
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
