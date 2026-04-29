import { prisma } from './prisma'

export interface VehicleSnapshot {
  brand: string
  model: string
  year: number | null
  licensePlate: string | null
  vehicleType: string
}

/**
 * Build a snapshot of vehicle data for storage in DirectBooking.
 * This preserves vehicle info even if the customer later deletes the vehicle.
 * Returns null if vehicleId is missing or vehicle not found.
 */
export async function buildVehicleSnapshot(
  vehicleId: string | null | undefined
): Promise<VehicleSnapshot | null> {
  if (!vehicleId) return null
  try {
    const v = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        make: true,
        model: true,
        year: true,
        licensePlate: true,
        vehicleType: true,
      },
    })
    if (!v) return null
    return {
      brand: v.make,
      model: v.model,
      year: v.year ?? null,
      licensePlate: v.licensePlate ?? null,
      vehicleType: v.vehicleType,
    }
  } catch (err) {
    console.error('[buildVehicleSnapshot] error:', err)
    return null
  }
}
