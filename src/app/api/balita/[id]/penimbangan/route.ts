import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"

const createSchema = z.object({
  bulan: z.number().int().min(1).max(12),
  tahun: z.number().int().min(2000),
  beratBadan: z.number().positive().optional().nullable(),
  tinggiBadan: z.number().positive().optional().nullable(),
  lingkarKepala: z.number().positive().optional().nullable(),
  statusGizi: z.string().optional().nullable(),
  keluhanKondisi: z.string().optional().nullable(),
  tindakan: z.string().optional().nullable(),
  namaKader: z.string().optional().nullable(),
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

  const { searchParams } = new URL(req.url)
  const tahun = searchParams.get("tahun") ? parseInt(searchParams.get("tahun")!) : new Date().getFullYear()

  const penimbangans = await prisma.penimbanganBalita.findMany({
    where: { balitaId: id, tahun },
    orderBy: { bulan: "asc" },
  })

  return NextResponse.json({ data: penimbangans })
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

  const now = new Date()
  if (
    parsed.data.tahun > now.getFullYear() ||
    (parsed.data.tahun === now.getFullYear() && parsed.data.bulan > now.getMonth() + 1)
  ) {
    return NextResponse.json({ error: "Tidak dapat mencatat penimbangan di bulan mendatang" }, { status: 422 })
  }

  const existing = await prisma.penimbanganBalita.findUnique({
    where: { balitaId_bulan_tahun: { balitaId: id, bulan: parsed.data.bulan, tahun: parsed.data.tahun } },
  })
  if (existing) {
    return NextResponse.json({ error: "Data penimbangan bulan ini sudah ada" }, { status: 409 })
  }

  const penimbangan = await prisma.penimbanganBalita.create({
    data: { ...parsed.data, balitaId: id },
  })

  return NextResponse.json({ data: penimbangan }, { status: 201 })
}
