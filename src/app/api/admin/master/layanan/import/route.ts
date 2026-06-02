import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

interface CsvRow {
  nama: string
  opd_kode: string
  urutan: string
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const body = await req.json()
    const { rows } = body as { rows: CsvRow[] }

    if (!Array.isArray(rows) || rows.length === 0) return err("Data kosong", 400)
    if (rows.length > 200) return err("Maksimal 200 baris per import", 400)

    const results: { row: number; status: "ok" | "error"; name: string; message?: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1
      const name = row.nama?.trim() || ""

      if (!name) {
        results.push({ row: rowNum, status: "error", name, message: "Nama wajib diisi" })
        continue
      }
      if (!row.opd_kode?.trim()) {
        results.push({ row: rowNum, status: "error", name, message: "opd_kode wajib diisi" })
        continue
      }

      const opd = await prisma.opd.findFirst({ where: { code: row.opd_kode.trim().toUpperCase() } })
      if (!opd) {
        results.push({ row: rowNum, status: "error", name, message: `opd_kode "${row.opd_kode}" tidak ditemukan` })
        continue
      }

      results.push({ row: rowNum, status: "ok", name })
    }

    if (body.previewOnly) {
      const valid = results.filter((r) => r.status === "ok").length
      const errors = results.filter((r) => r.status === "error").length
      return ok({ results, valid, errors })
    }

    let imported = 0
    for (let i = 0; i < rows.length; i++) {
      if (results[i].status !== "ok") continue
      const row = rows[i]
      const opd = await prisma.opd.findFirst({ where: { code: row.opd_kode.trim().toUpperCase() } })
      if (!opd) continue
      await prisma.layananJenis.create({
        data: {
          name: row.nama.trim(),
          opdId: opd.id,
          sortOrder: parseInt(row.urutan || "0", 10),
        },
      })
      imported++
    }

    invalidatePattern("master:layanan*")
    const errors = results.filter((r) => r.status === "error").length
    return ok({ results, imported, errors })
  } catch (e) {
    console.error(e)
    return err("Gagal memproses import", 500)
  }
}
