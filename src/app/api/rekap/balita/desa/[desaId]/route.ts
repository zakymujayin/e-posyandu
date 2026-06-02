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
      if (user.desaId !== desaId) return err("Akses ditolak", 403)
    }

    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    const rekap = await withCache(`rekap:desa:${desaId}:${bulanIni}:${tahunIni}`, 3600, async () => {
    const posyandus = await prisma.posyandu.findMany({
      where: { desaId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    const posyanduIds = posyandus.map((p) => p.id)

    // Two parallel queries instead of nested includes
    const [totalRows, weighedRows] = await Promise.all([
      prisma.balita.groupBy({
        by: ["posyanduId"],
        where: { posyanduId: { in: posyanduIds }, isActive: true },
        _count: { id: true },
      }),
      prisma.penimbanganBalita.findMany({
        where: {
          bulan: bulanIni,
          tahun: tahunIni,
          balita: { posyanduId: { in: posyanduIds }, isActive: true },
        },
        select: { balitaId: true, balita: { select: { posyanduId: true } } },
        distinct: ["balitaId"],
      }),
    ])

    const totalMap = new Map(totalRows.map((r) => [r.posyanduId, r._count.id]))
    const ditimbangMap = new Map<string, number>()
    for (const row of weighedRows) {
      const pid = row.balita.posyanduId
      ditimbangMap.set(pid, (ditimbangMap.get(pid) ?? 0) + 1)
    }

    return posyandus.map((p) => {
      const totalBalita = totalMap.get(p.id) ?? 0
      const ditimbangBulanIni = ditimbangMap.get(p.id) ?? 0
      return {
        posyanduId: p.id,
        posyanduName: p.name,
        totalBalita,
        ditimbangBulanIni,
        belumDitimbang: totalBalita - ditimbangBulanIni,
      }
    })
    })

    return ok(rekap)
  } catch (e) {
    console.error("[GET /api/rekap/balita/desa/[desaId]]", e)
    return err("Gagal mengambil data rekap", 500)
  }
}
