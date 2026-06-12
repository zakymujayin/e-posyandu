import Redis from "ioredis"

declare global {
  var _redis: Redis | undefined
}

const redis =
  globalThis._redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
  })

redis.on("error", () => {
  // Redis unavailable — silently ignore, operations wrapped in try/catch
})

if (process.env.NODE_ENV !== "production") globalThis._redis = redis

export { redis }
