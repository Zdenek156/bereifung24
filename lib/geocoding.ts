// Google Maps Geocoding Service
// Konvertiert Adressen zu Koordinaten für Umkreissuche

interface GeocodeResult {
  latitude: number
  longitude: number
  formattedAddress?: string
  city?: string
}

/**
 * Konvertiert eine Adresse in Koordinaten mit Google Geocoding API
 * @param street - Straße mit Hausnummer
 * @param zipCode - Postleitzahl
 * @param city - Stadt
 * @returns Koordinaten oder null bei Fehler
 */
export async function geocodeAddress(
  street: string,
  zipCode: string,
  city: string
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY not configured')
    return null
  }

  try {
    const address = `${street}, ${zipCode} ${city}, Germany`
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      const addressComponents = data.results[0].address_components
      
      // Extract city from address components
      let city: string | undefined
      for (const component of addressComponents) {
        if (component.types.includes('locality')) {
          city = component.long_name
          break
        }
      }
      
      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: data.results[0].formatted_address,
        city: city
      }
    }

    console.error('Geocoding failed:', data.status, data.error_message)
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Filtert Werkstätten nach Entfernung vom Kundenstandort
 */
export function filterWorkshopsByRadius<T extends { latitude: number | null; longitude: number | null }>(
  workshops: T[],
  customerLat: number,
  customerLon: number,
  radiusKm: number
): (T & { distance: number })[] {
  return workshops
    .filter(workshop => workshop.latitude !== null && workshop.longitude !== null)
    .map(workshop => ({
      ...workshop,
      distance: calculateDistance(customerLat, customerLon, workshop.latitude!, workshop.longitude!)
    }))
    .filter(workshop => workshop.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Berechnet die Distanz zwischen zwei Koordinaten in Kilometern (Haversine-Formel)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Erdradius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 10) / 10 // Runde auf 1 Dezimalstelle
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Prüft ob eine Position innerhalb eines Radius liegt
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon)
  return distance <= radiusKm
}
