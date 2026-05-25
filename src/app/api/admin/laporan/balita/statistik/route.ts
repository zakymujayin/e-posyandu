import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const BULAN_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD", "PETUGAS_KECAMATAN", "PETUGAS_DESA"])
  if (!user) return response!

  try {
    const { searchParams } = new URL(req.url)
    const kecId = searchParams.get("kecId")
    const desaId = searchParams.get("desaId")
    const posyanduId = searchParams.get("posyanduId")
    const tahun = parseInt(searchParams.get("tahun") ?? String(new Date().getFullYear()))

    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    // Build posyandu filter based on role + params
    const posyanduFilter: Record<string, unknown> = {}

    if (user.role === "PETUGAS_DESA") {
      const petugas = await prisma.user.findUnique({
        where: { id: user.id },
        select: { desaId: true },
      })
      if (!petugas?.desaId) return err("Akun belum dihubungkan ke desa", 400)
      posyanduFilter.desaId = petugas.desaId
    } else if (user.role === "PETUGAS_KECAMATAN") {
      const petugas = await prisma.user.findUnique({
        where: { id: user.id },
        select: { kecamatanId: true },
      })
      if (!petugas?.kecamatanId) return err("Akun belum dihubungkan ke kecamatan", 400)
      posyanduFilter.desa = { kecamatanId: petugas.kecamatanId }
    }

    // Apply query params on top of role filter
    if (posyanduId) {
      posyanduFilter.id = posyanduId
    } else if (desaId) {
      if (user.role === "PETUGAS_DESA") {
        const petugas = await prisma.user.findUnique({ where: { id: user.id }, select: { desaId: true } })
        if (petugas?.desaId !== desaId) return err("Akses ditolak", 403)
      }
      posyanduFilter.desaId = desaId
    } else if (kecId) {
      if (user.role === "PETUGAS_KECAMATAN") {
        const petugas = await prisma.user.findUnique({ where: { id: user.id }, select: { kecamatanId: true } })
        if (petugas?.kecamatanId !== kecId) return err("Akses ditolak", 403)
      }
      posyanduFilter.desa = { kecamatanId: kecId }
    }

    const posyandus = await prisma.posyandu.findMany({
      where: posyanduFilter,
      select: { id: true },
    })
    const posyanduIds = posyandus.map((p) => p.id)

    const balitaWhere = posyanduIds.length > 0
      ? { posyanduId: { in: posyanduIds }, isActive: true }
      : { isActive: true }

    const [
      totalBalita,
      ditimbangBulanIni,
      statusGiziDistribution,
      monthlyTrend,
    ] = await Promise.all([
      prisma.balita.count({ where: balitaWhere }),
      prisma.penimbanganBalita.count({
        where: { bulan: bulanIni, tahun: tahunIni, balita: balitaWhere },
      }),
      prisma.penimbanganBalita.groupBy({
        by: ["statusGizi"],
        where: { balita: balitaWhere, tahun: tahunIni, statusGizi: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const m = i + 1
          return prisma.penimbanganBalita
            .count({ where: { bulan: m, tahun, balita: balitaWhere } })
            .then((count) => ({ bulan: m, count }))
        })
      ),
    ])

    return ok({
      summary: {
        totalBalita,
        ditimbangBulanIni,
        belumDitimbang: totalBalita - ditimbangBulanIni,
        persentaseDitimbang: totalBalita > 0 ? Math.round((ditimbangBulanIni / totalBalita) * 100) : 0,
      },
      statusGizi: statusGiziDistribution.map((r) => ({
        status: r.statusGizi ?? "Tidak diketahui",
        count: r._count.id,
      })),
      monthlyTrend: monthlyTrend.map((m) => ({
        bulan: BULAN_NAMES[m.bulan - 1],
        count: m.count,
      })),
    })
  } catch (e) {
    console.error("[GET /api/admin/laporan/balita/statistik]", e)
    return err("Gagal mengambil data statistik", 500)
  }
}
