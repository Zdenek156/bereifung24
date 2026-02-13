'use client'

import { useEffect } from 'react'
import InfoTooltip from './InfoTooltip'

interface FilterOption {
  packageType: string
  label: string
  info: string
}

interface FilterGroup {
  label: string
  options: FilterOption[]
  multiSelect?: boolean // Default: false (radio), true = checkboxes
  note?: string // Optional warning/info note below the filter group
}

interface ServiceFilterConfig {
  groups: FilterGroup[]
}

interface ServiceFiltersProps {
  selectedService: string
  selectedPackages: string[]
  onFiltersChange: (selectedPackages: string[]) => void
  // Mixed tire dimensions (if front ≠ rear)
  tireDimensionsFront?: string
  tireDimensionsRear?: string
}

const FILTER_CONFIG: Record<string, ServiceFilterConfig> = {
  TIRE_CHANGE: {
    groups: [
      {
        label: 'Anzahl Reifen',
        multiSelect: false, // Radio buttons - nur eine Auswahl
        options: [
          { 
            packageType: 'two_tires', 
            label: '2 Reifen', 
            info: 'Wechsel von 2 Reifen (z.B. nur Vorderachse oder nur Hinterachse)'
          },
          { 
            packageType: 'four_tires', 
            label: '4 Reifen (alle)', 
            info: 'Kompletter Reifenwechsel für alle 4 Räder'
          }
        ]
      },
      {
        label: 'Zusatzleistungen',
        multiSelect: true, // Checkboxes - mehrere möglich
        options: [
          { 
            packageType: 'with_disposal', 
            label: 'Mit Entsorgung', 
            info: 'Fachgerechte Entsorgung der alten Reifen inklusive'
          },
          { 
            packageType: 'runflat', 
            label: 'Runflat-Reifen', 
            info: 'Spezieller Service für Runflat-Reifen (notlauftauglich, ohne Notrad). Erfordert besondere Montagetechniken mit entsprechendem Aufpreis.'
          }
        ]
      }
    ]
  },
  WHEEL_CHANGE: {
    groups: [
      {
        label: 'Zusatzleistungen',
        multiSelect: true, // Checkboxes - mehrere möglich
        options: [
          { 
            packageType: 'with_balancing', 
            label: 'Mit Auswuchten', 
            info: 'Radwechsel inkl. professionellem Auswuchten für ruhigen Lauf und gleichmäßigen Reifenverschleiß'
          },
          { 
            packageType: 'with_storage', 
            label: 'Mit Einlagerung', 
            info: 'Radwechsel inkl. fachgerechte Einlagerung Ihrer Reifen'
          }
        ]
      }
    ]
  },
  ALIGNMENT_BOTH: {
    groups: [
      {
        label: 'Nur Messung',
        multiSelect: false, // Radio buttons innerhalb der Gruppe
        options: [
          { 
            packageType: 'measurement_front', 
            label: 'Vorderachse', 
            info: 'Vermessung der Vorderachse mit detailliertem Prüfprotokoll'
          },
          { 
            packageType: 'measurement_rear', 
            label: 'Hinterachse', 
            info: 'Vermessung der Hinterachse mit detailliertem Prüfprotokoll'
          },
          { 
            packageType: 'measurement_both', 
            label: 'Beide Achsen', 
            info: 'Komplette Vermessung von Vorder- und Hinterachse mit Gesamtprotokoll'
          }
        ]
      },
      {
        label: 'Mit Einstellung',
        multiSelect: false, // Radio buttons innerhalb der Gruppe
        options: [
          { 
            packageType: 'adjustment_front', 
            label: 'Vorderachse', 
            info: 'Vermessung und präzise Einstellung der Vorderachse für optimalen Geradeauslauf'
          },
          { 
            packageType: 'adjustment_rear', 
            label: 'Hinterachse', 
            info: 'Vermessung und präzise Einstellung der Hinterachse'
          },
          { 
            packageType: 'adjustment_both', 
            label: 'Beide Achsen', 
            info: 'Komplette Vermessung und Einstellung beider Achsen für perfekte Fahreigenschaften'
          }
        ]
      },
      {
        label: 'Komplett-Service',
        multiSelect: false, // Radio button
        options: [
          { 
            packageType: 'full_service', 
            label: 'Komplett mit Inspektion', 
            info: 'Achsvermessung, Einstellung und zusätzliche Fahrwerksinspektion (Stoßdämpfer, Spurstangen, etc.)'
          }
        ]
      }
    ]
  },
  TIRE_REPAIR: {
    groups: [
      {
        label: 'Reparatur-Art',
        multiSelect: false, // Radio buttons
        options: [
          { 
            packageType: 'foreign_object', 
            label: 'Fremdkörper-Reparatur', 
            info: 'Professionelle Reparatur von Reifenschäden durch Fremdkörper wie Nägel oder Schrauben'
          },
          { 
            packageType: 'valve_damage', 
            label: 'Ventilschaden', 
            info: 'Austausch oder Reparatur defekter oder undichter Ventile'
          }
        ]
      }
    ]
  },
  MOTORCYCLE_TIRE: {
    groups: [
      {
        label: 'Position',
        multiSelect: false, // Radio buttons
        options: [
          { 
            packageType: 'front', 
            label: 'Vorderrad', 
            info: 'Reifenwechsel am Vorderrad des Motorrads'
          },
          { 
            packageType: 'rear', 
            label: 'Hinterrad', 
            info: 'Reifenwechsel am Hinterrad des Motorrads'
          },
          { 
            packageType: 'both', 
            label: 'Beide Räder', 
            info: 'Kompletter Reifenwechsel vorne und hinten für optimale Fahreigenschaften'
          }
        ]
      }
    ]
  },
  CLIMATE_SERVICE: {
    groups: [
      {
        label: 'Service-Umfang',
        multiSelect: false, // Radio buttons
        options: [
          { 
            packageType: 'check', 
            label: 'Basis-Check', 
            info: 'Sichtprüfung der Klimaanlage, Funktionstest und Temperaturmessung. Prüfung auf Leckagen und Kompressor-Funktion. Keine Befüllung enthalten.'
          },
          { 
            packageType: 'basic', 
            label: 'Standard-Service', 
            info: 'Funktionscheck, Druckprüfung und Nachfüllen von Kältemittel (R134a/R1234yf). Bis zu 100ml inklusive, darüber hinaus nach Bedarf gegen Aufpreis.'
          },
          { 
            packageType: 'comfort', 
            label: 'Komfort-Service', 
            info: 'Standard-Service inkl. Kältemittel-Nachfüllung (bis 200ml), Wechsel des Innenraumfilters (Pollenfilter) und Reinigung der Verdampfer-Lamellen für optimale Luftqualität.'
          },
          { 
            packageType: 'premium', 
            label: 'Premium-Service', 
            info: 'Kompletter Service: Vollständige Kältemittel-Befüllung (bis 500ml), professionelle Desinfektion des Klimasystems mit Ozon/Ultraschall, Premium-Aktivkohlefilter, UV-Additiv gegen Bakterien und optionaler Duftstoff.'
          }
        ],
        note: '💡 Hinweis: Bei größerem Kältemittelverlust (über die inkludierten Mengen hinaus) berechnen die meisten Werkstätten einen Aufpreis pro 100ml Kältemittel (ca. 15-25€). Der genaue Bedarf wird vor Ort ermittelt.'
      }
    ]
  }
}

