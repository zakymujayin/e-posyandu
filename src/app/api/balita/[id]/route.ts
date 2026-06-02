import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"
import { invalidateRekap, invalidatePattern } from "@/lib/cache"
import type { UserRole } from "@/types/next-auth"

const updateSchema = z.object({
  namaBalita: z.string().min(1).optional(),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
  tanggalLahir: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  namaOrangTua: z.string().min(1).optional(),
  nikOrangTua: z.string().optional().nullable(),
  noHpOrangTua: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  catatanKesehatan: z.string().optional().nullable(),
})

const ALL_ROLES: UserRole[] = ["POSYANDU", "PETUGAS_DESA", "PETUGAS_KECAMATAN", "ADMIN_DPMD"]

async function authorizeBalitaAccess(
  balitaId: string,
  user: { id: string; role: UserRole; posyanduId?: string | null; desaId?: string | null; kecamatanId?: string | null }
): Promise<boolean> {
  if (user.role === "ADMIN_DPMD") {
    const exists = await prisma.balita.findUnique({ where: { id: balitaId }, select: { id: true } })
    return !!exists
  }

  if (user.role === "POSYANDU") {
    if (!user.posyanduId) return false
    const exists = await prisma.balita.findFirst({
      where: { id: balitaId, posyanduId: user.posyanduId },
      select: { id: true },
    })
    return !!exists
  }

  if (user.role === "PETUGAS_DESA") {
    if (!user.desaId) return false
    const exists = await prisma.balita.findFirst({
      where: { id: balitaId, posyandu: { desaId: user.desaId } },
      select: { id: true },
    })
    return !!exists
  }

  if (user.role === "PETUGAS_KECAMATAN") {
    if (!user.kecamatanId) return false
    const exists = await prisma.balita.findFirst({
      where: { id: balitaId, posyandu: { desa: { kecamatanId: user.kecamatanId } } },
      select: { id: true },
    })
    return !!exists
  }

  return false
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(ALL_ROLES)
  if (!user) return response!

  try {
    const { id } = await params

    const authorized = await authorizeBalitaAccess(id, user)
    if (!authorized) return err("Data tidak ditemukan", 404)

    const full = await prisma.balita.findUnique({
      where: { id },
      include: {
        penimbangans: { orderBy: [{ tahun: "asc" }, { bulan: "asc" }] },
        imunisasis: { orderBy: { tanggalPemberian: "asc" } },
        posyandu: {
          select: {
            name: true,
            desa: { select: { name: true, kecamatan: { select: { name: true } } } },
          },
        },
      },
    })

    return ok(full)
  } catch (e) {
    console.error("[GET /api/balita/[id]]", e)
    return err("Gagal mengambil data balita", 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(ALL_ROLES)
  if (!user) return response!

  try {
    const { id } = await params

    const authorized = await authorizeBalitaAccess(id, user)
    if (!authorized) return err("Data tidak ditemukan", 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid", 422)

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.tanggalLahir) data.tanggalLahir = new Date(parsed.data.tanggalLahir)

    const updated = await prisma.balita.update({ where: { id }, data })
    return ok(updated)
  } catch (e) {
    console.error("[PATCH /api/balita/[id]]", e)
    return err("Gagal memperbarui data balita", 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(ALL_ROLES)
  if (!user) return response!

  try {
    const { id } = await params

    const authorized = await authorizeBalitaAccess(id, user)
    if (!authorized) return err("Data tidak ditemukan", 404)

    await prisma.balita.delete({ where: { id } })
    const now = new Date()
    invalidateRekap(now.getMonth() + 1, now.getFullYear()).catch(() => {})
    invalidatePattern("laporan:balita-statistik*")
    return ok(null, "Data balita berhasil dihapus")
  } catch (e) {
    console.error("[DELETE /api/balita/[id]]", e)
    return err("Gagal menghapus data balita", 500)
  }
}
