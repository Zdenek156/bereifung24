'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TireRequest {
  id: string
  season: string
  width: number
  aspectRatio: number
  diameter: number
  loadIndex: number | null
  speedRating: string | null
  isRunflat: boolean
  quantity: number
  preferredBrands: string | null
  specificBrand: string | null
  additionalNotes: string | null
  zipCode: string
  city: string | null
  radiusKm: number
  needByDate: string
  status: string
  createdAt: string
  distance: number
  vehicleInfo?: string
  customer: {
    user: {
      firstName: string
      lastName: string
      zipCode: string
      city: string | null
    }
  }
  offers: Array<{
    id: string
    status: string
    createdAt: string
    tireOptions?: Array<{
      carTireType?: string | null
    }>
  }>
  _count: {
    offers: number
  }
}

interface TireOption {
  brandModel: string  // Kombiniert: z.B. "Continental PremiumContact 6"
  costPrice: string
  pricePerTire: string
  montagePrice?: number // Montage price for service packages
  motorcycleTireType?: 'FRONT' | 'REAR' | 'BOTH'
  carTireType?: 'ALL_FOUR' | 'FRONT_TWO' | 'REAR_TWO'
}

interface OfferFormData {
  tireOptions: TireOption[]
  description: string
  installationFee: string
  validDays: number
  durationMinutes: string
  balancingPrice?: string
  storagePrice?: string
  storageAvailable?: boolean
  serviceName?: string
  customPriceEnabled?: boolean
}

interface WorkshopService {
  id: string
  serviceType: string
  basePrice: number
  basePrice4: number | null
  runFlatSurcharge: number | null
  disposalFee: number | null
  durationMinutes: number
  durationMinutes4: number | null
  isActive: boolean
  balancingPrice: number | null
  balancingMinutes: number | null
  storagePrice: number | null
  storageAvailable: boolean | null
  servicePackages?: ServicePackage[]
}

interface ServicePackage {
  id: string
  name: string
  description: string | null
  price: number
  durationMinutes: number
}

