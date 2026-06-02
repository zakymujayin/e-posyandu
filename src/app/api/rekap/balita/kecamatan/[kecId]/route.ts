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

    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    const rekap = await withCache(`rekap:kec:${kecId}:${bulanIni}:${tahunIni}`, 3600, async () => {
    // Get desas with their posyandu ids
    const desas = await prisma.desa.findMany({
      where: { kecamatanId: kecId },
      select: { id: true, name: true, posyandus: { select: { id: true } } },
      orderBy: { name: "asc" },
    })

    // Build posyanduId → desaId map
    const posyanduToDesaMap = new Map<string, string>()
    for (const d of desas) {
      for (const p of d.posyandus) {
        posyanduToDesaMap.set(p.id, d.id)
      }
    }
    const allPosyanduIds = Array.from(posyanduToDesaMap.keys())

    // Two parallel aggregate queries
    const [totalRows, weighedRows] = await Promise.all([
      prisma.balita.groupBy({
        by: ["posyanduId"],
        where: { posyanduId: { in: allPosyanduIds }, isActive: true },
        _count: { id: true },
      }),
      prisma.penimbanganBalita.findMany({
        where: {
          bulan: bulanIni,
          tahun: tahunIni,
          balita: { posyanduId: { in: allPosyanduIds }, isActive: true },
        },
        select: { balitaId: true, balita: { select: { posyanduId: true } } },
        distinct: ["balitaId"],
      }),
    ])

    // Aggregate posyandu-level data to desa-level
    const totalByDesa = new Map<string, number>()
    for (const row of totalRows) {
      const desaId = posyanduToDesaMap.get(row.posyanduId)
      if (desaId) totalByDesa.set(desaId, (totalByDesa.get(desaId) ?? 0) + row._count.id)
    }

    const ditimbangByDesa = new Map<string, number>()
    for (const row of weighedRows) {
      const desaId = posyanduToDesaMap.get(row.balita.posyanduId)
      if (desaId) ditimbangByDesa.set(desaId, (ditimbangByDesa.get(desaId) ?? 0) + 1)
    }

    return desas.map((d) => {
      const totalBalita = totalByDesa.get(d.id) ?? 0
      const ditimbangBulanIni = ditimbangByDesa.get(d.id) ?? 0
      return {
        desaId: d.id,
        desaName: d.name,
        totalPosyandu: d.posyandus.length,
        totalBalita,
        ditimbangBulanIni,
        belumDitimbang: totalBalita - ditimbangBulanIni,
      }
    })
    })

    return ok(rekap)
  } catch (e) {
    console.error("[GET /api/rekap/balita/kecamatan/[kecId]]", e)
    return err("Gagal mengambil data rekap", 500)
  }
}
