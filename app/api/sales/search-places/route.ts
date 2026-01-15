import { NextResponse } from 'next/server';
import { searchNearbyWorkshops, getPlaceDetails, getPhotoUrl, parseAddressComponents, calculateLeadScoreBreakdown, isTireServiceShop, translateOpeningHours } from '@/lib/googlePlaces';
import { prisma } from '@/lib/prisma';
import { getSalesUser } from '@/lib/sales-auth';

/**
 * POST /api/sales/search-places
 * 
 * Search for workshops in Google Places
 */
export async function POST(request: Request) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { location, radius, keyword, country, pageToken } = body;

    if (!location && !pageToken) {
      return NextResponse.json({ error: 'Location is required for initial search' }, { status: 400 });
    }

    // Search nearby places
    const { results: places, nextPageToken } = await searchNearbyWorkshops({
      location,
      radius: radius || 10000,
      keyword: keyword || 'Reifenservice Werkstatt',
      country: country || 'DE',
      pageToken
    });

    // Filter for tire service shops
    const filteredPlaces = places.filter(isTireServiceShop);

    // Enrich with existing prospects data and detailed information
    const enrichedPlaces = await Promise.all(
      filteredPlaces.map(async (place) => {
        // Get detailed information (phone, website, opening hours)
        const details = await getPlaceDetails(place.place_id);
        
        // Check if already exists
        const existing = await prisma.prospectWorkshop.findUnique({
          where: { googlePlaceId: place.place_id }
        });

        // Use formatted_address OR vicinity (Google Nearby Search often doesn't return formatted_address)
        const addressString = place.formatted_address || place.vicinity || '';
        
        // Parse address
        const addressParts = addressString 
          ? parseAddressComponents(addressString)
          : { street: '', city: '', postalCode: '', state: '', country: country || 'DE' };

        // Calculate lead score with breakdown
        const scoreData = calculateLeadScoreBreakdown(details || place);

        // Generate photo URLs
        const photoUrls = (details?.photos || place.photos)?.slice(0, 3).map(photo => 
          getPhotoUrl(photo.photo_reference)
        ) || [];

        // Extract and translate opening hours to German
        const openingHoursRaw = details?.opening_hours?.weekday_text || [];
        const openingHours = openingHoursRaw.length > 0 ? translateOpeningHours(openingHoursRaw) : [];

        // Build final display address (use parsed addressString as primary source)
        let finalAddress = addressString;
        
        // If no address from Google, build from parsed parts
        if (!finalAddress && (addressParts.street || addressParts.city)) {
          const parts = [
            addressParts.street,
            addressParts.postalCode && addressParts.city ? `${addressParts.postalCode} ${addressParts.city}` : (addressParts.city || '')
          ].filter(Boolean);
          finalAddress = parts.join(', ');
        }

        const result = {
          googlePlaceId: place.place_id,
          name: place.name,
          address: finalAddress || 'Adresse nicht verfügbar',
          ...addressParts,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating,
          reviewCount: place.user_ratings_total || 0,
          priceLevel: details?.price_level || place.price_level,
          phone: details?.formatted_phone_number || details?.international_phone_number,
          website: details?.website,
          openingHours,
          photoUrls,
          placeTypes: place.types || [],
          leadScore: scoreData.total,
          leadScoreBreakdown: scoreData.breakdown,
          isExisting: !!existing,
          existingStatus: existing?.status,
          existingId: existing?.id
        };

        return result;
      })
    );

    // Sort by lead score (highest first)
    enrichedPlaces.sort((a, b) => b.leadScore - a.leadScore);

    return NextResponse.json({
      results: enrichedPlaces,
      total: enrichedPlaces.length,
      nextPageToken,
      searchParams: { location, radius, keyword }
    });

  } catch (error: any) {
    console.error('Error searching places:', error);
    return NextResponse.json({ 
      error: 'Failed to search places',
      details: error.message 
    }, { status: 500 });
  }
}
