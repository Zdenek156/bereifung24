'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  bookingsCount: number;
  totalRevenue: number;
}

interface Workshop {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  hasSepaMandateActive: boolean;
  bookingsCount: number;
  totalRevenue: number;
}

interface PostalCodeStat {
  zipCode: string;
  customers: number;
  workshops: number;
  bookings: number;
  revenue: number;
  coverage: number;
}

interface Props {
  customers: Customer[];
  workshops: Workshop[];
  postalCodeStats: PostalCodeStat[];
}

// Simple geocoding cache for German postal codes
const germanPostalCodeCoordinates: Record<string, [number, number]> = {
  // Major cities as reference points (will be enhanced with more data)
  '10': [52.5200, 13.4050], // Berlin
  '20': [53.5511, 9.9937],  // Hamburg
  '30': [52.3759, 9.7320],  // Hannover
  '40': [51.2277, 6.7735],  // Düsseldorf
  '50': [50.9375, 6.9603],  // Köln
  '60': [50.1109, 8.6821],  // Frankfurt
  '70': [48.7758, 9.1829],  // Stuttgart
  '80': [48.1351, 11.5820], // München
  '90': [49.4521, 11.0767], // Nürnberg
};

// Approximate coordinates based on first 2 digits of postal code
function getCoordinatesForPostalCode(zipCode: string): [number, number] | null {
  if (!zipCode) return null;
  
  // Try exact match first
  if (germanPostalCodeCoordinates[zipCode]) {
    return germanPostalCodeCoordinates[zipCode];
  }
  
  // Try first 2 digits
  const prefix = zipCode.substring(0, 2);
  if (germanPostalCodeCoordinates[prefix]) {
    // Add slight random offset to avoid exact overlaps
    const [lat, lng] = germanPostalCodeCoordinates[prefix];
    const offset = 0.1;
    return [
      lat + (Math.random() - 0.5) * offset,
      lng + (Math.random() - 0.5) * offset
    ];
  }
  
  // Fallback: estimate based on prefix number
  const prefixNum = parseInt(prefix);
  if (prefixNum >= 0 && prefixNum <= 99) {
    // Rough approximation of German geography
    const lat = 47 + (prefixNum / 99) * 8; // 47°N to 55°N
    const lng = 6 + ((prefixNum % 30) / 30) * 9; // 6°E to 15°E
    return [lat, lng];
  }
  
  return null;
}

