import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/crypto/encryption'

/**
 * WorkshopSupplier Service
 * Manages supplier credentials and settings
 */

export interface SupplierCredentials {
  username: string
  password: string
}

export interface SupplierSettings {
  isActive: boolean
  autoOrder: boolean
  priority: number
}

/**
 * Create or update workshop supplier credentials
 */
export async function upsertWorkshopSupplier(
  workshopId: string,
  supplier: string,
  name: string,
  credentials: SupplierCredentials,
  settings?: Partial<SupplierSettings>
) {
  try {
    // Encrypt credentials
    const usernameEncryption = encrypt(credentials.username)
    const passwordEncryption = encrypt(credentials.password)

    // Check if supplier already exists
    const existing = await prisma.workshopSupplier.findUnique({
      where: {
        workshopId_supplier: {
          workshopId,
          supplier,
        },
      },
    })

    if (existing) {
      // Update existing
      return await prisma.workshopSupplier.update({
        where: { id: existing.id },
        data: {
          name,
          usernameEncrypted: usernameEncryption.encrypted,
          passwordEncrypted: passwordEncryption.encrypted,
          encryptionIv: usernameEncryption.iv, // Use same IV for both (they're paired)
          isActive: settings?.isActive ?? true,
          autoOrder: settings?.autoOrder ?? false,
          priority: settings?.priority ?? 1,
          lastApiError: null, // Reset error on update
        },
      })
    } else {
      // Create new
      return await prisma.workshopSupplier.create({
        data: {
          workshopId,
          supplier,
          name,
          usernameEncrypted: usernameEncryption.encrypted,
          passwordEncrypted: passwordEncryption.encrypted,
          encryptionIv: usernameEncryption.iv,
          isActive: settings?.isActive ?? true,
          autoOrder: settings?.autoOrder ?? false,
          priority: settings?.priority ?? 1,
        },
      })
    }
  } catch (error) {
    console.error('Error upserting workshop supplier:', error)
    throw new Error('Failed to save supplier credentials')
  }
}

/**
 * Get decrypted supplier credentials
 */
export async function getSupplierCredentials(
  workshopId: string,
  supplier: string = 'TYRESYSTEM'
): Promise<SupplierCredentials | null> {
  try {
    const supplierData = await prisma.workshopSupplier.findUnique({
      where: {
        workshopId_supplier: {
          workshopId,
          supplier,
        },
      },
    })

    if (!supplierData || !supplierData.isActive) {
      return null
    }

    // Decrypt credentials
    const username = decrypt(supplierData.usernameEncrypted, supplierData.encryptionIv)
    const password = decrypt(supplierData.passwordEncrypted, supplierData.encryptionIv)

    return { username, password }
  } catch (error) {
    console.error('Error getting supplier credentials:', error)
    return null
  }
}

/**
 * Get all suppliers for a workshop
 */
export async function getWorkshopSuppliers(workshopId: string) {
  try {
    return await prisma.workshopSupplier.findMany({
      where: { workshopId },
      orderBy: { priority: 'asc' },
    })
  } catch (error) {
    console.error('Error getting workshop suppliers:', error)
    return []
  }
}

/**
 * Update supplier settings
 */
export async function updateSupplierSettings(
  workshopId: string,
  supplier: string,
  settings: Partial<SupplierSettings>
) {
  try {
    return await prisma.workshopSupplier.update({
      where: {
        workshopId_supplier: {
          workshopId,
          supplier,
        },
      },
      data: settings,
    })
  } catch (error) {
    console.error('Error updating supplier settings:', error)
    throw new Error('Failed to update supplier settings')
  }
}

/**
 * Delete supplier
 */
export async function deleteSupplier(workshopId: string, supplier: string) {
  try {
    return await prisma.workshopSupplier.delete({
      where: {
        workshopId_supplier: {
          workshopId,
          supplier,
        },
      },
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    throw new Error('Failed to delete supplier')
  }
}

/**
 * Update API check status
 */
export async function updateApiCheckStatus(
  workshopId: string,
  supplier: string,
  success: boolean,
  error?: string
) {
  try {
    return await prisma.workshopSupplier.update({
      where: {
        workshopId_supplier: {
          workshopId,
          supplier,
        },
      },
      data: {
        lastApiCheck: success ? new Date() : undefined,
        lastApiError: error || null,
      },
    })
  } catch (error) {
    console.error('Error updating API check status:', error)
  }
}

/**
 * Check if auto-order is enabled for supplier
 */
export async function isAutoOrderEnabled(
  workshopId: string,
  supplier: string = 'TYRESYSTEM'
): Promise<boolean> {
  try {
    const supplierData = await prisma.workshopSupplier.findUnique({
      where: {
        workshopId_supplier: {
          workshopId,
          supplier,
        },
      },
      select: {
        autoOrder: true,
        isActive: true,
      },
    })

    return supplierData?.isActive && supplierData?.autoOrder ? true : false
  } catch (error) {
    console.error('Error checking auto-order status:', error)
    return false
  }
}
