import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { searchNearbyWorkshops, getPlaceDetails, getPhotoUrl, parseAddressComponents, calculateLeadScore, isTireServiceShop } from '@/lib/googlePlaces';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sales/search-places
 * 
 * Search for workshops in Google Places
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is B24 employee
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email }
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Forbidden - Only B24 employees allowed' }, { status: 403 });
    }

    const body = await request.json();
    const { location, radius, keyword } = body;

    if (!location) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    // Search nearby places
    const places = await searchNearbyWorkshops({
      location,
      radius: radius || 10000,
      keyword: keyword || 'Reifenservice Werkstatt'
    });

    // Filter for tire service shops
    const filteredPlaces = places.filter(isTireServiceShop);

    // Enrich with existing prospects data
    const enrichedPlaces = await Promise.all(
      filteredPlaces.map(async (place) => {
        // Check if already exists
        const existing = await prisma.prospectWorkshop.findUnique({
          where: { googlePlaceId: place.place_id }
        });

        // Parse address
        const addressParts = parseAddressComponents(place.formatted_address);

        // Calculate lead score
        const leadScore = calculateLeadScore(place);

        // Generate photo URLs
        const photoUrls = place.photos?.slice(0, 3).map(photo => 
          getPhotoUrl(photo.photo_reference)
        ) || [];

        return {
          googlePlaceId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          ...addressParts,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating,
          reviewCount: place.user_ratings_total || 0,
          priceLevel: place.price_level,
          photoUrls,
          placeTypes: place.types,
          leadScore,
          isExisting: !!existing,
          existingStatus: existing?.status,
          existingId: existing?.id
        };
      })
    );

    // Sort by lead score (highest first)
    enrichedPlaces.sort((a, b) => b.leadScore - a.leadScore);

    return NextResponse.json({
      results: enrichedPlaces,
      total: enrichedPlaces.length,
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