export default function TerritoryMap({ customers, workshops, postalCodeStats }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Germany
    const map = L.map(mapRef.current).setView([51.1657, 10.4515], 6);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create custom icons
    const customerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #3B82F6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const workshopIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #EF4444; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const inactiveWorkshopIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #9CA3AF; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Add customer markers
    customers.forEach((customer) => {
      // Use database coordinates if available, otherwise try to estimate from postal code
      const coords: [number, number] | null = 
        (customer.latitude && customer.longitude) 
          ? [customer.latitude, customer.longitude]
          : getCoordinatesForPostalCode(customer.zipCode || '');
      
      if (coords) {
        const marker = L.marker(coords, { icon: customerIcon }).addTo(map);
        
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1F2937;">
              👤 ${customer.name}
            </h3>
            <div style="font-size: 12px; color: #4B5563; line-height: 1.5;">
              ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
              ${customer.phone ? `<p><strong>Tel:</strong> ${customer.phone}</p>` : ''}
              ${customer.address ? `<p><strong>Adresse:</strong> ${customer.address}</p>` : ''}
              ${customer.city ? `<p><strong>Stadt:</strong> ${customer.city}, ${customer.zipCode}</p>` : ''}
              <hr style="margin: 8px 0; border-color: #E5E7EB;" />
              <p><strong>� Buchungen:</strong> ${customer.bookingsCount}</p>
              <p><strong>💰 Umsatz:</strong> ${customer.totalRevenue.toFixed(2)}€</p>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
      }
    });

    // Add workshop markers
    workshops.forEach((workshop) => {
      // Use database coordinates if available, otherwise try to estimate from postal code
      const coords: [number, number] | null = 
        (workshop.latitude && workshop.longitude) 
          ? [workshop.latitude, workshop.longitude]
          : getCoordinatesForPostalCode(workshop.zipCode || '');
      
      if (coords) {
        const marker = L.marker(coords, { icon: workshopIcon }).addTo(map);
        
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1F2937;">
              🔧 ${workshop.name}
            </h3>
            <div style="font-size: 12px; color: #4B5563; line-height: 1.5;">
              ${workshop.email ? `<p><strong>Email:</strong> ${workshop.email}</p>` : ''}
              ${workshop.phone ? `<p><strong>Tel:</strong> ${workshop.phone}</p>` : ''}
              ${workshop.address ? `<p><strong>Adresse:</strong> ${workshop.address}</p>` : ''}
              ${workshop.city ? `<p><strong>Stadt:</strong> ${workshop.city}, ${workshop.zipCode}</p>` : ''}
              <hr style="margin: 8px 0; border-color: #E5E7EB;" />
              <p>
                <strong>SEPA:</strong> 
                <span style="color: ${workshop.hasSepaMandateActive ? '#10B981' : '#EF4444'}; font-weight: 600;">
                  ${workshop.hasSepaMandateActive ? '✓ Aktiv' : '✗ Nicht aktiv'}
                </span>
              </p>
              <hr style="margin: 8px 0; border-color: #E5E7EB;" />
              <p><strong>� Buchungen:</strong> ${workshop.bookingsCount}</p>
              <p><strong>💰 Umsatz:</strong> ${workshop.totalRevenue.toFixed(2)}€</p>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
      }
    });

    // Add postal code circles for areas with high activity
    postalCodeStats
      .filter(stat => stat.bookings > 0)
      .forEach((stat) => {
        const coords = getCoordinatesForPostalCode(stat.zipCode);
        if (coords) {
          // Color based on workshop coverage
          const color = stat.workshops === 0 ? '#EF4444' : // Red - no workshops
                       stat.workshops < stat.customers ? '#F59E0B' : // Orange - underserved
                       '#10B981'; // Green - good coverage
          
          // Size based on booking volume
          const radius = Math.min(Math.max(stat.bookings * 2000, 3000), 20000);
          
          const circle = L.circle(coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.1,
            radius: radius,
            weight: 2,
          }).addTo(map);

          const circlePopup = `
            <div style="min-width: 180px;">
              <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1F2937;">
                📮 PLZ ${stat.zipCode}
              </h3>
              <div style="font-size: 12px; color: #4B5563; line-height: 1.5;">
                <p><strong>👥 Kunden:</strong> ${stat.customers}</p>
                <p><strong>🔧 Werkstätten:</strong> ${stat.workshops}</p>
                <p><strong>📅 Buchungen:</strong> ${stat.bookings}</p>
                <p><strong>💰 Umsatz:</strong> ${stat.revenue.toFixed(2)}€</p>
                <hr style="margin: 8px 0; border-color: #E5E7EB;" />
                <p>
                  <strong>Abdeckung:</strong> 
                  <span style="color: ${color}; font-weight: 600;">
                    ${stat.workshops === 0 ? '⚠️ Keine Werkstatt' : 
                      stat.workshops < stat.customers ? '⚡ Unterversorgt' : 
                      '✓ Gut abgedeckt'}
                  </span>
                </p>
              </div>
            </div>
          `;
          
          circle.bindPopup(circlePopup);
        }
      });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [customers, workshops, postalCodeStats]);

  return (
    <div>
      <div ref={mapRef} style={{ height: '600px', width: '100%', borderRadius: '8px' }} />
      
      {/* Legend */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Legende</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow"></div>
            <span className="text-gray-700">Kunden</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow"></div>
            <span className="text-gray-700">Aktive Werkstätten</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white shadow"></div>
            <span className="text-gray-700">Inaktive Werkstätten</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-red-500 rounded-full bg-red-100"></div>
            <span className="text-gray-700">PLZ ohne Werkstatt</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-orange-500 rounded-full bg-orange-100"></div>
            <span className="text-gray-700">PLZ unterversorgt</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-green-500 rounded-full bg-green-100"></div>
            <span className="text-gray-700">PLZ gut abgedeckt</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Tipp: Klicken Sie auf Marker oder Kreise für detaillierte Informationen. 
          Kreise zeigen PLZ-Gebiete mit Aktivität - Größe entspricht Anfragenvolumen.
        </p>
      </div>
    </div>
  );
}
