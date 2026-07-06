import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { generateNoRegistrasi } from "@/lib/no-registrasi"
import { invalidatePattern } from "@/lib/cache"
import bcrypt from "bcryptjs"

const DEFAULT_PASSWORD = "posyandu123"
const MAX_ROWS = 700

interface ImportRow {
  nama_posyandu: string
  alamat?: string
  desa: string
  kecamatan: string
}

interface ImportResult {
  row: number
  status: "ok" | "error"
  name: string
  message?: string
}

function generateUsername(nama: string): string {
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
}

export async function POST(req: Request) {
  const { user, response } = await requireAuth(["ADMIN_DPMD"])
  if (!user) return response!

  try {
    const body = await req.json()
    const { rows } = body as { rows: ImportRow[]; previewOnly?: boolean }

    if (!Array.isArray(rows) || rows.length === 0) return err("Data kosong", 400)
    if (rows.length > MAX_ROWS) return err(`Maksimal ${MAX_ROWS} baris per import`, 400)

    const results: ImportResult[] = []

    const existingUsernames = new Set(
      (await prisma.user.findMany({ select: { username: true } }))
        .map(u => u.username)
        .filter((u): u is string => !!u)
    )

    const allDesa = await prisma.desa.findMany({
      select: { id: true, name: true, kecamatanId: true, kecamatan: { select: { id: true, name: true } } }
    })

    const desaByKec = new Map<string, (typeof allDesa)[number]>()
    const desaByNameOnly = new Map<string, (typeof allDesa)[number][]>()
    for (const d of allDesa) {
      const compositeKey = d.name.toUpperCase() + "|" + d.kecamatan.name.toUpperCase()
      desaByKec.set(compositeKey, d)
      const nameKey = d.name.toUpperCase()
      if (!desaByNameOnly.has(nameKey)) desaByNameOnly.set(nameKey, [])
      desaByNameOnly.get(nameKey)!.push(d)
    }

    const lookupDesa = (desaName: string, kecName: string): (typeof allDesa)[number] | null => {
      const desaKey = desaName.trim().toUpperCase()
      const kecKey = kecName.trim().toUpperCase()
      const compositeResult = desaByKec.get(desaKey + "|" + kecKey)
      if (compositeResult) return compositeResult
      const fallback = desaByNameOnly.get(desaKey)
      if (!fallback) return null
      if (fallback.length === 1) return fallback[0]
      return null
    }

    const seenUsernames = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1
      const nama = row.nama_posyandu?.trim() || ""

      if (!nama) { results.push({ row: rowNum, status: "error", name: "", message: "Nama posyandu wajib diisi" }); continue }
      if (!row.desa?.trim()) { results.push({ row: rowNum, status: "error", name: nama, message: "Desa wajib diisi" }); continue }
      if (!row.kecamatan?.trim()) { results.push({ row: rowNum, status: "error", name: nama, message: "Kecamatan wajib diisi" }); continue }

      const desa = lookupDesa(row.desa, row.kecamatan)
      if (!desa) { results.push({ row: rowNum, status: "error", name: nama, message: `Desa "${row.desa}" / Kec "${row.kecamatan}" tidak ditemukan` }); continue }

      const username = generateUsername(nama)
      if (seenUsernames.has(username)) {
        const alt = `${username}${i + 1}`
        seenUsernames.add(alt)
        if (existingUsernames.has(alt)) {
          results.push({ row: rowNum, status: "error", name: nama, message: `Username "${alt}" sudah ada di sistem` })
          continue
        }
      } else {
        seenUsernames.add(username)
        if (existingUsernames.has(username)) {
          results.push({ row: rowNum, status: "error", name: nama, message: `Username "${username}" sudah ada di sistem` })
          continue
        }
      }

      results.push({ row: rowNum, status: "ok", name: nama })
    }

    if (body.previewOnly) {
      const valid = results.filter(r => r.status === "ok").length
      const errors = results.filter(r => r.status === "error").length
      return ok({ results, valid, errors })
    }

    let imported = 0
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12)

    for (let i = 0; i < rows.length; i++) {
      if (results[i].status !== "ok") continue
      const row = rows[i]
      const nama = row.nama_posyandu.trim()
      const desaKey = row.desa.trim().toUpperCase()
      const desa = lookupDesa(row.desa, row.kecamatan)!
      const kecamatanId = desa.kecamatanId

      let username = generateUsername(nama)
      if (existingUsernames.has(username) || seenUsernames.has(username + i)) {
        username = `${username}${i + 1}`
      }
      existingUsernames.add(username)

      const code = `POS-${desa.id.slice(0, 8)}-${Date.now().toString(36)}-${i}`

      const posyandu = await prisma.posyandu.create({
        data: {
          name: nama,
          desaId: desa.id,
          code,
          isActive: true,
        },
      })

      const noReg = await generateNoRegistrasi(kecamatanId)

      await prisma.user.create({
        data: {
          name: nama,
          username,
          email: `${username}@posyandu.lebak.go.id`,
          password: hashedPassword,
          role: "POSYANDU",
          posyanduId: posyandu.id,
          desaId: desa.id,
          kecamatanId,
          noRegistrasi: noReg,
          isActive: true,
        },
      })

      imported++
    }

    invalidatePattern("master:posyandu*")
    invalidatePattern("master:users*")

    const errors = results.filter(r => r.status === "error").length
    return ok({ results, imported, errors })

  } catch (e) {
    console.error(e)
    return err("Gagal memproses import", 500)
  }
}
