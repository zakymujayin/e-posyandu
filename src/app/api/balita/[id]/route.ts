import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"

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
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const { id } = await params
  const balita = await getBalitaForUser(id, user.id)
  if (!balita) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const full = await prisma.balita.findUnique({
    where: { id },
    include: {
      penimbangans: { orderBy: [{ tahun: "asc" }, { bulan: "asc" }] },
      imunisasis: { orderBy: { tanggalPemberian: "asc" } },
    },
  })

  return NextResponse.json({ data: full })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const { id } = await params
  const existing = await getBalitaForUser(id, user.id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.tanggalLahir) data.tanggalLahir = new Date(parsed.data.tanggalLahir)

  const updated = await prisma.balita.update({ where: { id }, data })
  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const { id } = await params
  const existing = await getBalitaForUser(id, user.id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.balita.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
