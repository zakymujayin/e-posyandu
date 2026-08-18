import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"
import { rateLimit } from "@/lib/cache"
import { createWorkbook, styleHeaderRow, workbookToBuffer } from "@/lib/excel"
import { hitungUsiaAnak } from "@/lib/utils-ats"
import { format } from "date-fns"

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["PETUGAS_DESA", "PETUGAS_KECAMATAN", "ADMIN_DPMD"])
  if (!user) return response!

  const allowed = await rateLimit(`rl:export:ats:${user.id}`, 3, 300)
  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, error: "Terlalu banyak permintaan. Coba lagi dalam 5 menit." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const { searchParams } = new URL(req.url)
  const level = searchParams.get("level") ?? "all"
  const id = searchParams.get("id") ?? ""

  try {
    const where: Record<string, unknown> = { isActive: true }

    if (user.role === "PETUGAS_DESA") {
      if (!user.desaId) return new Response("Akun belum terhubung ke desa", { status: 400 })
      where.desaId = user.desaId
    } else if (user.role === "PETUGAS_KECAMATAN") {
      if (!user.kecamatanId) return new Response("Akun belum terhubung ke kecamatan", { status: 400 })
      where.kecamatanId = user.kecamatanId
    } else {
      if (level === "desa" && id) where.desaId = id
      else if (level === "kecamatan" && id) where.kecamatanId = id
    }

    const records = await prisma.anakTidakSekolah.findMany({
      where,
      include: {
        posyandu: { select: { name: true } },
        desa: { select: { name: true } },
        kecamatan: { select: { name: true } },
      },
      orderBy: [{ desa: { name: "asc" } }, { posyandu: { name: "asc" } }, { namaAnak: "asc" }],
      take: 10000,
    })

    const wb = createWorkbook()
    const ws = wb.addWorksheet("Data ATS")

    const headers = [
      "No", "Nama Anak", "NIK", "Jenis Kelamin", "Tempat Lahir",
      "Tanggal Lahir", "Usia", "Alamat", "RT/RW",
      "Desa/Kelurahan", "Kecamatan", "Kabupaten/Kota",
      "Nama Orang Tua/Wali", "Pekerjaan Orang Tua", "No. HP Orang Tua",
      "Pendidikan Terakhir", "Kelas Terakhir", "Status Sekolah",
      "Alasan Tidak Sekolah", "Tahun Putus Sekolah",
      "Keinginan Kembali Sekolah", "Program yang Dibutuhkan", "Keterangan",
    ]

    ws.columns = headers.map((h, i) => ({
      header: h,
      key: String(i),
      width: i === 0 ? 5 : i <= 4 ? 20 : i === 7 ? 30 : 18,
    }))

    styleHeaderRow(ws.getRow(1))

    records.forEach((r, idx) => {
      const usia = hitungUsiaAnak(new Date(r.tanggalLahir))
      const alasan = r.alasanTidakSekolah === "Lainnya" && r.alasanLainnya
        ? `Lainnya: ${r.alasanLainnya}`
        : r.alasanTidakSekolah

      const program = Array.isArray(r.programDibutuhkan)
        ? (r.programDibutuhkan as string[]).map((p) =>
            p === "Lainnya" && r.programLainnya ? `Lainnya: ${r.programLainnya}` : p
          ).join(", ")
        : ""

      ws.addRow({
        "0": idx + 1,
        "1": r.namaAnak,
        "2": r.nik ?? "",
        "3": r.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
        "4": r.tempatLahir,
        "5": format(new Date(r.tanggalLahir), "dd-MM-yyyy"),
        "6": `${usia} tahun`,
        "7": r.alamat,
        "8": r.rtRw ?? "",
        "9": r.desa.name,
        "10": r.kecamatan.name,
        "11": "Lebak",
        "12": r.namaOrangTua,
        "13": r.pekerjaanOrangTua ?? "",
        "14": r.noHpOrangTua ?? "",
        "15": r.pendidikanTerakhir,
        "16": r.kelasTerakhir ?? "",
        "17": r.statusSekolah,
        "18": alasan,
        "19": r.tahunPutusSekolah?.toString() ?? "",
        "20": r.keinginanSekolah,
        "21": program,
        "22": r.keterangan ?? "",
      })
    })

    const buffer = await workbookToBuffer(wb)
    const filename = `data-ats-${level}-${format(new Date(), "yyyy-MM-dd")}.xlsx`

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    console.error("[GET /api/rekap/ats/export]", e)
    return new Response("Gagal mengekspor data", { status: 500 })
  }
}
