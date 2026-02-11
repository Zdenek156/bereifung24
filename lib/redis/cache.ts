import { createClient, RedisClientType } from 'redis'

/**
 * Redis Cache Service for TyreSystem API responses
 * Improves performance and reduces API calls
 */

let redisClient: RedisClientType | null = null

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient
  }

  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis: Max reconnect attempts reached')
            return new Error('Max reconnect attempts reached')
          }
          return Math.min(retries * 100, 3000)
        },
      },
    })

    client.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    client.on('connect', () => {
      console.log('✅ Redis connected')
    })

    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...')
    })

    await client.connect()
    redisClient = client

    return client
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    throw error
  }
}

/**
 * Get Redis client (initialize if not connected)
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    return initRedis()
  }
  return redisClient
}

/**
 * Cache TyreSystem article inquiry
 * Cache key: tyresystem:inquiry:{workshopId}:{articleId}:{amount}
 * TTL: 15 minutes (prices can change)
 */
export async function cacheInquiry(
  workshopId: string,
  articleId: string,
  amount: number,
  data: any,
  ttlSeconds: number = 900 // 15 minutes
): Promise<void> {
  try {
    const client = await getRedisClient()
    const key = `tyresystem:inquiry:${workshopId}:${articleId}:${amount}`
    await client.setEx(key, ttlSeconds, JSON.stringify(data))
  } catch (error) {
    console.error('Redis cache set error:', error)
    // Don't throw - cache failure shouldn't break the API
  }
}

/**
 * Get cached inquiry
 */
export async function getCachedInquiry(
  workshopId: string,
  articleId: string,
  amount: number
): Promise<any | null> {
  try {
    const client = await getRedisClient()
    const key = `tyresystem:inquiry:${workshopId}:${articleId}:${amount}`
    const cached = await client.get(key)
    
    if (cached) {
      return JSON.parse(cached)
    }
    return null
  } catch (error) {
    console.error('Redis cache get error:', error)
    return null
  }
}

/**
 * Cache tire search results
 * Cache key: tyresystem:search:{workshopId}:{width}:{height}:{rim}
 * TTL: 10 minutes
 */
export async function cacheTireSearch(
  workshopId: string,
  width: string,
  height: string,
  rim: string,
  data: any[],
  ttlSeconds: number = 600 // 10 minutes
): Promise<void> {
  try {
    const client = await getRedisClient()
    const key = `tyresystem:search:${workshopId}:${width}:${height}:${rim}`
    await client.setEx(key, ttlSeconds, JSON.stringify(data))
  } catch (error) {
    console.error('Redis cache set error:', error)
  }
}

/**
 * Get cached tire search
 */
export async function getCachedTireSearch(
  workshopId: string,
  width: string,
  height: string,
  rim: string
): Promise<any[] | null> {
  try {
    const client = await getRedisClient()
    const key = `tyresystem:search:${workshopId}:${width}:${height}:${rim}`
    const cached = await client.get(key)
    
    if (cached) {
      return JSON.parse(cached)
    }
    return null
  } catch (error) {
    console.error('Redis cache get error:', error)
    return null
  }
}

/**
 * Clear all cache for a workshop (e.g., when credentials change)
 */
export async function clearWorkshopCache(workshopId: string): Promise<void> {
  try {
    const client = await getRedisClient()
    
    // Find all keys for this workshop
    const inquiryKeys = await client.keys(`tyresystem:inquiry:${workshopId}:*`)
    const searchKeys = await client.keys(`tyresystem:search:${workshopId}:*`)
    
    const allKeys = [...inquiryKeys, ...searchKeys]
    
    if (allKeys.length > 0) {
      await client.del(allKeys)
      console.log(`🗑️ Cleared ${allKeys.length} cache entries for workshop ${workshopId}`)
    }
  } catch (error) {
    console.error('Redis cache clear error:', error)
  }
}

/**
 * Increment API call counter (for rate limiting tracking)
 */
export async function incrementApiCallCounter(
  workshopId: string,
  supplier: string = 'TYRESYSTEM'
): Promise<number> {
  try {
    const client = await getRedisClient()
    const key = `api:calls:${supplier}:${workshopId}:${new Date().toISOString().split('T')[0]}`
    
    const count = await client.incr(key)
    
    // Set expiry to end of day
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000)
    await client.expire(key, ttl)
    
    return count
  } catch (error) {
    console.error('Redis counter error:', error)
    return 0
  }
}

/**
 * Get API call count for today
 */
export async function getApiCallCount(
  workshopId: string,
  supplier: string = 'TYRESYSTEM'
): Promise<number> {
  try {
    const client = await getRedisClient()
    const key = `api:calls:${supplier}:${workshopId}:${new Date().toISOString().split('T')[0]}`
    const count = await client.get(key)
    return count ? parseInt(count, 10) : 0
  } catch (error) {
    console.error('Redis get counter error:', error)
    return 0
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    console.log('✅ Redis disconnected')
  }
}
