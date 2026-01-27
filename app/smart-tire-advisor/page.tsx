'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Car, Map, Sliders, Calendar, Sparkles, Award, Fuel, Volume2, Shield, TrendingUp } from 'lucide-react'
import TireRecommendationResults from '@/components/TireRecommendationResults'

interface UserProfile {
  // Stufe 1
  width: number
  aspectRatio: number
  diameter: number
  vehicleType: 'small' | 'medium' | 'premium' | 'suv' | 'van'
  kmPerYear: number
  
  // Stufe 2
  usageCity: number
  usageLandroad: number
  usageHighway: number
  drivingStyle: 'sporty' | 'normal' | 'comfort'
  isElectric: boolean
  
  // Stufe 3
  prioritySafety: number
  priorityFuelSaving: number
  priorityQuietness: number
  priorityDurability: number
  priorityValue: number
  
  // Stufe 4
  season: 'summer' | 'winter' | 'all-season'
  needs3PMSF: boolean
  needsIceGrip: boolean
}

export default function SmartTireAdvisor() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<any>(null)
  
  const [profile, setProfile] = useState<UserProfile>({
    // Stufe 1 - Defaults
    width: 205,
    aspectRatio: 55,
    diameter: 16,
    vehicleType: 'medium',
    kmPerYear: 15000,
    
    // Stufe 2 - Defaults
    usageCity: 40,
    usageLandroad: 30,
    usageHighway: 30,
    drivingStyle: 'normal',
    isElectric: false,
    
    // Stufe 3 - Balanced defaults
    prioritySafety: 30,
    priorityFuelSaving: 20,
    priorityQuietness: 15,
    priorityDurability: 20,
    priorityValue: 15,
    
    // Stufe 4 - Defaults
    season: 'summer',
    needs3PMSF: false,
    needsIceGrip: false
  })
  
  // Auto-Adjust für Nutzungsprofil (Stufe 2)
  const adjustUsageSliders = (type: 'usageCity' | 'usageLandroad' | 'usageHighway', value: number) => {
    const others = ['usageCity', 'usageLandroad', 'usageHighway'].filter(k => k !== type) as Array<keyof UserProfile>
    const remaining = 100 - value
    const distribution = remaining / 2
    
    setProfile(prev => ({
      ...prev,
      [type]: value,
      [others[0]]: distribution,
      [others[1]]: distribution
    }))
  }
  
  // Auto-Adjust für Prioritäten (Stufe 3)
  const adjustPriorities = (key: keyof UserProfile, value: number) => {
    const priorityKeys = ['prioritySafety', 'priorityFuelSaving', 'priorityQuietness', 'priorityDurability', 'priorityValue']
    const otherKeys = priorityKeys.filter(k => k !== key) as Array<keyof UserProfile>
    const remaining = 100 - value
    const distribution = remaining / otherKeys.length
    
    const updated = { ...profile, [key]: value }
    otherKeys.forEach(k => {
      updated[k] = Math.round(distribution)
    })
    
    setProfile(updated as UserProfile)
  }
  
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/smart-tire-advisor/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data)
        setStep(5) // Ergebnis-Seite
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler bei der Empfehlung')
      }
    } catch (error) {
      console.error('Error getting recommendations:', error)
      alert('Fehler bei der Verbindung')
    } finally {
      setLoading(false)
    }
  }
  
  const canProceed = () => {
    if (step === 1) {
      return profile.width > 0 && profile.aspectRatio > 0 && profile.diameter > 0
    }
    return true
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        {step <= 4 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Schritt {step} von 4
              </span>
              <span className="text-sm text-gray-500">
                {step === 1 && 'Fahrzeug & Grunddaten'}
                {step === 2 && 'Nutzungsprofil'}
                {step === 3 && 'Prioritäten'}
                {step === 4 && 'Saison & Extras'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Stufe 1: Fahrzeug & Grunddaten */}
        {step === 1 && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Car className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold">Ihr Fahrzeug</h2>
                <p className="text-gray-600">Grundlegende Informationen für die perfekte Empfehlung</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Reifengröße */}
              <div>
                <label className="block text-sm font-medium mb-3">Reifengröße</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Breite (mm)</label>
                    <input
                      type="number"
                      value={profile.width}
                      onChange={(e) => setProfile({ ...profile, width: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="205"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Querschnitt (%)</label>
                    <input
                      type="number"
                      value={profile.aspectRatio}
                      onChange={(e) => setProfile({ ...profile, aspectRatio: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="55"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Durchmesser (Zoll)</label>
                    <input
                      type="number"
                      value={profile.diameter}
                      onChange={(e) => setProfile({ ...profile, diameter: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="16"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Format: {profile.width}/{profile.aspectRatio} R{profile.diameter}
                </p>
              </div>
              
              {/* Fahrzeugtyp */}
              <div>
                <label className="block text-sm font-medium mb-3">Fahrzeugtyp</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { value: 'small', label: 'Kleinwagen', icon: '🚗' },
                    { value: 'medium', label: 'Mittelklasse', icon: '🚙' },
                    { value: 'premium', label: 'Oberklasse', icon: '🏎️' },
                    { value: 'suv', label: 'SUV/Geländewagen', icon: '🚐' },
                    { value: 'van', label: 'Transporter', icon: '🚚' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setProfile({ ...profile, vehicleType: type.value as any })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        profile.vehicleType === type.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Kilometerleistung */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Jährliche Kilometerleistung: <span className="text-blue-600">{profile.kmPerYear.toLocaleString('de-DE')} km</span>
                </label>
                <input
                  type="range"
                  min="5000"
                  max="50000"
                  step="1000"
                  value={profile.kmPerYear}
                  onChange={(e) => setProfile({ ...profile, kmPerYear: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5.000 km</span>
                  <span>50.000 km</span>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Stufe 2: Nutzungsprofil */}
        {step === 2 && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Map className="h-8 w-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold">Nutzungsprofil</h2>
                <p className="text-gray-600">Wie nutzen Sie Ihr Fahrzeug hauptsächlich?</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Nutzungsverteilung */}
              <div>
                <label className="block text-sm font-medium mb-4">Hauptnutzung (Gesamt: 100%)</label>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
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
                    <div className="flex justify-between mb-2">
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
                    <div className="flex justify-between mb-2">
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
              
              {/* Fahrstil */}
              <div>
                <label className="block text-sm font-medium mb-3">Fahrstil</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'sporty', label: 'Sportlich', icon: '🏁', desc: 'Dynamisch & agil' },
                    { value: 'normal', label: 'Normal', icon: '🚗', desc: 'Ausgewogen' },
                    { value: 'comfort', label: 'Komfort', icon: '😌', desc: 'Ruhig & entspannt' }
                  ].map(style => (
                    <button
                      key={style.value}
                      onClick={() => setProfile({ ...profile, drivingStyle: style.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        profile.drivingStyle === style.value
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{style.icon}</div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs text-gray-600">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Elektroauto */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="electric"
                  checked={profile.isElectric}
                  onChange={(e) => setProfile({ ...profile, isElectric: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="electric" className="cursor-pointer">
                  <div className="font-medium">⚡ Elektro- oder Hybrid-Fahrzeug</div>
                  <div className="text-sm text-gray-600">Niedriger Rollwiderstand für mehr Reichweite</div>
                </label>
              </div>
            </div>
          </Card>
        )}
        
        {/* Stufe 3: Prioritäten */}
        {step === 3 && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sliders className="h-8 w-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold">Ihre Prioritäten</h2>
                <p className="text-gray-600">Was ist Ihnen bei Reifen am wichtigsten? (Gesamt: 100 Punkte)</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Sicherheit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Sicherheit (Nasshaftung)</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{profile.prioritySafety}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.prioritySafety}
                  onChange={(e) => adjustPriorities('prioritySafety', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">Kurzer Bremsweg auf nasser Fahrbahn</p>
              </div>
              
              {/* Kraftstoffersparnis */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Kraftstoffersparnis</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{profile.priorityFuelSaving}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.priorityFuelSaving}
                  onChange={(e) => adjustPriorities('priorityFuelSaving', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">Niedriger Rollwiderstand spart Sprit</p>
              </div>
              
              {/* Geräuschkomfort */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Leise Fahrt</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{profile.priorityQuietness}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.priorityQuietness}
                  onChange={(e) => adjustPriorities('priorityQuietness', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">Geringer Abrollgeräuschpegel</p>
              </div>
              
              {/* Langlebigkeit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Langlebigkeit</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{profile.priorityDurability}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.priorityDurability}
                  onChange={(e) => adjustPriorities('priorityDurability', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">Hohe Laufleistung & Haltbarkeit</p>
              </div>
              
              {/* Preis-Leistung */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Preis-Leistung</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{profile.priorityValue}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.priorityValue}
                  onChange={(e) => adjustPriorities('priorityValue', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">Gutes Verhältnis von Qualität zu Kosten</p>
              </div>
              
              {/* Summe Anzeige */}
              <div className="p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Gesamt-Punkte:</span>
                  <span className={`text-xl font-bold ${
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
          </Card>
        )}
        
        {/* Stufe 4: Saison & Extras */}
        {step === 4 && (
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <h2 className="text-2xl font-bold">Saison & Extras</h2>
                <p className="text-gray-600">Letzter Schritt vor Ihrer persönlichen Empfehlung</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Saison */}
              <div>
                <label className="block text-sm font-medium mb-3">Welche Reifen suchen Sie?</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'summer', label: 'Sommerreifen', icon: '☀️', desc: 'April - Oktober' },
                    { value: 'winter', label: 'Winterreifen', icon: '❄️', desc: 'Oktober - April' },
                    { value: 'all-season', label: 'Ganzjahresreifen', icon: '🌦️', desc: 'Ganzjährig' }
                  ].map(season => (
                    <button
                      key={season.value}
                      onClick={() => setProfile({ ...profile, season: season.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        profile.season === season.value
                          ? 'border-orange-600 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{season.icon}</div>
                      <div className="font-medium">{season.label}</div>
                      <div className="text-xs text-gray-600">{season.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 3PMSF */}
              {(profile.season === 'winter' || profile.season === 'all-season') && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="3pmsf"
                      checked={profile.needs3PMSF}
                      onChange={(e) => setProfile({ ...profile, needs3PMSF: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label htmlFor="3pmsf" className="cursor-pointer flex-1">
                      <div className="font-medium">❄️ 3PMSF-Symbol erforderlich</div>
                      <div className="text-sm text-gray-600">
                        Schneeflocken-Symbol für sichere Winternutzung (empfohlen)
                      </div>
                    </label>
                  </div>
                </div>
              )}
              
              {/* Ice Grip */}
              {profile.season === 'winter' && (
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="icegrip"
                      checked={profile.needsIceGrip}
                      onChange={(e) => setProfile({ ...profile, needsIceGrip: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label htmlFor="icegrip" className="cursor-pointer flex-1">
                      <div className="font-medium">🧊 Ice Grip Symbol</div>
                      <div className="text-sm text-gray-600">
                        Speziell für extreme Eis- und Schnee-Bedingungen (Nordeuropa)
                      </div>
                    </label>
                  </div>
                </div>
              )}
              
              {/* Info-Box */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-blue-900 mb-1">
                      Bereit für Ihre persönliche Empfehlung!
                    </div>
                    <div className="text-sm text-blue-800">
                      Basierend auf Ihren Angaben analysieren wir über 125.000 Reifen aus der offiziellen 
                      EU-EPREL-Datenbank und finden die perfekten Reifen für Sie.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Navigation */}
        {step <= 4 && (
          <div className="flex justify-between mt-6">
            <Button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Weiter
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
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
        )}
        
        {/* Ergebnis-Seite (Stufe 5) */}
        {step === 5 && recommendations && (
          <TireRecommendationResults 
            data={recommendations} 
            onReset={() => {
              setStep(1)
              setRecommendations(null)
            }} 
          />
        )}
      </div>
    </div>
  )
}
