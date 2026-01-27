'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Car, Sliders, Calendar, ChevronRight, ChevronLeft, Award, Fuel, Volume2, Shield, TrendingUp, Check, AlertTriangle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  summerTires?: { width: number; aspectRatio: number; diameter: number };
  winterTires?: { width: number; aspectRatio: number; diameter: number };
  allSeasonTires?: { width: number; aspectRatio: number; diameter: number };
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
  priorityValue: number;
  season: 'summer' | 'winter' | 'all-season';
  needs3PMSF: boolean;
  needsIceGrip: boolean;
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

export default function TireAdvisorWidget() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState<ScoredTire[]>([]);
  const [showResults, setShowResults] = useState(false);
  
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
    priorityDurability: 20,
    priorityValue: 15,
    season: 'summer',
    needs3PMSF: false,
    needsIceGrip: false
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    
    // Reifengröße automatisch setzen
    const tireSize = vehicle.summerTires || vehicle.winterTires || vehicle.allSeasonTires;
    if (tireSize) {
      setProfile(prev => ({
        ...prev,
        width: tireSize.width,
        aspectRatio: tireSize.aspectRatio,
        diameter: tireSize.diameter
      }));
    }
    
    setStep(2);
  };

  const adjustUsageSliders = (type: 'usageCity' | 'usageLandroad' | 'usageHighway', value: number) => {
    const others = ['usageCity', 'usageLandroad', 'usageHighway'].filter(k => k !== type);
    const remaining = 100 - value;
    const distribution = remaining / 2;
    
    setProfile(prev => ({
      ...prev,
      [type]: value,
      [others[0]]: distribution,
      [others[1]]: distribution
    }));
  };

  const adjustPriorities = (key: keyof UserProfile, value: number) => {
    const priorityKeys = ['prioritySafety', 'priorityFuelSaving', 'priorityQuietness', 'priorityDurability', 'priorityValue'];
    const otherKeys = priorityKeys.filter(k => k !== key);
    const remaining = 100 - value;
    const distribution = remaining / otherKeys.length;
    
    const updated = { ...profile, [key]: value };
    otherKeys.forEach(k => {
      updated[k as keyof UserProfile] = Math.round(distribution) as any;
    });
    
    setProfile(updated);
  };

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/smart-tire-advisor/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setShowResults(true);
      } else {
        alert('Fehler bei der Empfehlung');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Fehler bei der Verbindung');
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectTire = (tire: ScoredTire) => {
    // Navigiere zur Anfrage-Seite mit Reifendaten
    const params = new URLSearchParams({
      vehicleId: selectedVehicle?.id || '',
      manufacturer: tire.tire.supplierName,
      model: tire.tire.modelName,
      width: profile.width.toString(),
      aspectRatio: profile.aspectRatio.toString(),
      diameter: profile.diameter.toString(),
      season: profile.season
    });
    
    router.push(`/dashboard/customer/create-request/tires?${params.toString()}`);
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

  if (loading) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center text-gray-600">Lade Fahrzeuge...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">🎯 Smart Reifen-Berater</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Intelligente Empfehlungen aus 125.000+ EU-zertifizierten Reifen
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Schritt 1: Fahrzeugauswahl */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Wählen Sie Ihr Fahrzeug:</p>
              {vehicles.length === 0 ? (
                <div className="text-center p-6 bg-white rounded-lg">
                  <Car className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-4">Noch keine Fahrzeuge hinterlegt</p>
                  <Button onClick={() => router.push('/dashboard/customer/vehicles')}>
                    Fahrzeug hinzufügen
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {vehicles.map(vehicle => (
                    <button
                      key={vehicle.id}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className="w-full p-4 bg-white rounded-lg hover:bg-blue-50 transition-colors text-left border-2 border-transparent hover:border-blue-300"
                    >
                      <div className="font-semibold">{vehicle.make} {vehicle.model}</div>
                      <div className="text-sm text-gray-600">Baujahr: {vehicle.year}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schritt 2: Nutzungsprofil */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Nutzungsprofil</h3>
                <span className="text-sm text-gray-600">Schritt 2/4</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hauptnutzung (Gesamt: 100%)</label>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">🏙️ Stadt</span>
                        <span className="text-sm font-semibold text-blue-600">{profile.usageCity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={profile.usageCity}
                        onChange={(e) => adjustUsageSliders('usageCity', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">🛣️ Landstraße</span>
                        <span className="text-sm font-semibold text-green-600">{profile.usageLandroad}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={profile.usageLandroad}
                        onChange={(e) => adjustUsageSliders('usageLandroad', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">🛣️ Autobahn</span>
                        <span className="text-sm font-semibold text-purple-600">{profile.usageHighway}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={profile.usageHighway}
                        onChange={(e) => adjustUsageSliders('usageHighway', parseInt(e.target.value))}
                        className="w-full"
                      />
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
                        className={`p-3 rounded-lg border-2 transition-all ${
                          profile.drivingStyle === style.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{style.icon}</div>
                        <div className="text-xs font-medium">{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                  <input
                    type="checkbox"
                    id="electric"
                    checked={profile.isElectric}
                    onChange={(e) => setProfile({ ...profile, isElectric: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="electric" className="text-sm">⚡ Elektro- oder Hybrid-Fahrzeug</label>
                </div>
              </div>
            </div>
          )}

          {/* Schritt 3: Prioritäten */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Ihre Prioritäten</h3>
                <span className="text-sm text-gray-600">Schritt 3/4</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <Shield className="h-4 w-4 text-red-600" />
                      Sicherheit
                    </span>
                    <span className="text-sm font-bold text-red-600">{profile.prioritySafety}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profile.prioritySafety}
                    onChange={(e) => adjustPriorities('prioritySafety', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <Fuel className="h-4 w-4 text-green-600" />
                      Kraftstoffersparnis
                    </span>
                    <span className="text-sm font-bold text-green-600">{profile.priorityFuelSaving}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profile.priorityFuelSaving}
                    onChange={(e) => adjustPriorities('priorityFuelSaving', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <Volume2 className="h-4 w-4 text-blue-600" />
                      Leise Fahrt
                    </span>
                    <span className="text-sm font-bold text-blue-600">{profile.priorityQuietness}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profile.priorityQuietness}
                    onChange={(e) => adjustPriorities('priorityQuietness', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      Langlebigkeit
                    </span>
                    <span className="text-sm font-bold text-orange-600">{profile.priorityDurability}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profile.priorityDurability}
                    onChange={(e) => adjustPriorities('priorityDurability', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center gap-1">
                      <Award className="h-4 w-4 text-purple-600" />
                      Preis-Leistung
                    </span>
                    <span className="text-sm font-bold text-purple-600">{profile.priorityValue}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profile.priorityValue}
                    onChange={(e) => adjustPriorities('priorityValue', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Gesamt-Punkte:</span>
                    <span className={`text-lg font-bold ${
                      Math.abs(profile.prioritySafety + profile.priorityFuelSaving + profile.priorityQuietness + 
                              profile.priorityDurability + profile.priorityValue - 100) < 1
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {profile.prioritySafety + profile.priorityFuelSaving + profile.priorityQuietness + 
                       profile.priorityDurability + profile.priorityValue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schritt 4: Saison */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Saison & Extras</h3>
                <span className="text-sm text-gray-600">Schritt 4/4</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Welche Reifen suchen Sie?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'summer', label: 'Sommer', icon: '☀️' },
                    { value: 'winter', label: 'Winter', icon: '❄️' },
                    { value: 'all-season', label: 'Ganzjahr', icon: '🌦️' }
                  ].map(season => (
                    <button
                      key={season.value}
                      onClick={() => setProfile({ ...profile, season: season.value as any })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        profile.season === season.value
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{season.icon}</div>
                      <div className="text-xs font-medium">{season.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {(profile.season === 'winter' || profile.season === 'all-season') && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                  <input
                    type="checkbox"
                    id="3pmsf"
                    checked={profile.needs3PMSF}
                    onChange={(e) => setProfile({ ...profile, needs3PMSF: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="3pmsf" className="text-sm">❄️ 3PMSF-Symbol erforderlich</label>
                </div>
              )}

              {profile.season === 'winter' && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                  <input
                    type="checkbox"
                    id="icegrip"
                    checked={profile.needsIceGrip}
                    onChange={(e) => setProfile({ ...profile, needsIceGrip: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="icegrip" className="text-sm">🧊 Ice Grip Symbol</label>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Zurück
              </Button>
            )}
            
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="ml-auto bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Weiter
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="ml-auto bg-green-600 hover:bg-green-700"
                size="sm"
              >
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
        </CardContent>
      </Card>

      {/* Ergebnis-Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              Ihre Top 5 Reifenempfehlungen
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {recommendations.slice(0, 5).map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${index === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
                {index === 0 && (
                  <div className="flex items-center gap-2 mb-3 text-yellow-600 font-semibold">
                    <Award className="h-5 w-5" />
                    Beste Empfehlung
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">#{index + 1}</div>
                    <h3 className="text-lg font-bold">{item.tire.supplierName}</h3>
                    <p className="text-gray-700">{item.tire.modelName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.tire.tyreDimension} | {item.tire.tyreClass}
                      {item.tire.has3PMSF && ' ❄️'}
                      {item.tire.hasIceGrip && ' 🧊'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`inline-flex flex-col items-center px-4 py-2 rounded-lg ${
                      item.score >= 85 ? 'bg-green-100 text-green-700' :
                      item.score >= 75 ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      <div className="text-3xl font-bold">{Math.round(item.score)}</div>
                      <div className="text-xs font-medium">von 100</div>
                    </div>
                  </div>
                </div>

                {/* EU Labels */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Kraftstoff</div>
                    <div className={`inline-block w-10 h-10 ${getLabelColor(item.tire.fuelEfficiencyClass)} text-white font-bold text-lg rounded flex items-center justify-center`}>
                      {item.tire.fuelEfficiencyClass || '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Nasshaftung</div>
                    <div className={`inline-block w-10 h-10 ${getLabelColor(item.tire.wetGripClass)} text-white font-bold text-lg rounded flex items-center justify-center`}>
                      {item.tire.wetGripClass || '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Geräusch</div>
                    <div className="text-2xl">{getNoiseClass(item.tire.externalRollingNoiseClass)}</div>
                    <div className="text-xs text-gray-600">
                      {item.tire.externalRollingNoiseLevel ? `${item.tire.externalRollingNoiseLevel} dB` : '-'}
                    </div>
                  </div>
                </div>

                {/* Reasons */}
                {item.reasons.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-green-700 mb-1 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Warum empfohlen?
                    </div>
                    <ul className="space-y-1">
                      {item.reasons.map((reason, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {item.warnings.length > 0 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded mb-3">
                    <div className="text-sm font-semibold text-yellow-800 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Hinweise
                    </div>
                    <ul className="space-y-1">
                      {item.warnings.map((warning, i) => (
                        <li key={i} className="text-sm text-yellow-700">⚠️ {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => handleSelectTire(item)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Diesen Reifen anfragen
                </Button>
              </div>
            ))}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Hinweis zur Empfehlung</p>
                  <p>
                    Die Bewertung basiert auf offiziellen EU-Reifenlabel-Daten und Ihren persönlichen Prioritäten. 
                    Wählen Sie einen Reifen aus, um direkt eine Anfrage bei Werkstätten in Ihrer Nähe zu stellen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
