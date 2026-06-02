import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

interface CsvRow {
  nama: string
  kode: string
  prefix_tiket: string
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

    const existingCodes = new Set(
      (await prisma.opd.findMany({ select: { code: true } })).map((o) => o.code)
    )
    const seenCodes = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1
      const name = row.nama?.trim() || ""

      if (!name) {
        results.push({ row: rowNum, status: "error", name, message: "Nama wajib diisi" })
        continue
      }
      if (!row.kode?.trim()) {
        results.push({ row: rowNum, status: "error", name, message: "Kode wajib diisi" })
        continue
      }
      if (!row.prefix_tiket?.trim()) {
        results.push({ row: rowNum, status: "error", name, message: "Prefix tiket wajib diisi" })
        continue
      }

      const code = row.kode.trim().toUpperCase()

      if (seenCodes.has(code)) {
        results.push({ row: rowNum, status: "error", name, message: `Kode "${code}" duplikat dalam file CSV` })
        continue
      }
      seenCodes.add(code)

      if (existingCodes.has(code)) {
        results.push({ row: rowNum, status: "error", name, message: `Kode "${code}" sudah terdaftar di sistem` })
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
      await prisma.opd.create({
        data: {
          name: row.nama.trim(),
          code: row.kode.trim().toUpperCase(),
          tiketPrefix: row.prefix_tiket.trim().toUpperCase(),
          sortOrder: parseInt(row.urutan || "0", 10),
        },
      })
      imported++
    }

    invalidatePattern("master:opd")
    const errors = results.filter((r) => r.status === "error").length
    return ok({ results, imported, errors })
  } catch (e) {
    console.error(e)
    return err("Gagal memproses import", 500)
  }
}
