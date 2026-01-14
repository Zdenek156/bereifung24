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
      return NextResponse.json({ error: 'Location or pageToken is required' }, { status: 400 });
    }

    // Search nearby places
    const { results: places, nextPageToken } = await searchNearbyWorkshops({
      location,
      radius: radius || 10000,
      keyword: keyword || 'Reifenservice Werkstatt',
      country: country || 'DE',
      pageToken
    });

    // Filter for tire service shops and limit to 50 results
    const filteredPlaces = places.filter(isTireServiceShop).slice(0, 50);

    // Enrich with existing prospects data and detailed information
    const enrichedPlaces = await Promise.all(
      filteredPlaces.map(async (place) => {
        // Get detailed information (phone, website, opening hours)
        const details = await getPlaceDetails(place.place_id);
        
        // Check if already exists
        const existing = await prisma.prospectWorkshop.findUnique({
          where: { googlePlaceId: place.place_id }
        });

        // Parse address (handle undefined formatted_address)
        const addressParts = place.formatted_address 
          ? parseAddressComponents(place.formatted_address)
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

        const result = {
          googlePlaceId: place.place_id,
          name: place.name,
          ...addressParts,
          address: place.formatted_address || '',
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating,
          reviewCount: place.user_ratings_total || 0,
          priceLevel: details?.price_level || place.price_level,
          phone: details?.formatted_phone_number || details?.international_phone_number,
          website: details?.website,
          openingHours,
          photoUrls,
          placeTypes: place.types,
          leadScore: scoreData.total,
          leadScoreBreakdown: scoreData.breakdown,
          isExisting: !!existing,
          existingStatus: existing?.status,
          existingId: existing?.id
        };

        // Debug logging
        console.log('[SEARCH-PLACES] Result:', {
          name: result.name,
          address: result.address,
          city: result.city,
          postalCode: result.postalCode,
          hasBreakdown: !!result.leadScoreBreakdown,
          breakdownLength: result.leadScoreBreakdown?.length || 0
        });

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
