/**
 * Google Places API Integration for Sales CRM
 * 
 * Features:
 * - Nearby Search for car repair shops
 * - Place Details enrichment
 * - Photo URL generation
 * - Deduplication logic
 */

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

export interface PlaceSearchParams {
  location: string; // "lat,lng" or address
  radius?: number; // in meters (default: 10000 = 10km)
  keyword?: string; // Additional search keyword
  country?: string; // ISO country code: DE, AT, CH
  pageToken?: string; // For pagination (next_page_token from previous response)
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  business_status?: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      close: { day: number; time: string };
      open: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  business_status?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

/**
 * Search for nearby car repair shops
 * Returns results and optional next_page_token for pagination
 */
export async function searchNearbyWorkshops(params: PlaceSearchParams): Promise<{
  results: PlaceResult[];
  nextPageToken?: string;
  searchLocation?: { lat: number; lng: number };
}> {
  try {
    const country = params.country || 'DE';
    
    // Geocode if location is an address (skip for pagination requests)
    let location = params.location;
    let searchCoords = { lat: 0, lng: 0 };
    
    if (location && !location.includes(',')) {
      location = await geocodeAddress(params.location, country);
    }
    
    // Extract coordinates from location string (format: "lat,lng")
    if (location && location.includes(',')) {
      const [lat, lng] = location.split(',').map(s => parseFloat(s.trim()));
      searchCoords = { lat, lng };
    }

    const radius = params.radius || 10000; // 10km default
    const keyword = params.keyword || 'Reifenservice Werkstatt';
    
    // Build search URL
    const searchUrl = new URL(`${PLACES_API_BASE}/nearbysearch/json`);
    
    // Use pagetoken if provided (for pagination)
    if (params.pageToken) {
      searchUrl.searchParams.set('pagetoken', params.pageToken);
      searchUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY!);
    } else {
      // Initial search with location and filters
      searchUrl.searchParams.set('location', location);
      searchUrl.searchParams.set('radius', radius.toString());
      searchUrl.searchParams.set('type', 'car_repair');
      searchUrl.searchParams.set('keyword', keyword);
      searchUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY!);
      // Add country bias (Google Places uses 'region' for country biasing)
      searchUrl.searchParams.set('region', country.toLowerCase());
    }

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }

    return {
      results: data.results || [],
      nextPageToken: data.next_page_token,
      searchLocation: searchCoords
    };
  } catch (error) {
    console.error('Error searching nearby workshops:', error);
    throw error;
  }
}

/**
 * Get detailed information about a place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set('fields', [
      'place_id',
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'price_level',
      'opening_hours',
      'geometry',
      'photos',
      'types',
      'business_status',
      'reviews'
    ].join(','));
    detailsUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY!);

    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error(`Place details error for ${placeId}:`, data.status);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

/**
 * Generate photo URL from photo reference
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Geocode an address to lat,lng
 */
async function geocodeAddress(address: string, country: string = 'DE'): Promise<string> {
  try {
    const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodeUrl.searchParams.set('address', address);
    geocodeUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY!);
    
    // Add country bias to improve geocoding accuracy
    geocodeUrl.searchParams.set('region', country.toLowerCase());
    geocodeUrl.searchParams.set('components', `country:${country}`);

    const response = await fetch(geocodeUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results.length) {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const location = data.results[0].geometry.location;
    return `${location.lat},${location.lng}`;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

/**
 * Parse address components from Google Places
 */
export function parseAddressComponents(formattedAddress: string): {
  street: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
} {
  // Handle empty or null address
  if (!formattedAddress || formattedAddress.trim().length === 0) {
    return { street: '', city: '', postalCode: '', state: '', country: 'DE' };
  }

  // Beispiel: "Hauptstraße 123, 10115 Berlin, Deutschland"
  const parts = formattedAddress.split(',').map(p => p.trim()).filter(Boolean);
  
  let street = '';
  let city = '';
  let postalCode = '';
  let state = '';
  let country = 'DE';

  // Try to extract postal code from anywhere in the address
  const plzRegex = /\b(\d{5})\b/; // German postal code (5 digits)
  for (let i = 0; i < parts.length; i++) {
    const plzMatch = parts[i].match(plzRegex);
    if (plzMatch) {
      postalCode = plzMatch[1];
      // Extract city name after the postal code
      const afterPLZ = parts[i].replace(plzMatch[0], '').trim();
      if (afterPLZ) {
        city = afterPLZ;
      }
      break;
    }
  }

  // Street is typically the first part
  if (parts.length > 0 && !parts[0].match(plzRegex)) {
    street = parts[0];
  }

  // If no city found yet, try second-to-last part
  if (!city && parts.length >= 2) {
    const secondPart = parts[parts.length - 2];
    if (!secondPart.match(plzRegex)) {
      city = secondPart;
    }
  }

  // Country is typically the last part
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    const lastPartLower = lastPart?.toLowerCase() || '';
    if (lastPartLower.includes('deutschland') || lastPartLower.includes('germany')) {
      country = 'DE';
    } else if (lastPartLower.includes('österreich') || lastPartLower.includes('austria')) {
      country = 'AT';
    } else if (lastPartLower.includes('schweiz') || lastPartLower.includes('switzerland')) {
      country = 'CH';
    }
  }

  return { street, city, postalCode, state, country };
}

/**
 * Translate English weekday opening hours to German
 */
export function translateOpeningHours(weekdayText: string[]): string[] {
  const translations: { [key: string]: string } = {
    'Monday': 'Montag',
    'Tuesday': 'Dienstag',
    'Wednesday': 'Mittwoch',
    'Thursday': 'Donnerstag',
    'Friday': 'Freitag',
    'Saturday': 'Samstag',
    'Sunday': 'Sonntag',
    'Closed': 'Geschlossen',
    'Open 24 hours': '24 Stunden geöffnet'
  };

  return weekdayText.map(line => {
    let translated = line;
    
    // Translate day names
    Object.entries(translations).forEach(([en, de]) => {
      translated = translated.replace(en, de);
    });
    
    // Convert AM/PM to 24-hour format
    // Pattern: "1:00 PM" -> "13:00"
    translated = translated.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (match, hour, minute, period) => {
      let h = parseInt(hour);
      const isPM = period.toUpperCase() === 'PM';
      
      if (isPM && h !== 12) {
        h += 12;
      } else if (!isPM && h === 12) {
        h = 0;
      }
      
      return `${h.toString().padStart(2, '0')}:${minute}`;
    });
    
    return translated;
  });
}

