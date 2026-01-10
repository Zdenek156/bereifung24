'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  Calculator,
  TrendingDown,
  BookOpen,
  FileText,
  Archive,
  CheckSquare,
  ArrowLeft,
} from 'lucide-react';

interface PreCheck {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  message: string;
}

interface YearEndStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  canProceed: boolean;
}

export default function JahresabschlussPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [preChecks, setPreChecks] = useState<PreCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear() - 1);
  const [steps, setSteps] = useState<YearEndStep[]>([
    {
      id: 1,
      title: 'Vorprüfungen',
      description: 'Alle Voraussetzungen prüfen',
      icon: CheckSquare,
      completed: false,
      canProceed: true,
    },
    {
      id: 2,
      title: 'Kontenabstimmung',
      description: 'Alle Konten abstimmen und Unstimmigkeiten beheben',
      icon: Calculator,
      completed: false,
      canProceed: false,
    },
    {
      id: 3,
      title: 'Abschreibungen',
      description: 'Finale Abschreibungen für das Jahr berechnen',
      icon: TrendingDown,
      completed: false,
      canProceed: false,
    },
    {
      id: 4,
      title: 'Rückstellungen',
      description: 'Alle Rückstellungen prüfen und anpassen',
      icon: BookOpen,
      completed: false,
      canProceed: false,
    },
    {
      id: 5,
      title: 'Berichte erstellen',
      description: 'GuV, Bilanz und weitere Berichte generieren',
      icon: FileText,
      completed: false,
      canProceed: false,
    },
    {
      id: 6,
      title: 'Periode abschließen',
      description: 'Geschäftsjahr für weitere Änderungen sperren',
      icon: Archive,
      completed: false,
      canProceed: false,
    },
    {
      id: 7,
      title: 'Abgeschlossen',
      description: 'Jahresabschluss erfolgreich durchgeführt',
      icon: CheckCircle2,
      completed: false,
      canProceed: false,
    },
  ]);

  const [step2Data, setStep2Data] = useState({
    bankReconciled: false,
    arReconciled: false,
    apReconciled: false,
    inventoryReconciled: false,
  });

  const [step3Data, setStep3Data] = useState({
    depreciationRun: false,
    assetsReviewed: false,
  });

  const [step4Data, setStep4Data] = useState({
    provisionsReviewed: false,
    adjustmentsMade: false,
  });

  useEffect(() => {
    if (currentStep === 1) {
      runPreChecks();
    }
  }, [currentStep]);

  const runPreChecks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/accounting/year-end/pre-checks?year=${fiscalYear}`);
      const data = await response.json();
      setPreChecks(Array.isArray(data) ? data : []);
      
      // Allow to proceed if no critical errors (failed status)
      const hasCriticalError = data.some((check: PreCheck) => check.status === 'failed');
      updateStepCompletion(1, !hasCriticalError);
    } catch (error) {
      console.error('Failed to run pre-checks:', error);
      setPreChecks([{
        id: 'error',
        title: 'Fehler bei Prüfungen',
        status: 'warning',
        message: 'Prüfungen konnten nicht durchgeführt werden. Sie können trotzdem fortfahren.'
      }]);
      updateStepCompletion(1, true); // Allow to proceed even on error
    } finally {
      setLoading(false);
    }
  };

  const updateStepCompletion = (stepId: number, completed: boolean) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          return { ...step, completed };
        }
        if (step.id === stepId + 1) {
          return { ...step, canProceed: completed };
        }
        return step;
      })
    );
  };

  const handleStep2Complete = async () => {
    const allChecked = Object.values(step2Data).every((v) => v);
    if (!allChecked) {
      alert('Bitte schließen Sie alle Abstimmungen ab');
      return;
    }

    try {
      await fetch(`/api/admin/accounting/year-end/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear }),
      });
      updateStepCompletion(2, true);
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to complete reconciliation:', error);
    }
  };

  const handleStep3Complete = async () => {
    const allChecked = Object.values(step3Data).every((v) => v);
    if (!allChecked) {
      alert('Bitte schließen Sie alle Abschreibungsaufgaben ab');
      return;
    }

    setLoading(true);
    try {
      await fetch(`/api/admin/accounting/year-end/depreciation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear }),
      });
      updateStepCompletion(3, true);
      setCurrentStep(4);
    } catch (error) {
      console.error('Failed to run depreciation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Complete = async () => {
    const allChecked = Object.values(step4Data).every((v) => v);
    if (!allChecked) {
      alert('Bitte schließen Sie alle Rückstellungsaufgaben ab');
      return;
    }

    updateStepCompletion(4, true);
    setCurrentStep(5);
  };

  const handleStep5Complete = async () => {
    setLoading(true);
    try {
      await fetch(`/api/admin/accounting/year-end/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear }),
      });
      updateStepCompletion(5, true);
      setCurrentStep(6);
    } catch (error) {
      console.error('Failed to generate reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStep6Complete = async () => {
    if (!confirm(`Geschäftsjahr ${fiscalYear} sperren? Dies kann nicht rückgängig gemacht werden.`)) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/accounting/year-end/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear }),
      });
      updateStepCompletion(6, true);
      setCurrentStep(7);
    } catch (error) {
      console.error('Failed to close period:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = (steps.filter((s) => s.completed).length / steps.length) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="fiscalYear">Geschäftsjahr</Label>
              <Select
                value={fiscalYear.toString()}
                onValueChange={(value) => setFiscalYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: new Date().getFullYear() - 2025 + 1 }, (_, i) => {
                    const currentYear = new Date().getFullYear()
                    return currentYear - i // Most recent year first
                  }).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">Prüfungen werden durchgeführt...</div>
            ) : (
              <div className="space-y-3">
                {preChecks.map((check) => (
                  <div key={check.id} className={`p-4 rounded-lg border ${
                    check.status === 'failed' ? 'bg-red-50 border-red-200' : 
                    check.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="font-medium mb-1">{check.title}</div>
                        <div className="text-sm text-muted-foreground">{check.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={runPreChecks} variant="outline" className="w-full">
              Prüfungen erneut durchführen
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stellen Sie sicher, dass alle Konten ordnungsgemäß abgestimmt sind, bevor Sie fortfahren.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bankReconciled"
                  checked={step2Data.bankReconciled}
                  onCheckedChange={(checked) =>
                    setStep2Data({ ...step2Data, bankReconciled: checked as boolean })
                  }
                />
                <Label htmlFor="bankReconciled">Bankkonten abgestimmt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="arReconciled"
                  checked={step2Data.arReconciled}
                  onCheckedChange={(checked) =>
                    setStep2Data({ ...step2Data, arReconciled: checked as boolean })
                  }
                />
                <Label htmlFor="arReconciled">Forderungen abgestimmt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apReconciled"
                  checked={step2Data.apReconciled}
                  onCheckedChange={(checked) =>
                    setStep2Data({ ...step2Data, apReconciled: checked as boolean })
                  }
                />
                <Label htmlFor="apReconciled">Verbindlichkeiten abgestimmt</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inventoryReconciled"
                  checked={step2Data.inventoryReconciled}
                  onCheckedChange={(checked) =>
                    setStep2Data({ ...step2Data, inventoryReconciled: checked as boolean })
                  }
                />
                <Label htmlFor="inventoryReconciled">Inventar abgestimmt</Label>
              </div>
            </div>
            <Button onClick={handleStep2Complete} className="w-full">
              Abstimmung abschließen
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Berechnen Sie die finalen Abschreibungen für alle Anlagen im Geschäftsjahr {fiscalYear}.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="depreciationRun"
                  checked={step3Data.depreciationRun}
                  onCheckedChange={(checked) =>
                    setStep3Data({ ...step3Data, depreciationRun: checked as boolean })
                  }
                />
                <Label htmlFor="depreciationRun">Abschreibungen für alle Anlagen berechnet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assetsReviewed"
                  checked={step3Data.assetsReviewed}
                  onCheckedChange={(checked) =>
                    setStep3Data({ ...step3Data, assetsReviewed: checked as boolean })
                  }
                />
                <Label htmlFor="assetsReviewed">Anlageverzeichnis geprüft und verifiziert</Label>
              </div>
            </div>
            <Button onClick={handleStep3Complete} className="w-full" disabled={loading}>
              {loading ? 'Wird verarbeitet...' : 'Abschreibungen abschließen'}
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Überprüfen Sie alle Rückstellungen und nehmen Sie notwendige Anpassungen vor.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="provisionsReviewed"
                  checked={step4Data.provisionsReviewed}
                  onCheckedChange={(checked) =>
                    setStep4Data({ ...step4Data, provisionsReviewed: checked as boolean })
                  }
                />
                <Label htmlFor="provisionsReviewed">Alle Rückstellungen geprüft</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjustmentsMade"
                  checked={step4Data.adjustmentsMade}
                  onCheckedChange={(checked) =>
                    setStep4Data({ ...step4Data, adjustmentsMade: checked as boolean })
                  }
                />
                <Label htmlFor="adjustmentsMade">Notwendige Anpassungen vorgenommen</Label>
              </div>
            </div>
            <Button onClick={handleStep4Complete} className="w-full">
              Rückstellungsprüfung abschließen
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Erstellen Sie alle erforderlichen Finanzberichte für das Geschäftsjahr {fiscalYear}.
            </p>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Gewinn- und Verlustrechnung</h4>
                <p className="text-sm text-muted-foreground">Zusammenfassung der Erlöse und Aufwendungen</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Bilanz</h4>
                <p className="text-sm text-muted-foreground">Aktiva, Passiva und Eigenkapital</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Kapitalflussrechnung</h4>
                <p className="text-sm text-muted-foreground">Cashflows während der Periode</p>
              </div>
            </div>
            <Button onClick={handleStep5Complete} className="w-full" disabled={loading}>
              {loading ? 'Wird generiert...' : 'Berichte erstellen'}
            </Button>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-800 mb-1">Warnung</div>
                  <div className="text-sm text-red-700">
                    Das Abschließen des Geschäftsjahres sperrt alle Transaktionen für das Jahr {fiscalYear}. Diese Aktion kann nicht rückgängig gemacht werden.
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p>✓ Alle Konten abgestimmt</p>
              <p>✓ Abschreibungen berechnet</p>
              <p>✓ Rückstellungen geprüft</p>
              <p>✓ Berichte erstellt</p>
            </div>
            <Button onClick={handleStep6Complete} className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading ? 'Wird abgeschlossen...' : 'Geschäftsjahr abschließen'}
            </Button>
          </div>
        );

      case 7:
        return (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold">Jahresabschluss abgeschlossen!</h3>
            <p className="text-muted-foreground">
              Geschäftsjahr {fiscalYear} wurde erfolgreich abgeschlossen.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Neuen Jahresabschluss starten
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" onClick={() => router.push('/admin/buchhaltung')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-3xl font-bold">Jahresabschluss Wizard</h1>
        </div>
        <p className="text-muted-foreground">Schritt-für-Schritt Jahresabschlussprozess</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Fortschritt</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-7 gap-2 mb-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                currentStep === step.id
                  ? 'border-primary bg-primary/5'
                  : step.completed
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
              onClick={() => step.canProceed && setCurrentStep(step.id)}
            >
              <Icon
                className={`h-6 w-6 mb-2 ${
                  currentStep === step.id
                    ? 'text-primary'
                    : step.completed
                    ? 'text-green-500'
                    : 'text-gray-400'
                }`}
              />
              <span className="text-xs text-center font-medium">{step.id}</span>
            </div>
          );
        })}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep - 1].icon, { className: 'h-5 w-5' })}
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
          disabled={currentStep === 7 || !steps[currentStep].canProceed}
        >
          Weiter
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
