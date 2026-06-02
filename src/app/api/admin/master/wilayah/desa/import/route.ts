import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidatePattern } from "@/lib/cache"

interface CsvRow {
  nama: string
  kode: string
  kecamatan_kode: string
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
      (await prisma.desa.findMany({ select: { code: true } })).map((d) => d.code)
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
      if (!row.kecamatan_kode?.trim()) {
        results.push({ row: rowNum, status: "error", name, message: "kecamatan_kode wajib diisi" })
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

      const kecamatan = await prisma.kecamatan.findFirst({ where: { code: row.kecamatan_kode.trim().toUpperCase() } })
      if (!kecamatan) {
        results.push({ row: rowNum, status: "error", name, message: `kecamatan_kode "${row.kecamatan_kode}" tidak ditemukan` })
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
      const kecamatan = await prisma.kecamatan.findFirst({ where: { code: row.kecamatan_kode.trim().toUpperCase() } })
      if (!kecamatan) continue
      await prisma.desa.create({
        data: {
          name: row.nama.trim(),
          code: row.kode.trim().toUpperCase(),
          kecamatanId: kecamatan.id,
        },
      })
      imported++
    }

    invalidatePattern("master:desa")
    const errors = results.filter((r) => r.status === "error").length
    return ok({ results, imported, errors })
  } catch (e) {
    console.error(e)
    return err("Gagal memproses import", 500)
  }
}