export default function BrowseRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<TireRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'quoted'>('all')
  const [selectedRequest, setSelectedRequest] = useState<TireRequest | null>(null)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [services, setServices] = useState<WorkshopService[]>([])
  const [sepaMandateStatus, setSepaMandateStatus] = useState<string | null>(null)
  const [sepaMandateLoading, setSepaMandateLoading] = useState(true)
  const [workshopTaxMode, setWorkshopTaxMode] = useState<string>('STANDARD')
  const [brakeServicePackages, setBrakeServicePackages] = useState<{ front: any, rear: any } | null>(null)
  const [offerForm, setOfferForm] = useState<OfferFormData>({
    tireOptions: [{ brandModel: '', costPrice: '', pricePerTire: '' }],
    description: '',
    installationFee: '',
    validDays: 7,
    durationMinutes: '',
    balancingPrice: '',
    storagePrice: '',
    storageAvailable: false
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }
    fetchServices()
    fetchRequests()
    fetchSepaMandateStatus()
    fetchWorkshopProfile()
  }, [session, status, router])

  const fetchSepaMandateStatus = async () => {
    try {
      const response = await fetch('/api/workshop/sepa-mandate/status')
      if (response.ok) {
        const data = await response.json()
        // Check if mandate is configured and active
        if (data.configured && data.mandate) {
          setSepaMandateStatus(data.mandate.status)
        } else {
          setSepaMandateStatus(null)
        }
      }
    } catch (error) {
      console.error('Error fetching SEPA mandate status:', error)
    } finally {
      setSepaMandateLoading(false)
    }
  }

  const fetchWorkshopProfile = async () => {
    try {
      const response = await fetch('/api/workshop/profile')
      if (response.ok) {
        const data = await response.json()
        setWorkshopTaxMode(data.taxMode || 'STANDARD')
      }
    } catch (error) {
      console.error('Error fetching workshop profile:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/workshop/services?includePackages=true')
      if (response.ok) {
        const data = await response.json()
        setServices(data.services.filter((s: WorkshopService) => s.isActive))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/workshop/tire-requests')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setRequests(data.requests)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      'SUMMER': 'Sommer',
      'WINTER': 'Winter',
      'ALL_SEASON': 'Ganzjahres'
    }
    return labels[season] || season
  }

  // Hilfsfunktion: Erkenne Service-Typ aus TireRequest
  const detectServiceType = (request: TireRequest): string => {
    const isMotorcycle = request.additionalNotes?.includes('🏍️ MOTORRADREIFEN')
    const isRepair = request.additionalNotes?.includes('🔧 REIFENREPARATUR')
    const isAlignment = request.additionalNotes?.includes('ACHSVERMESSUNG')
    const isBrakes = request.additionalNotes?.includes('BREMSEN-SERVICE')
    const isBattery = request.additionalNotes?.includes('BATTERIE-SERVICE')
    const isClimate = request.additionalNotes?.includes('KLIMASERVICE')
    const isOtherService = request.additionalNotes?.includes('🔧 SONSTIGE REIFENSERVICES')
    // WICHTIG: width-Check NACH allen additionalNotes-Checks, weil Alignment auch width=0 hat
    const isWheelChange = !isMotorcycle && !isRepair && !isAlignment && !isBrakes && !isBattery && !isClimate && !isOtherService &&
                          request.width === 0 && request.aspectRatio === 0 && request.diameter === 0

    if (isMotorcycle) return 'MOTORCYCLE_TIRE'
    if (isRepair) return 'TIRE_REPAIR'
    if (isAlignment) return 'ALIGNMENT_BOTH'
    if (isBrakes) return 'BRAKE_SERVICE'
    if (isBattery) return 'BATTERY_SERVICE'
    if (isClimate) return 'CLIMATE_SERVICE'
    if (isOtherService) return 'OTHER'
    if (isWheelChange) return 'WHEEL_CHANGE'
    return 'TIRE_CHANGE'
  }

  // Hilfsfunktion: Service-Name aus Service-Typ ermitteln
  const getServiceName = (serviceType: string): string => {
    const names: Record<string, string> = {
      'WHEEL_CHANGE': 'Räder umstecken',
      'TIRE_CHANGE': 'Reifenmontage',
      'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
      'TIRE_REPAIR': 'Reifen-Reparatur',
      'ALIGNMENT': 'Achsvermessung / Spureinstellung',
      'ALIGNMENT_BOTH': 'Achsvermessung / Spureinstellung',
      'BRAKE_SERVICE': 'Bremsenwechsel',
      'BATTERY_SERVICE': 'Batteriewechsel',
      'CLIMATE_SERVICE': 'Klimaservice',
      'OTHER': 'Sonstige Dienstleistung'
    }
    return names[serviceType] || serviceType
  }

  // Hilfsfunktion: Detaillierter Service-Name mit Beschreibung basierend auf Package-Namen
  const getServiceDetailName = (packageName: string, serviceType: string): string => {
    const lowerName = packageName.toLowerCase()
    
    // Achsvermessung
    if (serviceType === 'ALIGNMENT_BOTH') {
      if (lowerName.includes('komplett')) {
        return 'Komplett-Service (Achsvermessung, Spureinstellung und Prüfung aller Fahrwerk-/Achsteile)'
      } else if (lowerName.includes('einstellung') && lowerName.includes('beide')) {
        return 'Einstellung beide Achsen (Achsvermessung und Spureinstellung für Vorder- und Hinterachse)'
      } else if (lowerName.includes('einstellung') && lowerName.includes('vorder')) {
        return 'Einstellung Vorderachse (Achsvermessung und Spureinstellung)'
      } else if (lowerName.includes('einstellung') && lowerName.includes('hinter')) {
        return 'Einstellung Hinterachse (Achsvermessung und Spureinstellung)'
      } else if (lowerName.includes('vermessung') && lowerName.includes('beide')) {
        return 'Vermessung beide Achsen (Achsvermessung für Vorder- und Hinterachse, ohne Einstellung)'
      } else if (lowerName.includes('vermessung') && lowerName.includes('vorder')) {
        return 'Vermessung Vorderachse (Achsvermessung, ohne Einstellung)'
      } else if (lowerName.includes('vermessung') && lowerName.includes('hinter')) {
        return 'Vermessung Hinterachse (Achsvermessung, ohne Einstellung)'
      }
    }
    
    // Klimaservice
    if (serviceType === 'CLIMATE_SERVICE') {
      if (lowerName.includes('premium')) {
        return 'Klimaservice Premium (Desinfektion, Nachfüllen, Leckerkennung und Innenraumdesinfektion)'
      } else if (lowerName.includes('comfort')) {
        return 'Klimaservice Comfort (Desinfektion, Nachfüllen und Leckerkennung)'
      } else if (lowerName.includes('basic')) {
        return 'Klimaservice Basic (Desinfektion und Kältemittel nachfüllen)'
      } else if (lowerName.includes('check') || lowerName.includes('inspektion')) {
        return 'Klimaanlagen-Inspektion (Funktionsprüfung und Sichtprüfung)'
      }
    }
    
    // Reifenreparatur
    if (serviceType === 'TIRE_REPAIR') {
      if (lowerName.includes('fremdkörper') || lowerName.includes('loch') || lowerName.includes('panne')) {
        return 'Reifenreparatur - Fremdkörper (Nagel/Schraube entfernen und Loch abdichten)'
      } else if (lowerName.includes('ventil')) {
        return 'Reifenreparatur - Ventilschaden (Ventil austauschen)'
      }
    }
    
    return packageName
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'new') return req.status === 'PENDING' && req.offers.length === 0
    if (filter === 'quoted') return req.offers.length > 0
    return true
  })

  const handleCreateOffer = (request: TireRequest) => {
    setSelectedRequest(request)
    setShowOfferForm(true)
    
    // Variable für gefundene Bremsen-Service-Pakete
    let brakeServicePackages: { front: any, rear: any } = { front: null, rear: null }
    
    // Erkenne Service-Typ aus additionalNotes (WICHTIG: Prüfe additionalNotes VOR width check!)
    const isMotorcycle = request.additionalNotes?.includes('🏍️ MOTORRADREIFEN')
    const isRepair = request.additionalNotes?.includes('🔧 REIFENREPARATUR')
    const isAlignment = request.additionalNotes?.includes('📐 ACHSVERMESSUNG')
    const isOtherService = request.additionalNotes?.includes('🛠️ SONSTIGE DIENSTLEISTUNG')
    const isBrakes = request.additionalNotes?.includes('BREMSEN-SERVICE')
    const isBattery = request.additionalNotes?.includes('BATTERIE-SERVICE')
    const isClimate = request.additionalNotes?.includes('KLIMASERVICE:')
    // Räder umstecken nur wenn width=0 UND KEIN anderer Service erkannt wurde
    const isWheelChange = !isMotorcycle && !isRepair && !isAlignment && !isOtherService && !isBrakes && !isBattery && !isClimate && 
                          request.width === 0 && request.aspectRatio === 0 && request.diameter === 0
    
    console.log('Request additionalNotes:', request.additionalNotes)
    console.log('Service detection:', {
      isMotorcycle,
      isWheelChange,
      isRepair,
      isAlignment,
      isBrakes,
      isBattery,
      isClimate,
      isOtherService
    })
        console.log('Available services:', services.map(s => ({
          type: s.serviceType,
          price: s.basePrice,
          duration: s.durationMinutes,
          servicePackages: s.servicePackages?.map(p => ({ name: p.name, price: p.price, duration: p.durationMinutes }))
        })))    // Finde passenden Service basierend auf Anfragetyp
    let service: WorkshopService | undefined
    
    if (isMotorcycle) {
      service = services.find(s => s.serviceType === 'MOTORCYCLE_TIRE')
    } else if (isWheelChange) {
      service = services.find(s => s.serviceType === 'WHEEL_CHANGE')
    } else if (isRepair) {
      service = services.find(s => s.serviceType === 'TIRE_REPAIR')
    } else if (isAlignment) {
      service = services.find(s => s.serviceType === 'ALIGNMENT_BOTH')
    } else if (isBrakes) {
      service = services.find(s => s.serviceType === 'BRAKE_SERVICE')
    } else if (isBattery) {
      service = services.find(s => s.serviceType === 'BATTERY_SERVICE')
    } else if (isClimate) {
      service = services.find(s => s.serviceType === 'CLIMATE_SERVICE')
    } else if (isOtherService) {
      service = services.find(s => s.serviceType === 'OTHER')
    } else {
      service = services.find(s => s.serviceType === 'TIRE_CHANGE')
    }
    
    console.log('Found service:', service ? { 
      type: service.serviceType, 
      price: service.basePrice, 
      duration: service.durationMinutes,
      servicePackages: service.servicePackages?.map(p => ({ name: p.name, price: p.price, duration: p.durationMinutes }))
    } : 'None')
    
    let calculatedInstallation = ''
    let calculatedDuration = ''
    let selectedServiceName = '' // Für Anzeige des Package-Namens
    
    if (service) {
      if (isWheelChange) {
        // Räder umstecken: Einfache Berechnung mit Basis + Optionen
        let installation = service.basePrice || 0
        let duration = service.durationMinutes || 60
        
        const needsBalancing = request.additionalNotes?.includes('Wuchten')
        const needsStorage = request.additionalNotes?.includes('Einlagerung')
        
        console.log('Wheel change detected - Customer preferences:', { needsBalancing, needsStorage })
        console.log('Service pricing:', { 
          basePrice: service.basePrice, 
          balancingPrice: service.balancingPrice, 
          storagePrice: service.storagePrice,
          durationMinutes: service.durationMinutes,
          balancingMinutes: service.balancingMinutes
        })
        
        // Addiere Wuchten wenn gewünscht (pro Rad, 4 Räder)
        if (needsBalancing && service.balancingPrice) {
          installation += service.balancingPrice * 4
          if (service.balancingMinutes) {
            duration += service.balancingMinutes * 4
          }
        }
        
        // WICHTIG: Einlagerung wird NICHT automatisch hinzugefügt!
        // Die Werkstatt muss die Checkbox manuell aktivieren, dann wird der Preis dynamisch hinzugefügt
        
        calculatedInstallation = installation.toFixed(2)
        calculatedDuration = duration.toString()
      } else if (isRepair || isAlignment || isOtherService || isBrakes || isBattery || isClimate) {
        // Andere Services: Finde passendes Paket basierend auf Kundenanfrage
        if (service.servicePackages && service.servicePackages.length > 0) {
          let selectedPackage = service.servicePackages[0] // Fallback
          
          if (isAlignment) {
            // Achsvermessung: Finde Paket basierend auf Achse und Leistung
            const notes = request.additionalNotes || ''
            const isFrontOnly = notes.includes('Vorderachse') && !notes.includes('Beide Achsen')
            const isRearOnly = notes.includes('Hinterachse') && !notes.includes('Beide Achsen')
            const isBothAxles = notes.includes('Beide Achsen')
            const hasAdjustment = notes.includes('mit Spureinstellung')
            const hasInspection = notes.includes('Fahrwerk-/Achsteile Prüfung')
            
            if (hasInspection) {
              // Komplett-Service mit Prüfung
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('komplett') || 
                p.name.toLowerCase().includes('prüfung')
              ) || selectedPackage
            } else if (hasAdjustment && isBothAxles) {
              // Einstellung beide Achsen
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('einstellung') && 
                p.name.toLowerCase().includes('beide')
              ) || selectedPackage
            } else if (hasAdjustment && isFrontOnly) {
              // Einstellung Vorderachse
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('einstellung') && 
                p.name.toLowerCase().includes('vorder')
              ) || selectedPackage
            } else if (hasAdjustment && isRearOnly) {
              // Einstellung Hinterachse
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('einstellung') && 
                p.name.toLowerCase().includes('hinter')
              ) || selectedPackage
            } else if (isBothAxles) {
              // Nur Vermessung beide Achsen
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('vermessung') && 
                p.name.toLowerCase().includes('beide')
              ) || selectedPackage
            } else if (isFrontOnly) {
              // Nur Vermessung Vorderachse
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('vermessung') && 
                p.name.toLowerCase().includes('vorder')
              ) || selectedPackage
            } else if (isRearOnly) {
              // Nur Vermessung Hinterachse
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('vermessung') && 
                p.name.toLowerCase().includes('hinter')
              ) || selectedPackage
            }
          } else if (isClimate) {
            // Klimaservice: Finde Paket basierend auf Service-Level
            const notes = request.additionalNotes || ''
            
            if (notes.includes('Premium')) {
              // Premium: Mit Innenraumdesinfektion
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('premium')
              ) || selectedPackage
            } else if (notes.includes('Comfort')) {
              // Comfort: Mit Leckerkennung
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('comfort')
              ) || selectedPackage
            } else if (notes.includes('Basic')) {
              // Basic: Desinfektion + Nachfüllen
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('basic')
              ) || selectedPackage
            } else if (notes.includes('Inspektion') || notes.includes('Prüfung')) {
              // Nur Prüfung/Check
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('check') || 
                p.name.toLowerCase().includes('inspektion') ||
                p.name.toLowerCase().includes('prüfung')
              ) || selectedPackage
            }
          } else if (isRepair) {
            // Reifenreparatur: Finde Paket basierend auf Problem-Typ
            const notes = request.additionalNotes || ''
            
            if (notes.includes('Reifenpanne') || notes.includes('Loch')) {
              // Fremdkörper (Nagel, Schraube, etc.) → Nutze Package
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('fremdkörper') ||
                p.name.toLowerCase().includes('loch') ||
                p.name.toLowerCase().includes('panne')
              ) || selectedPackage
            } else if (notes.includes('Ventil defekt')) {
              // Ventilschaden → Nutze Package
              selectedPackage = service.servicePackages.find(p => 
                p.name.toLowerCase().includes('ventil')
              ) || selectedPackage
            }
            // Für "Sonstiges Problem" wird KEIN Package ausgewählt
            // → calculatedInstallation/Duration bleiben leer
            // → Werkstatt muss Preis/Dauer manuell eingeben
          } else if (isBattery) {
            // Batterie-Service: Nutze erstes/einziges Package falls vorhanden
            if (service.servicePackages.length > 0) {
              selectedPackage = service.servicePackages[0]
            }
          } else if (isBrakes) {
            // Bremsen-Service: Berechne Summe aller vom Kunden angefragten Pakete
            const frontSelection = request.additionalNotes?.match(/Vorderachse:\s*([^\n]+)/)?.[1]?.trim()
            const rearSelection = request.additionalNotes?.match(/Hinterachse:\s*([^\n]+)/)?.[1]?.trim()
            
            let totalBrakePrice = 0
            let totalBrakeDuration = 0
            let frontPackageFound = null
            let rearPackageFound = null
            
            // Front axle
            if (frontSelection && frontSelection !== 'Keine Arbeiten' && service.servicePackages) {
              let frontPackage = null
              if (frontSelection === 'Nur Bremsbeläge') {
                frontPackage = service.servicePackages.find(p => 
                  p.name.toLowerCase().includes('vorderachse') && 
                  p.name.toLowerCase().includes('bremsbeläge') && 
                  !p.name.toLowerCase().includes('scheiben')
                )
              } else if (frontSelection === 'Bremsbeläge + Bremsscheiben') {
                frontPackage = service.servicePackages.find(p => 
                  p.name.toLowerCase().includes('vorderachse') && 
                  p.name.toLowerCase().includes('scheiben')
                )
              }
              if (frontPackage) {
                frontPackageFound = frontPackage
                totalBrakePrice += frontPackage.price
                totalBrakeDuration += frontPackage.durationMinutes
              }
            }
            
            // Rear axle
            if (rearSelection && rearSelection !== 'Keine Arbeiten' && service.servicePackages) {
              let rearPackage = null
              if (rearSelection === 'Nur Bremsbeläge') {
                rearPackage = service.servicePackages.find(p => 
                  p.name.toLowerCase().includes('hinterachse') && 
                  p.name.toLowerCase().includes('bremsbeläge') && 
                  !p.name.toLowerCase().includes('scheiben')
                )
              } else if (rearSelection === 'Bremsbeläge + Bremsscheiben') {
                rearPackage = service.servicePackages.find(p => 
                  p.name.toLowerCase().includes('hinterachse') && 
                  p.name.toLowerCase().includes('scheiben')
                )
              } else if (rearSelection === 'Bremsbeläge + Bremsscheiben + Handbremse') {
                rearPackage = service.servicePackages.find(p => 
                  p.name.toLowerCase().includes('hinterachse') && 
                  p.name.toLowerCase().includes('handbremse')
                )
              }
              if (rearPackage) {
                rearPackageFound = rearPackage
                totalBrakePrice += rearPackage.price
                totalBrakeDuration += rearPackage.durationMinutes
              }
            }
            
            if (totalBrakePrice > 0) {
              calculatedInstallation = totalBrakePrice.toFixed(2)
              calculatedDuration = totalBrakeDuration.toString()
              // Speichere Pakete für spätere Verwendung beim Initialisieren der tireOptions
              const packages = {
                front: frontPackageFound,
                rear: rearPackageFound
              }
              brakeServicePackages = packages
              setBrakeServicePackages(packages) // Speichere im State für später
              console.log('🔧 Brake packages set:', {
                front: frontPackageFound ? `${frontPackageFound.name} - ${frontPackageFound.price}€` : 'NULL',
                rear: rearPackageFound ? `${rearPackageFound.name} - ${rearPackageFound.price}€` : 'NULL'
              })
            }
            selectedServiceName = ''
            console.log('Brake service - Found packages:', { front: frontPackageFound?.name, rear: rearPackageFound?.name, totalPrice: totalBrakePrice, totalDuration: totalBrakeDuration })
          }
          
          // Nur Preis/Dauer setzen wenn ein Package gefunden wurde
          // (Bei Repair "Sonstiges" und OTHER services bleibt es leer für manuelle Eingabe)
          if (selectedPackage && selectedPackage.price > 0 && !isOtherService && !isBrakes) {
            calculatedInstallation = selectedPackage.price.toFixed(2)
            calculatedDuration = selectedPackage.durationMinutes.toString()
          }
          
          // Speichere den Service-Namen für die Anzeige (nur wenn Package vorhanden)
          if ((isAlignment || isClimate || isBattery || isRepair) && selectedPackage) {
            selectedServiceName = selectedPackage.name
          }
          
          // OTHER services: Komplett manuelle Eingabe durch Werkstatt
          if (isOtherService) {
            calculatedInstallation = ''
            calculatedDuration = ''
            selectedServiceName = ''
          }
        } else if (service.basePrice && service.durationMinutes) {
          calculatedInstallation = service.basePrice.toFixed(2)
          calculatedDuration = service.durationMinutes.toString()
        }
      } else if (isMotorcycle) {
        // Motorradreifen: Verwende Paket-Preise
        // Prüfe ob Vorder- oder Hinterreifen oder beide benötigt werden
        const needsFront = request.additionalNotes?.includes('✓ Vorderreifen')
        const needsRear = request.additionalNotes?.includes('✓ Hinterreifen')
        
        let installation = 0
        let duration = 60
        
        if (service.servicePackages && service.servicePackages.length > 0) {
          // Finde passendes Paket
          let selectedPackage
          
          if (needsFront && needsRear) {
            // Beide Reifen - suche "Beide" Paket
            selectedPackage = service.servicePackages.find(p => p.name.toLowerCase().includes('beide'))
          } else if (needsFront) {
            // Nur Vorderrad
            selectedPackage = service.servicePackages.find(p => p.name.toLowerCase().includes('vorderrad') && !p.name.toLowerCase().includes('entsorgung'))
          } else if (needsRear) {
            // Nur Hinterrad
            selectedPackage = service.servicePackages.find(p => p.name.toLowerCase().includes('hinterrad') && !p.name.toLowerCase().includes('entsorgung'))
          }
          
          // Fallback auf erstes Paket wenn nichts gefunden
          if (!selectedPackage && service.servicePackages.length > 0) {
            selectedPackage = service.servicePackages[0]
          }
          
          if (selectedPackage) {
            installation = selectedPackage.price
            duration = selectedPackage.durationMinutes
          }
        }
        
        calculatedInstallation = installation.toFixed(2)
        calculatedDuration = duration.toString()
      } else {
        // Autoreifen-Wechsel: Nutze Service-Pakete
        let installation = 0
        let duration = 60
        
        const hasDisposal = request.additionalNotes?.includes('Altreifenentsorgung gewünscht')
        const hasRunflat = request.isRunflat
        
        if (service.servicePackages && service.servicePackages.length > 0) {
          // Finde passendes Paket basierend nur auf Reifenanzahl
          let selectedPackage
          
          if (request.quantity === 4) {
            // 4 Reifen
            selectedPackage = service.servicePackages.find(p => 
              p.name.includes('4') || p.name.toLowerCase().includes('alle')
            )
          } else if (request.quantity === 2) {
            // 2 Reifen
            selectedPackage = service.servicePackages.find(p => 
              p.name.includes('2')
            )
          }
          
          // Fallback auf erstes Paket wenn nichts gefunden
          if (!selectedPackage && service.servicePackages.length > 0) {
            selectedPackage = service.servicePackages[0]
          }
          
          if (selectedPackage) {
            installation = selectedPackage.price
            duration = selectedPackage.durationMinutes
          }
          
          // Entsorgung separat addieren
          if (hasDisposal && service.disposalFee) {
            installation += service.disposalFee * request.quantity
          }
          
          // Runflat separat addieren
          if (hasRunflat && service.runFlatSurcharge) {
            installation += service.runFlatSurcharge * request.quantity
          }
        } else {
          // Fallback auf alte Logik wenn keine Pakete definiert
          installation = request.quantity === 4 && service.basePrice4
            ? service.basePrice4
            : service.basePrice
          
          // Addiere Entsorgung wenn nötig
          if (hasDisposal && service.disposalFee) {
            installation += service.disposalFee * request.quantity
          }
          
          // Addiere RunFlat wenn nötig
          if (hasRunflat && service.runFlatSurcharge) {
            installation += service.runFlatSurcharge * request.quantity
          }
          
          // Wähle Dauer basierend auf Anzahl
          duration = request.quantity === 4 && service.durationMinutes4
            ? service.durationMinutes4
            : service.durationMinutes
        }
        
        calculatedInstallation = installation.toFixed(2)
        calculatedDuration = duration.toString()
      }
    }
    
    // Determine default motorcycle tire type
    let defaultTireType: 'FRONT' | 'REAR' | 'BOTH' | undefined = undefined
    if (isMotorcycle) {
      const needsFront = request.additionalNotes?.includes('✓ Vorderreifen')
      const needsRear = request.additionalNotes?.includes('✓ Hinterreifen')
      if (needsFront && needsRear) {
        defaultTireType = 'BOTH'
      } else if (needsFront) {
        defaultTireType = 'FRONT'
      } else if (needsRear) {
        defaultTireType = 'REAR'
      } else {
        defaultTireType = 'BOTH' // Fallback
      }
    }

    // Initialisiere tireOptions basierend auf Service-Typ
    const preferredBrand = request.preferredBrands?.split(',')[0] || ''
    let initialTireOptions: any[] = []
    
    // Für Bremsen-Service: Prüfe ob Pakete gefunden wurden
    if (isBrakes) {
      const hasBrakePackages = brakeServicePackages?.front || brakeServicePackages?.rear
      
      if (!hasBrakePackages) {
      // FALLBACK: Wenn keine Pakete gefunden wurden, erstelle Optionen basierend auf additionalNotes
      console.log('⚠️ Brake service packages NOT found, using fallback from additionalNotes')
      const frontSelection = request.additionalNotes?.match(/Vorderachse:\s*([^\n]+)/)?.[1]?.trim()
      const rearSelection = request.additionalNotes?.match(/Hinterachse:\s*([^\n]+)/)?.[1]?.trim()
      
      // Berechne montagePrice und Dauer basierend auf Service-Typ
      let frontMontagePrice = 0
      let frontDuration = 0
      let rearMontagePrice = 0
      let rearDuration = 0
      
      if (frontSelection && frontSelection !== 'Keine Arbeiten') {
        if (frontSelection === 'Nur Bremsbeläge') {
          frontMontagePrice = 60
          frontDuration = 60
        } else if (frontSelection === 'Bremsbeläge + Bremsscheiben') {
          frontMontagePrice = 110
          frontDuration = 110
        }
      }
      
      if (rearSelection && rearSelection !== 'Keine Arbeiten') {
        if (rearSelection === 'Nur Bremsbeläge') {
          rearMontagePrice = 80
          rearDuration = 60
        } else if (rearSelection === 'Bremsbeläge + Bremsscheiben') {
          rearMontagePrice = 130
          rearDuration = 110
        } else if (rearSelection === 'Bremsbeläge + Bremsscheiben + Handbremse') {
          rearMontagePrice = 150
          rearDuration = 150
        }
      }
      
      // Setze die berechneten Werte für installationFee und duration
      if (frontMontagePrice > 0 || rearMontagePrice > 0) {
        calculatedInstallation = (frontMontagePrice + rearMontagePrice).toFixed(2)
        calculatedDuration = (frontDuration + rearDuration).toString()
      }
      
      if (frontMontagePrice > 0) {
        initialTireOptions.push({
          brandModel: '',
          costPrice: '',
          pricePerTire: '',
          carTireType: 'FRONT_TWO',
          montagePrice: frontMontagePrice
        })
        // Speichere in State für addTireOption
        setBrakeServicePackages(prev => ({ ...prev, front: { price: frontMontagePrice, durationMinutes: frontDuration, name: frontSelection } }))
      }
      
      if (rearMontagePrice > 0) {
        initialTireOptions.push({
          brandModel: '',
          costPrice: '',
          pricePerTire: '',
          carTireType: 'REAR_TWO',
          montagePrice: rearMontagePrice
        })
        // Speichere in State für addTireOption
        setBrakeServicePackages(prev => ({ ...prev, rear: { price: rearMontagePrice, durationMinutes: rearDuration, name: rearSelection } }))
      }
    } else {
      // Pakete gefunden - verwende sie
      console.log('Creating initial brake service options with packages:', {
        front: brakeServicePackages.front ? { name: brakeServicePackages.front.name, price: brakeServicePackages.front.price } : null,
        rear: brakeServicePackages.rear ? { name: brakeServicePackages.rear.name, price: brakeServicePackages.rear.price } : null
      })
      if (brakeServicePackages.front) {
        initialTireOptions.push({
          brandModel: '',
          costPrice: '',
          pricePerTire: '',
          carTireType: 'FRONT_TWO',
          montagePrice: brakeServicePackages.front.price
        })
      }
      if (brakeServicePackages.rear) {
        initialTireOptions.push({
          brandModel: '',
          costPrice: '',
          pricePerTire: '',
          carTireType: 'REAR_TWO',
          montagePrice: brakeServicePackages.rear.price
        })
      }
    }
    } else {
      // Standard: Ein leeres Reifenangebot
      initialTireOptions = [{ 
        brandModel: preferredBrand, 
        costPrice: '', 
        pricePerTire: '',
        motorcycleTireType: defaultTireType,
        carTireType: !isMotorcycle ? undefined : undefined // Keine Vorauswahl!
      }]
    }
    
    setOfferForm({
      tireOptions: initialTireOptions,
      description: '',
      installationFee: calculatedInstallation || '0.00', // Verwende berechneten Wert
      validDays: 7,
      durationMinutes: calculatedDuration,
      balancingPrice: (isWheelChange && !request.additionalNotes?.includes('Wuchten') && service?.balancingPrice) 
        ? service.balancingPrice.toFixed(2) 
        : '',
      storagePrice: '',
      storageAvailable: false, // Checkbox standardmäßig deaktiviert - Werkstatt muss manuell aktivieren
      serviceName: selectedServiceName || undefined, // Speichere den ausgewählten Package-Namen
      customPriceEnabled: false // Standardmäßig deaktiviert für Batterie/Bremsen
    })
  }

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return

    const isWheelChange = selectedRequest.width === 0 && selectedRequest.aspectRatio === 0 && selectedRequest.diameter === 0

    // Validierung: Bei normalen Reifenanfragen muss mindestens ein Reifenangebot vollständig ausgefüllt sein
    const validOptions = offerForm.tireOptions.filter(opt => 
      opt.brandModel.trim() && opt.pricePerTire.trim()
    )
    
    if (!isWheelChange && validOptions.length === 0) {
      alert('Bitte geben Sie mindestens ein Reifenangebot an.')
      return
    }

    setSubmitting(true)
    try {
      console.log('Creating offer with tireOptions:', offerForm.tireOptions)
      console.log('Valid options with montagePrice:', validOptions.map(opt => ({
        brand: opt.brandModel,
        price: opt.pricePerTire,
        montagePrice: opt.montagePrice,
        carTireType: opt.carTireType
      })))
      const response = await fetch(`/api/workshop/tire-requests/${selectedRequest.id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(validOptions.length > 0 && {
            tireOptions: validOptions.map(opt => ({
              brandModel: opt.brandModel,
              pricePerTire: parseFloat(opt.pricePerTire),
              motorcycleTireType: opt.motorcycleTireType,
              carTireType: opt.carTireType,
              montagePrice: opt.montagePrice // Speichere Montagepreis mit
            }))
          }),
          description: offerForm.description,
          installationFee: parseFloat(offerForm.installationFee),
          validDays: offerForm.validDays,
          durationMinutes: offerForm.durationMinutes ? parseInt(offerForm.durationMinutes) : undefined,
          balancingPrice: offerForm.balancingPrice && parseFloat(offerForm.balancingPrice) > 0 ? parseFloat(offerForm.balancingPrice) : undefined,
          storagePrice: offerForm.storagePrice && parseFloat(offerForm.storagePrice) > 0 ? parseFloat(offerForm.storagePrice) : undefined,
          storageAvailable: offerForm.storageAvailable || false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Server error response:', error)
        throw new Error(error.message || error.error || 'Fehler beim Erstellen')
      }

      alert('Angebot erfolgreich erstellt! Der Kunde wurde per E-Mail benachrichtigt.')
      setShowOfferForm(false)
      setSelectedRequest(null)
      fetchRequests()
    } catch (error: any) {
      console.error('Offer creation failed:', error)
      alert(`Fehler: ${error.message || 'Fehler beim Erstellen des Angebots'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const addTireOption = () => {
    const isMotorcycle = selectedRequest?.additionalNotes?.includes('🏍️ MOTORRADREIFEN')
    const isBrakes = selectedRequest?.additionalNotes?.includes('BREMSEN-SERVICE')
    let defaultTireType: 'FRONT' | 'REAR' | 'BOTH' | undefined = undefined
    const defaultCarTireType: 'ALL_FOUR' | 'FRONT_TWO' | 'REAR_TWO' = 
      selectedRequest?.quantity === 4 ? 'ALL_FOUR' : 'FRONT_TWO'
    
    if (isMotorcycle) {
      // Default to BOTH for additional tire options
      defaultTireType = 'BOTH'
    }
    
    // For brake service: determine montagePrice based on carTireType
    let montagePrice: number | undefined = undefined
    let selectedCarTireType = defaultCarTireType
    
    if (isBrakes && brakeServicePackages) {
      // Check which options already exist
      const hasFrontOption = offerForm.tireOptions.some(opt => opt.carTireType === 'FRONT_TWO')
      const hasRearOption = offerForm.tireOptions.some(opt => opt.carTireType === 'REAR_TWO')
      
      // If front exists but rear doesn't, and rear package is available, add rear option
      if (hasFrontOption && !hasRearOption && brakeServicePackages.rear) {
        selectedCarTireType = 'REAR_TWO'
        montagePrice = brakeServicePackages.rear.price
      }
      // If rear exists but front doesn't, and front package is available, add front option
      else if (hasRearOption && !hasFrontOption && brakeServicePackages.front) {
        selectedCarTireType = 'FRONT_TWO'
        montagePrice = brakeServicePackages.front.price
      }
      // Default: add another front option (or rear if only rear package exists)
      else if (brakeServicePackages.front) {
        selectedCarTireType = 'FRONT_TWO'
        montagePrice = brakeServicePackages.front.price
      } else if (brakeServicePackages.rear) {
        selectedCarTireType = 'REAR_TWO'
        montagePrice = brakeServicePackages.rear.price
      }
    }
    
    setOfferForm({
      ...offerForm,
      tireOptions: [{ 
        brandModel: '', 
        costPrice: '', 
        pricePerTire: '',
        motorcycleTireType: defaultTireType,
        carTireType: !isMotorcycle ? selectedCarTireType : undefined,
        montagePrice: montagePrice
      }, ...offerForm.tireOptions]
    })
  }

  const removeTireOption = (index: number) => {
    if (offerForm.tireOptions.length <= 1) return
    setOfferForm({
      ...offerForm,
      tireOptions: offerForm.tireOptions.filter((_, i) => i !== index)
    })
  }

  const updateTireOption = (index: number, field: keyof TireOption, value: string) => {
    const updated = [...offerForm.tireOptions]
    updated[index] = { ...updated[index], [field]: value }
    
    // Wenn carTireType geändert wird, berechne Installation neu (NICHT für Brake Service)
    if (field === 'carTireType' && selectedRequest) {
      const isBrakeService = selectedRequest.additionalNotes?.includes('BREMSEN-SERVICE')
      
      // Skip price recalculation for brake service - price stays fixed at initialization
      if (isBrakeService) {
        setOfferForm({
          ...offerForm,
          tireOptions: updated
        })
        return
      }
      
      // Regular car tire logic
      // Prüfe ALLE tireOptions um zu entscheiden ob Vorne UND Hinten abgedeckt sind
      const hasFront = updated.some(opt => opt.carTireType === 'FRONT_TWO' || opt.carTireType === 'ALL_FOUR')
      const hasRear = updated.some(opt => opt.carTireType === 'REAR_TWO' || opt.carTireType === 'ALL_FOUR')
      const hasAllFour = updated.some(opt => opt.carTireType === 'ALL_FOUR')
      
      // Bestimme Reifenanzahl basierend auf Kombinationen:
      // - Wenn ALL_FOUR ausgewählt → 4 Reifen
      // - Wenn FRONT_TWO UND REAR_TWO → 4 Reifen (Vorne + Hinten)
      // - Wenn nur FRONT_TWO oder nur REAR_TWO → 2 Reifen
      let totalQuantity = 0
      if (hasAllFour || (hasFront && hasRear)) {
        totalQuantity = 4
      } else if (hasFront || hasRear) {
        totalQuantity = 2
      }
      
      // Finde Service
      const service = services.find((s: any) => s.serviceType === 'TIRE_CHANGE')
      if (service && totalQuantity > 0) {
        let installation = 0
        let duration = 60
        
        const hasDisposal = selectedRequest.additionalNotes?.includes('Altreifenentsorgung gewünscht')
        const hasRunflat = selectedRequest.isRunflat
        
        if (service.servicePackages && service.servicePackages.length > 0) {
          // Finde passendes Paket basierend auf Gesamtanzahl
          let selectedPackage
          
          if (totalQuantity === 4) {
            // 4 Reifen - suche "4 Reifen wechseln" Paket
            selectedPackage = service.servicePackages.find((p: any) => 
              p.name.includes('4') || p.name.toLowerCase().includes('alle')
            )
          } else if (totalQuantity === 2) {
            // 2 Reifen - suche "2 Reifen wechseln" Paket
            selectedPackage = service.servicePackages.find((p: any) => 
              p.name.includes('2')
            )
          }
          
          // Fallback auf erstes Paket wenn nichts gefunden
          if (!selectedPackage && service.servicePackages.length > 0) {
            selectedPackage = service.servicePackages[0]
          }
          
          if (selectedPackage) {
            installation = selectedPackage.price
            duration = selectedPackage.durationMinutes
          }
          
          // Entsorgung separat addieren
          if (hasDisposal && service.disposalFee) {
            installation += service.disposalFee * totalQuantity
          }
          
          // Runflat separat addieren
          if (hasRunflat && service.runFlatSurcharge) {
            installation += service.runFlatSurcharge * totalQuantity
          }
        }
        
        // Aktualisiere Formular mit neuen Werten
        setOfferForm({
          ...offerForm,
          tireOptions: updated,
          installationFee: installation.toFixed(2),
          durationMinutes: duration.toString()
        })
        return
      } else if (totalQuantity === 0) {
        // Keine Auswahl → Montage 0 €
        setOfferForm({
          ...offerForm,
          tireOptions: updated,
          installationFee: '0.00',
          durationMinutes: '0'
        })
        return
      }
    }
    
    // Wenn motorcycleTireType geändert wird, berechne Installation neu (Motorradreifen)
    if (field === 'motorcycleTireType' && selectedRequest) {
      const newMotorcycleTireType = value as 'FRONT' | 'REAR' | 'BOTH'
      
      // Finde Service
      const service = services.find((s: any) => s.serviceType === 'TIRE_CHANGE')
      if (service) {
        let installation = 0
        let duration = 60
        
        if (service.servicePackages && service.servicePackages.length > 0) {
          // Finde passendes Paket
          let selectedPackage
          
          if (newMotorcycleTireType === 'BOTH') {
            // Beide Reifen - suche "Beide" Paket
            selectedPackage = service.servicePackages.find((p: any) => p.name.toLowerCase().includes('beide'))
          } else if (newMotorcycleTireType === 'FRONT') {
            // Nur Vorderrad
            selectedPackage = service.servicePackages.find((p: any) => p.name.toLowerCase().includes('vorderrad'))
          } else if (newMotorcycleTireType === 'REAR') {
            // Nur Hinterrad
            selectedPackage = service.servicePackages.find((p: any) => p.name.toLowerCase().includes('hinterrad'))
          }
          
          // Fallback auf erstes Paket wenn nichts gefunden
          if (!selectedPackage && service.servicePackages.length > 0) {
            selectedPackage = service.servicePackages[0]
          }
          
          if (selectedPackage) {
            installation = selectedPackage.price
            duration = selectedPackage.durationMinutes
          }
        }
        
        // Aktualisiere Formular mit neuen Werten
        setOfferForm({
          ...offerForm,
          tireOptions: updated,
          installationFee: installation.toFixed(2),
          durationMinutes: duration.toString()
        })
        return
      }
    }
    
    setOfferForm({
      ...offerForm,
      tireOptions: updated
    })
  }

  const calculateSellingPrice = async (index: number, costPrice: string) => {
    if (!costPrice || parseFloat(costPrice) <= 0) {
      return
    }

    // Determine category based on service type
    let category = 'auto'
    if (selectedRequest?.additionalNotes?.includes('🏍️ MOTORRADREIFEN')) {
      category = 'moto'
    } else if (selectedRequest?.additionalNotes?.includes('BATTERIE-SERVICE')) {
      category = 'battery'
    } else if (selectedRequest?.additionalNotes?.includes('BREMSEN-SERVICE')) {
      category = 'brake'
    }

    try {
      const response = await fetch('/api/workshop/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costPrice: parseFloat(costPrice),
          category: category
        })
      })

      if (response.ok) {
        const data = await response.json()
        const updated = [...offerForm.tireOptions]
        updated[index] = { 
          ...updated[index], 
          costPrice: costPrice,
          pricePerTire: data.sellingPrice.toFixed(2)
        }
        setOfferForm({
          ...offerForm,
          tireOptions: updated
        })
      }
    } catch (error) {
      console.error('Error calculating price:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/workshop"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Anfragen durchsuchen</h1>
              <p className="mt-1 text-sm text-gray-600">
                Kundenanfragen finden und Angebote erstellen
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SEPA Mandate Warning */}
        {!sepaMandateLoading && !sepaMandateStatus && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  SEPA-Lastschriftmandat erforderlich
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Um Angebote erstellen zu können, müssen Sie zunächst ein SEPA-Lastschriftmandat für die Provisionsabrechnung einrichten.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/dashboard/workshop/settings?tab=sepa"
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Jetzt SEPA-Mandat einrichten →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEPA Mandate Pending Info */}
        {!sepaMandateLoading && sepaMandateStatus && sepaMandateStatus !== 'active' && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  SEPA-Mandat wird aktiviert
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Ihr SEPA-Lastschriftmandat wurde erfolgreich eingerichtet und wird derzeit von GoCardless geprüft. 
                    Die Aktivierung dauert in der Regel <strong>3-5 Werktage</strong>. Sie können bereits jetzt Angebote erstellen.
                  </p>
                  <p className="mt-2">
                    Status: <span className="font-medium">
                      {sepaMandateStatus === 'pending_submission' ? 'Wird eingereicht' : 
                       sepaMandateStatus === 'submitted' ? 'Eingereicht, warte auf Bestätigung' : 
                       sepaMandateStatus}
                    </span>
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/dashboard/workshop/settings?tab=sepa"
                    className="text-sm font-medium text-blue-800 hover:text-blue-900 underline"
                  >
                    Status prüfen →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle ({requests.length})
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'new'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Neu ({requests.filter(r => r.status === 'PENDING' && r.offers.length === 0).length})
            </button>
            <button
              onClick={() => setFilter('quoted')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'quoted'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mit Angeboten ({requests.filter(r => r.offers.length > 0).length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Anfragen gefunden</h3>
            <p className="text-gray-600">
              {filter === 'new' && 'Es gibt aktuell keine neuen Anfragen.'}
              {filter === 'quoted' && 'Sie haben noch keine Angebote erstellt.'}
              {filter === 'all' && 'Es gibt aktuell keine offenen Anfragen.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => {
              const hasOwnOffer = request.offers.length > 0
              const daysUntilNeeded = Math.ceil(
                (new Date(request.needByDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )

              // Detect service type from additionalNotes
              const isMotorcycle = request.additionalNotes?.includes('🏍️ MOTORRADREIFEN')
              const isClimate = request.additionalNotes?.includes('KLIMASERVICE')
              const isAlignment = request.additionalNotes?.includes('ACHSVERMESSUNG')
              const isBrakes = request.additionalNotes?.includes('BREMSEN-SERVICE')
              const isBattery = request.additionalNotes?.includes('BATTERIE-SERVICE')
              const isRepair = request.additionalNotes?.includes('🔧 REIFENREPARATUR')
              const isWheelChange = request.additionalNotes?.includes('RÄDER UMSTECKEN')
              const isOtherService = request.additionalNotes?.includes('🔧 SONSTIGE REIFENSERVICES')

              // Extract tire dimensions for motorcycle (including load index and speed rating)
              let frontTireSize = ''
              let rearTireSize = ''
              if (isMotorcycle && request.additionalNotes) {
                const frontMatch = request.additionalNotes.match(/Vorderreifen:\s*(\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?)/)
                const rearMatch = request.additionalNotes.match(/Hinterreifen:\s*(\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?)/)
                if (frontMatch) frontTireSize = frontMatch[1].trim()
                if (rearMatch) rearTireSize = rearMatch[1].trim()
              }

              return (
                <div key={request.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isMotorcycle ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              🏍️ Motorradreifen
                            </h3>
                          ) : isWheelChange ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              🔄 Räder umstecken
                            </h3>
                          ) : isRepair ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              🔧 Reifenreparatur
                            </h3>
                          ) : isAlignment ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              ⚙️ Achsvermessung
                            </h3>
                          ) : isOtherService ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              🛠️ Sonstiger Service
                            </h3>
                          ) : isBrakes ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              🔴 Bremsen-Service
                            </h3>
                          ) : isBattery ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              🔋 Batterie-Service
                            </h3>
                          ) : isClimate ? (
                            <h3 className="text-xl font-bold text-primary-600">
                              ❄️ Klimaservice
                            </h3>
                          ) : (
                            <h3 className="text-xl font-bold text-primary-600">
                              🚗 Autoreifen mit Montage
                            </h3>
                          )}
                          
                          {!isWheelChange && !isRepair && !isAlignment && !isOtherService && !isBrakes && !isBattery && !isClimate && (
                            <>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                request.season === 'SUMMER' ? 'bg-yellow-100 text-yellow-800' :
                                request.season === 'WINTER' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {getSeasonLabel(request.season)}
                              </span>
                              {request.isRunflat && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Runflat
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Tire dimensions below title */}
                        {isMotorcycle ? (
                          <div className="text-sm text-gray-600 mb-2">
                            {frontTireSize && rearTireSize ? (
                              <p>Vorne: {frontTireSize} • Hinten: {rearTireSize}</p>
                            ) : frontTireSize ? (
                              <p>Vorderreifen: {frontTireSize}</p>
                            ) : rearTireSize ? (
                              <p>Hinterreifen: {rearTireSize}</p>
                            ) : null}
                          </div>
        ) : !isWheelChange && !isRepair && !isAlignment && !isOtherService && !isBrakes && !isBattery && !isClimate && request.width > 0 ? (
          <div className="text-sm text-gray-600 mb-2">
            {(() => {
              const frontMatch = request.additionalNotes?.match(/Vorder(?:achse|reifen): (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
              const rearMatch = request.additionalNotes?.match(/Hinter(?:achse|reifen): (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
              
              if (frontMatch && rearMatch) {
                return (
                  <p>
                    {request.season === 'SUMMER' && '☀️ '}
                    {request.season === 'WINTER' && '❄️ '}
                    {request.season === 'ALL_SEASON' && '🌤️ '}
                    Vorne: {frontMatch[1]}/{frontMatch[2]} R{frontMatch[3]}
                    {frontMatch[4] && ` ${frontMatch[4]}`}
                    {frontMatch[5] && ` ${frontMatch[5]}`}
                    {' • '}
                    Hinten: {rearMatch[1]}/{rearMatch[2]} R{rearMatch[3]}
                    {rearMatch[4] && ` ${rearMatch[4]}`}
                    {rearMatch[5] && ` ${rearMatch[5]}`}
                  </p>
                )
              }
              
              return (
                <p>
                  {request.season === 'SUMMER' && '☀️ '}
                  {request.season === 'WINTER' && '❄️ '}
                  {request.season === 'ALL_SEASON' && '🌤️ '}
                  {request.width}/{request.aspectRatio} R{request.diameter}
                  {request.loadIndex && ` ${request.loadIndex}`}
                  {request.speedRating && ` ${request.speedRating}`}
                </p>
              )
            })()}
          </div>
        ) : null}                        {!isWheelChange && request.width !== 0 && !isMotorcycle && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <span className="font-medium">Menge:</span> {request.quantity} Reifen
                            </p>
                            {request.preferredBrands && (
                              <p>
                                <span className="font-medium">Bevorzugte Marken:</span> {request.preferredBrands}
                              </p>
                            )}
                            {request.specificBrand && (
                              <p>
                                <span className="font-medium">Spezifische Marke:</span> {request.specificBrand}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          daysUntilNeeded <= 3 ? 'bg-red-100 text-red-800' :
                          daysUntilNeeded <= 7 ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Benötigt in {daysUntilNeeded} Tagen
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Kunde</h4>
                        <p className="text-sm text-gray-600">
                          {request.customer.user.firstName} {request.customer.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          PLZ: {request.zipCode}{request.city ? ` - ${request.city}` : ''}
                        </p>
                        <p className="text-sm text-gray-500">
                          Umkreis: {request.radiusKm} km
                        </p>
                        {request.vehicleInfo && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Fahrzeug:</span> {request.vehicleInfo}
                          </p>
                        )}
                      </div>

                      {request.additionalNotes && (() => {
                        // Filter out structured data from additionalNotes
                        let userNotes = request.additionalNotes
                          .replace(/Vorder(?:achse|reifen):\s*\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
                          .replace(/Hinter(?:achse|reifen):\s*\d+\/\d+\s*R\d+(?:\s+\d+)?(?:\s+[A-Z]+)?\n?/g, '')
                          .replace(/Altreifenentsorgung gewünscht\n?/g, '')
                          .replace(/🏍️ MOTORRADREIFEN\n?/g, '')
                          .replace(/🔧 REIFENREPARATUR\n?/g, '')
                          .replace(/🔧 SONSTIGE REIFENSERVICES\n?/g, '')
                          .replace(/⚙️ ACHSVERMESSUNG\n?/g, '')
                          .replace(/📐 ACHSVERMESSUNG\n?/g, '')
                          .replace(/🛠️ SONSTIGE DIENSTLEISTUNG\n?/g, '')
                          .replace(/🔴 BREMSENWECHSEL\n?/g, '')
                          .replace(/BREMSEN-SERVICE\n?/g, '')
                          .replace(/🔋 BATTERIEWECHSEL\n?/g, '')
                          .replace(/BATTERIE-SERVICE\n?/g, '')
                          .replace(/❄️ KLIMASERVICE\n?/g, '')
                          .replace(/🌡️ KLIMASERVICE\n?/g, '')
                          .replace(/KLIMASERVICE:\s*/g, '')
                          .replace(/RÄDER UMSTECKEN\n?/g, '')
                          .replace(/wheel_wash/g, 'Radwäsche')
                          .replace(/valves/g, 'Ventile')
                          .replace(/tire_storage/g, 'Reifeneinlagerung')
                          .replace(/pressure_check/g, 'Druckkontrolle')
                          .trim()
                        
                        if (userNotes) {
                          return (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                {request.width === 0 ? 'Service-Details' : 'Zusätzliche Hinweise'}
                              </h4>
                              <p className="text-sm text-gray-600 whitespace-pre-line">{userNotes}</p>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Erstellt: {new Date(request.createdAt).toLocaleDateString('de-DE')}</span>
                        {request._count.offers > 0 && (
                          <>
                            <span>•</span>
                            <span>{request._count.offers} {request._count.offers === 1 ? 'Angebot' : 'Angebote'}</span>
                          </>
                        )}
                      </div>

                      {hasOwnOffer ? (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium text-sm">
                          ✓ Angebot erstellt
                        </span>
                      ) : !sepaMandateStatus ? (
                        <div className="flex flex-col items-end gap-2">
                          <button
                            disabled
                            className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                            title="SEPA-Mandat erforderlich"
                          >
                            Angebot erstellen
                          </button>
                          <Link 
                            href="/dashboard/workshop/settings?tab=sepa"
                            className="text-sm text-primary-600 hover:text-primary-700 underline"
                          >
                            SEPA-Mandat einrichten
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCreateOffer(request)}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                          Angebot erstellen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Offer Form Modal */}
      {showOfferForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Angebot erstellen</h2>
                <button
                  onClick={() => {
                    setShowOfferForm(false)
                    setSelectedRequest(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {selectedRequest.additionalNotes?.includes('🏍️ MOTORRADREIFEN') ? (
                  <>
                    {(() => {
                      // Parse additionalNotes to get front and rear tire dimensions with load index
                      const frontMatch = selectedRequest.additionalNotes?.match(/✓ Vorderreifen: (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
                      const rearMatch = selectedRequest.additionalNotes?.match(/✓ Hinterreifen: (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
                      
                      if (frontMatch && rearMatch) {
                        const frontDim = `${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]}${frontMatch[4] ? ' ' + frontMatch[4] : ''}${frontMatch[5] ? ' ' + frontMatch[5] : ''}`
                        const rearDim = `${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}${rearMatch[4] ? ' ' + rearMatch[4] : ''}${rearMatch[5] ? ' ' + rearMatch[5] : ''}`
                        return `Für: 🏍️ Vorne: ${frontDim} • Hinten: ${rearDim} • ${getSeasonLabel(selectedRequest.season)}`
                      } else if (frontMatch) {
                        return `Für: 🏍️ Vorderreifen: ${frontMatch[1]}/${frontMatch[2]} R${frontMatch[3]}${frontMatch[4] ? ' ' + frontMatch[4] : ''}${frontMatch[5] ? ' ' + frontMatch[5] : ''} • ${getSeasonLabel(selectedRequest.season)}`
                      } else if (rearMatch) {
                        return `Für: 🏍️ Hinterreifen: ${rearMatch[1]}/${rearMatch[2]} R${rearMatch[3]}${rearMatch[4] ? ' ' + rearMatch[4] : ''}${rearMatch[5] ? ' ' + rearMatch[5] : ''} • ${getSeasonLabel(selectedRequest.season)}`
                      }
                      // Fallback with load index and speed rating if available
                      const loadSpeed = selectedRequest.loadIndex && selectedRequest.speedRating 
                        ? ` ${selectedRequest.loadIndex}${selectedRequest.speedRating}`
                        : selectedRequest.loadIndex 
                          ? ` ${selectedRequest.loadIndex}`
                          : ''
                      return `Für: 🏍️ ${selectedRequest.width}/${selectedRequest.aspectRatio} R${selectedRequest.diameter}${loadSpeed} • ${getSeasonLabel(selectedRequest.season)}`
                    })()}
                  </>
                ) : selectedRequest.additionalNotes?.includes('KLIMASERVICE') ? (
                  <>Für: ❄️ Klimaservice</>
                ) : selectedRequest.additionalNotes?.includes('ACHSVERMESSUNG') ? (
                  <>Für: ⚙️ Achsvermessung / Spureinstellung</>
                ) : selectedRequest.additionalNotes?.includes('BREMSEN-SERVICE') ? (
                  <>Für: 🔴 Bremsen-Service</>
                ) : selectedRequest.additionalNotes?.includes('BATTERIE-SERVICE') ? (
                  <>Für: 🔋 Batterie-Service</>
                ) : selectedRequest.additionalNotes?.includes('RÄDER UMSTECKEN') ? (
                  <>Für: 🔄 Räder umstecken (Sommer/Winter)</>
                ) : selectedRequest.additionalNotes?.includes('🔧 REIFENREPARATUR') ? (
                  <>Für: 🔧 Reifenreparatur</>
                ) : selectedRequest.additionalNotes?.includes('🔧 SONSTIGE REIFENSERVICES') ? (
                  <>Für: 🛠️ Sonstiger Service</>
                ) : selectedRequest.width === 0 ? (
                  <>Für: 🔧 Reifenreparatur</>
                ) : (
                  <>
                    {(() => {
                      const frontMatch = selectedRequest.additionalNotes?.match(/Vorder(?:achse|reifen): (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
                      const rearMatch = selectedRequest.additionalNotes?.match(/Hinter(?:achse|reifen): (\d+)\/(\d+) R(\d+)(?:\s+(\d+))?(?:\s+([A-Z]+))?/)
                      
                      if (frontMatch && rearMatch) {
                        return (
                          <>
                            Für: 🚗 Mischbereifung •{' '}
                            Vorne: {frontMatch[1]}/{frontMatch[2]} R{frontMatch[3]}
                            {frontMatch[4] && ` ${frontMatch[4]}`}
                            {frontMatch[5] && ` ${frontMatch[5]}`}
                            {' • '}
                            Hinten: {rearMatch[1]}/{rearMatch[2]} R{rearMatch[3]}
                            {rearMatch[4] && ` ${rearMatch[4]}`}
                            {rearMatch[5] && ` ${rearMatch[5]}`}
                            {' • '}{getSeasonLabel(selectedRequest.season)}
                          </>
                        )
                      }
                      
                      const loadSpeed = selectedRequest.loadIndex && selectedRequest.speedRating 
                        ? ` ${selectedRequest.loadIndex}${selectedRequest.speedRating}`
                        : selectedRequest.loadIndex 
                          ? ` ${selectedRequest.loadIndex}`
                          : selectedRequest.speedRating 
                            ? ` ${selectedRequest.speedRating}`
                            : ''
                      
                      return (
                        <>
                          Für: {selectedRequest.width}/{selectedRequest.aspectRatio} R{selectedRequest.diameter}{loadSpeed} • 
                          {' '}{getSeasonLabel(selectedRequest.season)} • 
                          {' '}{selectedRequest.quantity} Reifen
                        </>
                      )
                    })()}
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmitOffer} className="p-6">
              <div className="space-y-6">
                {(selectedRequest.width !== 0 || 
                  selectedRequest.additionalNotes?.includes('BATTERIE-SERVICE') ||
                  selectedRequest.additionalNotes?.includes('BREMSEN-SERVICE')) && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        {selectedRequest.additionalNotes?.includes('BATTERIE-SERVICE') ? 'Batterie-Angebote *' :
                         selectedRequest.additionalNotes?.includes('BREMSEN-SERVICE') ? 'Bremsen-Angebote *' :
                         'Reifenangebote *'}
                      </label>
                      <button
                        type="button"
                        onClick={addTireOption}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Weiteres Angebot hinzufügen
                      </button>
                    </div>
                  
                  <div className="space-y-4">
                    {offerForm.tireOptions.map((option, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-900">
                            Angebot {index + 1}
                          </span>
                          {offerForm.tireOptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTireOption(index)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Entfernen
                            </button>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {selectedRequest.additionalNotes?.includes('BATTERIE-SERVICE') ? 'Batterie (Marke & Modell) *' :
                             selectedRequest.additionalNotes?.includes('BREMSEN-SERVICE') ? 'Bremsbeläge/Bremsscheiben (Marke & Modell) *' :
                             'Reifen (Marke & Modell) *'}
                          </label>
                          <input
                            type="text"
                            value={option.brandModel}
                            onChange={(e) => updateTireOption(index, 'brandModel', e.target.value)}
                            placeholder={selectedRequest.additionalNotes?.includes('BATTERIE-SERVICE') ? 'z.B. Varta Blue Dynamic E11' :
                                       selectedRequest.additionalNotes?.includes('BREMSEN-SERVICE') ? 'z.B. Bosch Bremsbeläge + ATE Bremsscheiben' :
                                       'z.B. Continental PremiumContact 6'}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Einkaufspreis (€) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={option.costPrice}
                              onChange={(e) => {
                                updateTireOption(index, 'costPrice', e.target.value)
                                if (e.target.value && parseFloat(e.target.value) > 0) {
                                  calculateSellingPrice(index, e.target.value)
                                }
                              }}
                              placeholder="0.00"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Verkaufspreis (€) *
                              {option.costPrice && option.pricePerTire && parseFloat(option.costPrice) > 0 && (
                                <span className="ml-1 text-green-600 text-xs">
                                  (berechnet)
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={option.pricePerTire}
                              onChange={(e) => updateTireOption(index, 'pricePerTire', e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-green-50"
                            />
                            {option.costPrice && option.pricePerTire && parseFloat(option.costPrice) > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                Aufschlag: {(parseFloat(option.pricePerTire) - parseFloat(option.costPrice)).toFixed(2)} €
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Motorcycle Tire Type Selection - per tire option */}
                        {selectedRequest.additionalNotes?.includes('🏍️ MOTORRADREIFEN') && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Angebot für *
                            </label>
                            <select
                              value={option.motorcycleTireType || 'BOTH'}
                              onChange={(e) => updateTireOption(index, 'motorcycleTireType', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              required
                            >
                              <option value="BOTH">🏍️ Beide Reifen (Vorne + Hinten)</option>
                              <option value="FRONT">🏍️ Nur Vorderreifen</option>
                              <option value="REAR">🏍️ Nur Hinterreifen</option>
                            </select>
                          </div>
                        )}

                        {/* Brake Axle Selection */}
                        {selectedRequest.additionalNotes?.includes('BREMSEN-SERVICE') && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Angebot für *
                            </label>
                            <select
                              value={option.carTireType || ''}
                              onChange={(e) => updateTireOption(index, 'carTireType', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              required
                            >
                              <option value="">-- Bitte auswählen --</option>
                              <option value="FRONT_TWO">🔴 Vorderachse</option>
                              <option value="REAR_TWO">🔴 Hinterachse</option>
                            </select>
                          </div>
                        )}

                        {/* Car Tire Type Selection - per tire option */}
                        {!selectedRequest.additionalNotes?.includes('🏍️ MOTORRADREIFEN') && 
                         !selectedRequest.additionalNotes?.includes('BREMSEN-SERVICE') &&
                         !selectedRequest.additionalNotes?.includes('BATTERIE-SERVICE') && (() => {
                          // Check if it's mixed tires (different sizes front/rear)
                          const isMixedTires = (selectedRequest.additionalNotes?.includes('Vorderachse:') || selectedRequest.additionalNotes?.includes('Vorderreifen:')) && 
                                               (selectedRequest.additionalNotes?.includes('Hinterachse:') || selectedRequest.additionalNotes?.includes('Hinterreifen:'))
                          
                          // For non-mixed tires (4 identical tires), show dropdown with ALL_FOUR option
                          if (!isMixedTires) {
                            return (
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Angebot für *
                                </label>
                                <select
                                  value={option.carTireType || ''}
                                  onChange={(e) => updateTireOption(index, 'carTireType', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  required
                                >
                                  <option value="">-- Bitte auswählen --</option>
                                  <option value="ALL_FOUR">🚗 Alle 4 Reifen</option>
                                  <option value="FRONT_TWO">🚗 2 Vorderreifen</option>
                                  <option value="REAR_TWO">🚗 2 Hinterreifen</option>
                                </select>
                              </div>
                            )
                          }
                          
                          // For mixed tires, show dropdown without "ALL_FOUR" option (different sizes front/rear)
                          return (
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Angebot für *
                              </label>
                              <select
                                value={option.carTireType || ''}
                                onChange={(e) => updateTireOption(index, 'carTireType', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                              >
                                <option value="">-- Bitte auswählen --</option>
                                <option value="FRONT_TWO">🚗 2 Vorderreifen</option>
                                <option value="REAR_TWO">🚗 2 Hinterreifen</option>
                              </select>
                            </div>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zusätzliche Beschreibung (optional)
                  </label>
                  <textarea
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                    rows={3}
                    placeholder="Weitere Informationen zum Angebot..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Service-Informationen</h3>
                  
                  {offerForm.installationFee && selectedRequest && (() => {
                    const hasDisposal = selectedRequest.additionalNotes?.includes('Altreifenentsorgung gewünscht')
                    const hasRunflat = selectedRequest.isRunflat
                    
                    // Hole Service-Info für Aufschlüsselung
                    const detectedServiceType = detectServiceType(selectedRequest)
                    const service = services.find((s: any) => s.serviceType === detectedServiceType)
                    const isWheelChange = detectedServiceType === 'WHEEL_CHANGE'
                    
                    // Bestimme Reifenanzahl basierend auf ALLEN carTireType Auswahlen
                    let quantity = 0
                    
                    // Bei Räder umstecken immer 4 Räder
                    if (isWheelChange) {
                      quantity = 4
                    } else if (detectedServiceType === 'TIRE_CHANGE') {
                      const hasFront = offerForm.tireOptions.some(opt => opt.carTireType === 'FRONT_TWO' || opt.carTireType === 'ALL_FOUR')
                      const hasRear = offerForm.tireOptions.some(opt => opt.carTireType === 'REAR_TWO' || opt.carTireType === 'ALL_FOUR')
                      const hasAllFour = offerForm.tireOptions.some(opt => opt.carTireType === 'ALL_FOUR')
                      
                      if (hasAllFour || (hasFront && hasRear)) {
                        quantity = 4
                      } else if (hasFront || hasRear) {
                        quantity = 2
                      }
                    }
                    
                    // Berechne Basis-Preis und optionale Zusätze
                    let basePrice = 0
                    let balancingIncluded = 0
                    let storageIncluded = 0
                    const customerWantsBalancing = selectedRequest.additionalNotes?.includes('Wuchten')
                    const customerWantsStorage = selectedRequest.additionalNotes?.includes('Einlagerung')
                    
                    // Service-spezifische Preisberechnung
                    if (detectedServiceType === 'WHEEL_CHANGE') {
                      // Räder umstecken: Basis + optionale Zusätze
                      basePrice = service?.basePrice || 0
                      
                      if (customerWantsBalancing && service?.balancingPrice) {
                        balancingIncluded = service.balancingPrice * 4
                      }
                      
                      if (offerForm.storageAvailable && service?.storagePrice) {
                        storageIncluded = service.storagePrice
                      }
                    } else if (detectedServiceType === 'TIRE_CHANGE' && service?.servicePackages && service.servicePackages.length > 0 && quantity > 0) {
                      // Reifenmontage: Paket basierend auf Anzahl
                      const selectedPackage = quantity === 4 
                        ? service.servicePackages.find((p: any) => p.name.includes('4') || p.name.toLowerCase().includes('alle'))
                        : service.servicePackages.find((p: any) => p.name.includes('2'))
                      if (selectedPackage) {
                        basePrice = selectedPackage.price
                      }
                    } else if (detectedServiceType === 'BRAKE_SERVICE' && service?.servicePackages) {
                      // Brake Service: Calculate total of ALL customer-requested packages
                      const frontSelection = selectedRequest.additionalNotes?.match(/Vorderachse:\s*([^\n]+)/)?.[1]?.trim()
                      const rearSelection = selectedRequest.additionalNotes?.match(/Hinterachse:\s*([^\n]+)/)?.[1]?.trim()
                      
                      const customerWantsFront = frontSelection && frontSelection !== 'Keine Arbeiten'
                      const customerWantsRear = rearSelection && rearSelection !== 'Keine Arbeiten'
                      
                      let totalBrakePrice = 0
                      
                      // Front axle price
                      if (customerWantsFront) {
                        let frontPackage = null
                        if (frontSelection === 'Nur Bremsbeläge') {
                          frontPackage = service.servicePackages.find((p: any) => p.name.includes('Vorderachse') && p.name.includes('Bremsbeläge') && !p.name.includes('Scheiben'))
                        } else if (frontSelection === 'Bremsbeläge + Bremsscheiben') {
                          frontPackage = service.servicePackages.find((p: any) => p.name.includes('Vorderachse') && p.name.includes('Scheiben'))
                        }
                        if (frontPackage) totalBrakePrice += frontPackage.price
                      }
                      
                      // Rear axle price
                      if (customerWantsRear) {
                        let rearPackage = null
                        if (rearSelection === 'Nur Bremsbeläge') {
                          rearPackage = service.servicePackages.find((p: any) => p.name.includes('Hinterachse') && p.name.includes('Bremsbeläge') && !p.name.includes('Scheiben'))
                        } else if (rearSelection === 'Bremsbeläge + Bremsscheiben') {
                          rearPackage = service.servicePackages.find((p: any) => p.name.includes('Hinterachse') && p.name.includes('Scheiben'))
                        } else if (rearSelection === 'Bremsbeläge + Bremsscheiben + Handbremse') {
                          rearPackage = service.servicePackages.find((p: any) => p.name.includes('Hinterachse') && p.name.includes('Handbremse'))
                        }
                        if (rearPackage) totalBrakePrice += rearPackage.price
                      }
                      
                      basePrice = totalBrakePrice
                    } else {
                      // Andere Services (ALIGNMENT, BATTERY, etc.): 
                      // Nutze immer den eingegebenen Gesamtpreis, da diese Services verschiedene Pakete haben können
                      basePrice = parseFloat(offerForm.installationFee) || 0
                    }
                    
                    const disposalFee = hasDisposal && service?.disposalFee && quantity > 0 ? service.disposalFee * quantity : 0
                    const runflatFee = hasRunflat && service?.runFlatSurcharge && quantity > 0 ? service.runFlatSurcharge * quantity : 0
                    
                    // Wenn kein basePrice gefunden, nutze den Gesamtpreis minus Aufschläge
                    if (basePrice === 0 && quantity > 0) {
                      basePrice = parseFloat(offerForm.installationFee) - disposalFee - runflatFee
                    }
                    
                    // Prüfe ob Service-Info angezeigt werden soll
                    const showServiceInfo = isWheelChange || quantity > 0 || 
                      (detectedServiceType !== 'TIRE_CHANGE' && detectedServiceType !== 'WHEEL_CHANGE')
                    
                    return (
                      <div className="space-y-3">
                        {!showServiceInfo && detectedServiceType === 'TIRE_CHANGE' ? (
                          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                            ⚠️ Bitte wählen Sie "Angebot für" aus (z.B. Vorderreifen oder Hinterreifen), um die Montagekosten zu berechnen
                          </div>
                        ) : showServiceInfo ? (
                          <>
                            <div className="space-y-2 text-sm">
                              {/* Special handling for Brake Service - show ALL packages customer requested */}
                              {detectedServiceType === 'BRAKE_SERVICE' ? (() => {
                                const frontSelection = selectedRequest.additionalNotes?.match(/Vorderachse:\s*([^\n]+)/)?.[1]?.trim()
                                const rearSelection = selectedRequest.additionalNotes?.match(/Hinterachse:\s*([^\n]+)/)?.[1]?.trim()
                                
                                const customerWantsFront = frontSelection && frontSelection !== 'Keine Arbeiten'
                                const customerWantsRear = rearSelection && rearSelection !== 'Keine Arbeiten'
                                
                                const packages: Array<{ name: string; price: number }> = []
                                
                                // Front axle - ALWAYS show if customer wants it
                                if (customerWantsFront && service?.servicePackages) {
                                  let frontPackage = null
                                  if (frontSelection === 'Nur Bremsbeläge') {
                                    frontPackage = service.servicePackages.find((p: any) => p.name.includes('Vorderachse') && p.name.includes('Bremsbeläge') && !p.name.includes('Scheiben'))
                                  } else if (frontSelection === 'Bremsbeläge + Bremsscheiben') {
                                    frontPackage = service.servicePackages.find((p: any) => p.name.includes('Vorderachse') && p.name.includes('Scheiben'))
                                  }
                                  if (frontPackage) packages.push({ name: frontPackage.name, price: frontPackage.price })
                                }
                                
                                // Rear axle - ALWAYS show if customer wants it
                                if (customerWantsRear && service?.servicePackages) {
                                  let rearPackage = null
                                  if (rearSelection === 'Nur Bremsbeläge') {
                                    rearPackage = service.servicePackages.find((p: any) => p.name.includes('Hinterachse') && p.name.includes('Bremsbeläge') && !p.name.includes('Scheiben'))
                                  } else if (rearSelection === 'Bremsbeläge + Bremsscheiben') {
                                    rearPackage = service.servicePackages.find((p: any) => p.name.includes('Hinterachse') && p.name.includes('Scheiben'))
                                  } else if (rearSelection === 'Bremsbeläge + Bremsscheiben + Handbremse') {
                                    rearPackage = service.servicePackages.find((p: any) => p.name.includes('Hinterachse') && p.name.includes('Handbremse'))
                                  }
                                  if (rearPackage) packages.push({ name: rearPackage.name, price: rearPackage.price })
                                }
                                
                                return (
                                  <>
                                    {packages.map((pkg, idx) => (
                                      <div key={idx} className="flex justify-between">
                                        <span className="text-gray-700">{pkg.name}</span>
                                        <span className="font-medium">{pkg.price.toFixed(2)} €</span>
                                      </div>
                                    ))}
                                  </>
                                )
                              })() : (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">
                                    {(() => {
                                      // Zeige detaillierte Beschreibung für Services mit Packages
                                      if (offerForm.serviceName && (
                                        detectedServiceType === 'ALIGNMENT_BOTH' || 
                                        detectedServiceType === 'CLIMATE_SERVICE' ||
                                        detectedServiceType === 'BATTERY_SERVICE' ||
                                        detectedServiceType === 'TIRE_REPAIR'
                                      )) {
                                        return getServiceDetailName(offerForm.serviceName, detectedServiceType)
                                      } else {
                                        return getServiceName(detectedServiceType)
                                      }
                                    })()}
                                  </span>
                                  <span className="font-medium">{isWheelChange && service?.basePrice ? service.basePrice.toFixed(2) : basePrice.toFixed(2)} €</span>
                                </div>
                              )}
                              {isWheelChange && customerWantsBalancing && service?.balancingPrice && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Wuchten (4 × {service.balancingPrice.toFixed(2)} €)</span>
                                  <span className="font-medium">{(service.balancingPrice * 4).toFixed(2)} €</span>
                                </div>
                              )}
                              {isWheelChange && offerForm.storageAvailable && service?.storagePrice && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">Einlagerung</span>
                                  <span className="font-medium">{service.storagePrice.toFixed(2)} €</span>
                                </div>
                              )}
                              {!isWheelChange && disposalFee > 0 && service?.disposalFee && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">+ Altreifenentsorgung ({quantity} × {service.disposalFee.toFixed(2)} €)</span>
                                  <span className="font-medium">{disposalFee.toFixed(2)} €</span>
                                </div>
                              )}
                              {!isWheelChange && runflatFee > 0 && service?.runFlatSurcharge && (
                                <div className="flex justify-between">
                                  <span className="text-gray-700">+ Runflat-Aufschlag ({quantity} × {service.runFlatSurcharge.toFixed(2)} €)</span>
                                  <span className="font-medium">{runflatFee.toFixed(2)} €</span>
                                </div>
                              )}
                              <div className="border-t-2 border-blue-400 pt-3 mt-3">
                                <div className="flex justify-between items-start">
                                  <span className="text-base font-bold text-gray-900">Gesamtpreis</span>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-primary-600">
                                      {parseFloat(offerForm.installationFee).toFixed(2)} €
                                    </div>
                                    {workshopTaxMode === 'STANDARD' && (
                                      <div className="text-xs text-gray-600 mt-1">inkl. MwSt.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-blue-200">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Dauer</span>
                                <span className="font-medium text-gray-900">
                                  {offerForm.durationMinutes ? `${offerForm.durationMinutes} Minuten` : 'Nicht konfiguriert'}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    )
                  })()}
                  
                  {!offerForm.installationFee && (
                    <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      ⚠️ Bitte konfigurieren Sie zuerst Ihre Services in der Service-Verwaltung
                    </div>
                  )}
                </div>

                {/* Checkbox for manual price adjustment on Battery/Brake services */}
                {selectedRequest && (detectServiceType(selectedRequest) === 'BATTERY_SERVICE' || detectServiceType(selectedRequest) === 'BRAKE_SERVICE') && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="customPriceEnabled"
                        checked={offerForm.customPriceEnabled || false}
                        onChange={(e) => {
                          setOfferForm({ 
                            ...offerForm, 
                            customPriceEnabled: e.target.checked
                          })
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="customPriceEnabled" className="text-sm text-gray-700">
                        Bei einigen Fahrzeugen kann der Preis abweichen
                      </label>
                    </div>
                  </div>
                )}

                {/* Manual price input fields (only visible when checkbox is checked for Battery/Brake) */}
                {selectedRequest && (detectServiceType(selectedRequest) === 'BATTERY_SERVICE' || detectServiceType(selectedRequest) === 'BRAKE_SERVICE') && offerForm.customPriceEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Angepasster Preis (€) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={offerForm.installationFee}
                        onChange={(e) => setOfferForm({ ...offerForm, installationFee: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Angepasste Dauer (Minuten) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={offerForm.durationMinutes}
                        onChange={(e) => setOfferForm({ ...offerForm, durationMinutes: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="60"
                      />
                    </div>
                  </div>
                )}

                {/* Standard price and duration fields for other services */}
                {selectedRequest && detectServiceType(selectedRequest) !== 'BATTERY_SERVICE' && detectServiceType(selectedRequest) !== 'BRAKE_SERVICE' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {selectedRequest.additionalNotes?.includes('🔧 SONSTIGE REIFENSERVICES') ? 'Preis (€) *' : 'Montagekosten (€) *'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={offerForm.installationFee}
                        onChange={(e) => setOfferForm({ ...offerForm, installationFee: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dauer (Minuten) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={offerForm.durationMinutes}
                        onChange={(e) => setOfferForm({ ...offerForm, durationMinutes: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="60"
                      />
                    </div>
                  </div>
                )}

                {selectedRequest && detectServiceType(selectedRequest) === 'WHEEL_CHANGE' && (() => {
                  const service = services.find((s: any) => s.serviceType === 'WHEEL_CHANGE')
                  const storagePrice = service?.storagePrice || 0
                  
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Einlagerung anbieten
                        </label>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="offerStorage"
                              checked={offerForm.storageAvailable || false}
                              onChange={(e) => {
                                const isChecked = e.target.checked
                                const currentInstallation = parseFloat(offerForm.installationFee) || 0
                                const newInstallation = isChecked 
                                  ? currentInstallation + storagePrice 
                                  : currentInstallation - storagePrice
                                
                                setOfferForm({ 
                                  ...offerForm, 
                                  storageAvailable: isChecked,
                                  storagePrice: isChecked ? storagePrice.toString() : '',
                                  installationFee: newInstallation.toFixed(2)
                                })
                              }}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="offerStorage" className="text-sm text-gray-700">
                              Ich biete Einlagerung an {storagePrice > 0 && `(${storagePrice.toFixed(2)} €/Saison)`}
                            </label>
                          </div>
                          {storagePrice === 0 && (
                            <p className="text-xs text-amber-600 mt-2">
                              ⚠️ Bitte konfigurieren Sie den Einlagerungspreis in der Service-Verwaltung
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Der Kunde kann beim Annehmen des Angebots wählen, ob er die Einlagerung möchte
                          </p>
                        </div>
                      </div>
                    </>
                  )
                })()}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Angebot gültig für (Tage)
                  </label>
                  <select
                    value={offerForm.validDays}
                    onChange={(e) => setOfferForm({ ...offerForm, validDays: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={3}>3 Tage</option>
                    <option value={7}>7 Tage</option>
                    <option value={14}>14 Tage</option>
                    <option value={30}>30 Tage</option>
                  </select>
                </div>


              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferForm(false)
                    setSelectedRequest(null)
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Wird erstellt...' : 'Angebot senden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
