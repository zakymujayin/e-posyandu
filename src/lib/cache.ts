import { redis } from "./redis"

export async function withCache<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key)
    if (cached) return JSON.parse(cached) as T
  } catch {
    // Redis unavailable — fall through to DB
  }

  const result = await fn()

  try {
    await redis.set(key, JSON.stringify(result), "EX", ttlSec)
  } catch {
    // Redis unavailable — result still returned from DB
  }

  return result
}

export async function invalidateRekap(bulan: number, tahun: number): Promise<void> {
  try {
    const pattern = `rekap:*:${bulan}:${tahun}`
    const stream = redis.scanStream({ match: pattern, count: 100 })
    const keys: string[] = []

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: string[]) => keys.push(...chunk))
      stream.on("end", resolve)
      stream.on("error", reject)
    })

    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Redis unavailable — no-op
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 })
    const keys: string[] = []

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: string[]) => keys.push(...chunk))
      stream.on("end", resolve)
      stream.on("error", reject)
    })

    if (keys.length > 0) {
      await redis.unlink(...keys)
    }
  } catch {
    // Redis unavailable — no-op
  }
}

export async function invalidateATSRekap(): Promise<void> {
  try {
    const stream = redis.scanStream({ match: "rekap:ats:*", count: 100 })
    const keys: string[] = []

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: string[]) => keys.push(...chunk))
      stream.on("end", resolve)
      stream.on("error", reject)
    })

    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Redis unavailable — no-op
  }
}

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, windowSec)
    return count <= limit
  } catch {
    console.warn("[cache] Redis unavailable — rate limiting disabled")
    return true
  }
}
