import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { withCache } from "@/lib/cache"

export async function GET(req: NextRequest, { params }: { params: Promise<{ posyanduId: string }> }) {
  const { user, response } = await requireAuth(["PETUGAS_DESA", "ADMIN_DPMD"])
  if (!user) return response!

  try {
    const { posyanduId } = await params

    if (user.role === "PETUGAS_DESA") {
      const posyandu = await prisma.posyandu.findUnique({ where: { id: posyanduId }, select: { desaId: true } })
      if (!posyandu || posyandu.desaId !== user.desaId) return err("Akses ditolak", 403)
    }

    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    const data = await withCache(
      `rekap:posyandu:${posyanduId}:${bulanIni}:${tahunIni}`,
      3600,
      async () => {
        const balitas = await prisma.balita.findMany({
          where: { posyanduId, isActive: true },
          select: {
            id: true,
            namaBalita: true,
            jenisKelamin: true,
            tanggalLahir: true,
            namaOrangTua: true,
            penimbangans: {
              where: { bulan: bulanIni, tahun: tahunIni },
              select: { id: true, beratBadan: true, statusGizi: true },
              take: 1,
            },
          },
          orderBy: { namaBalita: "asc" },
        })

        return balitas.map((b) => ({
          id: b.id,
          namaBalita: b.namaBalita,
          jenisKelamin: b.jenisKelamin,
          tanggalLahir: b.tanggalLahir,
          namaOrangTua: b.namaOrangTua,
          ditimbangBulanIni: b.penimbangans.length > 0,
          beratBadan: b.penimbangans[0]?.beratBadan ?? null,
          statusGizi: b.penimbangans[0]?.statusGizi ?? null,
        }))
      }
    )

    return ok(data)
  } catch (e) {
    console.error("[GET /api/rekap/balita/posyandu/[posyanduId]]", e)
    return err("Gagal mengambil data balita", 500)
  }
}
