'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Info, AlertTriangle, Fuel, Droplet, Volume2, Shield, Star, TrendingUp, Check } from 'lucide-react'

interface ScoreBreakdown {
  euLabel: number
  seasonMatch: number
  brandReputation: number
  usageMatch: number
  drivingStyleMatch: number
}

interface ScoredTire {
  tire: {
    supplierName: string
    modelName: string
    tyreDimension: string
    tyreClass: string
    fuelEfficiencyClass: string | null
    wetGripClass: string | null
    externalRollingNoiseLevel: number | null
    externalRollingNoiseClass: string | null
    has3PMSF: boolean
    hasIceGrip: boolean
  }
  score: number
  scoreBreakdown: ScoreBreakdown
  reasons: string[]
  warnings: string[]
}

interface RecommendationData {
  recommendations: ScoredTire[]
  totalFound: number
  profile: {
    dimension: string
    season: string
    topPriority: string
  }
}

interface Props {
  data: RecommendationData
  onReset: () => void
}

export default function TireRecommendationResults({ data, onReset }: Props) {
  const topRecommendations = data.recommendations.slice(0, 5)
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 75) return 'text-blue-600 bg-blue-100'
    if (score >= 65) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }
  
  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Hervorragend'
    if (score >= 75) return 'Sehr gut'
    if (score >= 65) return 'Gut'
    return 'Akzeptabel'
  }
  
  const getLabelColor = (label: string | null) => {
    if (!label) return 'bg-gray-400'
    if (label === 'A') return 'bg-green-500'
    if (label === 'B') return 'bg-lime-500'
    if (label === 'C') return 'bg-yellow-500'
    if (label === 'D') return 'bg-orange-500'
    return 'bg-red-500'
  }
  
  const getNoiseClass = (noiseClass: string | null) => {
    if (!noiseClass) return '❓'
    if (noiseClass === 'A') return '🔇'
    if (noiseClass === 'B') return '🔉'
    return '🔊'
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full mb-4">
          <Award className="h-5 w-5" />
          <span className="font-semibold">{data.totalFound} passende Reifen gefunden</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Ihre Top 5 Empfehlungen</h1>
        <p className="text-gray-600">
          Für {data.profile.dimension} | {data.profile.season} | Priorität: {data.profile.topPriority}
        </p>
      </div>
      
      {/* Top Recommendations */}
      <div className="space-y-4">
        {topRecommendations.map((item, index) => (
          <Card key={index} className={`p-6 ${index === 0 ? 'border-2 border-yellow-400 shadow-lg' : ''}`}>
            {index === 0 && (
              <div className="flex items-center gap-2 mb-4 text-yellow-600">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold">Beste Empfehlung</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Tire Info */}
              <div className="lg:col-span-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-600">#{index + 1}</div>
                    <h3 className="text-xl font-bold">{item.tire.supplierName}</h3>
                    <p className="text-lg text-gray-700">{item.tire.modelName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.tire.tyreDimension} | {item.tire.tyreClass}
                      {item.tire.has3PMSF && ' ❄️'}
                      {item.tire.hasIceGrip && ' 🧊'}
                    </p>
                  </div>
                  
                  {/* Score Badge */}
                  <div className="text-center">
                    <div className={`inline-flex flex-col items-center px-4 py-2 rounded-lg ${getScoreColor(item.score)}`}>
                      <div className="text-3xl font-bold">{Math.round(item.score)}</div>
                      <div className="text-xs font-medium">von 100</div>
                    </div>
                    <div className="text-xs font-medium mt-1">{getScoreLabel(item.score)}</div>
                  </div>
                </div>
                
                {/* EU Labels */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Kraftstoff</div>
                    <div className={`inline-block w-12 h-12 ${getLabelColor(item.tire.fuelEfficiencyClass)} text-white font-bold text-xl rounded flex items-center justify-center`}>
                      {item.tire.fuelEfficiencyClass || '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Nasshaftung</div>
                    <div className={`inline-block w-12 h-12 ${getLabelColor(item.tire.wetGripClass)} text-white font-bold text-xl rounded flex items-center justify-center`}>
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
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-2">
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
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2 text-sm font-semibold text-yellow-800 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      Hinweise
                    </div>
                    <ul className="space-y-1">
                      {item.warnings.map((warning, i) => (
                        <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                          <span className="mt-0.5">⚠️</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Right: Score Breakdown */}
              <div className="lg:border-l lg:pl-6">
                <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Bewertungsdetails
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5">
                        <Fuel className="h-3.5 w-3.5 text-green-600" />
                        <span>EU-Label</span>
                      </div>
                      <span className="font-semibold">{Math.round(item.scoreBreakdown.euLabel)}/40</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(item.scoreBreakdown.euLabel / 40) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                        <span>Saison-Match</span>
                      </div>
                      <span className="font-semibold">{Math.round(item.scoreBreakdown.seasonMatch)}/25</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.scoreBreakdown.seasonMatch / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-purple-600" />
                        <span>Markenqualität</span>
                      </div>
                      <span className="font-semibold">{Math.round(item.scoreBreakdown.brandReputation)}/15</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(item.scoreBreakdown.brandReputation / 15) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-orange-600" />
                        <span>Nutzung</span>
                      </div>
                      <span className="font-semibold">{Math.round(item.scoreBreakdown.usageMatch)}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${(item.scoreBreakdown.usageMatch / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-yellow-600" />
                        <span>Fahrstil</span>
                      </div>
                      <span className="font-semibold">{Math.round(item.scoreBreakdown.drivingStyleMatch)}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${(item.scoreBreakdown.drivingStyleMatch / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Hinweis zur Empfehlung</p>
            <p>
              Die Bewertung basiert auf offiziellen EU-Reifenlabel-Daten und Ihren persönlichen Prioritäten. 
              Die Reihenfolge berücksichtigt Sicherheit, Effizienz, Markenqualität und Ihr Nutzungsprofil. 
              Für konkrete Preise und Verfügbarkeit kontaktieren Sie bitte unseren Service.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={onReset} variant="outline">
          Neue Suche starten
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Kontakt aufnehmen
        </Button>
      </div>
    </div>
  )
}
