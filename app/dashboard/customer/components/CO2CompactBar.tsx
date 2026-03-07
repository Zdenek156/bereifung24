'use client';

import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

interface CO2Stats {
  totalCO2SavedKg: number;
  numberOfRequests: number;
  dataSource: 'vehicle' | 'fallback' | 'none';
  breakdown: {
    totalKmSaved: number;
    totalTripsAvoided: number;
    fuelSavedLiters: number;
    fuelPer100km?: number;
    moneySaved: number;
    fuelUnit?: string;
  };
  comparisons: {
    equivalentCarKm: number;
    equivalentTrees: number;
    equivalentPhoneCharges: number;
  };
}

interface CO2CompactBarProps {
  totalCompletedBookings: number;
}

export default function CO2CompactBar({ totalCompletedBookings }: CO2CompactBarProps) {
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

  if (loading) return null;
  if (!stats || stats.numberOfRequests === 0) return null;

  const unit = stats.breakdown.fuelUnit || 'L';
  const showExpanded = stats.numberOfRequests >= 5 || totalCompletedBookings >= 5;

  if (showExpanded) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <Leaf className="h-4.5 w-4.5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-green-800 dark:text-green-300">Ihre CO₂-Bilanz durch Online-Buchung</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.numberOfRequests} Online-{stats.numberOfRequests === 1 ? 'Buchung' : 'Buchungen'} statt Werkstattbesuche für Angebote
              {stats.dataSource === 'vehicle' && (
                <span className="ml-1 text-green-600 dark:text-green-400">• Basierend auf Ihren Fahrzeugdaten</span>
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              {stats.numberOfRequests}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">Fahrten gespart</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              {stats.breakdown.totalKmSaved.toFixed(0)} km
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">Fahrtwege vermieden</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              {stats.totalCO2SavedKg.toFixed(1)} kg
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">CO₂ eingespart</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              {stats.breakdown.fuelSavedLiters.toFixed(1)} {unit}
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">
              {unit === 'kWh' ? 'Strom gespart' : 'Kraftstoff gespart'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact one-liner
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
      <Leaf className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
      <p className="text-sm text-green-800 dark:text-green-300">
        🌿 Durch Online-Buchung: <strong>{stats.breakdown.totalKmSaved.toFixed(0)} km</strong> Fahrtwege und{' '}
        <strong>{stats.totalCO2SavedKg.toFixed(1)} kg CO₂</strong> eingespart
      </p>
    </div>
  );
}
