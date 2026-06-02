import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { withCache } from "@/lib/cache"

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

    const cacheKey = `laporan:balita-statistik:${kecId ?? "_"}:${desaId ?? "_"}:${posyanduId ?? "_"}:${tahun}`

    const data = await withCache(cacheKey, 300, async () => {
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
        monthlyGroup,
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
        prisma.penimbanganBalita.groupBy({
          by: ["bulan"],
          where: { tahun, balita: balitaWhere },
          _count: { _all: true },
        }),
      ])

      const monthlyMap = new Map(monthlyGroup.map((g) => [g.bulan, g._count._all]))
      const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
        bulan: i + 1,
        count: monthlyMap.get(i + 1) ?? 0,
      }))

      return { totalBalita, ditimbangBulanIni, statusGiziDistribution, monthlyTrend }
    })

    return ok({
      summary: {
        totalBalita: data.totalBalita,
        ditimbangBulanIni: data.ditimbangBulanIni,
        belumDitimbang: data.totalBalita - data.ditimbangBulanIni,
        persentaseDitimbang: data.totalBalita > 0 ? Math.round((data.ditimbangBulanIni / data.totalBalita) * 100) : 0,
      },
      statusGizi: data.statusGiziDistribution.map((r) => ({
        status: r.statusGizi ?? "Tidak diketahui",
        count: r._count.id,
      })),
      monthlyTrend: data.monthlyTrend.map((m) => ({
        bulan: BULAN_NAMES[m.bulan - 1],
        count: m.count,
      })),
    })
  } catch (e) {
    console.error("[GET /api/admin/laporan/balita/statistik]", e)
    return err("Gagal mengambil data statistik", 500)
  }
}
