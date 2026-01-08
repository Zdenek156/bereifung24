'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Zap, Shield, Volume2, Euro } from 'lucide-react';

interface TireSpec {
  width: number;
  aspectRatio: number;
  diameter: number;
  loadIndex?: number;
  speedRating?: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  summerTires?: TireSpec;
  winterTires?: TireSpec;
  allSeasonTires?: TireSpec;
}

interface TireRecommendation {
  id: string;
  manufacturer: string;
  model: string;
  dimension: string;
  season: 'SUMMER' | 'WINTER' | 'ALL_SEASON';
  wetGripClass: string; // A-E
  fuelEfficiency: string; // A-E
  noiseLevel: number; // dB
  noiseClass: string; // A-C
  has3PMSF: boolean;
  price: number;
  yearlyFuelSavings?: number;
  brakingDistanceAdvantage?: number;
  reason: string;
}

type Priority = 'SAFETY' | 'EFFICIENCY' | 'QUIET' | 'PRICE';

const priorityLabels = {
  SAFETY: 'Sicherheit',
  EFFICIENCY: 'Kraftstoff-Effizienz',
  QUIET: 'Lautstärke',
  PRICE: 'Preis'
};

const priorityIcons = {
  SAFETY: Shield,
  EFFICIENCY: Zap,
  QUIET: Volume2,
  PRICE: Euro
};

const gradeColors = {
  A: 'bg-green-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  E: 'bg-red-500'
};

