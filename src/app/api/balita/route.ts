import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-helpers"

const createSchema = z.object({
  namaBalita: z.string().min(1),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]),
  tanggalLahir: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" }),
  namaOrangTua: z.string().min(1),
  nikOrangTua: z.string().optional().nullable(),
  noHpOrangTua: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  tahunPencatatan: z.number().int().optional(),
  catatanKesehatan: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 10

  const userWithPosyandu = await prisma.user.findUnique({
    where: { id: user.id },
    select: { posyanduId: true },
  })

  if (!userWithPosyandu?.posyanduId) {
    return NextResponse.json({ error: "Posyandu not found" }, { status: 404 })
  }

  const where = {
    posyanduId: userWithPosyandu.posyanduId,
    isActive: true,
    ...(search ? { namaBalita: { contains: search, mode: "insensitive" as const } } : {}),
  }

  const [total, balitas] = await Promise.all([
    prisma.balita.count({ where }),
    prisma.balita.findMany({
      where,
      orderBy: { namaBalita: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        penimbangans: {
          orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
          take: 1,
        },
      },
    }),
  ])

  return NextResponse.json({
    data: balitas,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(["POSYANDU"])
  if (!user) return response!

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const userWithPosyandu = await prisma.user.findUnique({
    where: { id: user.id },
    select: { posyanduId: true },
  })
  if (!userWithPosyandu?.posyanduId) {
    return NextResponse.json({ error: "Posyandu not linked to account" }, { status: 400 })
  }

  const balita = await prisma.balita.create({
    data: {
      ...parsed.data,
      tanggalLahir: new Date(parsed.data.tanggalLahir),
      tahunPencatatan: parsed.data.tahunPencatatan ?? new Date().getFullYear(),
      posyanduId: userWithPosyandu.posyanduId,
      posyanduUserId: user.id,
    },
  })

  return NextResponse.json({ data: balita }, { status: 201 })
}
