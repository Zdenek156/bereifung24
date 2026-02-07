'use client'

import { useState, useEffect } from 'react'
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
  onFiltersChange: (selectedPackages: string[]) => void
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
        label: 'Leistungsumfang',
        multiSelect: false, // Radio buttons - nur eine Auswahl
        options: [
          { 
            packageType: 'basic', 
            label: 'Basis', 
            info: 'Einfacher Radwechsel ohne Zusatzleistungen'
          },
          { 
            packageType: 'with_balancing', 
            label: 'Mit Auswuchten', 
            info: 'Radwechsel inkl. professionellem Auswuchten für ruhigen Lauf und gleichmäßigen Reifenverschleiß'
          },
          { 
            packageType: 'with_storage', 
            label: 'Mit Einlagerung', 
            info: 'Radwechsel inkl. Einlagerung der nicht benötigten Räder in der Werkstatt'
          },
          { 
            packageType: 'complete', 
            label: 'Komplett-Service', 
            info: 'Radwechsel mit Auswuchten und Einlagerung - rundum sorglos Paket'
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

export default function ServiceFilters({ selectedService, onFiltersChange }: ServiceFiltersProps) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])

  const config = FILTER_CONFIG[selectedService]

  // Reset filters when service changes
  useEffect(() => {
    // For WHEEL_CHANGE, set default to 'basic' so price updates immediately
    if (selectedService === 'WHEEL_CHANGE') {
      setSelectedPackages(['basic'])
      onFiltersChange(['basic'])
    } else {
      setSelectedPackages([])
      onFiltersChange([])
    }
  }, [selectedService])

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
    
    setSelectedPackages(newSelection)
    onFiltersChange(newSelection)
  }

  if (!config) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Service-Filter</h3>
      
      {config.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-4 last:mb-0">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-200">
            {group.label}
          </h4>
          
          <div className="space-y-2">
            {group.options.map((option) => (
              <label
                key={option.packageType}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <input
                  type={group.multiSelect ? 'checkbox' : 'radio'}
                  name={group.multiSelect ? undefined : `filter-${groupIndex}`}
                  checked={selectedPackages.includes(option.packageType)}
                  onChange={() => togglePackage(option.packageType, group)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
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

      {selectedPackages.length > 0 && (
        <button
          onClick={() => {
            setSelectedPackages([])
            onFiltersChange([])
          }}
          className="mt-4 w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Alle Filter zurücksetzen
        </button>
      )}
    </div>
  )
}
