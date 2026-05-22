import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import bcrypt from "bcryptjs"

const VALID_ROLES = ["KADER", "PETUGAS_DESA", "PETUGAS_KECAMATAN", "PETUGAS_OPD"] as const
type ImportRole = (typeof VALID_ROLES)[number]

interface CsvRow {
  nama: string
  email: string
  password: string
  posyandu_id?: string
  desa_id?: string
  kecamatan_id?: string
  opd_id?: string
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const body = await req.json()
    const { role, rows } = body as { role: ImportRole; rows: CsvRow[] }

    if (!VALID_ROLES.includes(role)) return err("Role tidak valid", 400)
    if (!Array.isArray(rows) || rows.length === 0) return err("Data kosong", 400)
    if (rows.length > 200) return err("Maksimal 200 baris per import", 400)

    const results: { row: number; status: "ok" | "error"; email: string; message?: string }[] = []

    // Ambil semua email yang sudah ada di DB
    const existingEmails = new Set(
      (await prisma.user.findMany({ select: { email: true } })).map((u) => u.email)
    )
    // Track email dalam file (untuk deteksi duplikat dalam CSV)
    const seenEmails = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1

      // Validasi field wajib
      if (!row.nama?.trim()) {
        results.push({ row: rowNum, status: "error", email: row.email ?? "", message: "Nama wajib diisi" })
        continue
      }
      if (!row.email?.trim()) {
        results.push({ row: rowNum, status: "error", email: "", message: "Email wajib diisi" })
        continue
      }
      if (!row.password?.trim()) {
        results.push({ row: rowNum, status: "error", email: row.email, message: "Password wajib diisi" })
        continue
      }

      const email = row.email.trim().toLowerCase()

      // Validasi format email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({ row: rowNum, status: "error", email, message: "Format email tidak valid" })
        continue
      }

      // Cek duplikat dalam file
      if (seenEmails.has(email)) {
        results.push({ row: rowNum, status: "error", email, message: "Email duplikat dalam file CSV" })
        continue
      }
      seenEmails.add(email)

      // Cek duplikat di database
      if (existingEmails.has(email)) {
        results.push({ row: rowNum, status: "error", email, message: "Email sudah terdaftar di sistem" })
        continue
      }

      // Validasi ID referensi sesuai role
      let refError: string | null = null
      if (role === "KADER") {
        if (!row.posyandu_id) { refError = "posyandu_id wajib untuk KADER" }
        else {
          const found = await prisma.posyandu.findUnique({ where: { id: row.posyandu_id } })
          if (!found) refError = `posyandu_id "${row.posyandu_id}" tidak ditemukan`
        }
      } else if (role === "PETUGAS_DESA") {
        if (!row.desa_id) { refError = "desa_id wajib untuk PETUGAS_DESA" }
        else {
          const found = await prisma.desa.findUnique({ where: { id: row.desa_id } })
          if (!found) refError = `desa_id "${row.desa_id}" tidak ditemukan`
        }
      } else if (role === "PETUGAS_KECAMATAN") {
        if (!row.kecamatan_id) { refError = "kecamatan_id wajib untuk PETUGAS_KECAMATAN" }
        else {
          const found = await prisma.kecamatan.findUnique({ where: { id: row.kecamatan_id } })
          if (!found) refError = `kecamatan_id "${row.kecamatan_id}" tidak ditemukan`
        }
      } else if (role === "PETUGAS_OPD") {
        if (!row.opd_id) { refError = "opd_id wajib untuk PETUGAS_OPD" }
        else {
          const found = await prisma.opd.findUnique({ where: { id: row.opd_id } })
          if (!found) refError = `opd_id "${row.opd_id}" tidak ditemukan`
        }
      }

      if (refError) {
        results.push({ row: rowNum, status: "error", email, message: refError })
        continue
      }

      results.push({ row: rowNum, status: "ok", email })
    }

    // Hitung statistik
    const validRows = results.filter((r) => r.status === "ok")
    const errorRows = results.filter((r) => r.status === "error")

    // Jika hanya preview, kembalikan hasil tanpa simpan
    if (body.previewOnly) {
      return ok({ results, valid: validRows.length, errors: errorRows.length })
    }

    // Import baris yang valid
    let imported = 0
    for (let i = 0; i < rows.length; i++) {
      if (results[i].status !== "ok") continue
      const row = rows[i]
      const hashed = await bcrypt.hash(row.password.trim(), 12)
      await prisma.user.create({
        data: {
          name: row.nama.trim(),
          email: row.email.trim().toLowerCase(),
          password: hashed,
          role,
          ...(role === "KADER" && { posyanduId: row.posyandu_id }),
          ...(role === "PETUGAS_DESA" && { desaId: row.desa_id }),
          ...(role === "PETUGAS_KECAMATAN" && { kecamatanId: row.kecamatan_id }),
          ...(role === "PETUGAS_OPD" && { opdId: row.opd_id }),
        },
      })
      imported++
    }

    return ok({
      results,
      imported,
      errors: errorRows.length,
    })
  } catch (e) {
    console.error(e)
    return err("Gagal memproses import", 500)
  }
}
