'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Save, Info, CheckCircle, XCircle, TrendingUp, Car, TreePine, Fuel, Euro, BarChart3, Plane } from 'lucide-react';
import BackButton from '@/components/BackButton';

interface CO2Settings {
  workshopsToCompare: number;
  // Durchschnittswerte (Fallback)
  co2PerKmCombustion: number;
  co2PerKmElectric: number;
  // Kraftstoffspezifische CO₂-Faktoren
  co2PerLiterPetrol: number;
  co2PerLiterDiesel: number;
  co2PerLiterLPG: number;
  co2PerKgCNG: number;
  co2PerKWhElectric: number;
  // Kraftstoffpreise
  petrolPricePerLiter: number;
  dieselPricePerLiter: number;
  lpgPricePerLiter: number;
  cngPricePerKg: number;
  electricPricePerKWh: number;
  // Legacy fields
  co2PerLiterFuel?: number;
  fuelPricePerLiter?: number;
}

export default function CO2TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [settings, setSettings] = useState<CO2Settings>({
    workshopsToCompare: 3,
    co2PerKmCombustion: 140,
    co2PerKmElectric: 50,
    co2PerLiterPetrol: 2320,
    co2PerLiterDiesel: 2640,
    co2PerLiterLPG: 1640,
    co2PerKgCNG: 1990,
    co2PerKWhElectric: 420,
    petrolPricePerLiter: 1.75,
    dieselPricePerLiter: 1.65,
    lpgPricePerLiter: 0.80,
    cngPricePerKg: 1.10,
    electricPricePerKWh: 0.35,
  });

  useEffect(() => {
    fetchSettings();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/co2-analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Analyse:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/co2-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/co2-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'CO₂-Einstellungen erfolgreich gespeichert!' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: 'Fehler beim Speichern der Einstellungen' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Fehler beim Speichern' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CO2Settings, value: string) => {
    setSettings({
      ...settings,
      [field]: parseFloat(value) || 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Einstellungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 p-3 rounded-lg">
            <Leaf className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CO₂-Tracking System</h1>
            <p className="text-gray-600">
              Konfigurieren Sie die Berechnungsparameter für CO₂-Einsparungen
            </p>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* CO₂-ANALYSE ÜBERSICHT                            */}
        {/* ══════════════════════════════════════════════════ */}
        {analyticsLoading ? (
          <div className="mb-8 p-8 bg-white rounded-xl border text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-3 text-gray-500 text-sm">Lade CO₂-Analyse...</p>
          </div>
        ) : analytics ? (
          <div className="mb-8 space-y-6">
            {/* Haupt-KPI Karten */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gesamt CO₂ eingespart */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">CO₂ eingespart</p>
                      <p className="text-3xl font-bold text-green-900">
                        {analytics.overview.totalCO2Kg >= 1000
                          ? `${(analytics.overview.totalCO2Kg / 1000).toFixed(1)} t`
                          : `${analytics.overview.totalCO2Kg.toFixed(1)} kg`}
                      </p>
                    </div>
                    <div className="bg-green-200 p-3 rounded-full">
                      <Leaf className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Anfragen: {analytics.overview.totalCO2FromRequestsKg.toFixed(1)} kg · Buchungen: {analytics.overview.totalCO2FromBookingsKg.toFixed(1)} kg
                  </p>
                </CardContent>
              </Card>

              {/* Kilometer eingespart */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Kilometer eingespart</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {analytics.overview.totalKmSaved >= 1000
                          ? `${(analytics.overview.totalKmSaved / 1000).toFixed(1)}k`
                          : analytics.overview.totalKmSaved.toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div className="bg-blue-200 p-3 rounded-full">
                      <Car className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    {analytics.overview.totalTripsAvoided} Fahrten vermieden
                  </p>
                </CardContent>
              </Card>

              {/* Kraftstoff eingespart */}
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700">Kraftstoff eingespart</p>
                      <p className="text-3xl font-bold text-amber-900">
                        {analytics.overview.fuelSavedLiters.toFixed(1)} L
                      </p>
                    </div>
                    <div className="bg-amber-200 p-3 rounded-full">
                      <Fuel className="h-6 w-6 text-amber-700" />
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    {analytics.overview.moneySaved.toFixed(2)} € gespart
                  </p>
                </CardContent>
              </Card>

              {/* Buchungen/Anfragen */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Buchungen & Anfragen</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {analytics.counts.directBookingsActive + analytics.counts.tireRequestsWithCO2}
                      </p>
                    </div>
                    <div className="bg-purple-200 p-3 rounded-full">
                      <BarChart3 className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    {analytics.counts.directBookingsActive} Buchungen · {analytics.counts.tireRequestsWithCO2} Anfragen
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Vergleichswerte */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Das entspricht...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TreePine className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900">{analytics.comparisons.equivalentTrees}</p>
                    <p className="text-xs text-green-700">Bäume pro Jahr</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{analytics.comparisons.equivalentCarKm.toLocaleString('de-DE')}</p>
                    <p className="text-xs text-blue-700">Auto-km vermieden</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Plane className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-900">{analytics.comparisons.equivalentFlights}</p>
                    <p className="text-xs text-orange-700">Flüge (FRA→PMI)</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Euro className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-900">{analytics.overview.moneySaved.toFixed(0)} €</p>
                    <p className="text-xs text-purple-700">Tankkosten gespart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monatlicher Trend */}
            {(analytics.monthlyTrend.length > 0 || analytics.monthlyBookings.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Monatlicher Verlauf (letzte 12 Monate)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Merge monthly data */}
                    {(() => {
                      const months = new Map<string, { co2Kg: number; requests: number; bookings: number }>();
                      analytics.monthlyTrend.forEach((m: any) => {
                        months.set(m.month, { co2Kg: m.co2Kg, requests: m.requests, bookings: 0 });
                      });
                      analytics.monthlyBookings.forEach((m: any) => {
                        const existing = months.get(m.month) || { co2Kg: 0, requests: 0, bookings: 0 };
                        months.set(m.month, { ...existing, bookings: m.bookings });
                      });
                      const sorted = Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0]));
                      const maxCO2 = Math.max(...sorted.map(([, v]) => v.co2Kg), 1);

                      return sorted.map(([month, data]) => {
                        const [y, m] = month.split('-');
                        const monthNames = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
                        const label = `${monthNames[parseInt(m)]} ${y.slice(2)}`;
                        const barWidth = Math.max((data.co2Kg / maxCO2) * 100, 2);
                        
                        return (
                          <div key={month} className="flex items-center gap-3 text-sm">
                            <span className="w-14 text-gray-600 text-right font-mono">{label}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                              <span className="absolute right-2 top-0.5 text-xs font-medium text-gray-700">
                                {data.co2Kg.toFixed(1)} kg
                              </span>
                            </div>
                            <span className="w-20 text-xs text-gray-500 text-right">
                              {data.requests + data.bookings} Vorgänge
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fahrzeug-Kraftstoffverteilung */}
            {analytics.fuelTypeDistribution.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-amber-600" />
                    Fahrzeug-Kraftstoffverteilung
                  </CardTitle>
                  <CardDescription>Registrierte Fahrzeuge nach Antriebsart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {analytics.fuelTypeDistribution.map((ft: any) => {
                      const labels: Record<string, string> = {
                        PETROL: 'Benzin', DIESEL: 'Diesel', ELECTRIC: 'Elektro',
                        HYBRID: 'Hybrid', PLUGIN_HYBRID: 'Plug-in Hybrid',
                        LPG: 'LPG', CNG: 'CNG',
                      };
                      const colors: Record<string, string> = {
                        PETROL: 'bg-red-100 text-red-800',
                        DIESEL: 'bg-gray-100 text-gray-800',
                        ELECTRIC: 'bg-green-100 text-green-800',
                        HYBRID: 'bg-blue-100 text-blue-800',
                        PLUGIN_HYBRID: 'bg-cyan-100 text-cyan-800',
                        LPG: 'bg-orange-100 text-orange-800',
                        CNG: 'bg-yellow-100 text-yellow-800',
                      };
                      return (
                        <div key={ft.fuelType} className={`p-3 rounded-lg ${colors[ft.fuelType] || 'bg-gray-100 text-gray-800'}`}>
                          <p className="text-2xl font-bold">{ft.count}</p>
                          <p className="text-xs font-medium">{labels[ft.fuelType] || ft.fuelType}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trennlinie */}
            <div className="border-t border-gray-200 pt-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Save className="h-5 w-5" />
                Berechnungsparameter
              </h2>
              <p className="text-sm text-gray-500">Konfigurieren Sie die CO₂-Berechnungsgrundlagen</p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Berechnungsgrundlagen */}
          <Card>
            <CardHeader>
              <CardTitle>Berechnungsgrundlagen</CardTitle>
              <CardDescription>
                Grundeinstellungen für die CO₂-Berechnung basierend auf vermiedenen Fahrten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workshopsToCompare" className="flex items-center gap-2">
                  Anzahl Werkstätten zum Vergleich
                  <span className="text-xs text-gray-500">(Standard: 3)</span>
                </Label>
                <Input
                  id="workshopsToCompare"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.workshopsToCompare}
                  onChange={(e) => handleChange('workshopsToCompare', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Wie viele Werkstätten würde ein Kunde sonst durchschnittlich besuchen, um
                  Angebote zu vergleichen?
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CO₂-Emissionsfaktoren */}
          <Card>
            <CardHeader>
              <CardTitle>CO₂-Emissionsfaktoren (Fallback)</CardTitle>
              <CardDescription>
                Durchschnittswerte pro Kilometer - werden nur verwendet wenn kein Fahrzeug mit Verbrauchsdaten bekannt ist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="co2PerKmCombustion" className="flex items-center gap-2">
                    CO₂ pro km (Verbrenner)
                    <span className="text-xs text-gray-500">(g CO₂/km)</span>
                  </Label>
                  <Input
                    id="co2PerKmCombustion"
                    type="number"
                    min="0"
                    value={settings.co2PerKmCombustion}
                    onChange={(e) => handleChange('co2PerKmCombustion', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Durchschnitt für Benzin/Diesel: ~140 g/km
                  </p>
                </div>

                <div>
                  <Label htmlFor="co2PerKmElectric" className="flex items-center gap-2">
                    CO₂ pro km (E-Auto)
                    <span className="text-xs text-gray-500">(g CO₂/km)</span>
                  </Label>
                  <Input
                    id="co2PerKmElectric"
                    type="number"
                    min="0"
                    value={settings.co2PerKmElectric}
                    onChange={(e) => handleChange('co2PerKmElectric', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deutscher Strommix 2024: ~50 g/km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kraftstoffspezifische CO₂-Faktoren */}
          <Card>
            <CardHeader>
              <CardTitle>Kraftstoffspezifische CO₂-Faktoren</CardTitle>
              <CardDescription>
                Emissionsfaktoren pro Liter/kg/kWh - für präzise Berechnungen mit individuellem Fahrzeugverbrauch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="co2PerLiterPetrol" className="flex items-center gap-2">
                    CO₂ pro Liter Benzin
                    <span className="text-xs text-gray-500">(g CO₂/L)</span>
                  </Label>
                  <Input
                    id="co2PerLiterPetrol"
                    type="number"
                    min="0"
                    value={settings.co2PerLiterPetrol}
                    onChange={(e) => handleChange('co2PerLiterPetrol', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard: 2320 g/L
                  </p>
                </div>

                <div>
                  <Label htmlFor="co2PerLiterDiesel" className="flex items-center gap-2">
                    CO₂ pro Liter Diesel
                    <span className="text-xs text-gray-500">(g CO₂/L)</span>
                  </Label>
                  <Input
                    id="co2PerLiterDiesel"
                    type="number"
                    min="0"
                    value={settings.co2PerLiterDiesel}
                    onChange={(e) => handleChange('co2PerLiterDiesel', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard: 2640 g/L (+14% vs. Benzin)
                  </p>
                </div>

                <div>
                  <Label htmlFor="co2PerLiterLPG" className="flex items-center gap-2">
                    CO₂ pro Liter LPG (Autogas)
                    <span className="text-xs text-gray-500">(g CO₂/L)</span>
                  </Label>
                  <Input
                    id="co2PerLiterLPG"
                    type="number"
                    min="0"
                    value={settings.co2PerLiterLPG}
                    onChange={(e) => handleChange('co2PerLiterLPG', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard: 1640 g/L (-29% vs. Benzin)
                  </p>
                </div>

                <div>
                  <Label htmlFor="co2PerKgCNG" className="flex items-center gap-2">
                    CO₂ pro kg CNG (Erdgas)
                    <span className="text-xs text-gray-500">(g CO₂/kg)</span>
                  </Label>
                  <Input
                    id="co2PerKgCNG"
                    type="number"
                    min="0"
                    value={settings.co2PerKgCNG}
                    onChange={(e) => handleChange('co2PerKgCNG', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard: 1990 g/kg
                  </p>
                </div>

                <div>
                  <Label htmlFor="co2PerKWhElectric" className="flex items-center gap-2">
                    CO₂ pro kWh Strom
                    <span className="text-xs text-gray-500">(g CO₂/kWh)</span>
                  </Label>
                  <Input
                    id="co2PerKWhElectric"
                    type="number"
                    min="0"
                    value={settings.co2PerKWhElectric}
                    onChange={(e) => handleChange('co2PerKWhElectric', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deutscher Strommix: ~420 g/kWh
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kraftstoffpreise */}
          <Card>
            <CardHeader>
              <CardTitle>Kraftstoffpreise</CardTitle>
              <CardDescription>
                Aktuelle Preise für die Berechnung der monetären Einsparungen durch vermiedene Fahrten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="petrolPricePerLiter" className="flex items-center gap-2">
                    Benzinpreis
                    <span className="text-xs text-gray-500">(€/L)</span>
                  </Label>
                  <Input
                    id="petrolPricePerLiter"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.petrolPricePerLiter}
                    onChange={(e) => handleChange('petrolPricePerLiter', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dieselPricePerLiter" className="flex items-center gap-2">
                    Dieselpreis
                    <span className="text-xs text-gray-500">(€/L)</span>
                  </Label>
                  <Input
                    id="dieselPricePerLiter"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.dieselPricePerLiter}
                    onChange={(e) => handleChange('dieselPricePerLiter', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="lpgPricePerLiter" className="flex items-center gap-2">
                    LPG-Preis (Autogas)
                    <span className="text-xs text-gray-500">(€/L)</span>
                  </Label>
                  <Input
                    id="lpgPricePerLiter"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.lpgPricePerLiter}
                    onChange={(e) => handleChange('lpgPricePerLiter', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="cngPricePerKg" className="flex items-center gap-2">
                    CNG-Preis (Erdgas)
                    <span className="text-xs text-gray-500">(€/kg)</span>
                  </Label>
                  <Input
                    id="cngPricePerKg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.cngPricePerKg}
                    onChange={(e) => handleChange('cngPricePerKg', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="electricPricePerKWh" className="flex items-center gap-2">
                    Strompreis
                    <span className="text-xs text-gray-500">(€/kWh)</span>
                  </Label>
                  <Input
                    id="electricPricePerKWh"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.electricPricePerKWh}
                    onChange={(e) => handleChange('electricPricePerKWh', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Speichere...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Einstellungen speichern
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
