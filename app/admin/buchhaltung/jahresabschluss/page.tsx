'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [preChecks, setPreChecks] = useState<PreCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear() - 1);
  const [steps, setSteps] = useState<YearEndStep[]>([
    {
      id: 1,
      title: 'Pre-Flight Checks',
      description: 'Verify all prerequisites are met',
      icon: CheckSquare,
      completed: false,
      canProceed: true,
    },
    {
      id: 2,
      title: 'Reconcile Accounts',
      description: 'Reconcile all accounts and fix discrepancies',
      icon: Calculator,
      completed: false,
      canProceed: false,
    },
    {
      id: 3,
      title: 'Run Depreciation',
      description: 'Calculate final depreciation for the year',
      icon: TrendingDown,
      completed: false,
      canProceed: false,
    },
    {
      id: 4,
      title: 'Review Provisions',
      description: 'Review and adjust all provisions',
      icon: BookOpen,
      completed: false,
      canProceed: false,
    },
    {
      id: 5,
      title: 'Generate Reports',
      description: 'Generate P&L, balance sheet, and other reports',
      icon: FileText,
      completed: false,
      canProceed: false,
    },
    {
      id: 6,
      title: 'Close Period',
      description: 'Lock the fiscal year for further changes',
      icon: Archive,
      completed: false,
      canProceed: false,
    },
    {
      id: 7,
      title: 'Complete',
      description: 'Year-end closing completed successfully',
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
      setPreChecks(data);
      
      const allPassed = data.every((check: PreCheck) => check.status === 'passed');
      updateStepCompletion(1, allPassed);
    } catch (error) {
      console.error('Failed to run pre-checks:', error);
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
      alert('Please complete all reconciliations');
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
      alert('Please complete all depreciation tasks');
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
      alert('Please complete all provision tasks');
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
    if (!confirm(`Lock fiscal year ${fiscalYear}? This cannot be undone.`)) return;

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
              <Label htmlFor="fiscalYear">Fiscal Year</Label>
              <Select
                value={fiscalYear.toString()}
                onValueChange={(value) => setFiscalYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022, 2021].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">Running pre-checks...</div>
            ) : (
              <div className="space-y-3">
                {preChecks.map((check) => (
                  <Alert key={check.id} variant={check.status === 'failed' ? 'destructive' : 'default'}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <AlertTitle>{check.title}</AlertTitle>
                        <AlertDescription>{check.message}</AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            <Button onClick={runPreChecks} variant="outline" className="w-full">
              Re-run Checks
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ensure all accounts are properly reconciled before proceeding.
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
                <Label htmlFor="bankReconciled">Bank accounts reconciled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="arReconciled"
                  checked={step2Data.arReconciled}
                  onCheckedChange={(checked) =>
                    setStep2Data({ ...step2Data, arReconciled: checked as boolean })
                  }
                />
                <Label htmlFor="arReconciled">Accounts receivable reconciled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apReconciled"
                  checked={step2Data.apReconciled}
                  onCheckedChange={(checked) =>
                    setStep2Data({ ...step2Data, apReconciled: checked as boolean })
                  }
                />
                <Label htmlFor="apReconciled">Accounts payable reconciled</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inventoryReconciled"
                  checked={step2Data.inventoryReconciled}
                  onCheckedChange={(checked) =>
                    setStep2Data({ ...step2Data, inventoryReconciled: checked as boolean })
                  }
                />
                <Label htmlFor="inventoryReconciled">Inventory reconciled</Label>
              </div>
            </div>
            <Button onClick={handleStep2Complete} className="w-full">
              Complete Reconciliation
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Calculate final depreciation for all assets in fiscal year {fiscalYear}.
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
                <Label htmlFor="depreciationRun">Depreciation calculated for all assets</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assetsReviewed"
                  checked={step3Data.assetsReviewed}
                  onCheckedChange={(checked) =>
                    setStep3Data({ ...step3Data, assetsReviewed: checked as boolean })
                  }
                />
                <Label htmlFor="assetsReviewed">Asset register reviewed and verified</Label>
              </div>
            </div>
            <Button onClick={handleStep3Complete} className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Complete Depreciation'}
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review all provisions and make necessary adjustments.
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
                <Label htmlFor="provisionsReviewed">All provisions reviewed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adjustmentsMade"
                  checked={step4Data.adjustmentsMade}
                  onCheckedChange={(checked) =>
                    setStep4Data({ ...step4Data, adjustmentsMade: checked as boolean })
                  }
                />
                <Label htmlFor="adjustmentsMade">Necessary adjustments made</Label>
              </div>
            </div>
            <Button onClick={handleStep4Complete} className="w-full">
              Complete Provisions Review
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate all required financial reports for fiscal year {fiscalYear}.
            </p>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Profit & Loss Statement</h4>
                <p className="text-sm text-muted-foreground">Income and expenses summary</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Balance Sheet</h4>
                <p className="text-sm text-muted-foreground">Assets, liabilities, and equity</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium">Cash Flow Statement</h4>
                <p className="text-sm text-muted-foreground">Cash movements during the period</p>
              </div>
            </div>
            <Button onClick={handleStep5Complete} className="w-full" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Reports'}
            </Button>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Closing the fiscal year will lock all transactions for year {fiscalYear}. This action cannot be
                undone.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 text-sm">
              <p>✓ All accounts reconciled</p>
              <p>✓ Depreciation calculated</p>
              <p>✓ Provisions reviewed</p>
              <p>✓ Reports generated</p>
            </div>
            <Button onClick={handleStep6Complete} className="w-full" variant="destructive" disabled={loading}>
              {loading ? 'Closing...' : 'Close Fiscal Year'}
            </Button>
          </div>
        );

      case 7:
        return (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold">Year-End Closing Complete!</h3>
            <p className="text-muted-foreground">
              Fiscal year {fiscalYear} has been successfully closed.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Start New Year-End Process
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
        <h1 className="text-3xl font-bold mb-2">Jahresabschluss Wizard</h1>
        <p className="text-muted-foreground">Step-by-step year-end closing process</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
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
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
          disabled={currentStep === 7 || !steps[currentStep].canProceed}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
