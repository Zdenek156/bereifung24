'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Car, ChevronRight, ChevronLeft, Fuel, Volume2, Shield, TrendingUp, Check, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TireSize {
  width: number;
  aspectRatio: number;
  diameter: number;
}

interface Vehicle {
  id: string;
  vehicleType?: string;
  make: string;
  model: string;
  year: number;
  summerTires?: TireSize;
  winterTires?: TireSize;
  allSeasonTires?: TireSize;
}

interface UserProfile {
  width: number;
  aspectRatio: number;
  diameter: number;
  vehicleType: 'small' | 'medium' | 'premium' | 'suv' | 'van';
  kmPerYear: number;
  usageCity: number;
  usageLandroad: number;
  usageHighway: number;
  drivingStyle: 'sporty' | 'normal' | 'comfort';
  isElectric: boolean;
  prioritySafety: number;
  priorityFuelSaving: number;
  priorityQuietness: number;
  priorityDurability: number;
  season: 'summer' | 'winter' | 'all-season';
  needs3PMSF: boolean;
  needsIceGrip: boolean;
  preferredBrands: string[];
}

interface ScoredTire {
  tire: {
    supplierName: string;
    modelName: string;
    tyreDimension: string;
    tyreClass: string;
    fuelEfficiencyClass: string | null;
    wetGripClass: string | null;
    externalRollingNoiseLevel: number | null;
    externalRollingNoiseClass: string | null;
    has3PMSF: boolean;
    hasIceGrip: boolean;
  };
  score: number;
  scoreBreakdown: {
    euLabel: number;
    seasonMatch: number;
    brandReputation: number;
    usageMatch: number;
    drivingStyleMatch: number;
  };
  reasons: string[];
  warnings: string[];
}

type TireType = 'summer' | 'winter' | 'all-season';

