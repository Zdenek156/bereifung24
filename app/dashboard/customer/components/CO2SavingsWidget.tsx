'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, TrendingDown, Car, Fuel, Euro } from 'lucide-react';

interface CO2Stats {
  totalCO2SavedGrams: number;
  totalCO2SavedKg: number;
  numberOfRequests: number;
  comparisons: {
    equivalentCarKm: number;
    equivalentTrees: number;
    equivalentPhoneCharges: number;
  };
}

export default function CO2SavingsWidget() {
  const [stats, setStats] = useState<CO2Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/customer/co2-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der CO₂-Statistiken:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Leaf className="h-5 w-5" />
            Ihre CO₂-Einsparungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.numberOfRequests === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Leaf className="h-5 w-5" />
            Ihre CO₂-Einsparungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Erstellen Sie Ihre erste Anfrage, um zu sehen, wie viel CO₂ Sie durch Bereifung24
            einsparen!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Leaf className="h-5 w-5" />
          Ihre CO₂-Einsparungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hauptanzeige */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-green-700">
              {stats.totalCO2SavedKg.toFixed(2)}
            </span>
            <span className="text-xl text-green-600">kg CO₂</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            gespart durch {stats.numberOfRequests}{' '}
            {stats.numberOfRequests === 1 ? 'Anfrage' : 'Anfragen'} über Bereifung24
          </p>
        </div>

        {/* Vergleiche */}
        <div className="grid grid-cols-1 gap-2 pt-3 border-t border-green-200">
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-green-600" />
            <span className="text-gray-700">
              Entspricht{' '}
              <strong className="text-green-700">
                ~{stats.comparisons.equivalentCarKm} km
              </strong>{' '}
              Autofahrt
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Leaf className="h-4 w-4 text-green-600" />
            <span className="text-gray-700">
              So viel wie{' '}
              <strong className="text-green-700">
                {stats.comparisons.equivalentTrees} {stats.comparisons.equivalentTrees === 1 ? 'Baum' : 'Bäume'}
              </strong>{' '}
              in 1 Jahr binden
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/50 rounded-lg p-3 mt-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            💡 <strong>So sparen Sie CO₂:</strong> Anstatt zu mehreren Werkstätten zu fahren,
            holen Sie Angebote bequem online ein. Das spart Fahrten und schützt die Umwelt!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
