'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Save, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CO2Settings {
  workshopsToCompare: number;
  co2PerKmCombustion: number;
  co2PerKmElectric: number;
  co2PerLiterFuel: number;
  co2PerKWhElectric: number;
  fuelPricePerLiter: number;
  dieselPricePerLiter: number;
  electricPricePerKWh: number;
}

export default function CO2TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CO2Settings>({
    workshopsToCompare: 3,
    co2PerKmCombustion: 140,
    co2PerKmElectric: 50,
    co2PerLiterFuel: 2330,
    co2PerKWhElectric: 420,
    fuelPricePerLiter: 1.65,
    dieselPricePerLiter: 1.55,
    electricPricePerKWh: 0.35,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

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

    try {
      const response = await fetch('/api/admin/co2-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('CO₂-Einstellungen erfolgreich gespeichert!');
      } else {
        toast.error('Fehler beim Speichern der Einstellungen');
      }
    } catch (error) {
      toast.error('Fehler beim Speichern');
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
              <CardTitle>CO₂-Emissionsfaktoren</CardTitle>
              <CardDescription>
                Durchschnittliche CO₂-Emissionen pro Kilometer und Energieeinheit
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

                <div>
                  <Label htmlFor="co2PerLiterFuel" className="flex items-center gap-2">
                    CO₂ pro Liter Kraftstoff
                    <span className="text-xs text-gray-500">(g CO₂/L)</span>
                  </Label>
                  <Input
                    id="co2PerLiterFuel"
                    type="number"
                    min="0"
                    value={settings.co2PerLiterFuel}
                    onChange={(e) => handleChange('co2PerLiterFuel', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Benzin/Diesel: ~2330 g/L
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
                Aktuelle Preise für die Berechnung der monetären Einsparungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="fuelPricePerLiter" className="flex items-center gap-2">
                    Benzinpreis
                    <span className="text-xs text-gray-500">(€/L)</span>
                  </Label>
                  <Input
                    id="fuelPricePerLiter"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.fuelPricePerLiter}
                    onChange={(e) => handleChange('fuelPricePerLiter', e.target.value)}
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
