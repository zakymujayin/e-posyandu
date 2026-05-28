import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { withCache } from "@/lib/cache"

export async function GET(_req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const data = await withCache("rekap:ats:all", 3600, async () => {
      const kecamatans = await prisma.kecamatan.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })

      const kecIds = kecamatans.map((k) => k.id)

      const rows = await prisma.anakTidakSekolah.groupBy({
        by: ["kecamatanId", "statusSekolah"],
        where: { kecamatanId: { in: kecIds }, isActive: true },
        _count: { id: true },
      })

      return kecamatans.map((k) => {
        const kRows = rows.filter((r) => r.kecamatanId === k.id)
        const total = kRows.reduce((s, r) => s + r._count.id, 0)
        const getCount = (status: string) => kRows.find((r) => r.statusSekolah === status)?._count.id ?? 0
        return {
          kecamatanId: k.id,
          kecamatanName: k.name,
          total,
          putusSekolah: getCount("Putus Sekolah"),
          tidakPernahSekolah: getCount("Tidak Pernah Sekolah"),
          lulusTidakMelanjutkan: getCount("Lulus Tidak Melanjutkan"),
        }
      })
    })

    return ok(data)
  } catch (e) {
    console.error("[GET /api/rekap/ats/all]", e)
    return err("Gagal mengambil rekap", 500)
  }
}
