import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { withCache } from "@/lib/cache"

export async function GET(req: NextRequest, { params }: { params: Promise<{ desaId: string }> }) {
  const { user, response } = await requireAuth(["PETUGAS_DESA", "ADMIN_DPMD"])
  if (!user) return response!

  try {
    const { desaId } = await params

    if (user.role === "PETUGAS_DESA") {
      const p = await prisma.user.findUnique({ where: { id: user.id }, select: { desaId: true } })
      if (p?.desaId !== desaId) return err("Akses ditolak", 403)
    }

    const data = await withCache(`rekap:ats:desa:${desaId}`, 3600, async () => {
      const posyandus = await prisma.posyandu.findMany({
        where: { desaId, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })

      const posyanduIds = posyandus.map((p) => p.id)

      const rows = await prisma.anakTidakSekolah.groupBy({
        by: ["posyanduId", "statusSekolah"],
        where: { posyanduId: { in: posyanduIds }, isActive: true },
        _count: { id: true },
      })

      return posyandus.map((p) => {
        const pRows = rows.filter((r) => r.posyanduId === p.id)
        const total = pRows.reduce((s, r) => s + r._count.id, 0)
        const getCount = (status: string) => pRows.find((r) => r.statusSekolah === status)?._count.id ?? 0
        return {
          posyanduId: p.id,
          posyanduName: p.name,
          total,
          putusSekolah: getCount("Putus Sekolah"),
          tidakPernahSekolah: getCount("Tidak Pernah Sekolah"),
          lulusTidakMelanjutkan: getCount("Lulus Tidak Melanjutkan"),
        }
      })
    })

    return ok(data)
  } catch (e) {
    console.error("[GET /api/rekap/ats/desa/:desaId]", e)
    return err("Gagal mengambil rekap", 500)
  }
}
