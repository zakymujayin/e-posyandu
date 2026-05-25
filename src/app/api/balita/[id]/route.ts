import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

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

async function getBalitaForUser(balitaId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { posyanduId: true } })
  if (!user?.posyanduId) return null
  return prisma.balita.findFirst({ where: { id: balitaId, posyanduId: user.posyanduId } })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU", "ADMIN_DPMD"])
  if (!user) return response!

  try {
    const { id } = await params

    if (user.role === "ADMIN_DPMD") {
      const balita = await prisma.balita.findUnique({
        where: { id },
        select: { id: true, posyanduId: true },
      })
      if (!balita) return err("Data tidak ditemukan", 404)
    } else {
      const balita = await getBalitaForUser(id, user.id)
      if (!balita) return err("Data tidak ditemukan", 404)
    }

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
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    const existing = await getBalitaForUser(id, user.id)
    if (!existing) return err("Data tidak ditemukan", 404)

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
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    const existing = await getBalitaForUser(id, user.id)
    if (!existing) return err("Data tidak ditemukan", 404)

    await prisma.balita.delete({ where: { id } })
    return ok(null, "Data balita berhasil dihapus")
  } catch (e) {
    console.error("[DELETE /api/balita/[id]]", e)
    return err("Gagal menghapus data balita", 500)
  }
}
