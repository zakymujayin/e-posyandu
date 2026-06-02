import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { withCache, invalidatePattern } from "@/lib/cache"

export async function GET() {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const settings = await withCache("app:settings", 600, () =>
      prisma.appSetting.findMany()
    )
    const result = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    return ok(result)
  } catch (e) {
    console.error(e)
    return err("Gagal mengambil pengaturan", 500)
  }
}

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid")

  try {
    await prisma.appSetting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: { key: parsed.data.key, value: parsed.data.value },
    })
    invalidatePattern("app:settings")
    return ok(null, "Pengaturan disimpan")
  } catch (e) {
    console.error(e)
    return err("Gagal menyimpan pengaturan", 500)
  }
}
