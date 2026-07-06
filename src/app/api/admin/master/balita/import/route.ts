import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

const MAX_ROWS = 500

interface ImportRow {
  nama_balita: string
  jenis_kelamin: string
  tanggal_lahir: string
  alamat?: string
  tanggal_ukur: string
  bb_u?: string
  tb_u?: string
  bb_tb?: string
}

interface ImportResult {
  row: number
  status: "ok" | "error"
  name: string
  message?: string
  action?: "create" | "skip"
}

function parseDateDDMMYYYY(raw: string): Date | null {
  const parts = raw.trim().split("-")
  if (parts.length !== 3) return null
  const d = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const y = parseInt(parts[2], 10)
  if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) return null
  return new Date(y, m - 1, d)
}

function parseDateYYYYMMDD(raw: string): { bulan: number; tahun: number } | null {
  const parts = raw.trim().split("-")
  if (parts.length !== 3) return null
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(m) || isNaN(y) || m < 1 || m > 12 || y < 2000 || y > 2100) return null
  return { bulan: m, tahun: y }
}

const JK_MAP: Record<string, "LAKI_LAKI" | "PEREMPUAN"> = {
  "L": "LAKI_LAKI",
  "P": "PEREMPUAN",
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const body = await req.json()
    const { posyanduId, rows, previewOnly } = body as {
      posyanduId: string
      rows: ImportRow[]
      previewOnly?: boolean
    }

    if (!posyanduId) return err("posyanduId wajib diisi", 400)
    if (!Array.isArray(rows) || rows.length === 0) return err("Data kosong", 400)
    if (rows.length > MAX_ROWS) return err(`Maksimal ${MAX_ROWS} baris per import`, 400)

    const posyandu = await prisma.posyandu.findUnique({
      where: { id: posyanduId },
      select: { id: true, name: true, desaId: true },
    })
    if (!posyandu) return err("Posyandu tidak ditemukan", 404)

    const posyanduUser = await prisma.user.findFirst({
      where: { posyanduId, role: "POSYANDU", isActive: true },
      select: { id: true },
    })
    if (!posyanduUser) return err("Belum ada akun POSYANDU aktif untuk posyandu ini", 400)

    const existingBalita = await prisma.balita.findMany({
      where: { posyanduId, isActive: true },
      select: { namaBalita: true, tanggalLahir: true },
    })
    const existingSet = new Set(
      existingBalita.map((b) => `${b.namaBalita.toUpperCase()}|${b.tanggalLahir.toISOString().slice(0, 10)}`)
    )

    const results: ImportResult[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1

      const nama = row.nama_balita?.trim()
      if (!nama) { results.push({ row: rowNum, status: "error", name: "", message: "Nama balita wajib diisi" }); continue }

      const jk = JK_MAP[row.jenis_kelamin?.trim().toUpperCase() ?? ""]
      if (!jk) { results.push({ row: rowNum, status: "error", name: nama, message: "Jenis kelamin tidak valid (harus L atau P)" }); continue }

      const tglLahirDate = parseDateDDMMYYYY(row.tanggal_lahir)
      if (!tglLahirDate || isNaN(tglLahirDate.getTime())) {
        results.push({ row: rowNum, status: "error", name: nama, message: "Format tanggal lahir tidak valid (harus DD-MM-YYYY)" })
        continue
      }

      const ukur = parseDateYYYYMMDD(row.tanggal_ukur)
      if (!ukur) {
        results.push({ row: rowNum, status: "error", name: nama, message: "Format tanggal ukur tidak valid (harus YYYY-MM-DD)" })
        continue
      }

      const dedupKey = `${nama.toUpperCase()}|${tglLahirDate.toISOString().slice(0, 10)}`
      if (existingSet.has(dedupKey)) {
        results.push({ row: rowNum, status: "ok", name: nama, action: "skip", message: "Sudah ada — dilewati" })
        continue
      }

      results.push({ row: rowNum, status: "ok", name: nama, action: "create" })
    }

    if (previewOnly) {
      const valid = results.filter(r => r.status === "ok" && r.action !== "skip").length
      const skipped = results.filter(r => r.action === "skip").length
      const errors = results.filter(r => r.status === "error").length
      return ok({ results, valid, skipped, errors })
    }

    let imported = 0
    let skipped = 0

    for (let i = 0; i < rows.length; i++) {
      const r = results[i]
      if (r.status !== "ok") continue
      if (r.action === "skip") { skipped++; continue }

      const row = rows[i]
      const nama = row.nama_balita.trim()
      const jk = JK_MAP[row.jenis_kelamin.trim().toUpperCase()]!
      const tglLahirDate = parseDateDDMMYYYY(row.tanggal_lahir)!
      const ukur = parseDateYYYYMMDD(row.tanggal_ukur)!

      const keluhanParts: string[] = []
      if (row.tb_u?.trim()) keluhanParts.push(`TB/U: ${row.tb_u.trim()}`)
      if (row.bb_tb?.trim()) keluhanParts.push(`BB/TB: ${row.bb_tb.trim()}`)
      const keluhanKondisi = keluhanParts.length > 0 ? keluhanParts.join("; ") : null

      const balita = await prisma.balita.create({
        data: {
          posyanduId,
          posyanduUserId: posyanduUser.id,
          namaBalita: nama,
          jenisKelamin: jk,
          tanggalLahir: tglLahirDate,
          alamat: row.alamat?.trim() || null,
          namaOrangTua: "—",
          tahunPencatatan: ukur.tahun,
          isActive: true,
        },
      })

      existingSet.add(`${nama.toUpperCase()}|${tglLahirDate.toISOString().slice(0, 10)}`)

      await prisma.penimbanganBalita.upsert({
        where: {
          balitaId_bulan_tahun: {
            balitaId: balita.id,
            bulan: ukur.bulan,
            tahun: ukur.tahun,
          },
        },
        create: {
          balitaId: balita.id,
          bulan: ukur.bulan,
          tahun: ukur.tahun,
          statusGizi: row.bb_u?.trim() || null,
          keluhanKondisi,
          namaKader: "IMPORT",
        },
        update: {
          statusGizi: row.bb_u?.trim() || null,
          keluhanKondisi,
        },
      })

      imported++
    }

    invalidatePattern("rekap:*")

    const errors = results.filter(r => r.status === "error").length
    return ok({ results, imported, skipped, errors })

  } catch (e) {
    console.error("[balita-import]", e)
    return err("Gagal memproses import", 500)
  }
}
