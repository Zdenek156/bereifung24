import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomerCO2Stats } from '@/lib/co2Calculator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const customerId = session.user.customerId;
    if (!customerId) {
      return NextResponse.json({ error: 'Kunden-ID nicht gefunden' }, { status: 400 });
    }

    const stats = await getCustomerCO2Stats(customerId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching customer CO2 stats:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    );
  }
}
