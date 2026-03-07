'use client'

import { useEffect } from 'react'
import InfoTooltip from './InfoTooltip'

interface FilterOption {
  packageType: string
  label: string
  info: string
  hint?: string // Optional hint text shown below selected option
}

interface FilterGroup {
  label: string
  options: FilterOption[]
  multiSelect?: boolean // Default: false (radio), true = checkboxes
  note?: string // Optional warning/info note below the filter group
}

export interface ServiceFilterConfig {
  groups: FilterGroup[]
  singleSelection?: boolean // If true, only one option across ALL groups can be selected (radio across groups)
}

interface ServiceFiltersProps {
  selectedService: string
  selectedPackages: string[]
  onFiltersChange: (selectedPackages: string[]) => void
  // Optional: Override default config (e.g. for mixed tires)
  customConfig?: ServiceFilterConfig
  // Mixed tire dimensions (if front ≠ rear) - for logging only
  tireDimensionsFront?: string
  tireDimensionsRear?: string
  // Stack groups vertically (for sidebar layout)
  stackGroups?: boolean
}

const FILTER_CONFIG: Record<string, ServiceFilterConfig> = {
  TIRE_CHANGE: {
    groups: [
      {
        label: 'Service-Art',
        multiSelect: false, // Radio buttons - nur eine Auswahl
        options: [
          { 
            packageType: 'with_tire_purchase', 
            label: 'Mit Reifenkauf', 
            info: 'Neue Reifen bei der Werkstatt kaufen und montieren lassen. Sie können aus verschiedenen Marken und Modellen wählen.'
          },
          { 
            packageType: 'tire_installation_only', 
            label: 'Nur Montage', 
            info: 'Nur die Montage-Dienstleistung. Sie bringen Ihre eigenen Reifen mit zur Werkstatt.'
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
    singleSelection: true, // Nur eine Auswahl über alle Gruppen hinweg
    groups: [
      {
        label: 'Nur Messung',
        multiSelect: false,
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
        multiSelect: false,
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
        multiSelect: false,
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
        label: 'Service-Art',
        multiSelect: false, // Radio buttons - nur eine Auswahl
        options: [
          { 
            packageType: 'motorcycle_with_tire_purchase', 
            label: 'Mit Reifenkauf', 
            info: 'Neue Motorradreifen bei der Werkstatt kaufen und montieren lassen. Sie können aus verschiedenen Marken und Modellen wählen.',
            hint: 'Räder müssen ausgebaut zur Werkstatt gebracht werden'
          },
          { 
            packageType: 'motorcycle_tire_installation_only', 
            label: 'Nur Montage', 
            info: 'Nur die Montage-Dienstleistung. Sie bringen Ihre eigenen Motorradreifen (bereits ausgebaut) mit zur Werkstatt.',
            hint: 'Sie bringen Ihre eigenen Reifen mit'
          }
        ]
      },
      {
        label: 'Anzahl Reifen',
        multiSelect: false, // Radio buttons
        options: [
          { 
            packageType: 'front', 
            label: 'Vorderreifen', 
            info: 'Nur Vorderreifen wechseln (1 ausgebautes Rad)'
          },
          { 
            packageType: 'rear', 
            label: 'Hinterreifen', 
            info: 'Nur Hinterreifen wechseln (1 ausgebautes Rad)'
          },
          { 
            packageType: 'both', 
            label: 'Beide Reifen', 
            info: 'Kompletter Reifenwechsel vorne und hinten (beide ausgebauten Räder)'
          }
        ]
      },
      {
        label: 'Zusatzleistung',
        multiSelect: true, // Checkbox - kann an/abgewählt werden
        options: [
          { 
            packageType: 'with_disposal', 
            label: 'Altreifenentsorgung', 
            info: 'Umweltgerechte Entsorgung Ihrer alten Reifen (+3,50 € pro Reifen)'
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
  customConfig,
  tireDimensionsFront = '',
  tireDimensionsRear = '',
  stackGroups = false
}: ServiceFiltersProps) {
  // Use customConfig if provided (for mixed tires), otherwise use default
  const config = customConfig || FILTER_CONFIG[selectedService]
  
  // Log for debugging - VERSION 4.0 MOVED LOGIC TO PAGE.TSX
  useEffect(() => {
    console.log('🎯 [ServiceFilters v4.0] Rendered:', {
      selectedService,
      selectedPackages,
      hasCustomConfig: !!customConfig,
      configGroups: config?.groups.length || 0,
      firstGroupOptions: config?.groups[0]?.options.length || 0,
      tireDimensionsFront,
      tireDimensionsRear
    })
  }, [selectedService, selectedPackages, customConfig, config, tireDimensionsFront, tireDimensionsRear])

  const togglePackage = (packageType: string, group: FilterGroup) => {
    let newSelection: string[]
    
    if (config?.singleSelection) {
      // Single selection across ALL groups: clear everything, set only selected
      newSelection = [packageType]
    } else if (group.multiSelect) {
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

  return (
    <div className={stackGroups ? 'grid grid-cols-1 gap-y-4' : config.groups.length >= 3 ? 'grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2' : config.groups.length === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2' : ''}>
      {config.groups.map((group, groupIndex) => (
        <div key={groupIndex}>
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
                  name={group.multiSelect ? undefined : config?.singleSelection ? `${selectedService}-filter-global` : `${selectedService}-filter-${groupIndex}`}
                  checked={selectedPackages.includes(option.packageType)}
                  onChange={() => togglePackage(option.packageType, group)}
                  className={`w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500${group.multiSelect ? ' rounded' : ''}`}
                />
                <span className="text-sm flex items-center gap-1">
                  {option.label}
                  <InfoTooltip content={option.info} />
                </span>
                {option.hint && selectedPackages.includes(option.packageType) && (
                  <p className="text-xs text-gray-500 ml-7 -mt-1 mb-1">💡 {option.hint}</p>
                )}
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
