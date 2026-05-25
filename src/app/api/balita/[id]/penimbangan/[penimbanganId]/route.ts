import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"

const updateSchema = z.object({
  beratBadan: z.number().positive().optional().nullable(),
  tinggiBadan: z.number().positive().optional().nullable(),
  lingkarKepala: z.number().positive().optional().nullable(),
  statusGizi: z.string().optional().nullable(),
  keluhanKondisi: z.string().optional().nullable(),
  tindakan: z.string().optional().nullable(),
  namaKader: z.string().optional().nullable(),
})

async function checkPenimbanganAccess(balitaId: string, penimbanganId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { posyanduId: true } })
  if (!user?.posyanduId) return null
  const balita = await prisma.balita.findFirst({ where: { id: balitaId, posyanduId: user.posyanduId } })
  if (!balita) return null
  return prisma.penimbanganBalita.findFirst({ where: { id: penimbanganId, balitaId } })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; penimbanganId: string }> }
) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const { id, penimbanganId } = await params
  const existing = await checkPenimbanganAccess(id, penimbanganId, user.id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const updated = await prisma.penimbanganBalita.update({ where: { id: penimbanganId }, data: parsed.data })
  return NextResponse.json({ data: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; penimbanganId: string }> }
) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const { id, penimbanganId } = await params
  const existing = await checkPenimbanganAccess(id, penimbanganId, user.id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.penimbanganBalita.delete({ where: { id: penimbanganId } })
  return NextResponse.json({ success: true })
}
