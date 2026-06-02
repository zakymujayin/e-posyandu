import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { withCache } from "@/lib/cache"

export async function GET(req: NextRequest, { params }: { params: Promise<{ kecId: string }> }) {
  const { user, response } = await requireAuth(["PETUGAS_KECAMATAN", "ADMIN_DPMD"])
  if (!user) return response!

  try {
    const { kecId } = await params

    if (user.role === "PETUGAS_KECAMATAN") {
      if (user.kecamatanId !== kecId) return err("Akses ditolak", 403)
    }

    const data = await withCache(`rekap:ats:kec:${kecId}`, 3600, async () => {
      const desas = await prisma.desa.findMany({
        where: { kecamatanId: kecId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })

      const desaIds = desas.map((d) => d.id)

      const rows = await prisma.anakTidakSekolah.groupBy({
        by: ["desaId", "statusSekolah"],
        where: { desaId: { in: desaIds }, isActive: true },
        _count: { id: true },
      })

      return desas.map((d) => {
        const dRows = rows.filter((r) => r.desaId === d.id)
        const total = dRows.reduce((s, r) => s + r._count.id, 0)
        const getCount = (status: string) => dRows.find((r) => r.statusSekolah === status)?._count.id ?? 0
        return {
          desaId: d.id,
          desaName: d.name,
          total,
          putusSekolah: getCount("Putus Sekolah"),
          tidakPernahSekolah: getCount("Tidak Pernah Sekolah"),
          lulusTidakMelanjutkan: getCount("Lulus Tidak Melanjutkan"),
        }
      })
    })

    return ok(data)
  } catch (e) {
    console.error("[GET /api/rekap/ats/kecamatan/:kecId]", e)
    return err("Gagal mengambil rekap", 500)
  }
}