/**
 * Calculate lead score with breakdown
 */
export function calculateLeadScoreBreakdown(place: PlaceResult | PlaceDetails): {
  total: number;
  breakdown: Array<{ label: string; points: number }>;
} {
  const breakdown: Array<{ label: string; points: number }> = [
    { label: 'Basis-Score', points: 50 }
  ];

  // Rating bonus
  if (place.rating) {
    if (place.rating >= 4.5) breakdown.push({ label: 'Sehr gute Bewertung (≥4.5⭐)', points: 20 });
    else if (place.rating >= 4.0) breakdown.push({ label: 'Gute Bewertung (≥4.0⭐)', points: 15 });
    else if (place.rating >= 3.5) breakdown.push({ label: 'Solide Bewertung (≥3.5⭐)', points: 10 });
    else if (place.rating < 3.0) breakdown.push({ label: 'Niedrige Bewertung (<3.0⭐)', points: -10 });
  }

  // Review count bonus
  if (place.user_ratings_total) {
    if (place.user_ratings_total >= 100) breakdown.push({ label: 'Viele Bewertungen (≥100)', points: 15 });
    else if (place.user_ratings_total >= 50) breakdown.push({ label: 'Gute Anzahl Bewertungen (≥50)', points: 10 });
    else if (place.user_ratings_total >= 20) breakdown.push({ label: 'Einige Bewertungen (≥20)', points: 5 });
  }

  // Has website bonus
  if ('website' in place && place.website) {
    breakdown.push({ label: 'Website vorhanden', points: 10 });
  }

  // Has phone bonus
  if ('formatted_phone_number' in place && place.formatted_phone_number) {
    breakdown.push({ label: 'Telefonnummer vorhanden', points: 10 });
  }

  // Has photos bonus
  if (place.photos && place.photos.length > 0) {
    breakdown.push({ label: 'Fotos vorhanden', points: 5 });
  }

  // Business status check
  if (place.business_status === 'OPERATIONAL') {
    breakdown.push({ label: 'Betrieb aktiv', points: 5 });
  } else if (place.business_status === 'CLOSED_PERMANENTLY') {
    breakdown.push({ label: 'Betrieb geschlossen', points: -100 });
  }

  // Calculate total
  const total = breakdown.reduce((sum, item) => sum + item.points, 0);

  // Ensure score is within 0-100
  return {
    total: Math.max(0, Math.min(100, total)),
    breakdown
  };
}

/**
 * Calculate lead score based on Google Places data (legacy function)
 */
export function calculateLeadScore(place: PlaceResult | PlaceDetails): number {
  return calculateLeadScoreBreakdown(place).total;
}

/**
 * Check if place is likely a tire/car service shop
 */
export function isTireServiceShop(place: PlaceResult | PlaceDetails): boolean {
  const name = place.name?.toLowerCase() || '';
  const types = Array.isArray(place.types) ? place.types : [];
  
  const tireKeywords = [
    'reifen',
    'tire',
    'pneu',
    'rad',
    'wheel',
    'kfz',
    'auto',
    'car',
    'werkstatt',
    'service',
    'garage'
  ];

  // Check name
  const hasKeywordInName = tireKeywords.some(keyword => name.includes(keyword));
  
  // Check types
  const relevantTypes = [
    'car_repair',
    'car_dealer',
    'car_wash',
    'gas_station'
  ];
  const hasRelevantType = types.some(type => relevantTypes.includes(type));

  return hasKeywordInName || hasRelevantType;
}