export default function TireAdvisorWidget() {
  const router = useRouter();
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [availableTireTypes, setAvailableTireTypes] = useState<TireType[]>([]);
  const [selectedTireType, setSelectedTireType] = useState<TireType | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState<ScoredTire[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState('');
  
  const [profile, setProfile] = useState<UserProfile>({
    width: 205,
    aspectRatio: 55,
    diameter: 16,
    vehicleType: 'medium',
    kmPerYear: 15000,
    usageCity: 40,
    usageLandroad: 30,
    usageHighway: 30,
    drivingStyle: 'normal',
    isElectric: false,
    prioritySafety: 30,
    priorityFuelSaving: 20,
    priorityQuietness: 15,
    priorityDurability: 35,
    season: 'summer',
    needs3PMSF: false,
    needsIceGrip: false,
    preferredBrands: []
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vehicles');
      if (response.ok) {
        const data = await response.json();
        // Nur PKW anzeigen – EPREL enthält keine Motorrad-/Anhängerreifen
        const cars = (Array.isArray(data) ? data : []).filter(
          (v: Vehicle) => !v.vehicleType || v.vehicleType === 'CAR'
        );
        setVehicles(cars);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdvisor = () => {
    setShowAdvisor(true);
    setStep(1);
    setSelectedVehicle(null);
    setSelectedTireType(null);
    setRecommendations([]);
    setShowResults(false);
    setShowNoResults(false);
    fetchVehicles();
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    
    const types: TireType[] = [];
    if (vehicle.summerTires) types.push('summer');
    if (vehicle.winterTires) types.push('winter');
    if (vehicle.allSeasonTires) types.push('all-season');
    
    setAvailableTireTypes(types);
    
    if (types.length === 1) {
      handleTireTypeSelect(vehicle, types[0]);
    } else {
      setStep(2);
    }
  };

  const handleTireTypeSelect = (vehicle: Vehicle, tireType: TireType) => {
    setSelectedTireType(tireType);
    
    let tireSize: TireSize | undefined;
    let season: 'summer' | 'winter' | 'all-season' = 'summer';
    
    if (tireType === 'summer' && vehicle.summerTires) {
      tireSize = vehicle.summerTires;
      season = 'summer';
    } else if (tireType === 'winter' && vehicle.winterTires) {
      tireSize = vehicle.winterTires;
      season = 'winter';
    } else if (tireType === 'all-season' && vehicle.allSeasonTires) {
      tireSize = vehicle.allSeasonTires;
      season = 'all-season';
    }
    
    if (tireSize) {
      setProfile(prev => ({
        ...prev,
        width: tireSize!.width,
        aspectRatio: tireSize!.aspectRatio,
        diameter: tireSize!.diameter,
        season: season
      }));
      setStep(3);
    }
  };

  const calculateScoreFromPercentages = () => {
    const total = profile.prioritySafety + profile.priorityFuelSaving + 
                  profile.priorityQuietness + profile.priorityDurability;
    
    if (total === 0) return;
    
    const factor = 100 / total;
    return {
      prioritySafety: Math.round(profile.prioritySafety * factor),
      priorityFuelSaving: Math.round(profile.priorityFuelSaving * factor),
      priorityQuietness: Math.round(profile.priorityQuietness * factor),
      priorityDurability: Math.round(profile.priorityDurability * factor)
    };
  };

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      const normalizedPriorities = calculateScoreFromPercentages();
      
      const requestProfile = {
        ...profile,
        ...normalizedPriorities
      };
      
      const response = await fetch('/api/smart-tire-advisor/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestProfile)
      });
      
      const data = await response.json();

      if (response.ok) {
        setRecommendations(data.recommendations || []);
        
        if (data.recommendations && data.recommendations.length > 0) {
          const topBrand = data.recommendations[0].tire.supplierName;
          setProfile(prev => ({
            ...prev,
            preferredBrands: [topBrand]
          }));
        }
        
        setShowAdvisor(false);
        setShowResults(true);
      } else if (response.status === 404) {
        setNoResultsMessage(data.message || 'Keine passenden Reifen für diese Größe gefunden. Die EPREL-Datenbank enthält nur PKW-Reifen (C1/C2/C3) – Motorradreifen sind leider nicht verfügbar.');
        setShowAdvisor(false);
        setShowNoResults(true);
      } else {
        alert(data.error || 'Fehler bei der Empfehlung');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Verbindungsfehler – bitte versuchen Sie es erneut.');
    } finally {
      setProcessing(false);
    }
  };

  const getLabelColor = (label: string | null) => {
    if (!label) return 'bg-gray-400';
    if (label === 'A') return 'bg-green-500';
    if (label === 'B') return 'bg-lime-500';
    if (label === 'C') return 'bg-yellow-500';
    if (label === 'D') return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getNoiseClass = (noiseClass: string | null) => {
    if (!noiseClass) return '❓';
    if (noiseClass === 'A') return '🔇';
    if (noiseClass === 'B') return '🔉';
    return '🔊';
  };

  const getTireTypeName = (type: TireType) => {
    if (type === 'summer') return 'Sommerreifen';
    if (type === 'winter') return 'Winterreifen';
    return 'Ganzjahresreifen';
  };

  const getTireTypeIcon = (type: TireType) => {
    if (type === 'summer') return '☀️';
    if (type === 'winter') return '❄️';
    return '🌦️';
  };

  // ── Compact Dashboard Card ──
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-600 rounded-lg flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">🎯 Smart Reifen-Berater</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Persönliche Empfehlungen aus 125.000+ EU-Reifen
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1">
          <div className="space-y-2.5 mb-4">
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Analyse basierend auf Ihrem Fahrprofil & Prioritäten</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>EU-Label, Nasshaftung, Geräuschlevel & mehr</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Top 5 Reifen mit persönlichem Score</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleOpenAdvisor}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Beratung starten
        </button>
      </div>

      {/* ── Advisor Modal (full flow) ── */}
      <Dialog open={showAdvisor} onOpenChange={setShowAdvisor}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Smart Reifen-Berater
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            {/* Step 1: Vehicle selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Wählen Sie Ihr Fahrzeug:</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Schritt 1/5</span>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Car className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Noch keine Fahrzeuge hinterlegt</p>
                    <Button size="sm" onClick={() => { setShowAdvisor(false); router.push('/dashboard/customer/vehicles'); }}>
                      Fahrzeug hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {vehicles.map(vehicle => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleVehicleSelect(vehicle)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border-2 border-transparent hover:border-blue-300"
                      >
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">{vehicle.make} {vehicle.model}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Baujahr: {vehicle.year}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {vehicle.summerTires && '☀️ Sommer'}
                          {vehicle.winterTires && ' ❄️ Winter'}
                          {vehicle.allSeasonTires && ' 🌦️ Ganzjahr'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Tire type selection */}
            {step === 2 && selectedVehicle && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Welche Reifen benötigen Sie?</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Schritt 2/5</span>
                </div>
                
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm">
                    <strong>{selectedVehicle.make} {selectedVehicle.model}</strong> ({selectedVehicle.year})
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {availableTireTypes.map(type => {
                    const size = type === 'summer' ? selectedVehicle.summerTires :
                                type === 'winter' ? selectedVehicle.winterTires :
                                selectedVehicle.allSeasonTires;
                    
                    return (
                      <button
                        key={type}
                        onClick={() => handleTireTypeSelect(selectedVehicle, type)}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border-2 border-transparent hover:border-blue-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getTireTypeIcon(type)}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{getTireTypeName(type)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {size?.width}/{size?.aspectRatio} R{size?.diameter}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Usage profile */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Nutzungsprofil</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Schritt 3/5</span>
                </div>
                
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm">
                    <strong>{selectedVehicle?.make} {selectedVehicle?.model}</strong> • {getTireTypeIcon(selectedTireType!)} {getTireTypeName(selectedTireType!)}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Größe: {profile.width}/{profile.aspectRatio} R{profile.diameter}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hauptnutzung (in %)</label>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">🏙️ Stadt</span>
                          <span className="text-xs font-semibold text-blue-600">{profile.usageCity}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={profile.usageCity}
                          onChange={(e) => setProfile({ ...profile, usageCity: parseInt(e.target.value) })}
                          className="w-full" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">🛣️ Landstraße</span>
                          <span className="text-xs font-semibold text-green-600">{profile.usageLandroad}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={profile.usageLandroad}
                          onChange={(e) => setProfile({ ...profile, usageLandroad: parseInt(e.target.value) })}
                          className="w-full" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs">🛣️ Autobahn</span>
                          <span className="text-xs font-semibold text-purple-600">{profile.usageHighway}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={profile.usageHighway}
                          onChange={(e) => setProfile({ ...profile, usageHighway: parseInt(e.target.value) })}
                          className="w-full" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Fahrstil</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'sporty', label: 'Sportlich', icon: '🏁' },
                        { value: 'normal', label: 'Normal', icon: '🚗' },
                        { value: 'comfort', label: 'Komfort', icon: '😌' }
                      ].map(style => (
                        <button
                          key={style.value}
                          onClick={() => setProfile({ ...profile, drivingStyle: style.value as any })}
                          className={`p-2.5 rounded-lg border-2 transition-all text-center ${
                            profile.drivingStyle === style.value
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-xl mb-0.5">{style.icon}</div>
                          <div className="text-xs font-medium">{style.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <input type="checkbox" id="electric-modal" checked={profile.isElectric}
                      onChange={(e) => setProfile({ ...profile, isElectric: e.target.checked })}
                      className="w-4 h-4" />
                    <label htmlFor="electric-modal" className="text-sm">⚡ Elektro- oder Hybrid-Fahrzeug</label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Priorities */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Ihre Prioritäten</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Schritt 4/5</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-red-600" /> Sicherheit
                      </span>
                      <span className="text-xs font-bold text-red-600">{profile.prioritySafety}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={profile.prioritySafety}
                      onChange={(e) => setProfile({ ...profile, prioritySafety: parseInt(e.target.value) })}
                      className="w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs flex items-center gap-1">
                        <Fuel className="h-3.5 w-3.5 text-green-600" /> Kraftstoffersparnis
                      </span>
                      <span className="text-xs font-bold text-green-600">{profile.priorityFuelSaving}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={profile.priorityFuelSaving}
                      onChange={(e) => setProfile({ ...profile, priorityFuelSaving: parseInt(e.target.value) })}
                      className="w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5 text-blue-600" /> Leise Fahrt
                      </span>
                      <span className="text-xs font-bold text-blue-600">{profile.priorityQuietness}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={profile.priorityQuietness}
                      onChange={(e) => setProfile({ ...profile, priorityQuietness: parseInt(e.target.value) })}
                      className="w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-orange-600" /> Langlebigkeit
                      </span>
                      <span className="text-xs font-bold text-orange-600">{profile.priorityDurability}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={profile.priorityDurability}
                      onChange={(e) => setProfile({ ...profile, priorityDurability: parseInt(e.target.value) })}
                      className="w-full" />
                  </div>

                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Gesamt:</span>
                      <span className={`text-sm font-bold ${
                        Math.abs(profile.prioritySafety + profile.priorityFuelSaving + profile.priorityQuietness + 
                                 profile.priorityDurability - 100) < 1
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {profile.prioritySafety + profile.priorityFuelSaving + profile.priorityQuietness + 
                         profile.priorityDurability}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Extras */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Zusätzliche Anforderungen</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Schritt 5/5</span>
                </div>

                {(profile.season === 'winter' || profile.season === 'all-season') && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                    <input type="checkbox" id="3pmsf-modal" checked={profile.needs3PMSF}
                      onChange={(e) => setProfile({ ...profile, needs3PMSF: e.target.checked })}
                      className="w-4 h-4" />
                    <label htmlFor="3pmsf-modal" className="text-sm">❄️ 3PMSF-Symbol erforderlich</label>
                  </div>
                )}

                {profile.season === 'winter' && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                    <input type="checkbox" id="icegrip-modal" checked={profile.needsIceGrip}
                      onChange={(e) => setProfile({ ...profile, needsIceGrip: e.target.checked })}
                      className="w-4 h-4" />
                    <label htmlFor="icegrip-modal" className="text-sm">🧊 Ice Grip Symbol (für extreme Kälte)</label>
                  </div>
                )}

                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-900 dark:text-green-300">
                      <p className="font-semibold mb-0.5">Bereit für Ihre Empfehlungen!</p>
                      <p className="text-xs">
                        Wir analysieren über 125.000 Reifen für Ihren {selectedVehicle?.make} {selectedVehicle?.model}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-5 pt-4 border-t dark:border-gray-700">
              {step > 1 ? (
                <Button onClick={() => setStep(step - 1)} variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Button>
              ) : (
                <div />
              )}
              
              {step < 5 ? (
                <Button onClick={() => setStep(step + 1)} className="bg-blue-600 hover:bg-blue-700" size="sm">
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={processing} className="bg-green-600 hover:bg-green-700" size="sm">
                  {processing ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Empfehlungen anzeigen
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Results Dialog (compact) ── */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Top 5 Reifenempfehlungen
            </DialogTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Basierend auf EU-Label-Daten & Ihrem Profil • Score 0–100
            </p>
          </DialogHeader>
          
          <div className="space-y-2 mt-3">
            {recommendations.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  index === 0
                    ? 'border-yellow-300 bg-yellow-50/60 dark:bg-yellow-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {/* Row 1: Rank, Name, Score */}
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Tire info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {item.tire.supplierName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.tire.modelName}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <span>{item.tire.tyreDimension}</span>
                      <span>·</span>
                      <span>{item.tire.tyreClass}</span>
                      {item.tire.has3PMSF && <span>❄️</span>}
                      {item.tire.hasIceGrip && <span>🧊</span>}
                    </div>
                  </div>

                  {/* Score */}
                  <div className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-center ${
                    item.score >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    item.score >= 70 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    <div className="text-lg font-bold leading-tight">{Math.round(item.score)}</div>
                    <div className="text-[9px] font-medium opacity-70">/ 100</div>
                  </div>
                </div>

                {/* Row 2: EU Labels inline + top reason */}
                <div className="flex items-center gap-3 mt-2 pl-10">
                  {/* EU label pills */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">⛽</span>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white ${getLabelColor(item.tire.fuelEfficiencyClass)}`}>
                      {item.tire.fuelEfficiencyClass || '–'}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1">💧</span>
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white ${getLabelColor(item.tire.wetGripClass)}`}>
                      {item.tire.wetGripClass || '–'}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1">🔊</span>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      {item.tire.externalRollingNoiseLevel ? `${item.tire.externalRollingNoiseLevel}dB` : '–'}
                    </span>
                  </div>

                  {/* Separator */}
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />

                  {/* Top reasons (inline, compact) */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {item.reasons.length > 0
                        ? item.reasons.slice(0, 2).map(r => `✓ ${r}`).join('  ')
                        : '–'}
                    </p>
                  </div>
                </div>

                {/* Warnings (only if present, very compact) */}
                {item.warnings.length > 0 && (
                  <div className="mt-1.5 pl-10">
                    <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
                      ⚠️ {item.warnings.join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg mt-1">
              <Info className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Score basiert auf offiziellen EU-Reifenlabel-Daten, gewichtet nach Ihren Prioritäten.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── No Results Dialog ── */}
      <Dialog open={showNoResults} onOpenChange={setShowNoResults}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Info className="h-5 w-5 text-orange-500" />
              Keine Ergebnisse
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {noResultsMessage}
            </p>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Tipp:</strong> Der Smart Reifen-Berater nutzt die EU-EPREL-Datenbank, die nur PKW-, Van- und LKW-Reifen (Klasse C1/C2/C3) enthält. Motorradreifen sind hier nicht enthalten.
              </p>
            </div>
            <Button onClick={() => setShowNoResults(false)} className="w-full" size="sm">
              Verstanden
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