export default function ServiceFilters({ 
  selectedService, 
  selectedPackages, 
  onFiltersChange,
  tireDimensionsFront = '',
  tireDimensionsRear = ''
}: ServiceFiltersProps) {
  const config = FILTER_CONFIG[selectedService]
  
  // Check if vehicle has mixed tires (different front/rear dimensions)
  const hasMixedTires = tireDimensionsFront && tireDimensionsRear && tireDimensionsFront !== tireDimensionsRear

  // Log for debugging - VERSION 2.0 MIXED TIRES
  useEffect(() => {
    console.log('🎛️ [ServiceFilters v2.0] Rendered with:', {
      selectedService,
      selectedPackages,
      tireDimensionsFront,
      tireDimensionsRear,
      hasMixedTires
    })
  }, [selectedService, selectedPackages, tireDimensionsFront, tireDimensionsRear, hasMixedTires])

  const togglePackage = (packageType: string, group: FilterGroup) => {
    let newSelection: string[]
    
    if (group.multiSelect) {
      // Checkboxes: Toggle on/off
      newSelection = selectedPackages.includes(packageType)
        ? selectedPackages.filter(p => p !== packageType)
        : [...selectedPackages, packageType]
    } else {
      // Radio buttons: Remove all options from this group, then add selected one
      const groupPackageTypes = group.options.map(opt => opt.packageType)
      newSelection = selectedPackages.filter(p => !groupPackageTypes.includes(p))
      newSelection.push(packageType)
    }
    
    console.log('🔄 [ServiceFilters] toggling package:', packageType, '→', newSelection)
    onFiltersChange(newSelection)
  }

  if (!config) {
    return null
  }
  
  // Override tire count options if mixed tires detected
  let displayConfig = config
  if (selectedService === 'TIRE_CHANGE' && hasMixedTires) {
    displayConfig = {
      groups: [
        {
          label: 'Anzahl Reifen',
          multiSelect: false,
          options: [
            {
              packageType: 'front_two_tires',
              label: `2 Reifen Vorderachse`,
              info: `Wechsel der Vorderachse (${tireDimensionsFront})`
            },
            {
              packageType: 'rear_two_tires',
              label: `2 Reifen Hinterachse`,
              info: `Wechsel der Hinterachse (${tireDimensionsRear})`
            },
            {
              packageType: 'mixed_four_tires',
              label: `4 Reifen Komplettsatz`,
              info: `Alle 4 Reifen (2× ${tireDimensionsFront} vorne + 2× ${tireDimensionsRear} hinten)`
            }
          ]
        },
        ...config.groups.slice(1) // Keep other groups (Zusatzleistungen, etc.)
      ]
    }
  }

  return (
    <div>
      {displayConfig.groups.map((group, groupIndex) => (
        <div key={groupIndex} className={groupIndex > 0 ? 'mt-4' : ''}>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            {group.label}
          </h4>
          
          <div className="space-y-1">
            {group.options.map((option) => (
              <label
                key={option.packageType}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type={group.multiSelect ? 'checkbox' : 'radio'}
                  name={group.multiSelect ? undefined : `${selectedService}-filter-${groupIndex}`}
                  checked={selectedPackages.includes(option.packageType)}
                  onChange={() => togglePackage(option.packageType, group)}
                  className={`w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500${group.multiSelect ? ' rounded' : ''}`}
                />
                <span className="text-sm flex items-center gap-1">
                  {option.label}
                  <InfoTooltip content={option.info} />
                </span>
              </label>
            ))}
          </div>
          
          {/* Display note if present */}
          {group.note && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 leading-relaxed">
                {group.note}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
