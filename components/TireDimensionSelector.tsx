'use client'

interface TireDimensionSelectorProps {
  currentStep: 'width' | 'height' | 'diameter' | 'load' | 'speed'
  selectedWidth?: string
  selectedHeight?: string
  selectedDiameter?: string
  selectedLoad?: string
  selectedSpeed?: string
}

const stepInfo = {
  width: {
    title: 'Reifenbreite',
    description: 'Die Breite des Reifens in Millimetern',
    example: 'z.B. 205, 225, 245',
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  height: {
    title: 'Reifenhöhe',
    description: 'Das Verhältnis von Höhe zu Breite in Prozent',
    example: 'z.B. 55, 60, 65',
    color: '#10b981',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  diameter: {
    title: 'Felgendurchmesser',
    description: 'Der Durchmesser der Felge in Zoll',
    example: 'z.B. 16, 17, 18',
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  load: {
    title: 'Tragfähigkeitsindex',
    description: 'Die maximale Tragfähigkeit des Reifens',
    example: 'z.B. 91 (615 kg)',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  speed: {
    title: 'Geschwindigkeitsindex',
    description: 'Die maximale Geschwindigkeit',
    example: 'z.B. V (240 km/h)',
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
}

export default function TireDimensionSelector({
  currentStep,
  selectedWidth,
  selectedHeight,
  selectedDiameter,
  selectedLoad,
  selectedSpeed,
}: TireDimensionSelectorProps) {
  const steps = ['width', 'height', 'diameter', 'load', 'speed'] as const
  const currentStepIndex = steps.indexOf(currentStep)
  const currentInfo = stepInfo[currentStep]

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex justify-between items-center gap-2 mb-8">
        {steps.map((step, index) => {
          const info = stepInfo[step]
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          
          return (
            <div key={step} className="flex-1 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <div className="text-xs mt-1 text-center font-medium hidden sm:block">
                {info.title.split(' ')[0]}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`absolute h-1 w-[calc(20%-2rem)] mt-5 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ left: `calc(${(index + 1) * 20}% - 1rem)` }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Tire Visualization - Kompakt */}
      <div className="flex justify-center">
        <div className="bg-white rounded-xl p-4 flex items-center justify-center border border-gray-200 shadow-md">
          <svg viewBox="0 0 400 400" className="w-80 h-80">
              {/* Full Tire - Front View */}
              
              {/* Outer tire rubber (smooth, no tread) */}
              <circle
                cx="200"
                cy="200"
                r="150"
                fill="#2d2d2d"
                stroke="#1a1a1a"
                strokeWidth="2"
              />

              {/* Inner sidewall (full circle) */}
              <circle
                cx="200"
                cy="200"
                r="120"
                fill="#3d3d3d"
                opacity="0.8"
              />

              {/* Rim (full circle) */}
              <circle
                cx="200"
                cy="200"
                r="80"
                fill="#c0c5cc"
                stroke="#9ca3af"
                strokeWidth="2"
              />

              {/* Rim spokes */}
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = (i * 360) / 5
                const rad = (angle * Math.PI) / 180
                const x = 200 + Math.cos(rad) * 70
                const y = 200 + Math.sin(rad) * 70
                return (
                  <line
                    key={`spoke-${i}`}
                    x1="200"
                    y1="200"
                    x2={x}
                    y2={y}
                    stroke="#6b7280"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                )
              })}

              {/* Center hub */}
              <circle cx="200" cy="200" r="25" fill="#4b5563" />
              <circle cx="200" cy="200" r="15" fill="#9ca3af" />

              {/* Tire text on sidewall - curved along the tire */}
              <defs>
                <path
                  id="textPathTop"
                  d="M 90 200 A 110 110 0 0 1 310 200"
                  fill="none"
                />
                <path
                  id="textPathBottom"
                  d="M 90 200 A 110 110 0 0 0 310 200"
                  fill="none"
                />
              </defs>
              
              {/* Top text - Tire size split into hover sections */}
              <text fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif">
                <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
                  {/* Width */}
                  <tspan fill="#ffffff" opacity="0.95" className="cursor-help hover:fill-blue-300 transition-colors">
                    {selectedWidth || '???'}
                    <title>Reifenbreite in Millimetern (z.B. 205, 225, 245)</title>
                  </tspan>
                  
                  {/* Separator */}
                  <tspan fill="#ffffff" opacity="0.95">/</tspan>
                  
                  {/* Height/Profile */}
                  <tspan fill="#ffffff" opacity="0.95" className="cursor-help hover:fill-green-300 transition-colors">
                    {selectedHeight || '??'}
                    <title>Querschnittsverhältnis / Reifenhöhe in Prozent zur Breite (z.B. 55, 60, 65)</title>
                  </tspan>
                  
                  {/* Separator and Diameter */}
                  <tspan fill="#ffffff" opacity="0.95"> R</tspan>
                  <tspan fill="#ffffff" opacity="0.95" className="cursor-help hover:fill-amber-300 transition-colors">
                    {selectedDiameter || '??'}
                    <title>Felgendurchmesser in Zoll (z.B. 16, 17, 18)</title>
                  </tspan>
                  
                  {/* Space */}
                  <tspan fill="#ffffff" opacity="0.95"> </tspan>
                  
                  {/* Load Index */}
                  <tspan fill="#ffffff" opacity="0.95" className="cursor-help hover:fill-purple-300 transition-colors">
                    {selectedLoad || '??'}
                    <title>Tragfähigkeitsindex / Lastindex (z.B. 91 = 615 kg pro Reifen)</title>
                  </tspan>
                  
                  {/* Speed Index */}
                  <tspan fill="#ffffff" opacity="0.95" className="cursor-help hover:fill-pink-300 transition-colors">
                    {selectedSpeed || '?'}
                    <title>Geschwindigkeitsindex (T=190 km/h, H=210 km/h, V=240 km/h, W=270 km/h, Y=300 km/h)</title>
                  </tspan>
                </textPath>
              </text>
              
              {/* Brand name on bottom - opposite side with hover */}
              <g className="group">
                <text fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif" opacity="0.9" letterSpacing="1" className="cursor-pointer hover:opacity-100 transition-opacity">
                  <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
                    BEREIFUNG24.DE
                  </textPath>
                </text>
                <title>Ihr Reifenspezialist - Online bestellen und vor Ort montieren lassen</title>
              </g>

              {/* Highlight overlay - subtle glow on current step */}
              {currentStep === 'width' && (
                <circle
                  cx="200"
                  cy="200"
                  r="150"
                  fill="none"
                  stroke={stepInfo.width.color}
                  strokeWidth="3"
                  opacity="0.3"
                  className="animate-pulse"
                />
              )}
              
              {currentStep === 'height' && (
                <circle
                  cx="200"
                  cy="200"
                  r="135"
                  fill="none"
                  stroke={stepInfo.height.color}
                  strokeWidth="3"
                  opacity="0.3"
                  className="animate-pulse"
                />
              )}
              
              {currentStep === 'diameter' && (
                <circle
                  cx="200"
                  cy="200"
                  r="80"
                  fill="none"
                  stroke={stepInfo.diameter.color}
                  strokeWidth="3"
                  opacity="0.3"
                  className="animate-pulse"
                />
              )}
            </svg>
        </div>
      </div>
    </div>
  )
}
