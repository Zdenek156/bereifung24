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
        options: [
          { 
            packageType: 'with_disposal', 
            label: 'Mit Entsorgung', 
            info: 'Fachgerechte Entsorgung der alten Reifen inklusive'
          },
          { 
            packageType: 'runflat', 
            label: 'Runflat-Reifen', 
            info: 'Spezieller Service für Runflat-Reifen (notlauftauglich, ohne Notrad). Erfordert besondere Montagetechniken.'
          }
        ]
      }
    ]
  },
  WHEEL_CHANGE: {
    groups: [
      {
        label: 'Leistungsumfang',
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
        options: [
          { 
            packageType: 'check', 
            label: 'Basis-Check', 
            info: 'Funktionsprüfung der Klimaanlage und Temperaturmessung'
          },
          { 
            packageType: 'basic', 
            label: 'Standard-Service', 
            info: 'Funktionscheck und Nachfüllen von Kältemittel bei Bedarf'
          },
          { 
            packageType: 'comfort', 
            label: 'Komfort-Service', 
            info: 'Standard-Service plus Wechsel des Innenraumfilters für bessere Luftqualität'
          },
          { 
            packageType: 'premium', 
            label: 'Premium-Service', 
            info: 'Kompletter Service mit Desinfektion, Premium-Pollenfilter und Duftstoff'
          }
        ]
      }
    ]
  }
}

export default function ServiceFilters({ selectedService, onFiltersChange }: ServiceFiltersProps) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])

  const config = FILTER_CONFIG[selectedService]

  // Reset filters when service changes
  useEffect(() => {
    setSelectedPackages([])
    onFiltersChange([])
  }, [selectedService])

  const togglePackage = (packageType: string) => {
    const newSelection = selectedPackages.includes(packageType)
      ? selectedPackages.filter(p => p !== packageType)
      : [...selectedPackages, packageType]
    
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
                  type="checkbox"
                  checked={selectedPackages.includes(option.packageType)}
                  onChange={() => togglePackage(option.packageType)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  {option.label}
                  <InfoTooltip content={option.info} />
                </span>
              </label>
            ))}
          </div>
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
