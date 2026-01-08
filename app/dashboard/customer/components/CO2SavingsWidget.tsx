'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, TrendingDown, Car, Fuel, Euro } from 'lucide-react';

interface CO2Stats {
  totalCO2SavedGrams: number;
  totalCO2SavedKg: number;
  numberOfRequests: number;
  totalMoneySaved?: number;
  breakdown?: {
    averageDistancePerWorkshop: number;
    workshopsCompared: number;
    totalKmSaved: number;
    averageFuelConsumption?: number;
    fuelType?: string;
  };
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
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800 h-full min-h-[500px] flex flex-col w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Leaf className="h-5 w-5" />
            Ihre CO₂-Einsparungen
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.numberOfRequests === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800 h-full min-h-[500px] flex flex-col w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Leaf className="h-5 w-5" />
            Ihre CO₂-Einsparungen
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center px-4">
            Erstellen Sie Ihre erste Anfrage, um zu sehen, wie viel CO₂ Sie durch Bereifung24
            einsparen!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800 h-full min-h-[500px] flex flex-col w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <Leaf className="h-5 w-5" />
          Ihre CO₂-Einsparungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {/* Hauptanzeige */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-green-700 dark:text-green-300">
              {stats.totalCO2SavedKg.toFixed(2)}
            </span>
            <span className="text-xl text-green-600 dark:text-green-400">kg CO₂</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            gespart durch {stats.numberOfRequests}{' '}
            {stats.numberOfRequests === 1 ? 'Anfrage' : 'Anfragen'} über Bereifung24
          </p>
          {stats.totalMoneySaved && stats.totalMoneySaved > 0 && (
            <div className="flex items-center justify-center gap-1 mt-2 text-amber-700 dark:text-amber-400">
              <Euro className="h-4 w-4" />
              <span className="font-semibold">{stats.totalMoneySaved.toFixed(2)} €</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Kraftstoffkosten gespart</span>
            </div>
          )}
        </div>

        {/* Breakdown Details */}
        {stats.breakdown && (
          <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg p-3 space-y-2 border border-green-200 dark:border-green-700">
            <div className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">
              📊 Berechnungsdetails:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Vermiedene Fahrten:</span>
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  {stats.breakdown.totalTripsAvoided || stats.breakdown.workshopsCompared} Fahrten
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Eingesparte Kilometer:</span>
                <div className="font-semibold text-gray-800 dark:text-gray-200">
                  {stats.breakdown.totalKmSaved.toFixed(1)} km
                </div>
              </div>
              {stats.breakdown.averageFuelConsumption && (
                <>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Ø Verbrauch:</span>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {stats.breakdown.averageFuelConsumption.toFixed(1)} L/100km
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Kraftstoff:</span>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {stats.breakdown.fuelType || 'Benzin'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Vergleiche */}
        <div className="grid grid-cols-1 gap-2 pt-3 border-t border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-700 dark:text-gray-300">
              Entspricht{' '}
              <strong className="text-green-700 dark:text-green-300">
                ~{stats.comparisons.equivalentCarKm} km
              </strong>{' '}
              Autofahrt
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-700 dark:text-gray-300">
              So viel wie{' '}
              <strong className="text-green-700 dark:text-green-300">
                {stats.comparisons.equivalentTrees} {stats.comparisons.equivalentTrees === 1 ? 'Baum' : 'Bäume'}
              </strong>{' '}
              in 1 Jahr binden
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-3 mt-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            💡 <strong>So sparen Sie CO₂:</strong> Anstatt zu {stats.breakdown?.workshopsCompared || 3} Werkstätten 
            zu fahren um Preise zu vergleichen, bekommen Sie Angebote online. Das spart unnötige Fahrten 
            und schützt die Umwelt!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
