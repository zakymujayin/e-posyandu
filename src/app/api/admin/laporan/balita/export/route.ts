import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["ADMIN_DPMD", "PETUGAS_KECAMATAN", "PETUGAS_DESA"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const kecId = searchParams.get("kecId")
  const desaId = searchParams.get("desaId")
  const posyanduId = searchParams.get("posyanduId")
  const bulan = parseInt(searchParams.get("bulan") ?? String(new Date().getMonth() + 1))
  const tahun = parseInt(searchParams.get("tahun") ?? String(new Date().getFullYear()))

  const posyanduFilter: Record<string, unknown> = {}

  // Role-based scoping
  if (user.role === "PETUGAS_DESA") {
    const p = await prisma.user.findUnique({ where: { id: user.id }, select: { desaId: true } })
    if (!p?.desaId) return new Response("Akun belum dihubungkan ke desa", { status: 400 })
    posyanduFilter.desaId = p.desaId
  } else if (user.role === "PETUGAS_KECAMATAN") {
    const p = await prisma.user.findUnique({ where: { id: user.id }, select: { kecamatanId: true } })
    if (!p?.kecamatanId) return new Response("Akun belum dihubungkan ke kecamatan", { status: 400 })
    posyanduFilter.desa = { kecamatanId: p.kecamatanId }
  }

  if (posyanduId) {
    posyanduFilter.id = posyanduId
  } else if (desaId) {
    posyanduFilter.desaId = desaId
  } else if (kecId) {
    posyanduFilter.desa = { kecamatanId: kecId }
  }

  const balitas = await prisma.balita.findMany({
    where: {
      ...(Object.keys(posyanduFilter).length > 0 ? { posyandu: posyanduFilter } : {}),
      isActive: true,
    },
    include: {
      posyandu: { select: { name: true, desa: { select: { name: true, kecamatan: { select: { name: true } } } } } },
      penimbangans: { where: { bulan, tahun }, take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ posyandu: { name: "asc" } }, { namaBalita: "asc" }],
    take: 10000,
  })

  const headers = [
    "Nama Balita", "Jenis Kelamin", "Tanggal Lahir", "Usia (bln)",
    "Nama Orang Tua", "Alamat",
    "Posyandu", "Desa", "Kecamatan",
    "BB (kg)", "TB (cm)", "LK (cm)", "Status Gizi",
  ]

  const now = new Date()
  const rows = balitas.map((b) => {
    const usia = Math.floor((now.getTime() - new Date(b.tanggalLahir).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    const p = b.penimbangans[0]
    return [
      b.namaBalita,
      b.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
      format(new Date(b.tanggalLahir), "d MMMM yyyy", { locale: localeId }),
      String(usia),
      b.namaOrangTua,
      b.alamat ?? "",
      b.posyandu.name,
      b.posyandu.desa.name,
      b.posyandu.desa.kecamatan.name,
      p?.beratBadan?.toString() ?? "",
      p?.tinggiBadan?.toString() ?? "",
      p?.lingkarKepala?.toString() ?? "",
      p?.statusGizi ?? "",
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const filename = `laporan-balita-${format(new Date(), "yyyy-MM-dd")}.csv`

  return new Response("\ufeff" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
