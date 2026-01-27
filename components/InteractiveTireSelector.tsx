'use client'

import { useState } from 'react'

const TIRE_WIDTHS = [135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325, 335, 345, 355, 365, 375, 385, 395]
const ASPECT_RATIOS = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]
const DIAMETERS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]

// Load Index mit Tragfähigkeit in kg
const LOAD_INDEX_MAP: Record<number, number> = {
  50: 190, 55: 218, 60: 250, 65: 290, 70: 335, 75: 387, 80: 450, 82: 475, 84: 500, 85: 515, 86: 530, 87: 545, 88: 560, 89: 580, 90: 600,
  91: 615, 92: 630, 93: 650, 94: 670, 95: 690, 96: 710, 97: 730, 98: 750, 99: 775, 100: 800, 101: 825, 102: 850, 103: 875, 104: 900, 105: 925,
  106: 950, 107: 975, 108: 1000, 109: 1030, 110: 1060, 111: 1090, 112: 1120, 113: 1150, 114: 1180, 115: 1215, 116: 1250, 117: 1285, 118: 1320, 119: 1360, 120: 1400
}
const LOAD_INDICES = Object.keys(LOAD_INDEX_MAP).map(Number)

// Speed Rating mit Geschwindigkeit in km/h
const SPEED_RATING_MAP: Record<string, number> = {
  L: 120, M: 130, N: 140, P: 150, Q: 160, R: 170, S: 180, T: 190, U: 200, H: 210, V: 240, W: 270, Y: 300, ZR: 240
}
const SPEED_RATINGS = Object.keys(SPEED_RATING_MAP)

interface TireData {
  width: string
  aspectRatio: string
  diameter: string
  loadIndex: string
  speedRating: string
}

interface InteractiveTireSelectorProps {
  tireData: TireData
  onChange: (field: keyof TireData, value: string) => void
  label?: string
  pathIdPrefix?: string
}

