import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth, ok, err } from "@/lib/api-helpers"

const createSchema = z.object({
  jenisImunisasi: z.string().min(1),
  tanggalPemberian: z.string().refine((v) => !isNaN(Date.parse(v))),
  usiaAnak: z.string().optional().nullable(),
  namaPetugas: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
})

async function checkBalitaAccess(balitaId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { posyanduId: true } })
  if (!user?.posyanduId) return false
  const balita = await prisma.balita.findFirst({ where: { id: balitaId, posyanduId: user.posyanduId } })
  return !!balita
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    if (!(await checkBalitaAccess(id, user.id))) {
      return err("Data tidak ditemukan", 404)
    }

    const imunisasis = await prisma.imunisasiBalita.findMany({
      where: { balitaId: id },
      orderBy: { tanggalPemberian: "asc" },
    })

    return ok(imunisasis)
  } catch (e) {
    console.error("[GET /api/balita/[id]/imunisasi]", e)
    return err("Gagal mengambil data imunisasi", 500)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  try {
    const { id } = await params
    if (!(await checkBalitaAccess(id, user.id))) {
      return err("Data tidak ditemukan", 404)
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Data tidak valid", 422)

    const imunisasi = await prisma.imunisasiBalita.create({
      data: { ...parsed.data, tanggalPemberian: new Date(parsed.data.tanggalPemberian), balitaId: id },
    })

    return ok(imunisasi, "Data imunisasi berhasil disimpan")
  } catch (e) {
    console.error("[POST /api/balita/[id]/imunisasi]", e)
    return err("Gagal menyimpan data imunisasi", 500)
  }
}
