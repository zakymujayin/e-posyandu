import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    // Get kecamatans with desas and posyandu ids only
    const kecamatans = await prisma.kecamatan.findMany({
      select: {
        id: true,
        name: true,
        desas: {
          select: {
            id: true,
            posyandus: { select: { id: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    })

    // Build posyanduId → kecamatanId map
    const posyanduToKecMap = new Map<string, string>()
    const desaCountByKec = new Map<string, number>()
    const posyanduCountByKec = new Map<string, number>()

    for (const kec of kecamatans) {
      desaCountByKec.set(kec.id, kec.desas.length)
      let posyanduCount = 0
      for (const d of kec.desas) {
        posyanduCount += d.posyandus.length
        for (const p of d.posyandus) {
          posyanduToKecMap.set(p.id, kec.id)
        }
      }
      posyanduCountByKec.set(kec.id, posyanduCount)
    }

    const allPosyanduIds = Array.from(posyanduToKecMap.keys())

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

    // Aggregate posyandu-level data to kecamatan-level
    const totalByKec = new Map<string, number>()
    for (const row of totalRows) {
      const kecId = posyanduToKecMap.get(row.posyanduId)
      if (kecId) totalByKec.set(kecId, (totalByKec.get(kecId) ?? 0) + row._count.id)
    }

    const ditimbangByKec = new Map<string, number>()
    for (const row of weighedRows) {
      const kecId = posyanduToKecMap.get(row.balita.posyanduId)
      if (kecId) ditimbangByKec.set(kecId, (ditimbangByKec.get(kecId) ?? 0) + 1)
    }

    const rekap = kecamatans.map((kec) => {
      const totalBalita = totalByKec.get(kec.id) ?? 0
      const ditimbangBulanIni = ditimbangByKec.get(kec.id) ?? 0
      return {
        kecamatanId: kec.id,
        kecamatanName: kec.name,
        totalDesa: desaCountByKec.get(kec.id) ?? 0,
        totalPosyandu: posyanduCountByKec.get(kec.id) ?? 0,
        totalBalita,
        ditimbangBulanIni,
        belumDitimbang: totalBalita - ditimbangBulanIni,
      }
    })

    return ok(rekap)
  } catch (e) {
    console.error("[GET /api/rekap/balita/all]", e)
    return err("Gagal mengambil data rekap", 500)
  }
}
