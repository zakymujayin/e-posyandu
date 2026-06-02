import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { withCache } from "@/lib/cache"

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD", "PETUGAS_KECAMATAN", "PETUGAS_DESA"])
  if (!user) return response!

  try {
    const { searchParams } = new URL(req.url)
    const desaId = searchParams.get("desaId")

    const where: Record<string, unknown> = {}
    if (user.role === "PETUGAS_DESA") {
      const p = await prisma.user.findUnique({ where: { id: user.id }, select: { desaId: true } })
      if (p?.desaId) where.desaId = p.desaId
    } else if (desaId) {
      where.desaId = desaId
    }

    const posyandus = await withCache(
      `rekap:posyandu-list:${user.role}:${desaId ?? "_"}`,
      600,
      () =>
        prisma.posyandu.findMany({
          where: Object.keys(where).length > 0 ? where : undefined,
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
    )

    return ok(posyandus)
  } catch (e) {
    console.error("[GET /api/rekap/balita/posyandu-list]", e)
    return err("Gagal mengambil data posyandu", 500)
  }
}
