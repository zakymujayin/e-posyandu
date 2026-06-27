import { NextResponse } from "next/server"
import crypto from "crypto"
import { redis } from "@/lib/redis"
import { rateLimit } from "@/lib/cache"

export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"

  const allowed = await rateLimit(`rl:captcha:${ip}`, 10, 60)
  if (!allowed) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 })
  }

  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  const answer = String(a + b)

  const token = crypto.randomBytes(8).toString("hex")

  try {
    await redis.set(`captcha:${token}`, answer, "EX", 300)
  } catch {
    return NextResponse.json({ error: "Layanan tidak tersedia" }, { status: 503 })
  }

  return NextResponse.json({
    token,
    question: `${a} + ${b} = ?`,
  })
}
