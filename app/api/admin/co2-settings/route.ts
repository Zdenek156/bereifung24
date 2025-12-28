import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Einstellungen abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Hole oder erstelle CO2-Einstellungen
    let settings = await prisma.cO2Settings.findFirst();

    if (!settings) {
      // Erstelle Default-Einstellungen wenn noch keine existieren
      settings = await prisma.cO2Settings.create({
        data: {
          workshopsToCompare: 3,
          co2PerKmCombustion: 140,
          co2PerKmElectric: 50,
          co2PerLiterFuel: 2330,
          co2PerKWhElectric: 420,
          fuelPricePerLiter: 1.65,
          dieselPricePerLiter: 1.55,
          electricPricePerKWh: 0.35,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching CO2 settings:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Einstellungen' },
      { status: 500 }
    );
  }
}

// POST: Einstellungen speichern/aktualisieren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workshopsToCompare,
      co2PerKmCombustion,
      co2PerKmElectric,
      co2PerLiterFuel,
      co2PerKWhElectric,
      fuelPricePerLiter,
      dieselPricePerLiter,
      electricPricePerKWh,
    } = body;

    // Validierung
    if (
      workshopsToCompare < 1 ||
      co2PerKmCombustion < 0 ||
      co2PerKmElectric < 0 ||
      co2PerLiterFuel < 0 ||
      co2PerKWhElectric < 0 ||
      fuelPricePerLiter < 0 ||
      dieselPricePerLiter < 0 ||
      electricPricePerKWh < 0
    ) {
      return NextResponse.json(
        { error: 'Ungültige Werte. Alle Werte müssen positiv sein.' },
        { status: 400 }
      );
    }

    // Prüfe ob Einstellungen existieren
    const existing = await prisma.cO2Settings.findFirst();

    let settings;
    if (existing) {
      // Update
      settings = await prisma.cO2Settings.update({
        where: { id: existing.id },
        data: {
          workshopsToCompare,
          co2PerKmCombustion,
          co2PerKmElectric,
          co2PerLiterFuel,
          co2PerKWhElectric,
          fuelPricePerLiter,
          dieselPricePerLiter,
          electricPricePerKWh,
        },
      });
    } else {
      // Create
      settings = await prisma.cO2Settings.create({
        data: {
          workshopsToCompare,
          co2PerKmCombustion,
          co2PerKmElectric,
          co2PerLiterFuel,
          co2PerKWhElectric,
          fuelPricePerLiter,
          dieselPricePerLiter,
          electricPricePerKWh,
        },
      });
    }

    return NextResponse.json({ settings, message: 'Einstellungen gespeichert' });
  } catch (error) {
    console.error('Error saving CO2 settings:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Einstellungen' },
      { status: 500 }
    );
  }
}
