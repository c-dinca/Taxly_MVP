import { Redis } from 'ioredis'

let redis: Redis

export async function connectRedis(): Promise<void> {
  const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379'

  redis = new Redis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  })

  try {
    await redis.connect()
    console.log('✅ Redis connected')
  } catch (err) {
    console.error('❌ Redis connection failed:', err)
    process.exit(1)
  }
}

export function getRedis(): Redis {
  if (!redis) throw new Error('Redis not initialized. Call connectRedis() first.')
  return redis
}
