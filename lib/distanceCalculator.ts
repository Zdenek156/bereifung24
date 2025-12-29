/**
 * Calculate distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

interface Workshop {
  id: string;
  distance: number;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Find nearest workshops to a given location
 * @param customerLat Customer latitude
 * @param customerLon Customer longitude
 * @param workshops List of workshops with their coordinates
 * @param limit Number of nearest workshops to return
 * @returns Array of workshops sorted by distance
 */
export function findNearestWorkshops(
  customerLat: number,
  customerLon: number,
  workshops: Array<{ id: string; latitude?: number | null; longitude?: number | null }>,
  limit: number
): Workshop[] {
  const workshopsWithDistance = workshops
    .filter(ws => ws.latitude && ws.longitude)
    .map(ws => ({
      id: ws.id,
      latitude: ws.latitude,
      longitude: ws.longitude,
      distance: calculateDistance(
        customerLat,
        customerLon,
        ws.latitude!,
        ws.longitude!
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
  
  return workshopsWithDistance;
}
