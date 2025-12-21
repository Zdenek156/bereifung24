import { NextResponse } from 'next/server';
import { getPlaceDetails, getPhotoUrl, parseAddressComponents, calculateLeadScore } from '@/lib/googlePlaces';
import { prisma } from '@/lib/prisma';
import { getSalesUser } from '@/lib/sales-auth';

/**
 * POST /api/sales/import-prospects
 * 
 * Import selected places as prospects
 */
export async function POST(request: Request) {
  try {
    const employee = await getSalesUser();

    if (!employee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { placeIds, assignToMe, autoEnrich } = body;

    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return NextResponse.json({ error: 'placeIds array is required' }, { status: 400 });
    }

    const results = {
      imported: [] as any[],
      skipped: [] as any[],
      errors: [] as any[]
    };

    for (const placeId of placeIds) {
      try {
        // Check if already exists
        const existing = await prisma.prospectWorkshop.findUnique({
          where: { googlePlaceId: placeId }
        });

        if (existing) {
          results.skipped.push({
            placeId,
            reason: 'Already exists',
            prospectId: existing.id
          });
          continue;
        }

        // Get detailed information
        const details = autoEnrich ? await getPlaceDetails(placeId) : null;

        if (!details) {
          results.errors.push({
            placeId,
            reason: 'Could not fetch place details'
          });
          continue;
        }

        // Parse address
        const addressParts = parseAddressComponents(details.formatted_address);

        // Calculate lead score
        const leadScore = calculateLeadScore(details);

        // Generate photo URLs
        const photoUrls = details.photos?.slice(0, 5).map(photo => 
          getPhotoUrl(photo.photo_reference)
        ) || [];

        // Create prospect
        const prospect = await prisma.prospectWorkshop.create({
          data: {
            googlePlaceId: details.place_id,
            name: details.name,
            address: details.formatted_address,
            city: addressParts.city,
            postalCode: addressParts.postalCode,
            state: addressParts.state,
            country: addressParts.country,
            phone: details.formatted_phone_number,
            website: details.website,
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            rating: details.rating,
            reviewCount: details.user_ratings_total || 0,
            priceLevel: details.price_level,
            photoUrls,
            placeTypes: details.types,
            openingHours: details.opening_hours as any,
            leadScore,
            status: 'NEW',
            priority: leadScore >= 75 ? 'HIGH' : leadScore >= 50 ? 'MEDIUM' : 'LOW',
            source: 'google_places',
            assignedToId: assignToMe ? employee.id : null,
            assignedAt: assignToMe ? new Date() : null
          }
        });

        results.imported.push({
          prospectId: prospect.id,
          placeId: prospect.googlePlaceId,
          name: prospect.name,
          leadScore: prospect.leadScore
        });

        // Create initial note
        await prisma.prospectNote.create({
          data: {
            prospectId: prospect.id,
            content: `Prospect imported from Google Places.\n\nRating: ${prospect.rating || 'N/A'}/5 (${prospect.reviewCount} reviews)\nLead Score: ${prospect.leadScore}/100`,
            createdById: employee.id,
            isPinned: false
          }
        });

        // Create initial task
        await prisma.prospectTask.create({
          data: {
            prospectId: prospect.id,
            title: 'Erstkontakt herstellen',
            description: `Telefonisch oder per E-Mail Kontakt aufnehmen und Interesse an Bereifung24 prüfen.`,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            priority: prospect.priority,
            status: 'PENDING',
            assignedToId: assignToMe ? employee.id : null,
            createdById: employee.id
          }
        });

      } catch (error: any) {
        console.error(`Error importing place ${placeId}:`, error);
        results.errors.push({
          placeId,
          reason: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: placeIds.length,
        imported: results.imported.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      results
    });

  } catch (error: any) {
    console.error('Error importing prospects:', error);
    return NextResponse.json({ 
      error: 'Failed to import prospects',
      details: error.message 
    }, { status: 500 });
  }
}
