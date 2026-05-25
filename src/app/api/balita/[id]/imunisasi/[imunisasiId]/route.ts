import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const updateSchema = z.object({
  jenisImunisasi: z.string().min(1).optional(),
  tanggalPemberian: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  usiaAnak: z.string().optional().nullable(),
  namaPetugas: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
})

async function checkImunisasiAccess(balitaId: string, imunisasiId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { posyanduId: true } })
  if (!user?.posyanduId) return null
  const balita = await prisma.balita.findFirst({ where: { id: balitaId, posyanduId: user.posyanduId } })
  if (!balita) return null
  return prisma.imunisasiBalita.findFirst({ where: { id: imunisasiId, balitaId } })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imunisasiId: string }> }
) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id, imunisasiId } = await params
    const existing = await checkImunisasiAccess(id, imunisasiId, user.id)
    if (!existing) return err("Data tidak ditemukan", 404)

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid", 422)

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.tanggalPemberian) data.tanggalPemberian = new Date(parsed.data.tanggalPemberian)

    const updated = await prisma.imunisasiBalita.update({ where: { id: imunisasiId }, data })
    return ok(updated)
  } catch (e) {
    console.error("[PATCH /api/balita/[id]/imunisasi/[imunisasiId]]", e)
    return err("Gagal memperbarui data imunisasi", 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imunisasiId: string }> }
) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id, imunisasiId } = await params
    const existing = await checkImunisasiAccess(id, imunisasiId, user.id)
    if (!existing) return err("Data tidak ditemukan", 404)

    await prisma.imunisasiBalita.delete({ where: { id: imunisasiId } })
    return ok(null, "Data imunisasi berhasil dihapus")
  } catch (e) {
    console.error("[DELETE /api/balita/[id]/imunisasi/[imunisasiId]]", e)
    return err("Gagal menghapus data imunisasi", 500)
  }
}
