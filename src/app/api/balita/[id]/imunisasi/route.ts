import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"

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

  const { id } = await params
  if (!(await checkBalitaAccess(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const imunisasis = await prisma.imunisasiBalita.findMany({
    where: { balitaId: id },
    orderBy: { tanggalPemberian: "asc" },
  })

  return NextResponse.json({ data: imunisasis })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const { id } = await params
  if (!(await checkBalitaAccess(id, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const imunisasi = await prisma.imunisasiBalita.create({
    data: { ...parsed.data, tanggalPemberian: new Date(parsed.data.tanggalPemberian), balitaId: id },
  })

  return NextResponse.json({ data: imunisasi }, { status: 201 })
}