export default function TireAdvisorWidget() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTireType, setSelectedTireType] = useState<'SUMMER' | 'WINTER' | 'ALL_SEASON' | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [recommendations, setRecommendations] = useState<TireRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    setSelectedVehicle(vehicle);
    
    // Wenn nur eine Reifenart verfügbar ist, überspringe die Auswahl
    const availableTireTypes = [];
    if (vehicle.summerTires) availableTireTypes.push('SUMMER');
    if (vehicle.winterTires) availableTireTypes.push('WINTER');
    if (vehicle.allSeasonTires) availableTireTypes.push('ALL_SEASON');
    
    if (availableTireTypes.length === 1) {
      setSelectedTireType(availableTireTypes[0] as 'SUMMER' | 'WINTER' | 'ALL_SEASON');
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleTireTypeSelect = (tireType: 'SUMMER' | 'WINTER' | 'ALL_SEASON') => {
    setSelectedTireType(tireType);
    setStep(3);
  };

  const handlePrioritySelect = async (priority: Priority) => {
    setSelectedPriority(priority);
    
    if (!selectedVehicle || !selectedTireType) return;
    
    // Hole die entsprechende Reifengröße basierend auf der gewählten Reifenart
    let tireSpec: TireSpec | undefined;
    if (selectedTireType === 'SUMMER') tireSpec = selectedVehicle.summerTires;
    else if (selectedTireType === 'WINTER') tireSpec = selectedVehicle.winterTires;
    else if (selectedTireType === 'ALL_SEASON') tireSpec = selectedVehicle.allSeasonTires;
    
    if (!tireSpec) return;
    
    // Suche Reifen über EPREL API
    try {
      const response = await fetch('/api/eprel/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: tireSpec.width,
          aspectRatio: tireSpec.aspectRatio,
          diameter: tireSpec.diameter,
          season: selectedTireType,
          limit: 20
        })
      });
      
      if (!response.ok) {
        throw new Error('EPREL API Fehler');
      }
      
      const data = await response.json();
      
      // Prüfe auf API-Fehler
      if (!response.ok || data.error) {
        setRecommendations([]);
        setStep(4);
        return;
      }
      
      // API gibt { results: [], total: X, source: 'mock_data' } zurück
      const tires = data.results || data;
      
      // Prüfe ob Ergebnisse vorhanden
      if (!Array.isArray(tires) || tires.length === 0) {
        setRecommendations([]);
        setStep(4);
        return;
      }
      
      // Sortiere Empfehlungen basierend auf Priorität
      const sorted = [...tires].sort((a: TireRecommendation, b: TireRecommendation) => {
        switch (priority) {
          case 'SAFETY':
            // Beste Nasshaftung zuerst
            return a.wetGripClass.localeCompare(b.wetGripClass);
          case 'EFFICIENCY':
            // Beste Kraftstoffeffizienz zuerst
            return a.fuelEfficiency.localeCompare(b.fuelEfficiency);
          case 'QUIET':
            // Leiseste Reifen zuerst
            return a.noiseLevel - b.noiseLevel;
          case 'PRICE':
            // Günstigste zuerst (nur wenn Preis verfügbar)
            if (a.price && b.price) return a.price - b.price;
            return 0;
          default:
            return 0;
        }
      });
      
      setRecommendations(sorted.slice(0, 3)); // Top 3
    } catch (error) {
      console.error('Fehler beim Laden der Reifenempfehlungen:', error);
      // Fallback auf leere Liste
      setRecommendations([]);
    }
    
    setStep(4);
  };

  const handleRequestTire = (tire: TireRecommendation) => {
    // Navigiere zur Anfrage-Seite mit Fahrzeug-ID und Hersteller/Modell
    if (!selectedVehicle) return;
    
    const params = new URLSearchParams({
      vehicleId: selectedVehicle.id,
      season: tire.season,
      tireDesignation: `${tire.manufacturer} ${tire.model}`
    });
    window.location.href = `/dashboard/customer/create-request/tires?${params.toString()}`;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 h-full min-h-[500px] flex flex-col w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Car className="h-5 w-5" />
            Smart Reifen-Berater
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 h-full min-h-[500px] flex flex-col w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Car className="h-5 w-5" />
          Smart Reifen-Berater
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Schritt 1: Fahrzeug auswählen */}
        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Wählen Sie Ihr Fahrzeug:</h3>
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Sie haben noch keine Fahrzeuge gespeichert.</p>
                <button
                  onClick={() => window.location.href = '/dashboard/customer/vehicles'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Fahrzeug hinzufügen
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle.id)}
                    className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-600">
                          Baujahr {vehicle.year}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schritt 2: Reifenart wählen */}
        {step === 2 && selectedVehicle && (
          <div className="space-y-3">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ← Zurück
            </button>
            <h3 className="font-semibold text-gray-900">Welche Reifenart suchen Sie?</h3>
            <div className="grid gap-3">
              {selectedVehicle.summerTires && (
                <button
                  onClick={() => handleTireTypeSelect('SUMMER')}
                  className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900">☀️ Sommerreifen</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedVehicle.summerTires.width}/{selectedVehicle.summerTires.aspectRatio} R{selectedVehicle.summerTires.diameter}
                  </div>
                </button>
              )}
              {selectedVehicle.winterTires && (
                <button
                  onClick={() => handleTireTypeSelect('WINTER')}
                  className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900">❄️ Winterreifen</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedVehicle.winterTires.width}/{selectedVehicle.winterTires.aspectRatio} R{selectedVehicle.winterTires.diameter}
                  </div>
                </button>
              )}
              {selectedVehicle.allSeasonTires && (
                <button
                  onClick={() => handleTireTypeSelect('ALL_SEASON')}
                  className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900">🌦️ Ganzjahresreifen</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedVehicle.allSeasonTires.width}/{selectedVehicle.allSeasonTires.aspectRatio} R{selectedVehicle.allSeasonTires.diameter}
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Schritt 3: Priorität wählen */}
        {step === 3 && (
          <div className="space-y-3">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ← Zurück
            </button>
            <h3 className="font-semibold text-gray-900">Was ist Ihnen am wichtigsten?</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(priorityLabels) as Priority[]).map((priority) => {
                const Icon = priorityIcons[priority];
                return (
                  <button
                    key={priority}
                    onClick={() => handlePrioritySelect(priority)}
                    className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all"
                  >
                    <Icon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900 text-center">
                      {priorityLabels[priority]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Schritt 4: Empfehlungen */}
        {step === 4 && selectedPriority && (
          <div className="space-y-3">
            <button
              onClick={() => setStep(3)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ← Zurück
            </button>
            <h3 className="font-semibold text-gray-900">
              Unsere Top 3 Empfehlungen für {priorityLabels[selectedPriority]}:
            </h3>
            {recommendations.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-gray-700 mb-2 font-semibold">Keine Reifendaten verfügbar</p>
                <p className="text-sm text-gray-600">
                  Für diese Reifengröße ({selectedVehicle?.summerTires?.width || selectedVehicle?.winterTires?.width || selectedVehicle?.allSeasonTires?.width}/{selectedVehicle?.summerTires?.aspectRatio || selectedVehicle?.winterTires?.aspectRatio || selectedVehicle?.allSeasonTires?.aspectRatio} R{selectedVehicle?.summerTires?.diameter || selectedVehicle?.winterTires?.diameter || selectedVehicle?.allSeasonTires?.diameter}) 
                  sind aktuell keine Daten in der EPREL-Datenbank verfügbar oder die Verbindung ist vorübergehend nicht möglich.
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  Sie können trotzdem eine Anfrage erstellen und erhalten Angebote von Werkstätten.
                </p>
                <button
                  onClick={() => {
                    if (!selectedVehicle || !selectedTireType) return;
                    const tireSpec = selectedTireType === 'SUMMER' ? selectedVehicle.summerTires : 
                                   selectedTireType === 'WINTER' ? selectedVehicle.winterTires : 
                                   selectedVehicle.allSeasonTires;
                    if (!tireSpec) return;
                    window.location.href = `/dashboard/customer/create-request/tires?width=${tireSpec.width}&aspectRatio=${tireSpec.aspectRatio}&diameter=${tireSpec.diameter}&season=${selectedTireType}`;
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Trotzdem Anfrage erstellen
                </button>
              </div>
            ) : (
            <div className="space-y-3">
              {recommendations.map((tire, index) => (
                <div
                  key={tire.id}
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-500 transition-all"
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {index === 0 && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                          #1 EMPFEHLUNG
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900">
                      {tire.manufacturer} {tire.model}
                    </h4>
                    <p className="text-sm text-gray-600">{tire.dimension}</p>
                  </div>

                  {/* EU-Label */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                    <div>
                      <div className="text-gray-600 mb-1">Nasshaftung</div>
                      <div className={`${gradeColors[tire.wetGripClass as keyof typeof gradeColors]} text-white font-bold text-center py-1 rounded`}>
                        {tire.wetGripClass}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Effizienz</div>
                      <div className={`${gradeColors[tire.fuelEfficiency as keyof typeof gradeColors]} text-white font-bold text-center py-1 rounded`}>
                        {tire.fuelEfficiency}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Lautstärke</div>
                      <div className="bg-gray-700 text-white font-bold text-center py-1 rounded">
                        {tire.noiseLevel} dB
                      </div>
                    </div>
                  </div>

                  {/* Vorteile */}
                  <div className="bg-blue-50 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">💡 Darum empfehlen wir:</span> {tire.reason}
                    </p>
                  </div>

                  {/* Einsparungen */}
                  {(tire.yearlyFuelSavings || tire.brakingDistanceAdvantage) && (
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      {tire.yearlyFuelSavings && (
                        <div className="flex items-center gap-1 text-green-700">
                          <Zap className="h-3 w-3" />
                          <span>~{tire.yearlyFuelSavings}€/Jahr</span>
                        </div>
                      )}
                      {tire.brakingDistanceAdvantage && (
                        <div className="flex items-center gap-1 text-blue-700">
                          <Shield className="h-3 w-3" />
                          <span>-{tire.brakingDistanceAdvantage}m Bremsweg</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handleRequestTire(tire)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    Angebot anfordern
                  </button>
                </div>
              ))}
            </div>
            )}

            {recommendations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-gray-700">
                ℹ️ Die Daten basieren auf der offiziellen EU-EPREL Datenbank (European Product Database for Energy Labelling). 
                Fordern Sie ein konkretes Angebot an, um aktuelle Preise und Verfügbarkeit zu erhalten.
              </p>
            </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