export default function InteractiveTireSelector({
  tireData,
  onChange,
  label = 'Reifengröße',
  pathIdPrefix = 'tire'
}: InteractiveTireSelectorProps) {
  const handleChange = (field: keyof TireData, value: string) => {
    onChange(field, value)
  }

  return (
    <div className="space-y-4">
      {label && <h4 className="text-lg font-semibold text-gray-900 mb-4">{label}</h4>}
      
      {/* Responsive Layout: Reifen oben, Auswahl darunter auf Mobile */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Reifen-Card */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-md p-2 sm:p-4">
          {/* Progress Indicator */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs ${tireData.width ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tireData.width ? '✓' : '1'}
              </div>
              <div className={`w-10 h-0.5 ${tireData.aspectRatio ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs ${tireData.aspectRatio ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tireData.aspectRatio ? '✓' : '2'}
              </div>
              <div className={`w-10 h-0.5 ${tireData.diameter ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs ${tireData.diameter ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tireData.diameter ? '✓' : '3'}
              </div>
              <div className={`w-10 h-0.5 ${tireData.loadIndex ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs ${tireData.loadIndex ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tireData.loadIndex ? '✓' : '4'}
              </div>
              <div className={`w-10 h-0.5 ${tireData.speedRating ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs ${tireData.speedRating ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tireData.speedRating ? '✓' : '5'}
              </div>
            </div>
          </div>

          {/* SVG Reifen */}
          <svg viewBox="0 0 400 400" className="w-full h-auto">
            <defs>
              <path id={`${pathIdPrefix}TextPathTop`} d="M 200,80 A 120,120 0 0,1 320,200" />
              <path id={`${pathIdPrefix}TextPathBottom`} d="M 80,200 A 120,120 0 0,0 200,320" />
            </defs>
            
            {/* Reifenringe */}
            <circle cx="200" cy="200" r="150" fill="#2d2d2d" />
            <circle cx="200" cy="200" r="120" fill="#3d3d3d" />
            <circle cx="200" cy="200" r="80" fill="#c0c5cc" />
            
            {/* Dimensionen auf Reifen */}
            <text fill="#ffffff" fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif">
              <textPath href={`#${pathIdPrefix}TextPathTop`} startOffset="50%" textAnchor="middle">
                <title>{tireData.width || '???'}/{tireData.aspectRatio || '??'} R{tireData.diameter || '??'} {tireData.loadIndex || '??'}{tireData.speedRating || '?'}</title>
                {tireData.width || '???'}/{tireData.aspectRatio || '??'} R{tireData.diameter || '??'} {tireData.loadIndex || '??'}{tireData.speedRating || '?'}
              </textPath>
            </text>
            
            {/* Marke unten */}
            <text fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.9" letterSpacing="1">
              <textPath href={`#${pathIdPrefix}TextPathBottom`} startOffset="50%" textAnchor="middle">
                BEREIFUNG24.DE
              </textPath>
            </text>
          </svg>
        </div>

        {/* Auswahlbuttons unter dem Reifen auf Mobile, rechts daneben auf Desktop */}
        <div className="w-full flex-1 space-y-3 sm:space-y-4">
          <h4 className="text-base sm:text-lg font-bold text-gray-800">
            {!tireData.width ? 'Breite wählen (mm):' :
             !tireData.aspectRatio ? 'Querschnitt wählen (%):' :
             !tireData.diameter ? 'Felgengröße wählen (Zoll):' :
             !tireData.loadIndex ? 'Tragfähigkeit wählen:' :
             'Geschwindigkeitsindex wählen:'}
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-2">
            {!tireData.width && TIRE_WIDTHS.map(w => (
              <button
                type="button"
                key={w}
                onClick={() => handleChange('width', String(w))}
                className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-all hover:scale-105 ${
                  tireData.width === String(w)
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {w}
              </button>
            ))}
            {tireData.width && !tireData.aspectRatio && ASPECT_RATIOS.map(ar => (
              <button
                type="button"
                key={ar}
                onClick={() => handleChange('aspectRatio', String(ar))}
                className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-all hover:scale-105 ${
                  tireData.aspectRatio === String(ar)
                    ? 'bg-green-500 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                }`}
              >
                {ar}
              </button>
            ))}
            {tireData.width && tireData.aspectRatio && !tireData.diameter && DIAMETERS.map(d => (
              <button
                type="button"
                key={d}
                onClick={() => handleChange('diameter', String(d))}
                className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-all hover:scale-105 ${
                  tireData.diameter === String(d)
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
                }`}
              >
                {d}"
              </button>
            ))}
            {tireData.width && tireData.aspectRatio && tireData.diameter && !tireData.loadIndex && LOAD_INDICES.map(li => (
              <button
                type="button"
                key={li}
                onClick={() => handleChange('loadIndex', String(li))}
                className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-all hover:scale-105 ${
                  tireData.loadIndex === String(li)
                    ? 'bg-purple-500 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                }`}
                title={`${LOAD_INDEX_MAP[li]} kg`}
              >
                {li}
              </button>
            ))}
            {tireData.width && tireData.aspectRatio && tireData.diameter && tireData.loadIndex && !tireData.speedRating && SPEED_RATINGS.map(sr => (
              <button
                type="button"
                key={sr}
                onClick={() => handleChange('speedRating', sr)}
                className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-all hover:scale-105 ${
                  tireData.speedRating === sr
                    ? 'bg-pink-500 text-white border-pink-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400'
                }`}
                title={`${SPEED_RATING_MAP[sr]} km/h`}
              >
                {sr}
              </button>
            ))}
          </div>
          
          {/* Zurück-Button */}
          {(tireData.width || tireData.aspectRatio || tireData.diameter || tireData.loadIndex || tireData.speedRating) && (
            <button
              type="button"
              onClick={() => {
                if (tireData.speedRating) {
                  handleChange('speedRating', '')
                } else if (tireData.loadIndex) {
                  handleChange('loadIndex', '')
                } else if (tireData.diameter) {
                  handleChange('diameter', '')
                } else if (tireData.aspectRatio) {
                  handleChange('aspectRatio', '')
                } else if (tireData.width) {
                  handleChange('width', '')
                }
              }}
              className="mt-3 px-4 py-2 text-sm font-semibold bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
            >
              ← Zurück
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {tireData.width && tireData.aspectRatio && tireData.diameter && (
        <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <p className="text-sm font-medium text-primary-800">
            Ausgewählte Reifengröße: <span className="text-2xl font-bold">
              {tireData.width}/{tireData.aspectRatio} R{tireData.diameter}
              {tireData.loadIndex && ` ${tireData.loadIndex}`}
              {tireData.speedRating && tireData.speedRating}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
