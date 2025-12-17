// Helper to get API keys from database instead of environment variables
// This centralizes API key management in the admin panel

import { prisma } from '@/lib/prisma'

// Cache for API settings to avoid DB queries on every request
let settingsCache: Record<string, string> = {}
let lastCacheUpdate = 0
const CACHE_DURATION = 60 * 1000 // 1 minute

export async function getApiSetting(key: string, fallbackEnvVar?: string): Promise<string | null> {
  try {
    // Check cache first
    const now = Date.now()
    if (now - lastCacheUpdate < CACHE_DURATION && settingsCache[key]) {
      return settingsCache[key]
    }

    // Refresh cache if needed
    if (now - lastCacheUpdate >= CACHE_DURATION) {
      const settings = await prisma.adminApiSetting.findMany()
      settingsCache = {}
      settings.forEach(setting => {
        if (setting.value) {
          settingsCache[setting.key] = setting.value
        }
      })
      lastCacheUpdate = now
    }

    // Return from cache or fallback to environment variable
    const value = settingsCache[key]
    if (value) {
      return value
    }

    // Fallback to environment variable if provided
    if (fallbackEnvVar && process.env[fallbackEnvVar]) {
      console.warn(`API setting '${key}' not found in database, using environment variable ${fallbackEnvVar}`)
      return process.env[fallbackEnvVar]!
    }

    return null
  } catch (error) {
    console.error(`Error getting API setting '${key}':`, error)
    
    // Fallback to environment variable on error
    if (fallbackEnvVar && process.env[fallbackEnvVar]) {
      console.warn(`Error accessing database, using environment variable ${fallbackEnvVar}`)
      return process.env[fallbackEnvVar]!
    }
    
    return null
  }
}

// Clear cache (call this when settings are updated)
export function clearApiSettingsCache() {
  settingsCache = {}
  lastCacheUpdate = 0
}
