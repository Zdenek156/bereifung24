'use client'

import { useState } from 'react'
import TireDimensionSelector from '@/components/TireDimensionSelector'
import { Button } from '@/components/ui/button'

type StepType = 'width' | 'height' | 'diameter' | 'load' | 'speed'

export default function TireVisualizationDemoPage() {
  const [currentStep, setCurrentStep] = useState<StepType>('width')
  const [selectedWidth, setSelectedWidth] = useState<string>('')
  const [selectedHeight, setSelectedHeight] = useState<string>('')
  const [selectedDiameter, setSelectedDiameter] = useState<string>('')
  const [selectedLoad, setSelectedLoad] = useState<string>('')
  const [selectedSpeed, setSelectedSpeed] = useState<string>('')

  const widths = ['195', '205', '215', '225', '235', '245', '255', '265', '275', '285']
  const heights = ['35', '40', '45', '50', '55', '60', '65']
  const diameters = ['15', '16', '17', '18', '19', '20']
  const loads = ['84', '86', '88', '91', '94', '97', '100']
  const speeds = ['T', 'H', 'V', 'W', 'Y']

  const handleSelect = (value: string) => {
    switch (currentStep) {
      case 'width':
        setSelectedWidth(value)
        setCurrentStep('height')
        break
      case 'height':
        setSelectedHeight(value)
        setCurrentStep('diameter')
        break
      case 'diameter':
        setSelectedDiameter(value)
        setCurrentStep('load')
        break
      case 'load':
        setSelectedLoad(value)
        setCurrentStep('speed')
        break
      case 'speed':
        setSelectedSpeed(value)
        break
    }
  }

  const getOptions = () => {
    switch (currentStep) {
      case 'width': return widths
      case 'height': return heights
      case 'diameter': return diameters
      case 'load': return loads
      case 'speed': return speeds
      default: return []
    }
  }

  const reset = () => {
    setCurrentStep('width')
    setSelectedWidth('')
    setSelectedHeight('')
    setSelectedDiameter('')
    setSelectedLoad('')
    setSelectedSpeed('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚗 Reifendimension Visualisierung - Demo
          </h1>
          <p className="text-gray-600">
            Durchlaufe die Schritte und sieh wie sich die Visualisierung anpasst
          </p>
        </div>

        {/* Layout: Reifen links, Auswahl rechts */}
        <div className="flex gap-6 items-start">
          {/* Visual Selector Component - Links */}
          <div className="flex-shrink-0">
            <TireDimensionSelector
              currentStep={currentStep}
              selectedWidth={selectedWidth}
              selectedHeight={selectedHeight}
              selectedDiameter={selectedDiameter}
              selectedLoad={selectedLoad}
              selectedSpeed={selectedSpeed}
            />
          </div>

          {/* Selection Buttons - Rechts daneben, kompakter */}
          {currentStep !== 'speed' || !selectedSpeed ? (
            <div className="flex-1 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Wähle einen Wert:
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {getOptions().map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all hover:scale-105 ${
                      (currentStep === 'width' && selectedWidth === option) ||
                      (currentStep === 'height' && selectedHeight === option) ||
                      (currentStep === 'diameter' && selectedDiameter === option) ||
                      (currentStep === 'load' && selectedLoad === option) ||
                      (currentStep === 'speed' && selectedSpeed === option)
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {option}
                    {currentStep === 'width' && 'mm'}
                    {currentStep === 'height' && '%'}
                    {currentStep === 'diameter' && '"'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
              <div className="text-center">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-xl font-bold text-green-800 mb-3">
                  Auswahl abgeschlossen!
                </h2>
                <div className="bg-white rounded-lg p-4 mb-4 border-2 border-green-300">
                  <p className="text-sm text-gray-600 mb-1">Ihre gewählte Reifengröße:</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono">
                    {selectedWidth}/{selectedHeight} R{selectedDiameter} {selectedLoad}{selectedSpeed}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={reset}
                    className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    🔄 Neu beginnen
                  </button>
                  <button
                    onClick={() => alert('In der echten App würde jetzt die Suche starten')}
                    className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg border-2 border-blue-600 hover:bg-blue-600 transition-colors"
                  >
                    🔍 Reifen suchen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-4 flex justify-center gap-3">
          {currentStep !== 'width' && (
            <button
              onClick={() => {
                const steps: StepType[] = ['width', 'height', 'diameter', 'load', 'speed']
                const currentIndex = steps.indexOf(currentStep)
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1])
                }
              }}
              className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
            >
              ← Zurück
            </button>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-semibold bg-white text-gray-600 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            🔄 Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  )
}
