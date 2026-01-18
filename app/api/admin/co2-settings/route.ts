import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Einstellungen abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
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
          co2PerLiterPetrol: 2320,
          co2PerLiterDiesel: 2640,
          co2PerLiterLPG: 1640,
          co2PerKgCNG: 1990,
          co2PerKWhElectric: 420,
          co2PerLiterFuel: 2330, // Legacy
          petrolPricePerLiter: 1.75,
          dieselPricePerLiter: 1.65,
          lpgPricePerLiter: 0.80,
          cngPricePerKg: 1.10,
          electricPricePerKWh: 0.35,
          fuelPricePerLiter: 1.65, // Legacy
        },
      });
    }

    // Ensure all fields have values (for migration compatibility)
    const completeSettings = {
      ...settings,
      co2PerLiterPetrol: settings.co2PerLiterPetrol ?? 2320,
      co2PerLiterDiesel: settings.co2PerLiterDiesel ?? 2640,
      co2PerLiterLPG: settings.co2PerLiterLPG ?? 1640,
      co2PerKgCNG: settings.co2PerKgCNG ?? 1990,
      co2PerKWhElectric: settings.co2PerKWhElectric ?? 420,
      petrolPricePerLiter: settings.petrolPricePerLiter ?? 1.75,
      dieselPricePerLiter: settings.dieselPricePerLiter ?? 1.65,
      lpgPricePerLiter: settings.lpgPricePerLiter ?? 0.80,
      cngPricePerKg: settings.cngPricePerKg ?? 1.10,
      electricPricePerKWh: settings.electricPricePerKWh ?? 0.35,
    };

    return NextResponse.json({ settings: completeSettings });
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

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workshopsToCompare,
      co2PerKmCombustion,
      co2PerKmElectric,
      co2PerLiterPetrol,
      co2PerLiterDiesel,
      co2PerLiterLPG,
      co2PerKgCNG,
      co2PerKWhElectric,
      petrolPricePerLiter,
      dieselPricePerLiter,
      lpgPricePerLiter,
      cngPricePerKg,
      electricPricePerKWh,
      // Legacy fields
      co2PerLiterFuel,
      fuelPricePerLiter,
    } = body;

    // Validierung
    if (
      workshopsToCompare < 1 ||
      co2PerKmCombustion < 0 ||
      co2PerKmElectric < 0 ||
      co2PerLiterPetrol < 0 ||
      co2PerLiterDiesel < 0 ||
      co2PerLiterLPG < 0 ||
      co2PerKgCNG < 0 ||
      co2PerKWhElectric < 0 ||
      petrolPricePerLiter < 0 ||
      dieselPricePerLiter < 0 ||
      lpgPricePerLiter < 0 ||
      cngPricePerKg < 0 ||
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
          co2PerLiterPetrol,
          co2PerLiterDiesel,
          co2PerLiterLPG,
          co2PerKgCNG,
          co2PerKWhElectric,
          petrolPricePerLiter,
          dieselPricePerLiter,
          lpgPricePerLiter,
          cngPricePerKg,
          electricPricePerKWh,
          // Update legacy fields if provided
          co2PerLiterFuel: co2PerLiterFuel ?? existing.co2PerLiterFuel,
          fuelPricePerLiter: fuelPricePerLiter ?? existing.fuelPricePerLiter,
        },
      });
    } else {
      // Create
      settings = await prisma.cO2Settings.create({
        data: {
          workshopsToCompare,
          co2PerKmCombustion,
          co2PerKmElectric,
          co2PerLiterPetrol,
          co2PerLiterDiesel,
          co2PerLiterLPG,
          co2PerKgCNG,
          co2PerKWhElectric,
          petrolPricePerLiter,
          dieselPricePerLiter,
          lpgPricePerLiter,
          cngPricePerKg,
          electricPricePerKWh,
          co2PerLiterFuel: co2PerLiterFuel ?? 2330,
          fuelPricePerLiter: fuelPricePerLiter ?? 1.65,
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
